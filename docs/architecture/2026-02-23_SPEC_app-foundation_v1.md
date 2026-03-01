# HOOOMZ INTERIORS — APP FOUNDATION DOCUMENT
## Version 1.0 | February 2026

---

## SECTION 1: CORE ARCHITECTURE DECISIONS

These decisions are locked. Every UI, feature, and development choice flows from these.

### 1.1 One Process, Three Lenses
There is one job pipeline. Manager, Operator/Installer, and Homeowner each see a filtered view of the same job. The pipeline does not change per persona — the view does.

### 1.2 Manager-First Design
The process is built from the Manager's perspective. Every stage, status, and decision point is defined by what the Manager needs to see, do, and know. The Installer view and Homeowner view are purpose-built filters of that same process.

### 1.3 Stage-First with Trade Breakdown Inside Active (Option C)
Stages own the front and back end of every job. Inside the Install stage, work is organized by trade. The job is always in one stage. Inside Install, the work breaks down by the four core trades: Flooring, Paint, Trim, Doors.

### 1.4 SCRIPT is the Production Language — Everywhere
SCRIPT (Shield → Clear → Ready → Install → Punch → Turnover) is not field-only language. It is the production language top to bottom — sidebar navigation, dashboards, job records, crew views, manager views. No translation layer. Same terms everywhere.

### 1.5 No Looops Sphere Visuals
Hooomz Interiors has its own visual identity. Royal blue / near-black palette. Clean, professional, construction-confident. The sphere is Looops. Interiors stands on its own.

### 1.6 The Job Record is the Spine
Every action, photo, note, change order, and status change is an event logged against the job record (Activity Log). Modules are specialized interfaces for creating and acting on specific event types. The job record connects Sales and Production — same record, two lenses.

### 1.7 Customer Record is Shared Platform Infrastructure
The Customer record does not belong to Sales or Production. It belongs to Hooomz at the platform level. Every spoke app (Interiors, Exteriors, Maintenance, etc.) plugs into the same Customer record. The master Hooomz dashboard shows the full customer relationship across all divisions in one place.

---

## SECTION 2: THE FULL JOB PIPELINE

### 2.1 Pipeline Overview

| Stage | Division | Homeowner-Facing Name |
|-------|----------|-----------------------|
| Lead | Sales | REQUEST |
| Estimate | Sales | REQUEST |
| Consultation | Sales | DISCOVER |
| Quote | Sales | DESIGN |
| Contract | Sales → Production handoff | COMMIT |
| Shield | Production (SCRIPT) | BUILD |
| Clear | Production (SCRIPT) | BUILD |
| Ready | Production (SCRIPT) | BUILD |
| Install | Production (SCRIPT) | BUILD |
| Punch | Production (SCRIPT) | BUILD |
| Turnover | Production (SCRIPT) | OWN |

Sales owns the first five stages. Production owns the last six. Contract is the handoff — the moment it is signed, the job is born in Production and SCRIPT begins.

The customer-facing language (Request / Discover / Design / Commit / Build / Own) lives in the homeowner portal and marketing materials only. The internal app always uses operational terms above.

### 2.2 Sales Pipeline Detail

**Lead**
First contact. Source tracked: Ritchies referral / Home Show / website / word of mouth / referral. The Instant Estimate Engine fires here — homeowner gets a ballpark range generated from the cost catalog before anyone picks up a phone. No friction, no call required. A Lead card appears on the Sales Dashboard.

**Estimate**
The instant estimate output. A confidence-building range, not a commitment. Generated automatically from cost catalog using room count, trade mix, and historical averages. Wide range intentional at this stage. Disclaimer shown: "This is a preliminary range. Your actual quote will be based on a site visit." Lives on the Lead record.

**Consultation**
The site visit. LiDAR scan, before-state photos, material samples in actual lighting, conditions documented. Homeowner has already told you what they want online — you show up informed. ~45 minutes. Documentation starts here.

**Quote**
Formal deliverable built from consultation data. Personalized render, video walkthrough sent as an expiring link, transparent unit pricing from cost catalog. Homeowner watches it on their time, shares with partner. Not a proposal — a designed experience.

**Contract**
VR walkthrough and digital signing. Homeowner steps into their finished room, signs standing inside it, pays deposit, immediately receives portal access. This stage closes Sales and opens Production. Same job record continues — nothing is recreated.

### 2.3 Production Pipeline Detail (SCRIPT)

**Shield**
Pre-execution. Replaces what was previously called "Prep" — that was always early Shield. Covers: site protection, material ordering and staging, crew assignment and briefing, schedule lock, homeowner pre-job communication, access confirmation. Job is ready to execute.

**Clear**
Demo and surface preparation per trade. This is where out-of-scope conditions are discovered (subfloor damage, rough openings out of square, wall conditions requiring extra prep). Change Order workflow branches here before work continues. Never proceed past Clear without resolving scope.

**Ready**
Material and tool staging confirmed on site. All materials verified correct before install begins. No surprises mid-install.

**Install**
Work is happening. Organized by trade inside this stage. Each trade (Flooring / Paint / Trim / Doors) has independent status tracking, its own task list, and its own checklist. Multiple trades may run concurrently. Progress photos required at defined milestones — not optional.

**Punch**
Internal quality review before homeowner sees the finished product. Manager conducts full walkthrough. Deficiency list generated (written, not verbal). Assigned to crew with due dates. Return walkthrough verifies resolution. Homeowner is not involved until Turnover. They see the finished product, not the punchlist process.

**Turnover**
Walkthrough with homeowner. Home Care Sheet reviewed and handed over (auto-generated from job record). Final invoice issued. Payment collected. Review/referral request sent within 24 hours. Job record archived with full photo documentation.

---

## SECTION 3: TRADE BREAKDOWN INSIDE INSTALL

### Four Core Trades
1. Flooring
2. Paint
3. Trim
4. Doors

### Trade Structure (each trade follows SCRIPT internally)
Each trade within Install has:
- Shield tasks (site protection specific to that trade)
- Clear tasks (demo and prep specific to that trade)
- Ready tasks (material staging specific to that trade)
- Install tasks (execution checklist)
- Progress photo requirements at defined milestones

### Change Order Trigger
Change Orders are triggered at the Clear phase of any trade when out-of-scope conditions are discovered. The workflow branches: document condition → photograph → generate Change Order → homeowner approval → proceed. Never absorb out-of-scope work silently.

---

## SECTION 4: SIDEBAR NAVIGATION MAP

### SALES
- Sales Dashboard *(pipeline overview — leads by stage, conversion rates, estimates outstanding, revenue in pipeline)*
- Leads
- Estimates
- Consultations
- Quotes
- Customers *(Sales lens — entry point for new customer relationships)*

### PRODUCTION
- Production Dashboard *(all active jobs by SCRIPT stage — Contracted / Shield / Clear / Ready / Install / Punch / Turnover counts)*
- Jobs *(master job list — drill into any job for full record)*
- Schedule
- Crew *(operational — who is assigned where, availability, scheduling)*
- Change Orders
- Customers *(Production lens — same shared record viewed through execution context)*

### FINANCE
- Finance Dashboard *(current state — Revenue MTD, invoices outstanding, collected vs. owing)*
- Invoices *(to be built — currently absent from app)*
- Cost Catalogue
- Forecast *(future state — pipeline value, cash flow projection, conversion metrics)*

### STANDARDS
- Standards Dashboard
- SOPs
- Training
- Knowledge Base

### LABS
- Labs Dashboard
- Tests
- Voting
- Tokens

### ADMIN
- Profile
- Crew *(management — profiles, roles, certifications, onboarding)*
- Settings

### CUSTOMERS *(standalone shared module — platform level)*
- Customer List
- Customer Record *(contact info, property record, full job history across all Hooomz divisions, Home Care Sheets, maintenance history)*

---

## SECTION 5: PERSONA VIEWS

### Manager (Nathan / senior operator)
Sees everything. Owns stage advancement. Approves Change Orders. Conducts Punch walkthrough. Signs off Turnover. Sales Dashboard and Production Dashboard both default to manager view.

### Operator (Nishant / coordinator)
Sees Production and Sales operational tasks. Manages scheduling, materials, crew briefs, customer communication. Does not see Finance detail. Can generate quotes and change orders, requires manager approval on contracts.

### Installer / Crew
Sees their assigned jobs only. Inside a job sees their trade only. Dead simple: here is my job today, here is what I am doing, here is how I mark it done, here is how I flag an issue. No pipeline visibility, no finance, no other trades.

### Homeowner
Portal view only. Sees the customer-facing language (Request / Discover / Design / Commit / Build / Own). Always one stage behind — they see what is done, not what is mid-process. Receives: confirmation at each milestone, progress photos at defined points, Home Care Sheet at Turnover.

| Stage | Manager | Operator | Installer | Homeowner |
|-------|---------|----------|-----------|-----------|
| Lead | Full record | Contact + tasks | — | — |
| Estimate | Estimate builder | Proposal status | — | Instant estimate |
| Consultation | Full notes + photos | Calendar + follow-up | — | Confirmation |
| Quote | Quote builder | Quote status | — | Video link |
| Contract | Sign-off + deposit | Portal setup | — | VR + signing |
| Shield | Full status | Materials + crew | Job brief | "Starting soon" |
| Clear | Full status + CO trigger | CO workflow | Own trade | "In progress" |
| Ready | Readiness confirmation | Verify materials | Own trade | "In progress" |
| Install | All trades status | Trade progress + issues | Own trade only | "In progress" |
| Punch | Deficiency list | Deficiency tracking | Own trade fixes | — |
| Turnover | Walkthrough + sign-off | Invoice + payment | — | Walkthrough + HCS |

---

## SECTION 6: KEY DEVELOPMENT NOTES

### Stage Advancement is Explicit
A job does not auto-advance. Manager or Operator intentionally moves it forward. This prevents jobs drifting through stages without accountability.

### Checklists Gate Stage Advancement
Punch sign-off and Turnover sign-off require checklist completion before stage advance is permitted. This is non-negotiable — it is the quality control mechanism.

### Photos are Required, Not Optional
Before state, midpoint, and completion photos are part of the job record at defined milestones. They feed the Home Care Sheet and the customer portal.

### Home Care Sheet Auto-Generates from Job Record
Trade scope, materials used (from cost catalog), care instructions, and warranty info pull from job data at Turnover. It is not manually created.

### Invoices is a Build Priority
Currently absent from the app. Must exist before any real jobs flow through the system.

### Customers is Platform Infrastructure
Build the Customer module to spec as a standalone shared entity. Not Interiors-specific. Drops into every spoke app clone without rework. Customer record accumulates history across all Hooomz divisions.

### Instant Estimate Engine
Lives at the Lead stage. Pulls from Cost Catalogue. Returns a range (low/mid/high). Wide range intentional. Disclaimer included. This is what converts a Home Show visitor or a website visitor to a consultation booking without requiring a phone call.

### The Finance Dashboard vs Forecast Distinction
Dashboard = current state (where are we). Forecast = future state (where are we headed). Both necessary once data flows. Keep both, clarify their purpose in the UI headers.

### Crew Appears Twice — Different Purposes
Production > Crew = operational scheduling and assignment.
Admin > Crew = profile management, roles, certifications.
Same people, different context. Both necessary.
