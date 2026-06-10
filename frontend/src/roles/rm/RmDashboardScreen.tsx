import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import {
  HeartPulse, MapPin, TriangleAlert, Stamp, ChevronRight,
  FileText, Route, ShieldCheck, Calendar
} from "lucide-react-native";
import { ScreenWrapper } from "../../shared/layout/ScreenWrapper";
import { SectionHeader } from "../../shared/components/SectionHeader";
import { AlertStrip } from "../../shared/components/AlertStrip";
import { StatCard } from "../../shared/components/StatCard";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { QuickButton } from "../../shared/components/QuickButton";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius } from "../../theme/theme";

export function RmDashboardScreen() {
  const {
    scopedBranches, scopedUsers, scopedTasks, scopedComplaints,
    scopedApprovals, scopedNotifications, scopedAppliances,
    currentUser, showToast, setPage, openBranchDetail, openAuditTrail,
    auditLog
  } = useApp();

  const getPastDateStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    try {
      const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
      const formatter = new Intl.DateTimeFormat("en-CA", options);
      return formatter.format(d);
    } catch (e) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  };
  const getFutureDateStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    try {
      const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" } as const;
      const formatter = new Intl.DateTimeFormat("en-CA", options);
      return formatter.format(d);
    } catch (e) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  };

  const [rmFromDate, setRmFromDate] = useState(getPastDateStr(7));
  const [rmToDate, setRmToDate] = useState(getFutureDateStr(7));

  // --- Computed stats ---
  const totalBranches = scopedBranches.length;
  const avgHealth = Math.round(
    scopedBranches.reduce((s, b) => s + b.health, 0) / (totalBranches || 1),
  );
  const avgAttendance = Math.round(
    scopedBranches.reduce((s, b) => s + b.todayAttendance, 0) / (totalBranches || 1),
  );
  const criticalAlerts = scopedBranches.reduce((s, b) => s + b.criticalAlerts, 0);
  const pendingApprovals = scopedApprovals.filter((a) => a.status === "Pending").length;

  // --- Watchlist items (dynamic from real data) ---
  const watchlistItems = useMemo(() => {
    const items: string[] = [];

    // Critical appliance approvals
    scopedApprovals
      .filter((a) => a.status === "Pending" && a.priority === "Critical")
      .forEach((a) => {
        const branch = scopedBranches.find((b) => b.id === a.branchId);
        items.push(`${branch?.name || "Branch"}: ${a.title} needs approval now.`);
      });

    // Branches with high budget usage (>75%)
    scopedBranches
      .filter((b) => b.usedBudget / b.monthlyBudget > 0.75)
      .forEach((b) => {
        const pct = Math.round((b.usedBudget / b.monthlyBudget) * 100);
        items.push(`${b.name} crossed ${pct}% monthly budget already.`);
      });

    // Escalated complaints
    scopedComplaints
      .filter((c) => c.status === "Escalated")
      .forEach((c) => {
        const branch = scopedBranches.find((b) => b.id === c.branchId);
        items.push(`${branch?.name || "Branch"}: ${c.title} is escalated.`);
      });

    // Low health branches
    scopedBranches
      .filter((b) => b.health < 80)
      .forEach((b) => {
        items.push(`${b.name} health score at ${b.health}% — review needed.`);
      });

    return items.slice(0, 5);
  }, [scopedBranches, scopedComplaints, scopedApprovals]);

  // --- Decision feed items (dynamic from real data) ---
  const decisionFeedItems = useMemo(() => {
    const items: { text: string; priority: string }[] = [];

    // High-cost complaints needing RM decision
    scopedComplaints
      .filter((c) => c.estimatedCost > 20000 && c.status !== "Resolved")
      .forEach((c) => {
        const branch = scopedBranches.find((b) => b.id === c.branchId);
        items.push({
          text: `Approve ${c.estimatedCost > 40000 ? "capex" : "repair"} for ${branch?.name || "branch"} — ${c.title}.`,
          priority: c.priority,
        });
      });

    // Pending approvals at RM stage
    scopedApprovals
      .filter((a) => a.status === "Pending" && a.stage === "RM")
      .forEach((a) => {
        const branch = scopedBranches.find((b) => b.id === a.branchId);
        items.push({
          text: `${a.title} at ${branch?.name || "branch"} is awaiting RM approval.`,
          priority: a.priority,
        });
      });

    // Branches below SLA threshold
    scopedBranches
      .filter((b) => b.sla < 90)
      .forEach((b) => {
        items.push({
          text: `${b.name} SLA at ${b.sla}% — push visit report within 24 hrs.`,
          priority: "High",
        });
      });

    return items.slice(0, 4);
  }, [scopedBranches, scopedComplaints, scopedApprovals]);

  return (
    <ScreenWrapper>
      {/* Section header with action buttons */}
      <SectionHeader
        title="Regional Dashboard"
        subtitle="Global branch health, priority alerts, financial exposure and decision-ready intelligence"
        action={
          <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
            <QuickButton
              label="Open Approvals"
              icon={Stamp}
              onPress={() => setPage("approvals")}
              variant="primary"
            />
            <QuickButton
              label="User Control"
              icon={ShieldCheck}
              onPress={() => setPage("users")}
              variant="secondary"
            />
          </View>
        }
      />

      {/* Alert strip */}
      <AlertStrip onReviewAlerts={() => setPage("alerts")} onOpenAudit={openAuditTrail} />

      {/* 4 Stat Cards — 2×2 grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.xl }}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <StatCard
            label="Branch Health"
            value={`${avgHealth}%`}
            meta="Regional weighted score"
            icon={HeartPulse}
            accent={colors.emerald600}
          />
        </View>
        <View style={{ flex: 1, minWidth: 160 }}>
          <StatCard
            label="Attendance Avg"
            value={`${avgAttendance}%`}
            meta="Across all active offices"
            icon={MapPin}
            accent={colors.brandSecondary}
          />
        </View>
        <View style={{ flex: 1, minWidth: 160 }}>
          <StatCard
            label="Critical Alerts"
            value={String(criticalAlerts)}
            meta="Immediate RM queue items"
            icon={TriangleAlert}
            accent={colors.error}
          />
        </View>
        <View style={{ flex: 1, minWidth: 160 }}>
          <StatCard
            label="Open Approvals"
            value={String(pendingApprovals)}
            meta="High-cost and risk-sensitive requests"
            icon={Stamp}
            accent={colors.slate900}
          />
        </View>
      </View>

      {/* Two-column layout: Watchlist + Decision Feed */}
      <View style={{ marginTop: spacing.xl, gap: spacing.xl }}>
        <View style={{ gap: spacing.xl }}>
          {/* RM Watchlist — dark card */}
          <View
            style={{
              backgroundColor: colors.slate900,
              borderRadius: borderRadius["5xl"],
              padding: spacing["2xl"],
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <Text style={{ fontSize: fontSize.xl, fontWeight: "800", color: colors.white, letterSpacing: -0.3 }}>
              RM Watchlist
            </Text>
            <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
              {watchlistItems.length > 0 ? (
                watchlistItems.map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderRadius: borderRadius["2xl"],
                      padding: spacing.xl,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.sm, color: "rgba(255,255,255,0.9)", lineHeight: 18 }}>
                      {item}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: borderRadius["2xl"], padding: spacing.xl }}>
                  <Text style={{ fontSize: fontSize.sm, color: "rgba(255,255,255,0.6)" }}>No watchlist items right now.</Text>
                </View>
              )}
            </View>
          </View>

          {/* Decision Feed — glass card */}
          <Card variant="glass">
            <Text style={{ fontSize: fontSize.xl, fontWeight: "800", color: colors.slate900, letterSpacing: -0.3 }}>
              Decision Feed
            </Text>
            <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
              {decisionFeedItems.length > 0 ? (
                decisionFeedItems.map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: colors.slate50,
                      borderRadius: borderRadius["2xl"],
                      padding: spacing.xl,
                      borderLeftWidth: 3,
                      borderLeftColor:
                        item.priority === "Critical"
                          ? colors.error
                          : item.priority === "High"
                            ? colors.warning
                            : colors.brand,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.sm, color: colors.slate600, lineHeight: 18 }}>
                      {item.text}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={{ backgroundColor: colors.slate50, borderRadius: borderRadius["2xl"], padding: spacing.xl }}>
                  <Text style={{ fontSize: fontSize.sm, color: colors.slate500 }}>No pending decisions.</Text>
                </View>
              )}
            </View>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card variant="glass">
          <Text style={{ fontSize: fontSize.xl, fontWeight: "800", color: colors.slate900, letterSpacing: -0.3 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl }}>
            <QuickButton
              label="Review Reports"
              icon={FileText}
              onPress={() => setPage("approvals")}
              variant="primary"
            />
            <QuickButton
              label="Schedule Visit"
              icon={Route}
              onPress={() => {
                openBranchDetail(scopedBranches[0]?.id);
                showToast("Select a branch to schedule visit");
              }}
              variant="secondary"
            />
            <QuickButton
              label="Approve Requests"
              icon={Stamp}
              onPress={() => setPage("approvals")}
              variant="success"
            />
          </View>
        </Card>
      </View>

      {/* Improvement 3: Date-to-Date CAPEX & SLA Audit Center */}
      <SectionHeader title="CAPEX & SLA Audit Center" subtitle="Track financial outlays, open tickets and operations audit trails" />
      <Card variant="glass" style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.slate400, marginBottom: 2 }}>From Date</Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm }}>
              <TextInput 
                value={rmFromDate} 
                onChangeText={setRmFromDate} 
                placeholder="YYYY-MM-DD" 
                placeholderTextColor={colors.slate400} 
                style={{ flex: 1, paddingVertical: spacing.sm, fontSize: fontSize.xs, color: colors.slate900 }} 
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.slate400, marginBottom: 2 }}>To Date</Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm }}>
              <TextInput 
                value={rmToDate} 
                onChangeText={setRmToDate} 
                placeholder="YYYY-MM-DD" 
                placeholderTextColor={colors.slate400} 
                style={{ flex: 1, paddingVertical: spacing.sm, fontSize: fontSize.xs, color: colors.slate900 }} 
              />
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg, flexWrap: "wrap" }}>
          <View style={{ flex: 1, minWidth: 120, backgroundColor: colors.slate50, borderRadius: borderRadius.lg, padding: spacing.md }}>
            <Text style={{ fontSize: 10, color: colors.slate400, textTransform: "uppercase" }}>CAPEX Outlay</Text>
            <Text style={{ fontSize: fontSize.md, fontWeight: "700", color: colors.slate900, marginTop: 2 }}>
              Rs {scopedApprovals.filter(a => {
                const aDate = a.updatedAt ? String(a.updatedAt).slice(0, 10) : "";
                return a.status === "Approved" && aDate >= rmFromDate && aDate <= rmToDate;
              }).reduce((sum, a) => sum + a.amount, 0).toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 120, backgroundColor: colors.slate50, borderRadius: borderRadius.lg, padding: spacing.md }}>
            <Text style={{ fontSize: 10, color: colors.slate400, textTransform: "uppercase" }}>New Tickets</Text>
            <Text style={{ fontSize: fontSize.md, fontWeight: "700", color: colors.slate900, marginTop: 2 }}>
              {scopedComplaints.filter(c => {
                const cDate = c.createdAt ? String(c.createdAt).slice(0, 10) : "";
                return cDate >= rmFromDate && cDate <= rmToDate;
              }).length} Raised
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.slate900, marginBottom: spacing.sm }}>Recent Operational Logs</Text>
        <View style={{ gap: spacing.sm }}>
          {auditLog.slice(0, 5).map((log) => (
            <View key={log.id} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.slate100 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: log.color || colors.brand }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.slate800 }}>{log.text}</Text>
                <Text style={{ fontSize: 10, color: colors.slate400, marginTop: 2 }}>{log.time} · User: {log.userId}</Text>
              </View>
            </View>
          ))}
          {auditLog.length === 0 && (
            <Text style={{ fontSize: fontSize.xs, color: colors.slate500, fontStyle: "italic", textAlign: "center" }}>No logs registered.</Text>
          )}
        </View>
      </Card>
    </ScreenWrapper>
  );
}
