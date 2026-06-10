import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Wallet, TrendingDown, DollarSign, Building, Clock, Search, ChevronRight, Sliders, ArrowUpDown } from "lucide-react-native";
import { ScreenWrapper } from "../../shared/layout/ScreenWrapper";
import { SectionHeader } from "../../shared/components/SectionHeader";
import { StatCard } from "../../shared/components/StatCard";
import { Card } from "../../shared/components/Card";
import { Badge } from "../../shared/components/Badge";
import { ProgressBar } from "../../shared/components/ProgressBar";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius, shadows } from "../../theme/theme";
import { formatMoney } from "../../utils/helpers";

export function RmFinanceScreen() {
  const { scopedBranches, scopedApprovals, openBranchDetail, updateBranchBudget, openApprovalDetail } = useApp();
  
  const [selectedBranch, setSelectedBranch] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [sortOrder, setSortOrder] = useState<"name" | "burn" | "budget">("name");
  const [approvalSort, setApprovalSort] = useState<"priority" | "amount">("priority");
  
  // Set budget input when selected branch changes
  useEffect(() => {
    if (selectedBranch) {
      const b = scopedBranches.find((x) => x.id === selectedBranch);
      if (b) {
        setBudgetInput(String(b.monthlyBudget));
      }
    } else {
      setBudgetInput("");
    }
  }, [selectedBranch, scopedBranches]);

  // Aggregate stats
  const totalBudget = scopedBranches.reduce((s, b) => s + b.monthlyBudget, 0);
  const totalUsed = scopedBranches.reduce((s, b) => s + b.usedBudget, 0);
  const totalBurnPct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
  
  const pendingApprovals = scopedApprovals.filter(
    (a) => a.status === "Pending" && (!selectedBranch || a.branchId === selectedBranch)
  );

  const selectedBranchData = selectedBranch ? scopedBranches.find((b) => b.id === selectedBranch) : null;

  // Filtered branches list
  const filteredBranches = scopedBranches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorted branches list
  const sortedBranches = [...filteredBranches].sort((a, b) => {
    if (sortOrder === "burn") {
      const burnA = a.monthlyBudget > 0 ? a.usedBudget / a.monthlyBudget : 0;
      const burnB = b.monthlyBudget > 0 ? b.usedBudget / b.monthlyBudget : 0;
      return burnB - burnA; // High burn first
    }
    if (sortOrder === "budget") {
      return b.monthlyBudget - a.monthlyBudget; // High budget first
    }
    return a.name.localeCompare(b.name);
  });

  // Sorted approvals list
  const sortedApprovals = [...pendingApprovals].sort((a, b) => {
    if (approvalSort === "amount") {
      return b.amount - a.amount; // High amount first
    }
    // High priority first
    const prioMap: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return (prioMap[b.priority] || 0) - (prioMap[a.priority] || 0);
  });

  const handleUpdateBudget = async () => {
    if (!selectedBranch) return;
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    await updateBranchBudget(selectedBranch, amount);
  };

  return (
    <ScreenWrapper>
      <SectionHeader 
        title="Financial Ops & Budget Command" 
        subtitle="Capex allocations, monthly branch ceiling configurations and emergency expense review"
      />

      {/* Overview stats */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.xl }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <StatCard 
            label="Total Regional Budget" 
            value={formatMoney(totalBudget)} 
            meta="Combined monthly limits" 
            icon={Wallet} 
            accent={colors.brand} 
          />
        </View>
        <View style={{ flex: 1, minWidth: 200 }}>
          <StatCard 
            label="Total Regional Spend" 
            value={formatMoney(totalUsed)} 
            meta={`${totalBurnPct}% total burn rate`} 
            icon={TrendingDown} 
            accent={colors.warning} 
          />
        </View>
      </View>

      <View style={{ marginTop: spacing.xl, flexDirection: "row", flexWrap: "wrap", gap: spacing.xl }}>
        
        {/* Left Column: Budget allocations & controls */}
        <View style={{ flex: 2, minWidth: 320, gap: spacing.xl }}>
          
          {/* Allocation control card (visible when branch is selected) */}
          {selectedBranchData && (
            <Card variant="soft" style={{ borderLeftWidth: 4, borderLeftColor: colors.brand, ...shadows.card }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
                <Text style={{ fontSize: fontSize.md, fontWeight: "700", color: colors.slate900 }}>
                  Adjust Budget Ceiling
                </Text>
                <TouchableOpacity onPress={() => setSelectedBranch(null)} style={{ padding: spacing.xs }}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.slate400 }}>Clear Selection</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.slate900 }}>
                {selectedBranchData.name}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.slate500, marginTop: 2 }}>
                Current Limit: {formatMoney(selectedBranchData.monthlyBudget)} · Spent: {formatMoney(selectedBranchData.usedBudget)}
              </Text>
              
              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xl, alignItems: "center" }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: fontSize.sm, color: colors.slate400, marginRight: spacing.xs }}>₹</Text>
                  <TextInput 
                    value={budgetInput}
                    onChangeText={setBudgetInput}
                    placeholder="Enter limit"
                    keyboardType="numeric"
                    style={{ flex: 1, paddingVertical: spacing.md, color: colors.slate900, fontSize: fontSize.sm, fontWeight: "600" }}
                  />
                </View>
                <TouchableOpacity 
                  onPress={handleUpdateBudget}
                  style={{ backgroundColor: colors.brand, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, justifyContent: "center", height: 48 }}
                >
                  <Text style={{ color: colors.white, fontSize: fontSize.sm, fontWeight: "700" }}>Apply Limit</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Roster of branch budgets */}
          <Card variant="glass">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.lg }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.slate900 }}>Branch Budget Roster</Text>
              <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
                <Sliders size={14} color={colors.slate400} />
                <TouchableOpacity onPress={() => setSortOrder(sortOrder === "name" ? "burn" : sortOrder === "burn" ? "budget" : "name")}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.brand, fontWeight: "600" }}>
                    Sort: {sortOrder === "name" ? "Name" : sortOrder === "burn" ? "Highest Burn %" : "Highest Budget"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search box */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg }}>
              <Search size={16} color={colors.slate400} />
              <TextInput 
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search branches..." 
                placeholderTextColor={colors.slate400}
                style={{ flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, color: colors.slate900, fontSize: fontSize.sm }} 
              />
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: spacing.lg }}>
                {sortedBranches.map((branch) => {
                  const pct = branch.monthlyBudget > 0 ? Math.round((branch.usedBudget / branch.monthlyBudget) * 100) : 0;
                  const isSelected = selectedBranch === branch.id;
                  return (
                    <TouchableOpacity 
                      key={branch.id} 
                      onPress={() => setSelectedBranch(branch.id)}
                      activeOpacity={0.7} 
                      style={{ 
                        backgroundColor: isSelected ? colors.brandLight : colors.white, 
                        borderRadius: borderRadius.xl, 
                        padding: spacing.lg, 
                        borderWidth: 1, 
                        borderColor: isSelected ? colors.brand : colors.border 
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                          <Building size={16} color={colors.slate600} />
                          <Text style={{ fontSize: fontSize.md, fontWeight: "700", color: colors.slate900 }}>{branch.name}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                          <Badge label={`${pct}% Used`} type={pct >= 85 ? "Critical" : pct >= 65 ? "High" : "Completed"} />
                          <TouchableOpacity onPress={() => openBranchDetail(branch.id)}>
                            <ChevronRight size={16} color={colors.slate400} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={{ marginTop: spacing.md }}>
                        <ProgressBar value={pct} color={pct >= 85 ? colors.error : pct >= 65 ? colors.warning : colors.success} height={6} />
                      </View>
                      
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
                        <Text style={{ fontSize: fontSize.xs, color: colors.slate500 }}>Spent: {formatMoney(branch.usedBudget)}</Text>
                        <Text style={{ fontSize: fontSize.xs, color: colors.slate500 }}>Ceiling: {formatMoney(branch.monthlyBudget)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </Card>
        </View>

        {/* Right Column: Approvals list */}
        <View style={{ flex: 1.5, minWidth: 280, gap: spacing.xl }}>
          <Card variant="glass">
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
              <View>
                <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.slate900 }}>Financial Approvals</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.slate500, marginTop: 2 }}>{pendingApprovals.length} pending</Text>
              </View>
              <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
                <ArrowUpDown size={12} color={colors.slate400} />
                <TouchableOpacity onPress={() => setApprovalSort(approvalSort === "priority" ? "amount" : "priority")}>
                  <Text style={{ fontSize: fontSize.xs, color: colors.brand, fontWeight: "600" }}>
                    Sort: {approvalSort === "priority" ? "Priority" : "Amount"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: spacing.md }}>
                {sortedApprovals.map((approval) => (
                  <TouchableOpacity 
                    key={approval.id} 
                    onPress={() => openApprovalDetail(approval.id)}
                    activeOpacity={0.8}
                    style={{ backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }}
                  >
                    <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                      <Badge label={approval.kind} type={approval.priority} />
                      <Badge label={approval.priority} type={approval.priority} />
                    </View>
                    <Text style={{ fontSize: fontSize.md, fontWeight: "700", color: colors.slate900, marginTop: spacing.md }}>
                      {approval.title}
                    </Text>
                    <Text style={{ fontSize: fontSize.xs, color: colors.slate500, marginTop: spacing.xs }}>
                      {approval.note}
                    </Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md }}>
                      <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.brand }}>
                        {formatMoney(approval.amount)}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                        <Clock size={12} color={colors.slate400} />
                        <Text style={{ fontSize: fontSize.xs, color: colors.slate400 }}>{approval.age}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                {sortedApprovals.length === 0 && (
                  <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing["4xl"] }}>
                    No pending approvals
                  </Text>
                )}
              </View>
            </ScrollView>
          </Card>
        </View>

      </View>
    </ScreenWrapper>
  );
}
