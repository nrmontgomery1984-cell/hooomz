# Hooomz Codebase Audit Report

**Date:** January 18, 2026 (Updated)
**Auditor:** Claude
**Purpose:** Complete application audit against spec documents in /docs/

---

## NEW CRITICAL FINDINGS (January 18, 2026)

### CRITICAL ISSUE #1: /add Page Does NOT Match Spec

**Location:** [add/page.tsx](src/app/add/page.tsx)

**What Spec Requires (19 Quick Add Actions):**
```
FREQUENT (8):
1. Add Photo
2. Clock In/Out
3. Complete Task
4. Add Note
5. Report Issue
6. Material Delivered
7. Inspection Passed/Failed
8. Weather Delay

MORE (11):
9. Meeting
10. Sub Arrived/Departed
11. Site Visit
12. Safety Incident
13. Material Shortage
14. Work Rescheduled
15. Task Blocked/Unblocked
16. Client Request
17. Receipt Uploaded
18. Milestone Reached
19. Document Shared
```

**What Currently Exists:**
```typescript
// WRONG - Only 6 actions + 3 admin actions
const quickActions = [
  { id: 'photo', ...href: '/photos/upload' },      // Links to non-existent route
  { id: 'time', ...href: '/time/clock' },          // Links to non-existent route
  { id: 'task', ...href: '/tasks/complete' },      // Links to non-existent route
  { id: 'note', ...href: '/notes/new' },           // Links to non-existent route
  { id: 'expense', ...href: '/expenses/new' },     // NOT IN SPEC - should not exist
  { id: 'issue', ...href: '/issues/new' },         // Links to non-existent route
];
const createActions = [
  { id: 'project', ...href: '/projects/new' },     // EXPLICITLY EXCLUDED by spec
  { id: 'estimate', ...href: '/estimates/new' },   // EXPLICITLY EXCLUDED by spec
  { id: 'customer', ...href: '/customers/new' },   // EXPLICITLY EXCLUDED by spec
];
```

**Impact:** 9 broken links, missing 13 required actions, includes 4 actions that should NOT exist.

**Correct Implementation:** Already exists at [QuickAddMenu.tsx](src/components/activity/QuickAddMenu.tsx) with all 19 actions.

---

### CRITICAL ISSUE #2: Services Missing Activity Log Integration

**The Spine Rule:** Every action in Hooomz MUST write to the Activity Log.

**Services MISSING Activity Log calls:**

| Service | Location | Missing Events |
|---------|----------|----------------|
| TaskService | `packages/scheduling/src/tasks/task.service.ts` | task.created, task.assigned, task.completed, task.blocked |
| CalendarService | `packages/scheduling/src/calendar/calendar.service.ts` | scheduling events |
| EstimateService | `packages/estimating/src/estimates/estimate.service.ts` | estimate.created, estimate.sent |

**Example of MISSING integration in TaskService (747 lines, NO ActivityService):**
```typescript
// task.service.ts - NO activity logging
async createTaskInstance(data: CreateTaskInstanceInput): Promise<TaskInstance> {
  const result = await this.repository.create(data);
  // MISSING: await this.activityService.createEvent({ event_type: 'task.created', ... })
  return result;
}
```

**Correct Implementation:** [ActivityService.ts](packages/api/src/services/ActivityService.ts) exists and works correctly.

---

### MAJOR ISSUE #3: Touch Targets Wrong Size

**Spec Requirement:** 48px minimum (work gloves on job site)
**Current Implementation:** 44px

**Location:** [globals.css](src/app/globals.css)
```css
@media (pointer: coarse) {
  button, a {
    min-height: 44px;  /* Should be 48px */
    min-width: 44px;   /* Should be 48px */
  }
}
```

---

### Decision Filter Compliance

| # | Filter | Status | Notes |
|---|--------|--------|-------|
| 1 | Activity Log | ❌ FAIL | TaskService, CalendarService, EstimateService don't log |
| 2 | Loop as Unit | ✅ PASS | Backend has LoopService correctly |
| 3 | Pain Point | ✅ PASS | Features address real problems |
| 4 | Modularity | ✅ PASS | Packages are independent |
| 5 | Mental Model | ⚠️ PARTIAL | Backend yes, UI no (card grids) |
| 6 | Mobile/Field | ⚠️ PARTIAL | Touch targets 44px not 48px |
| 7 | Traceability | ❌ FAIL | Missing activity log integration |
| 8 | Post-Project | ❌ FAIL | No homeowner data handoff |
| 9 | Affordability | ⚠️ PARTIAL | Missing Smart Estimating learning |
| 10 | Education | ❌ FAIL | No homeowner education features |
| 11 | Data Persistence | ❌ FAIL | Data doesn't stay with home |

**Compliance Score: 3/11 PASS, 3/11 PARTIAL, 5/11 FAIL**

---

## PRIORITIZED FIX PLAN

### Priority 1: CRITICAL (Activity Log Spine)
1. **Add ActivityService to TaskService** - All task.* events must be logged
2. **Add ActivityService to CalendarService** - All scheduling events must be logged
3. **Add ActivityService to EstimateService** - All estimate.* events must be logged
4. **Fix /add page** - Replace with QuickAddMenu's 19 actions OR redirect to /activity

### Priority 2: MAJOR (Field Usability)
5. **Update touch targets to 48px** in globals.css
6. **Connect all forms to Activity Log** - Every user action writes an event

### Priority 3: UI Alignment
7. **Replace home page** with sphere visualization
8. **Update color palette** to earth tones
9. **Create Sphere component** as core visualization

---

## ROOT CAUSE ANALYSIS

**Why did the /add page diverge?**
- Two parallel implementations were created
- QuickAddMenu.tsx follows spec correctly (FAB on /activity)
- /add page was created separately without referencing spec
- No single source of truth enforcement

**Why are services missing Activity Log integration?**
- Services were built before ActivityService
- No automated enforcement (linting, tests) for activity logging
- Pattern not established in service template

**Recommendation:** Add eslint rule or test that fails if service methods don't include activity logging.

---

## Executive Summary

The Hooomz codebase has a **fundamental disconnect** between the backend architecture (which correctly implements the loop/sphere concept) and the frontend UI (which is a generic construction software dashboard). The backend is approximately **70% aligned** with the vision, while the frontend is approximately **10% aligned**.

### Key Finding
The backend developers understood and implemented the nested loop architecture correctly. The frontend developers built a completely different application - a traditional construction management dashboard with tabs, cards, and generic navigation instead of the sphere-based visualization that is the core identity of Looops/Hooomz.

---

## What the Vision Required

### 1. Sphere-Based Visualization (NON-NEGOTIABLE)
- Projects as 3D orbs with health scores (0-100)
- Nested spheres: Project → Category → Location → Tasks
- Visual style: Pixar warmth meets Google Material
- Matte spheres, soft shadows, smooth gradients

### 2. Activity Log as Spine
- Every action writes to activity log
- Modules are specialized views of activity events
- Homeowner visibility controls on events

### 3. Smart Estimating/Learning System (THE DIFFERENTIATOR)
- Receipts → update price history → improve estimates
- Time entries → labor baselines → improve hour estimates
- Confidence levels: Verified (green, 3+), Limited (yellow, 1-2), Estimate (red, 0)

### 4. Color Palette
- Warm earth tones: sage green, warm yellow/gold, terracotta, muted red
- Cream/off-white backgrounds
- No harsh contrasts

### 5. Navigation Pattern
```
Projects Home (Visual spheres)
  └── Project Detail (sphere with sub-spheres)
        ├── Category spheres: Framing, Plumbing, Electrical...
        └── Location spheres: Kitchen, Bathroom...
              └── Task list with checkboxes
```

---

## What Exists: Backend Services

### GOOD: Loop Service (`packages/core/src/services/loop.service.ts`)
**Status: KEEP - Correctly Implemented**

The backend HAS the nested loop architecture:
- `LoopContext` - defines loop types and metadata
- `LoopIteration` - individual instances (projects, rooms, tasks)
- `getLoopTree()` - builds hierarchical tree structure
- `recalculateParentStatus()` - status bubbling from children to parents
- Child counts tracking (not_started, in_progress, blocked, complete)
- Integration with ActivityService for event logging

Key types implemented:
```typescript
LoopStatus = 'not_started' | 'in_progress' | 'blocked' | 'complete'
LoopTreeNode = { iteration, context, children, depth }
PROPERTY_TRANSFORMABLE_TYPES = ['room', 'floor', 'zone', 'outdoor_area']
```

### GOOD: Activity Event Types (`packages/shared/src/types/activity.ts`)
**Status: KEEP - Correctly Implemented**

The activity log spine is properly designed:
- 40+ event types covering all modules
- `homeowner_visible` flag for customer portal filtering
- `EVENT_VISIBILITY_DEFAULTS` map for consistent behavior
- Actor types: team_member, system, customer

Event categories:
- Core: project.created, project.status_changed, project.completed
- Estimating: estimate.sent, estimate.approved, tier.selected
- Scheduling: task.completed, milestone.reached
- Field Docs: photo.shared, inspection.passed/failed
- Payments: invoice.sent, payment.received

### PARTIAL: Estimating Service (`packages/estimating/`)
**Status: PARTIAL - Missing Learning System**

What exists:
- Line item management (CRUD)
- Markup calculations (global, differential, category-based)
- Estimate totals with material/labor breakdown
- Variance analysis (estimated vs actual)
- Recommended markup based on project type/size

What's MISSING (THE DIFFERENTIATOR):
- No confidence levels (Verified/Limited/Estimate)
- No receipt → price history tracking
- No time entry → labor baseline learning
- No data point counting for confidence
- No estimate accuracy trending

---

## What Exists: Frontend UI

### BAD: Home Page (`apps/web/src/app/page.tsx`)
**Status: REBUILD COMPLETELY**

What exists:
```jsx
// Generic dashboard with emoji icons and card grid
<div className="card">
  <div className="text-3xl font-bold text-primary-600">12</div>
</div>
// Sections as cards: Projects 🏗️, Customers 👥, Estimates 💰...
```

What should exist:
- Master sphere showing overall business health (0-100)
- Sub-spheres for active projects (tap to drill in)
- Confidence indicator for estimate accuracy
- Recent activity feed (from activity log spine)

### BAD: Navigation (`apps/web/src/components/ui/Navigation.tsx`)
**Status: REBUILD COMPLETELY**

What exists: Standard horizontal tabs with emoji icons
What should exist: Sphere-based orbital navigation, not tabs

### BAD: Color Palette (`apps/web/tailwind.config.js`)
**Status: REBUILD**

Current colors:
```javascript
primary: '#0ea5e9' // SKY BLUE - WRONG
accent: '#f59e0b'  // AMBER - partially right
```

Required colors:
```javascript
// Warm earth tones:
sage: { /* greens for healthy/on-track */ }
gold: { /* warm yellow for in-progress */ }
terracotta: { /* orange for attention needed */ }
earth: { /* muted reds for blocked */ }
cream: { /* off-white backgrounds */ }
```

### BAD: All Page Layouts
**Status: REBUILD**

Every page follows the same wrong pattern:
- Container with horizontal padding
- Back button
- Header with title
- Cards with data

Example from `projects/[id]/page.tsx`:
```jsx
<div className="container mx-auto px-4 py-6 max-w-7xl">
  <Button variant="ghost">← Back to Projects</Button>
  <ProjectDetail project={project} />
</div>
```

Should be:
- Full-screen sphere visualization
- Drill-down animations
- Status indicated by sphere appearance (bright/warm = healthy)

---

## Detailed Component Analysis

### Components to KEEP

| Component | Location | Reason |
|-----------|----------|--------|
| LoopService | `packages/core/src/services/loop.service.ts` | Correctly implements nested hierarchy |
| ActivityEvent types | `packages/shared/src/types/activity.ts` | Correct visibility controls |
| API hooks | `apps/web/src/lib/api/hooks/*.ts` | Clean React Query implementation |
| Calculation functions | `packages/estimating/src/calculations/` | Correct markup/margin math |
| Form components | `apps/web/src/components/features/*/Form.tsx` | Data entry works, just needs styling |
| API routes | `packages/api/src/routes/*.ts` | Backend API is functional |

### Components to REBUILD

| Component | Location | Issue |
|-----------|----------|-------|
| Home page | `apps/web/src/app/page.tsx` | Card grid, not spheres |
| Navigation | `apps/web/src/components/ui/Navigation.tsx` | Tabs, not orbital |
| ProjectList | `apps/web/src/components/features/projects/ProjectList.tsx` | Card list, not spheres |
| ProjectDetail | `apps/web/src/components/features/projects/ProjectDetail.tsx` | Tabs, not drill-down |
| All page layouts | `apps/web/src/app/**/*.tsx` | Container pattern wrong |
| Tailwind config | `apps/web/tailwind.config.js` | Blue palette, not earth tones |
| Global CSS | `apps/web/src/app/globals.css` | No sphere/3D styles |

### Components to CREATE (Don't Exist)

| Component | Purpose |
|-----------|---------|
| Sphere | 3D sphere with health score overlay |
| SphereCluster | Grid of sub-spheres for drill-down |
| DrillDownAnimation | Transition between sphere levels |
| HealthRing | Circular progress indicator |
| ConfidenceIndicator | Verified/Limited/Estimate badges |
| ActivityFeed | Real-time activity from spine |
| OrbitNavigation | Sphere-based primary navigation |
| LearningSystem | Receipt/time tracking for estimates |

---

## Backend vs Frontend Alignment

### Backend Architecture (Aligned)
```
LoopContext → LoopIteration → LoopTreeNode
     ↓              ↓              ↓
  Categories    Instances     Hierarchy

ActivityEvent → visibility → homeowner portal
```

### Frontend Architecture (Misaligned)
```
pages/projects/    → Card grid ❌
pages/customers/   → Card grid ❌
pages/estimates/   → Table view ❌
components/        → Generic Bootstrap-like UI ❌
```

### What Frontend SHOULD Be
```
pages/home         → Master sphere + sub-spheres
pages/project/[id] → Project sphere → category spheres
pages/[...drill]/  → Infinite drill-down with breadcrumb spheres
components/Sphere  → Core visualization component
```

---

## Specific Code Issues

### Issue 1: No Sphere Component Exists
Searched for `*sphere*` in codebase: **0 results**

### Issue 2: Loop Types Not Used in Frontend
Backend has:
- LoopContext, LoopIteration, LoopTreeNode
- getLoopTree() returns hierarchical structure

Frontend imports: **None of these types**

### Issue 3: Activity Feed Not Rendered
Backend has 40+ event types with visibility controls.
Frontend shows: Static placeholder text

### Issue 4: Confidence Levels Not Implemented
Vision required:
- ✓ Verified (green, 3+ data points)
- ~ Limited (yellow, 1-2 data points)
- ? Estimate (red, no data)

Current implementation: None

### Issue 5: Wrong Color Palette Throughout
- Uses blue (primary-600) everywhere
- Should use warm earth tones
- No sage green for healthy status
- No terracotta for warnings

---

## Effort Estimation by Category

### Can Be Saved (Keep as-is)
- All backend services (~40% of codebase)
- API routes and endpoints
- Type definitions and schemas
- Calculation/business logic functions
- Database repositories

### Needs Modification (Partial Rewrite)
- Estimating service (add confidence/learning)
- Form components (update styling only)
- API hooks (already good, may need new ones)

### Needs Complete Rebuild (Full Rewrite)
- All page layouts (22 pages)
- Navigation component
- Home/dashboard
- Project visualization
- Tailwind configuration
- Global CSS/theme

### Needs Creation (New Code)
- Sphere visualization system
- Health score calculations
- Confidence level tracking
- Learning system (receipt/time → baselines)
- Orbital navigation
- Animation system

---

## Priority Recommendations

### Phase 1: Foundation (Critical)
1. Replace Tailwind color palette with earth tones
2. Create Sphere component (the core visualization)
3. Create HealthScore display component
4. Rebuild home page with master sphere

### Phase 2: Core Navigation
1. Replace Navigation with orbital system
2. Implement drill-down animations
3. Connect frontend to LoopService tree structure

### Phase 3: Project Experience
1. Rebuild project list as sphere grid
2. Rebuild project detail as nested spheres
3. Add category and location sphere layers

### Phase 4: Learning System
1. Add confidence types to backend
2. Track data points per catalog item
3. Implement receipt → price history
4. Implement time → labor baseline
5. Display confidence badges in estimates

### Phase 5: Activity Integration
1. Create ActivityFeed component
2. Connect to backend activity events
3. Filter by homeowner_visible for portal

---

## Conclusion

The Hooomz codebase has solid backend bones but a completely misaligned frontend. The backend team understood the loop/activity architecture. The frontend team built a generic construction app.

**What Can Be Saved:** ~50% of total code (all backend, repositories, types, calculations)

**What Needs Rebuild:** ~40% of total code (all frontend UI, pages, components)

**What Needs Creation:** ~10% new code (sphere visualization, learning system, animations)

The good news: The API layer is correct, so the frontend rebuild can proceed without backend changes (except adding confidence tracking to estimating).

The bad news: Every single page and UI component needs to be rebuilt to match the sphere visualization vision. There is no path to incrementally improve the current UI - it fundamentally conflicts with the design.

---

## Files Reference

### Keep These Files
- `packages/core/src/services/loop.service.ts`
- `packages/core/src/types/loop.types.ts`
- `packages/shared/src/types/activity.ts`
- `packages/estimating/src/calculations/index.ts`
- `packages/*/src/*/*.repository.ts`
- `apps/api/src/routes/*.ts`
- `apps/web/src/lib/api/hooks/*.ts`

### Rebuild These Files
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/*/page.tsx` (all pages)
- `apps/web/src/components/ui/Navigation.tsx`
- `apps/web/src/components/features/*/List.tsx`
- `apps/web/src/components/features/*/Detail.tsx`
- `apps/web/tailwind.config.js`
- `apps/web/src/app/globals.css`

### Create These Files
- `apps/web/src/components/visualization/Sphere.tsx`
- `apps/web/src/components/visualization/SphereCluster.tsx`
- `apps/web/src/components/visualization/HealthRing.tsx`
- `apps/web/src/components/visualization/OrbitNav.tsx`
- `apps/web/src/components/visualization/ConfidenceBadge.tsx`
- `apps/web/src/components/activity/ActivityFeed.tsx`
- `packages/estimating/src/learning/` (new module)
