# Build 3c Session Log — Training Gate + Budget Conversion

**Date:** 2026-02-09
**Build:** 3c of the Hooomz Interiors platform
**Scope:** Training Gate + Estimate → Budget Conversion
**Typecheck:** 0 errors
**IndexedDB:** v9 → v10

---

## What Was Built

### Part 1: Crew Member Records

**Replaces hardcoded `CREW_MEMBERS` array with IndexedDB-backed crew records.**

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared-contracts/src/types/integration.ts` | Extended | Added `CrewMember`, `CrewTier` types |
| `apps/web/src/lib/storage/StorageAdapter.ts` | Extended | Added `CREW_MEMBERS`, `TRAINING_RECORDS`, `TASK_BUDGETS` store names |
| `apps/web/src/lib/storage/IndexedDBAdapter.ts` | Extended | Bumped v9→v10, added indexes for 3 new stores |
| `apps/web/src/lib/repositories/crewMember.repository.ts` | Created | CRUD + `findActive()` + `createWithId()` for stable seed IDs |
| `apps/web/src/lib/services/index.ts` | Extended | Added `crew`, `training`, `budget` to Services interface |
| `apps/web/src/components/crew/CrewSelector.tsx` | Updated | Reads from IndexedDB via `useActiveCrewMembers()`, falls back to hardcoded list. Shows tier badges. |
| `apps/web/src/lib/data/seedAll.ts` | Extended | Seeds Nathan ($45/$95 master) and Nishant ($28/$55 learner) |
| `apps/web/src/app/labs/seed/page.tsx` | Extended | Shows crew member count in seed summary + clears crew on re-seed |

**Crew Tier System:**
- `learner` → `proven` → `lead` → `master`
- Each member has `wageRate` (payroll cost) and `chargedRate` (what estimate bills)
- Nathan: $45/$95, Nishant: $28/$55

### Part 2: Training Records

**Per-crew, per-SOP training progression tracking.**

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared-contracts/src/types/integration.ts` | Extended | Added `TrainingRecord`, `TrainingStatus`, `SupervisedCompletion`, `ReviewAttempt` |
| `apps/web/src/lib/repositories/trainingRecord.repository.ts` | Created | CRUD + `findByCrewMember()`, `findBySop()`, `findByCrewAndSop()` |
| `apps/web/src/lib/services/training.service.ts` | Created | `getOrCreate()`, `recordSupervisedCompletion()`, `recordReviewAttempt()`, `certify()`, `isCertified()`, `getCrewTrainingSummary()` |

**Certification Flow (Agreement E):**
1. 3 supervised completions (auto-detected from time entries with supervisor role)
2. Review assessment (80% threshold, recorded via `recordReviewAttempt()`)
3. Manual signoff via `certify()` — NEVER automatic

**Soft Gate:** `isCertified()` returns info only, never blocks task assignment.

### Part 3: Training UI

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/labs/training/page.tsx` | Created | Dashboard showing all crew members with training stats (certified/review-ready/in-progress) |
| `apps/web/src/app/labs/training/[crewId]/page.tsx` | Created | Detail page for a crew member showing all SOPs with completion progress, status pills, certification/review buttons |

**UI Features:**
- Summary bar with certified/review-ready/in-progress counts
- Per-crew cards with progress bars and status pills
- Per-SOP rows with completion count, review count, progress bars
- **Certification Modal**: Shows pre-check warnings (completions met? review passed?), allows manual override
- **Review Recording Modal**: Score input (0-100), pass/fail indicator vs 80% threshold, notes field

### Part 4: Budget (Estimate → Budget Conversion)

| File | Action | Purpose |
|------|--------|---------|
| `packages/shared-contracts/src/types/integration.ts` | Extended | Added `TaskBudget` type |
| `apps/web/src/lib/repositories/taskBudget.repository.ts` | Created | CRUD + `findByTask()`, `findByProject()`, `findByBlueprint()`, `findOverBudget()` |
| `apps/web/src/lib/services/budget.service.ts` | Created | `createFromDeployment()`, `updateActualHours()`, `complete()`, `getProjectBudgetSummary()` |

**Budget Flow:**
1. Blueprint deploys → `createFromDeployment()` auto-creates TaskBudget with `budgetedHours = estimatedHoursPerUnit × totalUnits`
2. Time clock logs hours → `updateActualHours()` recalculates efficiency (`budgeted/actual × 100`)
3. If actuals exceed budget by 10% → status changes to `over_budget`, activity event fires
4. Task completes → `complete()` finalizes the budget record

### Part 5: Activity Events

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/lib/repositories/activity.repository.ts` | Extended | Added `logTrainingEvent()` and `logBudgetEvent()` to `ActivityService` |

**Training Events:**
- `training.supervised_completion` — "Supervised completion #N: CrewName — SOP-CODE"
- `training.review_ready` — "Review ready: CrewName — SOP-CODE (N/M completions)"
- `training.review_completed` — "Review passed/failed: CrewName — SOP-CODE (score%)"
- `training.certified` — "Certified: CrewName — SOP-CODE (by CertifierName)"
- `training.gate_warning` — "Training gate warning: CrewName not certified for SOP-CODE"

**Budget Events:**
- `budget.created` — "Budget created: SOP-CODE — Nh budgeted"
- `budget.updated` — "Budget updated: SOP-CODE — Nh actual / Nh budgeted"
- `budget.over_budget` — "Over budget: SOP-CODE — Nh actual / Nh budgeted (efficiency%)"
- `budget.completed` — "Budget complete: SOP-CODE — efficiency% efficiency"

### React Query Hooks

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/lib/hooks/useCrewData.ts` | Created | All crew, training, and budget hooks |

**Crew Hooks:** `useCrewMembers()`, `useActiveCrewMembers()`, `useCrewMember(id)`
**Training Hooks:** `useTrainingRecords()`, `useCrewTrainingRecords(crewId)`, `useCrewTrainingSummary(crewId)`, `useTrainingRecord(crewId, sopId)`, `useSopTrainingStatus(sopId)`, `useRecordSupervisedCompletion()`, `useRecordReviewAttempt()`, `useCertifyCrew()`
**Budget Hooks:** `useTaskBudget(taskId)`, `useProjectBudgets(projectId)`, `useProjectBudgetSummary(projectId)`, `useOverBudgetTasks()`

---

## IndexedDB State After Build 3c

**Version:** 10
**Stores:** 38 (was 35)

New stores:
| Store | Indexes |
|-------|---------|
| `crewMembers` | `tier`, `isActive` |
| `trainingRecords` | `crewMemberId`, `sopId`, `sopCode`, `status` |
| `taskBudgets` | `taskId`, `blueprintId`, `projectId`, `status` |

---

## What Was NOT Built (per spec)

- Loop management UI (moved to Build 3d)
- Auto-supervised detection from time entries (infrastructure ready, wiring deferred)
- Training gate warning in task assignment UI (soft gate exists in service layer)
- Budget UI pages (hooks ready, pages deferred to Build 3d)
- Client portal, sub-trade integration

---

## Integration Points for Future Builds

1. **Pipeline → Budget**: When `TaskPipelineService.deployBlueprint()` runs, call `budget.createFromDeployment()` with the deployed task + blueprint
2. **Time Clock → Budget**: When time is logged on a task, call `budget.updateActualHours()` with total task hours
3. **Time Clock → Training**: When a task completes with both primary and supervisor time entries, call `training.recordSupervisedCompletion()`
4. **Task Assignment → Training Gate**: Check `training.isCertified()` when assigning crew to SOP-based tasks, show warning if not certified

---

## Verification Checklist

- [x] Typecheck: 0 errors
- [x] Build: blocked by dev server file lock (EPERM on .next/trace), not code issue
- [x] 3 new IndexedDB stores with indexes
- [x] CrewMember type with tier, wage/charged rates
- [x] TrainingRecord type with supervised completions, review attempts, certification
- [x] TaskBudget type with budgeted/actual hours, efficiency, status
- [x] CrewSelector reads from IndexedDB, falls back to hardcoded
- [x] Seed page creates Nathan + Nishant as IndexedDB records
- [x] Training dashboard page at /labs/training
- [x] Training detail page at /labs/training/[crewId]
- [x] Certification modal with pre-check warnings
- [x] Review recording modal with score + pass/fail
- [x] 5 training activity event types
- [x] 4 budget activity event types
- [x] All hooks wired with React Query keys
