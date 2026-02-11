# HOOOMZ OS: UI SPECIFICATION

## Design Philosophy

**Hooomz must look and feel identical to Looops.**

No "construction software" aesthetic. No dark industrial themes. No dense data tables. No Gantt charts as primary navigation.

### The Aesthetic Formula
```
Pixar warmth + Google clarity + Disney magic = Hooomz UI
```

- **Pixar**: Soft lighting, depth, personality, warmth
- **Google**: Material Design clarity, intentional whitespace, clean typography
- **Disney**: Magical interactions, delightful details, emotional connection

---

## What NOT to Build

These are explicitly forbidden in Hooomz:

| ❌ DO NOT BUILD | ✅ BUILD INSTEAD |
|-----------------|------------------|
| Traditional nav bars with text labels | Bottom navigation with icons only |
| Card grids with icons and descriptions | Sphere-based visualization |
| Generic dashboard layouts | Loop hierarchy with health scores |
| Gantt charts | Timeline as secondary view only |
| Dense data tables | Progressive disclosure |
| Dark/industrial color schemes | Light, warm, approachable colors |
| Horizontal tab navigation | Nested drill-down |
| Stat cards with numbers | Spheres with embedded scores |

---

## Sphere-Based Visualization

The primary UI pattern is **spheres representing loops/projects with health scores**.

### Single Sphere (Master Loop)
```
Mobile app screenshot, single 3D sphere floating in center, smooth
polished matte surface with subtle teal color and very soft warm
undertone, minimal gradient almost solid with gentle shading for
depth, number "78" in clean thin white sans-serif typography, soft
diffused shadow beneath, clean white background, abstract premium
orb, professional and minimal, scales from smartwatch to desktop,
Google Material You aesthetic, Pixar soft lighting, ultra clean,
no texture no noise
```

**Key properties:**
- Smooth matte finish (not glossy, not textured)
- Minimal gradient (almost solid with depth shading)
- Score number centered in white typography
- Soft shadow beneath
- Clean white background

### Nested Sub-Spheres

**Key properties:**
- Parent sphere larger, positioned above
- Child spheres in gentle arc below
- Thin connecting lines showing hierarchy
- Each sphere has its own color and score
- Same matte finish across all spheres

### Spheres with Widget Cards

**Key properties:**
- Spheres in upper portion
- Widget cards in grid below
- Cards are white with soft shadows
- Minimal data per card (one metric)
- Icons are tiny, not dominant

---

## Color System

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Teal | #16A085 | Healthy/on-track status, primary actions |
| Status Green | #27AE60 | Completed, verified, success |
| Status Amber | #F39C12 | Attention needed, limited confidence |
| Status Coral | #E74C3C | Behind schedule, needs action, estimate |
| Dark Slate | #2C3E50 | Primary text |
| Light Gray | #ECF0F1 | Backgrounds, disabled states |

### Sphere Status Colors

Sphere appearance indicates health:
- **Bright + Warm glow** = Healthy (score 70-100)
- **Normal** = Okay (score 40-69)
- **Dim + Cool tint** = Needs attention (score 0-39)

---

## Navigation Pattern

### Primary: Nested Drill-Down
```
Business Health Sphere (tap)
  → Project Spheres (tap one)
    → Category Spheres (tap one)
      → Task List
```

At every level, the pattern is the same:
1. Parent sphere with score
2. Child spheres below
3. Tap to drill deeper
4. Swipe/back to go up

### Secondary: Bottom Navigation

Four icons maximum:
- Home (sphere view)
- Activity (feed)
- Add (quick actions)
- Profile/Menu

No text labels. Icons only. Large touch targets (44px minimum).

---

## Component Specifications

### Sphere Component
```typescript
interface SphereProps {
  score: number;           // 0-100
  label?: string;          // Optional label below
  size: 'sm' | 'md' | 'lg';
  color: string;           // Base color
  onClick?: () => void;
  children?: SphereProps[]; // Nested spheres
}
```

Visual requirements:
- Matte finish, not glossy
- Minimal gradient for depth
- Score number in center (white, thin font)
- Soft drop shadow
- Subtle glow based on health
- Touch target extends beyond visible sphere

### Widget Card Component
```typescript
interface WidgetCardProps {
  icon: ReactNode;         // Small icon
  label: string;           // Metric name
  value: string | number;  // Current value
  indicator?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}
```

Visual requirements:
- White background
- Rounded corners (12px)
- Soft shadow
- Minimal content (icon + label + value only)
- No borders

---

## Confidence Indicators

For Smart Estimating, show data confidence:

| Level | Icon | Color | Meaning |
|-------|------|-------|---------|
| Verified | ✓ | Green | 3+ data points |
| Limited | ~ | Amber | 1-2 data points |
| Estimate | ? | Coral | No field data |

Display inline with estimates:
```
Labor: 4.5 hrs ✓
Materials: $1,240 ~
Contingency: 10% ?
```

---

## Mobile-First Requirements

### Touch Targets
- Minimum 44px for all interactive elements
- 48px+ preferred for primary actions
- Must work with work gloves (larger than typical mobile)

### Thumb Zone
- Primary actions in bottom third of screen
- Navigation at bottom
- Content scrolls in middle
- Status/context at top (minimal)

### Offline Support
- All critical views must work offline
- Sync status indicator (subtle, not alarming)
- Queue actions when offline, sync when connected
- Never block user from working

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Scale
| Use | Size | Weight |
|-----|------|--------|
| Sphere score (lg) | 48px | 300 (light) |
| Sphere score (md) | 32px | 300 |
| Sphere score (sm) | 20px | 300 |
| Page title | 24px | 600 |
| Section header | 18px | 600 |
| Body | 16px | 400 |
| Caption | 14px | 400 |
| Micro | 12px | 400 |

---

## Animation Guidelines

### Sphere Interactions
- Tap: subtle scale pulse (1.0 → 1.05 → 1.0)
- Drill down: parent sphere moves up and shrinks, children fade in from below
- Navigate up: reverse of drill down
- Health change: smooth color/glow transition (300ms)

### General
- Transitions: 200-300ms, ease-out
- No bouncy/playful animations (professional context)
- Loading: skeleton screens, not spinners
- Success: subtle checkmark, not confetti
