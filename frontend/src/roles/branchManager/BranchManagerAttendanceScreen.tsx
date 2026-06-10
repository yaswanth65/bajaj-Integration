import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { CheckCircle2, Clock, XCircle, Building, Users, Search, CalendarDays, ChevronLeft, ChevronRight, ListChecks } from "lucide-react-native";
import { ScreenWrapper } from "../../shared/layout/ScreenWrapper";
import { SectionHeader } from "../../shared/components/SectionHeader";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { SegmentedControl } from "../../shared/components/SegmentedControl";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius } from "../../theme/theme";

export function BranchManagerAttendanceScreen() {
  const { scopedAttendance, scopedUsers, scopedTasks, state, getBranch } = useApp();
  const todayAttendance = scopedAttendance.filter((a) => a.date === state.today);
  const [activeTab, setActiveTab] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));

  const staffUsers = scopedUsers.filter(u => u.role === "lc" || (u.role as string) === "worker" || (u.role as string) === "employee");

  const filteredStaff = staffUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenWrapper>
      <SectionHeader 
        title="Staff Attendance" 
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
                const attRecord = todayAttendance.find(a => a.userId === staff.id);
                const isPresent = attRecord?.status === "Present" || attRecord?.status === "Late";
                const dailyTasksEntered = attRecord?.weeklyTasks || [];
                const enteredTitles = new Set(dailyTasksEntered.map(t => t.description.toLowerCase().trim()));
                
                const staffTasks = scopedTasks.filter(t => String(t.assignedTo) === String(staff.id) && (t.status === "Pending" || t.status === "In Progress" || t.status === "Completed"));
                
                // Merge daily task plan items and other scoped tasks
                const mergedTasks = [
                  ...dailyTasksEntered.map(t => {
                    const matched = staffTasks.find(st => st.title.toLowerCase().trim() === t.description.toLowerCase().trim());
                    return {
                      id: t.id,
                      title: t.description,
                      status: matched?.status || "Pending"
                    };
                  }),
                  ...staffTasks.filter(st => !enteredTitles.has(st.title.toLowerCase().trim())).map(st => ({
                    id: String(st.id),
                    title: st.title,
                    status: st.status
                  }))
                ];

                return (
                  <View key={staff.id} style={{ backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View style={{ flex: 1, flexDirection: "row", gap: spacing.lg }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isPresent ? colors.emerald50 : colors.rose50, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: isPresent ? colors.emerald200 : colors.rose200 }}>
                          <Text style={{ fontSize: fontSize.lg, color: isPresent ? colors.emerald700 : colors.rose700 }}>{staff.name.charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: fontSize.md, fontWeight: "400", color: colors.slate900 }}>{staff.name}</Text>
                          <Text style={{ fontSize: fontSize.xs, color: colors.slate500 }}>{staff.role.toUpperCase()} | {branch?.name}</Text>
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
 
                    {mergedTasks.length > 0 ? (
                      <View style={{ marginTop: spacing.lg, borderTopWidth: 1, borderColor: colors.slate100, paddingTop: spacing.md, gap: spacing.xs }}>
                        <Text style={{ fontSize: fontSize.xs, color: colors.slate400, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.xs }}>Today's Queue</Text>
                        {mergedTasks.map(t => (
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
                const dayAtt = scopedAttendance.filter((a) => a.date === date);
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
      </ScrollView>
    </ScreenWrapper>
  );
}
