import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { AlertCircle, TrendingUp, CheckCircle2, Search, Calendar } from "lucide-react-native";
import { ScreenWrapper } from "../../shared/layout/ScreenWrapper";
import { SectionHeader } from "../../shared/components/SectionHeader";
import { StatCard } from "../../shared/components/StatCard";
import { Card } from "../../shared/components/Card";
import { ComplaintCard } from "../../shared/components/ComplaintCard";
import { SegmentedControl } from "../../shared/components/SegmentedControl";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius } from "../../theme/theme";

export function BranchManagerIssuesScreen() {
  const { state, setTab, scopedBranches, scopedComplaints, resolveComplaint, escalateComplaint } = useApp();
  const activeTab = state.tabs.managerIssues || "open";
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("2026-04-20");
  const [toDate, setToDate] = useState("2026-04-26");

  const statusFiltered = scopedComplaints.filter((c) => {
    if (activeTab === "open") return c.status === "Pending";
    if (activeTab === "escalated") return c.status === "Escalated";
    return true;
  });

  const filteredComplaints = statusFiltered.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.assignedVendor?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCount = scopedComplaints.filter((c) => c.status === "Pending").length;
  const escalatedCount = scopedComplaints.filter((c) => c.status === "Escalated").length;
  const resolvedCount = scopedComplaints.filter((c) => c.status === "Resolved").length;

  return (
    <ScreenWrapper>
      <SectionHeader
        title="Issues & Complaints"
        action={
          <SegmentedControl
            tabs={[
              { label: "Open", value: "open" },       
              { label: "Escalated", value: "escalated" },
              { label: "All", value: "all" },
            ]}
            activeKey={activeTab}
            onChange={(v) => setTab("managerIssues", v)}
          />
        }
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl }}>
        <View style={{ flex: 2, minWidth: 200, flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border }}>
          <Search size={16} color={colors.slate400} />
          <TextInput 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search issues..." 
            placeholderTextColor={colors.slate400}
            style={{ flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, color: colors.slate900, fontSize: fontSize.sm }} 
          />
        </View>
        <View style={{ flex: 1, minWidth: 140, flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border }}>
          <Calendar size={16} color={colors.slate400} />
          <TextInput value={fromDate} onChangeText={setFromDate} placeholder="From" style={{ flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, color: colors.slate900, fontSize: fontSize.sm }} />
        </View>
        <View style={{ flex: 1, minWidth: 140, flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border }}>
          <Calendar size={16} color={colors.slate400} />
          <TextInput value={toDate} onChangeText={setToDate} placeholder="To" style={{ flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, color: colors.slate900, fontSize: fontSize.sm }} />
        </View>
      </View>

      <View style={{ marginTop: spacing.xl }}>        
        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={16} color={colors.brand} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>
              {activeTab === "open" ? "Open Issues" : activeTab === "escalated" ? "Escalated Issues" : "All Issues"}
            </Text>
          </View>
          <View style={{ gap: spacing.xl }}>
            {filteredComplaints.length > 0 ? filteredComplaints.map((item) => (
              <ComplaintCard
                key={item.id}
                item={item}
                actions={
                  item.status === "Pending"
                    ? (state.role !== "rm"
                        ? [
                            { label: "Resolve", onPress: () => resolveComplaint(item.id), primary: true },
                            { label: "Escalate", onPress: () => escalateComplaint(item.id) },
                          ]
                        : [{ label: "Resolve", onPress: () => resolveComplaint(item.id), primary: true }])
                    : item.status === "Escalated"
                    ? [{ label: "Resolve", onPress: () => resolveComplaint(item.id), primary: true }]
                    : undefined
                }
              />
            )) : (
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center", padding: spacing["4xl"] }}>No issues to show</Text>
            )}
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
