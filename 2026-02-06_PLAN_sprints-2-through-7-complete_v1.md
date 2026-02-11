# HOOOMZ — COMPLETE SPRINT HANDOFFS (2-7)
## Sprint 1 already delivered separately (2026-02-06_PLAN_prompt3-add-page_v1.md)
## February 6, 2026

---
---

# SPRINT 2: ESTIMATE BUILDER
## Timeline: Feb 10-13
**Depends on:** Sprint 1 (projects exist, tasks exist, health scores work)

---

## WHAT THIS IS

The estimate is how Nathan makes money. A homeowner asks "how much to redo my floors?" and Nathan sends a clean Good/Better/Best estimate within 24 hours. That speed + professionalism wins the job.

---

## WHAT TO BUILD

### 1. Estimate Creation Flow

**Trigger:** From a project page → "Create Estimate" button, or from Estimates list → "New Estimate."

**Steps:**
1. Select project (or auto-populated from intake)
2. Select scope categories (FL, PT, FC, TL, DW — from project)
3. Line items auto-populate from SCOPE_ITEM_COSTS catalog based on selected categories + room measurements
4. Three tiers generated automatically (Good/Better/Best)
5. Nathan reviews and adjusts quantities, prices, product names per tier
6. Save as draft or Send to client

### 2. Good/Better/Best Tier System

Each estimate generates THREE tiers from the catalog:

| Tier | Logic | Example (Flooring 1,200 sqft) |
|------|-------|----|
| Good | Lowest-cost product, standard labor | Budget LVP $2.49/sqft = $2,988 |
| Better | Mid-range product, upgraded labor | Premium LVP $3.80/sqft = $4,560 |
| Best | Top-tier product, premium finish | Shaw Distinction $5.20/sqft = $6,240 |

Each catalog item needs `tier: 'good' | 'better' | 'best'` and per-unit pricing.

**RECOMMENDED badge:** Better tier gets a subtle "RECOMMENDED" label in gray small caps. This is the anchor.

### 3. Line Items — Grouped by Loop

Same rollup pattern as task view:

```
FLOORING                                    $6,400
  Premium LVP — Shaw         1,200 sqft × $3.80    $4,560
  Removal — carpet            1,200 sqft × $0.75      $900
  Transitions                 Allowance                $940

BASEBOARDS                                  $1,600
  Primed MDF 5.25"           340 lnft × $3.50       $1,190
  Install + paint             340 lnft × $1.20         $410

PAINT                                       $2,400
  BM Regal Select            3 rooms                 $1,080
  Prep                       3 rooms                   $720
  Application — 2 coats      3 rooms                   $600
```

### 4. Calculations

- Line item total = quantity × unit_price
- Loop subtotal = sum of items in that category
- Tier subtotal = sum of all loops
- HST = subtotal × 0.15 (New Brunswick)
- Total = subtotal + HST
- Currency: CAD always

### 5. Estimate → Budget Conversion (Internal Only)

When client approves, auto-generate internal budget:
- `customer_total`: what client pays
- `internal_cost`: materials at cost + crew wages × hours
- `margin`: customer_total - internal_cost
- Never visible to client. Dashboard and reports only.

### 6. PDF Export

Clean PDF matching design language:
- Hooomz logo (or licensee logo from theme)
- Client name, address, date
- Estimate number: `HI-EST-2602-001`
- Three tiers with line items
- Subtotal, HST, Total per tier
- "Valid for 30 days" footer

Use `@react-pdf/renderer` or `jspdf`. If PDF is problematic, fall back to print-optimized HTML with `@media print` styles.

### 7. Shareable Client Link

"Send to Client" → generates unique URL: `/estimates/{uuid}`
- No auth required (public with unguessable ID)
- Client sees all three tiers
- Client taps "Accept" on chosen tier
- Creates `estimate.approved` activity event
- Nathan gets notified

### 8. Estimate List Page

`/estimates` — all estimates with status:
- Draft (gray dot), Sent (blue), Viewed (amber), Approved (green), Declined (red)
- Each row: client name, project, tier range ($7,800–$13,700), status, date

---

## ACCEPTANCE CRITERIA

- [ ] Create estimate from project
- [ ] Three tiers auto-generated from catalog
- [ ] Line items grouped by trade loop with subtotals
- [ ] HST 15% calculated correctly
- [ ] PDF export matches design language
- [ ] Shareable link — client views without auth
- [ ] Client can accept a tier (creates activity event)
- [ ] Estimate → Budget conversion (internal)
- [ ] Estimate list page with status dots
- [ ] All theme tokens used (no hardcoded colors)
- [ ] Build passes, 0 errors

---
---

# SPRINT 3: AUTH + CLIENT PORTAL
## Timeline: Feb 14-17
**Depends on:** Sprint 2 (estimates exist, shareable links work)

---

## WHAT THIS IS

The login system and the homeowner's view. Auth is infrastructure. The client portal is the reason the infrastructure exists.

---

## WHAT TO BUILD

### 1. Supabase Auth — Magic Links

No passwords. Email magic links only.

**Setup:**
- Supabase Auth email provider
- Branded email template (Hooomz logo, single button)
- Redirect: `/portal` for clients, `/` for team

### 2. Three Roles

| Role | Who | Sees | Can't See |
|------|-----|------|----|
| `owner` | Nathan | Everything | Nothing hidden |
| `operator` | Nishant, Danovan | Assigned projects, their time logs, Quick Add | Estimates, budgets, settings, other projects |
| `client` | Homeowners | Their project, filtered activity, photos, estimate | Internal notes, time logs, receipts, blocked items |

**Implementation:**
- Role in `profiles` table
- RLS policies on every table enforce access
- Client sees only `homeowner_visible = true` activity events

### 3. Route Protection

```
/                         → owner, operator
/activity                 → owner, operator
/add                      → owner, operator
/projects/*               → owner, operator (filtered by assignment for operator)
/estimates/new            → owner only
/estimates/[id]/view      → public (shareable link)
/time                     → owner, operator
/schedule                 → owner, operator
/notifications            → owner, operator
/reports                  → owner only
/settings                 → owner only

/portal                   → client
/portal/[project]/care    → client

/login                    → public
```

### 4. Client Portal (`/portal/{project_id}`)

**Screen 8 from mockups. What the homeowner sees:**

**Project summary:** name, address, large health score number (green/amber/red), status text

**Progress:** Loop rollup headers ONLY — Flooring 2/5, Baseboards 0/3, Paint 0/3. No individual tasks. The client sees trade-level, not task-level.

**Recent updates:** Activity feed filtered by `homeowner_visible = true`. Shows: task completions, photos, milestones. Hides: internal notes, time logs, blocked items, receipts.

**Photos:** Horizontal scroll of project photos.

**Estimate:** Shows sent estimate. If not approved → "Select your package" CTA. If approved → confirmation.

**Team:** Names and roles. "Message your team" button → creates `client.request` activity event.

### 5. Visibility Defaults

| Event Type | Homeowner Visible |
|------------|-------------------|
| task.completed | ✅ Yes |
| task.started | ✅ Yes |
| photo.uploaded | ✅ Yes |
| inspection.passed | ✅ Yes |
| estimate.approved | ✅ Yes |
| client.request | ✅ Yes |
| task.blocked | ❌ No |
| time.logged | ❌ No |
| receipt.captured | ❌ No |
| note.created | ❌ No |
| sub.arrived/departed | ❌ No |
| issue.reported | ❌ No |
| safety.logged | ❌ No |
| weather.delay | ⚠️ Nathan decides per-event |
| inspection.failed | ⚠️ Nathan decides per-event |

### 6. Client Invitation

1. Nathan opens project → taps "Invite Client"
2. Enters client email
3. System sends branded magic link: "View your project →"
4. Client clicks → auto-created account with `client` role, linked to project
5. Client lands on portal

---

## ACCEPTANCE CRITERIA

- [ ] Magic link auth works (email → click → logged in)
- [ ] Three roles enforced via RLS
- [ ] Client portal shows progress, photos, estimate, team
- [ ] Activity feed filtered by homeowner_visible
- [ ] "Message your team" creates activity event
- [ ] "Invite Client" sends magic link
- [ ] Estimate approval works from portal
- [ ] Auth persists across sessions
- [ ] Unauthorized access redirected to login
- [ ] Build passes, 0 errors

---
---

# SPRINT 4: TIME TRACKING + SCHEDULING
## Timeline: Feb 18-20
**Depends on:** Sprint 1 (Quick Add "Time" action), Sprint 3 (operator role)

---

## WHAT TO BUILD

### 1. Active Timer

**The hero feature for field workers.**

- Start from Quick Add "Time" or dedicated button on Time page
- Large monospaced display: `02:34:18`
- Pause / Stop buttons
- Only ONE timer per user at a time
- Timer persists if app closes (store `start_time` in localStorage, recalculate on reopen)
- Stop creates `time.logged` activity event with calculated duration

**Persistent timer bar** (ALL screens while running):
```
⏱ 02:34 · Tile work · LeBlanc  [Pause] [■]
```
Small bar below header. Always accessible. Tap expands to Time page.

### 2. Manual Time Entry

Quick buttons for logging past time (no timer):
`[0.5] [1] [1.5] [2] [3] [4] [6] [8]` hours

Tap preset → select project → optional category → Log. For odd durations, manual hour:minute input.

### 3. Time Page — `/time` (Screen 9)

**Today:**
- Active timer (if running)
- "6.5 hrs logged" with target bar (8 hr default)
- List of today's entries (project, category, duration, status dot)

**This Week:**
- Mon-Fri horizontal bars
- Green ≥ 7 hrs, amber 5-7, gray = no data
- "TODAY" label on current day (teal)

### 4. Timer Data

```typescript
interface TimerState {
  active: boolean;
  project_id: string;
  project_name: string;
  work_category_code?: string;
  start_time: string;
  pause_time?: string;
  accumulated_seconds: number;
}
```

Store in localStorage for persistence. On stop, calculate total duration and create activity event + time entry record.

### 5. Weekly Schedule (Screen 14)

**Vertical day list** (Mon-Fri):

Each day: scheduled tasks with project name, task description, time range, status dots.

**Unscheduled section** below: tasks without dates, sorted by priority. Tappable to assign to a day.

```typescript
interface TaskSchedule {
  task_id: string;
  project_id: string;
  assigned_to: string;
  scheduled_date: string;
  start_time?: string;
  end_time?: string;
}
```

Week navigation (← → arrows). "TODAY" highlighted in teal.

---

## ACCEPTANCE CRITERIA

- [ ] Active timer: start, pause, stop with correct duration
- [ ] Timer persists across app close/reopen
- [ ] Persistent timer bar visible on all screens
- [ ] Manual time entry with presets
- [ ] Time page shows today + weekly bars
- [ ] Schedule view with day list + unscheduled backlog
- [ ] Task assignment to days
- [ ] Build passes, 0 errors

---
---

# SPRINT 5: HOME CARE SHEET + INTAKE POLISH
## Timeline: Feb 21-23
**Depends on:** Sprint 2 (estimate materials data), Sprint 3 (client portal)

---

## WHAT TO BUILD

### 1. Home Care Sheet — Auto-Generation

**Trigger:** Project status → "Complete" auto-generates it. Also manual: "Generate Care Sheet" button.

**Content pulled from project data:**

**Materials Installed:** From approved estimate line items — product name, spec, quantity, installer name (from `task.completed` actor).

**Care Instructions:** Template-based per material type:

| Material | Instructions |
|----------|-------------|
| LVP Flooring | Sweep weekly. Damp mop monthly. No steam mops. Felt pads under furniture. |
| Hardwood | Sweep/vacuum weekly. Damp mop with hardwood cleaner. No standing water. |
| MDF Baseboards | Wipe with damp cloth. Touch-up paint in care kit. |
| Paint (latex) | Washable after 30 days. Touch-up paint included. |
| Tile | Sweep regularly. pH-neutral cleaner. Reseal grout every 12-18 months. |
| Countertops (quartz) | Soap and water. No harsh chemicals. Heat protection required. |
| Cabinets (painted) | Damp cloth. No abrasive cleaners. |

Store templates in a config JSON or lookup table. Editable via Settings → "Home Care Sheet Template."

**Warranty:** Manufacturer warranty per product + "Hooomz 2-Year Workmanship Guarantee." Certificate number from job naming: `HI-2601-001-SMITH`.

**Maintenance Schedule:**
- 6 months: Floor inspection
- 12 months: Full interior check
- **CTA:** "Hooomz Maintenance: $350/yr for ongoing care →" — teal link

### 2. PDF (Screen 7)

- Hooomz logo + "HOME CARE SHEET"
- Property details, completion date
- Four sections with colored dots (green=materials, blue=care, charcoal=warranty, amber=schedule)
- QR code linking to digital version (`qrcode` npm package)
- Letter size (8.5×11), printable

### 3. Digital Version in Portal

`/portal/{project_id}/care` — same content as PDF but interactive:
- Tappable warranty links
- Tappable Maintenance CTA
- Updates if instructions change

### 4. Intake Wizard — End-to-End

Connect the existing intake wizard to real project creation:

**Client fills out:**
1. Contact info (name, email, phone, address) → Customer record
2. Scope selection (Screen 5 grid) → work categories
3. Conditions assessment (Screen 6 pills) → metadata + flags
4. Photos + notes → "before" photos
5. Submit → creates Project (status: `intake`)

**Nathan reviews:**
- Sees intake in notifications/activity feed
- Opens, reviews scope + conditions + photos
- Taps "Create Project" → auto-generates:
  - Tasks based on selected categories (see templates below)
  - Bundle type inferred (Floor Refresh if just flooring, Room Refresh if 2-3 categories, Full Interior if 4+)
  - Conditions affect task generation (Poor → extra prep tasks)
- Status progresses: `intake` → `estimating` → `estimate_sent` → `approved` → `scheduled` → `in_progress` → `complete`

### 5. Task Auto-Generation Templates

**Flooring selected:**
- Remove existing flooring
- Subfloor prep and leveling
- Install flooring (per room)
- Install transitions
- Final clean

**Paint selected:**
- Prep — fill, sand, tape
- Prime (per room)
- Apply — 2 coats (per room)
- Touch-up and clean

**Trim & Baseboards selected:**
- Remove existing
- Measure and cut
- Install
- Caulk and paint
- Touch-up

**Conditions modifiers:**
- "Poor" floor → adds "Level subfloor" and "Repair subfloor damage"
- "Poor" walls → adds "Repair drywall" and "Skim coat"
- "Poor" baseboards → adds "Repair wall behind baseboards"

Store templates in config, not hardcoded in components.

---

## ACCEPTANCE CRITERIA

- [ ] Home Care Sheet auto-generates on project completion
- [ ] Materials, care, warranty, schedule sections populated
- [ ] PDF matches Screen 7 with QR code
- [ ] Digital version in client portal
- [ ] Maintenance CTA present (teal link)
- [ ] Care instruction templates editable in settings
- [ ] Intake wizard creates real project + tasks on submission
- [ ] Task auto-generation from scope selections
- [ ] Conditions affect generated tasks
- [ ] Bundle type auto-inferred
- [ ] Project status lifecycle works end-to-end
- [ ] Build passes, 0 errors

---
---

# SPRINT 6: PHOTOS, RECEIPTS, NOTIFICATIONS
## Timeline: Feb 24-26
**Depends on:** Sprint 1 (Quick Add photo/receipt actions), Sprint 3 (auth + storage access)

---

## WHAT TO BUILD

### 1. Photo Upload to Supabase Storage

**Currently:** metadata only. **After:** real file upload + display.

**Flow:**
1. Camera capture or gallery select
2. Compress: max 1920px wide, 80% JPEG quality
3. Upload to `project-photos/{project_id}/{timestamp}_{uuid}.jpg`
4. Create activity event + photo record with URL

**Phase auto-detection:**
- Project status `intake`/`not_started` → default "before"
- `in_progress` → "during"
- `complete` → "after"
- User can override

### 2. Photo Gallery (Screen 10)

**Grid:** 3 columns, square thumbnails, 2px gap. Before/During/After labels.
**Timeline:** Grouped by date with thumbnail strips.
**Filters:** All | Before | During | After chip selector.
**Full-screen:** Tap photo → full view with caption, timestamp, photographer, room tag. Swipe between.

### 3. Receipt Capture

Quick Add "Receipt" — full implementation:

```
[Project selector]
[Amount — numeric keypad, $X,XXX.XX]
[Vendor — text with autocomplete from previous vendors]
[Photo — camera for receipt image, uploads to receipts/{project_id}/]
[Category — optional pill selector]
[Note — optional]
[Log ✓]
```

### 4. Basic Job Costing

Project page → "Costs" tab:

```
Budget (from estimate):     $10,400
Spent (from receipts):       $3,245
  Flooring materials         $2,800
  Paint materials              $320
  Misc                         $125
Remaining:                   $7,155
```

Color coding: <80% budget = green, 80-100% = amber, >100% = red.

### 5. Notification Inbox (Screen 16)

**Triggers → notifications:**
- `task.blocked` → owner
- `client.request` → owner + assigned operator
- `estimate.approved` → owner
- `inspection.failed` → owner
- `intake.submitted` → owner
- `delivery.received` → assigned operator

**UI:**
- Unread section (charcoal text, dot indicator) above Read section (gray text)
- Status dots per notification type (red=blocked, green=complete, blue=message)
- "Mark all read" teal link
- Tap → navigate to relevant project/event

**Bell icon in header:** All screens. Gray bell + tiny red dot if unread count > 0.

---

## ACCEPTANCE CRITERIA

- [ ] Photos upload to Supabase Storage and display
- [ ] Gallery with grid + timeline views
- [ ] Before/During/After phase tagging
- [ ] Photos visible in client portal
- [ ] Receipt capture with amount, vendor, photo
- [ ] Job costing: receipts vs budget per project
- [ ] Notification inbox with read/unread
- [ ] Bell icon with unread indicator
- [ ] Notifications generated from activity events
- [ ] Build passes, 0 errors

---
---

# SPRINT 7: DASHBOARD, REPORTS, POLISH
## Timeline: Feb 27-Mar 1
**Depends on:** Everything above. Final build sprint.

---

## WHAT TO BUILD

### 1. Desktop Dashboard (Screen 13 — THE Home Show Screen)

**Sidebar (220px):**
- Hooomz logo (colored O's)
- Nav: Dashboard, Activity, Projects, Estimates, Clients, Lab Tests, Settings
- NO icons — just words. Selected: teal left border + charcoal text.
- Bottom: user name, division

**Main content:**

**Stats row** (no cards, just numbers pulling from real data):
- Active Projects: `count(projects where status = in_progress)`
- Tasks This Week: `count(tasks scheduled/completed this week)`
- Hours Logged: `sum(time entries this week)`
- Pipeline: `sum(pending estimate totals)`

**Two columns:**
- Left 58%: Project list (health dots, names, progress bars, status)
- Right 42%: Today's activity (last 6-8 events)

**Below:** Hours this week bar chart (Mon-Fri, charcoal bars).

**Responsive:** Sidebar layout for `lg:` breakpoint. Mobile collapses to portfolio dashboard (Screen 1).

### 2. Basic Reporting (`/reports`)

**Project Summary:** All projects — name, status, health, dates, estimate total, actual spend. Sortable. CSV export.

**Time Summary:** Hours by person, by project, by category. Date range selector.

**Revenue Pipeline:** Pending estimates → Approved → Completed. Count and dollar values.

### 3. Theme & Branding Settings

`/settings/theme`:
- Upload logo (Supabase Storage, max 500KB)
- Accent color picker (presets: teal, navy, forest, burgundy, slate + custom hex)
- Font dropdown (Inter, Roboto, Lato, System)
- Live preview card
- Save → updates CSS variables globally
- PDFs use theme values

**What stays locked:** Status colors (semantic), layout, spacing, Hooomz O colors.

### 4. Full Polish Pass

**Every screen:**
- All colors from `var(--theme-*)` — zero hardcoded hex
- Consistent text sizes (title 22px, section 16px, body 14px, caption 12px, muted 11px)
- Touch targets ≥ 44px
- All borders `var(--theme-border)`
- Status dots 6-8px consistently
- Progress bars 2-3px consistently

**States:**
- Loading: skeleton screens (gray pulsing rectangles), not spinners
- Empty: helpful message + teal CTA ("No projects yet — create your first")
- Error: toast with retry
- Confirmation: green ✓ toast, auto-dismiss 2s

**Cleanup:**
- Remove all placeholder/Lorem text
- Remove all visible TODO comments
- All mock data uses Interiors trade terms only
- No "Henderson" anywhere

### 5. Seed Script

`pnpm seed` — clears and repopulates:

**Project 1: Smith Residence — Floor Refresh**
- Status: in_progress, health 78
- Flooring 2/5 done, Baseboards 0/3, Paint 0/3
- 15 activity events, 8 photos, approved estimate $10,400, 3 receipts $3,245

**Project 2: LeBlanc — Room Refresh**
- Status: in_progress, health 54
- 1 blocked task (countertop delivery)
- 10 activity events, 5 photos

**Project 3: Cormier — Full Interior**
- Status: in_progress, health 31 (behind)
- Kitchen + bathroom + flooring + paint + trim
- 20 activity events, 12 photos

**Team:** Nathan M. (owner), Nishant S. (operator)
**Client:** John & Sarah Smith (with portal access)

Script must be repeatable: clear + repopulate for demo resets.

---

## ACCEPTANCE CRITERIA

- [ ] Desktop dashboard with real data (Screen 13)
- [ ] Responsive: desktop sidebar → mobile portfolio
- [ ] Stats calculate from live data
- [ ] 3 reports accessible and exportable
- [ ] Theme settings: logo, accent, font — all propagate
- [ ] Theme changes affect PDFs
- [ ] Full polish — no hardcoded colors, consistent sizing
- [ ] Skeleton/loading, empty, error states on every page
- [ ] Seed script: `pnpm seed` creates 3 demo projects
- [ ] Seed script repeatable
- [ ] Build passes, 0 errors, no console warnings

---
---

# CC CHEAT SHEET

## Sprint order:
1. Quick Add + Core Flow (Feb 6-9) — handoff: `prompt3-add-page_v1.md`
2. Estimate Builder (Feb 10-13) — this document
3. Auth + Client Portal (Feb 14-17) — this document
4. Time Tracking + Scheduling (Feb 18-20) — this document
5. Home Care Sheet + Intake Polish (Feb 21-23) — this document
6. Photos, Receipts, Notifications (Feb 24-26) — this document
7. Dashboard, Reports, Polish (Feb 27-Mar 1) — this document

## If behind — cut first:
1. Notification inbox (Sprint 6) — everything works without it
2. Schedule view (Sprint 4) — timer still works
3. Job costing dashboard (Sprint 6) — receipts still log
4. Theme & Branding (Sprint 7) — Hooomz brand is fine for the show
5. Reports (Sprint 7) — dashboard covers basics

## Never cut:
- Quick Add, health scores, estimate builder, client portal, Home Care Sheet, desktop dashboard, seed data

## Every session:
1. Read the sprint handoff
2. Check previous sprint acceptance criteria pass
3. Build in listed order
4. Generate session summary
5. Commit + push

---

*Complete sprint stack by Claude.ai — February 6, 2026*
