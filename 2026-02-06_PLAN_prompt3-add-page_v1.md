# PROMPT 3: /add Page — Quick Add Menu
## Handoff to Claude Code
**Date:** 2026-02-06
**Document:** 2026-02-06_PLAN_prompt3-add-page_v1.md
**Depends on:** Prompt 1 (Activity Logging) ✅, Prompt 2 (Data Persistence) ✅, Supabase schema ✅, Theme system ✅

---

## WHAT THIS IS

The `/add` page is the **most-used screen in the entire app.** It's how Nishant, Danovan, and Nathan log what's happening on a job site — with one thumb, wearing work gloves, in under 5 seconds.

Currently: placeholder page, 138 bytes. After this prompt: a fully functional Quick Add system that creates real activity events persisted to Supabase.

---

## WHAT TO BUILD

### 1. Quick Add Bottom Sheet

The Quick Add is NOT a page — it's a **bottom sheet** that overlays whatever screen the user is on. Tapping the "+" in the bottom nav opens it. Tapping outside or the ✕ closes it.

**Trigger:** "+" button in the bottom navigation bar (all screens).

**Behavior:**
- Slides up from bottom with backdrop overlay (40% black)
- White background, 16px rounded top corners
- Gray drag handle centered at top
- Takes ~70% of screen height
- Dismissible: tap backdrop, tap ✕, swipe down

**Layout:** Grid of action cells, 4 columns. See action list below.

**Design language (match approved theme):**
- Background: white (`var(--theme-background)`)
- Icons: thin line style, charcoal (`var(--theme-primary)`), 24px, 1.5px stroke
- Labels: gray (`var(--theme-secondary)`), 11px
- No color on the sheet itself — color comes AFTER the user taps an action
- Touch targets: minimum 44x44px
- Use Lucide React icons (already in dependencies)

### 2. Action List — 19 Actions (Interiors-Scoped)

Each action, when tapped, opens a **mini form** (second sheet or slide-over) that collects the minimum required data, then creates an `ActivityEvent`.

| # | Icon | Label | Event Type | Required Fields | Optional Fields |
|---|------|-------|------------|-----------------|-----------------|
| 1 | CheckCircle | Done | `task.completed` | project, task | note, photo |
| 2 | Camera | Photo | `photo.uploaded` | project, photo | note, location_tag |
| 3 | FileText | Note | `note.created` | project, text | work_category, location_tag |
| 4 | Clock | Time | `time.logged` | project, duration_hours | work_category, note |
| 5 | XOctagon | Blocked | `task.blocked` | project, task, reason | photo |
| 6 | Truck | Delivery | `delivery.received` | project, description | photo, note |
| 7 | UserPlus | Sub In | `sub.arrived` | project, sub_name | trade, note |
| 8 | Home | Visit | `site.visit` | project | note, photo |
| 9 | AlertTriangle | Issue | `issue.reported` | project, description, severity | photo, work_category |
| 10 | MessageSquare | Request | `client.request` | project, description | note |
| 11 | CloudRain | Weather | `weather.delay` | project | note, estimated_resume |
| 12 | Play | Started | `task.started` | project, task | note |
| 13 | Calendar | Inspect | `inspection.scheduled` | project, date | note, inspector |
| 14 | CheckCircle2 | Passed | `inspection.passed` | project | note, photo |
| 15 | XCircle | Failed | `inspection.failed` | project, reason | photo, note |
| 16 | Receipt | Receipt | `receipt.captured` | project, amount, vendor | photo, work_category |
| 17 | Unlock | Unblocked | `task.unblocked` | project, task | note |
| 18 | UserMinus | Sub Left | `sub.departed` | project, sub_name | note |
| 19 | Shield | Safety | `safety.logged` | project, description | photo |

**Primary actions (row 1):** Done, Photo, Note, Time — these are 80% of daily usage.

**"More" section:** Actions 9-19 are behind a "More" toggle, collapsed by default. Primary actions (1-8) are always visible.

### 3. Mini Forms — Per Action

Each action opens a compact form. Principles:

- **Project selector is ALWAYS first.** If the user has only one active project, auto-select it. If they have 2-3, show quick-select pills. If 4+, show a searchable dropdown.
- **Minimum fields only.** Don't ask for things that can be inferred. If they're logging time, don't ask which work category unless they want to specify — default to the project's primary category.
- **Smart defaults:** Current date/time auto-filled. Current user auto-filled as actor. Location defaults to last-used for that project.
- **Photo inline:** For actions that accept photos, show camera button directly in the form — don't make them leave and come back.
- **Submit button:** Deep teal (`var(--theme-accent)`), "Log" text. Confirmation: brief green toast "✓ Logged" that auto-dismisses in 2 seconds.

**Example — "Done" mini form:**
```
[Project selector — auto-selected if only 1 active]
[Task dropdown — filtered to in-progress tasks for selected project]
[Optional: Add note — expandable text field]
[Optional: Add photo — camera button]
[Log ✓] button
```

**Example — "Time" mini form:**
```
[Project selector]
[Duration — hour/minute picker or quick buttons: 0.5, 1, 2, 4, 8]
[Optional: Work category — pill selector: FL, PT, FC, TL, DW]
[Optional: Add note]
[Log ✓] button
```

**Example — "Photo" mini form:**
```
[Project selector]
[Camera / gallery picker — opens immediately]
[Optional: Caption/note]
[Optional: Location tag — room/area selector]
[Log ✓] button
```

### 4. Activity Event Creation

Each form submission creates an `ActivityEvent` via the existing `ActivityService` (Prompt 1). The event should include:

```typescript
{
  event_type: 'task.completed',        // from action table above
  summary: 'LVP installed — master bedroom',  // auto-generated from form data
  entity_type: 'task',                 // inferred from event_type
  entity_id: 'task_123',              // from selected task
  actor_id: currentUser.id,
  actor_type: 'team_member',
  actor_name: currentUser.name,
  organization_id: currentOrg.id,
  project_id: selectedProject.id,
  work_category_code: 'FL',           // if specified or inferred
  trade: 'flooring',                  // if specified or inferred
  stage_code: 'ST-FN',               // inferred from task stage
  location_id: selectedLocation?.id,  // if specified
  homeowner_visible: getVisibilityDefault(event_type),  // from existing visibility defaults
  input_method: 'manual_entry',       // or 'photo', 'voice'
  metadata: { ... }                   // action-specific data (duration, amount, severity, etc.)
}
```

**Summary auto-generation:** The `summary` field should be human-readable, auto-generated from form data. Examples:
- Done: "LVP installed — master bedroom" (task name + location)
- Photo: "Photo — kitchen backsplash progress" (caption or "Photo — " + project context)
- Time: "3.5 hrs logged — tile work" (duration + work category)
- Blocked: "Blocked — waiting on countertop delivery" (reason)
- Receipt: "$245.00 — Home Hardware" (amount + vendor)

### 5. Data Flow

```
User taps "+" → Bottom sheet opens
User taps action → Mini form slides in
User fills minimum fields → Taps "Log"
→ ActivityService.log(event) called
→ Event written to Supabase activity_events table
→ Toast confirms "✓ Logged"
→ Sheet dismisses
→ Activity feed auto-refreshes (event appears at top)
→ Project health score recalculates (if task status changed)
```

### 6. Offline Handling

Use the existing SyncQueue from Prompt 2. If offline:
- Event saves to IndexedDB immediately
- Toast shows "✓ Logged (will sync)" with subtle gray sync icon
- SyncQueue pushes to Supabase when connection returns
- No user action required

---

## WHAT NOT TO BUILD

- ❌ Voice input (Prompt 5)
- ❌ Auth / user management (Prompt 5)
- ❌ Photo upload to Supabase Storage (just capture metadata for now, store photo locally)
- ❌ Complex task creation (this is LOGGING, not planning)
- ❌ Estimate creation (separate flow)
- ❌ Scheduling (separate flow)

---

## ACCEPTANCE CRITERIA

### Must have:
- [ ] Bottom sheet opens from "+" nav button on all pages
- [ ] All 19 actions visible (8 primary + 11 behind "More" toggle)
- [ ] Tapping any action opens its mini form
- [ ] Project selector works (auto-select if 1 project, pills if 2-3, dropdown if 4+)
- [ ] "Done" action: select task → mark complete → creates activity event
- [ ] "Photo" action: camera opens → captures → creates activity event with metadata
- [ ] "Note" action: text field → creates activity event
- [ ] "Time" action: duration picker → creates activity event
- [ ] "Blocked" action: select task + reason → creates activity event, task status updates to blocked
- [ ] All events persisted to Supabase `activity_events` table
- [ ] Events appear in Activity Feed immediately after logging
- [ ] Green toast confirmation on every successful log
- [ ] Sheet dismisses after logging
- [ ] Follows theme system (all colors from CSS variables, not hardcoded)
- [ ] Build passes, typecheck passes, 0 new errors

### Should have:
- [ ] "Receipt" action captures amount + vendor
- [ ] "Sub In" / "Sub Left" captures sub name
- [ ] "Issue" action captures severity (Low/Medium/High)
- [ ] "Weather" delay captures estimated resume time
- [ ] Smart defaults (auto-fill project, time, user)
- [ ] Summary auto-generation for all event types

### Nice to have:
- [ ] Quick-repeat: after logging, option to "Log another" without reopening the sheet
- [ ] Recent actions: "You just logged 'Done' for Smith — log another?" shortcut
- [ ] Haptic feedback on mobile when Log button is tapped (if supported)

---

## DESIGN REFERENCE

Refer to the mockup prompt for Screen 3 (Quick Add Menu) in:
`C:\Hooomz\docs\mockups\2026-02-05_BRIEF_screens-6-through-16-final_v1.md`

Key visual specs from that prompt:
- Bottom sheet: white, 16px top corners, 70% screen height
- Gray drag handle: 40px wide, 4px tall
- Action cells: thin line Lucide icons (charcoal, 24px), gray labels (11px)
- 4-column grid, 44x44px touch targets
- NO color on the sheet — monochrome only
- Teal appears only on the "Log" submit button in the mini forms

---

## SESSION SUMMARY EXPECTED

After this session, CC should generate a summary covering:
- Which of the 19 actions are fully implemented vs stubbed
- Any new type errors or build issues
- Database writes confirmed working
- Decisions made about form layouts or defaults
- What remains for follow-up

---

*Plan by Claude.ai — February 6, 2026*
*For execution by Claude Code*
