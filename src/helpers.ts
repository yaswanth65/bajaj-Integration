import { BRANCHES, USERS, TASKS, COMPLAINTS, APPLIANCES, APPROVALS, NOTIFICATIONS, ATTENDANCE_LOG } from "./data";
import { RoleId, Branch, User, Task, Complaint, Appliance, Approval, Notification, AttendanceEntry } from "./types";

export const TODAY = "2026-04-26";
export const NOW = "2026-04-26T11:20:00";

export const CURRENT_USER_BY_ROLE: Record<RoleId, number> = {
  worker: 1, employee: 4, am: 7, branchManager: 10, rm: 12,
};

export function currentUser(role: RoleId): User | undefined {
  return USERS.find((u) => u.id === CURRENT_USER_BY_ROLE[role]);
}

export function getBranch(id: number): Branch | undefined {
  return BRANCHES.find((b) => b.id === id);
}

export function getUser(id: number | null): User | undefined {
  if (id === null) return undefined;
  return USERS.find((u) => u.id === id);
}

export function getTask(id: number): Task | undefined {
  return TASKS.find((t) => t.id === id);
}

export function getComplaint(id: number): Complaint | undefined {
  return COMPLAINTS.find((c) => c.id === id);
}

export function getAppliance(id: number): Appliance | undefined {
  return APPLIANCES.find((a) => a.id === id);
}

export function scopedBranchIds(role: RoleId): number[] {
  const user = currentUser(role);
  if (!user) return [];
  if (role === "branchManager") return user.branchScope as number[];
  if (role === "rm") return BRANCHES.map((b) => b.id);
  return [user.branchId];
}

export function scopedBranches(role: RoleId): Branch[] {
  const ids = scopedBranchIds(role);
  return BRANCHES.filter((b) => ids.includes(b.id));
}

export function scopedUsers(role: RoleId): User[] {
  const ids = scopedBranchIds(role);
  return USERS.filter((u) => ids.includes(u.branchId) || u.id === currentUser(role)?.id);
}

export function scopedTasks(role: RoleId): Task[] {
  const ids = scopedBranchIds(role);
  return TASKS.filter((t) => ids.includes(t.branchId));
}

export function scopedComplaints(role: RoleId): Complaint[] {
  const ids = scopedBranchIds(role);
  return COMPLAINTS.filter((c) => ids.includes(c.branchId));
}

export function scopedApprovals(role: RoleId): Approval[] {
  const ids = scopedBranchIds(role);
  return APPROVALS.filter((a) => ids.includes(a.branchId));
}

export function scopedAppliances(role: RoleId): Appliance[] {
  const ids = scopedBranchIds(role);
  return APPLIANCES.filter((a) => ids.includes(a.branchId));
}

export function scopedNotifications(role: RoleId): Notification[] {
  return NOTIFICATIONS.filter((n) => n.scope.includes(role));
}

export function scopedAttendance(role: RoleId): AttendanceEntry[] {
  const ids = scopedBranchIds(role);
  return ATTENDANCE_LOG.filter((entry) => {
    const person = getUser(entry.userId);
    return person && ids.includes(person.branchId);
  });
}

export function formatMoney(value: number): string {
  return "Rs " + value.toLocaleString("en-IN");
}

export function formatPct(value: number): string {
  return value + "%";
}

export function countdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - new Date(NOW).getTime();
  if (diff <= 0) return "Overdue";
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return hrs > 0 ? hrs + "h " + rem + "m left" : rem + "m left";
}

export function toneColor(type: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    Critical: { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
    High: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
    Medium: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    Low: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
    Pending: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    "In Progress": { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
    Completed: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    Resolved: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    Escalated: { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
    Revoked: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
    Approved: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    Rejected: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
    "At Risk": { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
    Operational: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    Down: { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
    Scheduled: { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
    Closed: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
    Present: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    Late: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    Absent: { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
    Stable: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  };
  return map[type] || { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" };
}
