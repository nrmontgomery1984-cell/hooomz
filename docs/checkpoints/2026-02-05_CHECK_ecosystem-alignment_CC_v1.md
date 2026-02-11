# Ecosystem Alignment Check — Claude Code (Independent)
**Date:** 2026-02-05
**Agent:** Claude Code (Opus 4.6)
**Method:** Filled independently from codebase knowledge and conversation history. No reference to Claude.ai's version.

---

## 1. Business Identity

**What is Hooomz?**
Hooomz is a trades-based renovation company and technology ecosystem founded by Nathan Montgomery, a Red Seal Journeyman Carpenter with 22 years of experience, based in Moncton, New Brunswick, Canada.

The currently active division — **Hooomz Interiors** — performs interior renovation work: flooring installation, finish carpentry (trim, baseboard, casing, crown), painting, tile, and drywall. It is NOT an interior design firm. It physically installs materials.

**Who runs it:**
- **Nathan Montgomery** — Owner. Red Seal carpenter. Does estimates, complex work, quality control. 22 years in the trade.
- **Nishant** — Operator. Learning tiered skill progression. Handles Tier 1 installation work (e.g., LVP/LVT flooring, basic paint, straightforward trim).

**Business model:**
- Bundle-based pricing for residential renovations
- Smart estimating that learns from completed projects
- Target: homeowners wanting interior refresh/renovation
- Currency: CAD
- Construction type: Residential wood-frame only

---

## 2. Ecosystem Map

Hooomz is not just Interiors — it's a multi-division ecosystem:

| Division | Brand | Status | What it does |
|----------|-------|--------|--------------|
| **Interiors** | Hooomz | ACTIVE BUILD | Flooring, trim, paint, tile, drywall installation |
| **Exteriors** | Brisso | Future | Exterior renovation work (scope TBD) |
| **Maintenance** | (TBD) | Future | Ongoing property maintenance |
| **Vision** | (TBD) | Future | Purpose unclear to CC — possibly design/planning/visualization? |
| **DIY** | (TBD) | Future | DIY guidance/support for homeowners? |
| **Labs** | Hooomz Labs | Conceptual | Independent materials testing arm |
| **OS** | Hooomz OS | Conceptual | Operating system layer connecting all divisions |

**Hooomz Labs:**
- ATK-style methodology (America's Test Kitchen approach — rigorous, independent testing)
- Trust engine: builds credibility through transparent, unbiased materials testing
- Content flywheel: testing results feed content that drives traffic to all divisions
- Independent from the trades work — tests materials regardless of what Hooomz installs

**How divisions relate:**
- Labs feeds trust/content to all divisions
- OS provides shared infrastructure (likely: auth, customer data, activity logging, estimating engine)
- Each division handles a different scope of work on the same properties
- Interiors is the first to market — proving the model before expanding

---

## 3. Technical Architecture

**Stack:**
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- State: Zustand
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Package manager: pnpm (monorepo)
- Auth: Magic links for clients
- Offline: Basic caching only (not critical path)
- Sphere renderer: SVG-only first (WebGL later)
- Partial imports: Supported

**Monorepo structure** (`C:\Users\Nathan\hooomz\`):

| Package | Purpose |
|---------|---------|
| `shared-contracts` | Types, schemas, constants, utilities shared across all packages |
| `shared` | Additional shared code (event grouping, visibility defaults) |
| `core` | Core business logic — projects, loops, home profiles, completion tracking |
| `estimating` | Estimate builder, catalog, calculations, learning engine |
| `database` | Supabase client, migrations, schema |
| `api` | Express API routes, middleware, service factories, mock data |
| `customers` | Customer/property management, portal services |
| `field-docs` | Photos, inspections, field notes, document management |
| `reporting` | Dashboards, metrics, exports |
| `scheduling` | Tasks, calendar, dependencies |

**Web app** (`apps/web/`): Next.js 14 app with pages for portfolio, projects, activity feed, estimates, intake, profile, and property activity.

**Data flow:**
1. User action in web app
2. Service layer processes the action
3. Activity event written (THE SPINE)
4. Data persisted to IndexedDB (offline-first)
5. SyncQueue pushes to Supabase when online
6. All views/dashboards derive from activity events + entity state

---

## 4. Data Model

**Work Categories (Interiors):**

| Code | Name | Icon |
|------|------|------|
| FL | Flooring | Wood emoji |
| FC | Finish Carpentry | Ruler emoji |
| PT | Paint | Palette emoji |
| TL | Tile | Square emoji |
| DW | Drywall | Brick emoji |
| OH | Overhead | Gear emoji |

**Stages:**

| Code | Name | Phase |
|------|------|-------|
| ST-DM | Demo | Tear out existing |
| ST-PR | Prime & Prep | Surface preparation |
| ST-FN | Finish | Installation / application |
| ST-PL | Punch List | Touch-ups and fixes |
| ST-CL | Closeout | Final walkthrough, handoff |

**Three-Axis Model:**
- **Axis 1 — Work Category (WHAT):** FL, FC, PT, TL, DW, OH
- **Axis 2 — Trade (WHO):** Which person/crew is doing the work (Nathan, Nishant, sub)
- **Axis 3 — Stage (WHEN):** ST-DM, ST-PR, ST-FN, ST-PL, ST-CL

Same task appears in all three views — orthogonal filtering. A fourth implicit axis is **Location (WHERE):** Kitchen, Master Bath, Living Room, etc.

**Activity Events:**
- Immutable, append-only
- Every event has: `event_type`, `summary`, `entity_type`, `entity_id`, `actor_id`, `actor_type`, `actor_name`, `organization_id`, `project_id`
- Three-axis metadata: `work_category_code`, `trade`, `stage_code`, `location_id`
- Visibility: `homeowner_visible` flag controls what clients see in their portal
- Input method tracking: `manual_entry`, `voice`, `photo`, `system`
- Batch support: `batch_id` for grouped operations

**Loops (Looops):**
- Nested collapsible containers organizing work by phase
- Each loop has a health score (0-100)
- Health rolls up: parent score = aggregate of children scores
- Floor plan elements point TO loops — status comes FROM the loop, never stored on the element
- Rendered as 3D spheres with color-coded health

---

## 5. UI/UX Philosophy

**Design language:** "Pixar meets Google Material" — warm, approachable, professional.

**Looops Visual Language:**
- Projects rendered as spheres with health scores
- Color indicates health: green (>=90), teal (>=70), amber (>=50), orange (>=30), red (<30)
- SVG-based rendering (WebGL upgrade planned)
- Drill-down: Portfolio sphere -> Project sphere -> Category spheres -> Location spheres
- BreadcrumbSpheres for navigation context

**Mobile-first design principles:**
- Designed for dirty hands — work gloves, outdoor conditions
- 44px minimum touch targets (per Apple HIG)
- One-thumb operation — minimal typing
- Progressive disclosure — don't overwhelm
- Voice input support (VoiceNoteButton component exists)
- Bottom sheets for selection on mobile (ThreeAxisFilters)

**Color system:**
- Status: not_started=#9CA3AF (grey), in_progress=#3B82F6 (blue), blocked=#EF4444 (red), complete=#10B981 (green)
- Scores: >=90 green, >=70 teal, >=50 amber, >=30 orange, <30 red
- Brand: cream background, coral accents, teal/slate for text

**Key UI components:**
- `Sphere` — health score visualization
- `LoopVisualization` — parent/child sphere drill-down
- `BreadcrumbSpheres` — navigation breadcrumbs as mini spheres
- `WidgetCard` — stat display cards
- `ConfidenceBadge` — estimate confidence indicator
- `ActivityFeed` / `ProjectActivityFeed` — scrollable event timeline
- `ThreeAxisFilters` — filter controls for Work Category / Stage / Location
- `IntakeWizard` / `ContractorIntakeWizard` — multi-step onboarding forms
- `VoiceNoteButton` — voice input for field notes

---

## 6. Current Build State

**Branch:** `feature/lifecycle-platform`
**Commits:** 2 commits on this branch (`ae64f85` initial, `fba2d5e` runtime fixes) + uncommitted changes

**What's built and working:**
- Full monorepo structure with all 10 packages compiling
- Activity logging system (repository, service, hooks, routes)
- IndexedDB storage adapter with SyncQueue
- Intake wizards (homeowner + contractor)
- Portfolio/Project/Category/Location drill-down pages
- Activity feed with three-axis filtering
- Estimate builder page
- Profile page
- Voice note button (UI only)
- SVG sphere visualization components
- Breadcrumb navigation

**What's placeholder/stub:**
- `/add` page — exists but minimal
- Supabase connection — mock data only, no live database
- Auth — no real authentication flow yet
- Photo upload — UI exists, no backend
- Scheduling/calendar — package exists, no UI integration
- Reporting — package exists, no UI integration
- Revit integration — not connected to this codebase at all

**Build status:** PASSES (0 errors, ~59s)
**Typecheck status:** PASSES (0 errors, all 11 packages)

---

## 7. 5-Prompt Sequence Status

| # | Prompt | Status | Details |
|---|--------|--------|---------|
| 1 | Activity Logging | DONE | ActivityService, ActivityRepository, mutation hooks, event types, three-axis metadata |
| 2 | Data Persistence | DONE | IndexedDB adapter, SyncQueue, repositories, Step 2 Interiors scoping cleanup complete |
| 3 | /add Page | PENDING | Placeholder page exists at `/add`. Not yet built out. |
| 4 | Core Flow | PENDING | Not started |
| 5 | Auth/Field Docs | PENDING | Not started |

**Step 2 Systematic Fixes (sub-task of Prompt 2):**
- Fixed 23 type errors in packages/api (ActivityEvent type drift)
- Cleaned ContractorIntakeWizard scope items (80 -> 32 Interiors-only)
- Fixed IntakeWizard ConditionsStep (structural -> surface assessments)
- Fixed category page icons to Interiors trades
- Updated all comments and tests from old trades to Interiors
- Scrubbed Henderson Contracting -> Hooomz

---

## 8. Business Logic

**Bundle Strategy:**

| Bundle | Price (CAD) | What's included |
|--------|-------------|-----------------|
| Floor Refresh | ~$5,400 | Flooring only (LVP/hardwood + transitions + removal) |
| Room Refresh | ~$8,200 | Flooring + Paint + Basic Trim |
| Full Interior | ~$11,800 | Flooring + Paint + Full Trim + Tile (if applicable) + Drywall repair |

**Estimate -> Budget Conversion:**
- Estimates start as customer-facing quotes
- When approved, they convert to internal budgets
- Budget uses crew wage rates (not customer markup)
- Difference = margin
- Smart Estimating learns from actuals vs. estimates over time

**Crew Model:**
- Nathan: Owner. Does estimates, complex finish carpentry, quality inspections. Sets the standard.
- Nishant: Operator. Tier 1 installation — LVP/LVT flooring, basic painting, straightforward trim runs. Learning progression toward Tier 2.
- Potential subs for specialized work (tile, drywall mudding)

**Pricing:**
- Per-unit pricing in SCOPE_ITEM_COSTS (e.g., LVP install = $X/sqft)
- Material + labor bundled
- OH (Overhead) category captures project management, permits, disposal, etc.

---

## 9. Gaps & Uncertainties (HONEST ASSESSMENT)

This is the most valuable section. Here's what Claude Code does NOT know or is uncertain about:

### High Confidence Gaps (I know I don't know these)

1. **Supabase schema:** No migration files found in `packages/database/`. I don't know the actual table structure, RLS policies, or indexes. The codebase uses mock data only.

2. **Brisso (Exteriors):** I know the brand name and that it exists. I don't know scope, timeline, target services, or how it shares infrastructure with Interiors.

3. **Vision division:** I have no information on what this is. Design visualization? Future planning? AR/VR? Complete gap.

4. **DIY division:** I know it exists. I don't know if it's content-only, a product, an app, or a community platform.

5. **Hooomz OS:** I understand the concept (shared infrastructure layer) but don't know what it concretely includes beyond what's already in the monorepo.

6. **Labs methodology details:** I know "ATK-style" and "trust engine" and "content flywheel." I don't know: what materials get tested, how testing is structured, what the output format is, where content gets published, or how it technically feeds into the app.

7. **Revit pipeline connection:** The old project at `C:\Users\Nathan\Desktop\Hooomz\` has Revit integration. I don't know if/how that connects to the current monorepo, or if it's been abandoned.

8. **Nishant's exact role boundaries:** I know Tier 1 installation and "learning progression." I don't know: what defines Tier 1 vs 2 vs 3, what the progression milestones are, or whether Nishant has app access/permissions.

9. **Real pricing data:** SCOPE_ITEM_COSTS has placeholder unit prices. I don't know Nathan's actual rates.

10. **Customer acquisition:** How does Hooomz get customers? Home shows? Referrals? Online? The old project had "Home Show" context but the current app doesn't reference this.

### Medium Confidence Gaps (I might be wrong about these)

11. **Overhead (OH) category scope:** I've defined it as project management, permits, disposal. This might be wrong — it could include travel, tool rental, or other items.

12. **Stage definitions:** I've used Demo, Prime & Prep, Finish, Punch List, Closeout. The "Prime & Prep" stage might be more nuanced than I understand — for paint it's literal priming, for flooring it's leveling/underlayment, for trim it's measuring/cutting.

13. **Property vs. Project relationship:** I believe one property can have multiple projects (e.g., "Kitchen Refresh 2025" and "Basement Reno 2026" on the same house). But I'm not 100% sure this is the intended model.

14. **Homeowner portal scope:** There's a portal route and homeowner_visible flags. I don't know how much visibility customers are meant to have — just progress updates? Photos? Estimates? Full activity feed?

### Low Confidence (I'm probably wrong or making assumptions)

15. **Looops Watch app relationship:** Found `C:\Users\Nathan\AndroidStudioProjects\Looops_wear` — a Wear OS smartwatch app. I don't know if this is related to Hooomz or a separate project.

16. **Multi-organization support:** The codebase has `organization_id` everywhere, suggesting multi-tenant design. But Hooomz might be single-org initially. I don't know the intent.

---

## 10. Naming & Conventions

**Code patterns:**
- Work category codes: 2-letter uppercase (`FL`, `FC`, `PT`, `TL`, `DW`, `OH`)
- Stage codes: `ST-` prefix + 2-letter code (`ST-DM`, `ST-PR`, `ST-FN`, `ST-PL`, `ST-CL`)
- Entity IDs: prefix + UUID or sequential (`proj_123`, `task_456`, `evt_001`)
- Event types: dot-separated (`task.completed`, `photo.uploaded`, `estimate.approved`)
- Actor types: `team_member`, `system`, `customer`

**File naming (code):**
- kebab-case for files: `activity.repository.ts`, `loop.service.ts`
- PascalCase for React components: `ProjectActivityFeed.tsx`, `ThreeAxisFilters.tsx`
- barrel exports via `index.ts`

**Document naming (governance):**
```
YYYY-MM-DD_TYPE_description_vN.md
```
- Types: `CHECK`, `BRIEF`, `PROTO`, `SPEC`, `PLAN`
- Agent suffixes: `_CC_` (Claude Code), `_CA_` (Claude.ai)
- Versions: `v0.x` = draft, `v1` = approved

**Locked decisions (DO NOT CHANGE):**

| Decision | Choice |
|----------|--------|
| Sphere renderer | SVG-only first (WebGL later) |
| State management | Zustand |
| Backend | Supabase |
| Styling | Tailwind CSS |
| Offline | Not critical — basic caching only |
| Client auth | Magic links |
| Partial imports | Supported |
| Currency | CAD |
| Construction type | Residential wood-frame only |

---

*Generated independently by Claude Code (Opus 4.6) on 2026-02-05*
*No reference to Claude.ai's version was made during creation*
