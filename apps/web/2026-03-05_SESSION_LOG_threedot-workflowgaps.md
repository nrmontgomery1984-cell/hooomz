# Session Log — Three-Dot System + Workflow Gap Build

**Date:** 2026-03-05
**Build:** Three-Dot Health System + 6 Workflow Gap Priorities
**tsc --noEmit:** 0 errors after every priority

---

## Build Order (Dependency-Optimized)

### Priority 1: Three-Dot Constants + Job Health Service ✅

**Created:**
- `apps/web/src/lib/constants/threeDot.ts` — `ThreeDotColor` type, `THREE_DOT_HEX` constants, `scoreToThreeDot()`, `threeDotHex()`, `JobHealthResult` interface
- `apps/web/src/lib/services/jobHealth.service.ts` — `JobHealthService.getJobHealthStatus(projectId)` with weighted score: completion 50% + budget 30% + blockers 20%
- `apps/web/src/lib/hooks/useJobHealth.ts` — `useJobHealth(projectId)`, `useAllJobHealth(projectIds[])`

**Modified:**
- `apps/web/src/lib/services/index.ts` — added `JobHealthService` import, `jobHealth` to Services interface, late-bound initialization
- `apps/web/src/app/globals.css` — added `--dot-green`, `--dot-yellow`, `--dot-red` CSS variables
- `apps/web/src/app/production/page.tsx` — replaced inline health color logic with `threeDotHex()` for health dots and needs-attention colors
- `apps/web/src/app/production/jobs/page.tsx` — replaced hardcoded hex colors with `THREE_DOT_HEX` constants, health dot rendering uses `threeDotHex()`

---

### Priority 5: Punch List Entity ✅

**Created:**
- `apps/web/src/lib/types/punchList.types.ts` — `PunchListItem`, `CreatePunchListItem`, `PunchListPriority`, `PunchListStatus`
- `apps/web/src/lib/repositories/punchList.repository.ts` — CRUD + `findByProject()`, `findOpenByProject()`, `countOpenByProject()`
- `apps/web/src/lib/services/punchList.service.ts` — wraps repo + activity logging (create/resolve/verify/reopen/delete)
- `apps/web/src/lib/hooks/usePunchList.ts` — `usePunchListByProject()`, `usePunchListOpenCount()`, mutations
- `apps/web/src/components/projects/PunchListPanel.tsx` — collapsible panel, items grouped by priority (critical/major/minor), resolve/verify/reopen buttons, add item form

**Modified:**
- `apps/web/src/lib/storage/StorageAdapter.ts` — added `PUNCH_LIST_ITEMS` to StoreNames
- `apps/web/src/lib/storage/IndexedDBAdapter.ts` — bumped DB_VERSION 30 → 31, added indexes (projectId, status, priority, assignedTo)
- `apps/web/src/lib/services/index.ts` — registered `PunchListService`
- `apps/web/src/app/projects/[id]/page.tsx` — added PunchListPanel to both mobile (MobileCollapsible) and desktop layouts

---

### Priority 2: Production Score on Homeowner Portal ✅

**Created:**
- `apps/web/src/lib/services/productionScore.service.ts` — `computeProductionScore()` pure function, 5-factor weighted score (stage 40 + punch 20 + decisions 15 + update age 15 + completion 10)
- `apps/web/src/lib/hooks/useProductionScore.ts` — composes project + tasks + punch count + activity + change orders + job health
- `apps/web/src/components/portal/ProductionScoreWidget.tsx` — 40px dot, score number, status line, SCRIPT stage progression bar (6 dots connected by lines)

**Modified:**
- `apps/web/src/app/portal/[projectId]/page.tsx` — inserted ProductionScoreWidget above the fold, before Project Progress section

---

### Priority 6: AR Aging Utility Extraction ✅

**Created:**
- `apps/web/src/lib/utils/invoiceAging.ts` — extracted pure `computeInvoiceAging(invoices[])` function with `InvoiceAgingBuckets` return type
- `apps/web/src/components/finance/ARAgingTable.tsx` — collapsible card with bucket rows (Current, 1-30, 31-60, 61+ days), bar visualization, expandable overdue invoice list

**Modified:**
- `apps/web/src/lib/hooks/useInvoiceAging.ts` — refactored to call extracted utility instead of inline logic
- `apps/web/src/app/finance/page.tsx` — added ARAgingTable between Labour Performance and Expenses sections

---

### Priority 3: Financial Score on Finance Dashboard ✅

**Created:**
- `apps/web/src/lib/services/financialScore.service.ts` — `computeFinancialScore()` pure function, 3-factor weighted score (receivables 40% + margins 30% + revenue 30%)
- `apps/web/src/lib/hooks/useFinancialScore.ts` — composes invoices + aging + forecast config + projection
- `apps/web/src/components/finance/FinancialScoreWidget.tsx` — 40px dot, score, label, three sub-indicator rows (receivables/margins/revenue)

**Modified:**
- `apps/web/src/app/finance/page.tsx` — inserted FinancialScoreWidget as first element after header

---

### Priority 4: SCRIPT Stage Gate Enforcement ✅

**Created:**
- `apps/web/src/lib/services/stageGate.service.ts` — `StageGateService.canAdvanceStage()` with gate checks per stage:
  - Shield: site protection checklist submitted
  - Clear: at least 1 before-condition photo
  - Ready: material selections exist and confirmed
  - Install: no blocked tasks
  - Punch: all punch items resolved + at least 1 invoice issued
- `apps/web/src/lib/hooks/useStageGate.ts` — `useCanAdvanceStage()`, `useAdvanceStage()` mutation
- `apps/web/src/components/projects/StageAdvancePanel.tsx` — advance button + blocker list + soft gate confirm dialog ("Advance Anyway?")

**Modified:**
- `apps/web/src/lib/services/index.ts` — registered `StageGateService` (late-bound)
- `apps/web/src/app/projects/[id]/page.tsx` — added StageAdvancePanel below ScriptPipeline

---

## File Counts

- **Created:** 19 new files
- **Modified:** 11 existing files
- **IDB version bump:** 30 → 31 (1 new store: PUNCH_LIST_ITEMS)

## Verification

- [x] `tsc --noEmit` returns 0 errors after every priority
- [x] Three-Dot hex colors consistent across all health dots
- [x] Production dashboard uses `threeDotHex()` for job health dots
- [x] Jobs page uses `THREE_DOT_HEX` for filter pill colors
- [x] Punch list CRUD with activity logging
- [x] Production Score widget on portal with SCRIPT stage bar
- [x] AR Aging table with bucket visualization
- [x] Financial Score widget with sub-indicators
- [x] Stage gate with soft enforcement (blocker warnings + override)
- [x] CSS variables `--dot-green`, `--dot-yellow`, `--dot-red` added to `:root`
