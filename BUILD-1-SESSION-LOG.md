# Build 1: Data Spine — Session Log

## Session 1 — February 8, 2026

### What was built

**New files created:**
- `packages/shared-contracts/src/types/integration.ts` — All integration types (ObservationKnowledgeLink, ChangeOrder, ChangeOrderLineItem, TaskSourceFields, ProjectIntegrationFields, SOPVersionFields, ChecklistItemLabsConfig, ObservationMode)
- `apps/web/src/lib/repositories/labs/observationKnowledgeLink.repository.ts` — CRUD + query by observation/knowledge item/link type + bulk delete
- `apps/web/src/lib/repositories/changeOrder.repository.ts` — CRUD + query by project/status + auto-increment CO number
- `apps/web/src/lib/repositories/changeOrderLineItem.repository.ts` — CRUD + query by CO/SOP code + bulk delete by CO
- `apps/web/src/lib/services/labs/observationLinking.service.ts` — Auto-detection logic (5 matching rules), manual/experiment linking, getObservationContext, getEvidenceForKnowledgeItem
- `apps/web/src/lib/services/changeOrder.service.ts` — Full CO lifecycle (create, add line items, submit, approve, decline, cancel) + budget impact calculation
- `apps/web/src/lib/services/uncapturedWork.service.ts` — Flag/resolve uncaptured tasks, query by project
- `apps/web/src/lib/services/callbackProject.service.ts` — Create callback projects with linked_project_id, propagate outcome data to original observations
- `apps/web/src/lib/hooks/useIntegrationData.ts` — 15 React Query hooks for change orders, uncaptured work, observation links, callback projects, project budget

**Files modified:**
- `packages/shared-contracts/src/types/labs.ts` — Added `sopVersionId?: string` to FieldObservation
- `packages/shared-contracts/src/types/index.ts` — Added `export * from './integration'`
- `apps/web/src/lib/storage/StorageAdapter.ts` — Added 3 store names: OBSERVATION_KNOWLEDGE_LINKS, CHANGE_ORDERS, CHANGE_ORDER_LINE_ITEMS
- `apps/web/src/lib/storage/IndexedDBAdapter.ts` — Bumped DB_VERSION from 4 to 5, added indexes for 3 new stores
- `apps/web/src/lib/repositories/labs/index.ts` — Added ObservationKnowledgeLinkRepository export
- `apps/web/src/lib/services/labs/index.ts` — Added ObservationLinkingService to LabsServices interface + factory + re-export
- `apps/web/src/lib/services/index.ts` — Added integration services (ChangeOrderService, UncapturedWorkService, CallbackProjectService) to Services interface + initializeServices factory + convenience getters + type re-exports

**New IndexedDB stores:**
| Store | Indexes |
|-------|---------|
| `observationKnowledgeLinks` | observationId, knowledgeItemId, linkType |
| `changeOrders` | projectId, status |
| `changeOrderLineItems` | changeOrderId, sopCode |

**New repos:** ObservationKnowledgeLinkRepository, ChangeOrderRepository, ChangeOrderLineItemRepository

**New services:** ObservationLinkingService, ChangeOrderService, UncapturedWorkService, CallbackProjectService

**New hooks:** useChangeOrders, useChangeOrderWithLineItems, useChangeOrderLineItems, useCreateChangeOrder, useAddChangeOrderLineItem, useApproveChangeOrder, useDeclineChangeOrder, useProjectBudget, useUncapturedWork, useAllUnresolvedUncaptured, useFlagUncaptured, useResolveUncaptured, useObservationLinks, useKnowledgeItemEvidence, useLinkObservation, useCallbackProjects, useCreateCallbackProject

### What changed from the spec

1. **`ProjectType` renamed to `IntegrationProjectType`** — The existing codebase already has a `ProjectType` enum (new-construction, renovation, etc.) in shared-contracts. To avoid collision, the integration type `'standard' | 'callback'` was renamed to `IntegrationProjectType`.

2. **Task source fields NOT added to existing Task Zod schema** — The spec asked to add `workSource`, `isUncaptured`, etc. to task_instance. Since the Task type is Zod-validated and IndexedDB is schemaless, the `UncapturedWorkService` uses a local `TaskWithSource` interface that extends the task record with integration fields. The actual Zod schema will be extended when Build 2 needs it for UI validation.

3. **Project integration fields NOT added to existing Project Zod schema** — Same rationale. The `CallbackProjectService` uses a local `ProjectWithIntegration` interface. The fields are stored in IndexedDB (schemaless) and work correctly.

4. **CO approval does NOT auto-generate task templates** — The spec's `approveChangeOrder` was supposed to "generate task templates from line items." This requires task template → task instance pipeline which doesn't exist yet. The method approves the CO and returns the line items, but task generation is deferred to Build 2.

5. **CO decline does NOT auto-reclassify tasks** — The spec said declining a CO should reclassify in-progress tasks as uncaptured. Since tasks don't have `workSource` fields in the Zod schema yet, the decline method updates the CO status only. Task reclassification can be triggered manually via `UncapturedWorkService.flagAsUncaptured()`.

6. **SOP/checklist types defined but not stored** — `SOPVersionFields`, `SOPObservationConfig`, `ChecklistItemLabsConfig`, and `TaskSOPVersionFields` are defined in integration.ts as type definitions. There's no SOP entity store yet in IndexedDB (SOPs are currently static field guides, not database records). These types are ready for when SOPs become database entities.

### What broke
- Nothing. Zero existing tests or typechecks broke.
- **TypeScript collision:** `ProjectType` name collision between existing enum and new integration type. Fixed by renaming to `IntegrationProjectType`.
- **TS4058:** `TaskWithSource` and `ProjectWithIntegration` interfaces were private but used in exported hook return types. Fixed by exporting both interfaces.

### What's left
All items from the Build 1 scope are complete. Specifically:
- [x] observation_knowledge_link store with indexes
- [x] Auto-detection logic (5 matching rules: product, technique, tool, combination, knowledge type)
- [x] getEvidenceForKnowledgeItem / getObservationContext
- [x] change_orders / change_order_line_items stores with indexes
- [x] CO lifecycle (create, line items, submit, approve, decline)
- [x] Budget impact calculation
- [x] Callback project creation with linked_project_id
- [x] Callback outcome propagation
- [x] SOP version fields on FieldObservation (sopVersionId)
- [x] All integration types defined
- [x] All hooks created
- [x] All services wired into main Services container

### Current state
- Does `tsc --noEmit` pass? **YES** (0 errors)
- Does the dev server start? **YES**
- Does `/labs` still return 200? **YES**
- New endpoints added: None (data layer only, no pages added)

### Decisions for Nathan
1. **SOP as database entity:** Currently SOPs are static field guides (markdown/content). The integration types (`SOPVersionFields`, `SOPObservationConfig`) are defined but there's no `sops` IndexedDB store. When should SOPs become database records? This is needed before Build 2 can wire checklist items to observation triggers.

2. **Task type extension:** The existing `Task` Zod schema doesn't include `workSource`, `isUncaptured`, etc. The integration services work around this with local interfaces. Should we extend the Zod schema now, or wait until Build 2 needs it for form validation?

3. **IndexedDB version 5:** Users need to clear their browser's IndexedDB to pick up the v4→v5 upgrade (same issue as the v3→v4 upgrade). The timeout+delete+retry handler should handle this automatically, but if users report "stuck on Initializing app...", the fix is `indexedDB.deleteDatabase('hooomz_db')` in console + hard refresh.
