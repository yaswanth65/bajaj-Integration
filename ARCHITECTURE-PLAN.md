# Architecture Plan — Role Restructure (AA Role)

## Corrected Hierarchy (Client-Verified)

```
RM (Ravi Nemalikanti)
 │  manages all branches
 ├── AM/BAM (Nikhil Joshi) — 33 branches
 │   ├── AA (G Teja) — 10-11 branches
 │   ├── AA (Naveen) — 10-11 branches
 │   └── AA (Mani Kumari) — 10-11 branches
 ├── AM/BAM (Pandla Munirathnam) — 33 branches
 │   ├── AA (E Prem Kumar) — 10-11 branches
 │   ├── AA (Rajesh Yelakuntla) — 10-11 branches
 │   └── AA (Anantapur AA) — 10-11 branches
 └── AM/BAM (Pachari Teja) — 33 branches
     ├── AA (Shaik Moulali Basha) — 8-11 branches
     ├── AA (Subash Manikanta) — 8-11 branches
     ├── AA (Edenaga Siva Sai) — 8-11 branches
     └── AA (Sandhya Rani) — 8-11 branches
         ↓
        LC (1 branch each)
```

**Key insight**: AM === BAM (same role). AA is a *separate role* with its own branchScope (10-11 branches), NOT inheriting all branches of the AM.

---

## 1. Database (Prisma Schema) — Backend

### 1a. Add `aa` to RoleId enum

```prisma
// prisma/schema.prisma
enum RoleId {
  lc
  branchManager
  aa             // <-- NEW
  rm
}
```

### 1b. User model (no structural change needed)

The existing model already supports everything:
- `role` field uses RoleId enum → just add `aa` value
- `managerId` → self-referencing for AA→AM, AM→RM
- `branchScope` → AA gets 10-11 branch IDs, AM gets ~33
- `branchId` → LC gets 1 branch

```prisma
model User {
  ...
  role        RoleId
  managerId   String?       // AA→AM, AM→RM
  manager     User?         @relation("ManagerRelation")
  subordinates User[]       @relation("ManagerRelation")
  branchId    String?       // LC only (single branch)
  branchScope String[]      // AM (~33), AA (~10-11)
  ...
}
```

### 1c. Migration

```bash
npx prisma migrate dev --name add_aa_role
```

### 1d. Seed data

Add AA users to `src/seed.ts`:
```
- G Teja (aa) → managerId: Nikhil, branchScope: [11 branch IDs]
- Naveen (aa) → managerId: Nikhil, branchScope: [11 branch IDs]
- Mani Kumari (aa) → managerId: Nikhil, branchScope: [11 branch IDs]
- Shaik Moulali Basha (aa) → managerId: Pachari, branchScope: [8 branch IDs]
- Subash Manikanta (aa) → managerId: Pachari, branchScope: [8 branch IDs]
- Edenaga Siva Sai (aa) → managerId: Pachari, branchScope: [8 branch IDs]
- Sandhya Rani (aa) → managerId: Pachari, branchScope: [8 branch IDs]
- E Prem Kumar (aa) → managerId: Muni, branchScope: [11 branch IDs]
- Rajesh Yelakuntla (aa) → managerId: Muni, branchScope: [11 branch IDs]
- (Anantapur AA) (aa) → managerId: Muni, branchScope: [11 branch IDs]
```

---

## 2. Backend Changes

### 2a. Controller changes

**Auth controller** (`src/controllers/auth.controller.ts`):
- Already returns `branchScope` and `role` → no change needed.
- Login response already includes all required fields.

**BM controllers** (`src/controllers/role/bm.controller.ts`):
- Already scoped by `user.branchScope` → works for AA automatically.
- All `bm*` endpoints filter by `branchScope` → no change needed.
- Just need to add AA role to `RoleId.branchManager` checks → change to `RoleId.aa` where appropriate.

**Middleware** (`auth.middleware.ts`):
- Add `aa` to allowed roles for BM routes.

### 2b. Route changes

**BM routes** (`src/routes/role/bm.routes.ts`):
- Currently restricts to `RoleId.branchManager`
- Add `RoleId.aa` to middleware:

```typescript
router.use(authMiddleware([RoleId.branchManager, RoleId.aa]));
```

### 2c. Summary of backend changes

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `aa` to `RoleId` enum |
| `src/seed.ts` | Add AA users with branchScope |
| `src/routes/role/bm.routes.ts` | Allow `RoleId.aa` in auth middleware |
| `src/controllers/role/bm.controller.ts` | Allow `RoleId.aa` in role checks |

No new endpoints needed. AA uses the same BM dashboard/approvals/visits/complaints endpoints. The difference is purely `branchScope` size.

---

## 3. Frontend Changes

### 3a. `src/types/domain.ts`

```typescript
export type RoleId = "lc" | "branchManager" | "aa" | "rm";
```

### 3b. `src/data/mockData.ts`

Add AA role definition (same pages as branchManager):

```typescript
export const ROLES: Record<RoleId, RoleDef> = {
  ...
  aa: {
    id: "aa",
    name: "Admin Assistant",
    short: "Branch cluster oversight",
    icon: "fa-user-gear",
    hierarchy: "AA -> AM -> RM",
    accent: "bg-cyan-500",
    pages: [
      // Same pages as branchManager (AM)
      { id: "home", label: "Overview", icon: "house" },
      { id: "branches", label: "Branches", icon: "building" },
      { id: "monitoring", label: "Task Monitor", icon: "chart-line" },
      { id: "attendance", label: "Attendance", icon: "users-viewfinder" },
      { id: "issues", label: "Issues", icon: "sitemap" },
      { id: "approvals", label: "Approvals", icon: "stamp" },
      { id: "visits", label: "Visits", icon: "route" },
      { id: "notifications", label: "Alerts", icon: "bell" },
      { id: "profile", label: "Profile", icon: "id-badge" },
    ],
  },
  ...
};
```

Update `initialTabState` — AA reuses `managerMonitoring`, `managerIssues` tab keys (same as branchManager).

Add AA mock user data to `users` array:
- G Teja, Naveen, Mani Kumari (under Nikhil)
- Shaik Moulali Basha, Subash Manikanta, Edenaga Siva Sai, Sandhya Rani (under Pachari)
- E Prem Kumar, Rajesh Yelakuntla, Anantapur AA (under Muni)

Update `currentUserByRole`:
```typescript
export const currentUserByRole: Record<RoleId, number> = {
  lc: 8, branchManager: 2, aa: 0, rm: 1
};
```

### 3c. `src/context/AppContext.tsx`

**Scope logic** (line ~324):
```typescript
const scopedBranchIds = useMemo(() => {
  if (!currentUser) return [];
  if (state.role === "rm") return branches.map((b) => b.id);
  if (state.role === "branchManager" || state.role === "aa")
    return currentUser.branchScope || [];
  return currentUser.branchId ? [currentUser.branchId] : [];
}, [state.role, currentUser, branches]);
```

**Refresh data endpoint mapping** (line ~376-428):
Add `aa` alongside `branchManager` in all role checks:

```typescript
const getEndpointsForPage = (page: string, role: string): string[] => {
  ...
  case "home":
  case "dashboard":
    if (role === "lc") return ["/lc/dashboard", ...common];
    if (role === "branchManager" || role === "aa")
      return ["/bm/dashboard", ...common];
    if (role === "rm") return ["/rm/dashboard", ...common];
    return common;
  case "tasks":
    if (role === "lc") return ["/lc/tasks"];
    if (role === "branchManager" || role === "aa")
      return ["/bm/tasks"];
    return ["/rm/tasks"];
  // ... repeat for all cases where branchManager is checked
};
```

**Switch role / login** (line ~612):
Add AA login credentials:
```typescript
if (role === "aa") email = "gteja@gmail.com"; // example
```

### 3d. Screen sharing (no new screens needed)

AA uses the same screens as AM/BAM. Only difference:
- `scopedBranches` shows fewer branches (~10-11 vs ~33)
- Role badge shows "AA" instead of "AM/BAM"

**BranchManagerHomeScreen** → shared by both AM and AA
**BranchManagerApprovalsScreen** → shared
**BranchManagerAttendanceScreen** → shared
**BranchManagerIssuesScreen** → shared
**BranchManagerBranchesScreen** → shared
**BranchManagerMonitoringScreen** → shared
**BranchManagerVisitsScreen** → shared

### 3e. UI: Role badge

Update the profile screen and top bar to show role label:
- AM → "AM/BAM" badge
- AA → "AA" badge (cyan color)
- RM → "RM" badge
- LC → "LC" badge

Add a helper in `src/utils/helpers.ts`:
```typescript
export const roleBadge = (role: RoleId) => {
  const map: Record<RoleId, { label: string; color: string }> = {
    lc: { label: "LC", color: "#10B981" },
    branchManager: { label: "AM/BAM", color: "#14B8A6" },
    aa: { label: "AA", color: "#06B6D4" },
    rm: { label: "RM", color: "#EF4444" },
  };
  return map[role];
};
```

---

## 4. Create User Flow (Future)

```
Login as RM → Users page → "Add User" button
─────────────────────────────────────────────
Select Role:
  [AM/BAM] → Select RM (parent) → Auto-scope: ALL branches
  [AA]     → Select AM (parent) → Select 10-11 branches manually
  [LC]     → Select AA (parent) → Select 1 branch (only branches without LC)
```

---

## 5. Implementation Order

```
Phase 1: Backend (database)
  [1] Add `aa` to Prisma RoleId enum
  [2] Run migration
  [3] Seed AA users with branchScope
  [4] Update BM routes to allow aa role

Phase 2: Backend (API)
  [5] Update bm.controller role checks to allow RoleId.aa
  [6] Verify all bm* endpoints filter by branchScope (already done)

Phase 3: Frontend (types + data)
  [7] Add `aa` to RoleId in domain.ts
  [8] Add AA role definition + pages in mockData.ts
  [9] Add AA mock users in mockData.ts
  [10] Update currentUserByRole + initialTabState

Phase 4: Frontend (context)
  [11] Update scopedBranchIds to include aa
  [12] Update getEndpointsForPage to handle aa
  [13] Update switchRole/login to support aa

Phase 5: Frontend (UI polish)
  [14] Add roleBadge helper
  [15] Show role badge in profile + top bar

Phase 6: Verify
  [16] TypeScript compile check (frontend)
  [17] TypeScript compile check (backend)
  [18] Login as AA → verify dashboard shows correct 10-11 branches
```

---

## Key Files Reference

| File | What changes |
|------|-------------|
| `backend/prisma/schema.prisma:10-14` | Add `aa` to `RoleId` enum |
| `backend/src/seed.ts` | Add AA users with branchScope |
| `backend/src/routes/role/bm.routes.ts` | Add `RoleId.aa` to middleware |
| `backend/src/controllers/role/bm.controller.ts` | Add `RoleId.aa` to role checks |
| `mobile-app/src/types/domain.ts:1` | Add `"aa"` to `RoleId` type |
| `mobile-app/src/data/mockData.ts` | Add AA ROLES, users, tabState |
| `mobile-app/src/context/AppContext.tsx:324` | Add `aa` to scopedBranchIds |
| `mobile-app/src/context/AppContext.tsx:376-428` | Add `aa` to endpoint mapping |
| `mobile-app/src/context/AppContext.tsx:612+` | Add AA login |
| `mobile-app/src/utils/helpers.ts` | Add roleBadge helper |
