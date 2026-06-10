import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { TriangleAlert, AlertCircle, Info, Bell, Building, CheckCircle, Shield, Search, Calendar } from "lucide-react-native";
import { ScreenWrapper } from "../../shared/layout/ScreenWrapper";
import { SectionHeader } from "../../shared/components/SectionHeader";
import { SegmentedControl } from "../../shared/components/SegmentedControl";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius } from "../../theme/theme";

export function RmAlertsScreen() {
  const { state, setTab, scopedNotifications, scopedBranches, alertStates, acknowledgeAlert, escalateAlert, openBranchDetail } = useApp();
  const filter = state.tabs.rmAlerts || "critical";
  const [selectedBranch, setSelectedBranch] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("2026-04-20");
  const [toDate, setToDate] = useState("2026-04-26");

  const statusFiltered = scopedNotifications.filter((item) => {
    if (filter !== "all" && item.priority.toLowerCase() !== filter) return false;
    if (selectedBranch && item.branchId !== selectedBranch) return false;
    return true;
  });

  const filtered = statusFiltered.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.detail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenWrapper>
      <SectionHeader
        title="Alert Center"
        action={
          <SegmentedControl tabs={[{ label: "Critical", value: "critical" }, { label: "Warning", value: "warning" }, { label: "Info", value: "info" }, { label: "All", value: "all" }]} activeKey={filter} onChange={(v) => setTab("rmAlerts", v)} />
        }
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xl }}>
        <TouchableOpacity onPress={() => setSelectedBranch(null)} style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: !selectedBranch ? colors.slate900 : colors.white, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: !selectedBranch ? colors.white : colors.slate600 }}>All Branches</Text>
        </TouchableOpacity>
        {scopedBranches.map((b) => (
          <TouchableOpacity key={b.id} onPress={() => setSelectedBranch(b.id)} style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: selectedBranch === b.id ? colors.slate900 : colors.white, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: selectedBranch === b.id ? colors.white : colors.slate600 }}>{b.name.split(" ")[0]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl }}>
        <View style={{ flex: 2, minWidth: 200, flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border }}>
          <Search size={16} color={colors.slate400} />
          <TextInput 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search alerts..." 
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

      <View style={{ gap: spacing.xl, marginTop: spacing.xl }}>
        {filtered.map((item) => {
          const alertState = alertStates[item.id];
          const isAcknowledged = alertState?.acknowledged || false;
          const isEscalated = alertState?.escalated || false;

          return (
            <Card variant="glass" key={item.id}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.lg }}>
                <View style={{ width: 40, height: 40, borderRadius: borderRadius.lg, backgroundColor: item.priority === "Critical" ? colors.rose50 : item.priority === "High" ? colors.amber50 : colors.sky50, alignItems: "center", justifyContent: "center" }}>
                  {item.priority === "Critical" ? <TriangleAlert size={18} color={colors.error} strokeWidth={2} /> : item.priority === "High" ? <AlertCircle size={18} color={colors.warning} strokeWidth={2} /> : <Info size={18} color={colors.info} strokeWidth={2} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
                    <Badge label={item.priority} type={item.priority} />
                    <Badge label={item.read ? "Read" : "Unread"} type={item.read ? "Completed" : "Pending"} />
                    {isAcknowledged && <Badge label="Acknowledged" type="Completed" />}
                    {isEscalated && <Badge label="Escalated" type="Critical" />}
                  </View>
                  <TouchableOpacity onPress={() => { const b = scopedBranches.find((br) => br.id === item.branchId); if (b) openBranchDetail(b.id); }}>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text, marginTop: spacing.md }}>{item.title}</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>{item.detail}</Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.lg }}>{item.time}</Text>

                  {isAcknowledged && alertState?.acknowledgedAt && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.emerald50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                      <CheckCircle size={12} color={colors.success} strokeWidth={2} />
                      <Text style={{ fontSize: fontSize.xs, color: colors.success }}>Acknowledged at {alertState.acknowledgedAt}</Text>
                    </View>
                  )}
                  {isEscalated && alertState?.escalatedAt && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.rose50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                      <TriangleAlert size={12} color={colors.error} strokeWidth={2} />
                      <Text style={{ fontSize: fontSize.xs, color: colors.error }}>Escalated at {alertState.escalatedAt}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
                {!isAcknowledged ? (
                  <TouchableOpacity onPress={() => acknowledgeAlert(item.id)} style={{ backgroundColor: colors.brand, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <CheckCircle size={14} color={colors.white} strokeWidth={2} />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.white }}>Acknowledge</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: colors.success + "15", borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <CheckCircle size={14} color={colors.success} strokeWidth={2} />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.success }}>Acknowledged</Text>
                  </View>
                )}
                {!isEscalated ? (
                  <TouchableOpacity onPress={() => escalateAlert(item.id)} style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <TriangleAlert size={14} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text }}>Escalate</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: colors.rose50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Shield size={14} color={colors.error} strokeWidth={2} />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.error }}>Escalated</Text>
                  </View>
                )}
              </View>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card variant="glass">
            <View style={{ alignItems: "center", padding: spacing["4xl"] }}>
              <Bell size={32} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text, marginTop: spacing.lg }}>No alerts</Text>
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm }}>No {filter} alerts for the selected filter</Text>
            </View>
          </Card>
        )}
      </View>
    </ScreenWrapper>
  );
}
