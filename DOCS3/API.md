# API Endpoints

**Base URL:** `http://<host>:5000/api`  
**Auth:** All endpoints except `/auth/login` require `Authorization: Bearer <token>` header.  
**Time zone:** All date operations use Asia/Kolkata (IST).  
**Response errors** include `{ message: string }` and optionally `error` in development mode.

---

## 1. Authentication

### POST /auth/login

**Body:** `{ email: string, password: string }`  
**Rate limit:** 5 attempts per 15 minutes per IP  
**Response 200:**
```json
{
  "token": "jwt...",
  "user": {
    "id", "name", "email", "role", "position",
    "branchId", "branchScope", "deviceId",
    "phone", "shift", "status"
  }
}
```

---

## 2. Role-Specific Bundle Endpoints

These return all data a single screen needs in one call.

### GET /lc/dashboard (LC only)

Shape: `{ branch, tasks, complaints[], appliances[], todayAttendance }`

| Key | Type | Source |
|---|---|---|
| `branch` | Branch (lean: id, name, code, city, health, sla, criticalAlerts, openIssues, monthlyBudget, usedBudget, staffCount, todayAttendance, applianceRisk, nextVisit, auditScore) | `prisma.branch.findUnique` |
| `tasks` | Task[] (lean) with `assignedTo` and `assignedBy` aliased from `*Id` fields | `prisma.task.findMany` for branch |
| `complaints` | Complaint[] (lean: id, title, type, impact, priority, status, branchId, estimatedCost, description, createdAt) | `prisma.complaint.findMany` for branch |
| `appliances` | Appliance[] (lean: id, name, category, brand, zone, status, healthScore, approvalStatus, branchId, amcVendor, nextService, pendingParts) | `prisma.appliance.findMany` for branch |
| `todayAttendance` | AttendanceLog? (single record for LC user today) | `prisma.attendanceLog.findFirst` |

### GET /lc/tasks (LC only)

Query: `?status=Pending` (optional)

Response: `{ tasks: Task[] }` — tasks for LC's branch with `assignedTo`, `assignedBy`, `completedBy` aliased.

### GET /bm/dashboard (BM only)

Shape: `{ branches[], approvals[], visits[], notifications[] }`

- Approvals include `requestedBy` aliased from `requestedById`
- Notifications include `time` computed as `relativeTime(createdAt)`

### GET /bm/attendance (BM only)

Response: `{ attendance: AttendanceLog[], users: User[], tasks: Task[] }`

### GET /bm/tasks (BM only)

Query: `?status=Pending`

Response: `{ tasks: Task[] }` — tasks for branches in BM's `branchScope`

### GET /bm/approvals (BM only)

Response: `Approval[]` (direct array) with `requestedBy` aliased

### GET /bm/branches (BM only)

Response: `{ branches: Branch[], appliances: Appliance[], users: User[] }`

### GET /bm/complaints (BM only)

Response: `Complaint[]` (direct array) with `reportedBy` aliased and `timeline` parsed

### GET /bm/visits (BM only)

Response: `Visit[]` (direct array)

### GET /rm/dashboard (RM only)

Shape: `{ branches[], complaints[], approvals[], notifications[] }`

- Complaints include `reportedBy` aliased and `timeline` parsed
- Approvals include `requestedBy` aliased
- Notifications include `time` computed from `createdAt`

### GET /rm/attendance (RM only)

Response: `{ attendance: AttendanceLog[], users: User[], tasks: Task[] }`

### GET /rm/finance (RM only)

Response: `{ approvals: Approval[], branches: Branch[] }`

### GET /rm/finance/export (RM only)

Response: CSV file download (Content-Type: text/csv)

### GET /rm/users (RM only)

Response: `{ users: User[], branches: Branch[] }`

### GET /rm/analytics (RM only)

Response: `{ analytics: [{ branchId, branchName, city, health, sla, criticalAlerts, todayAttendance, staffCount, monthlyBudget, usedBudget, budgetBurnPct, taskCompletionRate, totalTasks, completedTasks, openComplaints, resolvedComplaints, approvedCapex, applianceRisk, auditScore }] }`

### GET /rm/tasks (RM only)

Query: `?status=Pending&branchId=...`

Response: `{ tasks: Task[] }` — all tasks with `assignedTo`, `assignedBy`, `completedBy` aliased

### GET /lc/attendance/calendar (LC only)

Query: `?month=MM&year=YYYY`

Response: `CalendarEntry[]` — array of `{ date, status, checkIn, checkOut, location, proof, deviation, weeklyTasks: WeeklyTaskPlanItem[], completedTasks: [{ id, title, zone }] }`

---

## 3. Attendance

### POST /attendance (or /lc/attendance)

**Body:** `{ checkIn?: "HH:MM", weeklyTasks?: [{ description: string, estimatedHours: number }] }`

Upserts today's attendance (unique on `userId_date`). If LC and `weeklyTasks` provided, creates task plan items and auto-generates tasks.

**Response 200:** `{ message, attendance: AttendanceLog }`

### PUT /lc/attendance/:id/checkout (LC only)

**Body:** `{ checkOut: "HH:MM" }`

**Response 200:** `{ attendance }`

### GET /attendance/my-calendar (legacy)

Same as `/lc/attendance/calendar`.

---

## 4. Tasks

### POST /tasks

**Body:**
```json
{
  "title": "string (required)",
  "branchId?": "string",
  "audience?": "lc | branchManager | rm",
  "schedule?": "Daily | Weekly | One-Time",
  "priority?": "Critical | High | Medium | Low",
  "zone?": "string",
  "deadline?": "ISO date string",
  "assignedToId?": "string",
  "proofRequired?": boolean,
  "proofLabel?": "string",
  "notes?": "string"
}
```

LC: `branchId` forced to LC's branch, `assignedToId` forced to LC's id.  
BM/RM: `branchId` must be in scope.

**Response 201:** `{ message, task }`

### POST /tasks/:id/complete

**Body:** `{ checklistDone?: number, notes?: string }`

Sets status to `Completed`, increments user `tasksClosed`. Triggers `recalcBranchStats` + `recalcUserStats`.

**Response 200:** `{ message, task }`

### POST /tasks/:id/submit-proof

**Multipart:** `image` (file, 5MB max) or `imageUrl` (string). Optional `notes`.

Uploads to Cloudinary, sets `proofUrl`, marks `Completed`. Same stats recalc as `/complete`.

**Response 200:** `{ message, task }`

### POST /tasks/:id/revoke (BM/RM only)

**Body:** `{ redoReason?: string }`

Sets status to `Revoked`, clears `completedById`/`completedAt`. Decrements `tasksClosed` if previously completed.

**Response 200:** `{ message, task }`

### PUT /bm/tasks/:id (BM only)

**Body:** (any subset) `{ title, notes, deadline, priority, assignedToId, checklistTotal, proofRequired, zone, schedule }`

**Response 200:** `{ task }`

### PATCH /bm/tasks/:id/archive (BM only)

Soft-archive: sets status to `Revoked`.

**Response 200:** `{ task }`

---

## 5. Complaints

### GET /complaints

Query: `?status=Pending&branchId=...`

Returns `Complaint[]` with `reportedBy` and `asset` includes.

### POST /complaints

**Body:** `{ title, type, priority?, assetId?, estimatedCost?, impact?, description? }`

Increments branch `openIssues`, creates notification, sends push to BM/RM.

**Response 201:** `{ message, complaint, notification }`

### POST /complaints/:id/resolve

Sets status to `Resolved`, decrements `openIssues`, notifies reporter, triggers `recalcBranchStats`.

**Response 200:** `{ message, complaint }`

### POST /complaints/:id/escalate

Advances `escalationStage` (LC → BM → RM), sets `Escalated` status, increments `criticalAlerts` if reaching RM.

**Response 200:** `{ message, complaint }`

### POST /complaints/:id/assign-vendor

**Body:** `{ assignedVendor: string }`

Appends to timeline.

**Response 200:** `{ message, complaint }`

### POST /complaints/:id/approve-high-cost (RM only)

Appends RM approval to timeline.

**Response 200:** `{ message, complaint }`

### DELETE /complaints/:id (BM/RM only)

Soft-delete: sets status to `Rejected`, escalationStage to `Closed`, decrements `openIssues`.

**Response 200:** `{ message: "Complaint rejected successfully" }`

### POST /bm/complaints/:id/reject (BM only)

**Body:** `{ reason?: string }`

Sets status to `Rejected`, appends rejection timestamp + reason to timeline.

**Response 200:** `{ complaint }`

### PUT /lc/complaints/:id (LC only)

**Body:** (any subset) `{ title, description, impact, priority, estimatedCost }`

Only editable before vendor assignment.

**Response 200:** `{ complaint }`

---

## 6. Approvals

### POST /approvals

**Body:** `{ title, kind, amount, note?, branchId? }`

LC: `branchId` forced to LC's branch.  
BM: `branchId` required, must be in scope.  
Priority: `Critical` if amount > 25000, else `High`.  
Stage: `"Branch Manager"` unless RM creator.

**Response 201:** `{ message, approval }` — includes `age` computed as `relativeTime(createdAt)`

### POST /approvals/:id/approve (BM/RM only)

If BM and amount > 25000: escalates to RM stage instead of final approval.  
If RM: final approval, deducts from branch `usedBudget`.

**Response 200:** `{ message, approval }`

### POST /approvals/:id/reject (BM/RM only)

Sets status to `Rejected`, stage to `Closed`. Notifies requester.

**Response 200:** `{ message, approval }`

---

## 7. Visits

### GET /visits

Query: `?branchId=...&status=Scheduled`

Returns `Visit[]` with `manager` and `branch` includes.

### POST /visits

**Body:** `{ branchId, scheduledAt, purpose, agenda? }`

Updates branch `nextVisit` to IST date. Notifies LC(s) at branch.

**Response 201:** `{ message, visit }`

### POST /visits/:id/report (BM/RM only)

**Body:** `{ report: string }`

Sets status to `Completed`, updates branch `lastVisit`/`nextVisit`.

**Response 200:** `{ message, visit }`

### PUT /bm/visits/:id (BM only)

**Body:** (any subset) `{ scheduledAt, purpose, agenda }`

Resets status to `Scheduled`.

**Response 200:** `{ visit }`

### PATCH /bm/visits/:id/cancel (BM only)

**Body:** `{ reason?: string }`

Sets status to `Cancelled`, writes cancellation reason + timestamp in report field.

**Response 200:** `{ visit }`

---

## 8. Notifications

### GET /notifications

Returns `Notification[]` — each item includes `time` computed as `relativeTime(createdAt)`.

### POST /notifications/:id/read

Toggles `read` boolean.

**Response 200:** `{ notification }`

### POST /notifications/:id/bookmark

Toggles `bookmarked` boolean.

**Response 200:** `{ notification }`

### POST /notifications/:id/acknowledge

Marks notification as acknowledged (for alerts).

**Response 200:** `{ notification }`

### POST /notifications/:id/escalate

Flags notification as escalated.

**Response 200:** `{ notification }`

---

## 9. Users

### GET /users

Query: `?branchId=...&role=lc`

Scoped by role: LC sees own branch, BM sees scoped branches, RM sees all.

### POST /users (BM/RM only)

**Body:** `{ name, role, position, branchId?, phone?, shift?, skills? }`

Generates email from name, default password `123456789` (bcrypt hashed). Increments branch `staffCount`/`workerCount`.

**Response 201:** `{ message, user }`

### PUT /users/:id

**Body:** (any subset) `{ name, phone, shift, skills, expoPushToken, status }`

LC can only edit self. BM/RM can edit subordinates.

**Response 200:** `{ message, user }`

### DELETE /users/:id (RM only)

Soft-deactivate: sets status to `"Inactive"`. Decrements branch `staffCount`/`workerCount`.

**Response 200:** `{ message: "User deactivated successfully" }`

### PATCH /rm/users/:id/status (RM only)

**Body:** `{ status: "Active" | "Locked" }`

Cannot lock own account.

**Response 200:** `{ user }`

---

## 10. Branches

### GET /branches

Returns all branches (scoped by role).

### GET /branches/:id

Returns single branch with full detail.

### PUT /branches/:id

**Body:** (any subset) `{ monthlyBudget?, name?, phone?, email?, ... }`

**Response 200:** `{ branch }`

---

## 11. Appliances

### GET /appliances

Returns appliances (scoped by role).

### POST /appliances

**Body:** `{ name, category, zone?, brand, model?, serial, purchaseCost?, amcVendor?, purchaseDate?, lastService?, nextService?, warranty?, pendingParts?, branchId? }`

**Response 201:** `{ message, appliance }`

### PUT /appliances/:id

**Body:** (any subset) `{ name, category, status, healthScore, ... }`

**Response 200:** `{ message, appliance }`

### DELETE /appliances/:id (RM only)

Hard delete (Cascade).

### PATCH /appliances/:id/decommission

Soft-decommission: sets status to `Down`.

**Response 200:** `{ message, appliance }`

---

## 12. Cron (Internal)

### POST /cron/generate-appliance-tasks

**Auth:** `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`

Generates weekly appliance verification tasks for all active appliances. Skips appliances that already have tasks for the current IST week.

**Response 200:** `{ message, tasksCreated, totalAppliancesProcessed }`

---

## Response Envelope

All successful responses return JSON (unless CSV for export).  
Error responses have shape: `{ message: string, error?: string }`

**HTTP status codes used:**
- `200` — Success
- `201` — Created
- `400` — Bad request / validation error
- `401` — Missing/invalid token
- `403` — Forbidden (wrong role or out of scope)
- `404` — Resource not found
- `409` — Conflict (already resolved, etc.)
- `429` — Rate limited (login)
- `500` — Server error
