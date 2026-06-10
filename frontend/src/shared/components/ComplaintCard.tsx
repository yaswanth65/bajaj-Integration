import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Complaint } from "../../types/domain";
import { useApp } from "../../context/AppContext";
import { colors, fontSize, spacing, borderRadius, shadows } from "../../theme/theme";
import { formatMoney } from "../../utils/helpers";
import { Badge } from "./Badge";

interface Props {
  item: Complaint;
  actions?: { label: string; onPress: () => void; primary?: boolean; danger?: boolean; warning?: boolean }[];
}

export function ComplaintCard({ item, actions }: Props) {
  const { getBranch, openComplaintDetail } = useApp();
  const branch = getBranch(item.branchId);

  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl, ...shadows.card }}>
      <View style={{ gap: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center", marginBottom: spacing.md }}>
            <Badge label={item.status} type={item.status} />
            <Badge label={item.priority} type={item.priority} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: "600", color: colors.slate400, textTransform: "uppercase", letterSpacing: 0.3 }}>{item.type}</Text>
          </View>
          <View style={{ gap: spacing.xs }}>
            <Text style={{ fontSize: fontSize.xl, fontWeight: "700", color: colors.slate900 }}>{item.title}</Text>
            <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.slate500 }}>{branch?.name} | {item.impact}</Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.xl }}>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.slate400, marginBottom: 2 }}>Vendor</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.slate900 }}>{item.assignedVendor}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.slate400, marginBottom: 2 }}>Est. Cost</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.slate900 }}>{formatMoney(item.estimatedCost)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.slate400, marginBottom: 2 }}>Escalation</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.slate900 }}>{item.escalationStage}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.slate400, marginBottom: 2 }}>Raised</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.slate900 }}>{item.createdAt}</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => openComplaintDetail(item.id)}
            style={{ borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.slate900, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
          >
            <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.white }}>View detail</Text>
          </TouchableOpacity>
          {actions?.map((a, i) => (
            <TouchableOpacity
              key={i}
              onPress={a.onPress}
              style={{ borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: a.danger ? colors.error : a.warning ? colors.warning : a.primary ? colors.success : colors.white, borderWidth: (a.danger || a.warning || a.primary) ? 0 : 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
            >
              <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: (a.danger || a.warning || a.primary) ? colors.white : colors.slate700 }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
