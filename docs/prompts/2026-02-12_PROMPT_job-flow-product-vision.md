# Prompt: Hooomz Job Flow & Product Vision Document

You are helping design the complete job flow and product vision for **Hooomz Interiors**, a trades-based residential renovation platform built by **Nathan Montgomery**, a Red Seal Journeyman Carpenter with 22 years of experience, based in Moncton, NB, Canada.

---

## About the Business

Hooomz Interiors is the first active division of the Hooomz ecosystem. It focuses on interior renovation trades: **flooring, paint, trim/finish carpentry, tile, and drywall**. The team is small — Nathan (owner/master carpenter), Nishant (operator, learning progression), and Danovan (operator, electrical cert). Trade partners (installers) are brought in for specific jobs.

The broader Hooomz ecosystem includes:
- **Interiors** (active) — the focus of this document
- **Exteriors** (brand: Brisso) — exterior renovation, Danovan operates
- **Maintenance** — subscription home care ($125/$350/$600/yr tiers)
- **Vision** — AR/VR, Revit integration, ArUco room scanning, VR walkthroughs of proposed renovations
- **DIY** — physical kits (slat walls, herb gardens) sold via retail partner Ritchies
- **Labs** — ATK-style independent materials testing, SOP knowledge base, training certification system
- **Profile** — digital home passport ("Carfax for homes"), QR on property, transfers with sale
- **OS** — shared infrastructure connecting all divisions

---

## The Product Philosophy

**"Heavy engine, light touch."**

The backend is a detailed project management, sales, administrative engine — very advanced, data-heavy, and knowledge-rich. It knows material costs, labor rates, SOP sequences, trade dependencies, certification requirements, historical performance data from Labs, and product catalogs.

The frontend is the opposite: professional but inviting, polished but fun, information-dense but simplified to the point the person using it doesn't feel the complexity. The platform should feel like a **trusted foreman** — not a clipboard full of forms.

A good foreman doesn't hand you a form. They walk the site, ask smart questions ("keeping the baseboards or replacing?"), remember context ("you mentioned you like that warm oak look"), and give confident answers ("we can do that, here's what it'll run you"). The complexity lives in their experience, not in your experience.

**Every screen must pass this test: "Would a foreman hand someone a clipboard for this, or would they just have a conversation?"**

The platform should feel like an asset — almost like having a trusted foreman on your team — not a burden or inconvenience. Friction is reduced as much as possible. Everything is based on information and qualitative results, but it's presented naturally.

---

## The Four Stakeholders

Every phase of a job involves up to four stakeholders, each with different needs:

| Stakeholder | Who | What They Care About |
|------------|-----|---------------------|
| **Manager** | Nathan | Everything — sales, scope, budget, crew, schedule, quality, Labs data |
| **Operator** | Nishant or Danovan | Daily execution, progress tracking, SOP compliance, material needs, training |
| **Installer / Trade Partner** | Subcontracted trades | Clear scope for their trade, timeline, what's done vs. what's theirs, access/logistics |
| **Homeowner** | The client | Transparency, confidence, no surprises — timing, cost, scope, expectations |

---

## The Sales Funnel & Lead Conversion

Hooomz has multiple lead sources:
- **Home shows** (in-person demos with VR walkthroughs)
- **Website** (with instant estimate tool)
- **Referrals** (from past clients)
- **Social media / Google**
- **Repeat clients**
- **Retail partner (Ritchies)** cross-selling from DIY kits to full service

The sales funnel vision includes:
1. **Instant Estimate** — Homeowner answers a few quick questions (rooms, rough scope, budget range) and gets a ballpark estimate immediately. Not a detailed quote — a confidence-building range ("a project like this typically runs $8,000–$12,000").
2. **VR Walkthrough** (Vision division) — At home shows or via the app, homeowners can see their space with proposed materials virtually applied. ArUco markers or room scanning for spatial mapping. "See your new floors before we install them."
3. **Design Preferences Capture** — Early in the process, understand the homeowner's aesthetic: preferred colors/shades, flooring looks (warm wood? cool gray? modern? rustic?), trim styles, overall design direction. This feeds product recommendations downstream.
4. **Budget/Allowance Question** — Ask early: "Do you have a budget or allowance in mind?" This lets the system tailor recommendations and present options that fit, rather than showing everything and letting price be a surprise.
5. **Smart Recommendations** — Based on intake answers (room type, existing conditions, design preferences, budget), the system auto-suggests products with pricing. "Based on your preferences, here are three flooring options that fit your budget."

---

## Current App State (for context)

The app currently has:
- **Homeowner intake wizard** (5 steps: About You → Property → Choose Bundle → Room Scope → Review)
- **Contractor intake wizard** (4 steps: Project Info → Scope → Schedule → Review)
- **Dashboard** with project cards
- **Activity Log** as the data spine (append-only events)
- **Estimate builder** for detailed quotes
- **Client Portal** (read-only homeowner view at /portal/[projectId])
- **Labs system** with SOPs, knowledge items, field observations, training certifications, checklist-driven data capture
- **View mode toggle** for testing (Manager / Operator / Installer / Homeowner perspectives)
- **IndexedDB offline-first storage** with 40+ stores

Known issues with the current intake:
- Rooms can only be added one at a time (no "entire floor" or multi-select)
- Flow feels disjointed: flooring type → existing floor → scope → tier → product are separate disconnected sections
- No design preferences captured anywhere
- No budget/allowance question
- Product fields are blank text inputs — no auto-recommendations
- Prices don't auto-populate
- Questions aren't tailored to the selected scope (shows all trade fields regardless)
- Bundles (Floor Refresh ~$5,400 / Room Refresh ~$8,200 / Full Interior ~$11,800 / Custom) feel like arbitrary packages rather than natural progressions

---

## Design Language

- **Base:** Monochrome — charcoal #1a1a1a, gray #6b7280, white #FFFFFF
- **Accent:** Deep teal #0F766E — interaction only (buttons, links, selected states)
- **Status colors:** green #10b981, blue #3B82F6, amber #f59e0b, red #ef4444, gray #9ca3af
- **Rules:** 90% monochrome / 10% accent, max 2-3 teal elements per screen
- **Font:** Inter (mono: JetBrains Mono), border-radius 12px
- **Mobile-first:** 44px minimum touch targets, designed for dirty hands and outdoor visibility
- **Currency:** CAD

---

## Architecture Rules (Non-Negotiable)

1. **Activity Log is the spine** — every action writes an immutable event
2. **Three-axis filtering:** Work Category (what) + Trade (who) + Stage (when)
3. **Loops** — nested containers by phase, color-coded header dots + progress bars
4. **Mobile-first for dirty hands** — gloves, one-thumb, minimal typing
5. **Estimate → Budget conversion** at crew wage rates
6. **Floor plan elements don't store status** — status comes FROM the loop
7. **Health score rolls up** — never set directly
8. **SOP = source of truth** for how work gets done
9. **Offline-first** — field-level merge, append-only stores
10. **Friction budget: 2-3 min/task** — pre-filled SOP defaults, friction only on deviations

---

## The Task

Write a comprehensive **Job Flow & Product Vision Document** for Hooomz Interiors that covers every phase of a renovation job from first contact through follow-up.

For **each phase**, document:

1. **Purpose** — What is this phase for? What problem does it solve?
2. **Stakeholder Experience** — What does each stakeholder (Manager, Operator, Installer, Homeowner) need to **know**, **do**, and **feel** during this phase? Not all stakeholders are involved in every phase.
3. **Information Flow** — What data enters, what changes, what gets communicated to whom, and in what format?
4. **Gate Criteria** — What must be true before anyone can move to the next phase? What would a foreman check before saying "we're good to move on"?
5. **App Experience** — How should the app present this phase? What screens, interactions, or notifications are involved? Remember: heavy engine, light touch.
6. **Where Labs Fits** — How does the Labs system (SOPs, knowledge items, field observations, training data) integrate with or benefit from this phase?

The phases to cover (adjust if you think the breakdown should be different):

1. **Inquiry** — Someone wants work done
2. **Discovery** — Understanding the home, the person, their preferences, their budget
3. **Estimate / Proposal** — Pricing the work, presenting options
4. **Approval / Contract** — Homeowner commits to scope, price, timeline
5. **Planning** — Crew assigned, materials ordered, schedule built
6. **Execution** — Daily work, progress tracking, change orders, photos
7. **QC / Punch List** — Final walkthrough, fixes, quality verification
8. **Closeout** — Final payment, warranty, documentation
9. **Follow-up** — Maintenance handoff, future work, referrals, Profile data

Also address these cross-cutting concerns:
- How the **instant estimate** and **VR walkthrough** fit into the early phases
- How **design preferences** flow through from discovery to product selection to execution
- How **budget/allowance** information shapes recommendations and prevents sticker shock
- How the app **feels different** from standard PM software (Buildertrend, CoConstruct, Jobber, etc.)
- How this flow **duplicates** across divisions (Exteriors/Brisso, Maintenance) — what's shared vs. division-specific
- How **Hooomz Profile** (the digital home passport) gets built as a byproduct of doing the work

Write this as a working product document — not marketing copy. Be specific about data, screens, and interactions. Think like a product designer who also understands construction.
