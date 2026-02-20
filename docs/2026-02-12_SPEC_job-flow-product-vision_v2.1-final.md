HOOOMZ INTERIORS
Job Flow & Product Vision
Merged Working Document  |  v2.1 Final  |  February 2026
Nathan Montgomery  •  Red Seal Journeyman Carpenter  •  Moncton, NB
Merged from: Opus v1.0 + Claude Code v1.0 + CC comparison + conversation history

Table of Contents
1.  Product Philosophy & Guiding Principles
2.  Stakeholder Model
3.  Phase 1: Inquiry
4.  Phase 2: Discovery
5.  Phase 3: Estimate / Proposal
6.  Phase 4: Approval / Contract
7.  Phase 5: Pre-Construction
8.  Phase 6: Execution
9.  Phase 7: QC / Punch List
10.  Phase 8: Closeout
11.  Phase 9: Follow-up
12.  Cross-Cutting: Change Order Architecture
13.  Cross-Cutting: Design Preferences Thread
14.  Cross-Cutting: Budget / Allowance Shaping
15.  Cross-Cutting: Instant Estimate & VR
16.  Cross-Cutting: Payment Architecture
17.  How This Feels Different
18.  Division Portability
19.  Hooomz Profile (Digital Home Passport)
20.  Appendix A: Data Model Summary
21.  Appendix B: Activity Log Events
22.  Appendix C: The Foreman Summary

1. Product Philosophy & Guiding Principles
Heavy Engine, Light Touch
The Hooomz platform is built on a fundamental asymmetry: the backend is a deeply detailed project management, sales, and knowledge engine—material costs, labor rates, SOP sequences, trade dependencies, certification requirements, historical Labs data, product catalogs—while the frontend presents all of this as a calm, confident, conversational experience.
The analogy is a trusted foreman. A good foreman doesn’t hand you a clipboard. They walk the site, ask smart questions (“keeping the baseboards or replacing?”), remember context (“you mentioned you like that warm oak look”), and give confident answers (“we can do that, here’s what it’ll run you”). The complexity lives in their experience, not in your experience.
The Clipboard Test
Every screen must pass this test: “Would a foreman hand someone a clipboard for this, or would they just have a conversation?” If the answer is clipboard, the screen needs redesign.
Default Aggressively
A 1,200 sqft bungalow in Moncton with LVP flooring has predictable dimensions, material quantities, and costs. Pre-fill everything. Let the user correct exceptions. Ask fewer questions, but smarter ones. Show confidence: “This typically runs $8,000–$12,000” is more useful than a blank field labelled “Budget.” Reveal complexity progressively—the homeowner sees a progress bar, the operator sees task checklists, the manager sees the full P&L. Same data, different lenses.
Friction Budget
Field tasks target 2–3 minutes maximum. The system pre-fills from SOP defaults; operators only touch what deviates. Typing is minimized. Touch targets are 44px minimum—designed for gloved, dirty hands in outdoor light.
Activity Log as Spine
Every meaningful action writes an immutable, append-only event to the Activity Log. The log is the single source of truth for project state. Status is derived, never set directly. Health scores roll up from task-level data. Floor plan elements reflect loop state, not the other way around.
Offline-First
IndexedDB with 40+ stores. Field-level merge on reconnect. Append-only stores eliminate conflict resolution for the most common operations. The app must work in a basement with no signal.
Loop Lifecycle
A loop is an open obligation that must be resolved. Once created, a loop can only be closed by being completed, cancelled (legitimate scope item, decision made not to proceed), or removed (added in error, should never have existed). Pre-contract, loops can be freely created and modified. Post-contract, new loops require a change order with clear payment responsibility. This is the financial accountability gate.


2. Stakeholder Model
Every phase of a job involves up to four stakeholders. The app presents the same underlying data through four different lenses, each optimized for what that person needs to know, do, and feel.
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager (Nathan)
Full picture: sales pipeline, margins, schedule conflicts, Labs data, crew capacity, multi-project calendar
Estimate, close, plan, QC, strategic decisions, resolve scheduling conflicts
In control, informed, never surprised
Operator (Nishant / Danovan)
Today’s tasks, SOP steps, material locations, what’s done vs. next, training progress
Execute SOPs, log progress, flag issues, capture photos, log deviations
Clear on expectations, supported, learning
Trade Partner (Installer)
Their scope only, site access, what’s prepped for them, timeline, design intent
Execute their trade, confirm completion, note issues
Respected, well-prepared-for, not micromanaged
Homeowner (Client)
Timeline, cost, what’s happening today, what decisions they need to make, running total
Approve scope, select products, approve changes, make payments
Confident, informed, no surprises, excited about the result


View mode toggle: The app’s four-perspective toggle (Manager / Operator / Installer / Homeowner) maps directly to this model. Each stakeholder sees the same project through their lens. The Client Portal at /portal/[projectId] is the homeowner’s read-only, notification-receiving window into their project.

3. Phase 1: Inquiry
Purpose
Capture interest at the moment it exists. Someone wants work done—the system’s job is to acknowledge that interest, collect the minimum viable information, and give something valuable back (a ballpark range) before asking for anything else. Speed and ease matter more than detail. The homeowner should feel heard and confident that someone competent will follow up.
Stakeholder Experience
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager
A new lead exists, source channel, rough scope, lead temperature (hot/warm/cool based on source + timeline)
Review lead, assign priority, schedule follow-up (site visit or call)
Pipeline is growing, no leads falling through cracks
Homeowner
Hooomz exists, what services are offered, rough cost range for their project
Answer 3–5 quick questions, get instant estimate, provide contact method
Impressed, low-friction, already getting value before committing

Information Flow
Data In
Contact: name, phone or email, preferred contact method
Lead source: home show, website, referral (from whom?), social, Google, repeat client, Ritchies
Rough scope signal: quick selection cards (“New floors” / “Paint + floors” / “Full interior refresh” / “Not sure yet”)
Timeline: “As soon as possible” / “Next few months” / “Just exploring”
Budget comfort zone: range picker (“Under $5K / $5–10K / $10–20K / $20K+ / Not sure”)
Photos (optional): phone camera upload of the space
If from home show: VR session ID linked (materials explored, dwell time per product)
Data Out
Instant Estimate: a confidence-building range, not a quote. “A project like this typically runs $8,000–$12,000 in the Moncton area.” Generated from the cost catalog using room count, trade mix, and historical averages.
Lead record created with status: new
Activity event: lead.created with source, timestamp, scope tags
Homeowner confirmation: “Thanks [name], we’ll be in touch within [timeframe]”
Lead card appears on Manager dashboard
Instant Estimate Engine
The instant estimate is not a detailed quote. It multiplies room count by trade-specific per-room averages from the Labs cost catalog, applies a regional adjustment, and returns a range (low/mid/high). The range is intentionally wide at this stage. A disclaimer is shown: “This is a preliminary range. Your actual estimate will be based on a site visit and detailed scope.” As more jobs are completed with Labs data capture, these averages sharpen. This is the beginning of the Labs flywheel.
VR Walkthrough at Home Shows
At home show booths, the Inquiry phase merges with Discovery. The homeowner scans ArUco markers or uses room scanning to see proposed materials virtually applied to a sample space. The VR session generates a lead record with embedded design preference signals (which materials they lingered on, which they selected). If they later visit the website, the inquiry form is pre-filled: “We loved meeting you at the show! Ready to make those floors happen?”
Gate Criteria
GATE CRITERIA
Contact method exists (phone or email—at least one)
At least one trade/scope signal captured
Lead record created in Activity Log (lead.created)
Instant estimate delivered (website) or verbal range given (in-person)
Next step scheduled: follow-up call or site visit date
Lead status moved to contacted or site_visit_scheduled

App Experience
Homeowner-Facing (Website / Home Show Kiosk)
A conversational intake—not a form. Progressive disclosure: answer one question, the next appears. Five fields max visible at once. Mobile-optimized with large touch targets.
Screen 1: “What are you thinking about?” — Tappable cards: Floors / Paint / Trim & Molding / Tile / Drywall / Not Sure Yet
Screen 2: “How many rooms?” — Stepper: 1–8+ or “Whole floor” toggle
Screen 3: “Do you have a budget range in mind?” — Range cards: Under $5K / $5–10K / $10–20K / $20K+ / Not sure
Screen 4: “Here’s what we’re seeing.” — Instant estimate range. CTA: “Let’s get specific—book a free site visit.”
Screen 5: “How should we reach you?” — Name + phone/email. Minimal.
Manager-Facing (Dashboard)
New leads appear as cards in a pipeline: New → Contacted → Site Visit Booked → Estimate Sent → Won/Lost. Each card shows: name, lead source badge, scope tags, budget range, instant estimate range, lead temperature indicator, days since created. One-tap actions: Call, Text, Schedule Site Visit. Additional sub-stages (e.g., Estimate Follow-up, On Hold) can nest within these phases as needed rather than adding top-level pipeline columns.
Where Labs Fits
LABS INTEGRATION
The instant estimate engine draws on Labs data: historical cost data per trade per sqft, regional pricing adjustments, material cost trends. Labs also provides the product imagery and specs used in VR walkthroughs—every product shown has been tested and rated. The more jobs completed with Labs data capture, the more accurate instant estimates become.


4. Phase 2: Discovery
Purpose
Understand the home, the person, their aesthetic preferences, their budget reality, and the existing conditions that will drive scope. This is where the foreman walks the site and asks smart questions. Discovery is actually two distinct conversations that feel like one natural flow:
The practical conversation: What’s the property? What rooms? What condition is everything in? What needs to happen?
The preference conversation: What do you like? What’s your style? What’s your budget? What matters most?
The system treats these as separate data layers—one feeds the estimate engine, the other feeds the recommendation engine—but the homeowner experiences them as a single guided conversation.
Stakeholder Experience
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager
Existing conditions, homeowner priorities, design direction, real budget, scope complexity, logistics constraints
Conduct site visit (or guided remote intake), assess conditions, capture photos/measurements, listen to what the homeowner actually wants
Has all the info needed to price confidently
Homeowner
What trades apply, what decisions they’ll need to make, that their preferences matter, running cost estimate
Walk guided questions, share preferences, confirm budget range, provide inspiration images
Heard, understood, that this company “gets it”—not being upsold

The Guided Intake (Redesigned)
The current intake has known issues: rooms added one at a time, disconnected sections, no design capture, no budget question, blank product fields, untailored questions. The redesigned Discovery flow solves all of these.

DECISION (MERGED)
Design preferences come BEFORE room details. If you know the homeowner wants warm oak before you scope the living room, the system pre-fills flooring recommendations on that room card in real time. This is the key ordering change from the current intake.


Step 1: Property Overview
Address (pre-fill from Inquiry if provided; triggers property age lookup)
Home type: single-family / semi / townhouse / condo / other
Approximate age: pre-1970 / 1970–1990 / 1990–2010 / 2010+
Parking/access: driveway? elevator? stairs? Affects logistics and labor.
Occupancy during reno? Pets?

Step 2: Design Preferences (NEW — before room scope)
A visual preference capture that feeds product recommendations downstream. Presented as a visual chooser, not a form:
Style: Card-based selection with photos (not text labels). Tap the kitchen that looks like yours. Options: Modern / Traditional / Transitional / Farmhouse / Coastal / Minimalist / “I don’t know, show me options”
Color direction: Palette swatches, not text fields. “Which of these feels like home?” Warm / Cool / Neutral / Bold / “Match what I have”
Floor look: Photo samples grouped by look: light wood / medium wood / dark wood / gray tones / tile look
Trim style: Clean/modern / Traditional profile / Craftsman / “Match existing”
Priority: “What matters most?” — Cost / Speed / Quality / Design (pick top 2)
Inspiration: Optional photo uploads (Pinterest, saved photos) or selections from a curated gallery
These preferences are stored as tags on the project and thread through every downstream phase: product recommendations, installer scope cards, QC checklists, and ultimately the Hooomz Profile.

Step 3: Room Selection (Multi-Select)
Instead of adding rooms one at a time, the system pre-populates a standard floor plan template based on property type and storeys (“Typical 3-bedroom bungalow: Kitchen, Living Room, 3 Bedrooms, Bathroom, Hallway”). The homeowner confirms, removes rooms they don’t need, adds missing ones. Options include:
“Entire main floor” / “Entire upstairs” toggles that add all standard rooms for that floor
Multi-select: tap multiple rooms, then batch-apply trades (“Flooring in all these rooms”)
Rooms display as a visual list with trade badges (FL, PT, FC, TL, DW) that toggle on/off per room

Step 4: Scope Per Room (Contextual Questions + Light Product Preview)
For each selected room (or batch), the system asks only the questions relevant to the trades indicated. If they said “floors and paint,” they don’t see tile or drywall questions. Questions flow as a guided sequence:
DECISION (MERGED)
Product preview uses the hybrid approach: during Discovery, the system shows one auto-recommended product per room per trade as a light preview—just the name, photo, and price. No choosing, no alternatives. The foreman equivalent: “I’d probably put this in here.” Full Good/Better/Best product selection happens in the Estimate phase. This keeps Discovery fast while making the running total product-based rather than average-based, and gives the homeowner something tangible to react to.


Flooring (shown only if floors selected):
“What’s on the floor now?” (photo + tap to select: carpet / hardwood / laminate / vinyl / tile / subfloor-only / unknown)
Action: replace / refinish / install over / remove only
Light preview appears: “For this room, we’d typically use [Lifeproof Sterling Oak LVP — $4.29/sqft]” with product photo. Auto-selected from preferences + budget. Homeowner sees it, running total updates, but they don’t choose yet.

Paint (shown only if paint selected):
Surfaces: walls only / walls + ceiling / walls + ceiling + trim / trim only
Current condition: good (refresh) / fair (some repair) / poor (significant prep)
Accent walls? (show room photo, tap the wall)
Light preview: one recommended paint line based on preference profile, e.g., “Benjamin Moore Regal Select — Warm Neutral palette.” Full colour selection in Estimate.

Trim/Finish Carpentry (shown only if trim selected):
Scope: baseboards / casings / crown molding / wainscoting / built-ins / closet systems
Replace existing or new install?
Style: auto-populated from design preferences (Step 2)

Tile (shown only if tile selected):
Application: floor / backsplash / shower/tub surround / full bathroom
Existing surface: remove old tile / install over / new substrate

Drywall (shown only if drywall selected):
Scope: patch/repair / full room / ceiling / partition wall
Finishing level: Level 3 (paint-ready) / Level 4 (smooth) / Level 5 (premium smooth)

Step 5: Budget Confirmation with Running Total
As rooms and trades are added in Steps 3–4, a running total updates in real time: “Your project is shaping up around $9,500.” The homeowner doesn’t see line-item pricing during discovery—they see the aggregate evolving.
This step formally revisits the budget range from Inquiry against the refined running total. If there’s a gap, the system flags it conversationally:
“Based on what you’ve described, this project typically runs $12,000–$16,000. You mentioned a budget around $10K. We can absolutely work with that—let’s look at where we can optimize.”
This prevents sticker shock at the Estimate phase. The formal estimate is never the first time a homeowner sees a price.

Step 6: Site Conditions (Manager captures on-site or from photos)
Room dimensions (measured or estimated from property type—default aggressively)
Subfloor condition (if accessible)
Moisture/damage observations
Electrical/plumbing interference for scope
Photos: tagged by room and condition type
This step is primarily the Manager’s job during a site visit. For remote intake, guided photo prompts appear: “Take a photo of the floor in your kitchen from the doorway.”
Light Product Preview (Hybrid Approach)
Once design preferences + budget are captured, the system auto-selects one recommended product per room per trade from the product catalog. The homeowner sees a product card (name, photo, price per unit) but doesn’t need to make a decision—this is a preview, not a commitment. The running total uses these real product prices rather than averages, making it more accurate. Full product selection with Good/Better/Best alternatives happens in the Estimate phase.
Gate Criteria
GATE CRITERIA
All selected rooms have scope defined for their relevant trades
Design preferences captured (at least style + palette + floor look)
Budget range confirmed or gap flagged and acknowledged
At least one contact method verified
Site conditions captured (photos + dimensions) OR remote intake photos received
Running total visible and within acknowledged range
Activity events: project.discovery_started, rooms.scoped, preferences.captured, project.discovery_complete

App Experience
The redesigned intake is a single, scrolling conversational flow—not a wizard with rigid steps. Progress is shown as a subtle vertical timeline on the left (desktop) or a top progress bar (mobile). The homeowner can jump between sections. Each section auto-saves on change. Headers are questions (“Which rooms are we working on?” not “Room Selection”).
On the Manager side, the site visit view is a room-by-room checklist with quick-capture tools: tap to photo, tap to note, tap to flag. Dimensions can be entered numerically or via the room scanner (Vision division integration point).
VR Walkthrough During Site Visit
During on-site Discovery, the Manager can scan rooms and apply proposed materials virtually using a tablet, showing the homeowner options in real time. “Here’s what your living room looks like with this oak flooring.” The VR data feeds directly into the project record: room dimensions from the scan, material selections from the visualization. This is the second of three VR touchpoints (home show → site visit → proposal).
Where Labs Fits
LABS INTEGRATION
Labs data informs the condition assessment: if a home is pre-1970, the system prompts for asbestos-era materials awareness. Product recommendations draw from Labs material testing data (“Hooomz Labs rated: 4.2/5 for durability”). Labs SOPs define what constitutes each condition rating (good/fair/poor) so assessments are consistent across projects. SOP awareness also drives which questions to ask: if the LVP install SOP has a checklist item “check subfloor flatness,” the discovery flow asks about subfloor condition.


5. Phase 3: Estimate / Proposal
Purpose
Translate Discovery data into a priced proposal the homeowner can understand, trust, and act on. This is where the “heavy engine” does its heaviest work—calculating material quantities, labor hours, trade sequencing, contingency, and margin—but the homeowner just sees a clean, confident proposal. The system auto-generates the estimate; the Manager reviews and adjusts. No manual spreadsheet work.
Stakeholder Experience
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager
Margin targets, material costs, labor rates, trade partner pricing, schedule capacity, risk areas
Review auto-generated estimate, adjust line items, review margin, customize proposal, approve for delivery
Confident in the numbers, fast turnaround
Homeowner
What they’re getting, what it costs, what’s included vs. excluded, product options at multiple tiers, timeline
Review proposal, compare tiers, toggle add-ons, ask questions, request changes
Transparent, fair, professional, excited about product choices

Information Flow
Auto-Generation
The estimate builder pulls from Discovery data and auto-populates:
Line items per room per trade, with quantities derived from room dimensions
Material costs from the product catalog, filtered by design preferences and budget range
Labor hours from SOP task templates (e.g., “LVP install = 0.04 hrs/sqft × crew tier multiplier”)
Labor costs: hours × crew wage rates (per trade, per tier)
Overhead: OH-MATL, OH-MEET, OH-ADMIN, OH-DISC applied per SOP rules
Contingency: 10–20% based on condition assessment risk score
Margin: configurable per project
Good / Better / Best Tiers
If the budget allows, the system generates three proposal-level tiers automatically:
Good: Budget-friendly materials, standard scope. Fits their stated budget floor.
Better: Recommended materials (from their preference profile). Fits their stated budget midpoint.
Best: Premium materials, expanded scope (e.g., add crown moulding). At or slightly above their stated budget ceiling.
Each tier shows the total and a clear diff from the previous tier: “Better adds: upgraded LVP ($1.50/sqft more), 2 coats of paint instead of 1. +$2,100.”
All three tiers respect the homeowner’s stated design preferences. Labs ratings appear on each product recommendation.
DECISION (MERGED)
The homeowner sees proposal-level tiers (Good/Better/Best) with toggle add-ons in the portal. The Manager sees line-item granularity with per-product selection within each tier. Both views exist—the homeowner gets simplicity, the Manager gets control.

Estimate → Budget Conversion
The estimate calculates at retail rates (what the homeowner pays). A parallel Budget view converts to crew wage rates (what it costs Hooomz to deliver). The Manager sees both; the homeowner sees only the estimate. Margin is visible to the Manager per line item and in aggregate via a floating margin summary bar.
Instant Estimate Accuracy Check
Compare the actual estimate to the instant estimate from Phase 1. If within range, reinforce trust: “Your final estimate of $9,800 is right in the range we estimated initially.” If outside, explain why: “The tile backsplash you added during discovery brought the total above our initial range.”
Proposal Delivery
The proposal is delivered via the Client Portal—a live, interactive page, not a PDF:
Hero section: project name, address, design style photo
Scope summary in plain English per room (“Your living room floors: Mannington Honey Maple engineered hardwood” not “LVG-ENG-HM, 186sf @ $5.89/sf”)
Material selections with product photos and Labs ratings (clickable for details)
Timeline overview: “~4 weeks, starting [date]”
Total price with optional add-ons as toggles (“Add crown moulding to living room: +$850”)
If VR walkthrough was done, link to “See your space with these materials”
CTA: “Approve & Schedule” or “I Have Questions” (opens messaging)
Gate Criteria
GATE CRITERIA
All line items priced (no blank fields)
Product selections made for all material line items (or deferred to “your recommendation”)
Margin reviewed by Manager and within target range
Risk areas flagged with appropriate contingency
Proposal reviewed by Manager before delivery (no auto-send)
Activity events: estimate.created, estimate.reviewed, proposal.sent

App Experience
Manager Side (Estimate Builder)
The estimate builder auto-populates from Discovery data. The Manager sees a room-by-room editor with expandable trade sections. Each line item shows: description, quantity, unit, unit cost, total, margin %, and a product selector (pre-filtered by preferences). “Auto-filled from discovery” badges on pre-populated items. Red flags for risk areas (“Subfloor condition unknown—added 15% contingency”). A margin summary bar floats at the bottom. One-click “Generate Proposal” creates the homeowner-facing view.
Homeowner Side (Client Portal — Proposal View)
The proposal is not a PDF—it’s a live, interactive page. Visual product cards with swatches replace line-item tables. Add-ons toggle on/off with the total updating in real time. The tone is descriptive, not technical.
Where Labs Fits
LABS INTEGRATION
Labs provides product ratings shown in recommendations. Every product has a Labs test score, durability rating, and installation notes surfaced as tooltips (“Why engineered over solid for this room?”). Labs installation SOPs feed labor time estimates used for pricing. Material cost trends from Labs inform whether to lock pricing now or flag potential increases. Past project data informs comparison: “Similar projects averaged $X.”


6. Phase 4: Approval / Contract
Purpose
Convert the proposal into a binding agreement. The homeowner commits to scope, price, product selections, and timeline. The contract protects both parties and sets clear expectations. Deposit is collected. This is the psychological moment where “maybe” becomes “let’s go.” It should feel like a handshake, not a legal gauntlet.
Stakeholder Experience
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager
Homeowner is ready, scope questions resolved, crew has capacity for target timeline
Generate contract from approved estimate, collect deposit, confirm start date
Deal closed cleanly, no ambiguity, scope is locked
Homeowner
Exactly what they’re getting, what it costs, when it starts, what’s expected of them, change order policy
Review contract, e-sign, pay deposit
Excited to start, confident in the plan, no buyer’s remorse
Operator
A new project is approved and coming to the schedule
Receives notification with high-level scope
Aware of what’s coming, not overloaded

Information Flow
Contract generated from approved estimate: scope, price, products, timeline, payment schedule, warranty terms, change order policy
E-signature captured (integrated or via DocuSign/HelloSign link)
Deposit payment processed (Stripe, e-transfer, or manual entry)
DECISION (MERGED)
Payment schedule defaults: 30% deposit at contract / 40% at rough completion / 30% at closeout. These are rough defaults, easily editable per project by the Manager in the estimate builder. The system enforces that payment milestones are defined before contract generation.

Project status: approved. Locked scope snapshot created (this is the baseline—any deviation is a change order)
Budget created from estimate (estimate → budget conversion at crew wage rates)
Activity events: project.approved, payment.deposit_received, contract.signed
Homeowner receives: confirmation with portal link, start date, “what to expect” guide, team contact info, prep instructions
Client Portal unlocks full project tracking view (was proposal-only, now shows timeline and progress)
Gate Criteria
GATE CRITERIA
Contract signed by homeowner
Deposit received (amount per payment schedule)
Product selections finalized (no TBD items)
Start date confirmed and within schedule capacity
Payment schedule defined with milestone triggers
Homeowner “what to expect” guide delivered
Scope snapshot locked (baseline for change orders)
Activity events logged

App Experience
The approval flow is a dedicated screen in the Client Portal—not a separate contract document:
Final scope summary (what they’re getting)
Total price with payment schedule (deposit now, progress payments, final)
Timeline with key milestones
Key terms highlighted with plain-language summaries alongside legal language
Digital signature: tap to initial each section, signature at bottom, submit
Payment integration inline: select method, enter details, confirm
Progress indicator: Proposal → Contract → Deposit → Confirmed
After approval, a congratulatory state: “Your renovation starts in [X] days! Here’s what happens next...” with a visual timeline and calendar add CTA. This is where the homeowner starts to feel the Hooomz difference.
Where Labs Fits
LABS INTEGRATION
The locked scope becomes the baseline for Labs data collection. Every deviation during execution is tracked against this baseline—that’s how Labs learns about estimate accuracy. Product selections reference Labs test data as warranty support. Installation methods in the contract scope are linked to Labs SOPs.


7. Phase 5: Pre-Construction
DECISION (MERGED)
This phase was called “Planning” in both source documents. Renamed to “Pre-Construction” per established convention: Pre-Contract is the sales phase; Pre-Construction is the post-contract, pre-work phase. This phase now includes permit tracking as a first-class concern, plus crew assignment, material ordering, and schedule building.

Purpose
Convert the approved contract into an executable work plan. Crew is assigned, permits are pulled, materials are ordered, the schedule is built, and trade partner scopes are issued. This is where the “heavy engine” does its heaviest lifting: sequencing trades, calculating lead times, identifying dependencies, verifying certifications, and ensuring nothing falls through the cracks before the first tool touches the site.
Stakeholder Experience
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager
Crew availability across all projects (calendar view), permit requirements, material lead times, trade partner schedules, certification gaps
Assign crew, pull permits, order materials, sequence trades, issue scope to trade partners, build schedule, verify certs
Plan is tight, resources are locked, no loose ends
Operator
Their assigned projects, start dates, SOP sequence for their tasks, material delivery dates, tools needed
Review assigned scope, confirm availability, review SOPs for unfamiliar tasks, prep tools/vehicle
Clear on what’s coming, prepared, not overloaded
Trade Partner
Their scope, timeline, site access details, what will be prepped before they arrive, design intent
Confirm availability, review scope card, flag conflicts
Well-organized client, professional, scope is clear
Homeowner
Confirmed start date, week-by-week outline, any prep they need to do
Prepare the space as instructed (clear furniture, etc.)
It’s really happening, they’re organized, I’m in good hands

Information Flow
Permit Tracking
For scopes that require permits (electrical work via Danovan, structural modifications, plumbing reroutes), each permit becomes its own loop with a lifecycle:
Permit identified from scope (auto-flagged by SOP or manually by Manager)
Application submitted: status tracking (Applied → Under Review → Approved → Inspection Scheduled)
Inspection scheduling tied to execution timeline
Permit approval is a hard gate—affected tasks cannot start without it
For most Interiors work (flooring, paint, trim, tile, drywall), permits are not required. The system only surfaces permit tracking when the scope triggers it.
Loop Generation (Build 3d)
The approved scope auto-generates the project’s Loop structure using the existing Build 3d loop deployment system—nested containers organized by phase, each containing tasks derived from SOPs. Three-axis filtering applies:
Work Category (what): flooring, paint, trim, tile, drywall
Trade (who): which crew member or trade partner owns each task
Stage (when): demo → prep → install → finish → QC
Each Loop has a color-coded header dot and progress bar. Tasks within Loops inherit SOP defaults: expected duration, materials list, quality checkpoints, photo requirements.
Material Ordering
The material list is auto-generated from the estimate’s product selections and room quantities, plus SOP-defined consumables (underlayment, adhesive, primer, caulk, fasteners, tape). The Manager reviews, adjusts quantities for waste factor (SOP-defined per material type), and submits orders. Material status tracks: Ordered → Confirmed → Shipped → On-Site. Lead times feed the schedule.
Trade Partner Scope Cards
Each trade partner receives a scope card via the app (or email/text link):
Their trade scope only (rooms, specs, products, quantities)
Site access (address, parking, entry method, key/lockbox)
What will be prepped for them (“demo complete, subfloor leveled, baseboards removed”)
Their timeline window (start date, expected duration)
Design intent: the homeowner’s aesthetic preferences relevant to their trade
Contact: who to reach if questions arise
Confirm button at the bottom. Questions route directly to Manager.
Schedule & Multi-Project Calendar
The schedule is built from Loop sequencing and trade dependencies. The system enforces: demo before prep, prep before install, install before finish. Cross-trade dependencies are explicit: paint after drywall, trim after paint.
DECISION (MERGED)
The Manager dashboard gets a calendar view showing all active and upcoming projects, crew assignments, trade partner windows, and material delivery dates across projects. This is the scheduling module—essential for preventing conflicts when Nathan has multiple active projects competing for the same crew member’s time. The calendar is the first step; full scheduling module buildout follows.

The Manager sees a Gantt-like timeline with the calendar overlay. The homeowner sees a simple week-by-week list in the portal.
Gate Criteria
GATE CRITERIA
All tasks assigned to a crew member or trade partner
All materials ordered (or confirmed in stock at Ritchies)
Trade partners confirmed availability for their window
Permits applied for (if required by scope)—approval may be pending but application must be filed
Schedule built with no dependency conflicts
No certification gaps blocking assigned tasks (soft gate—flags, may not block)
Homeowner notified of start date and prep instructions
Readiness Score = 100% (all tasks with crew + materials confirmed)
Activity events: plan.generated, materials.ordered, trades.confirmed, schedule.published, permits.applied (if applicable)

App Experience
Manager: Pre-Construction Board + Calendar
A checklist-driven screen for the approved project:
Crew assigned (drag-drop crew members to trades, system flags cert gaps)
Permits applied (if applicable—loop per permit with status tracking)
Materials ordered (auto-generated order list, one-click submit to supplier)
Schedule confirmed (auto-generated from SOP templates, Gantt view for manager)
Homeowner notified (auto-send when all above are checked)
Readiness Score badge: percentage of tasks with crew assigned + materials confirmed + permits cleared. Project can’t move to Execution until Readiness = 100%.
The calendar view shows all projects on a timeline with crew assignment bars, material delivery markers, and trade partner windows. Drag to reschedule. Conflicts highlight in red.
Operator: My Upcoming
A list of upcoming projects with start dates, assigned tasks, SOP previews, materials list for each project with “load vehicle” checklist. “Review SOPs” link for any tasks they haven’t done recently.
Trade Partner: Scope Card
A single-page view optimized for quick review. All the info they need, nothing they don’t. Confirm button at the bottom.
Homeowner: Portal — Getting Ready
A friendly page: confirmed start date, week-by-week outline (not task-level detail), prep checklist if applicable, and a “meet your crew” section. Confidence signals: “Your team is confirmed,” “Materials ordered,” “Start date confirmed.”
Where Labs Fits
LABS INTEGRATION
SOPs are the backbone of Loop generation—every task is derived from a Labs SOP defining steps, duration, materials, quality checkpoints, photo requirements, and common failure modes. Training gate check: the system verifies crew certifications against SOP requirements. If Nishant hasn’t completed supervised LVP installs yet, the system flags it. Historical Labs data from past projects informs scheduling estimates (how long does this crew actually take for this type of work?).


8. Phase 6: Execution
Purpose
This is where the work happens. The system’s job during Execution is to make daily work frictionless for the crew while maintaining a reliable information stream to the Manager and the homeowner. Every task completed, every photo captured, every issue flagged writes to the Activity Log and feeds the project’s health score in real time. This is where all four stakeholders are active simultaneously and need different views of the same reality.
Stakeholder Experience
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager
Real-time progress across all active projects (calendar + dashboard), health scores, issues/blockers, budget burn rate, pending COs
Monitor dashboards, resolve issues, approve change orders, coordinate trades, site visits for QC
In control without micromanaging, informed by data not phone calls
Operator
Today’s tasks, SOP steps with checkboxes, materials location, what’s done, what’s next
Execute SOP steps, mark complete, capture progress photos, log deviations, flag issues
Clear, supported, learning, making visible progress
Trade Partner
Their scope is prepped and ready, site access confirmed, what’s done vs. theirs
Execute their trade, confirm completion, note any issues
Site was ready for them, professional operation
Homeowner
What happened today, what’s coming tomorrow, any decisions needed, project is on track
Review daily summary, approve change orders if any, respond to decision requests
Informed without being overwhelmed, trust is building

Information Flow
Daily Operator Flow
The operator opens the app to a “Today” view: active project, current Loop, tasks for the day. Each task expands into SOP steps with one-thumb checkboxes. Completing a step auto-captures a timestamp and prompts for a photo if the SOP requires one. Deviations from SOP trigger a confirm-or-deviate UX: tap to confirm default, or “Deviate” to log why it’s different (one tap to flag, optional note).
Progress Tracking
Task completion → Loop progress bar updates → Project health score recalculates
Photo capture → tagged by room, trade, SOP step, timestamp
Time clock → floating widget, per-task start/pause/stop, 15min idle detection
Material usage → logged against estimate quantities (tracks waste and accuracy)
Field observations → conditions discovered during work (Labs data)
Change Orders
When scope changes during execution, the full change order architecture applies (see Section 12). The flow:
Condition discovered or change requested → CO created with initiator type
System auto-calculates cost impact from cost catalog
Homeowner sees CO in portal: description, reason, cost + schedule impact, Approve/Discuss buttons
Approved COs append to contract, spawn new tasks from SOP templates, adjust budget and timeline
All-or-nothing approval at launch (partial approvals deferred to v2)
Homeowner Daily Summary
The Client Portal shows a daily summary (pushed as a notification and visible in-portal): what was done today (plain language, not task codes), curated progress photos, what’s planned for tomorrow, any decisions or approvals needed, and overall progress percentage. The tone is friendly: “Day 3: Your living room floors are in! We’re letting the adhesive cure overnight. Tomorrow we start the hallway.”
Gate Criteria
GATE CRITERIA
All tasks in all Loops marked complete (100% progress)
All SOP-required photos captured
All deviations logged with notes
All change orders approved or resolved (none pending)
All uncaptured labour resolved (converted to CO, absorbed, or deleted)
Material usage logged (actual vs. estimated)
No open blockers or unresolved issues
Activity events: per-task task.started/task.completed, per-Loop loop.completed, CO events as applicable

App Experience
Operator: Execution View
Optimized for one-thumb, dirty-hands use. The screen shows the current task with large SOP step checkboxes. Swipe or tap to confirm a step. Camera button always visible (one tap to photo, auto-tagged). “Flag Issue” button is persistent—tap, describe, severity (heads-up / blocker / safety), routed to Manager. The next task auto-loads when the current one completes. QuickAdd button for common events: Done, Photo, Note, Time, Blocked, Delivery, Material.
Manager: Multi-Project Dashboard
Project cards with health score indicators (green/amber/red). Calendar view showing all active projects. An “Attention Needed” feed: flagged issues, pending COs, trade partners arriving today, material deliveries, schedule risks, uncaptured labour prompts. Budget panel: estimated vs. actual, burn rate, projected final cost. The Manager’s daily routine: check the Attention feed, resolve items, move on.
Homeowner: Client Portal — Live Project
A timeline view with daily entries (reverse chronological). Each entry: date, summary text, photo grid, progress bar, any action items. Overall progress bar prominent at top. Progress by trade visible (flooring 80%, paint 60%, trim 40%). “Message Your Team” button. Change order section with clear approve/discuss actions. The design is calm and visual—photos do the heavy lifting.
Where Labs Fits
LABS INTEGRATION
This is Labs’ primary data collection phase. Checklist completion captures confirm-or-deviate data at every SOP step—the core Labs dataset. Field observations are logged when conditions differ from expected (subfloor issues, wall conditions, material behaviour). Time data per task per crew member feeds training analytics and future estimate accuracy. Photo documentation becomes the evidence base for material testing and SOP refinement. Deviation patterns across projects reveal systemic issues (“LVP adhesion problems in concrete-slab condos” becomes a knowledge item). Most observations batch at task completion to stay within the friction budget; time-sensitive observations (safety, material defects) trigger immediately.


9. Phase 7: QC / Punch List
Purpose
Verify that the work meets the standard before calling it done. The QC phase catches defects, omissions, and finish-quality issues before the homeowner does. A formal walkthrough produces a punch list. This phase protects the brand and eliminates callbacks.
Stakeholder Experience
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager
All Loops complete, overall quality assessment, punch list items
Conduct SOP-driven QC walkthrough, generate punch list, assign corrections, walk with homeowner
Proud of the work, confident it’s right, ready to hand over
Operator
Their punch list items, what needs fixing, timeline
Execute corrections, take “after” photo, mark resolved
Corrections are normal not punitive, motivated to get it right
Homeowner
Work is substantially complete, walkthrough is happening, their input matters
Walk through with Manager, flag anything, approve when satisfied
Respected, heard, satisfied with the result

Information Flow
QC Checklist (SOP-Driven)
The QC checklist is auto-generated based on the project’s trade mix. Each trade has defined quality checkpoints from Labs SOPs:
Flooring: seam alignment, transition strips, expansion gaps, no lippage, finish consistency
Paint: coverage uniformity, cut-in sharpness, no runs/drips, touch-up complete
Trim: joint tightness, caulk lines clean, finish consistent, reveals even
Tile: grout consistency, lippage check, cut quality at edges, silicone joints
Drywall: surface smoothness (per specified level), no visible joints/fasteners, corners sharp
The Manager walks room by room. Each item: pass/fail/N/A. Failed items auto-generate punch list entries with room tag, trade tag, photo, description, and severity (cosmetic / functional / structural).
Homeowner Walkthrough
After the internal QC, the Manager walks the homeowner through. The homeowner can flag additional items via the Client Portal (tap room, “Flag Something,” take photo, describe). These append to the punch list. All items visible in real time as they’re resolved.
Punch Corrections
DECISION (MERGED)
Punch list fixes are lightweight tasks—not full SOP deployment. But they do require mandatory before/after photo pairs and re-verification by the Manager. Trade partners are called back only if the deficiency is in their trade’s work.

Gate Criteria
GATE CRITERIA
Internal QC checklist complete (all items pass or punched)
Homeowner walkthrough complete
All punch list items resolved and re-verified (before/after photos captured)
Homeowner sign-off on completion (digital approval in portal)
Final photos captured for every room
Activity events: qc.started, punchlist.item_created, punchlist.item_fixed, qc.passed, homeowner.signoff

App Experience
Manager: Walkthrough Mode
A special walkthrough mode: room-by-room navigation, tap to add punch items with photo + description + severity. Quick and thumb-friendly—walking and tapping, not typing. At the end, a summary: X of Y passed, Z punch items created. “Schedule Homeowner Walk” button sends calendar invite via portal.
Operator: Punch Corrections
A focused list of assigned punch items with photos of the issue, description, room tag. Flow: navigate to item, fix it, take “after” photo, mark resolved. Before/after photos are linked.
Homeowner: Walkthrough & Sign-Off
Portal shows QC status progression: “We’re doing a final quality check” → “Ready for your walkthrough” → “All items resolved.” During walkthrough, homeowner flags items directly. After resolution: “Approve Completion” button with statement: “I’m happy with the work and confirm it’s complete as agreed.”
Where Labs Fits
LABS INTEGRATION
QC checklists are generated from Labs SOPs—each SOP defines its own quality acceptance criteria. QC pass/fail data feeds back: if a specific product consistently fails a checkpoint, that’s a Labs signal to investigate. Punch list patterns (e.g., “cut-in quality” flagged on 30% of paint jobs) identify training opportunities that flow into Labs’ certification module. Quality scoring contributes to crew performance data—lower punch counts improve a crew member’s quality metric.


10. Phase 8: Closeout
Purpose
Finalize the project financially and administratively. Collect final payment, pay trade partners, deliver warranty documentation, archive the project record, and hand the homeowner a polished summary. This is the last impression—it should feel complete, professional, and generous.
Stakeholder Experience
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager
Final cost vs. estimate, margin achieved, all payments collected, documentation complete
Review final accounting, invoice final payment, deliver warranty pack, conduct internal debrief, close project
Clean close, good margins, everything buttoned up
Operator
Project is wrapping up, debrief scheduled
Participate in internal debrief (what went well, what to improve)
Contribution recognized, learning captured
Homeowner
Final cost, warranty coverage, care instructions, Hooomz Profile is live
Pay final balance, review warranty, access Hooomz Profile, leave review
Delighted, impressed by polish, already thinking about next project

Information Flow
Final invoice generated: estimate total +/- approved change orders = final amount due, less deposit and progress payments = balance
Final payment collected (same methods as deposit)
DECISION (MERGED)
Trade partners are paid as soon as their sign-off is completed—not at project closeout. When the Manager verifies a trade partner’s scope is complete during QC, their payment is triggered. This keeps relationships strong and trade partners motivated to do quality work. Payment method, amount, and confirmation are logged per trade partner.

Warranty document generated: per-trade warranty terms, product manufacturer warranties, Hooomz workmanship warranty period, claim process
Project Summary delivered: a “Your Project” page with before/after photos per room, products installed (with specs and care instructions), crew involved, timeline, warranty info
Hooomz Profile updated: all project data written to the property’s digital passport
Internal debrief: what went well, what to improve, Labs data summary, estimate accuracy review
Activity events: invoice.final_sent, payment.final_received, warranty.issued, trade_partner.paid, project.closed
Gate Criteria
GATE CRITERIA
Homeowner sign-off received (from QC phase)
Final payment received in full
All trade partners paid
Warranty documentation delivered
Project Summary delivered via portal
Hooomz Profile updated with project data
Internal debrief complete
Care instructions delivered per material type
All Activity Log events complete

App Experience
The closeout experience is a polished flow in the Client Portal—a “Your Project is Complete” page:
Hero section: before/after photo, project name, completion date
Final invoice with clear breakdown, payment button
Warranty summary with downloadable PDF, organized by room and trade
Care instructions per material (“Your LVP floors: clean with damp mop, avoid standing water, use felt pads”)
Hooomz Profile teaser: “Your home now has a digital record of this work”
Review prompt: “How was your experience?” with stars + comment
Referral prompt: “Know someone who could use a refresh?” with shareable link
Maintenance teaser: “Keep your home in perfect shape. Explore Hooomz Maintenance.”
Manager closeout checklist tracks all gates. System auto-generates budget vs. actual comparison and Labs data summary for the debrief.
Where Labs Fits
LABS INTEGRATION
Closeout is a Labs data harvest. Actual vs. estimated material usage refines the cost catalog. Time tracking data sharpens labor rate accuracy. Before/after photos become Labs portfolio assets (with homeowner permission). Product performance data feeds long-term durability tracking. The project retrospective aggregates all Labs data—time estimates vs. actuals, material quantities vs. actuals, deviation patterns, training outcomes. Crew performance metrics update: certification progress, quality scores, productivity.


11. Phase 9: Follow-up
Purpose
Convert a completed project into an ongoing relationship. The work is done, but the relationship with the homeowner and their home is just beginning. Follow-up bridges to maintenance subscriptions, future renovation projects, referrals, and long-term Profile data.
Stakeholder Experience
Stakeholder
Needs to Know
Needs to Do
Should Feel
Manager
Client satisfaction, referral potential, maintenance upsell opportunity, repeat client likelihood
Monitor follow-up sequence, request reviews, offer maintenance, track referrals
Relationship is growing, pipeline fed by happy clients
Homeowner
Post-project care instructions, maintenance options, how to refer, Profile is active and accessible
Leave review, consider maintenance, refer friends, access Profile for future needs
Valued beyond the transaction, part of the Hooomz ecosystem

Automated Follow-Up Sequence
Day 1 post-close: Thank you message + project summary link + care instructions
Day 7: “How’s everything settling in?” check-in + review request (Google, social)
Day 30: Maintenance pitch: “Your floors look great today. Keep them that way.” + tier options ($125/$350/$600/yr)
Day 90: “Anything else on your wish list?” + instant estimate link for next project
Month 6: Product check-in for Labs long-term data: “How are the floors holding up?” (simple 1–5 rating per room)
Anniversary: “One year with your new [floors/kitchen/etc.]!” + maintenance reminder + referral incentive
Referral System
Each completed client gets a unique referral link. Referrals that convert to projects earn the referrer a discount on future Hooomz work, including renovation projects and Maintenance subscriptions. Referral source is tracked in the Activity Log on the new lead, connecting the two client records.
Callback Handling
If a client calls back with an issue, the callback project links to the original via linked_project_id. This creates a rich Labs dataset: what was installed, when, by whom, and what failed. Callbacks follow a simplified version of the job flow (Inquiry → Assessment → Fix → Closeout).
Gate Criteria
GATE CRITERIA
Follow-up sequence activated
Review request sent and tracked
Maintenance options presented
Hooomz Profile live and accessible to homeowner
Referral link generated and delivered
Activity events: review.requested, maintenance.offered, referral.generated

App Experience
The Client Portal transitions from “active project” to “your home” mode permanently. The project summary lives in their profile. Sections: before/after gallery, warranty tracker with expiration reminders, maintenance schedule and tips, “Start a New Project” button (one-tap repeat business), Hooomz Profile link (shareable—valuable at home sale), “Add Other Work” button for non-Hooomz entries (badged as “Added by Homeowner”), maintenance subscription upsell (gentle, context-relevant), referral section with unique link and shareable card (referrals earn discounts on future Hooomz work including subscriptions).
Manager follow-up dashboard: completed clients by recency, referral status (sent/clicked/converted), maintenance subscription pipeline, repeat client signals (“Client X’s paint is 2 years old—seasonal refresh?”).
Where Labs Fits
LABS INTEGRATION
The 6-month and 12-month product check-ins are Labs gold. Real-world durability feedback from actual installations, tracked to specific products, conditions, and installation methods. This data feeds Labs ratings: “This product has a 4.8/5 durability rating after 12 months across 47 installations.” Callback data links failure modes to specific products and conditions. Labs certification renewal for trade partners can be gated on quality outcomes of their completed projects. Over time: “In Moncton homes built 1970–1985, subfloor moisture issues occur in 30% of bathroom renovations.”


12. Cross-Cutting: Change Order Architecture
This section documents the agreed change order architecture from previous conversations. It applies to all phases post-contract.
Core Rule
Post-contract, no loop can be created without a change order. This is the financial accountability gate. Pre-contract, loops can be freely created and modified. Once the contract is signed, the scope is locked. Any deviation requires a CO with clear payment responsibility.
Change Order Initiator Types
client_request — Homeowner changed their mind (“I want heated floors in the master bath”). Homeowner pays.
contractor_recommendation — Hooomz-initiated (“I think we should replace this subfloor”). Nathan decides to eat it or bill it.
site_condition — Discovered condition (“We found mold behind the drywall”). Discussion required on who pays.
sub_trade — Trade partner-initiated (“Plumber says we need to reroute”). Sub owns it.
Zero-cost COs use the same structure with cost_impact: 0. These are scope clarifications that don’t change the price but do need to be documented (e.g., changing product colour within the same price tier).
Change Order Data Model
co_number: Sequential per project (CO-001, CO-002)
initiator_type: client_request | contractor_recommendation | site_condition | sub_trade
cost_impact: Dollar amount (positive adds cost, negative removes, zero = no change)
schedule_impact_days: Days added/removed from schedule
status: draft | pending_approval | approved | declined | cancelled
Line items: mirrors estimate line item structure, each with SOP reference
Approval Flow
All-or-nothing at launch (no partial line-item approvals—defer to v2)
Manager can split complex COs into simpler ones as a process workaround
Approved COs: line items spawn task templates → task instances, tagged with source: ‘change_order’
Declined COs: if work already started, tasks reclassified to ‘uncaptured’ (data is real, can’t be deleted)
Uncaptured Labour
When work happens on-site without estimate or CO backing, the system prompts: “Create Change Order to capture this work?” Options:
Convert to CO (bill client)
Keep as Uncaptured (absorb cost internally)
Delete (if entered in error)
Every dollar of work must be accounted for. Uncaptured labour is a resolved state, not an ignored one.
Work Source Tracking
Every task instance carries a work_source field:
estimate — from the original approved estimate
change_order — from an approved CO (with co_id reference)
uncaptured — work that happened without authorization (flagged for resolution)
This enables: matching actual work to estimated work (feedback loop for estimate accuracy), calculating budget impact of COs, identifying revenue leakage (uncaptured work = unbilled work), and enforcing the “all work must be accounted for” rule.

13. Cross-Cutting: Design Preferences Thread
Design preferences captured in Discovery (Step 2) thread through every downstream phase:
Phase
How Preferences Are Used
Data Impact
Discovery
Captured via visual chooser (style cards, palettes, material samples)
DesignPreferences record created
Estimate
Materials auto-selected to match preferences + budget. All three tiers respect stated style.
Product selections filtered by preference tags
Pre-Construction
Material orders reflect approved preferences. No substitutions without explicit approval.
Order validation against preference record
Execution
Operators and trade partners see design intent on scope cards. Aesthetic micro-decisions stay consistent.
Scope cards include preference summary
QC
Checklist includes aesthetic consistency checks (installed product matches approved palette)
QC items reference preference record
Closeout
Care instructions specific to installed materials
Care guide generated from product + preference data
Follow-up
Future recommendations respect established style (“You loved warm oak—matching dining table refinish?”)
Profile stores preferences as home attributes


14. Cross-Cutting: Budget / Allowance Shaping
Budget information is captured early (Inquiry) and validated progressively. The system’s approach prevents sticker shock by ensuring the formal estimate is never the first time a homeowner sees a price.
Three-Stage Price Convergence
Inquiry: Coarse range based on room count + trade mix. Wide confidence interval. Purpose: keep them engaged.
Discovery (Step 5): Running total updates as rooms/trades are added. Narrower interval. Purpose: budget alignment before the formal estimate.
Estimate: Full detailed pricing with product selections. Exact number. Purpose: the actual proposal.
Budget Response Logic
If they provide a number: All recommendations fit within it. Good/Better/Best tiers calibrated to it.
If they say “What does it typically cost?”: System shows ranges based on scope, then asks “Does that feel comfortable?” Give them a number to react to.
If they provide an allowance: Hard ceiling. Optimize within it. Clear callouts if an upgrade pushes over: “This adds $800, bringing you $200 over your allowance.”
If budget aligns with scope: Proceed normally. Prioritize mid-range options.
If budget is below scope: Flag before estimate: “The scope you’ve described typically runs above your range. Here are ways to optimize: prioritize rooms, adjust material tiers, phase the project.”
If budget is above scope: Opportunity to present premium options: “You have room for the Best tier here—want to see what that looks like?”
Budget is never hidden. The running total is always visible during Discovery. No one should reach the Estimate phase and be surprised.

15. Cross-Cutting: Instant Estimate & VR Walkthrough
Instant Estimate Lifecycle
The instant estimate appears three times in progressively refined forms. Each iteration narrows the range:
Phase 1 (Inquiry): Coarse. Room count × trade-specific per-room averages from Labs cost catalog × regional adjustment = wide range. Marketing tool: “We’re in your price range.”
Phase 2 (Discovery): Refined. Actual scope per room, existing conditions, selected trades = narrower running total. Budget alignment tool.
Phase 3 (Estimate): Precise. Full detailed pricing with products. The actual proposal.
At Phase 3, the system compares the final estimate to the Phase 1 instant estimate and reinforces trust or explains divergence.
VR Walkthrough Integration
VR appears at three touchpoints, each serving a different purpose:
Phase 1 — Inquiry (Home Shows): Lead magnet. Homeowner scans room with ArUco markers, selects materials, sees VR preview. Generates lead with design preference signals (dwell time per product, final selections).
Phase 2 — Discovery (Site Visit): On-site engagement. Manager scans rooms with a tablet, applies proposed materials virtually, shows the homeowner options in real time. “Here’s what your living room looks like with this oak flooring.” VR data feeds room dimensions and material preferences directly into the project record.
Phase 3 — Estimate (Proposal): Conversion tool. Homeowner sees their actual space with proposed products applied before committing. “See your new floors before we install them.” Linked from the interactive proposal in the Client Portal.
VR session data feeds both the estimate (room dimensions from scan, material selections) and Labs (engagement metrics, product popularity).

16. Cross-Cutting: Payment Architecture
Homeowner Payment Schedule
Default payment milestones (easily editable per project):
30% deposit at contract signing (triggers Pre-Construction)
40% at rough completion (defined per project—typically when demo + prep + primary install complete)
30% at closeout (after QC sign-off and homeowner approval)
Payment methods: Stripe, e-transfer, or manual entry. Each payment creates an Activity Log event and updates the project’s financial record.
Trade Partner Payment
Trade partners are paid as soon as their scope sign-off is completed during the QC phase—not at project closeout. When the Manager verifies a trade partner’s scope is complete:
Payment triggered automatically (or manually confirmed by Manager)
Amount, method, and confirmation logged per trade partner
Activity event: trade_partner.paid
This keeps relationships strong, incentivizes quality work, and prevents trade partners from waiting on the full project timeline to get paid.

17. How This Feels Different
Buildertrend, CoConstruct, Jobber, and similar tools are built for the contractor’s administrative needs. The homeowner experience is an afterthought—a portal bolted onto a PM tool. Hooomz inverts this.
Standard PM Software
Hooomz
Form-heavy intake
Conversational, visual, progressive disclosure
Homeowner is an afterthought
Homeowner has a dedicated portal from day one
Estimates are spreadsheets
Proposals are interactive pages with product photos + VR links
Change orders are PDF documents
COs are in-app approvals with clear cost impact + initiator tracking
Progress updates are manual emails
Progress is live in the portal with auto-generated daily summaries
No material intelligence
Labs-powered recommendations with tested, rated products
No training system
SOP-based execution with certification tracking
One-size-fits-all interface
Four stakeholder views from one data source
Desktop-first
Mobile-first for dirty hands (44px targets, one-thumb, gloves)
Project ends at final payment
Hooomz Profile makes every project a long-term relationship
Blank product fields
Smart recommendations pre-filled from design preferences + budget
No scheduling intelligence
Calendar view across projects with crew capacity management

The core difference: standard PM software is built for the contractor’s administrative needs. Hooomz is built around the job flow—the natural progression of a renovation—with every stakeholder getting the right information at the right time in the right format.

18. Division Portability
Shared Infrastructure (Hooomz OS)
The nine-phase job flow is not Interiors-specific—it’s the universal Hooomz job lifecycle. Every division follows the same pipeline. Shared infrastructure:
Activity Log (universal event spine)
Stakeholder model (Manager / Operator / Trade Partner / Homeowner)
Loop architecture (nested containers, three-axis filtering)
Estimate builder, budget conversion, and Client Portal
Change order architecture (4 initiator types, uncaptured labour handling)
Labs integration (SOPs, quality, training, product data)
Hooomz Profile (all divisions write to the same property passport)
Follow-up and referral system
Instant estimate engine (different catalogs per division)
Payment architecture (homeowner milestones + trade partner at sign-off)
Calendar / scheduling module
Division-Specific Layers
Layer
Interiors
Trade catalog
Flooring, paint, trim, tile, drywall
Product catalog
Interior materials, finishes, trim profiles
SOPs
Interior-specific installation procedures
Design preferences
Interior palettes, floor looks, trim styles
Permit triggers
Rare (electrical via Danovan)


Layer
Exteriors (Brisso)
Trade catalog
Siding, roofing, windows/doors, decking, exterior paint, electrical
Product catalog
Exterior materials, weatherproofing, lighting
SOPs
Exterior-specific (weather dependencies, scaffolding, permits)
Design preferences
Exterior color schemes, architectural style, curb appeal
Unique concerns
Weather/seasonal scheduling, more permits


Maintenance (Simplified Flow)
Phases 1–4 collapse into a subscription sign-up ($125/$350/$600/yr). Phases 5–6 become scheduled service visits with inspection checklists. Phase 7 is the service report. Phases 8–9 are ongoing by definition (subscription renewal). Heavy Profile integration: every maintenance visit updates the property’s Hooomz Profile. Cross-sell engine: visits surface renovation opportunities (“Your deck stain is peeling—want a Brisso estimate?”).
The Profile Flywheel
Every division writes to Hooomz Profile. Every Profile entry creates cross-sell opportunities for other divisions. A completed Interiors project suggests Maintenance. A Maintenance visit surfaces Exteriors needs. An Exteriors project reveals interior opportunities. Over time, the Profile becomes an asset the homeowner values independently—the “Carfax for homes” that transfers with the property.

19. Hooomz Profile (Digital Home Passport)
The Profile is built as a byproduct of doing the work—not as a separate data entry exercise.
Phase
How Preferences Are Used
Data Impact
Discovery
Property details, room inventory, existing conditions, photos of current state
PropertyProfile + Room records
Estimate
Scope of proposed work, product selections
ProposedScope records
Execution
Materials installed (brand, product, colour, SKU), dates, installer certs, before/during/after photos
InstalledProduct + Photo records
QC
Quality verification records, pass/fail data
QualityRecord entries
Closeout
Warranty records, care instructions, final photos
Warranty + CareGuide records
Follow-up
Maintenance history, material performance ratings over time
MaintenanceVisit + DurabilityRating records
Manual (Homeowner)
Non-Hooomz work: other contractors, DIY, appliance installs
ProfileEntry with source: homeowner_added (no Hooomz Certified badge)


The Profile becomes increasingly valuable with each project and maintenance visit. First project: “Flooring replaced with Lifeproof Sterling Oak LVP, installed 2026-03, 2-year warranty.” After Maintenance: “+ Annual inspection results, moisture readings, wear assessment.” After second project: “+ Paint refreshed 2027-06, Benjamin Moore Regal Select, Repose Gray.” At home sale: complete renovation history with photos, warranties, and performance data.
DECISION (MERGED)
Homeowners can add non-Hooomz work to their Profile (other contractors, DIY projects, appliance installs). These entries carry an “Added by Homeowner” badge rather than the “Hooomz Certified” badge that Hooomz-performed work receives. This keeps the Profile useful as a complete home record without diluting the trust signal of Hooomz-verified work. Buyers and inspectors can see the difference at a glance.

The Profile QR code on the property (discreet, inside utility closet or panel box) means any future buyer, inspector, or insurance adjuster can see the full history. This is the long-term moat—once a home has a Hooomz Profile, it’s connected to the ecosystem permanently.

20. Appendix A: Data Model Summary
Key data entities and their relationships across the job flow. Conceptual model mapping to IndexedDB stores and Activity Log events.
Entity
Key Fields
Written By Phase
Lead
source, contact, scope_tags, budget_range, instant_estimate, vr_session_id
Inquiry
Project
lead_id, status, division, address, homeowner_id
Inquiry → all phases
Property
address, type, age, storeys, access_notes, profile_id
Discovery
Room
project_id, name, floor, dimensions, condition_photos
Discovery
RoomScope
room_id, trade, existing_condition, action, specs
Discovery
DesignPreferences
project_id, style, palette, floor_look, trim_style, vibe, priority, inspiration_images
Discovery
Estimate
project_id, line_items[], total, margin, contingency, status
Estimate
LineItem
estimate_id, room_id, trade, product_id, qty, unit_cost, total, sop_code
Estimate
Product
id, name, category, price, labs_rating, swatch, specs, compatibility
Labs (reference)
Contract
project_id, estimate_id, scope_snapshot, terms, signature, payment_schedule
Approval
Payment
project_id, type (deposit/progress/final/trade_partner), amount, method, status
Approval → Closeout
Permit
project_id, type, application_status, inspection_date, approval_date
Pre-Construction
Loop
project_id, phase, trade, tasks[], status, progress, color_dot
Pre-Construction
Task
loop_id, sop_id, assignee, materials[], status, time_log, work_source, work_source_id
Pre-Construction → Execution
ChangeOrder
project_id, co_number, initiator_type, cost_impact, schedule_impact, status, line_items[]
Execution
COLineItem
change_order_id, description, sop_code, category, qty, unit_cost, total
Execution
PunchItem
project_id, room_id, trade, photo_before, photo_after, description, severity, status
QC
Warranty
project_id, trade_terms[], product_warranties[], issue_date, expiry_dates
Closeout
ProfileEntry
property_id, project_id, source (hooomz_certified|homeowner_added), scope_summary, products, photos, dates, warranties
Closeout + manual
FollowUpSequence
project_id, events[], last_sent, next_due
Follow-up
Referral
referrer_id, referee_lead_id, status, discount_type (project|subscription), discount_amount
Follow-up
TradePartnerPayment
project_id, trade_partner_id, amount, method, signoff_date, payment_date
QC → Closeout


21. Appendix B: Activity Log Events
Every event is immutable and append-only. Events carry: id, project_id, type, timestamp, actor, payload. Dot notation for namespacing and extensibility.
Event Type
Trigger
lead.created
New lead enters the system via any channel
project.discovery_started
Guided intake or site visit begins
rooms.scoped
Room scope cards completed
preferences.captured
Design preferences saved
project.discovery_complete
All discovery data captured and validated
estimate.created
Auto-estimate generated from discovery data
estimate.reviewed
Manager reviews and approves estimate
proposal.sent
Proposal delivered to homeowner via portal
project.approved
Homeowner approves scope
contract.signed
E-signature captured
payment.deposit_received
Deposit payment confirmed
plan.generated
Loops and tasks auto-generated from scope
permit.applied
Permit application submitted
permit.approved
Permit approved by authority
materials.ordered
Material orders placed
trades.confirmed
Trade partners confirmed availability
schedule.published
Schedule finalized and shared
task.started
Operator begins a task
task.completed
Operator completes a task (with SOP compliance data)
checklist.item_checked
Individual SOP checklist item confirmed/deviated
deviation.reported
SOP deviation logged with notes
loop.completed
All tasks in a Loop complete
photo.captured
Progress/condition photo taken (auto-tagged)
time.logged
Time clock entry recorded
change_order.created
Scope change initiated (with initiator_type)
change_order.approved
Homeowner approves change order
change_order.declined
Homeowner declines change order
uncaptured.flagged
Work without authorization detected
uncaptured.resolved
Uncaptured work converted to CO, absorbed, or deleted
qc.started
Manager begins QC walkthrough
punchlist.item_created
QC defect flagged
punchlist.item_fixed
Defect corrected and re-verified
qc.passed
All QC items pass
homeowner.signoff
Homeowner approves completion
trade_partner.paid
Trade partner payment processed at scope sign-off
invoice.final_sent
Final invoice delivered
payment.final_received
Final balance collected
payment.progress_received
Progress payment collected
warranty.issued
Warranty documentation delivered
project.closed
All closeout criteria met
review.requested
Follow-up review request sent
maintenance.offered
Maintenance subscription pitched
maintenance.subscribed
Maintenance subscription activated
referral.generated
Referral link shared
referral.converted
Referral converted to new lead
callback.created
Past client reports an issue
profile.updated
Hooomz Profile data written (hooomz_certified)
profile.manual_entry_added
Homeowner adds non-Hooomz work to Profile (homeowner_added badge)


22. Appendix C: The Foreman Summary
One-page reference: what the foreman says vs. what the engine does at each phase.
The Foreman Says
The Engine Does
"Tell me what you're thinking."
Captures lead, scores priority, shows instant estimate
"Let me walk the space with you."
Captures property, preferences, budget; shows light product previews; running total updates live; VR on tablet
"Here's what it'll run you, and here are your options."
Calculates materials, labour, margin; generates Good/Better/Best; compares to instant estimate
"Ready to go? Here's the plan."
Locks scope, creates budget, deploys task templates, collects deposit
"We're getting set up. Start date is Tuesday."
Assigns crew, pulls permits, orders materials, builds schedule, checks certs, calendar sync
"Here's what we did today."
Tracks tasks, time, deviations, photos, costs, COs, Labs observations
"Let's walk it together and make sure you're happy."
Documents punch items, tracks fixes with before/after photos, captures sign-off, pays trade partners
"You're all set. Here's everything you need."
Final payment, warranties, Profile update, care guides, debrief, review request
"How's everything holding up?"
Maintenance reminders, referral tracking, long-term Labs durability data, Profile growth





End of Document
The app doesn’t feel like software. It feels like having the best foreman in the province on your team—one who never forgets a detail, always knows the numbers, and makes the homeowner feel like their project is the only one that matters.
Hooomz Interiors • Job Flow & Product Vision • v2.1 Final • February 2026