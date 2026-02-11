# BUILD 2 SESSION LOG — The Capture Mechanism

**Date:** 2026-02-08
**Build:** 2 (Checklist → Observation trigger system)
**Agent:** Claude Code (CC)

---

## What Was Built

### Part 1: ObservationTriggerService

**Goal:** When crew checks a checklist item, generate a Labs observation (immediately or batched).

#### New Types (`packages/shared-contracts/src/types/integration.ts`)
- `ConditionAssessment`: `'good' | 'fair' | 'poor'`
- `ObservationDraft`: Pre-filled observation from SOP template defaults (knowledgeType, productId, techniqueId, toolMethodId, mode-dependent requirements)
- `PendingBatchObservation`: Queued item awaiting batch confirmation (taskId, sopId, checklistItemId, crewMemberId, draft, status)
- `TriggerResult`: `{ action: 'immediate_confirm' | 'queued_batch' | 'no_observation', draft?, pendingBatchId? }`
- `BatchResult`: Processing summary (totalItems, confirmed, skipped, observationsCreated)

#### Extended Types (`packages/shared-contracts/src/types/labs.ts`)
- `FieldObservation` gained: `deviated?: boolean`, `deviationFields?: string[]`, `deviationReason?: string`

#### New Service (`apps/web/src/lib/services/labs/observationTrigger.service.ts`)
- `handleChecklistItemComplete()` → TriggerResult (checks template, on_check=draft, batch=queue)
- `getBatchQueue(taskId)` → PendingBatchObservation[]
- `getPendingBatchCount(taskId?)` → number
- `confirmObservation()` → FieldObservation (creates obs + runs linking)
- `confirmBatchItem()` → FieldObservation (from pending queue)
- `confirmAllBatch(taskId)` → BatchResult (bulk confirm)
- `skipBatchItem()`, `clearProcessedBatch()`
- Private: `buildDraftFromTemplate(template, mode)` → ObservationDraft

---

### Part 2: Confirm-or-Deviate UX

#### ObservationConfirmCard (`apps/web/src/components/labs/ObservationConfirmCard.tsx`)
- Mode-dependent display: minimal (confirm/deviate), standard (+notes/photo), detailed (+required all + condition)
- CONFIRM primary (teal 48px), DEVIATE secondary (amber)
- Deviation flow: toggle shows reason textarea, "Confirm Deviation" button
- Pre-filled defaults displayed as gray pills
- Condition assessment: good/fair/poor selector for detailed mode

#### BatchConfirmModal (`apps/web/src/components/labs/BatchConfirmModal.tsx`)
- Uses existing Modal (size='lg')
- Scrollable list of ObservationConfirmCards
- Progress counter + progress bar
- "Confirm All" button for bulk processing
- Individual confirm/skip per item

---

### Part 3: Observation Mode Tiers

Built into `buildDraftFromTemplate()`:
- **minimal:** `requiresPhoto=false, requiresNotes=false, requiresCondition=false`
- **standard:** `requiresPhoto=(from template), requiresNotes=false, requiresCondition=false`
- **detailed:** `requiresPhoto=true, requiresNotes=true, requiresCondition=true`

---

### Part 4: SOP Admin Page

#### SOP List Page (`apps/web/src/app/labs/sops/page.tsx`)
- Filter by status (active/draft/archived/experiment) and trade family
- Cards with sopCode, title, version, mode badge, trade, status
- "+ New SOP" button (teal, 44px target)
- Sorted: active first, then alphabetical by sopCode

#### SOP Detail/Edit Page (`apps/web/src/app/labs/sops/[id]/page.tsx`)
- SOP metadata display (read-only: trade, mode, cert level, effective date)
- Observation config summary (total steps vs observation steps)
- Ordered checklist items with inline editing
- Per-item config: generatesObservation toggle, triggerTiming (on_check/batch), knowledgeType, requiresPhoto
- Add/remove checklist items
- Archive SOP button

#### SOP Create Page (`apps/web/src/app/labs/sops/new/page.tsx`)
- Form: sopCode, title, description, tradeFamily, observation mode, certification level, initial status
- Mode selector with descriptions (minimal/standard/detailed)
- After create → redirect to detail page

#### SOPCard Component (`apps/web/src/components/labs/SOPCard.tsx`)
- Status badges (color-coded: green=active, gray=draft, red=archived, purple=experiment)
- Mode badges (gray=minimal, blue=standard, amber=detailed)
- Clickable with hover shadow

#### Hub Link (`apps/web/src/app/labs/page.tsx`)
- Added SOPs section card to Labs dashboard

---

### Part 5: Wiring

#### Trigger Integration Hook (`apps/web/src/lib/hooks/useSOPTriggerIntegration.ts`)
- Wraps `useToggleSOPStep` with trigger behavior
- Maps hardcoded SOP step orders to database checklist item IDs by stepNumber
- On check (not uncheck): calls `handleChecklistItemComplete`
- Returns `triggerResult` + `activeDraft` for UI
- Graceful degradation: skips if no database SOP matches the hardcoded sopId

#### SOPChecklist Integration (`apps/web/src/components/sop/SOPChecklist.tsx`)
- Added optional `projectId` + `crewMemberId` props
- Uses `useSOPTriggerIntegration` instead of raw `useToggleSOPStep`
- Shows inline `ObservationConfirmCard` when immediate trigger fires
- Without trigger props, behaves identically to before (backward compatible)

---

## Storage Layer

### New IndexedDB Store (v6 → v7)
| Store | Indexes |
|-------|---------|
| `pendingBatchObservations` | taskId, crewMemberId, status, projectId |

### New Repository (`apps/web/src/lib/repositories/labs/pendingBatchObservation.repository.ts`)
- ID prefix: `pbo_`
- Queries: getByTaskId, getPendingByTaskId, getPendingByCrewMember, getPendingCount, clearProcessed

---

## React Query Hooks (7 new)

| Hook | Type | Purpose |
|------|------|---------|
| `useHandleChecklistItemComplete` | Mutation | Fire trigger on step check |
| `usePendingBatchItems(taskId)` | Query | Get batch queue for task |
| `usePendingBatchCount(taskId?)` | Query | Badge count |
| `useConfirmObservation` | Mutation | Confirm from immediate flow |
| `useConfirmBatchItem` | Mutation | Confirm single batch item |
| `useSkipBatchItem` | Mutation | Skip batch item |
| `useConfirmAllBatch` | Mutation | Bulk confirm all pending |

---

## Activity Events Added

| Event Type | Summary |
|------------|---------|
| `labs.observation_confirmed` | Observation confirmed: {name} |
| `labs.observation_deviated` | Observation deviated: {name} |
| `labs.batch_processed` | Batch processed: {name} |

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SOP detail page metadata | Read-only display | Versioning system handles changes via `createNewVersion`. Direct edits would bypass version tracking. |
| Trigger integration hook | Wraps existing toggle | Backward compatible. Without projectId/crewMemberId, behaves identically to old flow. |
| Hardcoded ↔ Database SOP bridge | Match by sopCode + stepNumber | Hardcoded sopId IS the sopCode. stepNumber matches step.order. Graceful degradation if no DB SOP. |
| ObservationTriggerService linking | Reuses ObservationLinkingService | Single code path for auto-linking. Service takes full FieldObservation object. |
| Batch confirm modal | Individual + bulk | Crew can review/deviate each item, or "Confirm All" for speed. |
| Duplicate service instances | Accepted | ObservationTriggerService creates its own FieldObservationService and ObservationLinkingService instances. Acceptable since services are stateless. |

---

## Files Changed

### New Files (10)
1. `apps/web/src/app/labs/sops/page.tsx` — SOP list page
2. `apps/web/src/app/labs/sops/[id]/page.tsx` — SOP detail/edit page
3. `apps/web/src/app/labs/sops/new/page.tsx` — Create SOP page
4. `apps/web/src/components/labs/SOPCard.tsx` — SOP card component
5. `apps/web/src/lib/repositories/labs/pendingBatchObservation.repository.ts` — Batch queue repo
6. `apps/web/src/lib/services/labs/observationTrigger.service.ts` — Trigger service
7. `apps/web/src/components/labs/ObservationConfirmCard.tsx` — Confirm/deviate card
8. `apps/web/src/components/labs/BatchConfirmModal.tsx` — Batch confirm modal
9. `apps/web/src/lib/hooks/useSOPTriggerIntegration.ts` — Toggle+trigger hook
10. `BUILD-2-SESSION-LOG.md` — This file

### Modified Files (10)
1. `packages/shared-contracts/src/types/integration.ts` — Trigger types (ConditionAssessment, ObservationDraft, PendingBatchObservation, TriggerResult, BatchResult)
2. `packages/shared-contracts/src/types/labs.ts` — Deviation fields on FieldObservation
3. `apps/web/src/lib/storage/StorageAdapter.ts` — PENDING_BATCH_OBSERVATIONS store name
4. `apps/web/src/lib/storage/IndexedDBAdapter.ts` — v6→v7, indexes for new store
5. `apps/web/src/lib/repositories/labs/index.ts` — PendingBatchObservationRepository export
6. `apps/web/src/lib/services/labs/index.ts` — ObservationTriggerService wiring
7. `apps/web/src/lib/hooks/useLabsData.ts` — pendingBatch query keys + 7 hooks
8. `apps/web/src/lib/repositories/activity.repository.ts` — 3 new event summaries
9. `apps/web/src/app/labs/page.tsx` — SOPs link in hub
10. `apps/web/src/components/labs/index.ts` — SOPCard, ObservationConfirmCard, BatchConfirmModal exports
11. `apps/web/src/components/sop/SOPChecklist.tsx` — Trigger integration via optional props

---

## Verification

- `pnpm run typecheck` — **0 errors** (all 11 packages pass)
- `npx tsc --noEmit` (web app) — **0 errors**

---

## What Was NOT Built (per spec)

- No time clock or floating timer widget (Build 3)
- No 15-minute idle detection (Build 3)
- No crew switch detection (Build 3)
- No SOP seed data migration
- No photo upload implementation (interface ready, upload mechanism deferred)
- No client portal visibility

---

## Ready for Build 3

Build 2 establishes the capture mechanism:
- Checklist completions generate observation triggers (immediate or batched)
- Confirm-or-deviate UX with mode-dependent fields
- SOP admin pages for creating and managing procedures
- Observation trigger service bridges task system and Labs
- React Query hooks ready for all trigger operations
- SOPChecklist backward compatible with optional trigger props
