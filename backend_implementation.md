# Bajaj Operations Management System - Backend Implementation

This document covers the implementation details of the NodeJS/Express/Prisma backend, including the relational database schema, API route mappings, and core controller logic.

---

## 1. Technology Stack
*   **Core**: TypeScript, NodeJS, Express.
*   **Database ORM**: Prisma.
*   **Database System**: PostgreSQL (Neon Serverless).
*   **Media Hosting**: Cloudinary API (SDK).
*   **Push Alerts**: Expo Server SDK (NodeJS Client).
*   **Authentication**: JSON Web Tokens (JWT) signed with a **7-day expiration** duration.

---

## 2. Complete Database Schema (Prisma)
Below is the relational database layout configured in `schema.prisma`. It utilizes enums, UUID generators, timestamps, and indexes for scalable queries:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum RoleId {
  lc
  branchManager
  rm
}

enum Priority {
  Critical
  High
  Medium
  Low
}

enum TaskStatus {
  Pending
  InProgress
  Completed
  Revoked
}

enum ComplaintStatus {
  Pending
  Escalated
  Resolved
}

enum ApprovalStatus {
  Pending
  Approved
  Rejected
}

enum ApplianceStatus {
  Operational
  AtRisk
  Critical
  Down
}

enum VisitStatus {
  Scheduled
  Escalated
  Completed
}

enum AttStatus {
  Present
  Late
  Absent
}

model User {
  id                 String          @id @default(uuid())
  name               String
  email              String          @unique
  password           String          // Hashed
  role               RoleId
  position           String          // E.g. "Local Coordinator", "Branch Admin Manager (BAM)"
  phone              String          @default("Pending")
  shift              String          @default("09:00 - 18:00")
  joinDate           DateTime        @default(now())
  status             String          @default("Present")
  rating             Float           @default(4.0)
  attendancePct      Float           @default(100.0)
  tasksClosed        Int             @default(0)
  proofRate          Float           @default(100.0)
  escalations        Int             @default(0)
  managerId          String?
  manager            User?           @relation("UserToManager", fields: [managerId], references: [id], onDelete: SetNull)
  subordinates       User[]          @relation("UserToManager")
  salary             Float           @default(0.0)
  lastCheckIn        String          @default("Not marked")
  skills             Json            @default("[]") // Store as string array in JSON
  emergencyContact   String          @default("Pending")
  documents          Json            @default("[]") // Store as string array in JSON
  deviceId           String          @default("")
  expoPushToken      String?
  
  // Scoping relationships
  branchId           String?
  branch             Branch?         @relation("UserBranch", fields: [branchId], references: [id], onDelete: SetNull)
  branchScope        String[]        // Array of branch UUIDs that a BM / AA is allowed to view
  
  // Operations Relationships
  createdTasks       Task[]          @relation("CreatedTasks")
  assignedTasks      Task[]          @relation("AssignedTasks")
  completedTasks     Task[]          @relation("CompletedTasks")
  reportedComplaints Complaint[]     @relation("ReportedComplaints")
  requestedApprovals Approval[]      @relation("RequestedApprovals")
  scheduledVisits    Visit[]         @relation("ManagerVisits")
  attendanceLogs     AttendanceLog[]
  
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([role])
}

model Branch {
  id                 String          @id @default(uuid())
  code               String          @unique
  name               String          @unique
  city               String
  address            String          @db.Text
  phone              String          @default("Pending")
  email              String          @default("Pending")
  geoRadius          Float           @default(180.0)
  shiftWindow        String          @default("07:00 - 15:00")
  health             Float           @default(100.0)
  performance        Float           @default(100.0)
  todayAttendance    Float           @default(100.0)
  staffCount         Int             @default(0)
  workerCount        Int             @default(0)
  monthlyBudget      Float           @default(50000.0)
  usedBudget         Float           @default(0.0)
  openIssues         Int             @default(0)
  criticalAlerts     Int             @default(0)
  applianceRisk      Int             @default(0)
  auditScore         Float           @default(100.0)
  lastVisit          String          @default("Not visited")
  nextVisit          String          @default("Pending")
  revenueIndex       Float           @default(1.0)
  customerFootfall   Int             @default(0)
  sla                Float           @default(100.0)
  
  // Relations
  users              User[]          @relation("UserBranch")
  appliances         Appliance[]
  tasks              Task[]
  complaints         Complaint[]
  approvals          Approval[]
  visits             Visit[]
  notifications      Notification[]
  
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([name])
}

model Appliance {
  id                 String          @id @default(uuid())
  branchId           String
  branch             Branch          @relation(fields: [branchId], references: [id], onDelete: Cascade)
  name               String
  category           String          // AC, UPS, Inverter
  zone               String          @default("Branch premises")
  brand              String
  model              String          @default("Pending")
  serial             String          @unique
  healthScore        Int             @default(100)
  status             ApplianceStatus @default(Operational)
  purchaseDate       DateTime?
  lastService        DateTime?
  nextService        DateTime?
  warranty           String          @default("Pending")
  amcVendor          String          @default("To be assigned")
  purchaseCost       Float           @default(0.0)
  approvalStatus     String          @default("Approved")
  pendingParts       String          @default("None")
  
  // Track tasks generated for this appliance
  tasks              Task[]
  complaints         Complaint[]
  
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([branchId])
  @@index([category])
}

model Task {
  id                 String          @id @default(uuid())
  title              String
  branchId           String
  branch             Branch          @relation(fields: [branchId], references: [id], onDelete: Cascade)
  audience           RoleId          @default(lc)
  schedule           String          @default("Daily") // Daily, Weekly, One-Time
  priority           Priority        @default(High)
  zone               String          @default("Branch premises")
  deadline           DateTime
  
  assignedToId       String?
  assignedTo         User?           @relation("AssignedTasks", fields: [assignedToId], references: [id], onDelete: SetNull)
  assignedById       String
  assignedBy         User            @relation("CreatedTasks", fields: [assignedById], references: [id], onDelete: Cascade)
  
  status             TaskStatus      @default(Pending)
  checklistDone      Int             @default(0)
  checklistTotal     Int             @default(1)
  proofRequired      Boolean         @default(false)
  proofLabel         String          @default("Photo proof")
  proofUrl           String?         // Cloudinary image URL
  
  completedById      String?
  completedBy        User?           @relation("CompletedTasks", fields: [completedById], references: [id], onDelete: SetNull)
  completedAt        DateTime?
  
  notes              String          @db.Text
  escalation         String          @default("None")
  redoReason         String?         @db.Text
  
  // Optional link to appliance (for weekly checks)
  applianceId        String?
  appliance          Appliance?      @relation(fields: [applianceId], references: [id], onDelete: SetNull)

  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([branchId])
  @@index([assignedToId])
  @@index([status])
}

model AttendanceLog {
  id                 String          @id @default(uuid())
  userId             String
  user               User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  date               String          // YYYY-MM-DD
  status             AttStatus       @default(Present)
  checkIn            String          // "HH:MM"
  checkOut           String?         // "HH:MM"
  location           String          @default("Inside geo fence")
  proof              String          @default("Geo + selfie verified")
  deviation          String          @default("No")
  latitude           Float?
  longitude          Float?
  
  // Embedded plan items
  weeklyTasks        WeeklyTaskPlanItem[]
  
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@unique([userId, date])
  @@index([userId])
}

model WeeklyTaskPlanItem {
  id                 String          @id @default(uuid())
  attendanceId       String
  attendance         AttendanceLog   @relation(fields: [attendanceId], references: [id], onDelete: Cascade)
  description        String
  estimatedHours     Float           @default(0.0)
  
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
}

model Complaint {
  id                 String          @id @default(uuid())
  title              String
  branchId           String
  branch             Branch          @relation(fields: [branchId], references: [id], onDelete: Cascade)
  type               String          // "Appliance", "Electrical", etc.
  priority           Priority        @default(Medium)
  status             ComplaintStatus @default(Pending)
  
  reportedById       String
  reportedBy         User            @relation("ReportedComplaints", fields: [reportedById], references: [id], onDelete: Cascade)
  
  assignedVendor     String          @default("Not assigned")
  
  assetId            String?
  asset              Appliance?      @relation(fields: [assetId], references: [id], onDelete: SetNull)
  
  estimatedCost      Float           @default(0.0)
  impact             String          @default("Operational impact")
  description        String          @db.Text
  escalationStage    String          @default("LC")
  timeline           Json            @default("[]") // Array of string timestamps

  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([branchId])
}

model Approval {
  id                 String          @id @default(uuid())
  title              String
  kind               String          // "Expense", "Appliance Repair"
  branchId           String
  branch             Branch          @relation(fields: [branchId], references: [id], onDelete: Cascade)
  amount             Float
  
  requestedById      String
  requestedBy        User            @relation("RequestedApprovals", fields: [requestedById], references: [id], onDelete: Cascade)
  
  status             ApprovalStatus  @default(Pending)
  stage              String          @default("Branch Manager")
  priority           Priority        @default(High)
  age                String          @default("Just now")
  note               String          @db.Text

  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
}

model Visit {
  id                 String          @id @default(uuid())
  branchId           String
  branch             Branch          @relation(fields: [branchId], references: [id], onDelete: Cascade)
  managerId          String
  manager            User            @relation("ManagerVisits", fields: [managerId], references: [id], onDelete: Cascade)
  scheduledAt        DateTime
  purpose            String
  agenda             String          @db.Text
  status             VisitStatus     @default(Scheduled)
  report             String          @default("Pending") @db.Text

  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
}

model Notification {
  id                 String          @id @default(uuid())
  title              String
  detail             String
  scope              RoleId[]        // Custom mapping to array of RoleId
  branchId           String
  branch             Branch          @relation(fields: [branchId], references: [id], onDelete: Cascade)
  priority           Priority        @default(Medium)
  read               Boolean         @default(false)
  bookmarked         Boolean         @default(false)
  time               String          @default("Just now")

  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
}
```

---

## 3. Registered API Endpoints (`/api`)

| Method | Endpoint | Description | Scoped Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Validates credentials and signs a JWT (7-day duration). | Public |
| **POST** | `/api/attendance` | Records coordinate check-in and maps weekly planners. | LC / Worker |
| **GET** | `/api/attendance/my-calendar` | Fetches active check-in histories for calendar mapping. | Authenticated |
| **GET** | `/api/tasks` | Lists task boards based on branch and role scopes. | Authenticated |
| **POST** | `/api/tasks` | Allocates a new operation task card. | BAM / RM |
| **POST** | `/api/tasks/:id/complete` | Submits standard checkmarks. | LC / Worker |
| **POST** | `/api/tasks/:id/submit-proof` | Pipes image stream to Cloudinary and marks task complete. | LC |
| **POST** | `/api/tasks/:id/revoke` | Reopens task card, assigning rework notes. | BAM / RM |
| **GET** | `/api/complaints` | Lists issues scoped to branch permissions. | Authenticated |
| **POST** | `/api/complaints` | Registers a new facility / appliance issue. | LC |
| **POST** | `/api/complaints/:id/resolve` | Closes issue and notifies reporter. | BAM / RM |
| **POST** | `/api/complaints/:id/escalate` | Moves triage levels (LC -> BM -> RM) and triggers push alerts. | Authenticated |
| **POST** | `/api/complaints/:id/assign-vendor` | Registers technician vendor. | BAM / RM |
| **POST** | `/api/complaints/:id/approve-high-cost`| Capex approval for high-cost (>20k) repairs. | RM |
| **GET** | `/api/approvals` | Lists budget expense requests. | Authenticated |
| **POST** | `/api/approvals` | Requests capex/opex funds. | LC / BAM |
| **POST** | `/api/approvals/:id/approve` | Grants request, incrementing branch `usedBudget`. | BAM / RM |
| **POST** | `/api/approvals/:id/reject` | Rejects request and dispatches push alert. | BAM / RM |
| **GET** | `/api/visits` | ListsScheduled review audits. | Authenticated |
| **POST** | `/api/visits` | Schedules branch review audit. | BAM / RM |
| **POST** | `/api/visits/:id/report` | Submits review report and updates branch timestamps. | BAM / RM |
| **GET** | `/api/notifications` | Filters alerts by role scope. | Authenticated |
| **POST** | `/api/notifications/:id/read` | Toggles read indicator. | Authenticated |
| **POST** | `/api/notifications/:id/bookmark` | Toggles bookmark indicator. | Authenticated |
| **POST** | `/api/notifications/:id/acknowledge`| Decreases critical counters on the branch. | Authenticated |
| **POST** | `/api/notifications/:id/escalate`| Escales alarms to RM scope. | Authenticated |
| **PUT** | `/api/users/:id` | Binds device Expo Push Token to user profile. | Authenticated |
| **GET** | `/api/cron/generate-appliance-tasks` | Auto-generates weekly task checks. | Cron / Public |
| **GET** | `/api/dashboard/metrics` | Computes counters for active metrics cards. | Authenticated |

---

## 4. Seeder Details (`seed.ts`)
The seeding script dynamically parses hierarchy files (`branch_lc_team.json` and appliance spreadsheets) to set up a comprehensive environment:
1.  **Branch Counts**: Seeds **189 branches** spanning multiple cities.
2.  **Appliance Allocation**: Resolves and seeds **1,154 appliances** (ACs, UPSs, and Inverters) linked to respective branches.
3.  **Automatic Task Generation**: For each of the **1,154 appliances**, the seeder automatically populates a pending weekly check task assigned to the branch's LC, establishing a fully operational checklist upon database initialization.
4.  **Staff Accounts**: Maps and hashes credentials for test accounts (password `123456789`).
