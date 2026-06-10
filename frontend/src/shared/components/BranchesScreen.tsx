import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import {
  Building, TrendingUp, Users, Clock, AlertCircle, TriangleAlert,
  ShieldCheck, DollarSign, ChevronRight, BarChart3, Activity,
  MapPin, Wrench
} from "lucide-react-native";
import { ScreenWrapper } from "../layout/ScreenWrapper";
import { SectionHeader } from "./SectionHeader";
import { SegmentedControl } from "./SegmentedControl";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius, shadows } from "../../theme/theme";
import { BranchDeepDiveScreen } from "./detail/BranchDeepDiveScreen";
import { Branch } from "../../types/domain";

export function BranchesScreen() {
  const { state, setTab, scopedBranches, openBranchDetail, openFormModal } = useApp();
  const isRm = state.role === "rm";
  const activeTab = isRm ? (state.tabs.rmIntelligence || "performance") : null;
  const [filterBranch, setFilterBranch] = useState<string | number | null>(null);
  const [deepDiveBranch, setDeepDiveBranch] = useState<Branch | null>(null);

  const filtered = filterBranch ? scopedBranches.filter((b) => b.id === filterBranch) : scopedBranches;

  if (deepDiveBranch) {
    return (
      <BranchDeepDiveScreen
        branch={deepDiveBranch}
        onBack={() => setDeepDiveBranch(null)}
      />
    );
  }

  return (
    <ScreenWrapper>
      <SectionHeader
        title={isRm ? "Branch Intelligence" : "Branch Directory"}
        subtitle={
          isRm
            ? "Performance score, risk mix, finance burn and drill-down detail across all branches"
            : "Every branch opens into a deep operational drawer with staffing, finance, appliance and issue detail"
        }
        action={
          isRm ? (
            <SegmentedControl
              tabs={[{ label: "Performance", value: "performance" }, { label: "Risk", value: "risk" }]}
              activeKey={activeTab!}
              onChange={(v) => setTab("rmIntelligence", v)}
            />
          ) : undefined
        }
      />

      {isRm && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xl }}>
          <TouchableOpacity onPress={() => setFilterBranch(null)} style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: !filterBranch ? colors.slate900 : colors.white, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: !filterBranch ? colors.white : colors.slate600 }}>All branches</Text>
          </TouchableOpacity>
          {scopedBranches.map((b) => (
            <TouchableOpacity key={b.id} onPress={() => setFilterBranch(b.id)} style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: filterBranch === b.id ? colors.slate900 : colors.white, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: filterBranch === b.id ? colors.white : colors.slate600 }}>{b.name.split(" ")[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xl, marginTop: spacing.xl, paddingBottom: 60 }}>
        {filtered.length === 0 ? (
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing["4xl"] }}>No branches found</Text>
        ) : filtered.map((branch) => {
          const budgetPct = Math.round((branch.usedBudget / branch.monthlyBudget) * 100);

          return (
            <View key={branch.id} style={{ backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, ...shadows.card }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md }}>
                <View style={{ flex: 1, flexDirection: "row", gap: spacing.lg }}>
                  <View style={{ width: 48, height: 48, borderRadius: borderRadius["2xl"], backgroundColor: colors.slate50, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }}>
                    <Building size={24} color={colors.slate700} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.xl, fontWeight: "400", color: colors.slate900 }}>{branch.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs }}>
                      <MapPin size={14} color={colors.slate400} />
                      <Text style={{ fontSize: fontSize.sm, color: colors.slate500 }}>{branch.city} · {branch.address}</Text>
                    </View>
                  </View>
                </View>
                <Badge label={branch.code} type="Pending" />
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.xl, backgroundColor: colors.slate50, borderRadius: borderRadius.xl, padding: spacing.lg }}>
                {isRm ? (
                  <View style={{ flex: 1, minWidth: 80 }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.slate500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Performance</Text>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.slate900 }}>{branch.performance}%</Text>
                  </View>
                ) : (
                  <View style={{ flex: 1, minWidth: 80 }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.slate500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Staff</Text>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.slate900 }}>{branch.staffCount}</Text>
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 80 }}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.slate500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Attendance</Text>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.slate900 }}>{branch.todayAttendance}%</Text>
                </View>
                <View style={{ flex: 1, minWidth: 80 }}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.slate500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>SLA</Text>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.slate900 }}>{branch.sla}%</Text>
                </View>
                <View style={{ flex: 1, minWidth: 80 }}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.slate500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Issues</Text>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: branch.openIssues > 0 ? colors.amber700 : colors.emerald600 }}>{branch.openIssues}</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl }}>
                <View style={{ flex: 1, minWidth: 100, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.red50, alignItems: "center", justifyContent: "center" }}>
                    <TriangleAlert size={14} color={colors.error} />
                  </View>
                  <View>
                    <Text style={{ fontSize: fontSize.xs, color: colors.slate500 }}>Critical Alerts</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.slate900 }}>{branch.criticalAlerts}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 100, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.amber50, alignItems: "center", justifyContent: "center" }}>
                    <Wrench size={14} color={colors.amber700} />
                  </View>
                  <View>
                    <Text style={{ fontSize: fontSize.xs, color: colors.slate500 }}>Appliance Risk</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.slate900 }}>{branch.applianceRisk}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 100, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.sky50, alignItems: "center", justifyContent: "center" }}>
                    <DollarSign size={14} color={colors.sky600} />
                  </View>
                  <View>
                    <Text style={{ fontSize: fontSize.xs, color: colors.slate500 }}>Budget Used</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.slate900 }}>{budgetPct}%</Text>
                  </View>
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderColor: colors.border, marginTop: spacing.xl, paddingTop: spacing.xl, flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
                <TouchableOpacity onPress={() => openBranchDetail(branch.id)} style={{ flex: 1, minWidth: 120, backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.slate700 }}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeepDiveBranch(branch)} style={{ flex: 1, minWidth: 120, backgroundColor: colors.slate900, borderRadius: borderRadius.lg, paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.white }}>Deep Dive</Text>
                  <ChevronRight size={14} color={colors.white} strokeWidth={2} />
                </TouchableOpacity>
                {!isRm ? (
                  <TouchableOpacity onPress={() => openFormModal("visit")} style={{ backgroundColor: colors.sky50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.sky700 }}>Schedule</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
}
