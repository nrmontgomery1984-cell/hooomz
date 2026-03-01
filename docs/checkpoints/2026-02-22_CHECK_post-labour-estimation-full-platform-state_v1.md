# 2026-02-22 CHECK: Full Platform State — Post Labour Estimation Engine

**Author:** Claude Code (CC)
**Date:** 2026-02-22
**Previous Checkpoint:** 2026-02-09 (Build 3b Complete)
**Staleness:** Until next architecture change
**Typecheck:** 0 errors (all packages + web app)
**IndexedDB Version:** v21 (57 stores)
**Git Branch:** `master` (fast-forward merged from `feature/lifecycle-platform`)

---

## Table of Contents

1. [What Changed Since Last Checkpoint](#1-what-changed-since-last-checkpoint)
2. [Commit History](#2-commit-history)
3. [New Features — Detailed](#3-new-features--detailed)
4. [Architecture Changes](#4-architecture-changes)
5. [Storage Layer](#5-storage-layer)
6. [Route Map](#6-route-map)
7. [Service & Repository Inventory](#7-service--repository-inventory)
8. [React Query Hooks](#8-react-query-hooks)
9. [Component Inventory](#9-component-inventory)
10. [Provider Chain](#10-provider-chain)
11. [Master Integration Spec Status](#11-master-integration-spec-status)
12. [Known Gaps & Deferred Work](#12-known-gaps--deferred-work)
13. [Known Issues & Risks](#13-known-issues--risks)

---

## 1. What Changed Since Last Checkpoint

The 2026-02-09 checkpoint captured the platform at Build 3b complete with IndexedDB v9 and 35 stores. Since then, **15 commits** over 11 days delivered:

| Feature | Commits | Scope |
|---------|---------|-------|
| Baseline audit + ESLint fix | `4aeccfb` | Full codebase re-audit, ESLint downgrade to v8, lint fixes |
| Error Boundaries + Demo Seed | `83335d1` | ErrorBoundary wrapping, demo scenario seeding |
| UI Polish (3 rounds) | `26fd5f3`, `304501c`, `cf77a4c` | Card depth, typography, information density, visualizations, duplicate project fix |
| Intake Drafts | `8fa375b` | Auto-save, resume, draft list, dashboard indicator |
| Tool Research Module | `03ef0c4` | 3 IndexedDB stores, 10-tab UI, purchase tracking, maintenance logs |
| ESLint + Type Safety | `6a47797` | 9x `as any` replaced, `useMemo` wrapping, scoring weights fix |
| Platform UI Overhaul | `1cd23ed` | Sidebar redesign, dark mode, theme system, 20+ new pages, instant estimate engine |
| View Mode Switcher | `2cef8e4` | Mobile bottom nav avatar popover, role switching |
| Financial Forecasting Module | `6234dd3`, `dd27f16` | Actuals, projections (3-year P&L), variance tracking, scenario presets |
| Schedule Responsive Redesign | `0a4bc77` | Desktop 7-day grid, mobile day view, `useMediaQuery` hook |
| Sidebar & Dashboard Redesign | `361aedb` | Responsive sidebar, page scaffolds (Work, Standards, Crew, Finance, Settings) |
| Labour Estimation Engine | `6ef89a1` | Skill rates, margin targets, budget calculation, variance tracking |

**Net growth:** 35 → 57 IndexedDB stores, 22 → 52 pages, v9 → v21.

---

## 2. Commit History

| # | Hash | Date | Message | Files | +/- |
|---|------|------|---------|-------|-----|
| 1 | `4aeccfb` | Feb 11 | chore: integration builds 1-3d, P0s, intake wizards, seed system | 508 | +89,356 / -19,568 |
| 2 | `83335d1` | Feb 11 | feat: error boundaries + demo seed wiring | 12 | +246 / -17 |
| 3 | `26fd5f3` | Feb 11 | style: UI polish — card depth, typography, spacing, empty states | 13 | +502 / -233 |
| 4 | `cf77a4c` | Feb 11 | fix: duplicate projects + empty leads pipeline after seeding | 2 | +29 / -5 |
| 5 | `304501c` | Feb 11 | style(web): UI overhaul — information density, visualizations, bug fixes | 8 | +931 / -402 |
| 6 | `8fa375b` | Feb 11 | feat(web): intake drafts — auto-save, resume, draft list, indicator | 13 | +569 / -23 |
| 7 | `03ef0c4` | Feb 13 | feat(labs): Tool Research module — P0 port + P1/P2 features | 61 | +9,302 / -551 |
| 8 | `6a47797` | Feb 13 | fix: resolve ESLint warnings and type safety issues | 8 | +26 / -25 |
| 9 | `1cd23ed` | Feb 19 | feat: platform UI overhaul — sidebar, dark mode, design system | 143 | +26,568 / -2,346 |
| 10 | `2cef8e4` | Feb 20 | feat: view mode switcher in mobile bottom nav | 1 | +173 / -5 |
| 11 | `6234dd3` | Feb 20 | feat: Financial Forecasting Module — actuals, projections, variance | 16 | +1,914 / -1 |
| 12 | `dd27f16` | Feb 21 | fix: forecast — race condition, saves, presets, variance year | 3 | +62 / -14 |
| 13 | `0a4bc77` | Feb 21 | feat: schedule page responsive redesign — 7-day desktop grid | 4 | +225 / -77 |
| 14 | `361aedb` | Feb 21 | feat: sidebar & dashboard architecture redesign | 16 | +2,475 / -533 |
| 15 | `6ef89a1` | Feb 21 | feat: Labour Estimation Engine — skill rates, margins, budgets | 15 | +1,781 / -1 |

---

## 3. New Features — Detailed

### 3.1 Platform UI Overhaul + Design System

**Commits:** `1cd23ed`, `2cef8e4`, `361aedb`

A complete visual and structural overhaul of the platform:

- **Sidebar redesign** — 200px collapsed/expanded sidebar with icon + text navigation. Sections grouped by role: Work, Finance, Labs, Admin. Active state indicator. Theme-aware colors using CSS custom properties.
- **Dark mode** — Full dark mode support via CSS custom properties (`--bg`, `--surface-1`, `--text`, `--border`, etc.). `useDarkMode` hook with localStorage persistence. Toggle in settings and mobile nav.
- **View mode system** — Four modes: Manager, Operator, Installer, Homeowner. Controls sidebar section visibility and feature access. `useViewMode` hook + `SECTION_COLORS` per section. Mobile switcher in bottom nav avatar popover.
- **Responsive layout** — Desktop: sidebar + content. Mobile: bottom nav + full-width content. `useMediaQuery` hook for breakpoint detection.
- **New page scaffolds** — Work (`/work`), Standards (`/standards`), Crew (`/admin/crew`), Finance (`/finance`), Settings (`/admin/settings`), Projects list (`/projects`).
- **Design tokens** — All colors, fonts, radii, and shadows as CSS variables in `globals.css`. Condensed font (`--font-cond`) for section headers. Mono font (`--font-mono`) for data. Section color dots for visual taxonomy.

### 3.2 Financial Forecasting Module

**Commits:** `6234dd3`, `dd27f16`

Three-tab forecasting system at `/forecast`:

- **Actuals tab** (`/forecast/actuals`) — Date-range revenue summaries with project-level breakdown.
- **Projections tab** (`/forecast/projections`) — Editable configuration: base revenue, growth rates, crew costs, overhead. Generates 3-year P&L with gross margin, net profit, crew take-home calculations. Scenario presets (Conservative, Moderate, Aggressive). Auto-save with dirty tracking.
- **Variance tab** (`/forecast/variance`) — Quarterly forecast-vs-actual comparison. Snapshot history for trend analysis.

**Storage:** `forecastConfigs` and `forecastSnapshots` stores (IndexedDB v20).

**Hooks:** `useForecastConfig`, `useActiveForecastConfig`, `useForecastProjection`, `useSaveForecastConfig`, `useForecastActuals`, `useForecastSnapshots`.

**Bug fixes:** Race condition guard (`creatingRef`), unnecessary saves prevented (`isDirtyRef`), scenario preset multipliers corrected, variance year derived from config date.

### 3.3 Labour Estimation Engine

**Commit:** `6ef89a1`

Core financial calculation service:

**Formula:**
```
sellBudget    = quantity × catalogueSellRate
costBudget    = sellBudget / (1 + margin)
budgetedHours = costBudget / skillLevel.costRate
```

**Components:**
- **Types** — `SkillLevel`, `SkillRateConfig`, `TaskLabourEstimate`, `LabourActual`, `ProjectVarianceSummary`, `CrewVarianceRecord`, `EstimateParams`
- **SkillRateConfig store** — Singleton in IndexedDB with 5 default skill levels:
  - L0 Labourer $22/hr, L1 Apprentice Yr 1-2 $26/hr, L2 Apprentice Yr 3-4 $30/hr, L3 Journeyman $38/hr, L4 Lead $44/hr
- **Margin targets** — Cascading resolution: tradeCategory → projectType → default (35%)
- **LabourEstimationService** — 7 methods: `calculateTaskEstimate`, `applyEstimateToTask`, `assignCrew`, `recordActualHours`, `recalculateProjectEstimates`, `getProjectVarianceSummary`, `getCrewVarianceHistory`
- **Activity events** — 7 event types via `logLabourEvent()`: estimate_applied, crew_assigned, hours_recorded, variance_recorded, variance_warning (>15%), config_updated, estimates_recalculated

**UI integrations:**
- Blueprint deploy page — Skill level selector + live estimate preview (sell budget, cost budget, budgeted hours)
- TaskCard — Labour budget section showing estimate data + actuals + variance
- Finance dashboard — Labour Performance card with total budgets, efficiency %, crew breakdown
- Settings — Editable skill level table, default margin input, "Recalculate All Open Estimates" button

**Known gap:** Deploy page uses `blueprint.estimatedHoursPerUnit` as placeholder for `catalogueSellRate`. Real catalogue item selector needed for production accuracy.

### 3.4 Schedule Responsive Redesign

**Commit:** `0a4bc77`

- **Desktop** — Full 7-day column grid with independent scrolling per day. Quick links in header bar. Unscheduled tasks section pinned at bottom.
- **Mobile** — Selected-day expanded view with compact day-peek previews for adjacent days.
- **Hook:** `useMediaQuery` for responsive breakpoint detection.

### 3.5 Tool Research Module

**Commit:** `03ef0c4`

Complete Labs tool management system:

- **3 IndexedDB stores** — `toolPlatforms`, `toolResearchItems`, `toolInventory`
- **10-tab UI** at `/labs/tool-research` — Research, Owned, Wishlist, Platforms, Maintenance, Purchase History, Registrations, Analytics, Content Pipeline, CSV Export
- **Features** — Inline editing, purchase tracking, RIDGID registration tracking, cost-per-use calculations, maintenance logs, dashboard widgets, room detail panels

### 3.6 Intake Drafts System

**Commit:** `8fa375b`

- **Auto-save** — 1-second debounced saves to IndexedDB as user fills intake wizard
- **Draft list** — `/intake` shows existing drafts with resume capability
- **Resume** — `?draft=id` query param loads saved progress
- **Dashboard indicator** — Amber "Drafts" stat pill on home page
- **Auto-cleanup** — 30 days for submitted drafts, 90 days for in-progress
- **Storage:** `intakeDrafts` store (IndexedDB v12)

### 3.7 Error Boundaries

**Commit:** `83335d1`

- `ErrorBoundary.tsx` — Base error boundary component
- `PageErrorBoundary.tsx` — Page-level wrapper with retry + error messaging
- 6 demo-critical pages wrapped
- Demo seed scenario button on `/labs/seed`

### 3.8 UI Polish Rounds

**Commits:** `26fd5f3`, `304501c`, `cf77a4c`

- Card depth and shadow standardization
- Typography hierarchy (condensed headers, mono data)
- Desktop sidebar with active indicator
- Dashboard stat strip, pipeline mini-chart, task donut
- Stage colors, filter pills, labor/material split bars
- Expandable activity entries
- Seed idempotency fixes (duplicate projects)
- React Query cache invalidation after seed/clear

---

## 4. Architecture Changes

### Previous (Feb 9)
```
IndexedDB v9, 35 stores
22 pages, ~54 components
No dark mode, no sidebar, no view modes
No financial forecasting
No labour estimation
```

### Current (Feb 22)
```
IndexedDB v21, 57 stores
52 pages, ~80+ components
Dark mode + CSS variable design system
4 view modes (Manager, Operator, Installer, Homeowner)
Responsive sidebar + bottom nav
Financial Forecasting (3-year P&L)
Labour Estimation Engine (skill rates, margins, variance)
Tool Research module (10 tabs)
Schedule 7-day grid (desktop)
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 14 App                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │               Provider Chain (6 deep)                    ││
│  │  Theme → Query → Services → ActiveCrew → Toast → QA     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │  Hooks   │  │Sidebar/  │   │
│  │ (52 rts) │──│ (~80 tsx)│──│(~20 file)│──│BottomNav │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│        │              │              │                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Service Layer (~35 services)                 ││
│  │  ┌──────────────────────────────────────────────────┐   ││
│  │  │  Activity Service (THE SPINE — every mutation)    │   ││
│  │  └──────────────────────────────────────────────────┘   ││
│  │  + LabourEstimation + Forecast + ToolResearch + Schedule ││
│  └─────────────────────────────────────────────────────────┘│
│        │                                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │           Repository Layer (~45 repos)                    ││
│  └─────────────────────────────────────────────────────────┘│
│        │                                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │          IndexedDB v21 (57 stores)                        ││
│  │          Offline-first, append-only activity log          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Design System

All UI now uses CSS custom properties defined in `globals.css`:

```css
/* Light mode */
--bg: #F3F4F6;          --surface-1: #FFFFFF;
--surface-2: #F9FAFB;   --surface-3: #F3F4F6;
--text: #111827;         --text-2: #374151;
--text-3: #9CA3AF;       --border: #E5E7EB;
--accent: #0F766E;       --accent-dim: #F0FDFA;

/* Status colors */
--green: #10B981;  --blue: #3B82F6;
--amber: #F59E0B;  --red: #EF4444;

/* Section colors */
work: '#3B82F6'    schedule: '#8B5CF6'
finance: '#F59E0B' labs: '#0F766E'
admin: '#6B7280'
```

---

## 5. Storage Layer

### IndexedDB Version History (v9 → v21)

| Version | Feature | Stores Added |
|---------|---------|--------------|
| v9 | Build 3b baseline | (checkpoint baseline — 35 stores) |
| v10 | Build 3c | crewMembers, trainingRecords, taskBudgets |
| v11 | Build 3d | loopContexts, loopIterations |
| v12 | Intake Drafts | intakeDrafts, discoveryDrafts |
| v13 | Tool Research | toolPlatforms, toolResearchItems, toolInventory |
| v14 | Cost Catalogue | costCatalog |
| v15 | Workflows | workflows |
| v16 | Labs Integration | labsTokens, labsTests, labsVoteBallots, labsVotes, labsMaterialChanges |
| v17-v19 | Scheduling | crewScheduleBlocks, scheduleNotes |
| v20 | Forecasting | forecastConfigs, forecastSnapshots |
| v21 | Labour Estimation | skillRateConfig |

### All 57 Object Stores

**Core (10):** projects, customers, lineItems, catalogItems, tasks, inspections, photos, syncQueue, activityEvents, sopProgress

**Labs Phase 1-4 (14):** fieldObservations, labsProducts, labsTechniques, labsToolMethods, labsCombinations, crewRatings, fieldSubmissions, notifications, experiments, experimentParticipations, checkpointResponses, knowledgeItems, confidenceEvents, knowledgeChallenges

**Integration / Data Spine (5):** observationKnowledgeLinks, changeOrders, changeOrderLineItems, sops, sopChecklistItemTemplates

**Build 2-3d (8):** pendingBatchObservations, activeCrewSession, timeEntries, timeClockState, sopTaskBlueprints, deployedTasks, crewMembers, trainingRecords

**Budget & Loops (3):** taskBudgets, loopContexts, loopIterations

**Drafts (2):** discoveryDrafts, intakeDrafts

**Tool Research (3):** toolPlatforms, toolResearchItems, toolInventory

**Admin (2):** costCatalog, workflows

**Labs Integration (5):** labsTokens, labsTests, labsVoteBallots, labsVotes, labsMaterialChanges

**Scheduling (2):** crewScheduleBlocks, scheduleNotes

**Financial (3):** forecastConfigs, forecastSnapshots, skillRateConfig

---

## 6. Route Map

### 52 Pages

**Dashboard & Core**
| Route | Purpose |
|-------|---------|
| `/` | Home dashboard — stat strip, project cards, pipeline chart |
| `/add` | Quick add entity |
| `/activity` | Activity log feed |
| `/work` | Work hub — active projects, task queue |
| `/standards` | Standards & SOPs overview |
| `/profile` | User profile |

**Projects & Properties**
| Route | Purpose |
|-------|---------|
| `/projects` | Project list with filtering |
| `/projects/[id]` | Project detail (tasks, SOPChecklist) |
| `/projects/[id]/[category]` | Work category view |
| `/projects/[id]/[category]/[location]` | Location-specific view |
| `/properties/[id]/activity` | Property activity feed |
| `/portal/[projectId]` | Client portal (placeholder) |

**Estimates & Intake**
| Route | Purpose |
|-------|---------|
| `/estimates` | Estimates list |
| `/estimates/[id]` | Estimate detail with line items |
| `/estimates/select-project` | Project selector for new estimate |
| `/intake` | Client intake wizard (8 sections) with draft resume |
| `/leads` | Leads pipeline |
| `/leads/new` | New lead form |
| `/discovery/[projectId]` | Discovery session for project |

**Schedule**
| Route | Purpose |
|-------|---------|
| `/schedule` | Schedule — 7-day desktop grid / day view mobile |
| `/schedule/day/[date]` | Single day detail |
| `/schedule/assign` | Task assignment |

**Finance & Forecast**
| Route | Purpose |
|-------|---------|
| `/finance` | Finance dashboard — revenue, forecast, labour performance |
| `/forecast` | Forecast overview |
| `/forecast/actuals` | Revenue actuals by date range |
| `/forecast/projections` | 3-year P&L projections editor |
| `/forecast/variance` | Quarterly forecast vs actual |

**Labs**
| Route | Purpose |
|-------|---------|
| `/labs` | Labs dashboard |
| `/labs/catalogs` | Products, techniques, tools |
| `/labs/experiments` | Experiment list |
| `/labs/knowledge` | Knowledge base |
| `/labs/knowledge/[id]` | Knowledge detail + challenges |
| `/labs/observations` | Field observations |
| `/labs/seed` | Admin seed page |
| `/labs/sops` | SOP list |
| `/labs/sops/[id]` | SOP detail + checklist editor |
| `/labs/sops/[id]/script` | SOP script view |
| `/labs/sops/new` | Create new SOP |
| `/labs/structure` | Building structure (floors/rooms) |
| `/labs/structure/deploy` | Deploy looped blueprints to locations |
| `/labs/submissions` | Field submissions |
| `/labs/tests` | Material tests |
| `/labs/tests/[id]` | Test detail |
| `/labs/tokens` | Trust tokens |
| `/labs/tokens/[id]` | Token detail |
| `/labs/tool-research` | Tool research (10 tabs) |
| `/labs/training` | Training overview |
| `/labs/training/[crewId]` | Crew member training history |
| `/labs/voting` | Community voting |

**Admin**
| Route | Purpose |
|-------|---------|
| `/admin/crew` | Crew management |
| `/admin/rates` | Rate configuration |
| `/admin/settings` | App settings — theme, view mode, skill rates, margins |

---

## 7. Service & Repository Inventory

### Services Interface

```
services.activity              → ActivityService (THE SPINE)
services.projects              → ProjectRepository
services.customers             → CustomerRepository
services.estimating.lineItems  → LineItemRepository
services.estimating.catalog    → CatalogRepository
services.scheduling.tasks      → TaskRepository
services.fieldDocs.inspections → InspectionRepository
services.fieldDocs.photos      → PhotoRepository
services.labs                  → LabsServices (11+ sub-services)
services.integration.*         → ChangeOrders, UncapturedWork, Callbacks
services.timeClock             → TimeClockService
services.pipeline              → TaskPipelineService
services.labourEstimation      → LabourEstimationService         ← NEW
services.skillRateConfig       → SkillRateConfigRepository       ← NEW
services.forecast              → ForecastService                 ← NEW
services.schedule              → ScheduleService                 ← NEW
services.toolResearch          → ToolResearchService             ← NEW
```

### LoggedServices Interface (mutations with activity logging)

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

### LabsServices

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
services.labs.tokens              → LabsTokenService              ← NEW
services.labs.tests               → LabsTestService               ← NEW
services.labs.voting              → LabsVotingService              ← NEW
services.labs.materialChanges     → MaterialChangeService          ← NEW
services.labs.workflows           → WorkflowService                ← NEW
```

---

## 8. React Query Hooks

### ~20 Hook Files

| File | What It Provides |
|------|------------------|
| `useLocalData.ts` | Projects, customers, line items, catalog, tasks, inspections, photos, activity events, SOP progress |
| `useLabsData.ts` | All Labs entities: observations, products, techniques, tools, combinations, ratings, submissions, experiments, knowledge, challenges, SOPs, checklist templates |
| `useActivityMutations.ts` | Activity-logging mutation hooks for all core entities |
| `useIntegrationData.ts` | Change orders, uncaptured work, observation links, project budget |
| `useSOPTriggerIntegration.ts` | Step toggle → observation trigger (Build 2) |
| `useTimeClock.ts` | Clock in/out, breaks, task switching, time entries, daily totals |
| `useIdleDetection.ts` | 15-min idle detection with global event listeners |
| `useCompleteTaskWithBatchCheck.ts` | Task completion + pending batch check |
| `useTaskPipeline.ts` | Blueprint queries + mutations, deployed task queries |
| `useApproveWithPipeline.ts` | Estimate/CO approval → auto pipeline generation |
| `useLabourEstimation.ts` | **NEW** — 10 hooks: config, update, preview, apply, assign crew, record hours, task/project/crew variance, recalculate |
| `useForecast.ts` | **NEW** — Forecast config, projections, actuals, snapshots, save |
| `useSchedule.ts` | **NEW** — Schedule blocks, notes, day view, assign |
| `useToolResearch.ts` | **NEW** — Tool platforms, items, inventory, purchase tracking |
| `useDarkMode.ts` | **NEW** — Dark mode toggle with localStorage |
| `useMediaQuery.ts` | **NEW** — Responsive breakpoint detection |
| `useLoopManagement.ts` | Loop tree, contexts, iterations |
| `useTraining.ts` | Training records, certification status |
| `index.ts` | Re-exports |

---

## 9. Component Inventory

### ~80+ Components

| Folder | Key Components |
|--------|---------------|
| `ui/` | PageHeader, Button, Input, Select, Card, Badge, LoadingSpinner, Modal, Toast, Table, Tabs, PageErrorBoundary, ErrorBoundary |
| `activity/` | ActivityFeed, ActivityEventRow, ActivityFilterPills, ThreeAxisFilters, QuickAddSheet, QuickAddContext, ProjectActivityFeed, ProjectSelector, HomeownerActivityFeed |
| `labs/` | ConfidenceScoreBadge, ObservationCard, KnowledgeItemCard, SubmissionCard, ExperimentCard, FlagForLabsButton, LabsStatsRow, SOPCard, BatchConfirmModal, ObservationConfirmCard |
| `visualization/` | Sphere, SphereCluster, WidgetCard, ConfidenceBadge |
| `voice/` | VoiceInputFAB, VoiceRecordingOverlay, VoiceConfirmationCard, VoiceInputContainer, VoiceErrorToast |
| `navigation/` | BreadcrumbSpheres, BottomNav, Sidebar |
| `crew/` | CrewGate, CrewSelector |
| `timeclock/` | TimeClockWidget, TaskPicker, IdlePrompt |
| `sop/` | SOPChecklist |
| `intake/` | IntakeWizard, ContractorIntakeWizard |
| `estimates/` | **NEW** — EstimateDetail, LineItemTable, EstimateActions |
| `schedule/` | **NEW** — DayColumn, TaskBlock, UnscheduledTasks |
| `projects/` | TaskCard (now with labour budget section), ProjectDetailPanels |
| `dev/` | DevTools |

---

## 10. Provider Chain

```
<ThemeProvider>                ← Dark mode + CSS variables
  <QueryProvider>              ← React Query (TanStack Query)
    <ServicesProvider>         ← IndexedDB v21 + all services
      <ActiveCrewProvider>     ← Crew session (blocks if no session)
        <ToastProvider>
          <QuickAddProvider>
            {children}         ← App content
          </QuickAddProvider>
        </ToastProvider>
      </ActiveCrewProvider>
    </ServicesProvider>
  </QueryProvider>
</ThemeProvider>
```

---

## 11. Master Integration Spec Status

The Master Integration Spec (LOCKED 2026-02-08) defines 8 agreements:

| Agreement | Description | Status |
|-----------|-------------|--------|
| **A. SOP = source of truth** | OH family first-class | IMPLEMENTED. 21 SOPs seeded. |
| **B. Estimate → Template → Instance** | COs all-or-nothing | IMPLEMENTED (Build 3b). |
| **C. Checklist = Labs bridge** | 3-tier config, hybrid trigger | IMPLEMENTED (Build 2). |
| **D. Time clock per-task** | Persistent floating widget, 15min idle | IMPLEMENTED (Build 3a). |
| **E. Soft training gate** | Per-SOP certification | IMPLEMENTED (Build 3c). 3 supervised + 80% review + manual signoff. |
| **F. Activity log = integration bus** | Independent visibility toggles | PARTIALLY. All mutations logged. Toggles partially in view mode system. |
| **G. Offline-first** | Field-level merge, append-only | IMPLEMENTED. IndexedDB v21, 57 stores. |
| **H. Friction budget 2-3 min/task** | Pre-filled SOP defaults | IMPLEMENTED. Observation defaults from templates. |

### Additional Spec Items

| Item | Status |
|------|--------|
| Callbacks | IMPLEMENTED (Build 1) |
| knowledge_item ↔ field_observation | IMPLEMENTED (Build 1) |
| SOP versioning | IMPLEMENTED (Build 1.5/3b) |
| Estimate → budget conversion | IMPLEMENTED (Build 3c + Labour Estimation Engine) |
| Loop management UI | IMPLEMENTED (Build 3d) |
| Photos: local → cloud sync | PARTIAL — local works, cloud deferred |
| Client portal | PLACEHOLDER at `/portal/[projectId]` |
| Sub-trade integration | DEFERRED |
| CO partial approvals | DEFERRED (v2) |

---

## 12. Known Gaps & Deferred Work

### Priority Gaps

| Gap | Description | Impact |
|-----|-------------|--------|
| **Catalogue → sell rate connection** | Blueprint deploy page uses `estimatedHoursPerUnit` as placeholder for `catalogueSellRate`. Needs real catalogue item selector. | Labour estimates are approximate until connected to cost catalogue |
| **Activity visibility toggles** | Per-event type visibility (labs/hooomz/homeowner/training) partially addressed by view modes but not granular event-level toggles | Agreement F not fully complete |
| **Photo cloud sync** | Local storage works, no cloud upload | Field photos not backed up |

### Deferred Features

| Feature | Status |
|---------|--------|
| Client portal | Placeholder route exists |
| Sub-trade integration | Not started |
| CO partial approvals | Deferred to v2 |
| Supabase migration | All data in IndexedDB only |
| Automated tests | No test suite — relies on typecheck + manual |
| Hardcoded SOPs fallback removal | `sops.ts` fallback still active |

### Hardcoded Items to Replace

| Item | Current | Target |
|------|---------|--------|
| Crew members | Seeded Nathan + Nishant in IndexedDB, fallback in CrewSelector | Dynamic crew management via `/admin/crew` |
| `'no_project'` placeholder | Used when no project selected | Proper empty-state handling |
| SOPChecklist fallback | Falls back to hardcoded `getSOPById()` | Remove after confirming database SOPs end-to-end |

---

## 13. Known Issues & Risks

### IndexedDB Write Bug (FIXED 2026-02-12)

`set()/delete()/clear()` now resolve on `transaction.oncomplete` instead of `request.onsuccess`. All three methods reject on `transaction.onerror` and `transaction.onabort`.

### Active Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| 57 stores may hit browser limits on some mobile devices | Slow queries | Monitor; consider store consolidation |
| IndexedDB v21 upgrade path | Users with older versions may hit upgrade issues | Upgrade handler creates missing stores |
| No automated tests | Regression risk on all 52 pages | Typecheck catches type errors; manual testing for UI |
| Large bundle size (~80+ components, ~20 hook files) | Slow initial load | Next.js code splitting helps; monitor bundle |
| Forecast + Labour data not connected | Financial projections don't use actual labour variance | Wire variance data into forecast actuals |
| `estimatedHoursPerUnit` as sell rate proxy | Labour estimates inaccurate | Connect to cost catalogue items |

### Typecheck Status

**0 errors** across all packages and web app as of latest commit (`6ef89a1`).

---

## Appendix: Design Language Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#F3F4F6` / `#0a0a0a` | Page background |
| `--surface-1` | `#FFFFFF` / `#161616` | Card backgrounds |
| `--text` | `#111827` / `#F3F4F6` | Primary text |
| `--accent` | `#0F766E` | Interaction only |
| `--green` | `#10B981` | Complete / success |
| `--blue` | `#3B82F6` | In progress |
| `--amber` | `#F59E0B` | Warning |
| `--red` | `#EF4444` | Error / blocked |
| `--font-cond` | Condensed Inter variant | Section headers |
| `--font-mono` | JetBrains Mono | Data, numbers |
| `--radius` | `12px` | Cards |
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.03)` | Card elevation |
| Min touch target | `44px` | Mobile-first |
| Rule | 90% mono / 10% accent | Max 2-3 teal elements per screen |

---

## Appendix: Seed Data

| Entity | Count | Source |
|--------|-------|--------|
| SOPs | 21 | `sops.ts` (DW:3, FC:6, FL:7, PT:3, OH:1, SC:1) |
| Checklist items | ~140 | SOP quick_steps |
| Knowledge items | ~15 | Lab references from critical_standards |
| Catalog items | 62 | `labsSeedData.ts` |
| Crew members | 2 | Nathan ($45/$95 master), Nishant ($28/$55 learner) |
| Demo projects | 3 | Seeded via demo scenario |
| Demo customers | 3 | Seeded via demo scenario |

Seed page: `/labs/seed` with "Seed All", "Demo Scenario", "Clear & Re-seed" buttons.
