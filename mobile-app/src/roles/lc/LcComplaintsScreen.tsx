import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { AlertCircle, AlertOctagon, ShieldCheck, Send, Search } from "lucide-react-native";
import { ScreenWrapper } from "../../shared/layout/ScreenWrapper";
import { DatePickerDropdown } from "../../shared/components/DatePickerDropdown";
import { SectionHeader } from "../../shared/components/SectionHeader";
import { StatCard } from "../../shared/components/StatCard";
import { SegmentedControl } from "../../shared/components/SegmentedControl";
import { ComplaintCard } from "../../shared/components/ComplaintCard";
import { Card } from "../../shared/components/Card";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius } from "../../theme/theme";

export function LcComplaintsScreen() {
  const { state, setTab, scopedComplaints, createComplaint, showToast, resolveComplaint, escalateComplaint, assignVendor } = useApp();
  const filter = state.tabs.complaints;
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Appliance");
  const [priority, setPriority] = useState("High");
  const [desc, setDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("2026-04-20");
  const [toDate, setToDate] = useState("2026-04-26");

  const statusFiltered = scopedComplaints.filter((item) => {
    if (filter === "all") return true;
    if (filter === "active") return item.status !== "Resolved" && item.status !== "Rejected";
    return item.status === "Escalated";
  });

  const list = statusFiltered.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.assignedVendor?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCount = scopedComplaints.filter((i) => i.status === "Pending").length;
  const escalatedCount = scopedComplaints.filter((i) => i.status === "Escalated").length;
  const resolvedCount = scopedComplaints.filter((i) => i.status === "Resolved").length;

  const handleSubmit = () => {
    if (!title.trim() || !desc.trim()) return showToast("Add title and description");
    createComplaint({ title: title.trim(), type, priority: priority as any, description: desc.trim() });
    setTitle(""); setDesc("");
  };

  return (
    <ScreenWrapper>
      <SectionHeader
        title="Issue desk"
        action={
          <SegmentedControl
            tabs={[{ label: "Active", value: "active" }, { label: "Escalated", value: "escalated" }, { label: "All", value: "all" }]}
            activeKey={filter}
            onChange={(v) => setTab("complaints", v)}
          />
        }
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl }}>
        <View style={{ flex: 1, minWidth: 90 }}><StatCard label="Open" value={String(openCount)} meta="Waiting for action" accent={colors.brand} icon={AlertCircle} /></View>
        <View style={{ flex: 1, minWidth: 90 }}><StatCard label="Escalated" value={String(escalatedCount)} meta="Needs higher approval" accent={colors.error} icon={AlertOctagon} /></View>
        <View style={{ flex: 1, minWidth: 90 }}><StatCard label="Resolved" value={String(resolvedCount)} meta="Closed after resolution" accent={colors.success} icon={ShieldCheck} /></View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xl, marginTop: spacing.xl }}>
        <View style={{ flex: 1, minWidth: 240 }}>
          <Card variant="glass">
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
              <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
                <Send size={16} color={colors.brand} strokeWidth={2} />
              </View>
              <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Raise new complaint</Text>
            </View>
            <View style={{ gap: spacing.xl }}>
              <View>
                <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.textSecondary, marginBottom: spacing.xs }}>Issue title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter issue title"
                  placeholderTextColor={colors.textSecondary}
                  style={{ borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, fontSize: fontSize.sm, color: colors.text }}
                />
              </View>
              <View style={{ flexDirection: "column", gap: spacing.md }}>
                <View>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.textSecondary, marginBottom: spacing.xs }}>Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: "row", gap: spacing.sm }}>
                      {["Appliance", "Electrical", "Plumbing", "Safety", "Security"].map((t) => (
                        <TouchableOpacity key={t} onPress={() => setType(t)} style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: type === t ? colors.brand : colors.slate100 }}>
                          <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: type === t ? colors.white : colors.textSecondary }}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <View>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.textSecondary, marginBottom: spacing.xs }}>Priority</Text>
                  <View style={{ flexDirection: "row", gap: spacing.sm }}>
                    {["Low", "Medium", "High", "Critical"].map((p) => (
                      <TouchableOpacity key={p} onPress={() => setPriority(p)} style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: priority === p ? colors.brand : colors.slate100 }}>
                        <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: priority === p ? colors.white : colors.textSecondary }}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View>
                <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.textSecondary, marginBottom: spacing.xs }}>Description</Text>
                <TextInput
                  value={desc}
                  onChangeText={setDesc}
                  placeholder="Describe exact location, visible risk, and any temporary workaround"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  style={{ borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, fontSize: fontSize.sm, minHeight: 90, color: colors.text, textAlignVertical: "top" }}
                />
              </View>
              <TouchableOpacity onPress={handleSubmit} style={{ backgroundColor: colors.brand, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: spacing.sm }}>
                <Send size={14} color={colors.white} strokeWidth={2} />
                <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.white }}>Submit complaint</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        <View style={{ flex: 2, minWidth: 280 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.xl }}>
            <View style={{ flex: 2, minWidth: 200, flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border }}>
              <Search size={16} color={colors.slate400} />
              <TextInput 
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search issues, types, or vendors..." 
                placeholderTextColor={colors.slate400}
                style={{ flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, color: colors.slate900, fontSize: fontSize.sm }} 
              />
            </View>
            <View style={{ flex: 1, minWidth: 140, flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border }}>
              <DatePickerDropdown value={fromDate} onChange={setFromDate} placeholder="From" />
            </View>
            <View style={{ flex: 1, minWidth: 140, flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border }}>
              <DatePickerDropdown value={toDate} onChange={setToDate} placeholder="To" />
            </View>
          </View>

          <View style={{ gap: spacing.xl }}>
            {list.map((item) => (
              <ComplaintCard
                key={item.id}
                item={item}
                actions={
                  item.status === "Pending" ? [
                    { label: "Assign Vendor", onPress: () => assignVendor(item.id), primary: true },
                    { label: "Escalate", onPress: () => escalateComplaint(item.id), danger: true },
                  ] : item.status === "Escalated" ? [
                    { label: "Resolve", onPress: () => resolveComplaint(item.id), primary: true },
                  ] : undefined
                }
              />
            ))}
            {list.length === 0 && (
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing["4xl"] }}>No complaints found for this filter</Text>
            )}
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}
