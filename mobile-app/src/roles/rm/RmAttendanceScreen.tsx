import React, { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { CheckCircle2, Clock, XCircle, Building, Users, Search, CalendarDays, ChevronLeft, ChevronRight, ListChecks, Layers } from "lucide-react-native";
import { ScreenWrapper } from "../../shared/layout/ScreenWrapper";
import { SectionHeader } from "../../shared/components/SectionHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { SegmentedControl } from "../../shared/components/SegmentedControl";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius } from "../../theme/theme";

function TouchableChip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
        isSelected
          ? { backgroundColor: colors.brand, borderColor: colors.brand }
          : { backgroundColor: colors.white, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          { fontSize: fontSize.sm, fontWeight: "500" },
          isSelected ? { color: colors.white } : { color: colors.slate700 },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function RmAttendanceScreen() {
  const { scopedAttendance, scopedBranches, scopedTasks, state, getBranch, scopedUsers } = useApp();
  const todayAttendance = scopedAttendance.filter((a) => a.date === state.today);
  const [activeTab, setActiveTab] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string | number>("");

  useEffect(() => {
    setSelectedBranchId("");
  }, [selectedRegion]);

  const uniqueRegions = useMemo(() => {
    const regions = scopedBranches.map((b) => {
      let r = b.city || "";
      if (r.toLowerCase() === "chhatisgarh") return "Chhattisgarh";
      return r;
    }).filter((c) => c && c !== "Pending");
    return Array.from(new Set(regions)).sort();
  }, [scopedBranches]);

  const branchesInRegion = useMemo(() => {
    if (!selectedRegion) return [];
    if (selectedRegion === "all") return scopedBranches;
    return scopedBranches.filter((b) => {
      let r = b.city || "";
      if (r.toLowerCase() === "chhatisgarh") r = "Chhattisgarh";
      return r === selectedRegion;
    });
  }, [scopedBranches, selectedRegion]);

  const activeBranchIds = useMemo(() => {
    if (!selectedRegion || selectedBranchId === "") return [];
    if (selectedBranchId === "all") return branchesInRegion.map(b => b.id);
    return [selectedBranchId];
  }, [selectedRegion, selectedBranchId, branchesInRegion]);

  const staffUsers = scopedUsers.filter(u =>
    activeBranchIds.includes(u.branchId) && (u.role === "lc" || u.role === "branchManager" || (u.role as string) === "worker" || (u.role as string) === "employee")
  );

  const filteredStaff = staffUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const regionAttendance = todayAttendance.filter(a => staffUsers.find(u => u.id === a.userId));

  const canShowData = selectedRegion !== "" && selectedBranchId !== "";

  return (
    <ScreenWrapper>
      <SectionHeader
        title="Regional Attendance"
        action={
          <SegmentedControl
            tabs={[
              { label: "Today", value: "today" },
              { label: "Calendar", value: "calendar" },
            ]}
            activeKey={activeTab}
            onChange={(v) => setActiveTab(v)}
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xl, paddingBottom: 40, paddingTop: spacing.lg }}>
        {/* STEP 1: REGIONS PICKER */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.slate400, marginBottom: spacing.sm, fontWeight: "600" }}>
            1. CHOOSE REGION
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <TouchableChip label="All Regions" isSelected={selectedRegion === "all"} onPress={() => setSelectedRegion("all")} />
            {uniqueRegions.map((region) => (
              <TouchableChip key={region} label={region} isSelected={selectedRegion === region} onPress={() => setSelectedRegion(region)} />
            ))}
          </View>
        </View>

        {/* STEP 2: BRANCH PICKER */}
        {selectedRegion !== "" ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.slate400, marginBottom: spacing.sm, fontWeight: "600" }}>
              2. CHOOSE BRANCH
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <TouchableChip label="All Branches" isSelected={selectedBranchId === "all"} onPress={() => setSelectedBranchId("all")} />
              {branchesInRegion.map((b) => (
                <TouchableChip key={b.id} label={b.name} isSelected={selectedBranchId === b.id} onPress={() => setSelectedBranchId(b.id)} />
              ))}
            </View>
          </View>
        ) : (
          <Card style={{ marginTop: spacing.xl, padding: spacing.xl, borderStyle: "dashed", borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
            <Layers size={24} color={colors.slate300} style={{ marginBottom: spacing.sm }} />
            <Text style={{ fontSize: fontSize.sm, color: colors.slate400 }}>Select a region above to load branches</Text>
          </Card>
        )}

        {canShowData ? (
          <>
            {activeTab === "today" && (
              <Card variant="glass">
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
                  <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
                    <Users size={16} color={colors.brand} strokeWidth={2} />
                  </View>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Today's Roster & Tasks</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg }}>
                  <Search size={16} color={colors.textSecondary} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search staff..."
                    placeholderTextColor={colors.textSecondary}
                    style={{ flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, color: colors.text, fontSize: fontSize.sm }}
                  />
                </View>

                <View style={{ gap: spacing.md }}>
                  {filteredStaff.map((staff) => {
                    const branch = getBranch(staff.branchId);
                    const attRecord = regionAttendance.find(a => a.userId === staff.id);
                    const isPresent = attRecord?.status === "Present" || attRecord?.status === "Late";
                    const staffTasks = scopedTasks.filter(t => t.assignedTo === staff.id && (t.status === "Pending" || t.status === "In Progress" || t.status === "Completed"));

                    return (
                      <View key={staff.id} style={{ backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: colors.border }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <View style={{ flex: 1, flexDirection: "row", gap: spacing.lg }}>
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isPresent ? colors.emerald50 : colors.rose50, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: isPresent ? colors.emerald200 : colors.rose200 }}>
                              <Text style={{ fontSize: fontSize.lg, color: isPresent ? colors.emerald700 : colors.rose700 }}>{staff.name.charAt(0)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: fontSize.md, fontWeight: "400", color: colors.slate900 }}>{staff.name}</Text>
                              <Text style={{ fontSize: fontSize.xs, color: colors.slate500 }}>{staff.role === "branchManager" ? "BM" : staff.role === "lc" ? "LC" : staff.role.toUpperCase()} | {branch?.name}</Text>
                              {isPresent ? (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs }}>
                                  <Clock size={12} color={colors.success} />
                                  <Text style={{ fontSize: fontSize.xs, color: colors.success }}>Punched in at {attRecord?.checkIn}</Text>
                                </View>
                              ) : (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs }}>
                                  <XCircle size={12} color={colors.error} />
                                  <Text style={{ fontSize: fontSize.xs, color: colors.error }}>Absent or not punched in</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Badge label={attRecord?.status || "Absent"} type={attRecord?.status || "Pending"} />
                        </View>

                        {staffTasks.length > 0 ? (
                          <View style={{ marginTop: spacing.lg, borderTopWidth: 1, borderColor: colors.slate100, paddingTop: spacing.md, gap: spacing.xs }}>
                            <Text style={{ fontSize: fontSize.xs, color: colors.slate400, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.xs }}>Today's Queue</Text>
                            {staffTasks.map(t => (
                              <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                                <ListChecks size={14} color={t.status === "Completed" ? colors.success : colors.brandSecondary} />
                                <Text style={{ fontSize: fontSize.sm, color: t.status === "Completed" ? colors.slate400 : colors.slate700, textDecorationLine: t.status === "Completed" ? "line-through" : "none" }}>{t.title}</Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <View style={{ marginTop: spacing.lg, borderTopWidth: 1, borderColor: colors.slate100, paddingTop: spacing.md }}>
                            <Text style={{ fontSize: fontSize.sm, color: colors.slate400, fontStyle: "italic" }}>No tasks assigned for today</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {filteredStaff.length === 0 && (
                    <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing.xl }}>No staff found</Text>
                  )}
                </View>
              </Card>
            )}

            {activeTab === "calendar" && (
              <View style={{ gap: spacing.xl }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: colors.border }}>
                  <TouchableOpacity style={{ padding: spacing.sm, backgroundColor: colors.slate50, borderRadius: 12 }}>
                    <ChevronLeft size={20} color={colors.slate700} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.slate900 }}>{selectedMonth}</Text>
                  <TouchableOpacity style={{ padding: spacing.sm, backgroundColor: colors.slate50, borderRadius: 12 }}>
                    <ChevronRight size={20} color={colors.slate700} />
                  </TouchableOpacity>
                </View>

                <View style={{ gap: spacing.md }}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
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
                  }).map((date) => {
                    const dayAtt = scopedAttendance.filter((a) => a.date === date && activeBranchIds.includes(getBranch(scopedUsers.find(u => u.id === a.userId)?.branchId ?? "")?.id ?? ""));
                    const presentCount = dayAtt.filter((a) => a.status === "Present" || a.status === "Late").length;
                    const absentStaff = staffUsers.filter(u => !dayAtt.find(a => a.userId === u.id && (a.status === "Present" || a.status === "Late")));

                    return (
                      <View key={date} style={{ backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: colors.border }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
                              <Text style={{ fontSize: fontSize.xl, color: colors.brand }}>{date.slice(-2)}</Text>
                            </View>
                            <View>
                              <Text style={{ fontSize: fontSize.md, fontWeight: "400", color: colors.slate900 }}>{new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
                              <Text style={{ fontSize: fontSize.xs, color: colors.slate500 }}>{presentCount} / {staffUsers.length} staff present</Text>
                            </View>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Badge label={`${Math.round((presentCount / (staffUsers.length || 1)) * 100)}%`} type={presentCount / (staffUsers.length || 1) >= 0.8 ? "Completed" : "High"} />
                          </View>
                        </View>

                        {absentStaff.length > 0 && (
                          <View style={{ backgroundColor: colors.rose50, borderRadius: borderRadius.xl, padding: spacing.md }}>
                            <Text style={{ fontSize: fontSize.xs, color: colors.rose700, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.xs }}>Absent Staff ({absentStaff.length})</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                              {absentStaff.slice(0, 8).map(u => (
                                <Text key={u.id} style={{ fontSize: fontSize.sm, color: colors.rose700 }}>• {u.name.split(" ")[0]}</Text>
                              ))}
                              {absentStaff.length > 8 && <Text style={{ fontSize: fontSize.sm, color: colors.rose700 }}>+ {absentStaff.length - 8} more</Text>}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        ) : (
          selectedRegion !== "" && (
            <Card style={{ marginTop: spacing.xl, padding: spacing.xl, borderStyle: "dashed", borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
              <Layers size={24} color={colors.slate300} style={{ marginBottom: spacing.sm }} />
              <Text style={{ fontSize: fontSize.sm, color: colors.slate400 }}>Select a branch or "All Branches" to load attendance</Text>
            </Card>
          )
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
