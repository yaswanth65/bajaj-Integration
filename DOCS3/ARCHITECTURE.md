# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Mobile App (Expo/React Native)            │
│  src/roles/lc/   src/roles/branchManager/   src/roles/rm/      │
│  src/context/AppContext.tsx  (API orchestration + state)       │
│  src/services/api/client.ts   (Axios instance)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP JSON + FormData
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express.js + TypeScript)           │
│  src/routes/index.ts  →  role-specific + entity routes          │
│  src/controllers/     →  request handling + Prisma queries      │
│  src/middlewares/      →  auth, security, cron auth              │
│  src/lib/              →  Prisma client + stats helpers          │
│  src/services/         →  Cloudinary upload + push notifications│
└──────────────────────────┬──────────────────────────────────────┘
                           │ Prisma ORM
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL   │
                    └──────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js + Express.js + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma (generated client) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File upload | Multer → Cloudinary |
| Push notifications | Expo Push API (via expo-server-sdk) |
| Mobile framework | Expo SDK 56 + React Native 0.81 |
| Mobile navigation | React Navigation 7 (bottom tabs + stack) |
| Mobile state | React Context + useReducer (no Redux/Zustand) |
| HTTP client (mobile) | Axios |

## Role-Based Access Control

Each request carries a JWT with `{ id, name, email, role, branchId, branchScope }`.

```
┌──────────────┬───────────────────┬──────────────────────────────┐
│ Role         │ Scope             │ View Limitations             │
├──────────────┼───────────────────┼──────────────────────────────┤
│ lc           │ Single branch     │ branchId only                │
│ branchManager│ Multi-branch      │ branchScope[] array          │
│ rm           │ Global            │ No filter                    │
└──────────────┴───────────────────┴──────────────────────────────┘
```

Every controller checks `req.user.role` and applies scope filters:

- **LC** → `where: { branchId: user.branchId }`
- **BM** → `where: { branchId: { in: user.branchScope } }`
- **RM** → no branch filter

## Key Architectural Decisions

### 1. Bundle Endpoints over Generic Lists
Generic `GET /api/tasks`, `GET /api/attendance`, `GET /api/approvals` have been **removed**. Each screen uses a single role-specific bundle endpoint (`GET /lc/dashboard`, `GET /bm/attendance`, etc.) that returns exactly the data needed with lean, pre-selected fields.

### 2. Soft-Delete Instead of Hard DELETE
All destructive operations are soft:

| Entity | DELETE Behavior |
|---|---|
| User (`DELETE /users/:id`) | Sets `status = "Inactive"` |
| Appliance (`PATCH /appliances/:id/decommission`) | Sets `status = "Down"` |
| Complaint (`DELETE /complaints/:id`) | Sets `status = "Rejected"` |
| Task (`PATCH /bm/tasks/:id/archive`) | Sets `status = "Revoked"` |
| Visit (`PATCH /bm/visits/:id/cancel`) | Sets `status = "Cancelled"` |

### 3. Stats Recalculation
Branch and user statistics are computed reactively:

- `recalcBranchStats(branchId)` — runs as fire-and-forget background call after complaint, task, and attendance mutations
- `recalcUserStats(userId)` — updates `attendancePct`, `tasksClosed`, `proofRate`, `escalations`

**Branch health formula:**  
`health = avgApplianceHealth × 0.4 + (100 − openIssues × 3) × 0.3 + (100 − criticalAlerts × 10) × 0.3`

### 4. Timezone — Asia/Kolkata (IST)
All date/time operations use IST. Helpers are defined per-controller or in `src/lib/stats.ts`:
- `getTodayIST()` → `"YYYY-MM-DD"` via `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" })`
- `getTimeStr()` → `"HH:MM"`  via `Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata" })`
- Cron uses shifted UTC dates: `Date.UTC(year, month, day) - 5.5h`

### 5. Dynamic Age/Time Fields
`Approval.age` and `Notification.time` store `"Just now"` as DB defaults but are overridden at the response layer using `relativeTime(createdAt)`:
```
< 1 min → "Just now"
< 1 hr  → "X mins ago"
< 24 hr → "X hours ago"
< 30 d  → "X days ago"
else    → "X months ago"
```

### 6. Frontend Field Aliasing
Prisma fields use `*Id` suffixes (e.g. `assignedToId`). The API response aliases these for mobile compatibility:
```
assignedToId → assignedTo
assignedById → assignedBy
completedById → completedBy
reportedById → reportedBy
requestedById → requestedBy
```

### 7. Notifications Scope
Notifications have a `scope` field (RoleId[]) that determines which roles see them. The mobile app filters: `notifications.filter(n => n.scope.includes(state.role))`.

## Key Data Flows

### Attendance Marking Flow
1. LC submits `POST /lc/attendance` with `{ checkIn, weeklyTasks[] }`
2. Backend upserts `AttendanceLog` (unique on `userId` + `date`)
3. If LC and `weeklyTasks` provided: clears old plan items, creates new `WeeklyTaskPlanItem` records + auto-generates `Task` records for each item
4. Fires `recalcBranchStats` + `recalcUserStats` in background

### Task Completion Flow
1. LC submits proof via `POST /tasks/:id/submit-proof` (multipart form with image file)
2. Image uploaded to Cloudinary, `proofUrl` saved
3. Task status → `Completed`, `completedById`/`completedAt` set
4. User `tasksClosed` incremented
5. Background: `recalcBranchStats` + `recalcUserStats`

### Approval Escalation Flow
1. LC/BM creates approval via `POST /approvals`
2. BM approves via `POST /approvals/:id/approve`
3. If amount ≤ 25000 → final approval, budget deducted
4. If amount > 25000 → escalated to RM stage (status stays Pending)
5. RM approves → final approval, budget deducted

### Complaint Lifecycle
```
Pending ──→ Escalated ──→ Resolved
  │            │              
  └── Rejected ←──────────────┘  (via BM reject or deleteComplaint)
```
