# Build 3b Session Log — Task Instance Pipeline

**Date:** 2026-02-08
**Build:** 3b
**Status:** COMPLETE
**Typecheck:** 0 errors (all packages + web app)
**IndexedDB Version:** v9 (was v8)

---

## What Was Built

The Task Instance Pipeline: estimate/CO line items → SopTaskBlueprint → Task + DeployedTask.
SOPChecklist now bridges to IndexedDB SOPs (database-first, hardcoded fallback).

---

## Critical Fix

### timeEntries Index Bug (v8 → v9)
- **Problem:** IndexedDB indexes named `crewMemberId` and `projectId`, but actual `TimeEntry` fields are `team_member_id` and `project_id`
- **Fix:** Bumped to v9, added migration block to delete old indexes and create correct ones
- **New indexes:** `team_member_id`, `project_id`, `task_instance_id`, `entryType`

---

## Files Created (6)

| File | Purpose |
|------|---------|
| `apps/web/src/lib/repositories/sopTaskBlueprint.repository.ts` | Blueprint CRUD, ID prefix `stb_`, queries by project/status/sopCode/workSource |
| `apps/web/src/lib/repositories/deployedTask.repository.ts` | DeployedTask sidecar CRUD, ID prefix `dt_`, queries by taskId/blueprint/sop |
| `apps/web/src/lib/services/taskPipeline.service.ts` | Pipeline service: generateFromEstimate, generateFromChangeOrder, deployBlueprint, cancelBlueprint |
| `apps/web/src/lib/hooks/useTaskPipeline.ts` | React Query hooks: 4 queries + 4 mutations for pipeline operations |
| `apps/web/src/lib/hooks/useApproveWithPipeline.ts` | Approval wrappers: useApproveEstimateWithPipeline, useApproveChangeOrderWithPipeline |
| `BUILD-3B-SESSION-LOG.md` | This file |

## Files Modified (4)

| File | Change |
|------|--------|
| `packages/shared-contracts/src/schemas/index.ts` | TaskSchema: +sopId, +sopCode, +estimateLineItemId, +blueprintId. LineItemBaseSchema: +sopCodes, +loopContextLabel, +isLooped, +estimatedHoursPerUnit |
| `packages/shared-contracts/src/types/integration.ts` | +BlueprintStatus, +SopTaskBlueprint, +DeployedTask types |
| `apps/web/src/lib/storage/StorageAdapter.ts` | +SOP_TASK_BLUEPRINTS, +DEPLOYED_TASKS store names |
| `apps/web/src/lib/storage/IndexedDBAdapter.ts` | v8→v9, timeEntries index fix, new store indexes for blueprints + deployed tasks |
| `apps/web/src/lib/services/index.ts` | +pipeline: TaskPipelineService in Services interface, initialization, and getter |
| `apps/web/src/components/sop/SOPChecklist.tsx` | Bridge to IndexedDB SOPs: tries useSop() + useSopChecklistItems() first, falls back to hardcoded getSOPById() |
| `apps/web/src/app/projects/[id]/page.tsx` | Reads task.sopId directly for SOP resolution (with fallback to description parsing) |

---

## Types Added

```typescript
// packages/shared-contracts/src/types/integration.ts
type BlueprintStatus = 'pending' | 'deployed' | 'cancelled';

interface SopTaskBlueprint {
  id, projectId, name, sopId, sopCode, sopVersion,
  workSource, workSourceId, estimatedHoursPerUnit, totalUnits,
  loopContextLabel?, isLooped, status, createdAt, updatedAt
}

interface DeployedTask {
  id, taskId, blueprintId, sopId, sopCode, sopVersion,
  loopBindingLabel?, loopIterationId?, createdAt
}
```

## Pipeline Flow

```
Estimate Approved
  → useApproveEstimateWithPipeline()
    → logs estimate.approved activity event
    → fetches line items with sopCodes
    → pipeline.generateFromEstimate()
      → for each sopCode on each line item:
        → looks up current SOP version
        → creates SopTaskBlueprint (status: pending)
        → if !isLooped: deployBlueprint()
          → creates Task with sopId, sopCode, blueprintId
          → creates DeployedTask sidecar
          → marks blueprint as deployed
      → logs pipeline.estimate_generated

CO Approved
  → useApproveChangeOrderWithPipeline()
    → approves CO (existing flow)
    → pipeline.generateFromChangeOrder()
      → same flow as estimate but workSource = 'change_order'
```

## SOPChecklist Bridge

```
SOPChecklist receives sopId prop
  → useSop(sopId) — queries IndexedDB for database SOP
  → useSopChecklistItems(sopId) — gets checklist templates
  → if found: NormalizedSOP from database (shows Database icon)
  → if not: falls back to hardcoded getSOPById() from lib/data/sops.ts
  → renders identically via NormalizedStep interface
```

## Deferred (Build 3c)

- Training gate (per-SOP certification)
- Estimate → budget conversion at crew wage rates
- Loop management UI for looped blueprints
- Delete hardcoded sops.ts (kept as fallback)

---

## Store Count

IndexedDB v9 now has **35 stores** (33 from Build 3a + 2 new: sopTaskBlueprints, deployedTasks).
