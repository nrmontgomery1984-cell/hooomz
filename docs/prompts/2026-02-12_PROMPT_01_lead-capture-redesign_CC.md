# Prompt 1: Lead Capture Redesign

**Sequence:** 1 of 16 | **Priority:** Home Show Critical | **Est. effort:** 1 CC session
**Spec reference:** v2.1 §3 (Phase 1: Inquiry)
**Depends on:** Nothing — this is the entry point

---

## CONTEXT

You are building the **Hooomz Interiors** platform — a trades-based residential renovation app for a small crew in Moncton, NB. The full product vision is in `docs/2026-02-12_SPEC_job-flow-product-vision_v2.1-final.md`. Read it if you need broader context, but this prompt is self-contained for the Inquiry phase.

**The product philosophy:** "Heavy engine, light touch." The backend knows material costs, labor rates, SOP sequences, trade dependencies. The frontend feels like a trusted foreman — not a clipboard full of forms. Every screen must pass the **Clipboard Test**: "Would a foreman hand someone a clipboard for this, or would they just have a conversation?"

**Home show deadline:** Mid-March 2026. This prompt is demo-critical. The scenario: a visitor walks up to the booth, taps through 5 screens in 60 seconds, gets an instant ballpark estimate, gives their name and phone, and Nathan has a qualified lead with scope signals, budget range, and temperature.

**Design language:**
- Monochrome base: charcoal `#1a1a1a`, gray `#6b7280`, white `#FFFFFF`
- Accent: deep teal `#0F766E` — interaction only (buttons, links, selected states)
- Status: green `#10b981`, blue `#3B82F6`, amber `#f59e0b`, red `#ef4444`, gray `#9ca3af`
- 90% mono / 10% accent. Max 2-3 teal elements per screen.
- Font: Inter. Border-radius: 12px. Min touch targets: 44px. Mobile-first.
- Currency: CAD.

**Four stakeholders:** Manager (Nathan — sees everything), Operator (Nishant/Danovan — daily execution), Trade Partner (installer — their scope only), Homeowner (client — transparency, no surprises). Only Manager and Homeowner are involved in Inquiry.

---

## OBJECTIVE

Redesign the lead capture flow (`/leads/new`) and lead pipeline (`/leads`) to match the v2.1 Inquiry phase spec. Two connected changes:

### A. `/leads/new` — Conversational 5-Screen Intake

Replace the current single-page form with a **progressive disclosure flow** — one question per screen, animated transitions, instant estimate on screen 4. This is what the homeowner (or home show visitor) sees.

### B. `/leads` — Enhanced Pipeline

Upgrade the pipeline from 4 stages to 5 columns with lead temperature, budget range, instant estimate range, and one-tap actions.

---

## EXISTING CODE TO READ FIRST

Read these files before writing any code. They are your starting point — enhance, don't rewrite from scratch where possible.

| File | What It Contains | What Changes |
|------|-----------------|--------------|
| `apps/web/src/app/leads/new/page.tsx` | Current single-page lead form (310 lines). Name, phone, email, interests pills, source pills, notes. State machine: form → success. | **Rewrite** into 5-screen conversational flow with stepper, but preserve the success view pattern and `useCreateLead` integration. |
| `apps/web/src/app/leads/page.tsx` | Current pipeline page (516 lines). 4 stages: New/Quoted/Converted/Passed. Filter pills, collapsible groups, LeadCard component. | **Enhance** — change to 5 stages, add temperature/budget/estimate to cards, add one-tap actions. |
| `apps/web/src/lib/hooks/useLeadData.ts` | Lead hooks (365 lines). `useLeadPipeline`, `useCreateLead`, `usePassLead`, `useRestoreLead`, `useDeleteLead`. Leads are Customers with structured tags. Stage derived from tags + project status. | **Extend** — add new tags for timeline, budget, room count, instant estimate. Add `useUpdateLeadStage` hook. Expand `LeadStage` type. |
| `apps/web/src/lib/services/intake.service.ts` | Lines 105-137: `SCOPE_ITEM_COSTS` — hardcoded per-trade costs (material + labor per unit). This is the basis for instant estimates. | **Read only** — extract cost data for the instant estimate engine. Do not modify this file. |
| `apps/web/src/lib/data/estimatingCatalogSeed.ts` | 27 materials + 10 labor rates seeded to IndexedDB. NB market pricing. | **Read only** — reference for estimate accuracy. |
| `packages/shared-contracts/src/types/index.ts` | Enums: ProjectType, ProjectStatus, CostCategory, etc. | **Read only** — use existing enums where applicable. |
| `apps/web/src/lib/viewmode/viewmode.ts` | Sidebar config — `/leads` is manager-only. | No changes needed. |

---

## REQUIREMENTS

### Part A: Conversational Lead Capture (`/leads/new`)

**Architecture:** Single page component with step state (1-5). Each step renders a distinct screen. Animated transitions (slide left/right or fade). Back navigation via arrow or swipe. No URL changes — all client-side state.

**Screen 1: "What are you thinking about?"**
- Tappable scope cards in a 2-column grid
- Options: `Floors` / `Paint` / `Trim & Molding` / `Tile` / `Full Interior` / `Not Sure Yet`
- Multi-select allowed (except "Not Sure Yet" which deselects others)
- Each card: icon + label + subtle description (e.g., "LVP, hardwood, laminate, carpet")
- Use Lucide icons: `Layers` (floors), `Paintbrush` (paint), `Frame` (trim), `Grid3x3` (tile), `Home` (full interior), `HelpCircle` (not sure)
- Teal border + light teal background on selected cards
- **Maps to:** existing `interests` tags on Customer record

**Screen 2: "How many rooms?"**
- Stepper control: minus / number / plus (1-8+)
- "Whole floor" toggle below — when on, stepper shows "All" and internally maps to room_count=0 (whole floor flag)
- Subtitle: "Don't worry about exact count — we'll confirm during the site visit."
- **Maps to:** new `room_count` tag on Customer (e.g., `rooms:3` or `rooms:whole-floor`)

**Screen 3: "Do you have a budget range in mind?"**
- Tappable range cards (single-select, vertical stack):
  - `Under $5,000`
  - `$5,000 – $10,000`
  - `$10,000 – $20,000`
  - `$20,000+`
  - `Not sure yet` (always an option, never feels wrong to pick)
- Each card shows a subtle trade hint: e.g., "$5K–$10K" → "Typical for 2-3 rooms of flooring + paint"
- **Maps to:** new `budget` tag (e.g., `budget:5k-10k` or `budget:not-sure`)

**Screen 4: "Here's what we're seeing."**
- **Instant estimate display** — the payoff moment. Shows a range: "$X,000 – $Y,000"
- Subtitle: "Based on [trade mix] across [N rooms] in the Moncton area."
- Disclaimer: small text — "This is a preliminary range. Your actual estimate will be based on a site visit and detailed scope."
- CTA button: "Let's get specific — book a free site visit" (scrolls/transitions to screen 5)
- Secondary link: "Just exploring? That's fine too." (also goes to screen 5)
- **Estimate calculation** (see Instant Estimate Engine below)

**Screen 5: "How should we reach you?"**
- Name field (required, auto-capitalize)
- Phone field (required)
- Email field (optional, labeled as such)
- "How did you hear about us?" — single-select pills (same as current: Home Show, Referral, Website, Social, Other)
- Submit button: "Get My Estimate" (not "Save Lead")
- **Preserves:** existing `useCreateLead` mutation with extended tag payload

**Success Screen:**
- Keep existing success pattern: green check, name, phone
- **Add:** show the instant estimate range again ("Your preliminary range: $8,000–$12,000")
- **Add:** "We'll be in touch within 24 hours" message
- Buttons: [+ Another] and [View Pipeline]

**Transitions & UX:**
- Bottom progress dots (5 dots, filled = completed, ring = current)
- Back arrow in top-left (goes to previous screen). Screen 1 back arrow goes to `/leads`
- Forward: tapping a card or pressing "Next" advances. Screen 4 CTA and screen 5 submit are the only explicit buttons.
- Screen 1-3: auto-advance 300ms after selection (delay gives visual feedback). Screen 4-5: explicit button press.
- Total flow time target: 30-60 seconds at a home show booth.

### Instant Estimate Engine

Create a pure function `calculateInstantEstimate` in a new file `apps/web/src/lib/utils/instantEstimate.ts`:

```typescript
interface InstantEstimateInput {
  trades: string[];      // ['flooring', 'paint', 'trim', 'tile', 'full-interior']
  roomCount: number;     // 1-8, or 0 = whole floor
  budgetRange: string;   // 'under-5k' | '5k-10k' | '10k-20k' | '20k-plus' | 'not-sure'
}

interface InstantEstimateResult {
  low: number;
  mid: number;
  high: number;
  description: string;   // "LVP flooring + interior paint across 3 rooms"
  confidence: 'low' | 'medium';  // always low or medium at inquiry stage
}
```

**Calculation logic:**
1. Define average cost per room per trade (derived from `SCOPE_ITEM_COSTS` in `intake.service.ts`):
   - Flooring: ~$1,800/room (avg 150sqft × $4 mat + $3 labor + 10% waste + transitions)
   - Paint: ~$600/room (avg 400sqft walls × $0.80 combined + ceiling + prep)
   - Trim: ~$900/room (avg 50lf baseboard + door casings)
   - Tile: ~$2,400/room (avg 80sqft × $18 combined + prep + materials)
   - Full interior: flooring + paint + trim per room
2. If `roomCount === 0` (whole floor), use 6 rooms as default
3. Multiply per-room averages by room count for each selected trade, sum them
4. Apply a ±20% spread: low = sum × 0.8, high = sum × 1.2, mid = sum
5. If a budget range was provided and the estimate range doesn't overlap, add a note (but never hide the estimate)
6. `confidence` = 'low' if "not sure" was selected for trades or budget, else 'medium'
7. Round to nearest $500

**Important:** This is NOT a detailed quote. It's a confidence-building range. Wide is fine. Accurate-ish is the goal. The Labs flywheel will sharpen these over time.

### Part B: Enhanced Pipeline (`/leads`)

**New pipeline stages:**

```typescript
export type LeadStage = 'new' | 'contacted' | 'site_visit_booked' | 'estimate_sent' | 'won' | 'lost';
```

Replace current 4-stage pipeline:
| Current | New |
|---------|-----|
| `new` | `new` |
| `quoted` | `estimate_sent` |
| `converted` | `won` |
| `passed` | `lost` |
| — | `contacted` (new) |
| — | `site_visit_booked` (new) |

**Stage derivation** (update `deriveStage` in `useLeadData.ts`):
- `lost` — has `passed` tag (backward compatible)
- `won` — has linked project in APPROVED/IN_PROGRESS/COMPLETE
- `estimate_sent` — has linked project in ESTIMATE/QUOTED status
- `site_visit_booked` — has `stage:site-visit-booked` tag (manual progression)
- `contacted` — has `stage:contacted` tag (manual progression)
- `new` — default (has `lead` tag, no stage override)

**New hook: `useUpdateLeadStage`**
- Takes `customerId` and `targetStage`
- Adds/replaces `stage:*` tag on customer record
- Used by pipeline card actions

**Pipeline stage colors:**
| Stage | Color | Background |
|-------|-------|------------|
| `new` | `#8B5CF6` (purple) | `#F5F3FF` |
| `contacted` | `#F59E0B` (amber) | `#FFFBEB` |
| `site_visit_booked` | `#3B82F6` (blue) | `#EFF6FF` |
| `estimate_sent` | `#0F766E` (teal) | `#F0FDFA` |
| `won` | `#10B981` (green) | `#ECFDF5` |
| `lost` | `#9CA3AF` (gray) | `#F9FAFB` |

**Lead temperature indicator** (derived, never set directly):
- 🔴 **Hot** — source is `home-show` or `referral` AND timeline is `asap`
- 🟡 **Warm** — source is `home-show` or `referral` OR timeline is `asap` or `next-few-months`
- ⚪ **Cool** — everything else (website + just exploring, etc.)

Display as a small colored dot next to the lead name on pipeline cards.

**Enhanced LeadCard display:**
- Name + temperature dot + stage pill
- Scope tags (interests) + source badge + relative time
- **NEW:** Budget range badge (e.g., "$5K-$10K")
- **NEW:** Instant estimate range (e.g., "Est: $6,800–$10,200")
- **NEW:** Room count (e.g., "3 rooms")
- Phone (tappable tel: link)
- Notes (if any, truncated)

**One-tap actions per stage:**
| Stage | Actions |
|-------|---------|
| `new` | Call, Text, Mark Contacted |
| `contacted` | Call, Schedule Site Visit |
| `site_visit_booked` | Call, Start Intake |
| `estimate_sent` | Call, View Project |
| `won` | View Project |
| `lost` | Restore |

All stages get a delete button (with confirmation, same as current).

**"Mark Contacted" action:** calls `useUpdateLeadStage(customerId, 'contacted')`
**"Schedule Site Visit" action:** calls `useUpdateLeadStage(customerId, 'site_visit_booked')`. (For now, just stage change. Calendar integration is a future prompt.)
**"Start Intake" action:** navigates to `/intake?lead=${customerId}` (same as current)

### Part C: Data Model Changes

**New Customer tags** (stored alongside existing tags):
- `timeline:asap` / `timeline:next-few-months` / `timeline:just-exploring`
- `budget:under-5k` / `budget:5k-10k` / `budget:10k-20k` / `budget:20k-plus` / `budget:not-sure`
- `rooms:3` / `rooms:whole-floor` (number or whole-floor)
- `estimate-low:8000` / `estimate-high:12000` (instant estimate results)
- `stage:contacted` / `stage:site-visit-booked` (manual pipeline progression)

No schema changes needed. All data fits in the existing `tags: string[]` field on Customer.

**New tag parsers** (add to `useLeadData.ts`):
- `parseTimeline(tags)` → `string`
- `parseBudget(tags)` → `string`
- `parseRoomCount(tags)` → `number | 'whole-floor'`
- `parseEstimateRange(tags)` → `{ low: number; high: number } | null`
- `parseLeadTemperature(tags)` → `'hot' | 'warm' | 'cool'`
- `parseManualStage(tags)` → `string | null`

**Updated `CreateLeadInput`:**
```typescript
export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  interests: string[];
  source: string;
  timeline: string;
  budgetRange: string;
  roomCount: number;      // 0 = whole floor
  instantEstimate?: { low: number; high: number };
  notes?: string;
}
```

**Updated `LeadRecord`:**
```typescript
export interface LeadRecord {
  customer: Customer;
  stage: LeadStage;
  interests: string[];
  source: string;
  linkedProject?: Project;
  timeline: string;
  budgetRange: string;
  roomCount: number | 'whole-floor';
  instantEstimate: { low: number; high: number } | null;
  temperature: 'hot' | 'warm' | 'cool';
}
```

### Part D: Activity Log Event

The `useCreateLead` mutation should log a `lead.created` activity event after successfully creating the customer record. Use the existing activity logging pattern from `getLoggedServices()` — the logged services already wrap create operations with activity events. If the current `customers.create()` doesn't automatically log, add an explicit activity event:

```typescript
{
  type: 'lead.created',
  payload: {
    source: input.source,
    interests: input.interests,
    timeline: input.timeline,
    budget_range: input.budgetRange,
    room_count: input.roomCount,
    instant_estimate: input.instantEstimate,
  }
}
```

---

## GATE CRITERIA

Before this prompt is considered complete, ALL must be true:

- [ ] `/leads/new` renders 5 screens in sequence with animated transitions
- [ ] Screen 1 multi-select scope cards work (with "Not Sure Yet" exclusive behavior)
- [ ] Screen 2 room stepper works (1-8+ with whole floor toggle)
- [ ] Screen 3 budget range cards work (single-select)
- [ ] Screen 4 shows calculated instant estimate range
- [ ] Screen 5 captures name, phone, optional email, and source
- [ ] Submit creates Customer with all new tags (timeline, budget, rooms, estimate)
- [ ] Success screen shows the instant estimate range
- [ ] `/leads` pipeline shows 6 stages with correct colors
- [ ] Lead cards show temperature dot, budget badge, estimate range, room count
- [ ] "Mark Contacted" and "Schedule Site Visit" actions work
- [ ] `calculateInstantEstimate` is a tested pure function in its own file
- [ ] Auto-advance works on screens 1-3 (300ms delay after selection)
- [ ] Back navigation works on all screens
- [ ] Progress dots show at bottom of all screens
- [ ] Mobile touch targets are 44px minimum everywhere
- [ ] TypeScript compiles with 0 errors (`pnpm tsc --noEmit` in `apps/web`)
- [ ] Lead created via old intake flow (`/intake?lead=...`) still works

---

## DO NOT

- Do not modify `intake.service.ts` — read it for cost data, don't change it
- Do not modify shared-contracts schemas — use existing Customer tags
- Do not add new IndexedDB stores or repos — everything fits in existing Customer tags
- Do not add a separate "Lead" entity — leads are Customers with tags (existing pattern)
- Do not build calendar integration for "Schedule Site Visit" — just the stage change for now
- Do not add VR session linking — that's a future Vision division integration
- Do not add photo upload to the lead capture flow — keep it 5 screens, no extras
- Do not use cream/coral colors — stick to the monochrome + teal design language
- Do not add more than 2-3 teal elements per screen
- Do not break the existing intake flow (`/intake?lead=...` must still work with extended tags)

---

## VERIFICATION

After implementation, test these scenarios:

1. **Home show flow:** Open `/leads/new` on mobile. Tap "Floors" + "Paint" → auto-advance. Set rooms to 3 → advance. Tap "$5K–$10K" → advance. See estimate (~$7,000–$10,500). Tap CTA → enter name + phone + "Home Show" → submit. Verify success screen shows estimate. Navigate to pipeline — lead appears as "new" with hot temperature (home show + not-yet-asked timeline defaults to warm, but home-show source bumps to warm minimum).

2. **Website flow (cool lead):** Same flow but select "Not Sure Yet" on screen 1, "Not sure yet" on screen 3, source = "Website". Verify cool temperature on pipeline card.

3. **Pipeline progression:** From pipeline, tap "Mark Contacted" on a new lead → card moves to Contacted column. Tap "Schedule Site Visit" → moves to Site Visit Booked. Tap "Start Intake" → navigates to `/intake?lead=...`.

4. **Backward compatibility:** Create a lead via the OLD flow if anything still calls `useCreateLead` with the old interface — verify it doesn't crash (new fields should be optional with fallbacks).

5. **Instant estimate sanity check:**
   - Floors only, 1 room → should be roughly $1,400–$2,200
   - Full interior, 4 rooms → should be roughly $10,500–$15,800
   - "Not sure" trades, "whole floor" → should show a wide range with low confidence

---

## FILE SUMMARY

| Action | File |
|--------|------|
| **NEW** | `apps/web/src/lib/utils/instantEstimate.ts` — pure estimate function |
| **REWRITE** | `apps/web/src/app/leads/new/page.tsx` — 5-screen conversational flow |
| **ENHANCE** | `apps/web/src/app/leads/page.tsx` — 6-stage pipeline, enhanced cards |
| **EXTEND** | `apps/web/src/lib/hooks/useLeadData.ts` — new types, parsers, hooks |
