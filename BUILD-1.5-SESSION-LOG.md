# BUILD 1.5 SESSION LOG — SOPs to Database + Schema Alignment

**Date:** 2026-02-08
**Build:** 1.5 (prerequisite patch before Build 2)
**Agent:** Claude Code (CC)

---

## What Was Built

### Part 1: SOPs as Database Records

**Goal:** Move SOPs from "concept in Nathan's head" to structured IndexedDB entities with versioning, checklist templates, observation config, and training config.

#### New Types (`packages/shared-contracts/src/types/integration.ts`)
- `SopStatus`: `'draft' | 'active' | 'archived' | 'future_experiment'`
- `CertificationLevel`: `'apprentice' | 'journeyman' | 'master'`
- `ChecklistType`: `'activity' | 'daily' | 'qc'`
- `ChecklistCategory`: `'safety' | 'quality' | 'procedure' | 'inspection' | 'documentation'`
- `TriggerTiming`: `'batch' | 'on_check'`
- `TimingFollowup`: `{ enabled, delayMinutes, followupPrompt }`
- `Sop`: Full SOP entity with versioning, observation mode, training config, field guide ref
- `SopChecklistItemTemplate`: Checklist item with Labs bridge config, trigger timing, default catalog IDs

#### New IndexedDB Stores (DB v5 → v6)
| Store | Indexes |
|-------|---------|
| `sops` | sopCode, tradeFamily, isCurrent, status |
| `sopChecklistItemTemplates` | sopId, checklistType, generatesObservation, observationKnowledgeType, stepNumber |

#### New Repositories (`apps/web/src/lib/repositories/labs/`)
- `sop.repository.ts` — CRUD + `getCurrentBySopCode`, `getAllCurrentByTradeFamily`, `getAllCurrent`, `getVersionHistory`, `getByStatus`
- `sopChecklistItemTemplate.repository.ts` — CRUD + `getBySopId` (ordered), `getBySopIdAndType`, `getObservationGeneratingItems`, `getByKnowledgeType`, `reorderItems`, `deleteAllBySopId`

#### New Service (`apps/web/src/lib/services/labs/sop.service.ts`)
- **SOP Lifecycle:** `createSop`, `createNewVersion` (supersedes current, copies checklist), `archiveSop`
- **Checklist Management:** `addChecklistItem`, `insertChecklistItem` (with renumbering), `removeChecklistItem` (with renumbering), `updateChecklistItem`
- **Build 2 Query Helpers:** `getObservationConfig` (sop + observation items + mode), `getChecklistForTask`
- **Pass-through Reads:** `findById`, `findAll`, `getCurrentBySopCode`, `getAllCurrentByTradeFamily`, `getAllCurrent`, `getVersionHistory`, `getByStatus`

#### New React Query Hooks (`apps/web/src/lib/hooks/useLabsData.ts`)
9 query keys + 15 hooks:
- **Queries:** `useSops`, `useSop`, `useCurrentSops`, `useSopByCode`, `useSopsByTradeFamily`, `useSopsByStatus`, `useSopVersionHistory`, `useSopChecklistItems`, `useSopObservationConfig`
- **Mutations:** `useCreateSop`, `useCreateSopVersion`, `useArchiveSop`, `useAddChecklistItem`, `useUpdateChecklistItem`, `useRemoveChecklistItem`

#### Wiring
- `SopService` added to `LabsServices` interface and `createLabsServices` factory
- `SopService` re-exported from labs services barrel

---

### Part 2: Zod Schema Alignment

**Goal:** Extend canonical Task/Project schemas so Build 1 services stop using local workaround interfaces.

#### TaskSchema Extensions (all `.optional()`)
| Field | Type |
|-------|------|
| `workSource` | `'estimate' \| 'change_order' \| 'uncaptured'` |
| `workSourceId` | `string \| null` |
| `changeOrderId` | `string \| null` |
| `changeOrderLineItemId` | `string \| null` |
| `isUncaptured` | `boolean` |
| `uncapturedResolution` | `'converted_to_co' \| 'absorbed' \| 'deleted' \| null` |
| `uncapturedResolvedAt` | `string \| null` |
| `uncapturedResolvedBy` | `string \| null` |
| `sopVersionId` | `string` |
| `sopVersionNumber` | `number` |

#### ProjectSchema Extensions (all `.optional()`)
| Field | Type |
|-------|------|
| `integrationProjectType` | `'standard' \| 'callback'` |
| `linkedProjectId` | `string \| null` |
| `callbackReason` | `'warranty_claim' \| 'quality_issue' \| 'customer_complaint' \| 'proactive_followup' \| null` |
| `callbackReportedAt` | `string \| null` |
| `observationModeOverride` | `'minimal' \| 'standard' \| 'detailed' \| null` |
| `activeExperimentIds` | `string[]` |

#### Workaround Removal
- `uncapturedWork.service.ts` — Removed `TaskWithSource` interface, now uses `Task` from `@hooomz/shared-contracts`
- `callbackProject.service.ts` — Removed `ProjectWithIntegration` interface, now uses `Project` from `@hooomz/shared-contracts`, uses `integrationProjectType` instead of `projectType`

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Compound indexes | Skipped | Codebase only uses simple indexes; SOP tables are small (~62 SOPs max). Used predicate queries. |
| `projectType` collision | Named `integrationProjectType` | Existing `projectType: ProjectType` uses construction enum (full_reno, kitchen, etc.). Integration's `'standard' \| 'callback'` lives in a separate field. |
| Callback project creation | Spread `...original` | Canonical `Project` type requires address, clientId, dates, budget. Spreading original project gets all required fields; integration fields are overridden. |
| `ChecklistItemLabsConfig.hasTimingFollowup` | Added `followupPrompt: string` | Per build prompt data model. Safe change — interface defined in Build 1 but not yet used in implementations. |

---

## Files Changed

### New Files (4)
1. `apps/web/src/lib/repositories/labs/sop.repository.ts`
2. `apps/web/src/lib/repositories/labs/sopChecklistItemTemplate.repository.ts`
3. `apps/web/src/lib/services/labs/sop.service.ts`
4. `BUILD-1.5-SESSION-LOG.md` (this file)

### Modified Files (7)
1. `packages/shared-contracts/src/types/integration.ts` — Added SOP entity types + supporting type aliases
2. `packages/shared-contracts/src/schemas/index.ts` — Extended TaskSchema + ProjectSchema with integration fields
3. `apps/web/src/lib/storage/StorageAdapter.ts` — Added SOPS + SOP_CHECKLIST_ITEM_TEMPLATES store names
4. `apps/web/src/lib/storage/IndexedDBAdapter.ts` — Bumped DB v5 → v6, added indexes for new stores
5. `apps/web/src/lib/repositories/labs/index.ts` — Added SopRepository + SopChecklistItemTemplateRepository exports
6. `apps/web/src/lib/services/labs/index.ts` — Added SopService to interface, factory, and re-exports
7. `apps/web/src/lib/hooks/useLabsData.ts` — Added SOP query keys + 15 hooks
8. `apps/web/src/lib/services/uncapturedWork.service.ts` — Removed TaskWithSource, uses canonical Task
9. `apps/web/src/lib/services/callbackProject.service.ts` — Removed ProjectWithIntegration, uses canonical Project

---

## Verification

- `pnpm run typecheck` — **0 errors** (all 11 packages pass)
- `npx tsc --noEmit` (web app) — **0 errors**

---

## What Was NOT Built (per spec)

- No UI components or pages
- No SOP seed data or content migration
- No SOP-to-task wiring (Build 2)
- No checklist runtime instances (Build 2)
- No observation trigger logic (Build 2)

---

## Ready for Build 2

Build 1.5 establishes the foundation:
- SOPs exist as structured data with versioning
- Checklist templates are configured with observation triggers
- Task/Project schemas carry integration fields
- Services use canonical types — no more workarounds
- React Query hooks are ready for UI consumption
