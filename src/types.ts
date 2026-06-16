export type RoleId = "worker" | "employee" | "am" | "branchManager" | "rm";

export type Priority = "Critical" | "High" | "Medium" | "Low";
export type TaskStatus = "Pending" | "In Progress" | "Completed" | "Revoked";
export type ComplaintStatus = "Pending" | "Escalated" | "Resolved";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";
export type ApplianceStatus = "Operational" | "At Risk" | "Down" | "Critical";
export type VisitStatus = "Scheduled" | "Escalated" | "Completed";
export type UserStatus = "Present" | "Late" | "Absent";

export type RolePage = { id: string; label: string; icon: string };

export type RoleDef = {
  id: RoleId;
  name: string;
  short: string;
  icon: string;
  hierarchy: string;
  accent: string;
  pages: RolePage[];
};

export type Branch = {
  id: number;
  code: string;
  name: string;
  city: string;
  address: string;
  managerId: number;
  assistantManagerId: number;
  phone: string;
  email: string;
  geoRadius: number;
  shiftWindow: string;
  health: number;
  performance: number;
  todayAttendance: number;
  staffCount: number;
  workerCount: number;
  employeeCount: number;
  monthlyBudget: number;
  usedBudget: number;
  openIssues: number;
  criticalAlerts: number;
  applianceRisk: number;
  auditScore: number;
  lastVisit: string;
  nextVisit: string;
  revenueIndex: number;
  customerFootfall: number;
  sla: number;
};

export type User = {
  id: number;
  name: string;
  role: RoleId;
  branchId: number;
  branchScope?: number[] | "all";
  position: string;
  phone: string;
  email: string;
  shift: string;
  joinDate: string;
  status: UserStatus;
  rating: number;
  attendancePct: number;
  tasksClosed: number;
  proofRate: number;
  escalations: number;
  managerId: number | null;
  salary: number;
  lastCheckIn: string;
  skills: string[];
  emergencyContact: string;
  documents: string[];
  deviceId: string;
};

export type Task = {
  id: number;
  title: string;
  branchId: number;
  audience: "worker" | "employee";
  schedule: string;
  priority: Priority;
  zone: string;
  deadline: string;
  assignedTo: number | null;
  assignedBy: number;
  status: TaskStatus;
  checklistDone: number;
  checklistTotal: number;
  proofRequired: boolean;
  completedBy: number | null;
  completedAt: string | null;
  notes: string;
  escalation: string;
  proofLabel: string;
  redoReason: string | null;
};

export type Complaint = {
  id: number;
  title: string;
  branchId: number;
  type: string;
  priority: Priority;
  status: ComplaintStatus;
  reportedBy: number;
  assignedVendor: string;
  assetId: number;
  estimatedCost: number;
  impact: string;
  createdAt: string;
  description: string;
  escalationStage: string;
  timeline: string[];
};

export type Appliance = {
  id: number;
  branchId: number;
  name: string;
  category: string;
  zone: string;
  brand: string;
  model: string;
  serial: string;
  healthScore: number;
  status: ApplianceStatus;
  purchaseDate: string;
  lastService: string;
  nextService: string;
  warranty: string;
  amcVendor: string;
  purchaseCost: number;
  approvalStatus: string;
  pendingParts: string;
};

export type Approval = {
  id: number;
  title: string;
  kind: string;
  branchId: number;
  amount: number;
  requestedBy: number;
  status: ApprovalStatus;
  stage: string;
  priority: Priority;
  age: string;
  note: string;
};

export type Visit = {
  id: number;
  branchId: number;
  managerId: number;
  scheduledAt: string;
  purpose: string;
  agenda: string;
  status: VisitStatus;
  report: string;
};

export type Notification = {
  id: number;
  title: string;
  detail: string;
  scope: RoleId[];
  branchId: number;
  priority: Priority;
  read: boolean;
  bookmarked: boolean;
  time: string;
};

export type AttendanceEntry = {
  id: number;
  userId: number;
  date: string;
  status: UserStatus;
  checkIn: string;
  location: string;
  proof: string;
  deviation: string;
};

export type AppSettings = {
  geoRadius: number;
  workerEscalationMins: number;
  employeeEscalationMins: number;
  criticalAlertRule: string;
  deadlineRule: string;
};
