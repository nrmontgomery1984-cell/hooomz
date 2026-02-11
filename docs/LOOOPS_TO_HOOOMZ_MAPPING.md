# Looops to Hooomz UI Mapping Report

> **Purpose**: This document provides a detailed analysis of the Looops app architecture and how it maps to Hooomz. Use this as a reference when building or modifying any Hooomz UI components.

---

## 1. Executive Summary

Hooomz should be **Looops applied to construction/home management**. The core visualization paradigm is identical:

| Looops Concept | Hooomz Equivalent |
|----------------|-------------------|
| "Meaning" (outer ring) | Portfolio/Company Health |
| Life Areas (Health, Wealth, etc.) | Individual Projects |
| Sub-areas within Life Areas | Work Categories / Stages / Locations |
| Tasks/Habits | Construction Tasks |
| Health Score (0-100) | Project/Task Health Score |

The user explicitly confirmed: *"Yes, this is what I've been after all along"*

---

## 2. Looops Core Architecture

### 2.1 The Loop Visualization Pattern

Looops uses a **nested sphere/ring visualization** where:

1. **Outer Ring**: Represents the parent context (e.g., overall "Meaning" or life purpose)
2. **Inner Spheres**: Represent children arranged in a circle (e.g., Health, Wealth, Relationships)
3. **Drill-Down**: Tapping an inner sphere makes it the new outer ring, revealing its children

```
┌─────────────────────────────────────┐
│            OUTER RING               │
│         (Parent Context)            │
│                                     │
│      ┌───┐       ┌───┐              │
│     │ ○ │       │ ○ │              │
│      └───┘       └───┘              │
│            ┌───┐                    │
│           │ ○ │  ← Inner Spheres   │
│            └───┘                    │
│      ┌───┐       ┌───┐              │
│     │ ○ │       │ ○ │              │
│      └───┘       └───┘              │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 Health Score System

Every loop has a health score from 0-100 that determines its color:

| Score Range | Status | Color | Hex |
|-------------|--------|-------|-----|
| 70-100 | Healthy | Teal/Green | #16A085 |
| 40-69 | Progress | Amber | #F39C12 |
| 20-39 | Attention | Orange | #E67E22 |
| 0-19 | Blocked | Red/Coral | #E74C3C |

**Key Principle**: Status bubbles up. The worst child status becomes the parent's status. A project with one blocked task shows as blocked.

### 2.3 Visual Style

Looops uses a **dark theme** with these characteristics:
- Navy background (#1a1a2e)
- Gradient spheres with glow effects
- Smooth, matte finish on spheres
- Minimal gradients (not glossy 3D)
- Score number displayed in center of sphere
- Soft shadows with colored glows

**For Hooomz**: We adapted this to a **light theme** while preserving the visual language:
- Cream/white background (#FEFDFB)
- Same gradient sphere styling
- Same glow effects (adjusted for light mode)
- Warm, approachable aesthetic (Pixar warmth + Google clarity)

---

## 3. Hooomz Navigation Hierarchy

### 3.1 Drill-Down Structure

```
Portfolio (Company Health)
    └── Project (e.g., "Smith Renovation")
            └── [Three-Axis Filter]
                    ├── By Trade: Electrical, Plumbing, HVAC...
                    ├── By Stage: Rough-In, Drywall, Finish...
                    └── By Location: Kitchen, Master Bath...
                            └── Tasks
                                    └── Checklist Items
```

### 3.2 Three-Axis Filtering (Hooomz-Specific)

Unlike Looops, Hooomz supports viewing the same data through three orthogonal lenses:

1. **Work Category (By Trade)**: Electrical → Kitchen Electrical, Bath Electrical
2. **Stage (By Stage)**: Rough-In → Electrical Rough-In, Plumbing Rough-In
3. **Location (By Location)**: Kitchen → Kitchen Electrical, Kitchen Plumbing

The same task appears in all three views. This matches how contractors think about their work.

### 3.3 URL Structure

```
/                                    → Portfolio Loop (all projects)
/projects/[id]                       → Project Loop (categories/stages/locations)
/projects/[id]/[category]            → Category Loop (sub-items)
/projects/[id]/[category]/[location] → Task List (deepest level)
```

---

## 4. Components Already Implemented

### 4.1 LoopVisualization Component

**Location**: `src/components/visualization/LoopVisualization.tsx`

This is the core Looops-style circular visualization:

```typescript
interface LoopVisualizationProps {
  parentLoop: LoopItem;      // Outer ring
  childLoops: LoopItem[];    // Inner spheres (max 8 recommended)
  onSelectChild?: (childId: string) => void;
  onSelectParent?: () => void;
}
```

**Features**:
- SVG-based rendering for crisp graphics
- Glow filters for selected/hovered states
- Circular positioning algorithm for N children
- Color-coded by health status
- Hover and selection states
- Responsive sizing

### 4.2 Design System (globals.css)

**Location**: `src/app/globals.css`

Implemented Looops-inspired styles:

```css
/* Color Palette */
--color-coral: #E07A5F;      /* Primary actions */
--color-sage: #73A58C;       /* Secondary/success */
--color-amber: #F4B942;      /* Warning/attention */

/* Status Colors (same as Looops) */
--sphere-healthy: #16A085;
--sphere-progress: #F39C12;
--sphere-attention: #E67E22;
--sphere-blocked: #E74C3C;

/* Light Theme Adaptation */
--color-bg: #FEFDFB;
--color-surface: #FFFFFF;
```

**Implemented Styles**:
- `.card` - Looops-style cards with hover effects
- `.btn`, `.btn-primary`, `.btn-text` - Button variants
- `.input`, `.textarea` - Form inputs with coral focus glow
- `.nav-item` - Bottom navigation items
- `.sphere`, `.sphere-*` - Sphere styling with glows
- Animations: `breathe`, `glow-pulse`, `slide-up`, `fade-in`

### 4.3 Pages Updated

| Page | File | What it shows |
|------|------|---------------|
| Home | `src/app/page.tsx` | Portfolio → Projects loop |
| Project | `src/app/projects/[id]/page.tsx` | Project → Categories with 3-axis filter |
| Category | `src/app/projects/[id]/[category]/page.tsx` | Category → Locations |
| Location | `src/app/projects/[id]/[category]/[location]/page.tsx` | Task list (deepest level) |

### 4.4 Navigation

**BottomNav** (`src/components/navigation/BottomNav.tsx`):
- Home (◉)
- Activity (◷)
- Estimates (💰)
- Profile (○)

Removed redundant "Add" - activity logging is via the QuickAddMenu FAB.

### 4.5 QuickAddMenu

**Location**: `src/components/activity/QuickAddMenu.tsx`

19 quick-add actions with full text input forms:
- Coral FAB button (visible against cream background)
- Bottom sheet with action grid
- Each action opens a text input form
- Supports: text, textarea, select, toggle, date, time fields

---

## 5. What Still Needs Work

### 5.1 Real Data Integration

Currently using mock data. Need to connect:
- `LoopVisualization` to actual `LoopService.getLoopTree()`
- Health scores calculated from actual task completion
- Three-axis filtering with real project data

### 5.2 Sphere Component Enhancement

The standalone `Sphere` component exists but could be enhanced:
- Add the same glow effects as LoopVisualization
- Ensure consistent styling across all sphere usages

### 5.3 BreadcrumbSpheres

**Location**: `src/components/navigation/BreadcrumbSpheres.tsx`

Shows navigation path as mini spheres. Already implemented but verify:
- Uses correct health colors
- Matches Looops breadcrumb style

### 5.4 Activity Feed Styling

The activity feed cards should use the `.card` class from globals.css for consistent Looops styling.

### 5.5 Widget Cards

Below the loop visualization, Looops shows metric widgets. These should be implemented for:
- Cash flow summary
- Upcoming tasks
- Recent activity
- Project timeline

---

## 6. Design Principles to Follow

### 6.1 DO Build

✅ Sphere-based visualization (3D orbs with health scores 0-100)
✅ Nested spheres (tap parent → see children)
✅ Widget cards below spheres for metrics
✅ Bottom navigation with icons only
✅ Progressive disclosure (summary first, details on tap)
✅ Light, warm, approachable colors
✅ 48px minimum touch targets (work gloves)

### 6.2 DO NOT Build

❌ Traditional nav bars with text labels
❌ Card grids with icons and descriptions
❌ Generic dashboard layouts with stat cards
❌ Gantt charts as primary navigation
❌ Dense data tables
❌ Dark/industrial color schemes
❌ Blue as primary color
❌ Horizontal tab navigation

### 6.3 The Looops Test

Before building anything, ask:
1. Could this component exist in Looops without looking out of place?
2. Does this match the sphere-based visualization pattern?
3. Does this avoid the "construction software" aesthetic?

If any answer is "no," you're building the wrong thing.

---

## 7. File Reference

### Core Visualization
- `src/components/visualization/LoopVisualization.tsx` - Main loop visualization
- `src/components/visualization/Sphere.tsx` - Standalone sphere component
- `src/components/visualization/SphereCluster.tsx` - Multiple spheres grouped
- `src/components/visualization/ConfidenceBadge.tsx` - Data confidence indicator

### Navigation
- `src/components/navigation/BottomNav.tsx` - Bottom tab navigation
- `src/components/navigation/BreadcrumbSpheres.tsx` - Breadcrumb with mini spheres

### Activity
- `src/components/activity/QuickAddMenu.tsx` - FAB + bottom sheet for logging
- `src/components/activity/ActivityFeed.tsx` - Activity log display

### Pages
- `src/app/page.tsx` - Home/Portfolio view
- `src/app/projects/[id]/page.tsx` - Project detail with 3-axis filter
- `src/app/projects/[id]/[category]/page.tsx` - Category detail
- `src/app/projects/[id]/[category]/[location]/page.tsx` - Task list

### Styling
- `src/app/globals.css` - Looops-inspired design system
- `tailwind.config.js` - Custom colors and shadows

---

## 8. Looops GitHub Reference

**Repository**: https://github.com/nrmontgomery1984-cell/looops-app

Key files to reference:
- Loop visualization components
- Color system and gradients
- Animation patterns
- Navigation structure

---

## 9. Summary of Changes Already Made

1. **Created `LoopVisualization.tsx`** - Core Looops-style circular visualization
2. **Updated `globals.css`** - Complete Looops-inspired design system (light theme)
3. **Updated Home page** - Uses LoopVisualization for Portfolio → Projects
4. **Updated Project page** - Uses LoopVisualization with 3-axis filter pills
5. **Updated Category page** - Uses LoopVisualization for drill-down
6. **Updated Location page** - Task list view at deepest level
7. **Updated BottomNav** - Removed redundant Add, replaced with Estimates
8. **Simplified Activity page** - Uses QuickAddMenu with text forms (removed voice-only FAB)

The foundation is in place. The app now follows the Looops visualization pattern while adapted for construction/home management use cases.
