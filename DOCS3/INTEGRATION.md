# Mobile App ↔ Backend Integration

## API Client

**File:** `mobile-app/src/services/api/client.ts`

```typescript
const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.29.113:5000/api",
  timeout: 15000,
});
```

The base URL is configured via `EXPO_PUBLIC_API_URL` environment variable at build/run time.

## Authentication Flow

1. **Login:** `POST /auth/login` with `{ email, password }` returns `{ token, user }`
2. **Token stored** in `expo-secure-store` (or `AsyncStorage` on web) as `auth_token` and `user_profile`
3. **Bearer token** attached to all subsequent requests via `apiClient.defaults.headers.common["Authorization"]`
4. **Session restore** on app mount: reads saved token + profile from secure storage
5. **Logout:** deletes saved token/profile, clears Authorization header

## Data Refresh Strategy

The `AppContext.tsx` `refreshData()` function is the central data-fetching mechanism:

### Triggering
- Called on mount when `token` is set
- Called after every mutation (create, update, delete, mark attendance, etc.)

### Endpoint Selection
`getEndpointsForPage(page, role)` maps each screen + role to one or more API endpoints:

| Screen | LC Endpoints | BM Endpoints | RM Endpoints |
|---|---|---|---|
| home/dashboard | `/lc/dashboard`, `/notifications` | `/bm/dashboard`, `/notifications` | `/rm/dashboard`, `/notifications` |
| tasks | `/lc/tasks` | `/bm/tasks` | `/rm/tasks` |
| complaints | `/complaints`, `/branches` | `/bm/complaints`, `/branches` | `/complaints`, `/branches` |
| branch | `/lc/dashboard` | `/bm/branches` | `/branches`, `/users`, `/appliances` |
| approvals | — | `/bm/approvals` | `/rm/finance` |
| finance | — | — | `/rm/finance` |
| visits | — | `/bm/visits` | `/visits`, `/branches` |
| attendance | `/lc/attendance/calendar` | `/bm/attendance` | `/rm/attendance` |
| users | — | — | `/rm/users` |
| notifications | `/notifications`, `/branches` | `/notifications`, `/branches` | `/notifications`, `/branches` |

### Response Handling
`refreshData()` parses each endpoint's response and dispatches to the appropriate state setter:

```typescript
// Dashboard endpoints → setBranches, setTasks, setComplaints, setAppliances, setAttendanceLog
// Task endpoints → setTasks
// Approval endpoints → setApprovals
// Attendance endpoints → setAttendanceLog
// Notifications → setNotifications
```

#### LC Dashboard Specific
```typescript
if (endpoint === "/lc/dashboard") {
  const data = res.data;
  if (data.branch) setBranches([data.branch]);      // single branch wrapped in array
  if (data.tasks) setTasks(data.tasks.map(mapTask));  // mapTask aliases Id fields
  if (data.complaints) setComplaints(data.complaints.map(mapComplaint));
  if (data.appliances) setAppliances(data.appliances);
  if (data.todayAttendance) setAttendanceLog([mapAttendance(data.todayAttendance, 0)]);
}
```

### Field Mapping Helpers

#### `mapTask(task)`
```typescript
{
  ...task,
  assignedTo: task.assignedToId || task.assignedTo?.id || task.assignedTo,
  assignedBy: task.assignedById || task.assignedBy?.id || task.assignedBy,
  completedBy: task.completedById || task.completedBy?.id || task.completedBy,
}
```

#### `mapComplaint(complaint)`
```typescript
{
  ...complaint,
  reportedBy: complaint.reportedById || complaint.reportedBy,
  timeline: JSON.parse(complaint.timeline) || complaint.timeline || [],
}
```
Handles both stringified JSON arrays and native Prisma arrays.

#### `mapAttendance(item, index)`
```typescript
{
  id: item.id || index + 1,
  userId: item.userId || currentUser.id,
  date: item.date,
  status: item.status,
  checkIn: item.checkIn,
  checkOut: item.checkOut,
  location: item.location || "Inside geo fence - 40m",
  proof: item.proof || "Geo + selfie verified",
  deviation: item.deviation || "No",
  weeklyTasks: item.weeklyTasks || [],
}
```

## Scope Filtering (Mobile Side)

Even though the backend already scopes data by role, the mobile app also maintains client-side scope filtering as a safety net:

```typescript
// Derived via useMemo
const scopedBranchIds = currentUser.role === "rm" 
  ? branches.map(b => b.id)
  : currentUser.role === "branchManager"
    ? currentUser.branchScope 
    : [currentUser.branchId];  // lc

const scopedTasks = tasks.filter(t => scopedBranchIds.includes(t.branchId));
const scopedComplaints = complaints.filter(c => scopedBranchIds.includes(c.branchId));
// ... same for approvals, appliances, users, attendance
```

## State Architecture

```
<AppProvider>
  ↓
  useReducer → state (role, page, tabs, modal, toast, search, today)
  |
  useState  → data arrays (branches, users, tasks, complaints, appliances, 
  |            approvals, visits, notifications, attendanceLog)
  |          → auth (token, currentUser, loading)
  |          → settings, auditLog, alertStates
  |
  useMemo   → scoped* arrays (filtered by role+branch)
  |
  useCallback → API methods + audit trail + toast
  ↓
<AppContext.Provider value={...}>
```

## Mutation Pattern

Every mutation follows the same pattern:
1. Call `apiClient.<method>(endpoint, body?)`
2. On success: call `addAuditEntry(text, icon, color)` for local audit trail
3. Call `showToast(message)` to user
4. Call `await refreshData()` to re-fetch all data

```typescript
const markTaskDone = useCallback(async (taskId) => {
  try {
    await apiClient.post(`/tasks/${taskId}/complete`, { checklistDone: 1 });
    addAuditEntry(`Task marked complete by ${currentUser.name}`, "CheckCircle", "#10B981");
    showToast("Task completed");
    await refreshData();
  } catch (e) {
    showToast("Failed to mark task complete");
  }
}, [currentUser, addAuditEntry, showToast, refreshData]);
```

## Shared Type Definitions

**File:** `mobile-app/src/types/domain.ts`

All domain types mirror the Prisma models. Key types:

```typescript
export type RoleId = "lc" | "branchManager" | "rm";
export type TaskStatus = "Pending" | "In Progress" | "Completed" | "Revoked";
export type ComplaintStatus = "Pending" | "Escalated" | "Resolved" | "Rejected";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";
export type ApplianceStatus = "Operational" | "At Risk" | "Critical" | "Down";
export type VisitStatus = "Scheduled" | "Escalated" | "Completed" | "Cancelled";
export type AttStatus = "Present" | "Late" | "Absent";
export type Priority = "Critical" | "High" | "Medium" | "Low";
```

## Badge Styling Map

**File:** `mobile-app/src/theme/styleMaps.ts`

The `toneClass(type)` function maps status/priority strings to color schemes:

| Value | Background | Text | Border |
|---|---|---|---|
| Critical/Error | `rgba(239,68,68,0.1)` | `#EF4444` | `rgba(239,68,68,0.2)` |
| High/Medium/Warning | `rgba(245,158,11,0.1)` | `#F59E0B` | `rgba(245,158,11,0.2)` |
| Low/Rejected/Closed | `#F1F5F9` | `#64748B` | `#E2E8F0` |
| Pending | `rgba(245,158,11,0.1)` | `#F59E0B` | `rgba(245,158,11,0.2)` |
| Completed/Resolved/Approved/Success | `rgba(18,183,106,0.1)` | `#12B76A` | `rgba(18,183,106,0.2)` |
| Escalated/Revoked/Down | `rgba(239,68,68,0.1)` | `#EF4444` | `rgba(239,68,68,0.2)` |
| Operational | `rgba(18,183,106,0.1)` | `#12B76A` | `rgba(18,183,106,0.2)` |
| At Risk/AtRisk | `rgba(245,158,11,0.1)` | `#F59E0B` | `rgba(245,158,11,0.2)` |
| Scheduled/Info | `rgba(0,141,210,0.1)` | `#008DD2` | `rgba(0,141,210,0.2)` |

## Important Compatibility Notes

### 1. Appliance Status: `AtRisk` vs `At Risk`
Prisma enum uses `AtRisk` (no space). The mobile code checks for both `"AtRisk"` and `"At Risk"` for backward compatibility.

### 2. `time` and `age` Fields
`Notification.time` and `Approval.age` are computed server-side as `relativeTime(createdAt)` and returned as strings. The mobile app displays them directly.

### 3. Complaint Timeline
Backend stores timeline as a JSON array of strings (`["HH:MM - Event text", ...]`). The mobile `mapComplaint` helper parses this into a native array.

### 4. Soft-Delete Endpoints
DELETE endpoints still accept HTTP DELETE but perform soft-delete internally. The mobile app uses `apiClient.delete()` and the toasts say "deleted" but the actual DB operation is a status change.

### 5. IST Date Format
All date strings use `YYYY-MM-DD` format (en-CA locale). The mobile app uses the same locale for `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" })` to stay consistent.

## File Map

```
backend/
├── prisma/schema.prisma           ← Source of truth for all models
├── src/
│   ├── routes/index.ts            ← Route mounting
│   ├── routes/auth.routes.ts
│   ├── routes/role/lc.routes.ts   ← LC endpoints
│   ├── routes/role/bm.routes.ts   ← BM endpoints
│   ├── routes/role/rm.routes.ts   ← RM endpoints
│   ├── routes/task.routes.ts
│   ├── routes/complaint.routes.ts
│   ├── routes/approval.routes.ts
│   ├── routes/attendance.routes.ts
│   ├── routes/visit.routes.ts
│   ├── routes/notification.routes.ts
│   ├── routes/user.routes.ts
│   ├── routes/branch.routes.ts
│   ├── routes/appliance.routes.ts
│   ├── routes/cron.routes.ts
│   ├── controllers/              ← Backend business logic
│   │   ├── auth.controller.ts
│   │   ├── role/lc.controller.ts
│   │   ├── role/bm.controller.ts
│   │   ├── role/rm.controller.ts
│   │   ├── task.controller.ts
│   │   ├── complaint.controller.ts
│   │   ├── approval.controller.ts
│   │   ├── attendance.controller.ts
│   │   ├── visit.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── user.controller.ts
│   │   ├── branch.controller.ts
│   │   ├── appliance.controller.ts
│   │   └── cron.controller.ts
│   ├── lib/
│   │   ├── prisma.ts              ← Prisma client instance
│   │   └── stats.ts               ← recalcBranchStats, recalcUserStats, relativeTime
│   ├── middlewares/
│   │   ├── auth.middleware.ts      ← JWT verification
│   │   ├── security.middleware.ts  ← Rate limiter + security headers
│   │   └── cron.middleware.ts      ← Cron secret auth
│   └── services/
│       ├── cloudinary.service.ts
│       └── notification.service.ts

mobile-app/
└── src/
    ├── types/domain.ts            ← Shared TypeScript types
    ├── context/AppContext.tsx      ← State management + API orchestration
    ├── services/api/client.ts     ← Axios instance
    ├── roles/lc/                  ← LC screens
    ├── roles/branchManager/       ← BM screens
    ├── roles/rm/                  ← RM screens
    ├── shared/components/         ← Reusable UI (Badge, Card, TaskCard, etc.)
    ├── shared/components/detail/  ← Detail screens (Task, Complaint, etc.)
    ├── modals/                    ← Modal components
    ├── theme/                     ← Colors, fonts, style maps
    └── data/mockData.ts           ← Fallback mock data for development
```
