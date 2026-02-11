# HOOOMZ OS - CLAUDE CODE REFERENCE

> **READ THIS FIRST.** This document contains critical context that must persist across sessions. If you're about to build UI components, database schemas, or features, verify your work against these specifications.

---

## CRITICAL: What Hooomz IS

Hooomz is **NOT generic construction software**. It is the **same platform as Looops** applied to construction/home management.

### The Test

Before building anything, ask:
1. Could this component exist in Looops without looking out of place?
2. Does this match the sphere-based visualization pattern?
3. Does this avoid the "construction software" aesthetic?

If any answer is "no," you're building the wrong thing.

---

## UI REQUIREMENTS (NON-NEGOTIABLE)

### DO NOT BUILD:
- ❌ Traditional nav bars with text labels
- ❌ Card grids with icons and descriptions
- ❌ Generic dashboard layouts with stat cards
- ❌ Gantt charts as primary navigation
- ❌ Dense data tables
- ❌ Dark/industrial color schemes
- ❌ Blue as primary color
- ❌ Horizontal tab navigation

### DO BUILD:
- ✅ Sphere-based visualization (3D orbs with health scores 0-100)
- ✅ Nested spheres (tap parent → see children)
- ✅ Widget cards below spheres for metrics
- ✅ Bottom navigation with icons only
- ✅ Progressive disclosure (summary first, details on tap)
- ✅ Light, warm, approachable colors

### Visual Style
```
Aesthetic: Pixar warmth + Google clarity + Disney magic
Spheres: Smooth matte finish, minimal gradient, score number in center
Backgrounds: Clean white
Shadows: Soft, not harsh
Touch targets: 44px minimum (work gloves)
```

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Teal | #16A085 | Healthy status, primary actions |
| Status Green | #27AE60 | Completed, verified |
| Status Amber | #F39C12 | Attention needed |
| Status Coral | #E74C3C | Behind, needs action |
| Dark Slate | #2C3E50 | Text |

---

## ARCHITECTURE REQUIREMENTS

### 1. Activity Log is the Spine

Every action writes to an immutable event log. This is not optional.
```typescript
// EVERY user action must call this
await createActivityEvent({
  event_type: 'task.status_changed',
  project_id,
  entity_type: 'task_instance',
  entity_id: taskId,
  event_data: { old_status, new_status }
});
```

### 2. Nested Loop Architecture

Everything is a loop containing smaller loops:
```
Project → Work Category → Location → Task → Checklist Item
```

Status bubbles up: worst child status becomes parent status.

### 3. Three-Axis Model

Tasks can be filtered by three orthogonal axes:
- **Work Category**: FL (Flooring), PT (Paint), FC (Finish Carpentry), TL (Tile), DW (Drywall)
- **Stage**: ST-DM (Demo), ST-PR (Prime & Prep), ST-FN (Finish), ST-PL (Punch), ST-CL (Closeout)
- **Location**: Living Room, Kitchen, Bedroom, etc.

Same task appears in all three views.

### 4. Division Scoping

Hooomz is an **ecosystem** with multiple business divisions. The current web app is **Hooomz Interiors**.

**Divisions:**
- `interiors` - Interior renovations (flooring, paint, trim) - **Current app**
- `exteriors` - Exterior work (roofing, siding, decks) - Future
- `diy` - DIY guidance platform - Future
- `maintenance` - Ongoing home maintenance - Future

**Interiors Work Categories (Bundle Types):**
| Bundle | Trades | Target Price |
|--------|--------|--------------|
| Floor Refresh | FL, FC | ~$5,400 |
| Room Refresh | FL, PT, FC | ~$8,200 |
| Full Interior | FL, PT, FC, DW | ~$11,800 |
| Accent Package | FC, PT | Variable |
| Custom | User-defined | Variable |

**Critical Rule:** Never delete or rename division-specific types at the ecosystem level. Instead, **scope** them to their appropriate division using the `WORK_CATEGORY_DIVISION_MAP` in `shared-contracts`.

---

## SMART ESTIMATING (THE DIFFERENTIATOR)

This is what makes Hooomz different from every other construction app.

### Learning Flows

1. **Receipts → Price baselines** (what materials actually cost)
2. **Time entries → Labor baselines** (how long tasks actually take)
3. **Completed projects → Estimate accuracy** (how good were our guesses)

### Confidence Indicators

Every estimate shows data confidence:

| Icon | Level | Criteria |
|------|-------|----------|
| ✓ | Verified | 3+ data points |
| ~ | Limited | 1-2 data points |
| ? | Estimate | No field data |
```
// Display like this:
Labor: 24 hrs ✓
Materials: $2,400 ~
Contingency: 10% ?
```

---

## 11 DECISION FILTERS

Every feature must pass these:

| # | Filter | Question |
|---|--------|----------|
| 1 | Activity Log | Does this write to the activity log? |
| 2 | Loop as Unit | Is this organized as a nested loop? |
| 3 | Pain Point | Does this solve a real contractor problem? |
| 4 | Modularity | Does the system work if this module is removed? |
| 5 | Mental Model | Does this match how contractors think? |
| 6 | Mobile/Field | Can this be used with one hand on a job site? |
| 7 | Traceability | Can we trace this to its origin? |
| 8 | Post-Project | Does this create value after the project ends? |
| 9 | Affordability | Does this make homes cheaper or contractors more profitable? |
| 10 | Education | Does this educate the homeowner? |
| 11 | Data Persistence | Does data stay with the home? |

---

## BEFORE YOU BUILD

### Checklist

- [ ] Read HOOOMZ_VISION.md for decision criteria
- [ ] Read HOOOMZ_UI_SPEC.md for visual requirements
- [ ] Read HOOOMZ_ARCHITECTURE.md for technical patterns
- [ ] Verify your component could exist in Looops
- [ ] Verify you're using spheres, not cards/lists
- [ ] Verify every action writes to activity log
- [ ] Verify touch targets are 44px+
- [ ] Verify it works offline (or explicitly doesn't need to)

### Red Flags

If you find yourself building:
- A dashboard with multiple stat cards → STOP
- A sidebar navigation → STOP
- A data table as the main view → STOP
- Dark colors or industrial aesthetic → STOP
- Anything that wouldn't fit in Looops → STOP

---

## REFERENCE DOCUMENTS

Full specifications in `/docs`:
- `HOOOMZ_VISION.md` - Vision, decision criteria, what success looks like
- `HOOOMZ_UI_SPEC.md` - Complete UI specification with sphere details
- `HOOOMZ_ARCHITECTURE.md` - Activity log, Smart Estimating, data model

**These documents are the source of truth. When in doubt, read them.**
