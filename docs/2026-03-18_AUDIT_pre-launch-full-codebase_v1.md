# Pre-Launch Full Codebase Audit
**Date:** 2026-03-18
**Type:** AUDIT
**Version:** v1
**Purpose:** Final review before production launch. Covers every page, data source, navigation link, mock data, and design inconsistency.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current State Overview](#2-current-state-overview)
3. [Route & Page Inventory](#3-route--page-inventory)
4. [Mock & Seed Data Catalog](#4-mock--seed-data-catalog)
5. [Navigation Audit](#5-navigation-audit)
6. [Hardcoded Values & Wiring Gaps](#6-hardcoded-values--wiring-gaps)
7. [Design Consistency Audit](#7-design-consistency-audit)
8. [Data Flow Audit](#8-data-flow-audit)
9. [Critical Issues (Must Fix Before Launch)](#9-critical-issues-must-fix-before-launch)
10. [Recommended Improvements (Post-Launch OK)](#10-recommended-improvements-post-launch-ok)
11. [Implementation Plan](#11-implementation-plan)

---

## 1. Executive Summary

The Hooomz Interiors app is a **77-page** Next.js 14 application with **21 redirect stubs**, **2 placeholder pages**, and **3 layout wrappers**. The codebase is functional but has several pre-launch blockers:

**BLOCKERS (Must fix):**
- Mock/demo data in 16+ seed files will populate the app with fake customers, projects, and leads
- Sidebar navigation points to **wrong routes** (8 links go to redirect stubs instead of real pages)
- Hardcoded badge counts (Jobs: 3, Punch Lists: 2) show fake numbers
- ~2,774 hardcoded hex colors across 80+ files break dark mode and design consistency
- The `/labs/seed` page is accessible in production and can nuke the database
- Finance dashboard shows placeholder dashes instead of real data

**HEALTHY:**
- Auth flow (Supabase + ProtectedRoute + role permissions) is solid
- Sync engine (IndexedDB + sync_data + org_id scoping) works correctly
- Intake form now flows through /api/intake with correct org_id
- Standards module (SOPs, Training, Knowledge Base) is complete and well-built
- Activity log spine pattern is consistently applied
- Type safety: 0 TypeScript errors

---

## 2. Current State Overview

| Metric | Value |
|--------|-------|
| Framework | Next.js 14.2.35 (App Router) |
| Styling | Tailwind CSS + CSS custom properties |
| State | Zustand (planned), currently React hooks + IndexedDB |
| Backend | Supabase (Auth, RLS, sync_data table) |
| Local storage | IndexedDB v25+, 50+ stores |
| Pages (real) | 77 |
| Pages (redirects) | 21 |
| Pages (stubs) | 2 |
| Components | 80+ |
| TypeScript errors | 0 |
| Seed data files | 16 files, ~3,500 lines of demo data |

### Tech Stack
- **Auth:** Supabase Auth (email/password), ProtectedRoute wrapper, role_permissions table
- **Sync:** SyncEngine (IndexedDB <-> Supabase sync_data), org_id scoped via RLS
- **Fonts:** Figtree (display), DM Mono (mono), Zen Kaku Gothic New (body), IBM Plex Sans (sans), Barlow Condensed (condensed)
- **Deploy:** Vercel (hooomz.ca), CLI deploys via `vercel --prod`

---

## 3. Route & Page Inventory

### Real Pages (77)

#### Sales Division
| Route | Page | Data Source | Status |
|-------|------|------------|--------|
| `/dashboard` | Main dashboard | IndexedDB (projects, tasks, schedule) | Working, 1 hardcoded stat |
| `/leads` | Lead pipeline (7 stages) | IndexedDB (customers store) | Working |
| `/leads/new` | Lead capture wizard (7 steps) | IndexedDB (customers) | Working |
| `/sales` | Sales dashboard | IndexedDB (projects, estimates) | Working |
| `/sales/consultations` | Consultations list | IndexedDB (consultations) | Working |
| `/sales/quotes` | Quotes list | IndexedDB (quotes) | Working |
| `/sales/quotes/[id]` | Quote detail | IndexedDB (quotes, estimates) | Working |
| `/estimates` | Estimates list | IndexedDB (estimates) | Working |
| `/estimates/[id]` | Estimate detail | IndexedDB (line items) | Working |
| `/estimates/select-project` | Project selector | IndexedDB (projects) | Working |
| `/discovery/[projectId]` | Discovery wizard | IndexedDB (discovery drafts) | Working |
| `/discovery/[projectId]/review` | Discovery review + PDF | IndexedDB | Working |

#### Production Division
| Route | Page | Data Source | Status |
|-------|------|------------|--------|
| `/production` | Production dashboard | IndexedDB (projects by SCRIPT stage) | Working |
| `/production/jobs` | Jobs list | IndexedDB (projects) | Working |
| `/production/jobs/[id]/rooms` | Room list | IndexedDB (rooms) | Working |
| `/production/jobs/[id]/rooms/[roomId]` | Room detail | IndexedDB (rooms) | Working |
| `/production/jobs/[id]/rooms/[roomId]/layout` | Tile layout calculator | IndexedDB | Working |
| `/production/jobs/[id]/rooms/[roomId]/materials` | Room materials (G/B/B tiers) | IndexedDB | Working |
| `/production/jobs/[id]/rooms/[roomId]/trim` | Trim cut calculator + PDF | IndexedDB | Working |
| `/production/change-orders` | Change orders | **NONE** | **STUB — "Coming Soon"** |
| `/schedule` | Weekly schedule | IndexedDB (schedule blocks) | Working |
| `/schedule/assign` | Bulk schedule assign | IndexedDB | Working |
| `/schedule/day/[date]` | Day detail view | IndexedDB | Working |

#### Finance Division
| Route | Page | Data Source | Status |
|-------|------|------------|--------|
| `/finance` | Finance dashboard | IndexedDB (partial) | **Placeholder dashes for Revenue/Margin** |
| `/finance/invoices` | Invoices list | IndexedDB (invoices) | Working |
| `/invoices/[id]` | Invoice detail + PDF | IndexedDB | Working |
| `/forecast/actuals` | Financial actuals | IndexedDB (forecast) | Working |
| `/forecast/projections` | 3-year forecast | IndexedDB | Working |
| `/forecast/variance` | Variance tracking | IndexedDB | Working |

#### Standards Division
| Route | Page | Data Source | Status |
|-------|------|------------|--------|
| `/standards` | Standards dashboard | IndexedDB (SOPs, training, checklists) | Working |
| `/standards/sops` | SOP list | IndexedDB | Working |
| `/standards/sops/[id]` | SOP detail | IndexedDB | Working |
| `/standards/sops/[id]/checklist` | Interactive checklist | IndexedDB | Working |
| `/standards/training` | Training guides list | IndexedDB | Working |
| `/standards/training/[id]` | Training guide detail | IndexedDB | Working |
| `/standards/knowledge` | Knowledge base (4-tab) | IndexedDB | Working |

#### Labs Division
| Route | Page | Data Source | Status |
|-------|------|------------|--------|
| `/labs` | Labs dashboard | IndexedDB | Working |
| `/labs/observations` | Field observations | IndexedDB | Working |
| `/labs/experiments` | Experiments | IndexedDB | Working |
| `/labs/tests` | Test pipeline (Kanban) | IndexedDB | Working |
| `/labs/tests/[id]` | Test detail | IndexedDB | Working |
| `/labs/voting` | Partner voting | IndexedDB | Working |
| `/labs/tokens` | Material tokens | IndexedDB | Working |
| `/labs/tokens/[id]` | Token detail | IndexedDB | Working |
| `/labs/catalogs` | Products/Techniques/Tools | IndexedDB | Working |
| `/labs/knowledge` | Knowledge items | IndexedDB | Working |
| `/labs/knowledge/[id]` | Knowledge detail | IndexedDB | Working |
| `/labs/sops` | Lab SOPs | IndexedDB | Working |
| `/labs/sops/[id]` | Lab SOP detail | IndexedDB | Working |
| `/labs/sops/[id]/script` | SCRIPT phase view | IndexedDB | Working |
| `/labs/sops/new` | Create SOP form | IndexedDB | Working |
| `/labs/structure` | Building structure tree | IndexedDB | Working |
| `/labs/structure/deploy` | Deploy blueprints | IndexedDB | Working |
| `/labs/tool-research` | Tool research (10-tab) | IndexedDB | Working |
| `/labs/training` | Training dashboard | IndexedDB | Working |
| `/labs/training/[crewId]` | Crew training detail | IndexedDB | Working |
| `/labs/submissions` | Field submissions | IndexedDB | Working |
| `/labs/seed` | **DEV ONLY: Seed data loader** | IndexedDB | **SECURITY RISK — accessible in prod** |
| `/labs/iaq/new` | IAQ report ingestion | IndexedDB | Working |
| `/labs/iaq/[reportId]` | IAQ report viewer (5-tab) | IndexedDB | Working |

#### Admin & Cross-cutting
| Route | Page | Data Source | Status |
|-------|------|------------|--------|
| `/admin` | Admin hub | Links only | Working |
| `/admin/crew` | Crew management | IndexedDB | Working |
| `/admin/rates` | Labour rates & cost catalog | IndexedDB | Working |
| `/admin/settings` | Settings + role permissions | IndexedDB + Supabase | Working |
| `/customers` | Customer list | IndexedDB (customers) | Working |
| `/customers/[id]` | Customer detail (5-tab) | IndexedDB | Working |
| `/profile` | User profile | IndexedDB | Working |
| `/activity` | Activity log spine | IndexedDB (activity events) | Working |
| `/intake` | Intake wizard selector | IndexedDB | Working |
| `/catalogue` | Cost items catalogue | IndexedDB (cost items) | Working |

#### External / Public
| Route | Page | Data Source | Status |
|-------|------|------------|--------|
| `/login` | Login page | Supabase Auth | Working (5s timeout added) |
| `/portal/[projectId]` | Homeowner portal | IndexedDB | Working |
| `/app` | PWA entry redirect | Redirect to /dashboard | Working |
| `/` | Command Centre | IndexedDB | Working |

#### Legacy Pages (still render real content)
| Route | Page | Status |
|-------|------|--------|
| `/jobs/[id]` | Job detail with floor plan | Working (legacy route) |
| `/projects/[id]` | Project detail | Working (legacy route) |
| `/projects/[id]/[category]` | Category detail | **Has hardcoded health scores** |
| `/projects/[id]/[category]/[location]` | Location detail | Working |
| `/projects/[id]/care-sheet` | Home Care Sheet + PDF | Working |
| `/properties/[id]/activity` | Property activity (homeowner) | Working |

### Redirect Stubs (21)
| Route | Redirects To | Reason |
|-------|-------------|--------|
| `/add` | `/activity` | Legacy |
| `/jobs` | `/production/jobs` | Restructured |
| `/pipeline` | `/leads` | Renamed |
| `/work` | `/production` | Renamed |
| `/projects` | `/production/jobs` | Restructured |
| `/production/schedule` | `/schedule` | Promoted to top-level |
| `/production/crew` | `/admin/crew` | Moved to admin |
| `/production/customers` | `/customers` | Promoted to top-level |
| `/production/site-visits` | `/production` | Consolidated |
| `/production/estimates` | `/estimates` | Promoted to top-level |
| `/production/contracts` | `/production` | Consolidated |
| `/production/materials` | `/production` | Consolidated |
| `/production/punch-lists` | `/production` | Consolidated |
| `/sales/estimates` | `/estimates` | Promoted to top-level |
| `/sales/customers` | `/customers` | Promoted to top-level |
| `/finance/cost-catalogue` | `/admin/rates` | Moved |
| `/finance/forecast` | `/forecast` | Promoted to top-level |
| `/forecast` | `/forecast/actuals` | Default sub-route |
| `/labs/admin/experiments` | `/labs` | Consolidated |
| `/labs/admin/triage` | `/labs` | Consolidated |
| `/labs/admin/knowledge` | `/labs` | Consolidated |

### Placeholder Pages (2)
| Route | Current State |
|-------|--------------|
| `/production/change-orders` | "Coming Soon" stub |
| `/production/jobs/[id]/rooms/worker-spike` | Dev test page |

---

## 4. Mock & Seed Data Catalog

### Auto-Loaded on App Start (via ServicesContext.tsx)
These seed functions run automatically and are **legitimate operational data** (keep):

| Seed Function | Data | Count | Purpose |
|--------------|------|-------|---------|
| `seedTrainingGuidesIfEmpty()` | Training guides (FLR, PNT, TRM) | 3 guides | Standards module content |
| `seedStandardSOPsIfEmpty()` | SOPs (FLR, PNT, TRM) | 3 SOPs (~6,000 lines JSON) | Standards module content |
| `seedQuoteStageDataIfEmpty()` | Catalog products + assembly config | 12 products + 1 config | Material selection flow |
| `migrateCatalogProducts()` | Cost items + material records | 108 cost items + 8 materials | Cost catalogue |

**Verdict:** These are **reference/operational data**, not demo data. Keep them.

### Manually Triggered (via /labs/seed page)
These require clicking a button and are **demo/fake data** (MUST CLEAR):

| Seed Function | File | Data Created |
|--------------|------|-------------|
| `seedCustomers()` | `lib/seed/seedData.ts` | 3 fake customers (Sarah Mitchell, Mike Cole, Tom Bradley) |
| `seedProjects()` | `lib/seed/seedData.ts` | 3 fake projects ($14,200 / $9,800 / $6,400) |
| `seedLineItems()` | `lib/seed/seedData.ts` | 24 fake line items |
| `seedTasks()` | `lib/seed/seedData.ts` | 18 fake tasks |
| `seedActivityEvents()` | `lib/seed/seedData.ts` | 30+ fake activity events |
| `seedLeads()` | `lib/seed/seedData.ts` | 4 fake leads (David Park, Amanda Torres, Mike Chen, Sarah Mitchell) |
| `seedInteriorsDemo()` | `lib/seed/interiorsData.ts` | 5 customers, 7 projects (Margaret Arsenault, Kevin Bourque, etc.) |
| `seedAllLabsData()` | `lib/data/seedAll.ts` | 2 crew members, 1 workflow, labs catalogs |
| `seedSampleRooms()` | `lib/data/seed/sample-rooms.seed.ts` | 2 rooms (Living Room, Primary Bedroom) |
| `seedSampleSelections()` | `lib/data/seed/sample-selections.seed.ts` | 6 material selections |
| `seedRevealGauges()` | `lib/data/seed/reveal-gauges.seed.ts` | 4 reveal gauges (localStorage) |

**Verdict:** If any of these were triggered during development, the fake data is sitting in IndexedDB and will sync to Supabase. **Must clear from both IndexedDB and sync_data.**

### Hardcoded Demo Data in seedAll.ts (line 40-60)
```
crew_nathan: Nathan Montgomery, Owner/Supervisor, wageRate: 45, chargedRate: 95
crew_nishant: Nishant, Flooring Specialist, wageRate: 28, chargedRate: 55
```
**Verdict:** These crew records are **real people** but with potentially outdated rates. Review with Nathan before launch.

---

## 5. Navigation Audit

### Sidebar Navigation Issues

The sidebar has **12 items** across 4 sections. Several point to routes that are redirect stubs:

| Sidebar Item | href | Destination | Issue |
|-------------|------|-------------|-------|
| Dashboard | `/dashboard` | Real page | OK |
| Jobs | `/jobs` | **Redirect** to `/production/jobs` | Should link directly to `/production/jobs` |
| Pipeline | `/pipeline` | **Redirect** to `/leads` | Should link directly to `/leads` or be renamed |
| Sales | `/sales` | Real page | OK |
| Site Visits | `/production/site-visits` | **Redirect** to `/production` | Should link to a real page or be removed |
| Estimates | `/production/estimates` | **Redirect** to `/estimates` | Should link directly to `/estimates` |
| Contracts | `/production/contracts` | **Redirect** to `/production` | Should link to a real page or be removed |
| Materials | `/production/materials` | **Redirect** to `/production` | Should link to a real page or be removed |
| Punch Lists | `/production/punch-lists` | **Redirect** to `/production` | Should link to a real page or be removed |
| Cost Items | `/catalogue` | Real page | OK |
| Labs | `/labs` | Real page | OK |
| Settings | `/admin/settings` | Real page | OK |

**Problems:**
1. **8 of 12 sidebar items** go through unnecessary redirects or point to consolidated pages
2. The sidebar structure doesn't match the app-foundation spec (should have Sales, Production, Finance, Standards, Labs, Admin, Customers sections)
3. Badge counts are hardcoded: Jobs = 3, Punch Lists = 2

### Bottom Nav (Mobile)
| Item | href | Status |
|------|------|--------|
| Home | `/` | OK |
| Sales | `/sales` | OK |
| Production | `/production` | OK |
| Finance | `/finance` | OK |
| Labs | `/labs` | OK |

**Bottom nav is clean.** Center "+" button for quick-add is handled separately.

### Missing from Sidebar (per app-foundation spec)
- **Standards** section (exists as pages but not in sidebar)
- **Customers** section (exists as page but not in sidebar)
- **Finance** section (exists as page but not in sidebar)
- **Schedule** (exists as page but not in sidebar)

---

## 6. Hardcoded Values & Wiring Gaps

### Hardcoded Badge Counts
| Location | Item | Value | Should Be |
|----------|------|-------|-----------|
| Sidebar.tsx:94 | Jobs badge | `3` (green) | Active jobs count from IndexedDB |
| Sidebar.tsx:96 | Punch Lists badge | `2` (amber) | Pending punch items count |

### Hardcoded Stats
| Location | Stat | Value | Should Be |
|----------|------|-------|-----------|
| dashboard/page.tsx:347 | Avg Job Margin | `'35%'` | Computed from project budgets |
| page.tsx:250 | Revenue MTD | `'--'` | From forecast actuals |
| page.tsx:251 | Forecast | `'--'` | From forecast data |
| finance/page.tsx:85-86 | Revenue MTD | `"--"` | From `useFinancialActuals` |
| finance/page.tsx:89-90 | Gross Margin | `"--"` | Computed from actuals |
| projects/[id]/[category]:84 | Health score | `72` | From loop/task data |
| projects/[id]/[category]:90-94 | Child scores | `85, 60, 45, 90` | From loop data |

---

## 7. Design Consistency Audit

### Color System Issues

**Problem:** ~2,774 instances of hardcoded hex colors across 80+ files. The design system defines CSS custom properties but many components (especially older ones) use raw hex values.

**Most common offenders (should map to CSS vars):**
| Hardcoded Color | Occurrences | Should Be |
|----------------|-------------|-----------|
| `#F3F4F6` | 100+ | `var(--bg)` |
| `#FFFFFF` | 200+ | `var(--surface-1)` |
| `#E5E7EB` | 80+ | `var(--border)` |
| `#111827` / `#1a1a1a` | 60+ | `var(--text-1)` |
| `#6B7280` | 50+ | `var(--text-2)` |
| `#9CA3AF` | 40+ | `var(--text-3)` |
| `#0F766E` (teal) | 30+ | Not in design system (legacy accent) |
| `#374151` | 20+ | `var(--text-2)` |

**Worst affected areas:**
1. Activity components (QuickAddMenu, ThreeAxisFilters, ActivityFeed, PendingSyncSheet)
2. Intake components (IntakeWizard, ContractorIntakeWizard, RoomScopeBuilder, RoomDetailPanel)
3. Estimate components (EstimateFilterBar, EstimateGroupSection)
4. Discovery components (DiscoverySummaryPDF, CustomerSummarySheet)
5. Crew components (CrewSelector, CrewGate)
6. Schedule components (DayColumn, TaskDetailSheet)

**Tailwind gray/slate classes:** 116+ instances of `text-gray-*`, `bg-gray-*`, `text-slate-*`, `bg-slate-*`, `bg-white` that should use CSS variables.

### Teal vs Clay Accent Issue
The design system uses `--clay: #A07355` as the primary accent, but many components still use teal `#0F766E` from an older design iteration. This creates visual inconsistency.

### PDF Components (Exception)
PDF renderers (QuotePDF, ContractPDF, InvoicePDF, HomeCareSheetPDF, TrimCutListPDF, DiscoverySummaryPDF) use hardcoded colors by necessity — `@react-pdf/renderer` doesn't support CSS variables. These are acceptable.

### Font Inconsistencies
- Most pages correctly use CSS variable fonts
- Some components still reference `'Inter', sans-serif` (legacy)
- Login page correctly uses DM Mono + Figtree

---

## 8. Data Flow Audit

### Intake Form -> Leads Pipeline
```
Landing page (/interiors/intake)
  -> POST /api/intake (server-side, service role key)
  -> sync_data table (org_id set correctly)
  -> SyncEngine pulls on app load
  -> IndexedDB: intake_leads + customers stores
  -> /leads page reads from customers store
```
**Status:** FIXED (this session). Working correctly.

### Auth Flow
```
/login -> Supabase signInWithPassword
  -> AuthContext sets user + profile
  -> ProtectedRoute checks auth + permissions
  -> usePermissions filters sidebar/bottom nav
```
**Status:** Working. 5-second timeout added for resilience.

### Sync Flow
```
App mutation -> IndexedDB write
  -> SyncQueue (pending changes)
  -> SyncEngine.push() -> sync_data table (with org_id)
  -> SyncEngine.pull() -> other devices get changes
```
**Status:** Working. RLS scoped by org_id via get_user_org_id().

### Seed Data Flow (RISK)
```
/labs/seed page (accessible in prod!)
  -> seedCustomers/Projects/etc.
  -> IndexedDB writes
  -> SyncEngine pushes to sync_data
  -> Other devices receive fake data
```
**Status:** RISK. Should be gated by NODE_ENV or removed.

---

## 9. Critical Issues (Must Fix Before Launch)

### P0 — Blockers

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | **Seed page accessible in production** | Anyone who navigates to `/labs/seed` can nuke the database or load fake data | Gate with `process.env.NODE_ENV === 'development'` check, or remove the page |
| 2 | **Clear demo data from Supabase** | If seeds were ever triggered, fake customers/projects are in sync_data | Run cleanup query against sync_data for known seed IDs |
| 3 | **Sidebar links to redirect stubs** | 8 of 12 sidebar items go through unnecessary redirects, adding latency | Update hrefs to point directly to real pages |
| 4 | **Hardcoded badge counts** | Jobs shows "3", Punch Lists shows "2" — fake numbers | Wire to real IndexedDB counts or remove badges |
| 5 | **Hardcoded stats on dashboards** | Avg Margin "35%", Revenue/Forecast "--" look broken | Wire to real data or show "No data" gracefully |

### P1 — Should Fix

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 6 | **Teal accent color (#0F766E)** | ~30 components use teal instead of clay (#A07355) | Replace with `var(--clay)` or add `--teal` to design system |
| 7 | **Hardcoded hex colors** | Dark mode breaks, design inconsistency | Replace with CSS variables (batch by component family) |
| 8 | **Tailwind gray/slate classes** | Same dark mode issue | Replace with CSS variable equivalents |
| 9 | **Missing sidebar sections** | Standards, Customers, Finance not in sidebar | Update sidebar to match app-foundation spec |
| 10 | **Change Orders page is a stub** | "/production/change-orders" shows "Coming Soon" | Either build it or remove from nav |

---

## 10. Recommended Improvements (Post-Launch OK)

| # | Improvement | Effort | Impact |
|---|------------|--------|--------|
| 1 | Remove all 21 redirect stubs (update any remaining links) | Low | Cleaner routing |
| 2 | Remove legacy pages (/projects/[id]/[category], /jobs/[id]) if unused | Low | Less confusion |
| 3 | Remove worker-spike dev page | Trivial | Cleanup |
| 4 | Consolidate Labs pages (26 pages — likely too many for launch) | Medium | Simpler UX |
| 5 | Wire Finance dashboard to real data | Medium | Functional finance view |
| 6 | Add Supabase Realtime for live sync instead of pull-based | Medium | Better multi-device |
| 7 | Migrate remaining Tailwind colors to CSS vars across all components | High | Full dark mode support |

---

## 11. Implementation Plan

### Phase 1: Critical Cleanup (Estimated: 1-2 sessions)

**Step 1: Secure the seed page**
- Gate `/labs/seed` with environment check
- Verify no demo data exists in production sync_data table

**Step 2: Fix sidebar navigation**
- Update sidebar items to point directly to real pages
- Add missing sections (Standards, Customers, Finance, Schedule)
- Remove or consolidate items that point to stubs (Site Visits, Contracts, Materials, Punch Lists)
- Wire badge counts to real data or remove badges

**Step 3: Fix hardcoded dashboard stats**
- Replace hardcoded "35%" margin with computed value
- Replace "--" placeholders with "No data" or real hooks
- Remove hardcoded health scores in project category pages

**Step 4: Clear demo data**
- Query sync_data for records with `device_id = 'intake_form'` or known seed IDs
- Delete fake customer/project/lead records
- Clear IndexedDB on production devices

### Phase 2: Design Consistency (Estimated: 2-3 sessions)

**Step 5: Resolve teal vs clay accent**
- Decision needed: keep teal for specific contexts or replace everywhere with clay?
- Update components accordingly

**Step 6: Migrate hardcoded colors to CSS variables**
- Priority order by component family:
  1. Activity components (most affected)
  2. Intake components
  3. Estimate components
  4. Discovery components
  5. Crew/Schedule components
  6. Labs components
  7. Remaining one-offs

**Step 7: Replace Tailwind gray/slate with CSS vars**
- Create Tailwind config aliases for CSS variables if not already done
- Batch replace across affected files

### Phase 3: Polish & Edge Cases (Estimated: 1 session)

**Step 8: Remove placeholder pages**
- Either build Change Orders or remove the link
- Remove worker-spike page

**Step 9: Clean up redirect stubs**
- Verify no external links point to old routes
- Remove unnecessary redirects (keep a few for bookmarks/SEO)

**Step 10: Final smoke test**
- Walk through every sidebar link
- Verify all data reads from real sources
- Test dark mode on every page
- Test on mobile (bottom nav, touch targets)

---

## Files Referenced

### Critical files to modify:
- `apps/web/src/components/navigation/Sidebar.tsx` — nav items, badge counts
- `apps/web/src/app/dashboard/page.tsx` — hardcoded margin stat
- `apps/web/src/app/page.tsx` — hardcoded revenue/forecast
- `apps/web/src/app/finance/page.tsx` — placeholder dashes
- `apps/web/src/app/labs/seed/page.tsx` — security gate
- `apps/web/src/app/projects/[id]/[category]/page.tsx` — hardcoded health scores

### Seed data files (for reference during cleanup):
- `apps/web/src/lib/seed/seedData.ts`
- `apps/web/src/lib/seed/interiorsData.ts`
- `apps/web/src/lib/seed/costItems.seed.ts`
- `apps/web/src/lib/seed/materialRecords.seed.ts`
- `apps/web/src/lib/data/seedAll.ts`
- `apps/web/src/lib/data/seed/*.ts`

### Design system source of truth:
- `apps/web/src/app/globals.css` — all CSS custom properties
- `apps/web/public/interiors-landing.html` — reference palette

---

## Appendix A: Full Seed Data Inventory

| File | Records | Type | Auto-Load? |
|------|---------|------|-----------|
| `seedData.ts` | 3 customers, 3 projects, 24 line items, 18 tasks, 30 events, 4 leads | Demo | Manual (/labs/seed) |
| `interiorsData.ts` | 5 customers, 7 projects, consultations, tasks | Demo | Manual (/labs/seed) |
| `costItems.seed.ts` | 108 cost items (GEN/FLR/PNT/TRM/ACC) | Reference | Auto (migration) |
| `materialRecords.seed.ts` | 8 material records | Reference | Auto (migration) |
| `seedAll.ts` | 2 crew, 1 workflow | Mixed | Manual |
| `estimatingCatalogSeed.ts` | 27 materials, 10 labor items | Reference | Auto |
| `catalog-products.seed.ts` | 12 products (3 tiers x 4 categories) | Reference | Auto |
| `assembly-config.seed.ts` | 1 millwork assembly config | Reference | Auto |
| `sample-rooms.seed.ts` | 2 rooms | Demo | Manual |
| `sample-selections.seed.ts` | 6 material selections | Demo | Manual |
| `reveal-gauges.seed.ts` | 4 reveal gauges | Reference | Auto |
| `tg-flr-001.json` | 1 training guide (1,954 lines) | Reference | Auto |
| `tg-pnt-001.json` | 1 training guide (1,798 lines) | Reference | Auto |
| `tg-trm-001.json` | 1 training guide (1,652 lines) | Reference | Auto |
| `sop-data-flr.json` | 1 SOP (2,128 lines) | Reference | Auto |
| `sop-data-pnt.json` | 1 SOP (2,008 lines) | Reference | Auto |
| `sop-data-trm.json` | 1 SOP (2,210 lines) | Reference | Auto |

## Appendix B: Sidebar vs App-Foundation Spec Comparison

**App-Foundation Spec says sidebar should have:**
| Section | Items |
|---------|-------|
| Sales | Dashboard, Leads, Estimates, Consultations, Quotes, Customers |
| Production | Dashboard, Jobs, Schedule, Crew, Change Orders, Customers |
| Finance | Dashboard, Invoices, Cost Catalogue, Forecast |
| Standards | Dashboard, SOPs, Training, Knowledge Base |
| Labs | Dashboard, Tests, Voting, Tokens |
| Admin | Profile, Crew, Settings |
| Customers | Standalone platform-level module |

**Current sidebar has:**
| Section | Items |
|---------|-------|
| Main | Dashboard, Jobs, Pipeline, Sales |
| Production | Site Visits, Estimates, Contracts, Materials, Punch Lists |
| Catalogue | Cost Items |
| Hooomz | Labs, Settings |

**Gap:** The current sidebar is significantly different from the spec. It's missing entire sections and has items that don't match.
