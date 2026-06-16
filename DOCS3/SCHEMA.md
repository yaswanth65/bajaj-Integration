# Prisma Schema — Complete Model Definitions

**Database:** PostgreSQL  
**Generator:** `prisma-client-js`  
**File:** `prisma/schema.prisma`

---

## User

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `name` | String | required | |
| `email` | String (unique) | required | Lowercased on create |
| `password` | String | required | bcrypt hashed |
| `role` | RoleId enum | required | `lc`, `branchManager`, `rm` |
| `position` | String | required | Display title (e.g. "Local Coordinator") |
| `phone` | String | `"Pending"` | |
| `shift` | String | `"09:00 - 18:00"` | |
| `joinDate` | DateTime | `now()` | |
| `status` | String | `"Present"` | `"Active"`, `"Inactive"`, `"Locked"`, etc. |
| `rating` | Float | `4.0` | Supervisor rating |
| `attendancePct` | Float | `100.0` | Recalculated by `recalcUserStats()` |
| `tasksClosed` | Int | `0` | Incremented on task complete, decremented on revoke |
| `proofRate` | Float | `100.0` | % of completed tasks that have proof URL |
| `escalations` | Int | `0` | Count of complaints escalated past LC stage |
| `managerId` | String? | null | FK → User (self-referencing) |
| `salary` | Float | `0.0` | |
| `lastCheckIn` | String | `"Not marked"` | |
| `skills` | Json | `[]` | String array stored as JSON |
| `emergencyContact` | String | `"Pending"` | |
| `documents` | Json | `[]` | String array stored as JSON |
| `deviceId` | String | `""` | Mobile device identifier |
| `expoPushToken` | String? | null | Push notification token |
| `branchId` | String? | null | FK → Branch (nullable for unassigned users) |
| `branchScope` | String[] | `[]` | Array of branch UUIDs for BM/RM multi-branch access |

**Relations:**
- `manager` → User (self, `UserToManager`)
- `subordinates` ← User[] (self, inverse)
- `branch` → Branch (`UserBranch`)
- `createdTasks` → Task[] (`CreatedTasks`, via `assignedById`)
- `assignedTasks` → Task[] (`AssignedTasks`, via `assignedToId`)
- `completedTasks` → Task[] (`CompletedTasks`, via `completedById`)
- `reportedComplaints` → Complaint[] (`ReportedComplaints`)
- `requestedApprovals` → Approval[] (`RequestedApprovals`)
- `scheduledVisits` → Visit[] (`ManagerVisits`)
- `attendanceLogs` → AttendanceLog[]

**Index:** `role`

---

## Branch

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `code` | String (unique) | required | Short identifier |
| `name` | String (unique) | required | Display name |
| `city` | String | required | |
| `address` | Text | required | |
| `phone` | String | `"Pending"` | |
| `email` | String | `"Pending"` | |
| `geoRadius` | Float | `180.0` | Geo-fence radius in meters |
| `shiftWindow` | String | `"07:00 - 15:00"` | Worker shift |
| `health` | Float | `100.0` | Composite: 40% appliance health + 30% open issues penalty + 30% alerts penalty |
| `performance` | Float | `100.0` | (reserved) |
| `todayAttendance` | Float | `100.0` | % of users with Present/Late today |
| `staffCount` | Int | `0` | Total users in branch |
| `workerCount` | Int | `0` | Active users (non-Inactive) |
| `monthlyBudget` | Float | `50000.0` | Monthly budget cap |
| `usedBudget` | Float | `0.0` | Approved expenditures this month |
| `openIssues` | Int | `0` | Non-resolved, non-rejected complaints |
| `criticalAlerts` | Int | `0` | Alerts escalated to RM level |
| `applianceRisk` | Int | `0` | Non-Operational appliance count |
| `auditScore` | Float | `100.0` | Compliance audit score |
| `lastVisit` | String | `"Not visited"` | Date of last manager visit (IST) |
| `nextVisit` | String | `"Pending"` | Date of next scheduled visit (IST) |
| `revenueIndex` | Float | `1.0` | Performance metric |
| `customerFootfall` | Int | `0` | Daily foot traffic |
| `sla` | Float | `100.0` | SLA compliance % |

**Relations:**
- `users` ← User[]
- `appliances` ← Appliance[]
- `tasks` ← Task[]
- `complaints` ← Complaint[]
- `approvals` ← Approval[]
- `visits` ← Visit[]
- `notifications` ← Notification[]

**Index:** `name`

---

## Appliance

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `branchId` | String | required | FK → Branch (Cascade delete) |
| `name` | String | required | |
| `category` | String | required | e.g. "AC", "UPS", "Inverter" |
| `zone` | String | `"Branch premises"` | Location within branch |
| `brand` | String | required | |
| `model` | String | `"Pending"` | |
| `serial` | String (unique) | required | |
| `healthScore` | Int | `100` | 0-100 |
| `status` | ApplianceStatus enum | `Operational` | |
| `purchaseDate` | DateTime? | null | |
| `lastService` | DateTime? | null | |
| `nextService` | DateTime? | null | |
| `warranty` | String | `"Pending"` | |
| `amcVendor` | String | `"To be assigned"` | Annual maintenance contract vendor |
| `purchaseCost` | Float | `0.0` | |
| `approvalStatus` | String | `"Approved"` | Internal approval state |
| `pendingParts` | String | `"None"` | Part replacement status |

**Relations:**
- `branch` → Branch
- `tasks` ← Task[] (appliance-linked weekly checks)
- `complaints` ← Complaint[]

**Indexes:** `branchId`, `category`

---

## Task

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `title` | String | required | |
| `branchId` | String | required | FK → Branch (Cascade delete) |
| `audience` | RoleId enum | `lc` | Who should see this task |
| `schedule` | String | `"Daily"` | "Daily", "Weekly", "One-Time" |
| `priority` | Priority enum | `High` | |
| `zone` | String | `"Branch premises"` | |
| `deadline` | DateTime | required | |
| `assignedToId` | String? | null | FK → User (nullable for shared tasks) |
| `assignedById` | String | required | FK → User (creator) |
| `status` | TaskStatus enum | `Pending` | |
| `checklistDone` | Int | `0` | Items completed |
| `checklistTotal` | Int | `1` | Total checklist items |
| `proofRequired` | Boolean | `false` | Whether photo proof is needed |
| `proofLabel` | String | `"Photo proof"` | Label for the proof field |
| `proofUrl` | String? | null | Cloudinary image URL |
| `completedById` | String? | null | FK → User |
| `completedAt` | DateTime? | null | |
| `notes` | Text | required | Instructions/remarks |
| `escalation` | String | `"None"` | Escalation path description |
| `redoReason` | Text? | null | Reason for revocation |
| `applianceId` | String? | null | FK → Appliance (for weekly checks) |

**Relations:**
- `branch` → Branch
- `assignedTo` → User (`AssignedTasks`)
- `assignedBy` → User (`CreatedTasks`)
- `completedBy` → User (`CompletedTasks`)
- `appliance` → Appliance

**Indexes:** `branchId`, `assignedToId`, `status`

---

## AttendanceLog

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `userId` | String | required | FK → User (Cascade delete) |
| `date` | String | required | Format: `YYYY-MM-DD` (IST) |
| `status` | AttStatus enum | `Present` | |
| `checkIn` | String | required | Format: `HH:MM` (IST) |
| `checkOut` | String? | null | Format: `HH:MM` (IST) |
| `location` | String | `"Inside geo fence"` | |
| `proof` | String | `"Geo + selfie verified"` | |
| `deviation` | String | `"No"` | Geo-fence deviation note |
| `latitude` | Float? | null | GPS coordinate |
| `longitude` | Float? | null | GPS coordinate |

**Relations:**
- `user` → User
- `weeklyTasks` ← WeeklyTaskPlanItem[]

**Unique:** `[userId, date]`  
**Index:** `userId`

---

## WeeklyTaskPlanItem

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `attendanceId` | String | required | FK → AttendanceLog (Cascade delete) |
| `description` | String | required | Task description |
| `estimatedHours` | Float | `0.0` | |

**Relations:**
- `attendance` → AttendanceLog

---

## Complaint

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `title` | String | required | |
| `branchId` | String | required | FK → Branch (Cascade delete) |
| `type` | String | required | e.g. "Appliance", "Electrical", "Plumbing" |
| `priority` | Priority enum | `Medium` | |
| `status` | ComplaintStatus enum | `Pending` | |
| `reportedById` | String | required | FK → User |
| `assignedVendor` | String | `"Not assigned"` | |
| `assetId` | String? | null | FK → Appliance |
| `estimatedCost` | Float | `0.0` | |
| `impact` | String | `"Operational impact"` | |
| `description` | Text | required | |
| `escalationStage` | String | `"LC"` | Current escalation level |
| `timeline` | Json | `[]` | Array of timestamp strings |

**Relations:**
- `branch` → Branch
- `reportedBy` → User (`ReportedComplaints`)
- `asset` → Appliance

**Index:** `branchId`

---

## Approval

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `title` | String | required | |
| `kind` | String | required | e.g. "Expense", "Appliance Repair" |
| `branchId` | String | required | FK → Branch (Cascade delete) |
| `amount` | Float | required | |
| `requestedById` | String | required | FK → User |
| `status` | ApprovalStatus enum | `Pending` | |
| `stage` | String | `"Branch Manager"` | Current approval stage |
| `priority` | Priority enum | `High` | |
| `age` | String | `"Just now"` | Computed dynamically as `relativeTime(createdAt)` at response layer |
| `note` | Text | required | |

**Relations:**
- `branch` → Branch
- `requestedBy` → User (`RequestedApprovals`)

---

## Visit

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `branchId` | String | required | FK → Branch (Cascade delete) |
| `managerId` | String | required | FK → User (scheduler/visitor) |
| `scheduledAt` | DateTime | required | |
| `purpose` | String | required | |
| `agenda` | Text | required | |
| `status` | VisitStatus enum | `Scheduled` | |
| `report` | Text | `"Pending"` | Visit report content |

**Relations:**
- `branch` → Branch
- `manager` → User (`ManagerVisits`)

---

## Notification

| Field | Type | Default | Notes |
|---|---|---|---|
| `id` | String (UUID) | auto | Primary key |
| `title` | String | required | |
| `detail` | String | required | |
| `scope` | RoleId[] | required | Array of roles that should see this |
| `branchId` | String | required | FK → Branch (Cascade delete) |
| `priority` | Priority enum | `Medium` | |
| `read` | Boolean | `false` | |
| `bookmarked` | Boolean | `false` | |
| `time` | String | `"Just now"` | Computed dynamically as `relativeTime(createdAt)` at response layer |

**Relations:**
- `branch` → Branch
