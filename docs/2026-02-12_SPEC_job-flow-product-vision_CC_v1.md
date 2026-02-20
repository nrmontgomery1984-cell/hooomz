# Hooomz Interiors — Job Flow & Product Vision Document

**Author:** Claude Code (CC)
**Date:** 2026-02-12
**Status:** Draft for comparison

---

## Guiding Principle: Heavy Engine, Light Touch

Every decision in this document is filtered through one question: **"Would a foreman hand someone a clipboard for this, or would they just have a conversation?"**

The backend is a textbook — it knows material costs per square foot by region, labor rates by trade and tier, SOP sequences with checklist items, trade dependencies and sequencing rules, historical performance data from Labs, product catalogs with compatibility matrices, and certification requirements for every task. It's the kind of knowledge that takes 22 years on job sites to accumulate.

The frontend is a foreman — it asks one good question at a time, remembers what you said three steps ago, surfaces the right suggestion at the right moment, and never makes you feel like you're filling out a form. The person holding the phone should feel like they have a trusted expert on their team, not a software system to maintain.

**What this means in practice:**
- Ask fewer questions, but smarter ones. "What rooms are you renovating?" not "Please enter room dimensions for each space."
- Default aggressively. A 1,200 sqft bungalow in Moncton with LVP flooring has predictable dimensions, material quantities, and costs. Pre-fill everything, let the user correct exceptions.
- Show confidence. "This typically runs $8,000–$12,000" is more useful than a blank field labeled "Budget."
- Reveal complexity progressively. The homeowner sees a progress bar. The operator sees task checklists. The manager sees the full P&L. Same data, different lenses.

---

## Phase 1: Inquiry

### Purpose
Someone wants work done. This phase exists to capture enough information to prioritize and prepare — nothing more. The homeowner should feel heard and confident that someone competent will follow up. The manager should have enough to know whether this is a real lead and what to prepare for.

### Stakeholder Experience

**Homeowner — Needs to feel:**
- "I've reached the right company"
- "Someone will get back to me"
- "That was easy"

**What they do:** Provide name, contact method, and a rough description of what they want. Not a detailed scope — just "I need new floors throughout" or "full kitchen/living room refresh." Optionally share photos of the space.

**Manager — Needs to know:**
- Who is this person?
- How did they find us? (lead source matters for marketing ROI)
- What's the rough scope? (flooring only? full interior? one room?)
- How warm is this lead? (home show face-to-face = hot; website form at 2am = lukewarm)
- When do they want to start?

**What they do:** Review the inquiry, assign a priority, schedule a follow-up (site visit or call).

**Operator / Installer:** Not involved yet.

### Information Flow

**Data in:**
- Contact: name, phone or email, preferred contact method
- Lead source: home show, website, referral (from whom?), social, Google, repeat client, Ritchies
- Rough scope: free text or quick selection ("New floors", "Paint + floors", "Full interior refresh", "Not sure yet")
- Timeline: "As soon as possible" / "Next few months" / "Just exploring"
- Photos (optional): phone camera upload of the space

**Data created:**
- Lead record with status: `new`
- Activity event: `lead.created`
- If from home show: VR session ID linked (if they did a walkthrough at the booth)

**Communicated to:**
- Homeowner: Confirmation (text or email) — "Thanks [name], we'll be in touch within [timeframe]"
- Manager: New lead notification on dashboard with priority indicator

### Gate to Phase 2
Manager has: a name, a contact method, a rough idea of scope, and a next step scheduled (site visit date or call time). Lead status moves to `contacted` or `site_visit_scheduled`.

### App Experience

**Homeowner-facing (website/app):**
A single-screen form that feels like a text conversation, not a registration form. Five fields max visible at once. Progressive — answer one, the next appears. Mobile-optimized with large touch targets.

The **instant estimate** lives here as a hook: after they describe their scope ("floors + paint, 3 bedrooms + living room"), the system immediately shows a ballpark range: *"Projects like this typically run $7,500–$11,000 in the Moncton area."* This isn't a quote — it's a confidence builder. It tells the homeowner they're in the right place and sets realistic expectations before the first conversation.

**If they came from a home show** and did a VR walkthrough, the inquiry is pre-filled with their name, the materials they explored, and a snapshot from the VR session. The form becomes: "We loved meeting you at the show! Ready to make those floors happen?"

**Manager-facing (dashboard):**
New leads appear in the Leads section (`/leads`) as cards with:
- Name, source, rough scope
- Lead temperature indicator (hot/warm/cool based on source + timeline)
- One-tap actions: "Call", "Text", "Schedule Site Visit"
- Time since inquiry (urgency indicator)

### Where Labs Fits
Not directly involved, but the instant estimate engine draws on Labs data: historical cost data per trade per sqft, regional pricing adjustments, and material cost trends. The more jobs completed with Labs data capture, the more accurate instant estimates become. This is the beginning of the Labs flywheel.

---

## Phase 2: Discovery

### Purpose
Understand the home, the person, their preferences, and their budget. This is the site visit or detailed conversation. The current intake wizard tries to do this in one pass — but discovery is actually two distinct conversations:

1. **The practical conversation:** What's the property? What rooms? What condition is everything in? What needs to happen?
2. **The preference conversation:** What do you like? What's your style? What's your budget? What matters most to you?

These should feel like a single natural flow, but the system treats them as separate data layers — one feeds the estimate engine, the other feeds the recommendation engine.

### Stakeholder Experience

**Homeowner — Needs to feel:**
- "They're really listening to what I want"
- "They understand my home"
- "I can see this coming together"
- "I'm not being upsold — they're working within my reality"

**What they do:** Walk the house with the manager (or fill out the guided intake remotely). Answer questions about what they want, show what they don't like about the current state, share inspiration photos or describe their style. Provide a budget range or allowance if they have one.

**Manager — Needs to know:**
- Property layout: rooms, sqft, floor count, access constraints
- Current condition: what's being removed/replaced, subfloor state, wall condition
- Scope per room: which trades apply where
- Design direction: style preferences, color palette, material preferences
- Budget reality: what they can spend, where they're flexible, where they're firm
- Logistics: occupied during reno? pets? elevator? parking for materials?

**What they do:** Walk the site (or guide the remote intake), capture measurements, take photos, note conditions, and — critically — listen to what the homeowner actually wants, not just what they say they want. A good foreman reads the room.

**Operator:** Not involved yet, but will inherit everything captured here. Anything missed now becomes a change order later.

**Installer:** Not involved yet.

### Information Flow

**Data in (practical):**
- Property: address, type, storeys, access notes
- Rooms: name, floor, measurements (L×W×H), or "entire floor" selection
- Per-room trades: flooring (type, existing, condition), paint (surfaces, prep level), trim (items, action), tile, drywall
- Existing conditions: photos tagged by trade and room
- Stairs, closets, special features
- Logistics: occupancy, pets, access, parking

**Data in (preferences):**
- **Design style:** Modern / Traditional / Transitional / Farmhouse / Coastal / Rustic / Minimalist / "I don't know, show me options"
- **Color direction:** Warm / Cool / Neutral / Bold / "Match what I have"
- **Flooring look:** Light wood / Medium wood / Dark wood / Gray tones / Tile look / Carpet
- **Trim style:** Clean/modern / Traditional/colonial / Craftsman / "Match existing"
- **Budget range:** Under $5K / $5–10K / $10–20K / $20K+ / "What does it typically cost?" / Specific allowance amount
- **Priority:** "What matters most?" — Cost / Speed / Quality / Design (pick top 2)
- **Inspiration:** Photo uploads or Pinterest-style selections from a curated gallery

**Data created:**
- Project record: status `discovery`
- Room scopes with trade details
- Design preference profile (persists across the project — feeds recommendations)
- Budget envelope (range or specific allowance)
- Photo gallery tagged by room and trade
- Activity event: `project.discovery_complete`

**Communicated to:**
- Homeowner: "Here's what we discussed" summary (email or portal link) — not a quote yet, just confirmation of scope and preferences
- Manager: Project ready for estimating

### Gate to Phase 2 → 3
Every room has: assigned trades, measurements (actual or estimated from property type), and condition noted. Design preferences captured. Budget range established. Manager has enough to build an estimate without calling the homeowner back for forgotten details.

### App Experience

**The intake should feel like a guided conversation, not a form.**

**Room selection redesign:**
- Start with property type + storeys → the system pre-populates a standard floor plan template ("Typical 3-bedroom bungalow: Kitchen, Living Room, 3 Bedrooms, Bathroom, Hallway")
- Homeowner confirms, removes rooms they don't need, adds missing ones
- **"Entire Floor" option** — select "Main Floor" and it adds all standard rooms for that floor
- **Multi-select** — tap multiple rooms at once, then batch-apply trades ("Flooring in all these rooms")
- Rooms should show as a visual list (not a form), with trade badges (FL, PT, FC) that toggle on/off per room

**Design preferences screen:**
This is the new step that doesn't exist today. It comes BEFORE room details, because it shapes everything downstream.

Presented as a visual chooser, not a form:
- **Style:** Card-based selection with photos (not text labels). Tap the kitchen that looks like yours.
- **Colors:** Palette swatches, not text fields. "Which of these feels like home?"
- **Flooring:** Photo samples grouped by look (warm oak, cool gray, dark walnut, stone-look). Tap to select.
- **Budget:** Slider or range selector. If they say "$10K–$15K", the system immediately shows what that buys: "That range typically covers flooring + paint for a 3-bedroom home."

**Room details (scope):**
For each room (or batch of rooms), questions are **tailored to the selected trades only**. If they only selected flooring, don't show paint questions. Questions flow as a guided sequence:

*Flooring flow:*
1. "What's on the floor now?" (photo of current + tap to select: carpet, hardwood, vinyl, tile, etc.)
2. "What do you want?" → System suggests 2-3 products based on their design preferences + budget. "Based on your warm wood preference and budget, we recommend:" with product cards showing photo, name, price/sqft.
3. Confirm or browse alternatives.

*Paint flow:*
1. "Which surfaces?" (Walls / Ceiling / Trim — visual checkboxes)
2. "Any accent walls?" (show room photo, tap the wall)
3. System suggests colors based on their preference profile: "You said you like warm tones — here are popular warm neutrals."

**Material auto-population:**
Once design preferences + budget are captured, the system fills in material recommendations automatically using the product catalog. The homeowner sees "Lifeproof Sterling Oak — $4.29/sqft" not a blank text field. They can change it, but the default is smart.

**Price auto-population:**
Material prices come from the catalog. Labor rates come from SOP data (per-trade, per-task rates). The system calculates totals in real-time as rooms and trades are added. The homeowner doesn't see line-item pricing during discovery — they see the running total updating: "Your project is shaping up around $9,500."

### Where Labs Fits
- **Product recommendations** draw from Labs material testing data. If Labs has tested LVP products, the recommendation can include: "Hooomz Labs rated: 4.2/5 for durability" alongside the product card.
- **Condition assessment** feeds field observations. If the manager notes "subfloor had moisture damage in bathroom," that's a potential Labs observation about building conditions in that neighborhood/era of construction.
- **SOP awareness:** The system knows, from SOPs, what questions to ask for each trade. If the LVP install SOP has a checklist item "check subfloor flatness," the discovery flow asks about subfloor condition.

---

## Phase 3: Estimate / Proposal

### Purpose
Turn the discovery data into a priced proposal the homeowner can understand and commit to. This is where the "heavy engine" does its heaviest work — calculating material quantities, labor hours, trade sequencing, contingency, and margin — but the homeowner just sees a clean, confident proposal.

### Stakeholder Experience

**Homeowner — Needs to feel:**
- "I understand exactly what I'm getting"
- "The price is fair and I can see where the money goes"
- "There are options — I have control"
- "No hidden costs"

**What they see:** A proposal that reads like a letter, not a spreadsheet. Organized by room or by trade (their choice). Clear scope descriptions ("New LVP flooring throughout main floor, including removal of existing carpet and new baseboards"). Total price with optional upgrades shown as add-ons, not upsells.

**Manager — Needs to know:**
- Are margins healthy?
- Is the scope realistic for the timeline?
- Are there risk areas (old subfloor, unknown conditions behind walls)?
- Does the crew have capacity?

**What they do:** Review the auto-generated estimate, adjust margins, add contingency for risk areas, customize the proposal presentation, and send to the homeowner.

**Operator:** May be consulted on feasibility or timeline, but not directly involved in estimate creation.

**Installer:** Not involved yet.

### Information Flow

**Data in (from engine):**
- Material quantities: auto-calculated from room measurements × trade scope
- Material costs: from catalog prices (pre-populated from discovery preferences)
- Labor hours: from SOP task templates (e.g., "LVP install = 0.04 hrs/sqft × crew tier multiplier")
- Labor costs: hours × crew wage rates (per trade, per tier)
- Overhead: OH-MATL, OH-MEET, OH-ADMIN, OH-DISC applied per SOP rules
- Contingency: 10–20% based on condition assessment risk score
- Margin: configurable per project

**Data created:**
- Estimate record with line items, grouped by room and trade
- Proposal document (PDF or portal link)
- Good/Better/Best options if budget allows multiple tiers
- Activity event: `estimate.created`, `estimate.sent`

**Communicated to:**
- Homeowner: Proposal via email + portal link. Clean, branded, mobile-friendly. Shows scope, materials (with photos of selected products), timeline, and total. If VR walkthrough was done, includes a link to "See your space with these materials."
- Manager: Estimate dashboard shows margin analysis, risk flags, and comparison to similar past projects.

### Gate to Phase 3 → 4
Homeowner has received the proposal. Manager has reviewed margins and is confident the price is profitable. If the homeowner has questions, they're answered before moving to approval.

### App Experience

**Manager-facing (estimate builder):**
The estimate builder auto-populates from discovery data. The manager reviews and adjusts — they're not building from scratch. The interface shows:
- Room-by-room breakdown with material + labor line items
- "Auto-filled from discovery" badge on pre-populated items
- Red flags for risk areas ("Subfloor condition unknown — added 15% contingency")
- Margin calculator: adjust margin %, see total change in real-time
- One-click "Generate Proposal" → creates the homeowner-facing view

**Good/Better/Best presentation:**
If the budget allows, the system generates three tiers automatically:
- **Good:** Budget-friendly materials, standard scope. Fits their stated budget floor.
- **Better:** Recommended materials (from their preference profile). Fits their stated budget midpoint.
- **Best:** Premium materials, expanded scope (e.g., add crown moulding). At or slightly above their stated budget ceiling.

Each tier shows the total and a clear diff from the previous tier: "Better adds: upgraded LVP ($1.50/sqft more), 2 coats of paint instead of 1. +$2,100."

**Homeowner-facing (portal proposal):**
The proposal appears in the client portal as a dedicated page. Not a PDF download — a live, interactive page:
- Hero section: project name, address, their selected design style photo
- Scope summary in plain English per room
- Material selections with product photos (clickable to see details)
- Timeline overview: "~4 weeks, starting [date]"
- Price section: total with optional add-ons as toggles ("Add crown moulding to living room: +$850")
- "Approve" button → moves to Phase 4
- "Questions?" → opens message to manager

**Instant estimate accuracy check:**
Compare the actual estimate to the instant estimate they saw in Phase 1. If within range, reinforce trust: "Your final estimate of $9,800 is right in the range we estimated initially." If outside, explain why: "The tile backsplash you added during discovery brought the total above our initial range."

### Where Labs Fits
- **Labor hour estimates** are derived from SOP task templates, refined by Labs timing data from completed projects. The more jobs tracked, the tighter the estimates.
- **Material cost trends** from Labs inform whether to lock pricing now or flag potential increases.
- **Quality justification:** If recommending a specific product, Labs testing data provides credibility: "We recommend this LVP because our durability testing showed..."

---

## Phase 4: Approval / Contract

### Purpose
The homeowner commits. Scope, price, and timeline are locked. This is the psychological moment where "maybe" becomes "let's go." The app should make this feel exciting and easy, not bureaucratic.

### Stakeholder Experience

**Homeowner — Needs to feel:**
- "I'm confident this is the right decision"
- "I know exactly what's going to happen and when"
- "I know who to contact if something comes up"
- "This is exciting — my space is about to transform"

**What they do:** Review final scope, sign (digital signature or explicit approval tap), acknowledge the schedule, and make the deposit payment.

**Manager — Needs to know:**
- Approval is documented
- Deposit is received
- The scope is locked (any changes from here are change orders)
- The project can be scheduled

**What they do:** Receive approval notification, confirm deposit, transition project to planning status.

**Operator:** Receives notification that a new project is approved and coming to the schedule.

**Installer:** Not involved yet.

### Information Flow

**Data in:**
- Homeowner approval (timestamp, method)
- Deposit payment (amount, method, confirmation)
- Signed scope (the exact proposal version they approved)

**Data created:**
- Project status: `approved`
- Contract record: locked scope snapshot (this is the baseline — any deviation is a CO)
- Payment record: deposit
- Activity events: `project.approved`, `payment.deposit_received`
- Budget created from estimate (estimate → budget conversion at crew wage rates)

**Communicated to:**
- Homeowner: "You're all set! Here's your project timeline." Welcome packet with: team contact info, what to expect, how the portal works, prep instructions (e.g., "clear furniture from rooms by [date]").
- Manager: Project moves to planning queue on dashboard.
- Operator: New project notification with high-level scope.

### Gate to Phase 4 → 5
Approval documented. Deposit received. Scope snapshot locked. Project status is `approved`. Manager has confirmed crew availability for the target timeline.

### App Experience

**Homeowner-facing (portal):**
The approval flow is a dedicated screen in the portal — not a separate contract document. It shows:
1. Final scope summary (what they're getting)
2. Total price with payment schedule (deposit now, progress payments, final)
3. Timeline with key milestones
4. Digital signature or "I Approve This Scope" button (big, teal, satisfying)
5. Payment integration for deposit
6. After approval: the portal transitions to the "active project" view with a countdown to start date

**The "Welcome" moment:**
After approval, the portal shows a congratulatory state: "Your renovation starts in [X] days! Here's what happens next..." with a visual timeline. This is where the homeowner starts to feel the Hooomz difference — they're not wondering what happens next, they're being guided through it.

**Manager-facing:**
One-tap approval confirmation. The system auto-generates the budget from the approved estimate, creates the task templates from SOPs, and queues the project for planning. The manager's next action is clear: "Assign crew and order materials."

### Where Labs Fits
- The locked scope becomes the baseline for Labs data collection. Every deviation during execution is tracked against this baseline — that's how Labs learns about estimate accuracy.
- The budget created here feeds the time-clock and cost-tracking system built in the integration builds.

---

## Phase 5: Planning

### Purpose
Turn the approved scope into an executable plan. Crew assigned, materials ordered, schedule built, tasks deployed. This is the manager and operator's phase — the homeowner just needs to know "we're getting ready, here's your start date."

### Stakeholder Experience

**Homeowner — Needs to feel:**
- "Things are moving"
- "They're prepared"
- "I know when it starts"

**What they see:** Portal updates: "Your team is confirmed," "Materials ordered," "Start date confirmed: [date]." Minimal detail — just confidence signals.

**Manager — Needs to know:**
- Which crew members are assigned and available
- Are materials ordered and delivery confirmed?
- Is the schedule realistic given crew capacity and trade sequencing?
- Are there any certification gaps? (training gate)

**What they do:** Assign crew, order materials, build the schedule (or confirm auto-generated schedule), deploy task blueprints from SOPs, verify certifications.

**Operator — Needs to know:**
- What project is coming next?
- What's the scope (high level)?
- When does it start?
- What materials/tools are needed?

**What they do:** Review upcoming project, confirm availability, review SOPs for any unfamiliar tasks.

**Installer — Needs to know:**
- "You're needed for [trade] at [address] starting [date]"
- Scope for their specific trade
- What's done before them, what follows after
- Access instructions

**What they do:** Confirm availability, review scope.

### Information Flow

**Data in:**
- Crew assignments (from CrewMember records, matching trade specialties + certifications to scope)
- Material orders (generated from estimate quantities, submitted to suppliers)
- Schedule (auto-generated from SOP phase templates, adjusted for crew availability)

**Data created:**
- Deployed tasks: SopTaskBlueprint → DeployedTask for each room × trade × SOP step
- Loop contexts: LoopContext + LoopIteration for each phase of work
- Crew assignments per task
- Material order records
- Schedule with milestones
- Activity events: `crew.assigned`, `materials.ordered`, `schedule.confirmed`

**Communicated to:**
- Homeowner: "Your project starts [date]. Your team: [names]. Please have [prep instructions] complete by [date]."
- Operator: Full project briefing — scope, schedule, SOPs, materials list, crew assignments
- Installer: Trade-specific scope package with dates and access info
- Manager: Planning dashboard shows readiness checklist (crew ?, materials ?, schedule ?, certs ?)

### Gate to Phase 5 → 6
All crew assigned and confirmed. Materials ordered (delivery before or on start date). Schedule published. All assigned crew members meet certification requirements for their tasks (soft training gate — flags, doesn't block). Homeowner notified of start date. Prep instructions communicated.

### App Experience

**Manager-facing:**
Planning is a checklist-driven screen for the approved project:
- [ ] Crew assigned (drag-drop crew members to trades, system flags cert gaps)
- [ ] Materials ordered (auto-generated order list, one-click submit to supplier)
- [ ] Schedule confirmed (auto-generated from SOP templates, Gantt-style view for manager, simple milestone list for everyone else)
- [ ] Homeowner notified (auto-send when all above are checked)

The loop deployment system (Build 3d) auto-creates the task structure from the approved scope + SOPs. The manager reviews and adjusts, but doesn't build from scratch.

**Operator-facing:**
"Upcoming Projects" section shows the next project with:
- Start date, address, scope summary
- "Review SOPs" link for any tasks they haven't done recently
- Materials list for what they need to bring vs. what's being delivered
- Crew list (who they're working with)

**Installer-facing:**
Simple, clear trade package:
- "You're doing [trade] at [address]"
- Start date, estimated duration
- Scope for their trade only (not the whole project)
- What's happening before them (so they know the state of the space)
- Contact info for the project lead

### Where Labs Fits
- **Training gate check:** The system verifies crew certifications against SOP requirements. If Nishant hasn't completed supervised LVP installs yet, the system flags it: "Nishant needs 1 more supervised install for LVP certification."
- **SOP deployment:** Task blueprints from SOPs include checklist items, which include Labs data capture points. Planning is when these get deployed.
- **Historical data:** Labs data from past projects informs scheduling estimates (how long does this crew actually take for this type of work?).

---

## Phase 6: Execution

### Purpose
The work happens. This is where the app earns its keep — it's the difference between "a project management tool" and "a trusted foreman." Every day, every task, every trade needs to know what's done, what's next, and whether anything has changed.

This is also where all four stakeholders are active simultaneously and need different views of the same reality.

### Stakeholder Experience

**Homeowner — Needs to feel:**
- "I can see progress without bothering anyone"
- "Nothing is surprising me"
- "They're doing quality work"
- "If something changes, I know about it before it becomes a problem"

**What they see:** Daily or per-milestone portal updates with photos, progress percentage, and plain-English descriptions: "Flooring installed in master bedroom and living room today. Kitchen scheduled for tomorrow." If a change order is needed, they see it clearly before it happens.

**Manager — Needs to know:**
- Is the project on schedule?
- Is the budget tracking?
- Are there quality issues or deviations?
- Are change orders needed?
- Is the homeowner happy?

**What they do:** Monitor dashboard health scores, review daily logs, approve change orders, handle escalations, communicate with homeowner on significant updates.

**Operator — Needs to know:**
- What am I doing today?
- What's the SOP for this task?
- Where are my materials?
- How do I log progress?
- What do I do if something's wrong?

**What they do:** Clock in, follow SOP checklists, capture progress photos, log task completion, flag deviations, request change orders. All from their phone, with gloves on.

**Installer — Needs to know:**
- What's my scope today?
- What's the state of the space (what's done before me)?
- Where do I put my waste?
- Who do I talk to if there's an issue?

**What they do:** View their trade-specific scope, mark tasks done, flag any issues or conditions that affect their work.

### Information Flow

**Data in (continuous):**
- Task completions: per-checklist-item confirmations
- Time clock: per-task start/pause/stop (persistent floating widget, 15min idle detection)
- Photos: tagged to task, room, trade (before/after from checklist structure)
- Deviations: confirm-or-deviate UX at each checklist step
- Change orders: scope additions/modifications with cost impact
- Material usage: actual vs. estimated quantities
- Field observations: conditions discovered during work (Labs data)

**Data created:**
- Activity events (continuous): `task.started`, `task.completed`, `checklist.item_checked`, `deviation.reported`, `change_order.requested`, `photo.captured`, `time.logged`
- Budget actuals: actual hours × actual wage rates vs. estimated
- Progress calculations: tasks complete / total tasks per room, per trade, per project
- Health score updates: rolling up from task-level to loop-level to project-level
- Labs observations: field conditions, material performance notes, deviation records

**Communicated to:**
- Homeowner (portal): Daily progress summary with photos. Change order notifications with scope + cost impact + approve/discuss buttons. Milestone celebrations ("Flooring complete!").
- Manager (dashboard): Health score trends, budget vs. actual, timeline tracking, change order approvals needed. Red flags surfaced proactively.
- Operator (task view): Next task, SOP checklist, deviation log.
- Installer (trade view): Their remaining scope, completion status.

### Gate to Phase 6 → 7
All tasks in scope marked complete. No open change orders (all approved or rejected). Budget actuals recorded. Progress photos captured for all major milestones. The work is done — now it needs to be checked.

### App Experience

**Operator-facing (the daily driver):**
This is where mobile-first for dirty hands matters most. The operator's view is:
1. **Today's tasks** — ordered by sequence, showing room + trade + SOP step
2. **Active task** — the current SOP checklist with one-thumb checkboxes. Each step: tap to confirm, or "Deviate" to log why it's different.
3. **Quick actions** — the QuickAdd button for common events: Done, Photo, Note, Time, Blocked, Delivery, Material. Filtered by role (operator sees most, installer sees fewer).
4. **Time clock** — floating widget, per-task tracking, auto-pause on idle.

The friction budget is 2-3 minutes per task. The SOP checklist is pre-filled with defaults. The operator only spends time on deviations.

**Manager-facing (project dashboard):**
The project detail page shows:
- Health score (rolling up from all loops)
- Budget panel: estimated vs. actual, burn rate, projected final cost
- Timeline panel: scheduled vs. actual, projected completion
- Risk panel: open deviations, pending COs, certification gaps
- Crew panel: who's assigned, hours logged, training progress
- Loop view: phase-by-phase progress with color-coded dots

**Homeowner-facing (portal):**
The portal during execution shows:
- Overall progress bar (simple, prominent)
- Progress by trade (flooring 80%, paint 60%, trim 40%)
- Recent updates feed with photos
- "Message Your Team" button
- Change order section (if any) with clear approve/discuss actions

**Change order flow:**
1. Operator discovers condition (e.g., water damage under carpet)
2. Operator logs deviation with photo
3. Manager reviews, creates change order with scope + cost
4. Homeowner sees CO in portal: "During flooring removal, we discovered water damage to the subfloor in the master bedroom. Repair and replacement: +$1,200. [Approve] [Discuss]"
5. Approval creates new tasks from SOP templates, adjusts budget and timeline
6. Activity log captures the full chain

### Where Labs Fits
This is Labs' primary data collection phase:
- **Checklist completion** captures confirm-or-deviate data at every SOP step. This is the core Labs dataset.
- **Field observations** are logged when conditions differ from expected (subfloor issues, wall conditions, material behavior). These feed the knowledge base.
- **Time data** per task per crew member feeds training analytics and future estimate accuracy.
- **Photo documentation** becomes the evidence base for material testing and SOP refinement.
- **Deviation patterns** across projects reveal systemic issues: "LVP adhesion problems in concrete-slab condos" becomes a knowledge item.
- **Batch capture:** Most observations are batched at task completion (not per-checklist-item) to stay within the friction budget. Time-sensitive observations (safety, material defects) trigger immediately.

---

## Phase 7: QC / Punch List

### Purpose
Verify the work meets standards before calling it done. Walk the space, identify deficiencies, fix them, and get sign-off. This is the quality checkpoint that protects both the homeowner's satisfaction and the company's reputation.

### Stakeholder Experience

**Homeowner — Needs to feel:**
- "They care about getting it right"
- "My concerns are heard and addressed"
- "This looks amazing"

**What they do:** Walk the space with the manager (or review via portal photos). Flag anything that doesn't look right. Sign off when satisfied.

**Manager — Needs to know:**
- What deficiencies exist?
- Which are legitimate quality issues vs. existing conditions?
- What's the cost/time to fix each?
- Is the homeowner satisfied?

**What they do:** Conduct walkthrough, document punch list items, assign fixes, verify completion, get homeowner sign-off.

**Operator — Needs to know:**
- What needs to be fixed?
- Where?
- What's the priority?

**What they do:** Fix punch list items, capture "after" photos, mark items complete.

**Installer:** Called back only if deficiency is in their trade's work.

### Information Flow

**Data in:**
- Punch list items: description, room, trade, photo, severity (cosmetic / functional / structural)
- Fix assignments: who, when
- Fix completions: before/after photos, time logged
- Homeowner sign-off: approval or additional items

**Data created:**
- Punch list records linked to rooms and trades
- Fix tasks (lightweight — not full SOP deployment)
- Activity events: `punchlist.created`, `punchlist.item_fixed`, `punchlist.signoff`
- Final photos: completed state of each room

**Communicated to:**
- Homeowner: "Here's what we found during walkthrough, here's when each item will be fixed." Then: "All items addressed — please review."
- Operator: Punch list with items to fix, prioritized.
- Manager: Punch list status, homeowner satisfaction signal.

### Gate to Phase 7 → 8
All punch list items resolved. Homeowner sign-off received (digital approval in portal). Final photos captured for every room. Project quality verified.

### App Experience

**Manager-facing (walkthrough mode):**
A special "Walkthrough" mode on the project: room-by-room navigation, tap to add punch items with photo + description + severity. Quick and thumb-friendly — you're walking and tapping, not typing essays.

**Operator-facing:**
Punch list appears as a task list, similar to execution but lighter weight. Each item: room, description, photo of issue, tap to mark fixed + capture "after" photo.

**Homeowner-facing (portal):**
Portal shows punch list progress:
- Items found: X
- Items fixed: Y
- "Review & Approve" button when all fixed
- Before/after photos for each item

### Where Labs Fits
- **Punch list patterns** feed Labs: if the same deficiency appears across projects (e.g., "caulk separation at LVP-to-tile transition"), that becomes a knowledge item and potentially a new SOP checklist item.
- **Quality scoring** contributes to crew performance data — lower punch list counts for a crew member improves their quality metric in the training system.
- **Material performance:** Punch items related to materials (e.g., "scratch visible on LVP after 1 week") become field observations linked to specific products.

---

## Phase 8: Closeout

### Purpose
Wrap up the project administratively. Final payment, warranty documentation, and a clean handoff. The homeowner should feel like they're being taken care of even after the work is done.

### Stakeholder Experience

**Homeowner — Needs to feel:**
- "Everything is documented"
- "I know what's covered if something goes wrong"
- "These people were great to work with"
- "I'd recommend them"

**What they do:** Make final payment. Receive warranty and documentation package. Provide feedback/review. Receive their Hooomz Profile link.

**Manager — Needs to know:**
- Is final payment received?
- Is all documentation complete?
- Is the homeowner happy enough to refer?
- What did we learn from this project?

**What they do:** Send final invoice, deliver documentation, request review, conduct internal debrief, close project.

**Operator:** Internal debrief participation. Review what went well and what to improve.

**Installer:** Warranty info for their trade's work.

### Information Flow

**Data in:**
- Final payment (amount, method, confirmation)
- Homeowner feedback / satisfaction score
- Warranty registrations (per product, per trade)
- Internal debrief notes

**Data created:**
- Project status: `complete`
- Final invoice + payment record
- Warranty records per room per trade (duration, coverage, manufacturer info)
- Homeowner satisfaction record (score + comments)
- Activity event: `project.completed`, `payment.final_received`
- **Hooomz Profile data:** everything about this project becomes part of the home's digital passport

**Communicated to:**
- Homeowner: "Your project is complete!" with: final invoice, warranty documentation, care/maintenance guide, Hooomz Profile link, review request.
- Manager: Project closed on dashboard, margin analysis available, Labs data summary.

### Gate to Phase 8 → 9
Final payment received. Warranty documentation delivered. Homeowner satisfaction captured. Project status `complete`. Hooomz Profile updated.

### App Experience

**Manager-facing:**
Closeout checklist:
- [ ] Final walkthrough approved (from Phase 7)
- [ ] Final invoice sent
- [ ] Payment received
- [ ] Warranty documentation delivered
- [ ] Care guide sent
- [ ] Review requested
- [ ] Internal debrief complete
- [ ] Hooomz Profile updated

**Homeowner-facing (portal):**
Portal transitions from "active project" to "completed project" view:
- Before/after photo gallery (auto-compiled from execution photos)
- Warranty info organized by room and trade
- Care instructions per material ("Your LVP floors: clean with damp mop, avoid standing water, use felt pads on furniture")
- **Hooomz Profile preview:** "Your home now has a digital profile. View it anytime at [link]."
- Review prompt: "How was your experience? [Stars] [Comment]"
- Referral prompt: "Know someone who could use a refresh? [Share link]"

### Where Labs Fits
- **Project retrospective:** Labs data from the entire project is aggregated — time estimates vs. actuals, material quantities vs. actuals, deviation patterns, training outcomes. This feeds future estimate accuracy and SOP refinement.
- **Product performance baseline:** The materials installed become baseline records. Future maintenance or callback data will track how they perform over time.
- **Crew performance:** Overall project metrics feed crew member performance profiles — certification progress, quality scores, productivity metrics.

---

## Phase 9: Follow-up

### Purpose
The relationship doesn't end at closeout. This phase is about long-term value: maintenance subscriptions, future work, referrals, and the Hooomz Profile as a living document. This is where Hooomz Maintenance, Profile, and the referral flywheel kick in.

### Stakeholder Experience

**Homeowner — Needs to feel:**
- "They still care about my home"
- "My investment is protected"
- "I can trust them for future work"

**What they see:** Periodic portal updates (maintenance reminders, seasonal tips), Hooomz Profile accessible anytime, easy path to new work.

**Manager — Needs to know:**
- Which completed clients are good referral or repeat candidates?
- Are maintenance subscriptions converting?
- Is the Hooomz Profile driving any inbound leads?

### Information Flow

**Data in (ongoing):**
- Maintenance subscription sign-ups
- Referral tracking (did they share? did the referral convert?)
- Profile views (is anyone looking at this home's profile?)
- Warranty claims or callback requests
- Seasonal maintenance check-in responses

**Data created:**
- Maintenance subscription records (Essential/Standard/Premium)
- Referral credits
- Profile engagement metrics
- Callback projects (linked to original via `linked_project_id`)
- Activity events: `maintenance.subscribed`, `referral.sent`, `callback.created`

**Communicated to:**
- Homeowner: Seasonal maintenance reminders, "Your floors are 6 months old — here's a care tip," referral incentives, news about new services.
- Manager: Referral pipeline, maintenance subscription metrics, repeat client opportunities.

### App Experience

**Homeowner-facing (ongoing portal):**
The portal for completed projects becomes a permanent home hub:
- Before/after gallery
- Warranty tracker with expiration reminders
- Maintenance schedule and tips
- "Start a New Project" button (easy repeat business)
- Hooomz Profile link (shareable — especially valuable at home sale)
- Maintenance subscription upsell (gentle, context-relevant)

**Manager-facing:**
Follow-up dashboard:
- Completed clients by recency
- Referral status (sent / clicked / converted)
- Maintenance subscription pipeline
- Repeat client signals ("Client X's paint is 2 years old — seasonal refresh?")

### Where Labs Fits
- **Long-term material tracking:** 6-month, 1-year, 2-year follow-ups capture how materials are performing. "How are your floors holding up?" responses become field observations.
- **Callback data:** If a client calls back with an issue, the callback project links to the original and creates a rich dataset: what was installed, when, by whom, and what failed.
- **Knowledge base growth:** Every completed project adds data points. Over time, Labs can say things like "In Moncton homes built 1970–1985, subfloor moisture issues occur in 30% of bathroom renovations" — that's invaluable for future estimates and SOPs.

---

## Cross-Cutting Concerns

### Instant Estimate & VR Walkthrough

**Instant Estimate** lives at the boundary of Phase 1 and Phase 2. It's a lead conversion tool, not a pricing tool:
- Phase 1: Homeowner describes rough scope → instant range appears. This is marketing — it says "we're in your price range, keep going."
- Phase 2: As discovery details are captured, the estimate refines in real-time. The homeowner sees the number evolve from "~$8,000–$12,000" to "$9,800" as they add rooms and preferences.
- Phase 3: The final estimate is precise, but the homeowner has been watching it converge — no sticker shock.

**VR Walkthrough** is a Phase 1 / Phase 2 tool, primarily for home shows and in-person discovery:
- At home shows: Visitor scans their room (ArUco markers or phone-based room scanning), selects materials, sees a VR preview. This data pre-fills their inquiry.
- During site visits: Manager scans rooms, applies proposed materials virtually, shows the homeowner on a tablet. "Here's what your living room looks like with this oak flooring."
- The VR data feeds directly into the project record — room dimensions from the scan, material selections from the visualization.

### Design Preferences Threading

Design preferences captured in Phase 2 should persist and influence every downstream decision:

| Phase | How Preferences Are Used |
|-------|-------------------------|
| **Discovery** | Captured via visual chooser (style cards, color palettes, material samples) |
| **Estimate** | Materials auto-selected to match preferences + budget. Good/Better/Best tiers all respect the stated style. |
| **Planning** | Material orders reflect the approved preferences. No substitutions without explicit approval. |
| **Execution** | SOP checklists reference the design spec: "Install [product name] per manufacturer specs" not "install flooring." |
| **QC** | Walkthrough checks that installed materials match the approved selections. |
| **Closeout** | Care instructions are specific to the installed materials. |
| **Follow-up** | Future recommendations respect the established style: "You loved warm oak — here's a matching dining table refinish option." |

### Budget / Allowance Shaping

The budget question ("Do you have a budget in mind?") asked early in Phase 2 shapes the entire experience:

- **If they provide a number:** All recommendations fit within it. The Good/Better/Best tiers are calibrated to it. The instant estimate refines around it.
- **If they say "What does it typically cost?":** The system shows ranges based on their scope, then asks "Does that feel comfortable?" This is the foreman approach — give them a number to react to, don't make them guess.
- **If they provide an allowance:** The system treats it as a hard ceiling and optimizes selections within it, with clear callouts if something pushes over: "This upgrade adds $800, which would bring you $200 over your allowance."
- **Budget is never hidden.** The running total is always visible during discovery. No one should reach the estimate phase and be surprised.

### How This Feels Different from Buildertrend / CoConstruct / Jobber

| Standard PM Software | Hooomz |
|---------------------|--------|
| Form-heavy intake | Conversational, visual, progressive disclosure |
| Homeowner is an afterthought | Homeowner has a dedicated portal from day one |
| Estimates are spreadsheets | Estimates are proposals with product photos and VR links |
| Change orders are PDF documents | Change orders are in-app approvals with clear cost impact |
| Progress updates are manual emails | Progress is live in the portal with auto-generated summaries |
| No material intelligence | Labs-powered recommendations with tested products |
| No training system | SOP-based execution with certification tracking |
| One-size-fits-all interface | Four stakeholder views from one data source |
| Desktop-first | Mobile-first for dirty hands |
| Project ends at final payment | Hooomz Profile makes every project a long-term relationship |

The core difference: standard PM software is built for the contractor's administrative needs. Hooomz is built around the **job flow** — the natural progression of a renovation — with every stakeholder getting the right information at the right time in the right format.

### Division Duplication (Exteriors / Maintenance)

The phase structure is **shared across divisions**. What changes per division:

| Shared (OS-level) | Division-Specific |
|-------------------|-------------------|
| Lead management & inquiry flow | Trade types and SOP library |
| Discovery framework (property, preferences, budget) | Scope questions per trade |
| Estimate engine structure | Cost templates and labor rates |
| Approval / contract flow | Warranty terms |
| Planning framework (crew, materials, schedule) | Material catalogs |
| Execution engine (tasks, time, checklists) | Checklist items per SOP |
| QC / punch list flow | Quality criteria per trade |
| Closeout flow | Care guides per material |
| Follow-up & Profile | Maintenance schedules per material |
| Activity log structure | Event types per division |
| View mode system | Role definitions may differ |

**Exteriors (Brisso):** Same 9 phases, but trades are roofing, siding, windows, doors, decks, concrete. Different SOPs, different materials, different seasonal constraints (can't roof in January in Moncton). Danovan operates this division.

**Maintenance:** Phases 1-4 collapse into a subscription sign-up. Phases 5-6 become scheduled service visits. Phase 7 is the service report. Phases 8-9 are ongoing by definition (subscription renewal). The activity log structure stays the same.

**What makes duplication possible:**
- The SOP system is already trade-agnostic — each division just has its own SOP library
- The estimate engine works from templates — swap in exterior templates
- The activity log structure doesn't care about trade types
- IndexedDB stores are typed but not division-specific
- The view mode system works across divisions (Manager/Operator/Installer/Homeowner applies to any renovation type)

### Hooomz Profile (Digital Home Passport)

The Profile is built **as a byproduct of doing the work** — not as a separate data entry exercise:

| Phase | Profile Data Generated |
|-------|----------------------|
| **Discovery** | Property details, room inventory, existing conditions, photos of current state |
| **Estimate** | Scope of proposed work |
| **Execution** | Materials installed (brand, product, color, SKU), installation dates, installer certifications, before/during/after photos |
| **QC** | Quality verification records |
| **Closeout** | Warranty records, care instructions, final photos |
| **Follow-up** | Maintenance history, material performance over time |

The Profile becomes increasingly valuable with each project:
- First project: "Flooring replaced with Lifeproof Sterling Oak LVP, installed 2026-03, 2-year warranty"
- After Maintenance subscription: "+ Annual inspection results, moisture readings, wear assessment"
- After second project: "+ Paint refreshed 2027-06, Benjamin Moore Regal Select, Repose Gray"
- At home sale: Complete renovation history with photos, warranties, and performance data. "Carfax for homes."

The Profile QR code on the property means any future buyer, inspector, or insurance adjuster can see the full history. This is the long-term moat — once a home has a Hooomz Profile, it's connected to the ecosystem forever.

---

## Summary: The Job Flow as a Conversation

| Phase | The Foreman Says | The Engine Does |
|-------|-----------------|----------------|
| **Inquiry** | "Tell me what you're thinking." | Captures lead, scores priority, shows instant estimate |
| **Discovery** | "Let me walk the space with you." | Captures property, preferences, budget; pre-fills everything downstream |
| **Estimate** | "Here's what it'll run you, and here are your options." | Calculates materials, labor, margin; generates Good/Better/Best |
| **Approval** | "Ready to go? Here's the plan." | Locks scope, creates budget, deploys task templates |
| **Planning** | "We're getting set up. Start date is Tuesday." | Assigns crew, orders materials, builds schedule, checks certs |
| **Execution** | "Here's what we did today." | Tracks tasks, time, deviations, photos, costs, Labs observations |
| **QC** | "Let's walk it together and make sure you're happy." | Documents punch items, tracks fixes, captures sign-off |
| **Closeout** | "You're all set. Here's everything you need." | Final payment, warranties, Profile update, review request |
| **Follow-up** | "How's everything holding up?" | Maintenance reminders, referral tracking, long-term material data |

The app doesn't feel like software. It feels like having the best foreman in the province on your team — one who never forgets a detail, always knows the numbers, and makes the homeowner feel like their project is the only one that matters.
