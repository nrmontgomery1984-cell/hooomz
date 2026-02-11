# 2026-02-09 CHECK: Build 3b Complete — Full Platform State

**Author:** Claude Code (CC)
**Date:** 2026-02-09
**Staleness:** Until next architecture change
**Build:** 3b COMPLETE + Seed Data + Knowledge Detail Page
**Typecheck:** 0 errors (all packages + web app)
**IndexedDB Version:** v9

---

## Table of Contents

1. [Session Work Summary](#1-session-work-summary)
2. [Build Completion Status](#2-build-completion-status)
3. [Architecture Overview](#3-architecture-overview)
4. [Storage Layer](#4-storage-layer)
5. [Type System](#5-type-system)
6. [Repository Layer](#6-repository-layer)
7. [Service Layer](#7-service-layer)
8. [React Query Hooks](#8-react-query-hooks)
9. [Component Inventory](#9-component-inventory)
10. [Route Map](#10-route-map)
11. [Provider Chain](#11-provider-chain)
12. [Data Files & Seed System](#12-data-files--seed-system)
13. [Master Integration Spec Status](#13-master-integration-spec-status)
14. [Outstanding / Deferred Work](#14-outstanding--deferred-work)
15. [Known Issues & Risks](#15-known-issues--risks)
16. [Next Up: Build 3c](#16-next-up-build-3c)

---

## 1. Session Work Summary

### What was done this session (2026-02-09)

| Item | Files | Status |
|------|-------|--------|
| **Completed Build 3b** (continued from prior session) | 6 created, 7 modified | COMPLETE |
| **Seed Data System** | `seedAll.ts`, `/labs/seed/page.tsx` | COMPLETE |
| **Knowledge Detail Page** | `/labs/knowledge/[id]/page.tsx` | COMPLETE |
| **Knowledge List Wiring** | Modified `knowledge/page.tsx` | COMPLETE |
| **Type filter additions** | Added `specification`, `material` to knowledge page filters | COMPLETE |

### Files Created This Session

| File | Purpose |
|------|---------|
| `apps/web/src/lib/data/seedAll.ts` | Core seed function — 21 SOPs + ~140 checklist items + ~15 knowledge items + catalog |
| `apps/web/src/app/labs/seed/page.tsx` | Admin seed page at `/labs/seed` with progress log + clear/re-seed |
| `apps/web/src/app/labs/knowledge/[id]/page.tsx` | Knowledge item detail: summary, metadata, cost data, challenge system |

### Files Modified This Session

| File | Change |
|------|--------|
| `apps/web/src/app/labs/knowledge/page.tsx` | Cards now link to `/labs/knowledge/[id]`, added specification + material type filters |

### Files Created in Prior Session (Build 3b, carried forward)

| File | Purpose |
|------|---------|
| `apps/web/src/lib/repositories/sopTaskBlueprint.repository.ts` | Blueprint CRUD, ID prefix `stb_` |
| `apps/web/src/lib/repositories/deployedTask.repository.ts` | DeployedTask sidecar CRUD, ID prefix `dt_` |
| `apps/web/src/lib/services/taskPipeline.service.ts` | Pipeline: estimate/CO → blueprints → tasks |
| `apps/web/src/lib/hooks/useTaskPipeline.ts` | 4 queries + 4 mutations for pipeline operations |
| `apps/web/src/lib/hooks/useApproveWithPipeline.ts` | Wraps approval flows to trigger pipeline generation |
| `BUILD-3B-SESSION-LOG.md` | Session log |

---

## 2. Build Completion Status

| Build | Description | Status | Session Log |
|-------|-------------|--------|-------------|
| **Build 1** | Data Spine: Change Orders, Task Source Tracking, Callbacks, Observation Links, SOP Versioning | COMPLETE | `BUILD-1-SESSION-LOG.md` |
| **Build 1.5** | SOP Database + Schema Alignment: SOPs as IndexedDB entities, Zod schema extensions | COMPLETE | `BUILD-1.5-SESSION-LOG.md` |
| **Build 2** | Capture Mechanism: ObservationTriggerService, confirm-or-deviate UX, SOP admin pages, batch queue | COMPLETE | `BUILD-2-SESSION-LOG.md` |
| **Build 3a** | Time Clock + Batch Wiring: Per-task time clock, crew sessions, idle detection, BatchConfirmModal wiring | COMPLETE | `BUILD-3A-SESSION-LOG.md` |
| **Build 3b** | Task Instance Pipeline: SopTaskBlueprint + DeployedTask, pipeline service, SOPChecklist→IndexedDB bridge | COMPLETE | `BUILD-3B-SESSION-LOG.md` |
| **Build 3c** | Training gate, estimate→budget conversion, loop management UI | NOT STARTED | — |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Provider Chain (6 deep)                 ││
│  │  Theme → Query → Services → ActiveCrew → Toast → QA ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Pages   │  │Components│  │  Hooks   │              │
│  │ (22 rts) │──│ (54 tsx) │──│(11 files)│              │
│  └──────────┘  └──────────┘  └──────────┘              │
│        │              │              │                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Service Layer (26 services)             ││
│  │  ┌──────────────────────────────────────────────┐   ││
│  │  │  Activity Service (THE SPINE — every mutation) │  ││
│  │  └──────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
│        │                                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │           Repository Layer (33 repos)                ││
│  └─────────────────────────────────────────────────────┘│
│        │                                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │         IndexedDB v9 (35 stores)                     ││
│  │         Offline-first, append-only activity log      ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Core Architecture Rules (Never Violated)

1. **Activity Log is the spine** — every mutation writes to it
2. **Three-axis filtering** — Work Category (what) + Trade (who) + Stage (when)
3. **Loops** — nested containers by phase, color-coded header dots + progress bars
4. **Mobile-first** — 48px touch targets, one-thumb operation
5. **Estimate → Budget** conversion at crew wage rates (deferred to 3c)
6. **Floor plan elements don't store status** — status comes FROM the loop
7. **Health score rolls up** — never set directly
8. **Offline-first** — IndexedDB for all data, field-level merge, append-only where possible

---

## 4. Storage Layer

### IndexedDB Version History

| Version | Build | Stores Added | Notes |
|---------|-------|--------------|-------|
| v1–v4 | Pre-Build 1 | Core 10 + Labs Phase 1-4 (24 stores) | Base platform |
| v5 | Build 1 | observationKnowledgeLinks, changeOrders, changeOrderLineItems | Data Spine |
| v6 | Build 1.5 | sops, sopChecklistItemTemplates | SOPs as entities |
| v7 | Build 2 | pendingBatchObservations | Observation triggers |
| v8 | Build 3a | activeCrewSession, timeEntries, timeClockState | Time clock |
| v9 | Build 3b | sopTaskBlueprints, deployedTasks + timeEntries index fix | Pipeline |

### All 35 Object Stores

**Core (10):** projects, customers, lineItems, catalogItems, tasks, inspections, photos, syncQueue, activityEvents, sopProgress

**Labs Phase 1-4 (14):** fieldObservations, labsProducts, labsTechniques, labsToolMethods, labsCombinations, crewRatings, fieldSubmissions, notifications, experiments, experimentParticipations, checkpointResponses, knowledgeItems, confidenceEvents, knowledgeChallenges

**Integration / Data Spine (5):** observationKnowledgeLinks, changeOrders, changeOrderLineItems, sops, sopChecklistItemTemplates

**Build 2 (1):** pendingBatchObservations

**Build 3a (3):** activeCrewSession, timeEntries, timeClockState

**Build 3b (2):** sopTaskBlueprints, deployedTasks

---

## 5. Type System

### packages/shared-contracts/src/types/

**index.ts** — Core enums and domain types
- 13 enums: Division, WorkCategory (20 codes), ProjectStage (14), InteriorsBundle (5), ProjectStatus (7), ProjectType (20), TaskStatus (4), TaskPriority (4), InspectionStatus (4), InspectionType (13), ContactMethod (4), UnitOfMeasure (13), CostCategory (23)
- Mapping constants: WORK_CATEGORY_DIVISION_MAP, WORK_CATEGORY_META, PROJECT_STAGE_DIVISION_MAP, etc.

**integration.ts** — Integration layer + all builds
- 20+ interfaces including Sop, SopChecklistItemTemplate, SopTaskBlueprint, DeployedTask, ChangeOrder, ActiveCrewSession, TimeClockState, CompletedStep, ObservationDraft, TriggerResult
- 15+ type aliases including ObservationMode, SopStatus, BlueprintStatus, WorkSource, ChecklistType, ChecklistCategory, TriggerTiming

**labs.ts** — Labs field data collection
- 20+ interfaces: FieldObservation, LabsProduct, LabsTechnique, LabsToolMethod, LabsCombination, CrewRating, FieldSubmission, Experiment, KnowledgeItem, KnowledgeChallenge, etc.
- 10+ type aliases: KnowledgeType (10 values), SubmissionCategory, ExperimentStatus, ChallengeStatus, etc.

### packages/shared-contracts/src/schemas/index.ts

- 40+ Zod schemas with validation functions
- Key schemas: ProjectSchema, TaskSchema (+ sopId, sopCode, estimateLineItemId, blueprintId from 3b), LineItemBaseSchema (+ sopCodes, loopContextLabel, isLooped, estimatedHoursPerUnit from 3b)

### packages/shared/src/types/team.ts

- TimeEntry interface (+ entryType, role, sopVersionId, idlePrompts from 3a)

---

## 6. Repository Layer

### 33 Repositories Total

**Core (8):** ProjectRepository, CustomerRepository, LineItemRepository, CatalogRepository, TaskRepository, InspectionRepository, PhotoRepository, ActivityRepository + ActivityService

**Integration (2):** ChangeOrderRepository, ChangeOrderLineItemRepository

**Time Clock (3):** ActiveCrewSessionRepository, TimeEntryRepository, TimeClockStateRepository

**Pipeline (2):** SopTaskBlueprintRepository (prefix `stb_`), DeployedTaskRepository (prefix `dt_`)

**Labs (18):** FieldObservationRepository, LabsProductRepository, LabsTechniqueRepository, LabsToolMethodRepository, LabsCombinationRepository, CrewRatingRepository, FieldSubmissionRepository, NotificationRepository, ExperimentRepository, ExperimentParticipationRepository, CheckpointResponseRepository, KnowledgeItemRepository, ConfidenceEventRepository, KnowledgeChallengeRepository, ObservationKnowledgeLinkRepository, SopRepository, SopChecklistItemTemplateRepository, PendingBatchObservationRepository

---

## 7. Service Layer

### Services Interface (raw, for reads)

```
services.activity          → ActivityService
services.projects          → ProjectRepository
services.customers         → CustomerRepository
services.estimating.lineItems → LineItemRepository
services.estimating.catalog   → CatalogRepository
services.scheduling.tasks  → TaskRepository
services.fieldDocs.inspections → InspectionRepository
services.fieldDocs.photos  → PhotoRepository
services.labs              → LabsServices (11 sub-services)
services.integration.changeOrders    → ChangeOrderService
services.integration.uncapturedWork  → UncapturedWorkService
services.integration.callbacks       → CallbackProjectService
services.timeClock         → TimeClockService
services.pipeline          → TaskPipelineService
```

### LoggedServices Interface (for mutations, auto-logs to activity spine)

```
loggedServices.projects    → ProjectService
loggedServices.tasks       → TaskService
loggedServices.customers   → CustomerService
loggedServices.estimates   → EstimateService
loggedServices.catalog     → CatalogService
loggedServices.properties  → PropertyService
loggedServices.photos      → PhotoService
loggedServices.inspections → InspectionService
loggedServices.loops       → LoopService
```

### LabsServices (11 sub-services)

```
services.labs.observations        → FieldObservationService
services.labs.catalog             → LabsCatalogService
services.labs.crewRatings         → CrewRatingService
services.labs.submissions         → FieldSubmissionService
services.labs.notifications       → NotificationService
services.labs.experiments         → ExperimentService
services.labs.checkpointResponses → CheckpointResponseRepository
services.labs.knowledge           → KnowledgeItemService
services.labs.confidence          → ConfidenceScoringService
services.labs.observationLinks    → ObservationLinkingService
services.labs.sops                → SopService
services.labs.observationTrigger  → ObservationTriggerService
```

---

## 8. React Query Hooks

### 11 Hook Files

| File | What It Provides |
|------|------------------|
| `useLocalData.ts` | Projects, customers, line items, catalog, tasks, inspections, photos, activity events, SOP progress |
| `useLabsData.ts` | All Labs entities: observations, products, techniques, tools, combinations, ratings, submissions, experiments, knowledge, challenges, SOPs, checklist templates |
| `useActivityMutations.ts` | Activity-logging mutation hooks for all core entities |
| `useIntegrationData.ts` | Change orders, uncaptured work, observation links, project budget |
| `useSOPTriggerIntegration.ts` | Wraps step toggle to fire observation triggers (Build 2) |
| `useTimeClock.ts` | Clock in/out, breaks, task switching, time entries, daily totals (Build 3a) |
| `useIdleDetection.ts` | 15-min idle detection with global event listeners (Build 3a) |
| `useCompleteTaskWithBatchCheck.ts` | Task completion + pending batch check (Build 3a) |
| `useTaskPipeline.ts` | Blueprint queries + mutations, deployed task queries (Build 3b) |
| `useApproveWithPipeline.ts` | Estimate/CO approval → auto pipeline generation (Build 3b) |
| `index.ts` | Re-exports from useActivityMutations |

---

## 9. Component Inventory

### 54 Components in 10 Folders

| Folder | Count | Components |
|--------|-------|------------|
| `ui/` | 11 | PageHeader, Button, Input, Select, Card, Badge, LoadingSpinner, Modal, Toast, Table, Tabs |
| `activity/` | ~15 | ActivityFeed, ActivityEventRow, ActivityFilterPills, ThreeAxisFilters, QuickAddSheet, QuickAddContext, ProjectActivityFeed, ProjectSelector, HomeownerActivityFeed, etc. |
| `labs/` | ~11 | ConfidenceScoreBadge, ObservationCard, KnowledgeItemCard, SubmissionCard, ExperimentCard, FlagForLabsButton, LabsStatsRow, SOPCard, BatchConfirmModal, ObservationConfirmCard |
| `visualization/` | 4 | Sphere, SphereCluster, WidgetCard, ConfidenceBadge |
| `voice/` | 5 | VoiceInputFAB, VoiceRecordingOverlay, VoiceConfirmationCard, VoiceInputContainer, VoiceErrorToast |
| `navigation/` | 2 | BreadcrumbSpheres, BottomNav |
| `crew/` | 2 | CrewGate, CrewSelector |
| `timeclock/` | 3 | TimeClockWidget, TaskPicker, IdlePrompt |
| `sop/` | 1 | SOPChecklist |
| `intake/` | 2 | IntakeWizard, ContractorIntakeWizard |
| `dev/` | 1 | DevTools |

---

## 10. Route Map

### 22 Pages

| Route | Purpose |
|-------|---------|
| `/` | Home / Dashboard |
| `/add` | Add new entity |
| `/activity` | Activity log feed |
| `/estimates` | Estimates list |
| `/estimates/[id]` | Estimate detail |
| `/intake` | Client intake wizard |
| `/profile` | User profile |
| `/properties/[id]/activity` | Property activity feed |
| `/projects/[id]` | Project detail (tasks, SOPChecklist) |
| `/projects/[id]/[category]` | Project work category view |
| `/projects/[id]/[category]/[location]` | Location-specific view |
| `/labs` | Labs dashboard |
| `/labs/catalogs` | Products, techniques, tools |
| `/labs/experiments` | Experiment list |
| `/labs/knowledge` | Knowledge base (clickable cards) |
| `/labs/knowledge/[id]` | **NEW** Knowledge item detail + challenges |
| `/labs/observations` | Field observations |
| `/labs/seed` | **NEW** Seed data admin page |
| `/labs/sops` | SOP list |
| `/labs/sops/[id]` | SOP detail + checklist editor |
| `/labs/sops/new` | Create new SOP |
| `/labs/submissions` | Field submissions |

---

## 11. Provider Chain

Outermost → Innermost:

```
<ThemeProvider>
  <QueryProvider>          ← React Query
    <ServicesProvider>     ← IndexedDB + all services
      <ActiveCrewProvider> ← Crew session (blocks app if no session)
        <ToastProvider>
          <QuickAddProvider>
            {children}     ← App content
          </QuickAddProvider>
        </ToastProvider>
      </ActiveCrewProvider>
    </ServicesProvider>
  </QueryProvider>
</ThemeProvider>
```

---

## 12. Data Files & Seed System

### Static Data Files

| File | Exports |
|------|---------|
| `lib/data/sops.ts` | 21 hardcoded SOPs (DW:3, FC:6, FL:7, PT:3, OH:1), lookup helpers, task-to-SOP mapping |
| `lib/data/labsSeedData.ts` | 28 products, 18 techniques, 16 tool methods, `seedLabsCatalogs()` |
| `lib/data/seedAll.ts` | `seedAllLabsData()` — converts all hardcoded data into IndexedDB records |

### Seed System

The `/labs/seed` page loads all reference data into IndexedDB:

| Entity | Count | Source |
|--------|-------|--------|
| Database SOPs | 21 | `sops.ts` → `services.labs.sops.createSop()` |
| Checklist items | ~140 | Each SOP's quick_steps → `addChecklistItem()` |
| Knowledge items | ~15 | Unique `L-2026-xxx` lab references from critical_standards |
| Products | 28 | `labsSeedData.ts` |
| Techniques | 18 | `labsSeedData.ts` |
| Tool Methods | 16 | `labsSeedData.ts` |

**Idempotency:** Each category checks if data exists before seeding (skips if > 0).

**Trade family mapping:** DW→Drywall, FC→Finish Carpentry, FL→Flooring, PT→Paint, OH→Safety

After seeding, the SOPChecklist component bridges to database SOPs (database-first, hardcoded fallback). Database SOPs show a Database icon and link to `/labs/sops/[id]`.

---

## 13. Master Integration Spec Status

The Master Integration Spec (LOCKED 2026-02-08) defines 8 agreements. Current implementation status:

| Agreement | Description | Status |
|-----------|-------------|--------|
| **A. SOP = source of truth** | OH family first-class | IMPLEMENTED. 21 SOPs seeded including OH-01 Safety. Database SOPs with versioning. |
| **B. Estimate → Template → Instance** | COs all-or-nothing | IMPLEMENTED (Build 3b). SopTaskBlueprint + DeployedTask pipeline. Partial CO approvals deferred v2. |
| **C. Checklist = Labs bridge** | 3-tier config, hybrid trigger | IMPLEMENTED (Build 2). Batch at task completion + on_check for time-sensitive. |
| **D. Time clock per-task** | Persistent floating widget, 15min idle | IMPLEMENTED (Build 3a). TimeClockWidget, IdlePrompt, per-task entries. |
| **E. Soft training gate** | Per-SOP certification | DEFERRED (Build 3c). Types exist but gate UI not built. |
| **F. Activity log = integration bus** | Independent visibility toggles | PARTIALLY IMPLEMENTED. Activity logging on all mutations. Visibility toggles not yet in UI. |
| **G. Offline-first** | Field-level merge, append-only | IMPLEMENTED. IndexedDB v9, 35 stores. Task status = last-write-wins. |
| **H. Friction budget 2-3 min/task** | Pre-filled SOP defaults | IMPLEMENTED. SOP defaults pre-fill checklist items. Observation drafts pre-filled from templates. |

### Additional Spec Items

| Item | Status |
|------|--------|
| Callbacks (new project type `callback` with `linked_project_id`) | IMPLEMENTED (Build 1) |
| knowledge_item ↔ field_observation many-to-many | IMPLEMENTED (Build 1) |
| SOP versioning (in-flight tasks keep version) | IMPLEMENTED (Build 1.5/3b) |
| Photos: local → cloud sync | PARTIAL — local storage works, cloud sync deferred |
| Client portal | DEFERRED |
| Sub-trade integration | DEFERRED |
| CO partial approvals | DEFERRED (v2) |

---

## 14. Outstanding / Deferred Work

### Build 3c (Next)

| Item | Description | Priority |
|------|-------------|----------|
| Training gate | Per-SOP certification: 3 supervised + 80% review + manual signoff. UI for certification tracking. | HIGH |
| Estimate → budget conversion | Convert approved estimate totals to budget at crew wage rates | HIGH |
| Loop management UI | Deploy looped blueprints, bind to loop iterations | MEDIUM |
| Delete hardcoded sops.ts | After confirming all SOPs migrate cleanly via seed | LOW |

### Future (Not Build 3c)

| Item | Description |
|------|-------------|
| Activity visibility toggles | Per-event type visibility (labs/hooomz/homeowner/training) — Agreement F |
| Client portal | Homeowner-facing project view |
| Sub-trade integration | External contractor data exchange |
| CO partial approvals | Approve subset of CO line items |
| Photo cloud sync | Local photos → cloud upload with tagged metadata |
| Supabase migration | Move from IndexedDB-only to Supabase backend |

### Hardcoded Items to Replace

| Item | Current | Target |
|------|---------|--------|
| Crew members | `CREW_MEMBERS` array in CrewSelector.tsx (Nathan + Nishant) | TeamMember query from IndexedDB/Supabase |
| `'no_project'` placeholder | Used when starting session without project | Proper empty-state handling |
| SOPChecklist fallback | Still falls back to hardcoded `getSOPById()` | Remove after all SOPs seeded |

---

## 15. Known Issues & Risks

### No Known Bugs

Typecheck passes with 0 errors across all packages and web app.

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| IndexedDB v9 upgrade on existing browsers | Users with data in v1-v8 may hit upgrade issues | Upgrade handler tested, but no automated migration tests |
| 35 stores may hit IndexedDB limits on some mobile browsers | Slow queries on large datasets | Monitor performance; consider store consolidation |
| Seed data idempotency is simple (count > 0 skip) | Re-seeding after partial failure requires "Clear & Re-seed" | Clear button exists on seed page |
| No automated tests | Regressions rely on typecheck + manual testing | Add integration tests in future sprint |
| `sops.ts` hardcoded fallback still active | Dual-source could cause confusion | Remove after confirming database SOPs work end-to-end |

---

## 16. Next Up: Build 3c

**Training Gate + Budget Conversion + Loop Management**

Scope per Master Integration Spec Agreement E:

1. **Training gate (soft)** — Per-SOP certification tracking
   - 3 supervised completions required
   - 80% review score threshold
   - Manual signoff by supervisor
   - Never auto-certify
   - Gate is soft: warns but doesn't block

2. **Estimate → budget conversion** — When estimate approved, convert line item totals to budget entries at crew wage rates

3. **Loop management UI** — For looped blueprints (multiple iterations of same SOP), provide UI to deploy individual iterations and bind to loop context

---

## Appendix: Design Language Reference

| Token | Value | Usage |
|-------|-------|-------|
| Base charcoal | `#1a1a1a` | Primary text |
| Base gray | `#6b7280` | Secondary text |
| Base white | `#FFFFFF` | Backgrounds |
| Accent teal | `#0F766E` | Interaction only (buttons, links, selected) |
| Status green | `#10b981` | Complete |
| Status blue | `#3B82F6` | In progress |
| Status amber | `#f59e0b` | Warning |
| Status red | `#ef4444` | Blocked / error |
| Status gray | `#9ca3af` | Not started |
| Font | Inter (mono: JetBrains Mono) | |
| Border radius | 12px | Cards |
| Shadow | `rgba(0,0,0,0.03)` | Subtle elevation |
| Min touch target | 48px | Mobile-first |
| Rule | 90% mono / 10% accent | Max 2-3 teal elements per screen |
