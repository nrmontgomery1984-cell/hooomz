# SPRINT 8: HOME SHOW DEMO PREP
## Nathan + Claude.ai — No CC Needed
**Document:** 2026-02-06_PLAN_sprint8-demo-prep_v1.md
**Timeline:** Mar 2-7 (week before show)
**Depends on:** Sprints 1-7 code-complete

---

## THE DEMO SCRIPT

The entire demo is under 5 minutes. Every second is scripted. No improvisation, no "let me find that screen."

### Opening (30 seconds)
"Hey, I'm Nathan from Hooomz. I'm a Red Seal carpenter with 22 years in the trade. I built the software I wish existed when I started contracting. Let me show you what it does."

Open the desktop dashboard on the booth screen.

### Act 1: The Contractor View (90 seconds)
"Here's my dashboard right now. Three active jobs. I can see health scores at a glance — this one's green, on track. This one's red, behind schedule. I know where to focus without opening a single file."

Tap into Smith project.

"Each project breaks down by trade — flooring, baseboards, paint. I see which loops are moving and which haven't started. My crew logs everything from their phone."

Open Quick Add on your phone (cast to second screen or just demo on phone).

"One thumb. Tap Done, pick the task, hit Log. It shows up on the dashboard in real time. Photo? Tap, snap, done. Time? Start the timer in the morning, stop it at end of day."

### Act 2: The Client Experience (60 seconds)
"Now here's what sets us apart. Your client gets their own portal."

Open client portal view (switch to the Smith client login or just navigate to the portal URL).

"They see progress. They see photos. They see their estimate with three options — Good, Better, Best. They approve right from their phone. No back-and-forth emails."

Show the estimate view. Point to "Lab Tested ✓" on a product.

"And that badge? We test the materials we install. Independently. So your client knows they're getting the product that actually performs in New Brunswick winters."

### Act 3: The Handoff (60 seconds)
"When the job's done, the client gets this."

Open the Home Care Sheet.

"Every material we installed. How to care for it. Warranty details. A maintenance schedule. And a link to our Maintenance program — $350 a year, we come back every 6 months and make sure everything is holding up."

Pause. Let that sink in.

"No other contractor gives you this. This is the document that turns a one-time job into a lifetime relationship."

### Act 4: The Sell (60 seconds)
"Now — this isn't just MY software. This is yours."

Open Theme & Branding settings.

"Upload your logo." (Pre-loaded a demo logo.) "Pick your color." (Change accent from teal to navy.) "Done. Your brand. Your app. Your clients get the same premium experience."

Pause. Show the dashboard with the new brand applied.

"Hooomz is the operating system for your renovation business. We handle the tech. You handle the trade."

### Close (30 seconds)
"We're launching Interiors first — flooring, paint, trim, tile. Exteriors and Maintenance are coming. If you want early access, scan this QR code."

Point to the QR code on the booth display. It goes to a signup page.

"Thanks for stopping by."

---

## DELIVERABLES FOR SPRINT 8

### Claude.ai Builds:
1. **Demo script** (above — refine based on Nathan's voice)
2. **Booth signage prompts** for Gemini (2-3 large format images showing the app)
3. **QR code landing page copy** (simple: name, email, trade, "Get early access")
4. **One-pager PDF** — leave-behind for visitors (what Hooomz is, the division map, pricing concept, QR code)
5. **Labs pitch summary** — even though Labs isn't built, the concept should be in marketing materials
6. **Investor-ready overview** for Mark & partner if they're at the show

### Nathan Does:
1. **Run seed script** — populate 3 demo projects with realistic data
2. **Test on actual phone** — go through Quick Add, timer, photo capture on real device
3. **Prepare demo logo** for the white-label moment (use a fake contractor name like "Maritime Renovations" or pick a real local competitor's style)
4. **Print booth materials** — signage, one-pagers, business cards with QR code
5. **Set up booth hardware** — laptop/TV for desktop dashboard, phone for mobile demo
6. **Dry run 3 times** — practice the full 5-minute script until it's muscle memory
7. **Prepare recovery plan** — if WiFi goes down, can you demo with offline mode? If a screen breaks, which screens can you skip?

### Recovery Scenarios:
- **WiFi down:** Quick Add and timer still work (IndexedDB). Dashboard shows cached data. Skip client portal demo, just describe it.
- **Screen freeze:** Kill the tab, reopen. Seed data is still there.
- **Demo data gets messed up between visitors:** Run seed script reset. Takes 30 seconds.
- **Someone asks a hard technical question:** "Great question — we're building on Supabase with real-time sync. Let me get your email and I'll send you the technical overview."
- **Someone asks about pricing:** "We're finalizing licensing models now. Early adopters get preferred rates. Scan the QR code and I'll follow up personally this week."

---

## BOOTH LAYOUT

```
┌─────────────────────────────────────┐
│                                     │
│   [LARGE SCREEN - Desktop Dashboard]│
│                                     │
│   ┌─────┐                           │
│   │PHONE│    Nathan stands here     │
│   │demo │                           │
│   └─────┘                           │
│                                     │
│   ┌───────────────┐  ┌───────────┐  │
│   │ One-pagers    │  │ QR code   │  │
│   │ (take-away)   │  │ (sign up) │  │
│   └───────────────┘  └───────────┘  │
│                                     │
│   "The Operating System for Your    │
│    Renovation Business"             │
│                                     │
└─────────────────────────────────────┘
```

---

## WEEK-OF CHECKLIST

### Monday Mar 2:
- [ ] Run seed script, verify all demo data
- [ ] Full dry run on actual devices
- [ ] Print one-pagers and signage

### Tuesday Mar 3:
- [ ] Second dry run — time it (must be under 5 min)
- [ ] Test white-label flow (logo swap + color change)
- [ ] Verify offline mode works for recovery scenario

### Wednesday Mar 4:
- [ ] Third dry run — practice recovery scenarios
- [ ] Pack hardware (laptop, phone, chargers, cables)
- [ ] Load demo logo for white-label moment

### Thursday Mar 5:
- [ ] Set up booth early if possible
- [ ] Test WiFi at venue
- [ ] Final seed script run
- [ ] Deep breath. You built this.

### Show Day(s):
- [ ] Arrive early, check everything works
- [ ] Reset seed data between demos if needed
- [ ] Collect emails from QR code signups
- [ ] Take photos of booth for marketing
- [ ] Note every question visitors ask — these are feature requests and marketing insights

---

*Demo prep plan by Claude.ai — February 6, 2026*
