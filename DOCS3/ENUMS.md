# Enumerations

All enums are defined in Prisma schema (`prisma/schema.prisma`).  
The mobile app mirrors them in `src/types/domain.ts` with identical string literal values.

---

## RoleId

| Value | Description |
|---|---|
| `lc` | Location Coordinator — branch-level operator |
| `branchManager` | Branch Admin Manager (BAM) — oversees multiple branches |
| `rm` | Regional Manager — global oversight |

**Scope logic:**
- LC: sees only `branchId` (single branch)
- BM: sees branches listed in `branchScope` (string array)
- RM: sees all branches (no scope filter)

---

## Priority

| Value | Meaning |
|---|---|
| `Critical` | Requires immediate attention |
| `High` | Urgent priority |
| `Medium` | Normal priority |
| `Low` | Informational |

---

## TaskStatus

| Value | Meaning |
|---|---|
| `Pending` | Not started |
| `InProgress` | Currently being worked on (not actively used; reserved for future) |
| `Completed` | Finished successfully with or without proof |
| `Revoked` | Sent back for revision (soft-archive), or archived by BM |

---

## ComplaintStatus

| Value | Meaning |
|---|---|
| `Pending` | Newly raised, awaiting action |
| `Escalated` | Escalated to the next stage (BM or RM) |
| `Resolved` | Closed after resolution |
| `Rejected` | Soft-deleted / rejected by BM or RM (via `deleteComplaint` or `bmRejectComplaint`) |

---

## ApprovalStatus

| Value | Meaning |
|---|---|
| `Pending` | Awaiting decision |
| `Approved` | Approved; amount deducted from branch `usedBudget` |
| `Rejected` | Rejected; no budget impact |

---

## ApplianceStatus

| Value | Meaning |
|---|---|
| `Operational` | Working normally |
| `AtRisk` | Needs attention or servicing |
| `Critical` | Imminent failure or safety risk |
| `Down` | Soft-decommissioned (via `PATCH /appliances/:id/decommission`) |

---

## VisitStatus

| Value | Meaning |
|---|---|
| `Scheduled` | Planned visit |
| `Escalated` | Visit flagged for attention (not actively used) |
| `Completed` | Report filed and visit closed |
| `Cancelled` | Soft-cancelled (via `PATCH /bm/visits/:id/cancel`) |

---

## AttStatus (Attendance)

| Value | Meaning |
|---|---|
| `Present` | Marked attendance on time |
| `Late` | Checked in after shift start |
| `Absent` | No attendance record for the day |
