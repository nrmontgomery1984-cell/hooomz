# Hooomz Home Show Demo Script

Step-by-step demo flow for the Home Show booth.

## Setup (Before Show)

### Equipment
- [ ] Laptop with Revit model open
- [ ] Phone showing Hooomz app (crew view)
- [ ] Tablet showing client portal
- [ ] All devices on reliable WiFi
- [ ] Backup phone configured identically
- [ ] External battery packs charged

### Pre-Demo Checklist
- [ ] Test import flow works
- [ ] Verify real-time sync between devices (< 3 sec)
- [ ] Load Brisso demo project with real data
- [ ] Clear browser cache on all devices
- [ ] Set screen brightness to max (outdoor visibility)

## Demo Flow (3 Minutes)

### Beat 1: The Model (30 seconds)

**Show:** Laptop with Revit model

**Say:**
> "Here's a renovation project modeled in Revit. Standard workflow - walls, doors, windows, all with our smart material assemblies."

*Rotate model briefly to show 3D view.*

**Talking Points:**
- This is a real project (or based on real project)
- The model contains everything needed for construction
- Material assemblies define quantities

---

### Beat 2: The Export (20 seconds)

**Show:** Revit with pyRevit ribbon

**Say:**
> "One button exports everything Hooomz needs - the quantities for estimating, and the floor plan for tracking."

*In pyRevit ribbon, go to Hooomz tab > Export panel:*
1. *Click "Export Quantities JSON" - creates JSON file with all quantities*
2. *Click "Export Floor Plan SVG" - creates SVG with linked elements*

**Talking Points:**
- No manual data entry
- Quantities come directly from the model
- Floor plan maintains element IDs for tracking
- Two files: JSON for quantities, SVG for visual tracking

---

### Beat 3: The Import (20 seconds)

**Show:** Laptop browser at /import

**Say:**
> "Import to Hooomz and the project is ready. All the walls become trackable tasks, organized exactly like the model."

*Drag and drop JSON file, then SVG file. Click Import.*
*Project appears in dashboard.*

**Talking Points:**
- Walls become tasks automatically
- Levels become floors
- Floor plan is interactive

---

### Beat 4: The Crew View (60 seconds)

**Show:** Phone with app open to project

**Say:**
> "Now the crew opens the app on site."

*Hand phone to visitor.*

**Say:**
> "Tap the floor plan. Tap that wall. Mark it complete."

*Guide them to tap an element and change status to Complete.*
*Watch the wall turn green.*

**Say:**
> "Add a photo. Done. That's their whole workflow - tap, status, move on."

*Show photo capture if time permits.*

**Talking Points:**
- Works on any phone
- No training needed
- Photo documentation built in
- Works outdoors (high contrast)

---

### Beat 5: The Client View (30 seconds)

**Show:** Tablet with client portal

**Say:**
> "Meanwhile, the homeowner sees this."

*Point to the floor plan updating.*

**Say:**
> "Their floor plan updates in real-time. They can leave a comment right on the plan. The contractor sees it immediately."

*Type a quick comment on tablet.*
*Show it appear on the phone.*

**Talking Points:**
- Clients stay informed
- Reduces phone calls
- Everything documented
- Builds trust

---

### Beat 6: Real Data (20 seconds)

**Show:** Switch to Brisso project with real data

**Say:**
> "And this isn't a demo - this is a real project we've been running for two weeks."

*Show the activity feed with real events.*
*Show the health score.*

**Talking Points:**
- Already in use
- Real progress tracking
- Actionable health scores

---

### Close

**Say:**
> "Revit to app to jobsite to client. One continuous thread."

*Pause. Let them ask questions.*

## Backup Plans

### If Import Fails
- Use pre-imported demo project
- Say: "Let me show you a project we already have loaded"
- Jump to Beat 4

### If Real-time Sync Delays
- Continue with demo, sync will catch up
- Say: "There's always a few seconds of lag on WiFi"
- Don't wait more than 5 seconds

### If Phone Runs Out of Battery
- Switch to backup phone
- Keep demo going

### If WiFi Goes Down
- The app has cached data
- Demo will work in read-only mode
- Say: "The app works offline too - it'll sync when we're back online"

### If Visitor Is Technical
- Mention Supabase real-time
- Mention React + TypeScript
- Mention the open architecture

### If Visitor Is a Contractor
- Focus on time savings
- Mention photo documentation
- Ask about their current pain points

### If Visitor Is a Homeowner
- Focus on transparency
- Show client portal features
- Mention reduced phone calls

## Key Messages

1. **"From Revit to pocket"** - Emphasize the seamless flow
2. **"One tap"** - Emphasize simplicity
3. **"Real-time"** - Emphasize collaboration
4. **"No training"** - Emphasize ease of use
5. **"Already using it"** - Emphasize production-ready

## Common Questions

**Q: What if I don't use Revit?**
> "We can import from other sources too. The app works with any floor plan. Revit is just the fastest path."

**Q: How much does it cost?**
> "We're in early access. Talk to us about your project size and we'll work something out."

**Q: Does it work on Android/iPhone?**
> "It's a web app - works on any phone with a browser. No app store needed."

**Q: What about offline?**
> "Basic offline works today. Full offline sync is coming soon."

**Q: Can clients edit anything?**
> "Clients can only view and comment. They can't change status or access internal notes."
