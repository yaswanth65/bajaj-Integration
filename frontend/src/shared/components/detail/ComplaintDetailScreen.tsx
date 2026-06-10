import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  Wrench, ChevronRight, MapPin, Clock, DollarSign, User, Truck,
  AlertTriangle, CheckCircle2, XCircle, MessageSquare, ArrowUpRight, FileText,
  Shield, CircleDollarSign, Calendar
} from "lucide-react-native";
import { ScreenWrapper } from "../../../shared/layout/ScreenWrapper";
import { Card } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { useApp } from "../../../context/AppContext";
import { colors, fontSize, spacing, borderRadius } from "../../../theme/theme";
import { formatMoney } from "../../../utils/helpers";

interface Props {
  complaintId: string;
  onBack: () => void;
}

export function ComplaintDetailScreen({ complaintId, onBack }: Props) {
  const { getComplaint, getBranch, getUser, resolveComplaint, escalateComplaint, assignVendor, approveHighCost, showToast } = useApp();
  const complaint = getComplaint(complaintId);

  if (!complaint) return null;

  const branch = getBranch(complaint.branchId);
  const reporter = getUser(complaint.reportedBy);

  return (
    <ScreenWrapper>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl }}>
        <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, borderRadius: borderRadius.md, backgroundColor: colors.slate100, alignItems: "center", justifyContent: "center" }}>
          <ChevronRight size={18} color={colors.text} strokeWidth={2} style={{ transform: [{ rotate: "180deg" }] }} />
        </TouchableOpacity>
        <Text style={{ fontSize: fontSize.xl, fontWeight: "400", color: colors.text, flex: 1 }}>Issue Details</Text>
      </View>

      <Card variant="soft" style={{ backgroundColor: colors.text, marginBottom: spacing.xl }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              <Badge label={complaint.status} type={complaint.status as any} />
              <Badge label={complaint.priority} type={complaint.priority} />
            </View>
            <Text style={{ fontSize: fontSize["3xl"], fontWeight: "400", color: colors.white, marginTop: spacing.lg }}>{complaint.title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm }}>
              <MapPin size={14} color={colors.slate300} strokeWidth={2} />
              <Text style={{ fontSize: fontSize.sm, color: colors.slate300 }}>{branch?.name}</Text>
            </View>
          </View>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: complaint.status === "Escalated" ? colors.rose500 + "30" : complaint.status === "Pending" ? colors.amber500 + "30" : complaint.status === "Rejected" ? colors.slate300 + "30" : colors.emerald500 + "30", alignItems: "center", justifyContent: "center" }}>
            {complaint.status === "Escalated" ? <AlertTriangle size={24} color={colors.rose200} strokeWidth={2} /> : complaint.status === "Pending" ? <Clock size={24} color={colors.amber200} strokeWidth={2} /> : complaint.status === "Rejected" ? <XCircle size={24} color={colors.slate200} strokeWidth={2} /> : <CheckCircle2 size={24} color={colors.emerald200} strokeWidth={2} />}
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginBottom: spacing.xl }}>
        <View style={{ flex: 1, minWidth: 90, backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
          <DollarSign size={16} color={colors.brand} strokeWidth={2} />
          <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text, marginTop: spacing.sm }}>{formatMoney(complaint.estimatedCost)}</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Est. cost</Text>
        </View>
        <View style={{ flex: 1, minWidth: 90, backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
          <Shield size={16} color={colors.warning} strokeWidth={2} />
          <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text, marginTop: spacing.sm }}>{complaint.escalationStage}</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Stage</Text>
        </View>
        <View style={{ flex: 1, minWidth: 90, backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}>
          <Truck size={16} color={colors.brandSecondary} strokeWidth={2} />
          <Text numberOfLines={1} style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text, marginTop: spacing.sm }}>{complaint.assignedVendor.split(" ")[0]}</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Vendor</Text>
        </View>
      </View>

      <View style={{ gap: spacing.xl }}>
        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={16} color={colors.brand} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Issue Information</Text>
          </View>
          <View style={{ gap: spacing.sm }}>
            {[
              { label: "Type", value: complaint.type, icon: Wrench },
              { label: "Priority", value: complaint.priority, icon: AlertTriangle },
              { label: "Reported by", value: reporter?.name || "Unknown", icon: User },
              { label: "Created", value: complaint.createdAt, icon: Calendar },
              { label: "Impact", value: complaint.impact, icon: AlertTriangle },
              { label: "Asset ID", value: complaint.assetId ? String(complaint.assetId) : "N/A", icon: FileText },
            ].map((row) => (
              <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.slate50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <row.icon size={14} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{row.label}</Text>
                </View>
                <Text numberOfLines={2} style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text, maxWidth: 180, textAlign: "right" }}>{row.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
              <FileText size={16} color={colors.brand} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Description</Text>
          </View>
          <View style={{ backgroundColor: colors.slate50, borderRadius: borderRadius.lg, padding: spacing.xl }}>
            <Text style={{ fontSize: fontSize.sm, color: colors.text, lineHeight: 20 }}>{complaint.description}</Text>
          </View>
        </Card>

        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={16} color={colors.brand} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Timeline</Text>
          </View>
          <View style={{ gap: spacing.md }}>
            {complaint.timeline.map((entry: string, i: number) => (
              <View key={i} style={{ backgroundColor: i === complaint.timeline.length - 1 ? colors.brandLight : colors.slate50, borderRadius: borderRadius.lg, padding: spacing.xl, flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: i === complaint.timeline.length - 1 ? colors.brand : colors.slate300, alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: "400", color: colors.white }}>{i + 1}</Text>
                </View>
                <Text style={{ fontSize: fontSize.sm, color: i === complaint.timeline.length - 1 ? colors.text : colors.textSecondary, flex: 1 }}>{entry}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card variant="glass">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 32, height: 32, borderRadius: borderRadius.md, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center" }}>
              <Truck size={16} color={colors.brand} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "400", color: colors.text }}>Vendor & Cost</Text>
          </View>
          <View style={{ gap: spacing.sm }}>
            {[
              { label: "Assigned vendor", value: complaint.assignedVendor, icon: Truck },
              { label: "Estimated cost", value: formatMoney(complaint.estimatedCost), icon: CircleDollarSign },
              { label: "Escalation stage", value: complaint.escalationStage, icon: Shield },
            ].map((row) => (
              <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.slate50, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <row.icon size={14} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{row.label}</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.text, maxWidth: 180 }}>{row.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {complaint.status !== "Resolved" && complaint.status !== "Rejected" && (
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TouchableOpacity onPress={() => resolveComplaint(complaint.id)} style={{ backgroundColor: colors.success, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
              <CheckCircle2 size={16} color={colors.white} strokeWidth={2} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.white }}>Resolve</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => escalateComplaint(complaint.id)} style={{ backgroundColor: colors.error, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
              <ArrowUpRight size={16} color={colors.white} strokeWidth={2} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.white }}>Escalate</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => assignVendor(complaint.id)} style={{ backgroundColor: colors.brandSecondary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
              <Truck size={16} color={colors.white} strokeWidth={2} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: "400", color: colors.white }}>Assign</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
