import {
  RoleDef, Branch, User, Task, Complaint, Appliance, Approval, Visit, Notification, AttendanceEntry, AppSettings,
} from "./types";

export const ROLES: Record<string, RoleDef> = {
  worker: {
    id: "worker",
    name: "Worker",
    short: "Proof staff",
    icon: "⚒️",
    hierarchy: "Worker -> AA/LC -> Branch Manager -> RM",
    accent: "#f59e0b",
    pages: [
      { id: "home", label: "Home", icon: "🏠" },
      { id: "tasks", label: "Tasks", icon: "✅" },
      { id: "complaints", label: "Complaint", icon: "🔧" },
      { id: "attendance", label: "Attendance", icon: "📍" },
      { id: "notifications", label: "Alerts", icon: "🔔" },
      { id: "profile", label: "Profile", icon: "👤" },
    ],
  },
  employee: {
    id: "employee",
    name: "Employee",
    short: "Regular staff",
    icon: "👔",
    hierarchy: "Employee -> AA/LC -> Branch Manager -> RM",
    accent: "#3b82f6",
    pages: [
      { id: "home", label: "Home", icon: "🏠" },
      { id: "tasks", label: "Tasks", icon: "✅" },
      { id: "complaints", label: "Issues", icon: "⚠️" },
      { id: "attendance", label: "Attendance", icon: "📍" },
      { id: "notifications", label: "Alerts", icon: "🔔" },
      { id: "profile", label: "Profile", icon: "👤" },
    ],
  },
  am: {
    id: "am",
    name: "Admin Assistant",
    short: "Branch Ops Lead",
    icon: "⚙️",
    hierarchy: "AA/LC -> Branch Manager -> RM",
    accent: "#10b981",
    pages: [
      { id: "home", label: "Home", icon: "🏠" },
      { id: "tasks", label: "Tasks", icon: "✅" },
      { id: "complaints", label: "Complaints", icon: "⚠️" },
      { id: "branch", label: "Branch", icon: "🏢" },
      { id: "attendance", label: "Attendance", icon: "👥" },
      { id: "notifications", label: "Alerts", icon: "🔔" },
      { id: "profile", label: "Profile", icon: "👤" },
    ],
  },
  branchManager: {
    id: "branchManager",
    name: "Branch Manager",
    short: "Branch oversight",
    icon: "💼",
    hierarchy: "Branch Manager -> RM",
    accent: "#0d9488",
    pages: [
      { id: "home", label: "Overview", icon: "🏠" },
      { id: "branches", label: "Branches", icon: "🏢" },
      { id: "monitoring", label: "Task Monitor", icon: "📈" },
      { id: "issues", label: "Issues", icon: "🌐" },
      { id: "approvals", label: "Approvals", icon: "📝" },
      { id: "visits", label: "Visits", icon: "🛣️" },
      { id: "notifications", label: "Alerts", icon: "🔔" },
      { id: "profile", label: "Profile", icon: "👤" },
    ],
  },
  rm: {
    id: "rm",
    name: "Super Admin / RM",
    short: "Regional control",
    icon: "👑",
    hierarchy: "RM / Super Admin",
    accent: "#f43f5e",
    pages: [
      { id: "dashboard", label: "Dashboard", icon: "📊" },
      { id: "intelligence", label: "Branch Intel", icon: "🛰️" },
      { id: "alerts", label: "Alert Center", icon: "🚨" },
      { id: "finance", label: "Issues & Costs", icon: "💰" },
      { id: "analytics", label: "Analytics", icon: "📉" },
      { id: "approvals", label: "Approvals", icon: "📝" },
      { id: "users", label: "Users", icon: "👥" },
      { id: "settings", label: "Settings", icon: "⚙️" },
      { id: "notifications", label: "Alerts", icon: "🔔" },
      { id: "profile", label: "Profile", icon: "👤" },
    ],
  },
};

export const BRANCHES: Branch[] = [
  {
    id: 1, code: "HYD-BH-01", name: "Banjara Hills Office", city: "Hyderabad",
    address: "Road No. 12, Banjara Hills, Hyderabad", managerId: 10, assistantManagerId: 7,
    phone: "040-4123 2201", email: "banjarahills.ops@bajaj.com", geoRadius: 180, shiftWindow: "08:00 - 20:00",
    health: 93, performance: 95, todayAttendance: 96, staffCount: 16, workerCount: 6, employeeCount: 8,
    monthlyBudget: 820000, usedBudget: 604000, openIssues: 4, criticalAlerts: 1, applianceRisk: 2,
    auditScore: 97, lastVisit: "2026-04-18", nextVisit: "2026-04-29", revenueIndex: 118, customerFootfall: 462, sla: 94,
  },
  {
    id: 2, code: "HYD-GC-02", name: "Gachibowli Office", city: "Hyderabad",
    address: "Financial District Main Road, Gachibowli", managerId: 10, assistantManagerId: 8,
    phone: "040-4123 2288", email: "gachibowli.ops@bajaj.com", geoRadius: 160, shiftWindow: "08:30 - 20:30",
    health: 88, performance: 89, todayAttendance: 91, staffCount: 13, workerCount: 5, employeeCount: 6,
    monthlyBudget: 690000, usedBudget: 551000, openIssues: 6, criticalAlerts: 2, applianceRisk: 3,
    auditScore: 92, lastVisit: "2026-04-20", nextVisit: "2026-04-30", revenueIndex: 102, customerFootfall: 388, sla: 90,
  },
  {
    id: 3, code: "HYD-KP-03", name: "Kukatpally Office", city: "Hyderabad",
    address: "JNTU Road, Kukatpally, Hyderabad", managerId: 11, assistantManagerId: 9,
    phone: "040-4123 2310", email: "kukatpally.ops@bajaj.com", geoRadius: 150, shiftWindow: "09:00 - 21:00",
    health: 78, performance: 81, todayAttendance: 86, staffCount: 18, workerCount: 7, employeeCount: 8,
    monthlyBudget: 740000, usedBudget: 684000, openIssues: 9, criticalAlerts: 3, applianceRisk: 4,
    auditScore: 84, lastVisit: "2026-04-12", nextVisit: "2026-04-27", revenueIndex: 94, customerFootfall: 521, sla: 82,
  },
  {
    id: 4, code: "HYD-MD-04", name: "Madhapur Office", city: "Hyderabad",
    address: "Knowledge City Lane, Madhapur, Hyderabad", managerId: 11, assistantManagerId: 9,
    phone: "040-4123 2391", email: "madhapur.ops@bajaj.com", geoRadius: 170, shiftWindow: "08:00 - 20:00",
    health: 91, performance: 92, todayAttendance: 95, staffCount: 14, workerCount: 5, employeeCount: 7,
    monthlyBudget: 705000, usedBudget: 463000, openIssues: 3, criticalAlerts: 1, applianceRisk: 1,
    auditScore: 95, lastVisit: "2026-04-16", nextVisit: "2026-05-02", revenueIndex: 114, customerFootfall: 406, sla: 96,
  },
];

export const USERS: User[] = [
  {
    id: 1, name: "Rafiq Shaik", role: "worker", branchId: 1, position: "Security Lead", phone: "99480 11001", email: "rafiq.shaik@bajaj.com",
    shift: "06:00 - 14:00", joinDate: "2023-02-14", status: "Present", rating: 4.8, attendancePct: 97, tasksClosed: 218, proofRate: 100, escalations: 1,
    managerId: 7, salary: 22000, lastCheckIn: "2026-04-26 08:02", skills: ["Fire safety", "Patrol", "Visitor checks"],
    emergencyContact: "Sameera - 98765 11220", documents: ["Aadhaar", "Police verification", "Uniform issue log"], deviceId: "GEO-WK-1101",
  },
  {
    id: 2, name: "Suresh Yadav", role: "worker", branchId: 1, position: "Facility Worker", phone: "99480 11002", email: "suresh.yadav@bajaj.com",
    shift: "09:00 - 17:00", joinDate: "2022-11-02", status: "Present", rating: 4.6, attendancePct: 96, tasksClosed: 306, proofRate: 98, escalations: 2,
    managerId: 7, salary: 20500, lastCheckIn: "2026-04-26 09:03", skills: ["HVAC cleaning", "UPS checks", "Stock handling"],
    emergencyContact: "Rani - 98765 11221", documents: ["Aadhaar", "Safety induction", "Bank proof"], deviceId: "GEO-WK-1102",
  },
  {
    id: 3, name: "Megha Reddy", role: "employee", branchId: 1, position: "Admin Executive", phone: "99480 11003", email: "megha.reddy@bajaj.com",
    shift: "09:30 - 18:30", joinDate: "2021-08-17", status: "Present", rating: 4.9, attendancePct: 99, tasksClosed: 418, proofRate: 100, escalations: 0,
    managerId: 7, salary: 34000, lastCheckIn: "2026-04-26 09:24", skills: ["Reporting", "Vendor follow-up", "Audit prep"],
    emergencyContact: "Rahul - 98765 11222", documents: ["Aadhaar", "Offer letter", "NDA"], deviceId: "GEO-EMP-2101",
  },
  {
    id: 4, name: "Farah Khan", role: "employee", branchId: 2, position: "Operations Executive", phone: "99480 11004", email: "farah.khan@bajaj.com",
    shift: "09:00 - 18:00", joinDate: "2022-04-11", status: "Present", rating: 4.5, attendancePct: 95, tasksClosed: 289, proofRate: 100, escalations: 2,
    managerId: 8, salary: 32000, lastCheckIn: "2026-04-26 09:06", skills: ["Cash desk", "MIS", "Customer queue support"],
    emergencyContact: "Ayaan - 98765 11223", documents: ["Aadhaar", "Offer letter", "Policy sign-off"], deviceId: "GEO-EMP-2202",
  },
  {
    id: 5, name: "Lokesh Rao", role: "employee", branchId: 2, position: "Accounts Executive", phone: "99480 11005", email: "lokesh.rao@bajaj.com",
    shift: "10:00 - 19:00", joinDate: "2020-10-08", status: "Late", rating: 4.3, attendancePct: 92, tasksClosed: 377, proofRate: 100, escalations: 3,
    managerId: 8, salary: 36000, lastCheckIn: "2026-04-26 10:14", skills: ["Expense validation", "Vendor bills", "Audit notes"],
    emergencyContact: "Aruna - 98765 11224", documents: ["Aadhaar", "PAN", "Finance SOP acknowledgement"], deviceId: "GEO-EMP-2203",
  },
  {
    id: 6, name: "Harish Naik", role: "worker", branchId: 2, position: "Housekeeping Worker", phone: "99480 11006", email: "harish.naik@bajaj.com",
    shift: "07:00 - 15:00", joinDate: "2023-05-22", status: "Absent", rating: 4.2, attendancePct: 89, tasksClosed: 191, proofRate: 94, escalations: 4,
    managerId: 8, salary: 18500, lastCheckIn: "Not marked", skills: ["Lobby cleaning", "Consumables", "Washroom checks"],
    emergencyContact: "Kiran - 98765 11225", documents: ["Aadhaar", "Safety induction"], deviceId: "GEO-WK-2204",
  },
  {
    id: 7, name: "Meena Iyer", role: "am", branchId: 1, position: "Admin Assistant", phone: "99480 11007", email: "meena.iyer@bajaj.com",
    shift: "08:00 - 18:00", joinDate: "2019-01-14", status: "Present", rating: 4.9, attendancePct: 99, tasksClosed: 812, proofRate: 100, escalations: 0,
    managerId: 10, salary: 64000, lastCheckIn: "2026-04-26 08:11", skills: ["Branch ops", "Escalation control", "Shift planning"],
    emergencyContact: "Anand - 98765 11226", documents: ["Contract", "KRA file", "Bank proof"], deviceId: "GEO-AM-3101",
  },
  {
    id: 8, name: "Rakesh Babu", role: "am", branchId: 2, position: "Admin Assistant", phone: "99480 11008", email: "rakesh.babu@bajaj.com",
    shift: "08:00 - 18:00", joinDate: "2020-02-10", status: "Present", rating: 4.6, attendancePct: 97, tasksClosed: 706, proofRate: 100, escalations: 1,
    managerId: 10, salary: 61000, lastCheckIn: "2026-04-26 08:09", skills: ["People planning", "Vendor handling", "Compliance"],
    emergencyContact: "Siri - 98765 11227", documents: ["Contract", "KRA file", "Vehicle pass"], deviceId: "GEO-AM-3201",
  },
  {
    id: 9, name: "Anusha Prasad", role: "am", branchId: 3, position: "Admin Assistant", phone: "99480 11009", email: "anusha.prasad@bajaj.com",
    shift: "08:30 - 18:30", joinDate: "2021-03-19", status: "Present", rating: 4.4, attendancePct: 95, tasksClosed: 634, proofRate: 100, escalations: 3,
    managerId: 11, salary: 59000, lastCheckIn: "2026-04-26 08:42", skills: ["Issue triage", "Daily briefings", "AMC follow-up"],
    emergencyContact: "Dheeraj - 98765 11228", documents: ["Contract", "KRA file", "Safety committee record"], deviceId: "GEO-AM-3301",
  },
  {
    id: 10, name: "Vikram Nair", role: "branchManager", branchId: 1, branchScope: [1, 2], position: "Branch Manager - West Hyderabad", phone: "99480 11010", email: "vikram.nair@bajaj.com",
    shift: "09:00 - 19:00", joinDate: "2018-07-02", status: "Present", rating: 4.8, attendancePct: 100, tasksClosed: 1188, proofRate: 100, escalations: 0,
    managerId: 12, salary: 98000, lastCheckIn: "2026-04-26 09:14", skills: ["Branch strategy", "Escalations", "Vendor negotiation"],
    emergencyContact: "Nisha - 98765 11229", documents: ["Contract", "Area charter", "Company card log"], deviceId: "GEO-MG-4101",
  },
  {
    id: 11, name: "Nandini Kapoor", role: "branchManager", branchId: 3, branchScope: [3, 4], position: "Branch Manager - North Hyderabad", phone: "99480 11011", email: "nandini.kapoor@bajaj.com",
    shift: "09:00 - 19:00", joinDate: "2017-11-23", status: "Present", rating: 4.7, attendancePct: 99, tasksClosed: 1112, proofRate: 100, escalations: 1,
    managerId: 12, salary: 102000, lastCheckIn: "2026-04-26 09:04", skills: ["Performance reviews", "Ops control", "Budget approvals"],
    emergencyContact: "Amit - 98765 11230", documents: ["Contract", "Area charter", "Expense approval matrix"], deviceId: "GEO-MG-4201",
  },
  {
    id: 12, name: "Ravi Sir", role: "rm", branchId: 1, branchScope: "all", position: "Regional Manager", phone: "99480 11012", email: "ravi.rm@bajaj.com",
    shift: "09:00 - 20:00", joinDate: "2015-06-01", status: "Present", rating: 5.0, attendancePct: 100, tasksClosed: 1842, proofRate: 100, escalations: 0,
    managerId: null, salary: 156000, lastCheckIn: "2026-04-26 09:32", skills: ["Regional strategy", "Approvals", "Financial control"],
    emergencyContact: "Executive Desk - 98765 11231", documents: ["Leadership contract", "Regional SOP", "Travel policy"], deviceId: "GEO-RM-5101",
  },
];

export const TASKS: Task[] = [
  {
    id: 101, title: "Open lobby patrol with photo proof", branchId: 1, audience: "worker", schedule: "Daily", priority: "Critical", zone: "Main lobby",
    deadline: "2026-04-26T12:00:00", assignedTo: 1, assignedBy: 7, status: "Pending", checklistDone: 2, checklistTotal: 5, proofRequired: true,
    completedBy: null, completedAt: null,
    notes: "Capture shutter, visitors desk and entry camera panel in one proof set.",
    escalation: "AA in 40 mins, Branch Manager in 2 hrs", proofLabel: "Camera proof mandatory", redoReason: null,
  },
  {
    id: 102, title: "DG room temperature check", branchId: 1, audience: "worker", schedule: "Daily", priority: "High", zone: "Basement utility",
    deadline: "2026-04-26T13:30:00", assignedTo: null, assignedBy: 7, status: "In Progress", checklistDone: 1, checklistTotal: 3, proofRequired: true,
    completedBy: null, completedAt: null,
    notes: "Shared task. Any worker can close with meter photo.",
    escalation: "AA in 2 hrs", proofLabel: "Thermal reading image", redoReason: null,
  },
  {
    id: 103, title: "Consumables stock reconciliation", branchId: 2, audience: "employee", schedule: "Daily", priority: "Medium", zone: "Store room",
    deadline: "2026-04-26T17:00:00", assignedTo: 4, assignedBy: 8, status: "Pending", checklistDone: 0, checklistTotal: 4, proofRequired: false,
    completedBy: null, completedAt: null,
    notes: "Check paper rolls, sanitizer refills and visitor stationery.",
    escalation: "AA in 4 hrs", proofLabel: "Completion note", redoReason: null,
  },
  {
    id: 104, title: "Daily cash desk close checklist", branchId: 2, audience: "employee", schedule: "Daily", priority: "High", zone: "Front desk",
    deadline: "2026-04-26T18:45:00", assignedTo: 4, assignedBy: 8, status: "Revoked", checklistDone: 4, checklistTotal: 4, proofRequired: false,
    completedBy: 4, completedAt: "2026-04-26T10:02:00",
    notes: "Branch Manager asked for corrected mismatch in petty cash ledger.",
    escalation: "Branch Manager if not resubmitted by 15:00", proofLabel: "Completion note",
    redoReason: "Voucher count mismatch. Re-do with corrected closing slip.",
  },
  {
    id: 105, title: "Weekly AC vent deep clean", branchId: 1, audience: "worker", schedule: "Weekly", priority: "High", zone: "Meeting rooms",
    deadline: "2026-04-27T16:00:00", assignedTo: 2, assignedBy: 7, status: "Pending", checklistDone: 0, checklistTotal: 6, proofRequired: true,
    completedBy: null, completedAt: null,
    notes: "Need before/after photo and filter close-up.",
    escalation: "Branch Manager if missed tomorrow", proofLabel: "Before and after proof", redoReason: null,
  },
  {
    id: 106, title: "Vendor invoice cross-check", branchId: 1, audience: "employee", schedule: "Weekly", priority: "Medium", zone: "Finance desk",
    deadline: "2026-04-28T14:00:00", assignedTo: 3, assignedBy: 7, status: "Completed", checklistDone: 5, checklistTotal: 5, proofRequired: false,
    completedBy: 3, completedAt: "2026-04-25T16:22:00",
    notes: "Attach mismatch notes for finance audit.",
    escalation: "Closed", proofLabel: "Review note", redoReason: null,
  },
  {
    id: 107, title: "Fire extinguisher tag audit", branchId: 3, audience: "worker", schedule: "Weekly", priority: "Critical", zone: "All floors",
    deadline: "2026-04-26T17:30:00", assignedTo: null, assignedBy: 9, status: "Pending", checklistDone: 1, checklistTotal: 8, proofRequired: true,
    completedBy: null, completedAt: null,
    notes: "Shared task with zone-wise proof. Escalate if any expired tag found.",
    escalation: "Branch Manager within 45 mins for expired assets", proofLabel: "Expiry tag photos", redoReason: null,
  },
  {
    id: 108, title: "Visitor register digitization", branchId: 2, audience: "employee", schedule: "Weekly", priority: "Low", zone: "Admin bay",
    deadline: "2026-04-29T15:30:00", assignedTo: 4, assignedBy: 8, status: "In Progress", checklistDone: 2, checklistTotal: 5, proofRequired: false,
    completedBy: null, completedAt: null,
    notes: "Digitize pending 3 days and upload note for AA.",
    escalation: "AA review Friday", proofLabel: "Progress note", redoReason: null,
  },
];

export const COMPLAINTS: Complaint[] = [
  {
    id: 201, title: "AC not cooling in customer lounge", branchId: 1, type: "Appliance", priority: "High", status: "Pending", reportedBy: 3,
    assignedVendor: "Cool Breeze AMC", assetId: 301, estimatedCost: 18500, impact: "Customer wait area temperature above SOP",
    createdAt: "2026-04-26 09:12", description: "Lounge AC stuck at 28C. Staff moved customers twice already.", escalationStage: "AA",
    timeline: ["09:12 - Megha raised issue with image proof", "09:18 - Meena acknowledged and assigned quick inspection", "09:36 - Worker reported low gas suspicion"],
  },
  {
    id: 202, title: "Washroom plumbing leakage", branchId: 2, type: "Plumbing", priority: "Medium", status: "Escalated", reportedBy: 4,
    assignedVendor: "AquaFix Services", assetId: 304, estimatedCost: 7600, impact: "Ground floor footfall inconvenience",
    createdAt: "2026-04-25 15:44", description: "Water drip near ladies washroom utility panel. Needs same-day attention.", escalationStage: "Branch Manager",
    timeline: ["15:44 - Farah raised issue", "16:02 - Rakesh sent local worker", "17:40 - Needs external vendor due to pipe joint crack"],
  },
  {
    id: 203, title: "UPS backup dropping during billing", branchId: 3, type: "Electrical", priority: "Critical", status: "Escalated", reportedBy: 9,
    assignedVendor: "PowerSure Systems", assetId: 305, estimatedCost: 46000, impact: "Billing interruptions and queue delays",
    createdAt: "2026-04-26 08:48", description: "UPS drops after 7-8 minutes. Billing counters are unstable.", escalationStage: "RM",
    timeline: ["08:48 - Anusha marked as critical", "09:10 - Branch Manager approved emergency check", "10:05 - Vendor recommends battery bank replacement"],
  },
  {
    id: 204, title: "Door access biometric lag", branchId: 2, type: "Security", priority: "Low", status: "Resolved", reportedBy: 8,
    assignedVendor: "Safe Entry Tech", assetId: 306, estimatedCost: 2400, impact: "Minor delay in staff entry",
    createdAt: "2026-04-24 10:12", description: "Biometric device sync delay in the morning.", escalationStage: "Closed",
    timeline: ["10:12 - Issue logged", "12:08 - Vendor reset cache", "13:21 - AM verified resolved"],
  },
  {
    id: 205, title: "Fire exit light failed", branchId: 1, type: "Safety", priority: "Critical", status: "Pending", reportedBy: 1,
    assignedVendor: "Bright Grid Electricals", assetId: 303, estimatedCost: 9800, impact: "Safety compliance risk",
    createdAt: "2026-04-26 07:55", description: "Exit sign at rear staircase is not glowing after power restore.", escalationStage: "AA",
    timeline: ["07:55 - Rafiq raised issue during patrol", "08:05 - AM tagged critical due to safety impact"],
  },
];

export const APPLIANCES: Appliance[] = [
  {
    id: 301, branchId: 1, name: "Customer Lounge AC 01", category: "HVAC", zone: "Lounge", brand: "Daikin", model: "DK-CAS-400", serial: "DKH-BH-2219",
    healthScore: 72, status: "At Risk", purchaseDate: "2022-01-14", lastService: "2026-03-28", nextService: "2026-05-28", warranty: "2027-01-14",
    amcVendor: "Cool Breeze AMC", purchaseCost: 186000, approvalStatus: "Approved", pendingParts: "Gas refill kit",
  },
  {
    id: 302, branchId: 1, name: "DG Room Main Generator", category: "Power", zone: "Basement utility", brand: "Caterpillar", model: "CAT-65KVA", serial: "CAT-BH-7781",
    healthScore: 88, status: "Operational", purchaseDate: "2021-06-02", lastService: "2026-04-01", nextService: "2026-06-01", warranty: "AMC",
    amcVendor: "Prime Power Systems", purchaseCost: 455000, approvalStatus: "Approved", pendingParts: "None",
  },
  {
    id: 303, branchId: 1, name: "Rear Staircase Exit Light", category: "Safety", zone: "Emergency exit", brand: "Honeywell", model: "SAFE-LIT 8", serial: "HW-BH-1121",
    healthScore: 54, status: "Down", purchaseDate: "2021-09-17", lastService: "2026-01-08", nextService: "2026-04-27", warranty: "2026-09-17",
    amcVendor: "Bright Grid Electricals", purchaseCost: 18000, approvalStatus: "Auto-approved replacement under threshold", pendingParts: "LED module",
  },
  {
    id: 304, branchId: 2, name: "Washroom Plumbing Valve Cluster", category: "Plumbing", zone: "Ground floor washroom", brand: "Jaquar", model: "VAL-PL-2", serial: "JQ-GC-4410",
    healthScore: 61, status: "At Risk", purchaseDate: "2020-08-14", lastService: "2026-02-18", nextService: "2026-04-30", warranty: "Expired",
    amcVendor: "AquaFix Services", purchaseCost: 54000, approvalStatus: "Pending manager expense", pendingParts: "Pipe joint kit",
  },
  {
    id: 305, branchId: 3, name: "Billing UPS Cluster", category: "Electrical", zone: "Billing bay", brand: "APC", model: "UPS-12B", serial: "APC-KP-8892",
    healthScore: 42, status: "Critical", purchaseDate: "2020-11-03", lastService: "2025-12-16", nextService: "2026-04-26", warranty: "Expired",
    amcVendor: "PowerSure Systems", purchaseCost: 118000, approvalStatus: "Pending RM", pendingParts: "Battery bank",
  },
  {
    id: 306, branchId: 2, name: "Main Entry Biometric Reader", category: "Security", zone: "Entry gate", brand: "ESSL", model: "X990", serial: "ESSL-GC-1109",
    healthScore: 90, status: "Operational", purchaseDate: "2023-01-10", lastService: "2026-04-24", nextService: "2026-07-24", warranty: "2027-01-10",
    amcVendor: "Safe Entry Tech", purchaseCost: 36000, approvalStatus: "Approved", pendingParts: "None",
  },
];

export const APPROVALS: Approval[] = [
  {
    id: 401, title: "Replace UPS battery bank", kind: "Appliance", branchId: 3, amount: 46000, requestedBy: 9,
    status: "Pending", stage: "RM", priority: "Critical", age: "2 hrs", note: "Billing disruption already happening.",
  },
  {
    id: 402, title: "Washroom plumbing repair advance", kind: "Expense", branchId: 2, amount: 7600, requestedBy: 8,
    status: "Pending", stage: "Branch Manager", priority: "High", age: "17 hrs", note: "Public-facing issue, can affect branch hygiene audit.",
  },
  {
    id: 403, title: "Buy 12 fire extinguisher tags", kind: "Safety", branchId: 1, amount: 3200, requestedBy: 7,
    status: "Approved", stage: "Closed", priority: "Medium", age: "Closed", note: "Approved during morning safety review.",
  },
  {
    id: 404, title: "New front desk scanner", kind: "Capex", branchId: 2, amount: 28500, requestedBy: 8,
    status: "Rejected", stage: "Branch Manager", priority: "Low", age: "Yesterday", note: "Reuse scanner from back office.",
  },
  {
    id: 405, title: "Customer lounge AC gas refill", kind: "Appliance", branchId: 1, amount: 18500, requestedBy: 7,
    status: "Pending", stage: "Branch Manager", priority: "High", age: "54 mins", note: "Customer comfort issue during peak footfall.",
  },
];

export const VISITS: Visit[] = [
  { id: 501, branchId: 1, managerId: 10, scheduledAt: "2026-04-29 11:00", purpose: "Monthly branch review", agenda: "Audit proofs, manpower gaps, capex follow-up", status: "Scheduled", report: "Pending" },
  { id: 502, branchId: 2, managerId: 10, scheduledAt: "2026-04-30 15:30", purpose: "Issue closure inspection", agenda: "Plumbing repair validation and staffing review", status: "Scheduled", report: "Pending" },
  { id: 503, branchId: 3, managerId: 11, scheduledAt: "2026-04-27 10:30", purpose: "Critical electrical review", agenda: "UPS issue, expense decision, vendor SLA", status: "Escalated", report: "Pending" },
  { id: 504, branchId: 4, managerId: 11, scheduledAt: "2026-04-21 12:15", purpose: "Routine visit", agenda: "AMC compliance and attendance", status: "Completed", report: "Branch stable. Improve consumable stock labelling." },
];

export const NOTIFICATIONS: Notification[] = [
  {
    id: 601, title: "Photo proof missing for open lobby patrol", detail: "Task auto-escalates to AM in 40 minutes.",
    scope: ["worker", "am"], branchId: 1, priority: "Critical", read: false, bookmarked: true, time: "11 mins ago",
  },
  {
    id: 602, title: "Cash desk close was revoked", detail: "Redo task with corrected voucher slip and comment.",
    scope: ["employee"], branchId: 2, priority: "High", read: false, bookmarked: true, time: "24 mins ago",
  },
  {
    id: 603, title: "Plumbing vendor asking for approval", detail: "Expense request 402 is waiting on manager decision.",
    scope: ["branchManager", "am"], branchId: 2, priority: "High", read: false, bookmarked: false, time: "41 mins ago",
  },
  {
    id: 604, title: "Kukatpally UPS risk moved to RM queue", detail: "Critical service interruption. Review capex immediately.",
    scope: ["rm", "branchManager"], branchId: 3, priority: "Critical", read: false, bookmarked: true, time: "58 mins ago",
  },
  {
    id: 605, title: "Daily geo-attendance audit completed", detail: "2 staff marked out-of-radius this morning.",
    scope: ["am", "branchManager", "rm"], branchId: 2, priority: "Medium", read: true, bookmarked: false, time: "2 hrs ago",
  },
  {
    id: 606, title: "Monthly visit due this week", detail: "Banjara Hills and Gachibowli need visit reports.",
    scope: ["branchManager"], branchId: 1, priority: "Medium", read: true, bookmarked: false, time: "4 hrs ago",
  },
  {
    id: 607, title: "RM watchlist refreshed", detail: "3 branches fell below 90 SLA for task closure.",
    scope: ["rm"], branchId: 3, priority: "High", read: false, bookmarked: false, time: "Today",
  },
];

export const ATTENDANCE_LOG: AttendanceEntry[] = [
  { id: 701, userId: 1, date: "2026-04-26", status: "Present", checkIn: "08:02", location: "Inside geo fence - 42m", proof: "Selfie + gate camera match", deviation: "No" },
  { id: 702, userId: 2, date: "2026-04-26", status: "Present", checkIn: "09:03", location: "Inside geo fence - 58m", proof: "Selfie verified", deviation: "No" },
  { id: 703, userId: 3, date: "2026-04-26", status: "Present", checkIn: "09:24", location: "Inside geo fence - 76m", proof: "Geo + device verified", deviation: "No" },
  { id: 704, userId: 4, date: "2026-04-26", status: "Present", checkIn: "09:06", location: "Inside geo fence - 52m", proof: "Geo verified", deviation: "No" },
  { id: 705, userId: 5, date: "2026-04-26", status: "Late", checkIn: "10:14", location: "Inside geo fence - 70m", proof: "Geo verified", deviation: "Yes - 44 mins late" },
  { id: 706, userId: 6, date: "2026-04-26", status: "Absent", checkIn: "-", location: "No punch", proof: "No proof", deviation: "Yes - no attendance" },
  { id: 707, userId: 7, date: "2026-04-26", status: "Present", checkIn: "08:11", location: "Inside geo fence - 61m", proof: "Geo + selfie verified", deviation: "No" },
  { id: 708, userId: 8, date: "2026-04-26", status: "Present", checkIn: "08:09", location: "Inside geo fence - 36m", proof: "Geo + selfie verified", deviation: "No" },
  { id: 709, userId: 9, date: "2026-04-26", status: "Present", checkIn: "08:42", location: "Inside geo fence - 49m", proof: "Geo + selfie verified", deviation: "No" },
];

export const SETTINGS: AppSettings = {
  geoRadius: 180,
  workerEscalationMins: 45,
  employeeEscalationMins: 120,
  criticalAlertRule: "2 misses in 3 days",
  deadlineRule: "Auto escalate until RM if proof is missing",
};
