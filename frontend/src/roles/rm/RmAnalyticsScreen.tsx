import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { TrendingUp, Users, Clock, Heart, BarChart3, Lightbulb, Building, ShieldCheck, DollarSign, Filter } from "lucide-react-native";
import { ScreenWrapper } from "../../shared/layout/ScreenWrapper";
import { SectionHeader } from "../../shared/components/SectionHeader";
import { StatCard } from "../../shared/components/StatCard";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ProgressBar } from "../../shared/components/ProgressBar";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius } from "../../theme/theme";

export function RmAnalyticsScreen() {
  const { scopedBranches, openBranchDetail } = useApp();
  const [selectedBranch, setSelectedBranch] = useState<string | number | null>(null);
  const filtered = selectedBranch ? scopedBranches.filter((b) => b.id === selectedBranch) : scopedBranches;

  const avgRevenue = Math.round(filtered.reduce((s, b) => s + b.revenueIndex, 0) / filtered.length);
  const avgFootfall = Math.round(filtered.reduce((s, b) => s + b.customerFootfall, 0) / filtered.length);
  const avgSla = Math.round(filtered.reduce((s, b) => s + b.sla, 0) / filtered.length);
  const avgHealth = Math.round(filtered.reduce((s, b) => s + b.health, 0) / filtered.length);

  return (
    <ScreenWrapper>
      <SectionHeader title="Regional Analytics" />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xl }}>
        <TouchableOpacity onPress={() => setSelectedBranch(null)} style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: !selectedBranch ? colors.brand : colors.slate100 }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: !selectedBranch ? colors.white : colors.textSecondary }}>All</Text>
        </TouchableOpacity>
        {scopedBranches.map((b) => (
          <TouchableOpacity key={b.id} onPress={() => setSelectedBranch(b.id)} style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: selectedBranch === b.id ? colors.brand : colors.slate100 }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: selectedBranch === b.id ? colors.white : colors.textSecondary }}>{b.name.split(" ")[0]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.xl }}>
        <View style={{ flex: 1, minWidth: 140 }}><StatCard label="Revenue index" value={String(avgRevenue)} meta="Regional average" accent={colors.brand} icon={TrendingUp} /></View>
        <View style={{ flex: 1, minWidth: 140 }}><StatCard label="Footfall" value={String(avgFootfall)} meta="Avg daily" accent={colors.brandSecondary} icon={Users} /></View>
        <View style={{ flex: 1, minWidth: 140 }}><StatCard label="SLA" value={`${avgSla}%`} meta="On-time" accent={colors.success} icon={Clock} /></View>
        <View style={{ flex: 1, minWidth: 140 }}><StatCard label="Health" value={`${avgHealth}%`} meta="Regional avg" accent={colors.warning} icon={Heart} /></View>
      </View>

      <Card variant="glass" style={{ marginTop: spacing.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
          <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={16} color={colors.brand} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Branch Comparison</Text>
        </View>
        <View style={{ gap: spacing.md }}>
          {filtered.map((branch) => (
            <TouchableOpacity key={branch.id} onPress={() => openBranchDetail(branch.id)} style={{ backgroundColor: colors.bg, borderRadius: borderRadius.xl, padding: spacing.xl }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View style={{ width: 24, height: 24, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
                    <Building size={12} color={colors.brand} strokeWidth={2} />
                  </View>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>{branch.name}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg }}>
                <View style={{ flex: 1, minWidth: 70, flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <TrendingUp size={12} color={colors.brand} />
                  <View>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Revenue</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>{branch.revenueIndex}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 70, flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Users size={12} color={colors.brandSecondary} />
                  <View>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Footfall</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>{branch.customerFootfall}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 70, flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Clock size={12} color={colors.success} />
                  <View>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>SLA</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>{branch.sla}%</Text>
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 70, flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Heart size={12} color={colors.warning} />
                  <View>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Health</Text>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>{branch.health}%</Text>
                  </View>
                </View>
              </View>
              <View style={{ marginTop: spacing.lg }}>
                <ProgressBar value={branch.performance} color={branch.performance >= 80 ? colors.success : branch.performance >= 60 ? colors.warning : colors.error} height={8} />
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md }}>
                <Badge label={`Audit: ${branch.auditScore}`} type={branch.auditScore >= 80 ? "Completed" : "Warning"} />
                <Badge label={`Issues: ${branch.openIssues}`} type={branch.openIssues > 5 ? "Error" : "Success"} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card variant="glass" style={{ marginTop: spacing.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
          <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
            <Lightbulb size={16} color={colors.brand} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Key Insights</Text>
        </View>
        <View style={{ gap: spacing.md }}>
          {[
            { icon: TrendingUp, color: colors.success, title: "Top performer", desc: `${filtered[0]?.name} leads with ${filtered[0]?.performance}% performance`, bg: colors.emerald50 },
            { icon: Users, color: colors.brandSecondary, title: "Staffing need", desc: `${filtered.reduce((a, b) => a.staffCount < b.staffCount ? a : b).name} has lowest staff`, bg: colors.sky50 },
            { icon: Clock, color: colors.warning, title: "SLA risk", desc: `${filtered.reduce((a, b) => a.sla < b.sla ? a : b).name} needs SLA improvement`, bg: colors.amber50 },
            { icon: Heart, color: colors.error, title: "Health concern", desc: `${filtered.reduce((a, b) => a.health < b.health ? a : b).name} lowest health`, bg: colors.rose50 },
          ].map((insight, i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.lg, backgroundColor: insight.bg, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: "flex-start" }}>
              <View style={{ width: 36, height: 36, borderRadius: borderRadius.md, backgroundColor: insight.color + "20", alignItems: "center", justifyContent: "center" }}>
                <insight.icon size={18} color={insight.color} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>{insight.title}</Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>{insight.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </ScreenWrapper>
  );
}
