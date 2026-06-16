import React, { useMemo, useState, useCallback } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
} from "react-native";
import { theme } from "./src/theme";
import {
  currentUser, getBranch, getUser, scopedBranchIds, scopedBranches, scopedUsers,
  scopedTasks, scopedComplaints, scopedApprovals, scopedAppliances, scopedNotifications,
  scopedAttendance, formatMoney, formatPct, countdown, toneColor, TODAY, NOW,
} from "./src/helpers";
import {
  ROLES, BRANCHES, USERS, TASKS, COMPLAINTS, APPLIANCES, APPROVALS, VISITS, NOTIFICATIONS, ATTENDANCE_LOG, SETTINGS,
} from "./src/data";
import {
  RoleId, RolePage, Task, Complaint, Approval, Notification, Appliance, Visit, User, Branch,
} from "./src/types";

const { width: SCREEN_W } = Dimensions.get("window");

/* ─── Reusable Components ─── */

function Badge({ label, type }: { label: string; type?: string }) {
  const t = toneColor(type || label);
  return (
    <View style={[s.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[s.badgeText, { color: t.text }]}>{label}</Text>
    </View>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: pct + "%" as any, backgroundColor: color }]} />
    </View>
  );
}

function StatCard({ label, value, meta, icon, accent }: { label: string; value: string; meta: string; icon: string; accent: string }) {
  return (
    <View style={s.statCard}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={s.statLabel}>{label}</Text>
          <Text style={s.statValue}>{value}</Text>
          <Text style={s.statMeta}>{meta}</Text>
        </View>
        <View style={[s.statIconWrap, { backgroundColor: accent }]}>
          <Text style={s.statIcon}>{icon}</Text>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={s.sectionSubtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

function SegmentedControl({ value, items, onChange }: { value: string; items: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <View style={s.segmentedWrap}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable key={item.value} onPress={() => onChange(item.value)} style={[s.segmentedItem, active && s.segmentedItemActive]}>
            <Text style={[s.segmentedText, active && s.segmentedTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function QuickButton({ label, icon, onPress, tone = "primary" }: { label: string; icon: string; onPress: () => void; tone?: "primary" | "secondary" }) {
  return (
    <Pressable onPress={onPress} style={[s.quickBtn, tone === "secondary" && s.quickBtnSecondary]}>
      <Text style={[s.quickBtnText, tone === "secondary" && s.quickBtnTextSecondary]}>{icon} {label}</Text>
    </Pressable>
  );
}

function TaskCard({ task, role, compact }: { task: Task; role: RoleId; compact?: boolean }) {
  const branch = getBranch(task.branchId);
  const assignee = task.assignedTo ? getUser(task.assignedTo)?.name : "Shared";
  const pct = (task.checklistDone / task.checklistTotal) * 100;
  const barColor = task.status === "Completed" ? theme.emerald500 : theme.orange400;

  return (
    <View style={[s.card, compact && { marginBottom: 8 }]}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <Badge label={task.status} type={task.status} />
        <Badge label={task.priority} type={task.priority} />
        <Text style={s.scheduleBadge}>{task.schedule}</Text>
      </View>
      <Text style={s.cardTitle}>{task.title}</Text>
      <Text style={s.cardMeta}>{branch?.name} | {task.zone} | Assigned: {assignee}</Text>

      <View style={s.detailGrid}>
        <View style={s.detailItem}><Text style={s.detailLabel}>Deadline</Text><Text style={s.detailValue}>{countdown(task.deadline)}</Text></View>
        <View style={s.detailItem}><Text style={s.detailLabel}>Checklist</Text><Text style={s.detailValue}>{task.checklistDone}/{task.checklistTotal} items</Text></View>
        <View style={s.detailItem}><Text style={s.detailLabel}>Proof rule</Text><Text style={s.detailValue}>{task.proofLabel}</Text></View>
        <View style={s.detailItem}><Text style={s.detailLabel}>Escalation</Text><Text style={s.detailValue}>{task.escalation}</Text></View>
      </View>

      <View style={{ marginTop: 8 }}><ProgressBar value={pct} color={barColor} /></View>
      {task.redoReason && (
        <View style={s.redoBox}><Text style={s.redoText}><Text style={{ fontWeight: "700" }}>Redo note:</Text> {task.redoReason}</Text></View>
      )}
    </View>
  );
}

function ComplaintCard({ item, role }: { item: Complaint; role: RoleId }) {
  const branch = getBranch(item.branchId);
  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <Badge label={item.status} type={item.status} />
        <Badge label={item.priority} type={item.priority} />
        <Text style={s.scheduleBadge}>{item.type}</Text>
      </View>
      <Text style={s.cardTitle}>{item.title}</Text>
      <Text style={s.cardMeta}>{branch?.name} | {item.impact}</Text>

      <View style={s.detailGrid}>
        <View style={s.detailItem}><Text style={s.detailLabel}>Vendor</Text><Text style={s.detailValue}>{item.assignedVendor}</Text></View>
        <View style={s.detailItem}><Text style={s.detailLabel}>Est. Cost</Text><Text style={s.detailValue}>{formatMoney(item.estimatedCost)}</Text></View>
        <View style={s.detailItem}><Text style={s.detailLabel}>Escalation</Text><Text style={s.detailValue}>{item.escalationStage}</Text></View>
        <View style={s.detailItem}><Text style={s.detailLabel}>Raised</Text><Text style={s.detailValue}>{item.createdAt}</Text></View>
      </View>
    </View>
  );
}

function BranchCard({ branch, onPress }: { branch: Branch; onPress?: () => void }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[s.card, onPress && s.pressableCard]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={s.scheduleBadge}>{branch.code}</Text>
          <Text style={[s.cardTitle, { marginTop: 6 }]}>{branch.name}</Text>
          <Text style={s.cardMeta}>{branch.city} | {branch.staffCount} staff</Text>
        </View>
        <Badge label={branch.criticalAlerts ? branch.criticalAlerts + " alerts" : "Stable"} type={branch.criticalAlerts ? "Critical" : "Stable"} />
      </View>
      <View style={[s.detailGrid, { marginTop: 12 }]}>
        <View style={s.detailItem}><Text style={s.detailLabel}>Attendance</Text><Text style={s.detailValue}>{formatPct(branch.todayAttendance)}</Text></View>
        <View style={s.detailItem}><Text style={s.detailLabel}>SLA</Text><Text style={s.detailValue}>{formatPct(branch.sla)}</Text></View>
        <View style={s.detailItem}><Text style={s.detailLabel}>Open issues</Text><Text style={s.detailValue}>{branch.openIssues}</Text></View>
        <View style={s.detailItem}><Text style={s.detailLabel}>Visit</Text><Text style={s.detailValue}>{branch.nextVisit}</Text></View>
      </View>
    </Wrapper>
  );
}

function ApprovalCard({ item }: { item: Approval }) {
  const branch = getBranch(item.branchId);
  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <Badge label={item.status} type={item.status} />
        <Badge label={item.priority} type={item.priority} />
        <Text style={s.scheduleBadge}>{item.kind}</Text>
      </View>
      <Text style={s.cardTitle}>{item.title}</Text>
      <Text style={s.cardMeta}>{branch?.name} | {formatMoney(item.amount)} | Stage: {item.stage}</Text>
      <Text style={s.detailLabel}>Note: {item.note}</Text>
    </View>
  );
}

function NotificationCard({ item, onToggle }: { item: Notification; onToggle: () => void }) {
  const t = toneColor(item.priority);
  return (
    <Pressable onPress={onToggle} style={[s.rowLine, !item.read && { backgroundColor: theme.orange50 }]}>
      <View style={{ flex: 1 }}>
        <Text style={s.strong}>{item.priority === "Critical" || item.priority === "High" ? "🚨" : "🔔"} {item.title}</Text>
        <Text style={s.subtle}>{item.detail}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Badge label={item.read ? "Read" : "Unread"} type={item.read ? "Completed" : "Pending"} />
        <Text style={[s.subtle, { marginTop: 4 }]}>{item.time}</Text>
      </View>
    </Pressable>
  );
}

function UserRow({ user, onPress }: { user: User; onPress?: () => void }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[s.rowLine, onPress && s.pressableCard]}>
      <View style={{ flex: 1 }}>
        <Text style={s.strong}>{user.name}</Text>
        <Text style={s.subtle}>{user.position} | {user.status}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={s.strong}>{formatPct(user.attendancePct)}</Text>
        <Text style={s.subtle}>{user.tasksClosed} tasks</Text>
      </View>
    </Wrapper>
  );
}

/* ─── State Hook ─── */

function useAppState() {
  const [role, setRole] = useState<RoleId>("worker");
  const [page, setPage] = useState("home");
  const [tabs, setTabs] = useState<Record<string, string>>({
    workerTasks: "daily", employeeTasks: "daily", amTasks: "worker", amBranch: "employees",
    managerMonitoring: "workers", managerIssues: "open", approvals: "pending",
    notifications: "all", complaints: "active", rmAlerts: "critical", rmIntelligence: "performance", rmUsers: "active",
  });
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [taskList, setTaskList] = useState<Task[]>(TASKS);
  const [complaintList, setComplaintList] = useState<Complaint[]>(COMPLAINTS);
  const [approvalList, setApprovalList] = useState<Approval[]>(APPROVALS);
  const [notificationList, setNotificationList] = useState<Notification[]>(NOTIFICATIONS);
  const [attendanceList] = useState(ATTENDANCE_LOG);
  const [settings] = useState(SETTINGS);

  const roleDef = ROLES[role];
  const user = currentUser(role);
  const branchIds = useMemo(() => scopedBranchIds(role), [role]);
  const branches = useMemo(() => scopedBranches(role), [role]);
  const users = useMemo(() => scopedUsers(role), [role]);
  const tasks = useMemo(() => scopedTasks(role), [role]);
  const complaints = useMemo(() => scopedComplaints(role), [role]);
  const approvals = useMemo(() => scopedApprovals(role), [role]);
  const appliances = useMemo(() => scopedAppliances(role), [role]);
  const notifications = useMemo(() => scopedNotifications(role), [role]);
  const attendance = useMemo(() => scopedAttendance(role), [role]);

  const stats = useMemo(() => {
    const avgHealth = Math.round(BRANCHES.reduce((sum, b) => sum + b.health, 0) / BRANCHES.length);
    const avgAttendance = Math.round(BRANCHES.reduce((sum, b) => sum + b.todayAttendance, 0) / BRANCHES.length);
    const totalCritical = BRANCHES.reduce((sum, b) => sum + b.criticalAlerts, 0);
    return {
      avgHealth,
      avgAttendance,
      totalCritical,
      openTasks: taskList.filter((t) => t.status !== "Completed").length,
      activeComplaints: complaintList.filter((c) => c.status !== "Resolved").length,
      unread: notificationList.filter((n) => !n.read).length,
      pendingApprovals: approvalList.filter((a) => a.status === "Pending").length,
    };
  }, [taskList, complaintList, notificationList, approvalList]);

  const switchRole = useCallback((next: RoleId) => {
    setRole(next);
    setPage("home");
  }, []);

  const setTab = useCallback((key: string, value: string) => {
    setTabs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const markTaskDone = (id: number) => setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Completed" as const, checklistDone: t.checklistTotal, completedBy: currentUser(role)?.id ?? null, completedAt: NOW } : t)));
  const revokeTask = (id: number) => setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Revoked" as const, redoReason: "Manager requested redo with corrections." } : t)));
  const resolveComplaint = (id: number) => setComplaintList((prev) => prev.map((c) => (c.id === id ? { ...c, status: "Resolved" as const, escalationStage: "Closed" } : c)));
  const escalateComplaint = (id: number) => setComplaintList((prev) => prev.map((c) => (c.id === id ? { ...c, status: "Escalated" as const } : c)));
  const decideApproval = (id: number, status: "Approved" | "Rejected") => setApprovalList((prev) => prev.map((a) => (a.id === id ? { ...a, status, stage: status === "Approved" ? "Closed" : a.stage } : a)));
  const toggleNotification = (id: number) => setNotificationList((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  const createTask = (title: string) => setTaskList((prev) => [{
    id: Date.now(), title, branchId: user?.branchId ?? 1, audience: "worker", schedule: "Daily", priority: "Medium", zone: "General",
    deadline: "2026-04-26T18:00:00", assignedTo: null, assignedBy: user?.id ?? 1, status: "Pending", checklistDone: 0, checklistTotal: 3, proofRequired: false,
    completedBy: null, completedAt: null, notes: "", escalation: "AA in 2 hrs", proofLabel: "Completion note", redoReason: null,
  }, ...prev]);
  const createComplaint = (title: string) => setComplaintList((prev) => [{
    id: Date.now(), title, branchId: user?.branchId ?? 1, type: "General", priority: "High", status: "Pending", reportedBy: user?.id ?? 1,
    assignedVendor: "TBD", assetId: 0, estimatedCost: 0, impact: "Branch operations", createdAt: "2026-04-26 11:20", description: title,
    escalationStage: "AA", timeline: ["11:20 - Issue raised"],
  }, ...prev]);

  return {
    role, page, roleDef, user, branchIds, branches, users, tasks, complaints, approvals, appliances, notifications, attendance,
    stats, tabs, roleModalOpen, search, taskList, complaintList, approvalList, notificationList, attendanceList, settings,
    setPage, switchRole, setTab, setRoleModalOpen, setSearch,
    markTaskDone, revokeTask, resolveComplaint, escalateComplaint, decideApproval, toggleNotification, createTask, createComplaint,
  };
}

/* ─── Screens ─── */

function WorkerHome({ state }: { state: ReturnType<typeof useAppState> }) {
  const user = state.user!;
  const branch = getBranch(user.branchId)!;
  const ownTasks = state.tasks.filter((t) => t.branchId === user.branchId && t.audience === "worker" && (!t.assignedTo || t.assignedTo === user.id)).slice(0, 3);
  return (
    <>
      <SectionHeader title="Worker command desk" subtitle={`Fast actions, proof deadlines, and branch alerts for ${branch.name}`}>
        <QuickButton label="Mark Attendance" icon="📍" onPress={() => {}} tone="primary" />
        <QuickButton label="Raise Issue" icon="➕" onPress={() => {}} tone="secondary" />
      </SectionHeader>
      <View style={s.statsRow}>
        <StatCard label="Today's proof tasks" value={String(ownTasks.length)} meta="1 critical task missing proof" icon="📷" accent={theme.orange500} />
        <StatCard label="Attendance status" value="Inside fence" meta={`${branch.geoRadius}m policy, selfie matched`} icon="🎯" accent={theme.emerald500} />
        <StatCard label="Open alerts" value="2" meta="Fire exit light and lounge AC" icon="⚠️" accent={theme.red} />
        <StatCard label="This month" value={formatPct(user.attendancePct)} meta={`Task proof closure ${formatPct(user.proofRate)}`} icon="🏅" accent={theme.navy} />
      </View>

      <View style={s.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={s.scheduleBadge}>LIVE QUEUE</Text>
            <Text style={[s.cardTitle, { marginTop: 4 }]}>Today's worker tasks</Text>
          </View>
          <Pressable onPress={() => state.setPage("tasks")} style={s.smallBtn}><Text style={s.smallBtnText}>Open all tasks</Text></Pressable>
        </View>
        {ownTasks.map((task) => (<TaskCard key={task.id} task={task} role={state.role} compact />))}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Proof escalation ladder</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <View style={[s.ladderBox, { backgroundColor: theme.orange50 }]}><Text style={{ color: theme.orange600, fontWeight: "700" }}>Worker</Text><Text style={{ color: theme.orange600, fontSize: 12 }}>Submit geo proof or task stays pending.</Text></View>
          <View style={[s.ladderBox, { backgroundColor: theme.emerald50 }]}><Text style={{ color: theme.emerald700, fontWeight: "700" }}>AA</Text><Text style={{ color: theme.emerald700, fontSize: 12 }}>Gets notified once deadline risk starts.</Text></View>
          <View style={[s.ladderBox, { backgroundColor: theme.blue50 }]}><Text style={{ color: theme.blue700, fontWeight: "700" }}>Branch Manager</Text><Text style={{ color: theme.blue700, fontSize: 12 }}>Reviews repeated misses and calls branch.</Text></View>
          <View style={[s.ladderBox, { backgroundColor: theme.rose50 }]}><Text style={{ color: theme.rose700, fontWeight: "700" }}>RM</Text><Text style={{ color: theme.rose700, fontSize: 12 }}>Only for safety, audit or repeated failures.</Text></View>
        </View>
      </View>

      <View style={[s.card, { backgroundColor: theme.navy }]}>
        <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.7)" }}>COUNTDOWN FOCUS</Text>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 6 }}>{countdown(ownTasks[0]?.deadline || NOW)}</Text>
        <Text style={{ color: theme.slate300, fontSize: 13, marginTop: 6 }}>Open lobby patrol will escalate if photo proof is not uploaded on time.</Text>
        <Pressable style={[s.quickBtn, { backgroundColor: "#fff", marginTop: 12 }]}><Text style={[s.quickBtnText, { color: theme.navy }]}>Submit proof now</Text></Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Alerts from branch head</Text>
        <View style={[s.alertBox, { backgroundColor: theme.rose50 }]}><Text style={{ color: theme.rose700, fontSize: 13 }}>Rear exit light failed. Patrol must recheck every 90 minutes until fixed.</Text></View>
        <View style={[s.alertBox, { backgroundColor: theme.orange50 }]}><Text style={{ color: theme.orange600, fontSize: 13 }}>Customer lounge AC complaint waiting for quick inspection image.</Text></View>
        <View style={[s.alertBox, { backgroundColor: theme.blue50 }]}><Text style={{ color: theme.blue700, fontSize: 13 }}>Tomorrow at 08:30 there is a safety briefing with Meena.</Text></View>
      </View>
    </>
  );
}

function EmployeeHome({ state }: { state: ReturnType<typeof useAppState> }) {
  const user = state.user!;
  const ownTasks = state.tasks.filter((t) => t.branchId === user.branchId && t.audience === "employee" && t.assignedTo === user.id);
  const revoked = ownTasks.filter((t) => t.status === "Revoked").length;
  return (
    <>
      <SectionHeader title="Employee operations desk" subtitle={`Daily tasks, revocation notes, and issue tracking for ${getBranch(user.branchId)?.name}`}>
        <QuickButton label="Mark Attendance" icon="📍" onPress={() => {}} tone="primary" />
        <QuickButton label="Raise Issue" icon="➕" onPress={() => {}} tone="secondary" />
      </SectionHeader>
      <View style={s.statsRow}>
        <StatCard label="Assigned tasks" value={String(ownTasks.length)} meta={`${revoked} task(s) need redo`} icon="✅" accent={theme.blue500} />
        <StatCard label="Attendance" value={formatPct(user.attendancePct)} meta={`Today status: ${user.status}`} icon="🖐" accent={theme.emerald500} />
        <StatCard label="Issue tracker" value={String(state.complaints.filter((c) => c.reportedBy === user.id).length)} meta="Active issues linked to your branch" icon="⚠️" accent={theme.orange500} />
        <StatCard label="Branch Manager comments" value={revoked ? String(revoked) : "Clean"} meta={revoked ? "Open latest revoke note now" : "No rework comments today"} icon="💬" accent={theme.navy} />
      </View>

      <View style={s.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={s.cardTitle}>Priority tasks</Text>
            <Text style={s.cardMeta}>Employee tasks do not need image proof, but AM can revoke with comments.</Text>
          </View>
          <Pressable onPress={() => state.setPage("tasks")} style={s.smallBtn}><Text style={s.smallBtnText}>Open task board</Text></Pressable>
        </View>
        {ownTasks.slice(0, 3).map((task) => (<TaskCard key={task.id} task={task} role={state.role} compact />))}
      </View>

      <View style={[s.card, { backgroundColor: theme.brand }]}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>Redo watch</Text>
        <Text style={{ color: "#fff", fontSize: 13, opacity: 0.9, marginTop: 6 }}>If a manager revokes your completion, the task comes back with a reason and new deadline.</Text>
        {ownTasks.filter((t) => t.status === "Revoked").map((t) => (
          <View key={t.id} style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.15)", padding: 12, borderRadius: 16 }}>
            <Text style={{ color: "#fff", fontSize: 13 }}>{t.title}</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>{t.redoReason}</Text>
          </View>
        )) || <View style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.15)", padding: 12, borderRadius: 16 }}><Text style={{ color: "#fff", fontSize: 13 }}>No revoked tasks right now.</Text></View>}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Micro detail</Text>
        <View style={s.rowLine}><Text style={s.subtle}>Last geo punch</Text><Text style={s.strong}>{user.lastCheckIn}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Device ID</Text><Text style={s.strong}>{user.deviceId}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Supervisor</Text><Text style={s.strong}>{getUser(user.managerId)?.name}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Current shift</Text><Text style={s.strong}>{user.shift}</Text></View>
      </View>
    </>
  );
}

function AmHome({ state }: { state: ReturnType<typeof useAppState> }) {
  const branch = getBranch(state.user!.branchId)!;
  const branchTasks = state.tasks.filter((t) => t.branchId === branch.id);
  const openIssues = state.complaints.filter((c) => c.branchId === branch.id && c.status !== "Resolved");
  const tab = state.tabs.amTasks || "worker";
  const tabItems = [{ label: "Worker flow", value: "worker" }, { label: "Employee flow", value: "employee" }, { label: "Templates", value: "templates" }];
  const tabTasks = tab === "templates" ? [] : branchTasks.filter((t) => t.audience === tab);

  return (
    <>
      <SectionHeader title="Branch command center" subtitle={`${branch.name} branch head dashboard with quick ops control, issue triage and staffing health`}>
        <QuickButton label="Create Task" icon="➕" onPress={() => {}} tone="primary" />
        <QuickButton label="Add Staff" icon="👤" onPress={() => {}} tone="secondary" />
        <QuickButton label="Add Appliance" icon="🔌" onPress={() => {}} tone="secondary" />
      </SectionHeader>
      <View style={s.statsRow}>
        <StatCard label="Branch health" value={formatPct(branch.health)} meta={`Audit ${formatPct(branch.auditScore)} | SLA ${formatPct(branch.sla)}`} icon="❤️" accent={theme.emerald500} />
        <StatCard label="Pending tasks" value={String(branchTasks.filter((t) => t.status !== "Completed").length)} meta="Worker and employee queues combined" icon="✅" accent={theme.blue500} />
        <StatCard label="Open complaints" value={String(openIssues.length)} meta={`${branch.criticalAlerts} critical alert(s) live`} icon="🔧" accent={theme.orange500} />
        <StatCard label="Budget burn" value={formatMoney(branch.usedBudget)} meta={`of ${formatMoney(branch.monthlyBudget)}`} icon="💰" accent={theme.navy} />
      </View>

      <View style={s.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <Text style={s.cardTitle}>Action queue</Text>
          <SegmentedControl value={tab} items={tabItems} onChange={(v) => state.setTab("amTasks", v)} />
        </View>
        {tab === "templates" ? (
          <Text style={s.panelText}>Task templates for recurring branch operations will appear here.</Text>
        ) : (
          tabTasks.slice(0, 4).map((task) => (<TaskCard key={task.id} task={task} role={state.role} compact />))
        )}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Branch watchlist</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <View style={[s.ladderBox, { backgroundColor: theme.rose50 }]}><Text style={{ color: theme.rose700, fontWeight: "700" }}>Safety risk</Text><Text style={{ color: theme.rose700, fontSize: 12 }}>Rear exit light still down. Keep manual patrol log until repair closes.</Text></View>
          <View style={[s.ladderBox, { backgroundColor: theme.amber50 }]}><Text style={{ color: theme.amber500, fontWeight: "700" }}>Attendance deviation</Text><Text style={{ color: theme.amber500, fontSize: 12 }}>Lokesh marked late and Harish still absent in Gachibowli-type scenario for comparison.</Text></View>
          <View style={[s.ladderBox, { backgroundColor: theme.emerald50 }]}><Text style={{ color: theme.emerald700, fontWeight: "700" }}>Quick win</Text><Text style={{ color: theme.emerald700, fontSize: 12 }}>Audit score improved because last three proof tasks closed before SLA.</Text></View>
          <View style={[s.ladderBox, { backgroundColor: theme.blue50 }]}><Text style={{ color: theme.blue700, fontWeight: "700" }}>Branch Manager note</Text><Text style={{ color: theme.blue700, fontSize: 12 }}>Visit due on {branch.nextVisit}. Keep appliance logs updated before inspection.</Text></View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Staff pulse</Text>
        {state.users.filter((u) => ["worker", "employee"].includes(u.role)).slice(0, 5).map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Pending appliance approvals</Text>
        {state.appliances.filter((a) => a.approvalStatus.includes("Pending") || a.status === "At Risk" || a.status === "Critical").map((a) => (
          <View key={a.id} style={s.rowLine}>
            <View style={{ flex: 1 }}>
              <Text style={s.strong}>{a.name}</Text>
              <Text style={s.subtle}>{a.zone} | {a.pendingParts}</Text>
            </View>
            <Badge label={a.status} type={a.status} />
          </View>
        ))}
      </View>
    </>
  );
}

function BranchManagerHome({ state }: { state: ReturnType<typeof useAppState> }) {
  const branchList = state.branches;
  const totalBudget = branchList.reduce((sum, b) => sum + b.monthlyBudget, 0);
  const totalUsed = branchList.reduce((sum, b) => sum + b.usedBudget, 0);
  const visitQueue = VISITS.filter((v) => state.user?.branchScope && Array.isArray(state.user.branchScope) && state.user.branchScope.includes(v.branchId));

  return (
    <>
      <SectionHeader title="Multi-branch overview" subtitle="Critical alerts, branch comparison and upcoming visits across your territory">
        <QuickButton label="Schedule Visit" icon="📅" onPress={() => {}} tone="primary" />
        <QuickButton label="Review Approvals" icon="📝" onPress={() => state.setPage("approvals")} tone="secondary" />
      </SectionHeader>
      <View style={s.statsRow}>
        <StatCard label="Branches in scope" value={String(branchList.length)} meta={`Coverage under ${state.user?.name}`} icon="🏢" accent={theme.orange500} />
        <StatCard label="Critical issues" value={String(branchList.reduce((sum, b) => sum + b.criticalAlerts, 0))} meta="Safety, appliance and SLA exceptions" icon="⚠️" accent={theme.red} />
        <StatCard label="Budget used" value={formatMoney(totalUsed)} meta={`of ${formatMoney(totalBudget)}`} icon="💰" accent={theme.navy} />
        <StatCard label="Visit queue" value={String(visitQueue.filter((v) => v.status !== "Completed").length)} meta="Two reports still pending" icon="🛣️" accent={theme.blue500} />
      </View>

      <View style={s.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={s.cardTitle}>Branch comparison snapshot</Text>
            <Text style={s.cardMeta}>Click any branch for deeper operational, financial and staffing detail.</Text>
          </View>
          <Pressable onPress={() => state.setPage("branches")} style={s.smallBtn}><Text style={s.smallBtnText}>Open branch detail</Text></Pressable>
        </View>
        {branchList.map((branch) => (<BranchCard key={branch.id} branch={branch} />))}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Branch Manager watchlist</Text>
        <View style={[s.alertBox, { backgroundColor: theme.rose50 }]}><Text style={{ color: theme.rose700, fontSize: 13 }}>Kukatpally has RM-level UPS risk and needs a same-day decision.</Text></View>
        <View style={[s.alertBox, { backgroundColor: theme.orange50 }]}><Text style={{ color: theme.orange600, fontSize: 13 }}>Gachibowli budget burn is already at 79.8% for the month.</Text></View>
        <View style={[s.alertBox, { backgroundColor: theme.blue50 }]}><Text style={{ color: theme.blue700, fontSize: 13 }}>Banjara Hills is stable but has one safety alert still open.</Text></View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Upcoming visits</Text>
        {visitQueue.map((item) => (
          <View key={item.id} style={s.rowLine}>
            <View style={{ flex: 1 }}>
              <Text style={s.strong}>{getBranch(item.branchId)?.name}</Text>
              <Text style={s.subtle}>{item.purpose}</Text>
            </View>
            <Badge label={item.status} type={item.status} />
          </View>
        ))}
      </View>
    </>
  );
}

function RmDashboard({ state }: { state: ReturnType<typeof useAppState> }) {
  const totalCritical = BRANCHES.reduce((sum, b) => sum + b.criticalAlerts, 0);
  const avgHealth = Math.round(BRANCHES.reduce((sum, b) => sum + b.health, 0) / BRANCHES.length);
  const avgAttendance = Math.round(BRANCHES.reduce((sum, b) => sum + b.todayAttendance, 0) / BRANCHES.length);

  return (
    <>
      <SectionHeader title="Regional dashboard" subtitle="Global branch health, priority alerts, financial exposure and decision-ready intelligence">
        <QuickButton label="Open approvals" icon="📝" onPress={() => state.setPage("approvals")} tone="primary" />
        <QuickButton label="User control" icon="👥" onPress={() => state.setPage("users")} tone="secondary" />
      </SectionHeader>
      <View style={s.statsRow}>
        <StatCard label="Branch health" value={formatPct(avgHealth)} meta="Regional weighted score" icon="❤️" accent={theme.emerald500} />
        <StatCard label="Attendance average" value={formatPct(avgAttendance)} meta="Across all active offices" icon="📍" accent={theme.blue500} />
        <StatCard label="Critical alerts" value={String(totalCritical)} meta="Immediate RM queue items" icon="⚠️" accent={theme.red} />
        <StatCard label="Open approvals" value={String(state.approvalList.filter((a) => a.status === "Pending").length)} meta="High-cost and risk-sensitive requests" icon="📝" accent={theme.navy} />
      </View>

      <View style={s.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View>
            <Text style={s.cardTitle}>Branch health board</Text>
            <Text style={s.cardMeta}>High-level view with performance, alert pressure and budget health.</Text>
          </View>
          <Pressable onPress={() => state.setPage("intelligence")} style={s.smallBtn}><Text style={s.smallBtnText}>Open intelligence</Text></Pressable>
        </View>
        {BRANCHES.map((branch) => (
          <View key={branch.id} style={s.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
              <View style={{ flex: 1 }}>
                <Text style={s.scheduleBadge}>{branch.code}</Text>
                <Text style={[s.cardTitle, { marginTop: 4 }]}>{branch.name}</Text>
                <Text style={s.cardMeta}>{branch.city} | Revenue index {branch.revenueIndex}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Badge label={branch.criticalAlerts + " critical"} type={branch.criticalAlerts ? "Critical" : "Completed"} />
                <Badge label={"Audit " + branch.auditScore} type={branch.auditScore < 90 ? "High" : "Completed"} />
              </View>
            </View>
            <View style={[s.detailGrid, { marginTop: 12 }]}>
              <View style={s.detailItem}><Text style={s.detailLabel}>Health</Text><Text style={s.detailValue}>{formatPct(branch.health)}</Text></View>
              <View style={s.detailItem}><Text style={s.detailLabel}>Performance</Text><Text style={s.detailValue}>{formatPct(branch.performance)}</Text></View>
              <View style={s.detailItem}><Text style={s.detailLabel}>Attendance</Text><Text style={s.detailValue}>{formatPct(branch.todayAttendance)}</Text></View>
              <View style={s.detailItem}><Text style={s.detailLabel}>Budget</Text><Text style={s.detailValue}>{formatMoney(branch.usedBudget)}</Text></View>
            </View>
            <View style={{ marginTop: 8 }}><ProgressBar value={branch.health} color={branch.health > 85 ? theme.emerald500 : branch.health > 70 ? theme.orange400 : theme.red} /></View>
          </View>
        ))}
      </View>
    </>
  );
}

/* ─── Sub Pages ─── */

function TasksPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const tab = state.tabs.workerTasks || "daily";
  const items = state.tasks.filter((t) => t.schedule.toLowerCase() === (tab === "daily" ? "daily" : "weekly"));
  return (
    <>
      <SectionHeader title="Task Board" subtitle="All tasks in your scope with deadlines, proof rules and escalation status">
        <SegmentedControl value={tab} items={[{ label: "Daily", value: "daily" }, { label: "Weekly", value: "weekly" }]} onChange={(v) => state.setTab("workerTasks", v)} />
      </SectionHeader>
      {items.map((task) => (
        <TaskCard key={task.id} task={task} role={state.role} />
      ))}
    </>
  );
}

function ComplaintsPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const tab = state.tabs.complaints || "active";
  const items = tab === "active" ? state.complaints.filter((c) => c.status !== "Resolved") : state.complaints.filter((c) => c.status === "Resolved");
  return (
    <>
      <SectionHeader title="Complaint Tracker" subtitle="Active and resolved complaints with vendor, cost and timeline">
        <SegmentedControl value={tab} items={[{ label: "Active", value: "active" }, { label: "Resolved", value: "resolved" }]} onChange={(v) => state.setTab("complaints", v)} />
      </SectionHeader>
      {items.map((item) => (
        <ComplaintCard key={item.id} item={item} role={state.role} />
      ))}
    </>
  );
}

function AttendancePage({ state }: { state: ReturnType<typeof useAppState> }) {
  return (
    <>
      <SectionHeader title="Attendance Monitor" subtitle="Geo-verified punch logs, deviations and proof for today" />
      <View style={s.statsRow}>
        <StatCard label="Present" value={String(state.attendance.filter((a) => a.status === "Present").length)} meta="On time today" icon="✅" accent={theme.emerald500} />
        <StatCard label="Late" value={String(state.attendance.filter((a) => a.status === "Late").length)} meta="Deviation flagged" icon="⏰" accent={theme.orange500} />
        <StatCard label="Absent" value={String(state.attendance.filter((a) => a.status === "Absent").length)} meta="No punch recorded" icon="❌" accent={theme.red} />
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Today's attendance log</Text>
        {state.attendance.map((entry) => {
          const person = getUser(entry.userId);
          return (
            <View key={entry.id} style={s.rowLine}>
              <View style={{ flex: 1 }}>
                <Text style={s.strong}>{person?.name}</Text>
                <Text style={s.subtle}>{entry.location} | {entry.proof}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Badge label={entry.status} type={entry.status} />
                <Text style={[s.subtle, { marginTop: 4 }]}>{entry.checkIn}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

function NotificationsPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const tab = state.tabs.notifications || "all";
  const items = tab === "all" ? state.notifications : tab === "unread" ? state.notifications.filter((n) => !n.read) : state.notifications.filter((n) => n.bookmarked);
  return (
    <>
      <SectionHeader title="Notifications" subtitle="Alerts, escalations and system messages scoped to your role">
        <SegmentedControl value={tab} items={[{ label: "All", value: "all" }, { label: "Unread", value: "unread" }, { label: "Bookmarked", value: "bookmarked" }]} onChange={(v) => state.setTab("notifications", v)} />
      </SectionHeader>
      {items.map((item) => (
        <NotificationCard key={item.id} item={item} onToggle={() => state.toggleNotification(item.id)} />
      ))}
    </>
  );
}

function ProfilePage({ state }: { state: ReturnType<typeof useAppState> }) {
  const user = state.user!;
  const manager = getUser(user.managerId);
  return (
    <>
      <SectionHeader title="Profile & Settings" subtitle="Role permissions, branch scope, and account details" />
      <View style={[s.card, { backgroundColor: theme.navy, alignItems: "center", paddingVertical: 28 }]}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 28, fontWeight: "900", color: theme.navy }}>{user.name.charAt(0)}</Text>
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 12 }}>{user.name}</Text>
        <Text style={{ color: theme.slate300, fontSize: 14 }}>{user.position}</Text>
        <Badge label={state.roleDef.name} type="Completed" />
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Contact & work</Text>
        <View style={s.rowLine}><Text style={s.subtle}>Phone</Text><Text style={s.strong}>{user.phone}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Email</Text><Text style={s.strong}>{user.email}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Shift</Text><Text style={s.strong}>{user.shift}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Join date</Text><Text style={s.strong}>{user.joinDate}</Text></View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Performance</Text>
        <View style={s.rowLine}><Text style={s.subtle}>Rating</Text><Text style={s.strong}>{user.rating}/5.0</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Attendance</Text><Text style={s.strong}>{formatPct(user.attendancePct)}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Tasks closed</Text><Text style={s.strong}>{user.tasksClosed}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Proof rate</Text><Text style={s.strong}>{formatPct(user.proofRate)}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Escalations</Text><Text style={s.strong}>{user.escalations}</Text></View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Supervisor</Text>
        <View style={s.rowLine}><Text style={s.subtle}>Manager</Text><Text style={s.strong}>{manager?.name || "N/A"}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Emergency contact</Text><Text style={s.strong}>{user.emergencyContact}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Device ID</Text><Text style={s.strong}>{user.deviceId}</Text></View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Skills</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {user.skills.map((skill) => <Badge key={skill} label={skill} type="Completed" />)}
        </View>
      </View>
    </>
  );
}

function BranchHubPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const branch = getBranch(state.user!.branchId)!;
  const staff = state.users.filter((u) => u.branchId === branch.id);
  return (
    <>
      <SectionHeader title="Branch Hub" subtitle={`${branch.name} operational control center`}>
        <QuickButton label="Edit Branch" icon="✏️" onPress={() => {}} tone="secondary" />
      </SectionHeader>
      <View style={s.statsRow}>
        <StatCard label="Health" value={formatPct(branch.health)} meta="Overall branch score" icon="❤️" accent={theme.emerald500} />
        <StatCard label="Staff" value={String(branch.staffCount)} meta={`${branch.workerCount} workers, ${branch.employeeCount} employees`} icon="👥" accent={theme.blue500} />
        <StatCard label="Budget" value={formatMoney(branch.usedBudget)} meta={`of ${formatMoney(branch.monthlyBudget)}`} icon="💰" accent={theme.navy} />
        <StatCard label="Issues" value={String(branch.openIssues)} meta={`${branch.criticalAlerts} critical`} icon="⚠️" accent={theme.red} />
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Branch details</Text>
        <View style={s.rowLine}><Text style={s.subtle}>Address</Text><Text style={s.strong}>{branch.address}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Phone</Text><Text style={s.strong}>{branch.phone}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Email</Text><Text style={s.strong}>{branch.email}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Geo radius</Text><Text style={s.strong}>{branch.geoRadius}m</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Shift window</Text><Text style={s.strong}>{branch.shiftWindow}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Last visit</Text><Text style={s.strong}>{branch.lastVisit}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Next visit</Text><Text style={s.strong}>{branch.nextVisit}</Text></View>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Staff list</Text>
        {staff.map((u) => <UserRow key={u.id} user={u} />)}
      </View>
    </>
  );
}

function BranchesPage({ state }: { state: ReturnType<typeof useAppState> }) {
  return (
    <>
      <SectionHeader title="Branches" subtitle="Detailed branch listings with health, budget and staffing" />
      {state.branches.map((branch) => <BranchCard key={branch.id} branch={branch} />)}
    </>
  );
}

function MonitoringPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const tab = state.tabs.managerMonitoring || "workers";
  const items = tab === "workers" ? state.tasks.filter((t) => t.audience === "worker") : state.tasks.filter((t) => t.audience === "employee");
  return (
    <>
      <SectionHeader title="Task Monitor" subtitle="Track worker and employee task completion, proof and SLA">
        <SegmentedControl value={tab} items={[{ label: "Workers", value: "workers" }, { label: "Employees", value: "employees" }]} onChange={(v) => state.setTab("managerMonitoring", v)} />
      </SectionHeader>
      {items.map((task) => <TaskCard key={task.id} task={task} role={state.role} />)}
    </>
  );
}

function IssuesPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const tab = state.tabs.managerIssues || "open";
  const items = tab === "open" ? state.complaints.filter((c) => c.status !== "Resolved") : state.complaints;
  return (
    <>
      <SectionHeader title="Issues" subtitle="Branch complaints, escalations and resolution tracking">
        <SegmentedControl value={tab} items={[{ label: "Open", value: "open" }, { label: "All", value: "all" }]} onChange={(v) => state.setTab("managerIssues", v)} />
      </SectionHeader>
      {items.map((item) => <ComplaintCard key={item.id} item={item} role={state.role} />)}
    </>
  );
}

function ApprovalsPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const tab = state.tabs.approvals || "pending";
  const items = tab === "pending" ? state.approvals.filter((a) => a.status === "Pending") : state.approvals;
  return (
    <>
      <SectionHeader title="Approvals" subtitle="Expense, capex and safety approvals with stage tracking">
        <SegmentedControl value={tab} items={[{ label: "Pending", value: "pending" }, { label: "All", value: "all" }]} onChange={(v) => state.setTab("approvals", v)} />
      </SectionHeader>
      {items.map((item) => (
        <View key={item.id}>
          <ApprovalCard item={item} />
          {item.status === "Pending" && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: -8, marginBottom: 16, paddingHorizontal: 4 }}>
              <Pressable onPress={() => state.decideApproval(item.id, "Approved")} style={[s.actionBtn, { flex: 1 }]}><Text style={s.actionBtnText}>Approve</Text></Pressable>
              <Pressable onPress={() => state.decideApproval(item.id, "Rejected")} style={[s.actionBtnAlt, { flex: 1 }]}><Text style={s.actionBtnTextAlt}>Reject</Text></Pressable>
            </View>
          )}
        </View>
      ))}
    </>
  );
}

function VisitsPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const items = VISITS.filter((v) => state.branchIds.includes(v.branchId));
  return (
    <>
      <SectionHeader title="Visits" subtitle="Scheduled, completed and escalated branch visits" />
      {items.map((item) => (
        <View key={item.id} style={s.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{getBranch(item.branchId)?.name}</Text>
              <Text style={s.cardMeta}>{item.purpose}</Text>
              <Text style={s.cardMeta}>{item.agenda}</Text>
            </View>
            <Badge label={item.status} type={item.status} />
          </View>
          <View style={s.rowLine}><Text style={s.subtle}>Scheduled</Text><Text style={s.strong}>{item.scheduledAt}</Text></View>
          {item.report && item.report !== "Pending" && <View style={[s.alertBox, { backgroundColor: theme.emerald50 }]}><Text style={{ color: theme.emerald700, fontSize: 13 }}>{item.report}</Text></View>}
        </View>
      ))}
    </>
  );
}

function IntelligencePage({ state }: { state: ReturnType<typeof useAppState> }) {
  const tab = state.tabs.rmIntelligence || "performance";
  return (
    <>
      <SectionHeader title="Branch Intelligence" subtitle="Performance metrics, revenue indices and operational health">
        <SegmentedControl value={tab} items={[{ label: "Performance", value: "performance" }, { label: "Budget", value: "budget" }, { label: "Staffing", value: "staffing" }]} onChange={(v) => state.setTab("rmIntelligence", v)} />
      </SectionHeader>
      {state.branches.map((branch) => (
        <View key={branch.id} style={s.card}>
          <Text style={s.cardTitle}>{branch.name}</Text>
          <View style={s.detailGrid}>
            <View style={s.detailItem}><Text style={s.detailLabel}>Health</Text><Text style={s.detailValue}>{formatPct(branch.health)}</Text></View>
            <View style={s.detailItem}><Text style={s.detailLabel}>Performance</Text><Text style={s.detailValue}>{formatPct(branch.performance)}</Text></View>
            <View style={s.detailItem}><Text style={s.detailLabel}>Revenue Index</Text><Text style={s.detailValue}>{branch.revenueIndex}</Text></View>
            <View style={s.detailItem}><Text style={s.detailLabel}>Footfall</Text><Text style={s.detailValue}>{branch.customerFootfall}</Text></View>
          </View>
        </View>
      ))}
    </>
  );
}

function AlertsPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const tab = state.tabs.rmAlerts || "critical";
  const items = tab === "critical" ? state.notifications.filter((n) => n.priority === "Critical") : state.notifications.filter((n) => n.priority === "High");
  return (
    <>
      <SectionHeader title="Alert Center" subtitle="Critical and high priority alerts requiring RM attention">
        <SegmentedControl value={tab} items={[{ label: "Critical", value: "critical" }, { label: "High", value: "high" }]} onChange={(v) => state.setTab("rmAlerts", v)} />
      </SectionHeader>
      {items.map((item) => <NotificationCard key={item.id} item={item} onToggle={() => state.toggleNotification(item.id)} />)}
    </>
  );
}

function FinancePage({ state }: { state: ReturnType<typeof useAppState> }) {
  const totalBudget = BRANCHES.reduce((sum, b) => sum + b.monthlyBudget, 0);
  const totalUsed = BRANCHES.reduce((sum, b) => sum + b.usedBudget, 0);
  const totalPending = state.approvals.filter((a) => a.status === "Pending").reduce((sum, a) => sum + a.amount, 0);
  return (
    <>
      <SectionHeader title="Issues & Costs" subtitle="Financial exposure across branches, pending approvals and cost analysis" />
      <View style={s.statsRow}>
        <StatCard label="Total budget" value={formatMoney(totalBudget)} meta="Monthly across all branches" icon="💰" accent={theme.navy} />
        <StatCard label="Used" value={formatMoney(totalUsed)} meta={`${formatPct(Math.round((totalUsed / totalBudget) * 100))} utilized`} icon="📉" accent={theme.orange500} />
        <StatCard label="Pending approvals" value={formatMoney(totalPending)} meta="Awaiting RM/Manager decision" icon="📝" accent={theme.red} />
      </View>
      {state.approvals.map((item) => <ApprovalCard key={item.id} item={item} />)}
    </>
  );
}

function AnalyticsPage({ state }: { state: ReturnType<typeof useAppState> }) {
  return (
    <>
      <SectionHeader title="Analytics" subtitle="Trends, completion rates and operational KPIs" />
      <View style={s.statsRow}>
        <StatCard label="Avg health" value={formatPct(Math.round(BRANCHES.reduce((s, b) => s + b.health, 0) / BRANCHES.length))} meta="Regional average" icon="❤️" accent={theme.emerald500} />
        <StatCard label="Avg attendance" value={formatPct(Math.round(BRANCHES.reduce((s, b) => s + b.todayAttendance, 0) / BRANCHES.length))} meta="Today" icon="📍" accent={theme.blue500} />
        <StatCard label="Tasks completed" value={String(state.taskList.filter((t) => t.status === "Completed").length)} meta="This period" icon="✅" accent={theme.teal500} />
        <StatCard label="Complaints" value={String(state.complaintList.filter((c) => c.status !== "Resolved").length)} meta="Open" icon="⚠️" accent={theme.red} />
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Branch comparison</Text>
        {BRANCHES.map((b) => (
          <View key={b.id} style={s.rowLine}>
            <Text style={s.strong}>{b.name}</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Text style={s.subtle}>H: {formatPct(b.health)}</Text>
              <Text style={s.subtle}>A: {formatPct(b.todayAttendance)}</Text>
              <Text style={s.subtle}>R: {b.revenueIndex}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function UsersPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const tab = state.tabs.rmUsers || "active";
  const items = tab === "active" ? USERS.filter((u) => u.status === "Present") : USERS;
  return (
    <>
      <SectionHeader title="Users" subtitle="All personnel across branches with roles, attendance and performance">
        <SegmentedControl value={tab} items={[{ label: "Active", value: "active" }, { label: "All", value: "all" }]} onChange={(v) => state.setTab("rmUsers", v)} />
      </SectionHeader>
      {items.map((u) => <UserRow key={u.id} user={u} />)}
    </>
  );
}

function SettingsPage({ state }: { state: ReturnType<typeof useAppState> }) {
  const settings = state.settings;
  return (
    <>
      <SectionHeader title="Settings" subtitle="System configuration, escalation rules and operational policies" />
      <View style={s.card}>
        <Text style={s.cardTitle}>Geo & attendance</Text>
        <View style={s.rowLine}><Text style={s.subtle}>Geo radius</Text><Text style={s.strong}>{settings.geoRadius}m</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Worker escalation</Text><Text style={s.strong}>{settings.workerEscalationMins} mins</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Employee escalation</Text><Text style={s.strong}>{settings.employeeEscalationMins} mins</Text></View>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Alert rules</Text>
        <View style={s.rowLine}><Text style={s.subtle}>Critical alert rule</Text><Text style={s.strong}>{settings.criticalAlertRule}</Text></View>
        <View style={s.rowLine}><Text style={s.subtle}>Deadline rule</Text><Text style={s.strong}>{settings.deadlineRule}</Text></View>
      </View>
    </>
  );
}

/* ─── Layout ─── */

function Header({ state }: { state: ReturnType<typeof useAppState> }) {
  const user = state.user;
  const pendingAlerts = state.notifications.filter((n) => !n.read).length;
  return (
    <View style={s.header}>
      <Pressable onPress={() => state.setRoleModalOpen(true)} style={s.roleChip}>
        <View style={[s.roleIcon, { backgroundColor: state.roleDef.accent }]}><Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>⚡</Text></View>
        <Text style={s.roleChipText}>{state.roleDef.name}</Text>
        <Text style={{ fontSize: 9, color: theme.slate400 }}>▼</Text>
      </Pressable>
      <View style={s.searchBox}>
        <Text style={{ color: theme.slate400, fontSize: 10 }}>🔍</Text>
        <TextInput value={state.search} onChangeText={state.setSearch} placeholder="Search tasks, alerts..." style={s.searchInput} placeholderTextColor={theme.slate400} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Pressable onPress={() => state.setPage("notifications")} style={s.iconBtn}>
          <Text style={{ fontSize: 12 }}>🔔</Text>
          {pendingAlerts > 0 && <View style={s.bellDot} />}
        </Pressable>
        <Pressable onPress={() => state.setPage("profile")} style={[s.iconBtn, { flexDirection: "row", gap: 4, paddingHorizontal: 8 }]}>
          <View style={s.avatar}><Text style={s.avatarText}>{user?.name.charAt(0)}</Text></View>
          <Text style={{ fontSize: 11, fontWeight: "600", color: theme.slate700 }}>{user?.name.split(" ")[0]}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BottomNav({ state }: { state: ReturnType<typeof useAppState> }) {
  const pages = state.roleDef.pages.slice(0, 5);
  return (
    <View style={s.bottomNav}>
      <View style={s.bottomNavInner}>
        {pages.map((p) => {
          const active = p.id === state.page;
          return (
            <Pressable key={p.id} onPress={() => state.setPage(p.id)} style={[s.navItem, active && s.navItemActive]}>
              <Text style={{ fontSize: 16 }}>{p.icon}</Text>
              <Text style={[s.navText, active && s.navTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RoleModal({ state }: { state: ReturnType<typeof useAppState> }) {
  return (
    <Modal transparent visible={state.roleModalOpen} animationType="slide" onRequestClose={() => state.setRoleModalOpen(false)}>
      <Pressable style={s.modalBg} onPress={() => state.setRoleModalOpen(false)}>
        <View style={s.modalCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={s.modalTitle}>Switch Role</Text>
            <Pressable onPress={() => state.setRoleModalOpen(false)} style={s.iconBtn}><Text>✕</Text></Pressable>
          </View>
          {(Object.keys(ROLES) as RoleId[]).map((id) => {
            const r = ROLES[id];
            const active = id === state.role;
            return (
              <Pressable key={id} onPress={() => { state.switchRole(id); state.setRoleModalOpen(false); }} style={[s.roleListItem, active && s.roleListItemActive]}>
                <View style={[s.roleListIcon, { backgroundColor: r.accent }]}><Text style={{ color: "#fff", fontSize: 14 }}>{r.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.roleListName}>{r.name}</Text>
                  <Text style={s.roleListShort}>{r.short}</Text>
                </View>
                {active && <View style={s.roleCheck}><Text style={{ color: "#fff", fontSize: 10 }}>✓</Text></View>}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

/* ─── Main App ─── */

export default function App() {
  const state = useAppState();
  const currentPage = state.roleDef.pages.find((p) => p.id === state.page) || state.roleDef.pages[0];

  const renderScreen = () => {
    if (state.page === "home") {
      if (state.role === "worker") return <WorkerHome state={state} />;
      if (state.role === "employee") return <EmployeeHome state={state} />;
      if (state.role === "am") return <AmHome state={state} />;
      if (state.role === "branchManager") return <BranchManagerHome state={state} />;
      return <RmDashboard state={state} />;
    }
    if (state.page === "tasks" || state.page === "monitoring") return <TasksPage state={state} />;
    if (state.page === "complaints" || state.page === "issues" || state.page === "alerts") return <ComplaintsPage state={state} />;
    if (state.page === "attendance") return <AttendancePage state={state} />;
    if (state.page === "notifications") return <NotificationsPage state={state} />;
    if (state.page === "profile" || state.page === "settings") return state.role === "rm" && state.page === "settings" ? <SettingsPage state={state} /> : <ProfilePage state={state} />;
    if (state.page === "branch") return <BranchHubPage state={state} />;
    if (state.page === "branches") return <BranchesPage state={state} />;
    if (state.page === "approvals" || state.page === "finance") return state.role === "rm" && state.page === "finance" ? <FinancePage state={state} /> : <ApprovalsPage state={state} />;
    if (state.page === "visits") return <VisitsPage state={state} />;
    if (state.page === "dashboard") return <RmDashboard state={state} />;
    if (state.page === "intelligence") return <IntelligencePage state={state} />;
    if (state.page === "analytics") return <AnalyticsPage state={state} />;
    if (state.page === "users") return <UsersPage state={state} />;
    return <WorkerHome state={state} />;
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" />
      <View style={s.bgBlobA} />
      <View style={s.bgBlobB} />
      <Header state={state} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {renderScreen()}
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav state={state} />
      <RoleModal state={state} />
    </SafeAreaView>
  );
}

/* ─── Styles ─── */

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  bgBlobA: { position: "absolute", top: -90, left: -30, width: 220, height: 220, borderRadius: 999, backgroundColor: "rgba(239,124,33,0.14)", zIndex: 0 },
  bgBlobB: { position: "absolute", bottom: 120, right: -50, width: 180, height: 180, borderRadius: 999, backgroundColor: "rgba(21,128,61,0.08)", zIndex: 0 },

  header: { margin: 12, marginBottom: 6, borderRadius: 18, padding: 10, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1, borderColor: "rgba(16,37,56,0.06)", flexDirection: "row", alignItems: "center", gap: 8, zIndex: 1 },
  roleChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: theme.slate50, borderWidth: 1, borderColor: "rgba(16,37,56,0.06)" },
  roleIcon: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  roleChipText: { fontSize: 11, fontWeight: "700", color: theme.slate700 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: theme.slate50, borderWidth: 1, borderColor: "rgba(16,37,56,0.06)" },
  searchInput: { flex: 1, fontSize: 11, color: theme.ink, padding: 0 },
  iconBtn: { padding: 6, borderRadius: 8, backgroundColor: theme.slate50, borderWidth: 1, borderColor: "rgba(16,37,56,0.06)", alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.red, borderWidth: 1, borderColor: "#fff" },
  avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.blue600, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  content: { paddingHorizontal: 12, paddingBottom: 20, gap: 10, zIndex: 1 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: "wrap", gap: 8 },
  sectionTitle: { color: theme.ink, fontWeight: "900", fontSize: 18, letterSpacing: -0.5 },
  sectionSubtitle: { color: theme.slate500, fontSize: 12, marginTop: 2, maxWidth: SCREEN_W * 0.7 },

  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statCard: { width: "48%", backgroundColor: "#fff", borderWidth: 1, borderColor: theme.line, borderRadius: 20, padding: 12 },
  statLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: theme.slate400 },
  statValue: { fontSize: 22, fontWeight: "900", color: theme.ink, marginTop: 6 },
  statMeta: { fontSize: 11, color: theme.slate500, marginTop: 3 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statIcon: { fontSize: 16 },

  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: theme.line, borderRadius: 20, padding: 14, gap: 6 },
  pressableCard: { opacity: 1 },
  cardTitle: { color: theme.ink, fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  cardMeta: { color: theme.slate500, fontSize: 12, marginTop: 2 },

  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  scheduleBadge: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: theme.slate400 },

  progressTrack: { backgroundColor: "rgba(16,37,56,0.08)", borderRadius: 999, overflow: "hidden", height: 6 },
  progressFill: { height: "100%", borderRadius: 999 },

  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  detailItem: { minWidth: "45%", flex: 1 },
  detailLabel: { color: theme.slate400, fontSize: 11 },
  detailValue: { color: theme.ink, fontSize: 12, fontWeight: "700", marginTop: 2 },

  rowLine: { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 10, marginTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  strong: { color: theme.ink, fontWeight: "700", fontSize: 13 },
  subtle: { color: theme.slate500, fontSize: 12 },

  alertBox: { borderRadius: 14, padding: 12, marginTop: 6 },
  redoBox: { backgroundColor: theme.rose50, borderRadius: 14, padding: 10, marginTop: 8 },
  redoText: { color: theme.rose700, fontSize: 12 },

  ladderBox: { borderRadius: 14, padding: 12, flex: 1, minWidth: "45%" },

  quickBtn: { backgroundColor: theme.navy, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  quickBtnSecondary: { backgroundColor: "#fff", borderWidth: 1, borderColor: theme.line },
  quickBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  quickBtnTextSecondary: { color: theme.ink, fontWeight: "700", fontSize: 12 },
  smallBtn: { backgroundColor: theme.navy, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  actionBtn: { backgroundColor: theme.emerald600, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  actionBtnAlt: { backgroundColor: "#fff", borderWidth: 1, borderColor: theme.line, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, alignItems: "center" },
  actionBtnTextAlt: { color: theme.ink, fontWeight: "700", fontSize: 12 },

  segmentedWrap: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 999, padding: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.8)" },
  segmentedItem: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  segmentedItemActive: { backgroundColor: theme.navy },
  segmentedText: { fontSize: 12, fontWeight: "600", color: theme.slate500 },
  segmentedTextActive: { color: "#fff" },

  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 10, paddingVertical: 8 },
  bottomNavInner: { backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", borderRadius: 24, padding: 6, flexDirection: "row", justifyContent: "space-around", shadowColor: "#122b43", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 24 },
  navItem: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 16, alignItems: "center", minWidth: 56 },
  navItemActive: { backgroundColor: theme.navy },
  navText: { color: theme.slate500, fontSize: 10, fontWeight: "700", marginTop: 2 },
  navTextActive: { color: "#fff" },

  modalBg: { flex: 1, backgroundColor: "rgba(2,6,23,0.4)", justifyContent: "center", padding: 16 },
  modalCard: { borderRadius: 28, backgroundColor: "#fff", padding: 16, gap: 8 },
  modalTitle: { color: theme.ink, fontWeight: "900", fontSize: 18 },

  roleListItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16 },
  roleListItemActive: { backgroundColor: theme.orange50, borderWidth: 1, borderColor: theme.orange100 },
  roleListIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  roleListName: { fontSize: 14, fontWeight: "700", color: theme.ink },
  roleListShort: { fontSize: 12, color: theme.slate400, marginTop: 2 },
  roleCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.orange500, alignItems: "center", justifyContent: "center" },

  panelText: { color: theme.slate500, lineHeight: 18, fontSize: 13 },
});
