# HOOOMZ — HOME SHOW SPRINT PLAN
## Everything by March 2026
**Date:** February 6, 2026
**Timeline:** ~6 weeks (Feb 6 → Home Show)
**Status:** Prompts 1-2 ✅, Supabase ✅, Theme ✅, Design ✅

---

## THE COMPRESSION

The original 15-prompt list was sequenced conservatively. Many of those are half-day sessions, not full prompts. Here's the compressed version — 8 sprints, each 3-5 days.

---

## SPRINT 1 (Feb 6-9): Quick Add + Core Flow
**Combines original Prompts 3 + 4**

What CC builds:
- Bottom sheet Quick Add with all 19 actions
- Mini forms for the 4 primary actions (Done, Photo, Note, Time)
- Stub forms for remaining 15 (functional but simpler)
- Project creation flow (intake wizard → generates real project with tasks)
- Task state management (not_started → in_progress → complete → blocked)
- Health score calculation (live, from task completion %)
- Loop rollup (category health → project health)

**Why combine:** Quick Add is useless without projects and tasks to log against. Core Flow is useless without a way to log. They're one feature.

**Done when:** Nathan can create a project from intake wizard, see it on the dashboard with health score, open Quick Add, mark a task done, and watch the health score update.

---

## SPRINT 2 (Feb 10-13): Estimate Builder
**Original Prompt 6**

What CC builds:
- Create estimate from project (Good/Better/Best tiers)
- Line items grouped by trade loop (matching task structure)
- Unit pricing from SCOPE_ITEM_COSTS catalog
- Auto-calculate totals, HST
- PDF export (clean, matches mockup Screen 4)
- "Send to Client" (generates shareable link — email integration later)
- Estimate → Budget conversion (internal margin tracking)

**Done when:** Nathan can build a 3-tier estimate for a Floor Refresh, export a clean PDF, and share a link.

---

## SPRINT 3 (Feb 14-17): Auth + Client Portal
**Combines original Prompts 5 + 10**

What CC builds:
- Magic link auth (Supabase Auth — email, no passwords)
- Role-based access: owner, operator, client
- Client portal view (Screen 8 — simplified project tracking)
- Homeowner-visible activity feed (filtered by `homeowner_visible` flag)
- Photo gallery (client sees Before/During/After)
- Estimate view for client (they see the sent estimate, can approve)

**Why combine:** Auth is infrastructure. The client portal is the first thing that USES auth. Build them together.

**Done when:** Nathan sends a magic link to a test client email. Client clicks it, sees their project progress, photos, and estimate. Can approve the estimate.

---

## SPRINT 4 (Feb 18-20): Time Tracking + Scheduling
**Original Prompt 9**

What CC builds:
- Active timer (start/stop/pause, persists if app closes)
- Time entry logging (connects to existing Quick Add "Time" action)
- Daily time summary
- Weekly hours bar chart
- Weekly schedule view (Screen 14)
- Assign tasks to crew members
- Unscheduled backlog

**Done when:** Nishant can start a timer when he begins work, stop it when done, and Nathan can see weekly hours for the crew plus a schedule view.

---

## SPRINT 5 (Feb 21-23): Home Care Sheet + Intake Polish
**Combines original Prompts 7 + 8**

What CC builds:
- Home Care Sheet auto-generation from completed project data
- Materials installed (pulled from estimate/actuals)
- Care instructions (template-based per material type)
- Warranty section (manufacturer + Hooomz workmanship)
- Maintenance schedule + CTA link
- PDF export (matches Screen 7 mockup)
- Intake wizard polish (full flow: client fills out → Nathan reviews → project created)

**Done when:** A completed project auto-generates a Home Care Sheet PDF that Nathan can hand to the homeowner. Intake wizard works end-to-end from client submission to project creation.

---

## SPRINT 6 (Feb 24-26): Photos, Receipts, Notifications
**Combines original Prompts 11 + 13 + 14**

What CC builds:
- Photo upload to Supabase Storage (actual file storage, not just metadata)
- Photo gallery with Before/During/After tags (Screen 10)
- Receipt capture (amount, vendor, photo of receipt, work category)
- Basic job costing (receipts vs estimate budget)
- Notification inbox (Screen 16)
- Push notification stubs (real push comes post-launch)

**Done when:** Photos upload and display in the gallery. Receipts log against projects with running cost totals. Notifications show up in the inbox.

---

## SPRINT 7 (Feb 27-Mar 1): Dashboard, Reports, Polish
**Combines original Prompts 12 + 15**

What CC builds:
- Desktop dashboard (Screen 13 — THE Home Show demo screen)
- Mobile dashboard polish
- Basic reporting: active projects, hours logged, revenue pipeline
- Theme & Branding settings page (upload logo, pick accent color, choose font)
- White-label preview (live preview in settings)
- Bug fixes and UI polish across all screens

**Done when:** The desktop dashboard looks Home Show ready. Theme settings work. All screens feel consistent and polished.

---

## SPRINT 8 (Mar 2-7): Home Show Prep
**Not a CC sprint — this is Nathan + Claude.ai**

What we do:
- Generate Gemini mockups for any screens that need marketing visuals
- Create demo data (3 realistic projects in different stages)
- Build a scripted demo flow (intake → estimate → field logging → client portal → Home Care Sheet)
- Print materials (if needed)
- Test on actual phone (Nishant's device if possible)
- Prepare the "Theme & Branding" demo (show white-labeling live)
- Prepare the Labs pitch (even if Labs isn't built — the badge and concept are)
- Dry run the whole demo 3 times

**Done when:** Nathan can walk a Home Show visitor through the full lifecycle in under 5 minutes and it never breaks.

---

## TIMELINE VIEW

```
Feb 6-9    ████ Sprint 1: Quick Add + Core Flow
Feb 10-13  ████ Sprint 2: Estimate Builder
Feb 14-17  ████ Sprint 3: Auth + Client Portal
Feb 18-20  ███  Sprint 4: Time Tracking + Scheduling
Feb 21-23  ███  Sprint 5: Home Care Sheet + Intake
Feb 24-26  ███  Sprint 6: Photos, Receipts, Notifications
Feb 27-M1  ███  Sprint 7: Dashboard, Reports, Polish
Mar 2-7    ████ Sprint 8: Home Show Prep
Mar ??     🏠  HOME SHOW
```

---

## RISK MANAGEMENT

### What could slip:
- **Sprint 2 (Estimates)** — PDF generation can be fiddly. If PDF is a problem, fall back to a clean HTML page that prints well.
- **Sprint 3 (Auth)** — Supabase Auth with magic links should be straightforward, but role-based access and RLS policies can get complex. Keep it simple: 3 roles, no custom permissions.
- **Sprint 6 (Photos)** — Supabase Storage upload on mobile can have quirks. If it's a problem, photos stay local with a "sync later" flag.

### What to cut if behind:
1. **First to cut:** Notifications inbox (Sprint 6). Everything works without it — it's polish.
2. **Second to cut:** Scheduling view (Sprint 4). Timer and time logging still work, just no calendar view.
3. **Third to cut:** Job costing from receipts (Sprint 6). Receipts still log, just no budget-vs-actual dashboard.
4. **Last to cut:** Theme & Branding settings (Sprint 7). Hooomz brand is fine for the show — white-labeling is a sales pitch, not a demo requirement.

### What CANNOT be cut:
- Quick Add (Sprint 1) — it's the core interaction
- Project creation + health scores (Sprint 1) — it's the core value
- Estimate builder (Sprint 2) — it's how Nathan makes money
- Client portal (Sprint 3) — it's the trust differentiator
- Home Care Sheet (Sprint 5) — it's the Maintenance bridge
- Desktop dashboard (Sprint 7) — it's the Home Show screen
- Demo prep (Sprint 8) — you only get one first impression

---

## CC SESSION CADENCE

Assuming ~3-4 hour CC sessions:

- Sprint 1: 3 sessions (Quick Add, Core Flow, Integration)
- Sprint 2: 2 sessions (Estimate logic, PDF + sharing)
- Sprint 3: 2 sessions (Auth + roles, Client portal)
- Sprint 4: 2 sessions (Timer + logging, Schedule view)
- Sprint 5: 2 sessions (Home Care Sheet, Intake polish)
- Sprint 6: 2 sessions (Photos + storage, Receipts + notifications)
- Sprint 7: 2 sessions (Desktop dashboard, Theme + polish)
- Sprint 8: Claude.ai + Nathan (no CC needed)

**Total: ~15 CC sessions over 30 days.** That's one session every 2 days. Tight but realistic if sessions are focused and the handoff docs are clean (which they are).

---

## CLAUDE.AI ROLE DURING SPRINTS

While CC builds, I should be:
- Writing the next sprint's handoff doc (always 1 sprint ahead)
- Generating Gemini mockups for upcoming screens
- Reviewing CC session summaries for drift
- Preparing Home Care Sheet templates and content
- Writing demo scripts
- Creating marketing materials for the booth
- Building the Labs pitch deck (concept, not code)
- Preparing the investor-ready overview (for Mark & partner)

---

*Sprint plan by Claude.ai — February 6, 2026*
*Review and adjust weekly based on actual velocity*
