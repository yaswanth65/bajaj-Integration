import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import {
  Building, Users, HardHat, TrendingUp, DollarSign, Activity,
  AlertCircle, TriangleAlert, ShieldCheck, Clock, CalendarDays, MapPin,
  Phone, Mail, ChevronRight, BarChart3, Eye, Wrench, Zap, Thermometer,
  Camera, CheckCircle2, XCircle, ArrowUpRight, UserCheck
} from "lucide-react-native";
import { ScreenWrapper } from "../../../shared/layout/ScreenWrapper";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { StatCard } from "../../../shared/components/StatCard";
import { Card } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { ProgressBar } from "../../../shared/components/ProgressBar";
import { useApp } from "../../../context/AppContext";
import { colors, fontSize, spacing, borderRadius } from "../../../theme/theme";
import { formatPct, formatMoney } from "../../../utils/helpers";
import { Branch, User, Task, Complaint, Appliance, AttendanceLog, Approval } from "../../../types/domain";

interface Props {
  branchId: string;
  onBack: () => void;
}

export function BranchDetailScreen({ branchId, onBack }: Props) {
  const { getBranch, scopedUsers, scopedTasks, scopedComplaints, scopedAppliances, scopedAttendance, scopedApprovals } = useApp();
  const branch = getBranch(branchId)!;

  if (!branch) return null;

  const budgetPct = Math.round((branch.usedBudget / branch.monthlyBudget) * 100);
  const branchUsers = scopedUsers.filter((u: User) => u.branchId === branchId);
  const branchTasks = scopedTasks.filter((t: Task) => t.branchId === branchId);
  const branchComplaints = scopedComplaints.filter((c: Complaint) => c.branchId === branchId);
  const branchAppliances = scopedAppliances.filter((a: Appliance) => a.branchId === branchId);
  const branchAttendance = scopedAttendance.filter((a: AttendanceLog) => {
    const user = scopedUsers.find((u: User) => u.id === a.userId);
    return user?.branchId === branchId;
  });
  const branchApprovals = scopedApprovals.filter((a: Approval) => a.branchId === branchId);

  const workers = branchUsers.filter((u: User) => u.role === "lc");
  const pendingTasks = branchTasks.filter((t: Task) => t.status === "Pending").length;
  const completedTasks = branchTasks.filter((t: Task) => t.status === "Completed").length;
  const openComplaints = branchComplaints.filter((c: Complaint) => c.status !== "Resolved").length;
  const criticalAppliances = branchAppliances.filter((a: Appliance) => a.status === "Critical" || a.status === "Down").length;

  const todayPresent = branchAttendance.filter((a: AttendanceLog) => a.status === "Present").length;
  const todayTotal = branchAttendance.length || 1;

  return (
    <ScreenWrapper>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl }}>
        <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, borderRadius: borderRadius.md, backgroundColor: colors.slate100, alignItems: "center", justifyContent: "center" }}>
          <ChevronRight size={18} color={colors.text} strokeWidth={2} style={{ transform: [{ rotate: "180deg" }] }} />
        </TouchableOpacity>
        <Text style={{ fontSize: fontSize.xl, fontWeight: "400", color: colors.text, flex: 1 }}>Branch Details</Text>
      </View>

      <Card variant="soft" style={{ backgroundColor: colors.text, marginBottom: spacing.xl }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <View style={{ width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: colors.brand + "30", alignItems: "center", justifyContent: "center" }}>
                <Building size={20} color={colors.brand} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: "400", color: colors.slate300, textTransform: "uppercase" }}>{branch.code}</Text>
                <Text style={{ fontSize: fontSize["3xl"], fontWeight: "400", color: colors.white }}>{branch.name}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm }}>
              <MapPin size={12} color={colors.slate300} />
              <Text style={{ fontSize: fontSize.sm, color: colors.slate300 }}>{branch.address}</Text>
            </View>
          </View>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: branch.health >= 90 ? colors.emerald500 + "30" : branch.health >= 80 ? colors.amber500 + "30" : colors.rose500 + "30", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: fontSize["3xl"], fontWeight: "400", color: branch.health >= 90 ? colors.emerald200 : branch.health >= 80 ? colors.amber200 : colors.rose200 }}>{branch.health}%</Text>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginBottom: spacing.xl }}>
        <View style={{ flex: 1, minWidth: 90 }}><StatCard label="Performance" value={branch.performance + "%"} meta="Ops rating" accent={colors.brand} icon={TrendingUp} /></View>
        <View style={{ flex: 1, minWidth: 90 }}><StatCard label="Attendance" value={branch.todayAttendance + "%"} meta="Today" accent={colors.success} icon={UserCheck} /></View>
        <View style={{ flex: 1, minWidth: 90 }}><StatCard label="SLA" value={branch.sla + "%"} meta="Service level" accent={colors.brandSecondary} icon={Clock} /></View>
        <View style={{ flex: 1, minWidth: 90 }}><StatCard label="Audit" value={branch.auditScore + "%"} meta="Compliance" accent={colors.slate600} icon={ShieldCheck} /></View>
      </View>

      <View style={{ gap: spacing.xl }}>
        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color={colors.brand} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Staff Overview</Text>
            <Badge label={branch.staffCount + " total"} type="Info" />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 100, backgroundColor: colors.slate50, borderRadius: borderRadius.lg, padding: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <HardHat size={16} color={colors.brandSecondary} />
                <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.textSecondary }}>Staff</Text>
              </View>
              <Text style={{ fontSize: fontSize["4xl"], fontWeight: "400", color: colors.text, marginTop: spacing.sm }}>{branch.staffCount}</Text>
            </View>
          </View>
          <View style={{ marginTop: spacing.md, backgroundColor: colors.slate50, borderRadius: borderRadius.lg, padding: spacing.lg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Users size={16} color={colors.text} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.textSecondary }}>Present today</Text>
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>{todayPresent} of {todayTotal}</Text>
          </View>
          {workers.slice(0, 3).map((user: User) => (
            <View key={user.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.slate50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: "400", color: colors.brand }}>{user.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>{user.name}</Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{user.position}</Text>
                </View>
              </View>
              <Badge label={user.status} type={user.status as any} />
            </View>
          ))}
        </Card>

        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.warning + "15", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={16} color={colors.warning} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Budget & Finance</Text>
          </View>
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>Monthly budget</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>{formatMoney(branch.monthlyBudget)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>Used</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>{formatMoney(branch.usedBudget)}</Text>
            </View>
            <ProgressBar value={budgetPct} color={budgetPct > 85 ? colors.error : budgetPct > 70 ? colors.warning : colors.success} />
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{budgetPct}% utilised</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl }}>
            <View style={{ flex: 1, minWidth: 100, backgroundColor: colors.slate50, borderRadius: borderRadius.lg, padding: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <BarChart3 size={14} color={colors.brand} />
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Revenue index</Text>
              </View>
              <Text style={{ fontSize: fontSize.xl, fontWeight: "400", color: colors.text, marginTop: spacing.xs }}>{branch.revenueIndex}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 100, backgroundColor: colors.slate50, borderRadius: borderRadius.lg, padding: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Users size={14} color={colors.success} />
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Footfall</Text>
              </View>
              <Text style={{ fontSize: fontSize.xl, fontWeight: "400", color: colors.text, marginTop: spacing.xs }}>{branch.customerFootfall}</Text>
            </View>
          </View>
          {branchApprovals.length > 0 && (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text, marginBottom: spacing.sm }}>Pending approvals</Text>
              {branchApprovals.filter((a: Approval) => a.status === "Pending").slice(0, 2).map((a: Approval) => (
                <View key={a.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.amber50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>{a.title}</Text>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{formatMoney(a.amount)}</Text>
                  </View>
                  <Badge label={a.priority} type={a.priority} />
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.error + "15", alignItems: "center", justifyContent: "center" }}>
              <TriangleAlert size={16} color={colors.error} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Alerts & Issues</Text>
            <Badge label={openComplaints + " open"} type="Warning" />
          </View>
          <View style={{ gap: spacing.md }}>
            {branchComplaints.slice(0, 3).map((c: Complaint) => (
              <View key={c.id} style={{ backgroundColor: c.status === "Escalated" ? colors.rose50 : c.status === "Pending" ? colors.amber50 : colors.emerald50, borderRadius: borderRadius.lg, padding: spacing.xl, flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                {c.status === "Escalated" ? <TriangleAlert size={16} color={colors.rose700} strokeWidth={2} style={{ marginTop: 2 }} /> : c.status === "Pending" ? <AlertCircle size={16} color={colors.amber700} strokeWidth={2} style={{ marginTop: 2 }} /> : <CheckCircle2 size={16} color={colors.emerald700} strokeWidth={2} style={{ marginTop: 2 }} />}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: c.status === "Escalated" ? colors.rose700 : c.status === "Pending" ? colors.amber700 : colors.emerald700 }}>{c.title}</Text>
                  <Text style={{ fontSize: fontSize.xs, color: c.status === "Escalated" ? colors.rose700 : c.status === "Pending" ? colors.amber700 : colors.emerald700, marginTop: spacing.xs }}>{c.type} | {c.assignedVendor}</Text>
                </View>
                <Badge label={c.status} type={c.status as any} />
              </View>
            ))}
            {branchComplaints.length === 0 && (
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>No issues recorded</Text>
            )}
          </View>
        </Card>

        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brandSecondary + "15", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={16} color={colors.brandSecondary} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Appliance Status</Text>
            <Badge label={criticalAppliances + " critical"} type="Error" />
          </View>
          <View style={{ gap: spacing.md }}>
            {branchAppliances.slice(0, 4).map((app: Appliance) => (
              <View key={app.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.slate50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View style={{ width: 28, height: 28, borderRadius: borderRadius.md, backgroundColor: app.status === "Operational" ? colors.success + "15" : app.status === "At Risk" ? colors.warning + "15" : colors.error + "15", alignItems: "center", justifyContent: "center" }}>
                    {app.status === "Operational" ? <Zap size={14} color={colors.success} strokeWidth={2} /> : app.status === "At Risk" ? <TriangleAlert size={14} color={colors.warning} strokeWidth={2} /> : <XCircle size={14} color={colors.error} strokeWidth={2} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>{app.name}</Text>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{app.category} | {app.zone}</Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Badge label={app.status} type={app.status as any} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{app.healthScore}% health</Text>
                </View>
              </View>
            ))}
            {branchAppliances.length === 0 && (
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>No appliances registered</Text>
            )}
          </View>
        </Card>

        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
              <Clock size={16} color={colors.brand} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Task Summary</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 80, backgroundColor: colors.slate50, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: "center" }}>
              <Text style={{ fontSize: fontSize["3xl"], fontWeight: "400", color: colors.text }}>{branchTasks.length}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Total</Text>
            </View>
            <View style={{ flex: 1, minWidth: 80, backgroundColor: colors.amber50, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: "center" }}>
              <Text style={{ fontSize: fontSize["3xl"], fontWeight: "400", color: colors.amber700 }}>{pendingTasks}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.amber700 }}>Pending</Text>
            </View>
            <View style={{ flex: 1, minWidth: 80, backgroundColor: colors.emerald50, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: "center" }}>
              <Text style={{ fontSize: fontSize["3xl"], fontWeight: "400", color: colors.emerald700 }}>{completedTasks}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.emerald700 }}>Done</Text>
            </View>
          </View>
        </Card>

        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
              <Building size={16} color={colors.brand} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Branch Info</Text>
          </View>
          <View style={{ gap: spacing.md }}>
            {[
              { label: "Phone", value: branch.phone, icon: Phone },
              { label: "Email", value: branch.email, icon: Mail },
              { label: "Shift window", value: branch.shiftWindow, icon: Clock },
              { label: "Geo radius", value: branch.geoRadius + "m", icon: MapPin },
              { label: "Last visit", value: branch.lastVisit, icon: CalendarDays },
              { label: "Next visit", value: branch.nextVisit, icon: CalendarDays },
            ].map((row) => (
              <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.slate50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <row.icon size={14} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{row.label}</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text, maxWidth: 180 }}>{row.value}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
