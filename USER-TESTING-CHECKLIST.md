# Hooomz Interiors — User Testing Checklist

**For:** Nathan Montgomery
**Date:** 2026-02-09
**App URL:** http://localhost:3000
**Browser:** Chrome recommended (for DevTools → Application → IndexedDB inspection)

> Tick boxes as you go. Expected behaviors are listed so you know if something looks wrong.
> Test with **both Nathan and Nishant** as selected crew member where noted — training gate behaves differently for each.

---

## A. First Launch & Setup

### A1. Seed Data

- [ ] **Open http://localhost:3000/labs/seed**
  Expected: Page shows "Data Sources" card listing 21 SOPs, ~140 Checklist Items, ~15 Knowledge Items, 28 Products, 18 Techniques, 16 Tool Methods, 2 Crew Members
  If broken: Page is blank, spinner never stops, or "Initialization Error"

- [ ] **Click "Seed All Data"**
  Expected: Progress log scrolls through each SOP, knowledge item, catalog item, crew member. Final result card shows green border with counts. Total ~290 records.
  If broken: Red error card, or counts are 0, or missing categories

- [ ] **Click "Seed All Data" again (test idempotency)**
  Expected: Log shows "Skipping SOPs — 21 already exist", "Skipping knowledge items — 15 already exist", "Skipping crew members — 2 already exist". Catalog numbers may repeat.
  If broken: Duplicate entries created, error on second run

- [ ] **Click "Clear & Re-seed" (test reset)**
  Expected: Log shows clearing steps then re-seeding. Same final counts as first seed.
  If broken: Error during clearing, or partial data after reseed

### A2. Crew Selection

- [ ] **Navigate to http://localhost:3000 (home page)**
  Expected: Crew selection overlay appears: "Who's working today?" with Nathan Montgomery (Master badge, purple) and Nishant (Learner badge, amber)
  If broken: No overlay, or empty crew list, or missing tier badges

- [ ] **Select Nathan Montgomery**
  Expected: Blue border + teal avatar on Nathan's card. Project dropdown shows below (may say "No projects yet").
  If broken: No visual selection feedback, or project dropdown missing

- [ ] **Click "Start Day" without selecting a project**
  Expected: Overlay dismisses. Home page appears with "No projects yet" empty state.
  If broken: Button disabled without project, or error on click

- [ ] **Verify DevTools:** Open DevTools → Application → IndexedDB → hooomz-db → Look for an active crew session entry
  Expected: Entry with crewMemberId: "crew_nathan", crewMemberName: "Nathan Montgomery"

### A3. Creating a Project

- [ ] **Click the "+" button (top right of home page) OR "Start a Project"**
  Expected: Navigates to /intake page with two options: "Homeowner Intake" and "Contractor Intake"
  If broken: 404 page, or no intake options shown

- [ ] **Choose "Contractor Intake" and fill out a project: "222 Whitney Ave — Kitchen & Living Room"**
  Expected: Multi-step wizard: trade selection, room details, notes. On submit, navigates back to home. Project card appears on dashboard.
  If broken: Wizard steps missing, form submission fails, no project on dashboard

- [ ] **Verify the project appears on the home page**
  Expected: Project card with name, health score (0% initially), progress bar, "Next:" indicator
  If broken: Card missing, or wrong project name

### A4. Building Structure (Floors & Rooms)

- [ ] **Navigate to http://localhost:3000/labs/structure**
  Expected: "No structure defined" empty state with "Apply Standard Residential Template" button
  If broken: Spinner forever, or structure already showing (from a previous session — use Clear & Re-seed)

- [ ] **Click "Apply Standard Residential Template"**
  Expected: Template applies. Page shows tree: Main Floor (Kitchen, Living Room, Dining Room, Bathroom, Laundry), Upper Floor (Master Bedroom, Bedroom 2, Bedroom 3, Full Bath), Basement (Rec Room, Storage, Utility)
  If broken: Error, no rooms appear, or wrong room names

- [ ] **Add a custom room: Click "+" on Main Floor → type "Mud Room" → confirm**
  Expected: "Mud Room" appears under Main Floor
  If broken: Add button missing, or room doesn't save

- [ ] **Delete the custom room: Click trash icon on "Mud Room"**
  Expected: Room disappears from the tree
  If broken: Trash icon missing, or room persists

---

## B. Estimating

### B1. Creating a New Estimate

- [ ] **Navigate to http://localhost:3000/estimates**
  Expected: Estimate list page. If your project has no line items yet, it shows "No estimates yet" with a "Start an Estimate" button. If other projects have items, their cards appear.
  If broken: Old placeholder page with "John Smith" / "Jane Doe" hardcoded data

- [ ] **Click "New" (header) or "Start an Estimate"**
  Expected: Navigates to /estimates/select-project. Lists all your projects.
  If broken: 404, or no projects listed

- [ ] **Select your "222 Whitney Ave" project**
  Expected: Navigates to /estimates/[projectId]. Shows project name in header, "0 line items", empty state with "Add Line Item" dashed button.
  If broken: Wrong project name, or error loading

### B2. Adding Line Items

- [ ] **Click "Add Line Item"**
  Expected: Form appears with teal border. Fields: Description, Category (dropdown), Type (Labor/Material toggle), Qty, Unit, $/Unit, auto-calculated total, Est. Hours (for labor), SOP Code picker (pill buttons for all 21 SOPs), Looped toggle (when SOP selected).
  If broken: Form doesn't appear, or fields missing

- [ ] **Add a LABOR item with SOP: Description "Install LVP Flooring", Category: Flooring, Type: Labor, Qty: 3, Unit: sq ft, $/Unit: 45, Est Hours: 4. Select SOP "HI-SOP-FL-002 — LVP Installation". Toggle "Looped" ON, label "Per Room".**
  Expected: Total shows $135. SOP pill turns teal when selected. Looped toggle appears after selecting SOP. Loop label input appears after toggling on.
  If broken: Total miscalculated, SOP picker empty, looped toggle missing

- [ ] **Click "Add"**
  Expected: Form closes. Line item card appears showing: "Install LVP Flooring", SOP badge "HI-SOP-FL-002" in teal, "Flooring · 3 sq ft × $45", "Labor" in blue, purple "Per Room" loop pill, "4h/unit" hours pill, "$135" total.
  If broken: Item not saved, card shows wrong data, SOP badge missing

- [ ] **Add a MATERIAL item WITHOUT SOP: Description "Paint — Walls", Category: Painting, Type: Material, Qty: 10, Unit: gal, $/Unit: 80. No SOP code selected.**
  Expected: Card shows "Paint — Walls", "Material" in amber, no SOP badge, no loop pill, "$800" total.
  If broken: Item not saved, or SOP fields shown when none selected

- [ ] **Add a LABOR item with SOP (non-looped): Description "Paint Walls", Category: Painting, Type: Labor, Qty: 1, Unit: lot, $/Unit: 800, Est Hours: 8. Select SOP "HI-SOP-PT-001 — Interior Wall Painting". Leave "Looped" OFF.**
  Expected: Card shows "Paint Walls", SOP badge, no loop pill, "8h/unit", "$800".
  If broken: Looped toggle incorrectly showing

### B3. Summary Card

- [ ] **Verify the summary card at the top**
  Expected: Three columns: Labor (blue, sum of labor items), Materials (amber, sum of material items), Total (bold, sum of both). Should show Labor: $935, Materials: $800, Total: $1,735 (based on items above).
  If broken: Totals missing or miscalculated

### B4. Editing a Line Item

- [ ] **Click the pencil icon on "Install LVP Flooring"**
  Expected: Form re-opens pre-filled with all values: description, category, qty, unit, unitCost, selected SOP, looped ON, loop label "Per Room", hours 4.
  If broken: Form opens empty, or values wrong

- [ ] **Change quantity to 5 → click "Update"**
  Expected: Card updates to show "5 sq ft × $45" and total "$225". Summary card total updates.
  If broken: Old values persist, or total doesn't update

### B5. Deleting a Line Item

- [ ] **Click the red trash icon on "Paint — Walls" (material item)**
  Expected: Item disappears immediately. Summary card updates (Materials drops by $800).
  If broken: Item persists, or error

### B6. Approving an Estimate

- [ ] **Click "Approve Estimate" (teal button at bottom)**
  Expected: Button shows "Approving..." with spinner. After 1-2 seconds, green "Estimate Approved" card appears showing:
  - "2 blueprints generated" (one for FL-002 looped, one for PT-001 non-looped)
  - "1 task auto-deployed" (the non-looped PT-001)
  - "Deploy looped blueprints →" link (because LVP is looped and not yet deployed)
  If broken: Error message, 0 blueprints, wrong counts, or no result card

- [ ] **Verify DevTools:** IndexedDB → hooomz-db → sopTaskBlueprints store
  Expected: 2 blueprint records. One with `isLooped: true` (LVP), one with `isLooped: false` (Paint). Paint blueprint should have `status: "deployed"`. LVP should have `status: "pending"`.

- [ ] **Verify DevTools:** IndexedDB → hooomz-db → tasks store
  Expected: At least 1 task for the paint item (auto-deployed). Should have `sopCode`, `blueprintId`, `projectId` fields.

---

## C. Task Deployment

### C1. Viewing Pending Blueprints

- [ ] **Click "Deploy looped blueprints →" from the approval card (or navigate to /labs/structure/deploy)**
  Expected: Deploy page shows 1 pending looped blueprint: "LVP Installation — Install LVP Flooring" with SOP code, hours, and "Loop: Per Room" label. Room dropdown shows all rooms from the Standard Residential template.
  If broken: "All blueprints deployed" (wrong — LVP should be pending), or no rooms in dropdown (building structure not defined for this project)

### C2. Deploying to a Room

- [ ] **Select "Main Floor → Kitchen" from the dropdown → click "Deploy to Location"**
  Expected: Button shows "Deploying...", then the blueprint card refreshes. If it's the only pending blueprint, page shows "All blueprints deployed".
  If broken: Error, or blueprint still showing as pending

- [ ] **Navigate back to /labs/structure/deploy**
  Expected: If you deployed to all needed rooms, shows "All blueprints deployed". If you only deployed to 1 room, the blueprint won't reappear (blueprints deploy once — each deploy creates one task bound to one room).
  If broken: Blueprint still showing after deploy

### C3. Non-looped Auto-Deploy

- [ ] **Verify the paint task was auto-deployed (no manual deploy needed)**
  Expected: The "Paint Walls" task exists in the tasks store in IndexedDB WITHOUT a `loopIterationId` (it wasn't bound to a room — it's project-wide).
  If broken: No paint task in IndexedDB

### C4. Deploying Additional Rooms Later

- [ ] **To deploy LVP to more rooms, you would need to approve a new estimate with the same SOP** (each approval generates new blueprints). This is expected behavior — blueprints are one-to-one with deploy actions.

---

## D. Project View & Navigation

### D1. Project Task List

- [ ] **Navigate to the home page → click your project card**
  Expected: `/projects/[id]` page loads. Shows project name, health score (percentage), task list.
  If broken: 404, or empty page, or "Loading..." forever

- [ ] **Verify deployed tasks appear**
  Expected: Paint task visible (from auto-deploy). Kitchen LVP task visible (if you deployed it in section C). Each task card shows title, SOP badge, location label (if looped).
  If broken: No tasks shown, or tasks without SOP badges

### D2. Task Details

- [ ] **Tap a task card to expand it**
  Expected: Card expands to show: SOP checklist (if task has sopId), notes input, completion button.
  If broken: Nothing happens on tap, or checklist missing

### D3. Category/Location Filtering

- [ ] **Navigate to /projects/[id]/[category] (e.g., by tapping a filter if available)**
  Expected: Tasks filtered by work category
  If broken: Filter doesn't work or shows all tasks

---

## E. Field Work — Clocking In

### E1. Time Clock Widget

- [ ] **Look for the floating clock widget at the bottom-right (above the nav bar)**
  Expected: Small pill-shaped widget visible on every page when crew session is active.
  If broken: Widget not visible, or only visible on some pages

- [ ] **Tap the clock widget to expand it**
  Expected: Widget expands showing: today's time total, list of today's entries (if any), "Clock In" button (if not clocked in), task controls (if clocked in).
  If broken: Widget doesn't expand, or controls missing

### E2. Clock In

- [ ] **Tap "Clock In"**
  Expected: Task picker appears showing available tasks for the current project. Should include deployed tasks from the estimate pipeline.
  If broken: No tasks in picker, or only old tasks appear

- [ ] **Select a task (e.g., "Paint Walls")**
  Expected: Timer starts. Widget shows task name + running clock (0:00, 0:01, 0:02...). Widget collapses to pill showing current task + timer.
  If broken: Timer doesn't start, or wrong task name

### E3. Switch Task

- [ ] **Expand widget → tap "Switch" (arrow icon)**
  Expected: Task picker reappears. Current task entry is closed. Selecting a new task starts a new entry.
  If broken: Switch button missing, or current entry not closed

### E4. Break

- [ ] **Expand widget → tap "Break" (coffee icon)**
  Expected: Timer pauses. Widget shows "On Break" state.
  If broken: Timer keeps running during break

- [ ] **Tap "Resume" to end break**
  Expected: Timer resumes from where it was.
  If broken: Timer resets, or resume button missing

### E5. Idle Detection

- [ ] **Leave the app open without touching it for 15+ minutes**
  Expected: "Are you still working?" modal appears with "Still Working" and "Clock Out" options.
  If broken: No modal appears (check if idle detection is enabled)

### E6. Clock Out

- [ ] **Expand widget → tap "Clock Out" (X icon)**
  Expected: All entries finalized. Widget returns to "Clock In" state. Today's total shown.
  If broken: Error on clock out, or entries not finalized

---

## F. Field Work — SOP Checklists

### F1. Opening a Checklist

- [ ] **Navigate to /projects/[id] → expand a task that has an SOP (e.g., "Paint Walls")**
  Expected: SOP checklist appears below the task title. Shows step-by-step items from the SOP's quick_steps. Each step has a checkbox. A teal link to the SOP detail page may appear.
  If broken: No checklist shown, or "No checklist items" message

### F2. Checking Items

- [ ] **Tap a checkbox to mark a step complete**
  Expected: Checkbox fills with check mark. Step text may get a strikethrough or dim. Progress updates.
  If broken: Checkbox doesn't toggle, or state doesn't persist after page refresh

### F3. Observation Triggers

- [ ] **Check a step that has a photo/document hint (look for steps mentioning "photo" or "document")**
  Expected: For `on_check` mode items: an observation confirmation card appears immediately asking to confirm or deviate.
  For `batch` mode items: no immediate popup — observation is queued for later.
  If broken: No observation card for on_check items, or unexpected popup for batch items

### F4. Completing All Steps

- [ ] **Check all checklist items for a task**
  Expected: All checkboxes filled. Progress shows 100%.
  If broken: Can't check some items, or progress doesn't reach 100%

---

## G. Task Completion

### G1. Marking Complete

- [ ] **On the project detail page, tap the complete button (check icon) on an expanded task**
  Expected: Task status changes to "complete". Task card appearance changes (completed styling).
  If broken: Button not responsive, or task still shows as incomplete

### G2. Batch Observation Modal

- [ ] **If the completed task had pending batch observations:** A modal should appear after completing the task
  Expected: "Batch Observations" modal with pending items. Each item shows the observation draft with Confirm/Skip options. "Confirm All" button at bottom.
  If broken: No modal appears even though checklist items had batch triggers

- [ ] **Confirm or skip each pending observation**
  Expected: Items process one by one. After all done, modal closes.
  If broken: Items don't process, or modal doesn't close

### G3. Post-Completion

- [ ] **Verify the completed task's card shows completion state**
  Expected: Check mark, different styling (dimmed or green border)
  If broken: Card looks unchanged

- [ ] **Verify health score updates on the project header**
  Expected: Health percentage increases (e.g., from 0% to 50% if 1 of 2 tasks complete)
  If broken: Health stays at 0%

---

## H. Training & Certification

### H1. Training Dashboard

- [ ] **Navigate to http://localhost:3000/labs/training**
  Expected: Page shows crew members (Nathan, Nishant) with training stats. Summary bar: Certified, Review Ready, In Progress counts. Each crew card shows progress bar and tier badge.
  If broken: Empty page, or "No crew members found"

### H2. Crew Training Detail

- [ ] **Click Nathan's card**
  Expected: Navigates to /labs/training/crew_nathan. Shows Nathan's training records per SOP. Initially empty (no certifications yet).
  If broken: 404, or wrong crew member data

### H3. Test with Nishant (Different Tier)

- [ ] **Log out (or clear session) → select Nishant as crew member → repeat task flow**
  Expected: Nishant has "Learner" tier badge. Training dashboard shows different progress. When working on tasks, supervised completion may auto-detect if Nathan is also clocked in.
  If broken: Same data as Nathan, or tier badge wrong

### H4. Certification Flow

The full certification flow (3 supervised completions + 80% review + manual signoff) requires:
1. Nishant completes a task with SOP while Nathan is supervising (clocked in simultaneously)
2. Repeat 3 times for the same SOP
3. Record a review with 80%+ score
4. Manual signoff by Nathan

This is a multi-session test. For now, verify:
- [ ] **Training dashboard loads and shows correct crew data**
- [ ] **Clicking a crew member navigates to their detail page**

---

## I. Budget Tracking

### I1. Budget on Deployed Tasks

- [ ] **Check DevTools:** IndexedDB → hooomz-db → taskBudgets store
  Expected: Budget records exist for deployed tasks that had `estimatedHoursPerUnit > 0`. Fields: `taskId`, `budgetedHours`, `actualHours` (0 initially), `efficiency` (null initially).
  If broken: No budget records, or missing for tasks with estimated hours

### I2. Budget Indicators

- [ ] **On the project detail page, look for budget indicators on task cards**
  Expected: Tasks with budgets should show efficiency or hours indicator. Color coding: green (on/under budget), amber (approaching), red (over).
  Note: Indicators may not be visible if no actual hours have been logged yet.

---

## J. Labs & Knowledge

### J1. SOPs

- [ ] **Navigate to http://localhost:3000/labs/sops**
  Expected: List of 21 SOPs organized by trade family (Drywall, Finish Carpentry, Flooring, Paint, Safety). Each shows SOP code, title, version.
  If broken: Empty list, or wrong SOP count

- [ ] **Click any SOP (e.g., "HI-SOP-FL-002 — LVP Installation")**
  Expected: Detail page with SOP info, checklist items, version history. Checklist items match the quick_steps from the field guide.
  If broken: 404, or empty detail page

### J2. Create New SOP

- [ ] **Navigate to http://localhost:3000/labs/sops/new**
  Expected: SOP creation form with fields for code, title, trade family, observation mode, certification settings.
  If broken: 404, or form errors

### J3. Knowledge Base

- [ ] **Navigate to http://localhost:3000/labs/knowledge**
  Expected: List of ~15 knowledge items from lab test references (L-2026-xxx). Each shows title, type, confidence score.
  If broken: Empty list

- [ ] **Click any knowledge item**
  Expected: Detail page with full description, tags, confidence score, challenge system.
  If broken: 404, or empty detail

### J4. Observations

- [ ] **Navigate to http://localhost:3000/labs/observations**
  Expected: List of field observations (may be empty if no checklist items have triggered observations yet).
  If broken: Error loading page

### J5. Experiments

- [ ] **Navigate to http://localhost:3000/labs/experiments**
  Expected: Experiments page loads (may be empty).
  If broken: Error or 404

### J6. Catalogs

- [ ] **Navigate to http://localhost:3000/labs/catalogs**
  Expected: Shows 28 products, 18 techniques, 16 tool methods seeded earlier. Browse through tabs/sections.
  If broken: Empty catalogs, or counts don't match

### J7. Labs Dashboard

- [ ] **Navigate to http://localhost:3000/labs**
  Expected: Labs hub page with navigation cards to all sub-sections (SOPs, Knowledge, Observations, Experiments, Catalogs, Training, Structure, Seed).
  If broken: Missing sections or broken links

---

## K. Activity Log

### K1. View Activity Feed

- [ ] **Navigate to http://localhost:3000/activity**
  Expected: Chronological feed of all events. After completing the flows above, you should see events for:
  - Estimate line items added/updated/deleted
  - Estimate approved (financial event)
  - Pipeline blueprints generated
  - Tasks deployed
  - Time clock entries
  - SOP checklist completions
  - Task completions
  If broken: Empty feed, or missing event types

### K2. Event Types

- [ ] **Scroll through the feed and verify variety of event types**
  Expected: Different event types have different labels/icons. Financial events, labs events, time events, training events should all appear as the system is used.
  If broken: All events look the same, or some types never appear

---

## L. Change Orders

### L1. Change Order Creation

Change orders are created for projects that already have an approved estimate. The CO flow mirrors the estimate flow:

- [ ] **Look for a change order creation UI on the project detail page or a dedicated /change-orders route**
  Note: The CO backend (`useApproveChangeOrderWithPipeline`) is fully implemented. The UI for creating and approving COs may or may not have a dedicated page. If no UI is found, this is a known gap.
  Expected: If UI exists — form to add CO line items with SOP codes, approve button.
  If broken: No CO UI found (known gap — backend is ready)

---

## M. Edge Cases & Error Handling

### M1. Empty States

- [ ] **Approve an estimate with NO line items that have SOP codes**
  Expected: Approval succeeds but shows "0 blueprints generated, 0 tasks auto-deployed". No error.
  If broken: Error thrown, or wrong message

- [ ] **Navigate to /labs/structure/deploy with no building structure defined for the project**
  Expected: Shows "No building structure defined" with link to define floors/rooms first.
  If broken: Error, or shows empty room list

### M2. Refresh Resilience

- [ ] **While on the estimate detail page with line items, refresh the browser (Ctrl+R)**
  Expected: Page reloads, all line items still present (loaded from IndexedDB). No data loss.
  If broken: Line items disappear, or "Initializing app..." hangs

- [ ] **While the time clock is running, refresh the browser**
  Expected: Timer resumes from the stored timestamp (not reset to 0). Current task shown.
  If broken: Timer resets to 0, or "not clocked in" shown

### M3. Double Seed

- [ ] **Seed data twice without clearing**
  Expected: Second seed skips all categories that already exist. No duplicates.
  If broken: Duplicate SOPs, crew members, or knowledge items

### M4. Data Isolation

- [ ] **Create a second project (via /intake)**
  Expected: Second project appears on dashboard with its own health score. Line items, tasks, and structure are independent from the first project.
  If broken: Data from first project appears in second, or vice versa

- [ ] **Navigate to /estimates → verify each project's estimate is separate**
  Expected: Different line item counts and totals per project.
  If broken: Same items in both projects

### M5. DevTools Verification

At any point during testing, you can verify data integrity in DevTools:

- [ ] **Open DevTools → Application → IndexedDB → hooomz-db**
  Expected: You should see stores including: sops, sopChecklistItemTemplates, knowledgeItems, products, techniques, toolMethods, crewMembers, projects, lineItems, tasks, sopTaskBlueprints, deployedTasks, taskBudgets, timeEntries, activityEvents, and more (~40 total stores).
  If broken: Stores missing, or database version mismatch error

---

## Quick Reference: All Pages

| Route | Purpose |
|-------|---------|
| `/` | Home dashboard — projects, health, activity |
| `/intake` | Create new project (homeowner or contractor wizard) |
| `/estimates` | Estimate list (projects with line items) |
| `/estimates/select-project` | Pick a project for new estimate |
| `/estimates/[projectId]` | Estimate detail — line item CRUD + approve |
| `/projects/[id]` | Project detail — task list, health, completion |
| `/projects/[id]/[category]` | Filtered tasks by category |
| `/projects/[id]/[category]/[location]` | Filtered tasks by location |
| `/activity` | Activity log feed |
| `/profile` | User profile |
| `/add` | Quick add |
| `/labs` | Labs hub |
| `/labs/seed` | Seed/reset data |
| `/labs/sops` | SOP list |
| `/labs/sops/[id]` | SOP detail + checklist |
| `/labs/sops/new` | Create new SOP |
| `/labs/knowledge` | Knowledge base list |
| `/labs/knowledge/[id]` | Knowledge item detail |
| `/labs/observations` | Field observations list |
| `/labs/experiments` | Experiments list |
| `/labs/catalogs` | Product/technique/tool catalogs |
| `/labs/submissions` | Lab submissions |
| `/labs/training` | Training dashboard |
| `/labs/training/[crewId]` | Crew member training detail |
| `/labs/structure` | Building structure (floors/rooms) |
| `/labs/structure/deploy` | Deploy looped blueprints to rooms |
| `/properties/[id]/activity` | Property-specific activity |
