# Context Brief: Next Feature Set — Task Quick-Add, Budget Drill-Down, Sales Checklists, Expense Tracker

**Date:** 2026-02-23
**Author:** Claude Code
**Status:** Context handoff for planning

---

## What This Brief Is For

Nathan identified 4 features to build next. This document provides all the context a fresh Claude session needs to plan and implement them without re-exploring the codebase.

### The 4 Features

1. **Quick Add button for tasks on project detail page**
2. **Clickable budget breakdown lines → line-by-line cost detail**
3. **Checklists for sales process tasks**
4. **Expense tracker integrating time tracking**

---

## 1. Quick Add Task on Project Detail

### Current State

**Project detail page:** `apps/web/src/app/projects/[id]/page.tsx` (~780 lines)

- Three-column layout: Col 1 (42%) = task loop tree, Col 2 (33%) = budget + timeline + activity, Col 3 (25%) = risk + COs + crew training + labs
- Header has: back button, project name/address, status pill, budget items (Material/Labour/Progress), delete button
- **No "Add Task" button exists.** The empty state says "Use Quick Add (+) to add tasks" but that refers to the global QuickAddSheet (activity page), which creates activity log entries — NOT tasks
- Tasks are currently created via:
  - **Estimate approval pipeline** — line items → TaskTemplate → TaskInstance (primary flow)
  - **Change orders** — CO line items can generate task templates
  - No manual task creation UI exists yet

### Task Type (from `packages/shared-contracts/src/schemas/index.ts`)

```typescript
// Key Task fields:
{
  id: string;
  projectId: string;
  title: string;               // First line = "StageName · TradeName"
  description?: string;        // Optional second line "sopId:HI-SOP-XX-NNN"
  status: 'not_started' | 'in_progress' | 'blocked' | 'complete';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: string;
  dependencies: string[];
  workSource?: 'estimate' | 'change_order' | 'uncaptured';  // ← Manual tasks = 'uncaptured'
  sortOrder?: number;
  sopId?: string;
  sopCode?: string;
  loopIterationId?: string;
  workflowId?: string;
}
```

### Task Enrichment (for display)

`apps/web/src/lib/utils/taskParsing.ts` has `enrichTask()` that parses task title/description into `EnrichedTask` with: `taskName`, `room`, `tradeCode`, `stageCode`, `sopCode`, `resolvedSopId`, `labsFlagged`, `sortOrder`.

### Where to Add the Button

The project detail header (line ~505-538) already has back, name, budget items, and delete. Add a `+` button to the header or as a FAB in column 1.

### Task Service

`services.scheduling.tasks` → `TaskRepository` for CRUD. `LoggedServices.tasks` → `TaskService` for mutations with activity logging.

### Relevant Hooks

- `useLocalTasks(projectId)` — fetches tasks for a project
- No `useCreateTask` hook exists yet — will need to be created

---

## 2. Clickable Budget Breakdown → Line-by-Line Detail

### Current State

**BudgetPanel:** `apps/web/src/components/projects/BudgetPanel.tsx` (305 lines)

- Shows Hours track bar (actual/budgeted) + Cost track bar (actual/estimated)
- Cost bar is clickable → expands to show `MiniTrackBar` rows grouped by `CostCategory`
- Each `MiniTrackBar` shows: category label, currency value, proportion bar
- **Category bars are NOT clickable** — they're display-only `<div>` elements
- Line items are already fetched when cost is expanded (`useQuery` with `services.estimating.lineItems.findByProjectId`)

### Line Item Type (from `packages/shared-contracts/src/schemas/index.ts`)

```typescript
{
  id: string;
  projectId: string;
  category: CostCategory;       // 24 values: flooring, painting, interior-trim, labor, materials, etc.
  description: string;
  quantity: number;
  unit: UnitOfMeasure;           // sqft, lf, each, hour, etc.
  unitCost: number;
  totalCost: number;
  isLabor: boolean;
  sopCodes?: string[];
  isLooped?: boolean;
  loopContextLabel?: string;
  estimatedHoursPerUnit?: number;
  workCategoryCode?: string;     // FL, PT, FC, etc.
  stageCode?: string;            // ST-DM, ST-PR, etc.
  locationLabel?: string;        // room name
}
```

### What Needs to Happen

Make each `MiniTrackBar` (category row) clickable. When clicked, expand to show individual line items within that category. Each line item row shows: description, quantity × unit @ unitCost, totalCost. Optionally link to the estimate page for editing.

### Data Already Available

The `categoryBreakdown` memo groups line items by category but only stores the total. The raw `lineItems` array is available in the same scope — just needs a secondary grouping or filter when a category is clicked.

### Estimate Page (for deep linking)

`apps/web/src/app/estimates/[id]/page.tsx` — Full estimate editor with line item CRUD. URL: `/estimates/{projectId}`.

---

## 3. Checklists for Sales Process Tasks

### Current State

**No sales checklists exist.** Checklists are exclusively in Labs:
- `SopChecklistItemTemplate` — tied to SOP execution during production tasks
- `SOPChecklist.tsx` component — renders checklist with confirm/deviate UX
- Used in `TaskCard` to show checklist progress during project execution

**Sales stages have NO structured workflows:**
- **Leads** (`/leads`) — CRM data + temperature + follow-up tracking
- **Consultations** (`/sales/consultations`) — just scheduling (date, status, notes)
- **Quotes** (`/sales/quotes/[id]`) — line items + send/view/accept status
- **Estimates** (`/estimates/[id]`) — line item CRUD + approval pipeline

### What Sales Checklists Would Look Like

Each sales stage could have a checklist ensuring nothing gets missed:

**Lead → Contacted checklist:**
- [ ] Initial call/text made
- [ ] Scope confirmed (which trades)
- [ ] Budget range discussed
- [ ] Timeline established
- [ ] Follow-up date set

**Discovery/Consultation checklist:**
- [ ] Site photos taken
- [ ] Measurements recorded
- [ ] Existing conditions documented
- [ ] Customer preferences confirmed
- [ ] Special access requirements noted

**Estimate → Quote checklist:**
- [ ] All line items reviewed
- [ ] Markup percentages verified
- [ ] Material availability confirmed
- [ ] Cover notes written
- [ ] Video walkthrough recorded (optional)

### Architecture Decision Needed

**Option A: Reuse SOP checklist system** — Create "sales SOPs" (e.g., `HI-SOP-SALES-CONSULT`) with checklist item templates. Attach to consultations/quotes like production tasks.

**Option B: Lightweight separate system** — Simple checklist arrays stored directly on ConsultationRecord/QuoteRecord. No SOP binding. Just `{ label: string; checked: boolean; checkedAt?: string }[]`.

**Option C: Hybrid** — Define checklist templates in a config file (not IndexedDB), render them on the consultation/quote detail pages. Store completion state in the existing record's metadata.

### Relevant Types

```typescript
// ConsultationRecord (current — packages/shared-contracts/src/types/index.ts)
{
  id: string;
  customerId: string;
  projectId: string;
  scheduledDate?: string;
  completedDate?: string;
  sitePhotoIds: string[];
  measurements: Record<string, unknown>;
  scopeNotes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  discoveryDraftId?: string;
  _seeded?: boolean;
}

// QuoteRecord (current)
{
  id: string;
  customerId: string;
  projectId: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  expiresAt?: string;
  coverNotes: string;
  videoLink: string;
  declineReason: string;
  _seeded?: boolean;
}
```

### IndexedDB Stores

- `consultations` — ConsultationRepository
- `quotes` — QuoteRepository
- Current DB version: **24**

---

## 4. Expense Tracker Integrating Time Tracking

### Current State — Time Tracking

**Time clock system is BUILT and working (Build 3a).**

**TimeClockWidget:** `apps/web/src/components/timeclock/TimeClockWidget.tsx`
- Floating persistent widget (was removed from layout in last session — `layout.tsx` no longer imports it)
- Clock in/out with task picker, break tracking, 15min idle detection
- Saves `TimeEntry` to IndexedDB

**TimeEntry type** (from `packages/shared/src/types/team.ts`):
```typescript
{
  id: string;
  organization_id: string;
  project_id: string;
  team_member_id: string;
  task_instance_id?: string;
  clock_in: string;           // ISO datetime
  clock_out?: string;
  break_minutes: number;
  total_hours?: number;
  hourly_rate: number;
  note?: string;
  gps_clock_in?: GpsCoordinate;
  gps_clock_out?: GpsCoordinate;
  captured_offline: boolean;
  entryType?: 'task' | 'break' | 'overhead';
  role?: 'primary' | 'supervisor';
  sopVersionId?: string;
  idlePrompts?: number;
}
```

**IndexedDB stores:**
- `timeEntries` — TimeEntryRepository
- `timeClockState` — TimeClockStateRepository (runtime state)
- `activeCrewSession` — ActiveCrewSessionRepository

**Hooks:**
- `useTimeClockState(crewMemberId)` — current clock state
- `useTodayEntries(crewMemberId)` — today's entries
- `useTodayTotal(crewMemberId)` — sum of hours today
- `useClockIn()`, `useClockOut()`, `useSwitchTask()`, `useCompleteTimedTask()`, `useStartBreak()`, `useEndBreak()`

**Service:** `services.timeClock` → `TimeClockService`

### Current State — Expenses

**NO expense system exists.** No types, stores, services, or components.

Financial tracking is currently implicit:
- **Labour cost:** TimeEntry hours × crew wage rate (from CrewMember)
- **Material cost:** LineItem totals (from estimates)
- **Budget tracking:** TaskBudget (budgeted vs actual hours/materials per task)
- **Change orders:** CO cost impact tracked

### What's Missing

An explicit expense tracker needs:

**ExpenseEntry type (new):**
```typescript
{
  id: string;
  projectId: string;
  taskId?: string;              // Optional link to task
  crewMemberId?: string;        // Who incurred it
  category: 'material' | 'tool_rental' | 'subcontractor' | 'permit' | 'delivery' | 'fuel' | 'other';
  description: string;
  amount: number;
  date: string;                 // ISO date
  receiptPhotoId?: string;      // Link to Photo record
  vendor?: string;
  paymentMethod?: 'cash' | 'card' | 'account' | 'company_card';
  isReimbursable: boolean;
  reimbursedAt?: string;
  metadata: Metadata;
}
```

**Integration with time tracking:**
- Labour expenses auto-calculated from TimeEntry × crew wage rates
- Material expenses manually entered + optionally linked to estimate line items
- Dashboard view showing: labour cost (auto from time), materials (manual entries + estimate actuals), other expenses
- Per-project and per-task cost views
- Running total vs budget comparison

### New Infrastructure Needed

- `ExpenseEntry` type in shared-contracts
- `expenses` IndexedDB store (DB version bump to 25)
- `ExpenseRepository`
- `ExpenseService` (with activity logging)
- `useExpenses(projectId)` hook
- Expense entry form (quick add from project page or standalone)
- Expense summary panel (on project detail or standalone `/expenses` page)

### TaskBudget (existing — for integration)

```typescript
{
  id: string;
  taskId: string;
  blueprintId: string;
  projectId: string;
  sopCode: string;
  budgetedHours: number;
  actualHours: number;
  budgetedMaterialCost: number;
  actualMaterialCost: number;     // ← This field exists but isn't populated from expenses
  crewWageRate: number;
  chargedRate: number;
  efficiency?: number;
  status: 'active' | 'complete' | 'over_budget';
}
```

### BudgetService (existing)

`apps/web/src/lib/services/budget.service.ts` — manages TaskBudget records. Could be extended to incorporate expense totals into `actualMaterialCost`.

---

## Key Architecture Constraints

1. **Activity Log is the spine** — every mutation writes an event
2. **Offline-first** — IndexedDB primary, cloud sync secondary
3. **Mobile-first** — 44px touch targets, one-thumb operation
4. **Design language** — Monochrome base, teal #0F766E accent for interactions only
5. **Friction budget** — 2-3 min/task max. Pre-fill defaults, friction only on deviations
6. **IndexedDB write pattern** — resolve on `transaction.oncomplete`, NOT `request.onsuccess`

## Service Architecture

```
Services Context (ServicesContext.ts)
├── services.scheduling.tasks          → TaskRepository
├── services.estimating.lineItems      → LineItemRepository
├── services.estimating.catalog        → CatalogRepository
├── services.timeClock                 → TimeClockService
├── services.budget                    → BudgetService
├── services.integration.changeOrders  → ChangeOrderService
├── services.crew                      → CrewMemberRepository
├── services.consultations             → ConsultationRepository
├── services.quotes                    → QuoteRepository
├── services.activity                  → ActivityService (THE SPINE)
└── [NEW] services.expenses            → ExpenseService (to be created)
```

## Provider Chain

`Theme → Query → Services → ActiveCrew → Toast → QuickAdd`

## Current DB Version: 24

Stores: 49 total. Key ones for these features:
- `tasks`, `lineItems`, `projects`, `timeEntries`, `taskBudgets`
- `consultations`, `quotes`, `customersV2`
- `activityEvents` (append-only spine)

---

## File Inventory

| File | What it does | Relevant to |
|------|-------------|-------------|
| `apps/web/src/app/projects/[id]/page.tsx` | Project detail (3-col layout, task loop tree) | Feature 1, 2 |
| `apps/web/src/components/projects/BudgetPanel.tsx` | Hours/cost track bars + expandable category breakdown | Feature 2 |
| `apps/web/src/components/projects/TaskCard.tsx` | Rich task card with SOP/budget/training | Feature 1 |
| `apps/web/src/app/estimates/[id]/page.tsx` | Estimate editor with line item CRUD | Feature 2 |
| `apps/web/src/components/timeclock/TimeClockWidget.tsx` | Floating time clock (currently removed from layout) | Feature 4 |
| `apps/web/src/lib/services/timeClock.service.ts` | Time tracking business logic | Feature 4 |
| `apps/web/src/lib/services/budget.service.ts` | TaskBudget management | Feature 2, 4 |
| `apps/web/src/lib/repositories/timeEntry.repository.ts` | TimeEntry IndexedDB storage | Feature 4 |
| `apps/web/src/app/sales/consultations/page.tsx` | Consultation scheduling | Feature 3 |
| `apps/web/src/app/sales/quotes/[id]/page.tsx` | Quote detail | Feature 3 |
| `apps/web/src/lib/hooks/useLocalData.ts` | Task/project CRUD hooks | Feature 1 |
| `apps/web/src/lib/hooks/useCrewData.ts` | Budget/training hooks | Feature 2, 4 |
| `apps/web/src/lib/hooks/useIntegrationData.ts` | Change order hooks | Feature 2 |
| `apps/web/src/lib/utils/taskParsing.ts` | `enrichTask()` — task display model | Feature 1 |
| `apps/web/src/lib/storage/StorageAdapter.ts` | StoreNames + DB version | Feature 4 |
| `packages/shared-contracts/src/types/index.ts` | All shared types + enums | All features |
| `packages/shared-contracts/src/types/integration.ts` | Integration types (CO, SOP, TaskBudget) | Feature 2, 4 |
| `packages/shared-contracts/src/schemas/index.ts` | Zod schemas for all entities | All features |
| `packages/shared/src/types/team.ts` | TimeEntry type | Feature 4 |
| `packages/shared/src/types/activity.ts` | ActivityEvent type | All features |

---

## Suggested Build Order

1. **Feature 2: Budget drill-down** — Smallest scope. Self-contained in BudgetPanel. No new stores or types. Can ship same session.
2. **Feature 1: Quick Add Task** — Medium scope. Needs new hook + small form component. Touches project detail page.
3. **Feature 3: Sales checklists** — Needs architecture decision first (reuse SOP system vs lightweight). Medium-large scope depending on choice.
4. **Feature 4: Expense tracker** — Largest scope. New type, store, repo, service, hooks, components, and DB version bump. Full vertical slice.

---

## Completed This Session (2026-02-23)

- **Default leads view collapsed** — All stages start collapsed, with auto-expand for highlighted leads from sales dashboard
- **Typecheck passes** — 0 errors
