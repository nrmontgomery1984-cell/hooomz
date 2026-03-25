# Hooomz OS

## What This Is
A tech-enabled residential finishing trades platform. Full job lifecycle OS —
from first inquiry through permanent home record — for four personas:
Manager, Operator, Installer, Homeowner.

## Locked Spec
docs/architecture/2026-02-23_SPEC_app-foundation_v1.md

## Tech Stack
- Framework: Next.js 14.1.0 (App Router)
- UI: React 18.2.0 + TypeScript 5.3.3
- Styling: Tailwind CSS 3.4.1 + CSS custom properties
  → globals.css is the authority. tailwind.config.js matches it.
- State: TanStack React Query 5.x + React Context
  → NOT Zustand. Zustand is not used anywhere in this codebase.
- Client DB: IndexedDB v35, 77 stores, database name: hooomz_db
- Remote: Supabase JS 2.39.0 (48 stores synced)
- Package manager: pnpm workspace monorepo (10 packages)
- Hosting: Vercel. DNS: Wix → hooomz.ca

## Design System
- Primary font: Figtree (300–700)
- Mono font: DM Mono (400–500). No other fonts.
- Background: #F0EDE8 (--bg)
- Surface: #FAF8F5 (--surface)
- Dark nav: #111010 (--dark-nav)
- Border: #E0DCD7 (--border)
- Text: #1A1714 (--charcoal) / #5C5349 (--mid) / #9A8E84 (--muted)
- Status: green #16A34A / amber #D97706 / red #DC2626 / blue #4A7FA5
- Accent: #6B6560
- Sidebar collapses to 56px icon rail, expands to 240px
- Left border accent on cards indicates status color
- No heavy shadows. Border-radius max 10px.
- globals.css is the authority. tailwind.config.js must match it.

## The Lifecycle — DESIGN → SCRIPT
"We DESIGN the SCRIPT." 12 stages, one language.
DESIGN (Sales owns): D-Discover · E-Estimate · S-Survey · I-Iterations · G-Go-Ahead · N-Notify
SCRIPT (Production owns): S-Shield · C-Clear · R-Ready · I-Install · P-Punch · T-Turnover
N (Notify) is the handoff. Nothing enters production without a complete brief.
Homeowner portal access is enabled at I (Iterations), not Turnover.

## Navigation Structure
6 collapsible sidebar sections: SALES · PRODUCTION · FINANCE · STANDARDS · LABS · ADMIN
Collapses to 56px icon rail. Command Centre (/) sits above all sections.
Bottom nav (mobile only): 5 items + Quick Add FAB (19 actions).
Sidebar accordion: only one section open at a time.

## Key Rules
- globals.css is the design token authority
- Offline-first: all mutations → IndexedDB first → SyncQueue → Supabase
- All repos extend BaseRepository<T>
- ID format: prefix-based (PRJ_, TSK_, etc.)
- Conflict resolution: last-write-wins via metadata.updatedAt
- Portal shows progress bars NOT raw budget numbers or hourly rates
- Customers appears in Sales, Production, and Admin — three filtered views, by design
- Material selection → Quote integration is deferred (stores exist, connection not wired)
- Intake form shows no auto-estimate — homeowner receives 24–48hr email response

## When In Doubt
1. Does this write to the activity log?
2. Does this fit the existing data model without a schema change?
3. Can this work on mobile with one hand?
4. Does globals.css support this, or does a token need to change first?
5. Is this on the approved task list, or is it scope creep?
