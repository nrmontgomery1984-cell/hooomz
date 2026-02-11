# BUILD — UI Polish Session Log

**Date:** 2026-02-11
**Branch:** feature/lifecycle-platform
**Typecheck:** PASSES (0 errors)

---

## Summary

Polish pass converting the app from developer prototype to product-quality UI.
No new features, stores, or services. Styling and visual hierarchy only.

---

## Critical Bug Fix: Duplicate Projects

**Root cause:** `handleClearAndReseed` on `/labs/seed` cleared Labs data (SOPs, observations, etc.) but did NOT clear customers. Running seed multiple times created duplicate customer → project chains.

**Fix:** Added customer clearing to `handleClearAndReseed` in `apps/web/src/app/labs/seed/page.tsx`:
```ts
const { customers } = await services.customers.findAll();
for (const c of customers) {
  await services.customers.delete(c.id);
}
```

---

## Files Modified

### Pages (6 files)
| File | Changes |
|------|---------|
| `apps/web/src/app/page.tsx` | Greeting header (replaces redundant logo), widened content (`max-w-lg md:max-w-4xl`), StatCard with left-border accent + text-3xl numbers, ProjectCard with health label + h-2 progress bar, section headers standardized, Active Projects stat now scrolls to #todays-work |
| `apps/web/src/app/activity/page.tsx` | Widened content, better empty state with Activity icon, consistent header typography |
| `apps/web/src/app/estimates/page.tsx` | Widened content, estimate cards with shadows + hover, "projects without estimates" as proper card with status pills, added projectStatus to interface |
| `apps/web/src/app/profile/page.tsx` | Teal avatar with initials, "Red Seal Journeyman Carpenter" subtitle, stat cards with left-border accent, Quick Links section header, sign out as muted text button |
| `apps/web/src/app/leads/page.tsx` | Widened content, lead cards with updated shadows + hover states, consistent section header typography, subtitle with lead count |
| `apps/web/src/app/labs/seed/page.tsx` | Customer clearing in Clear & Re-seed flow |

### Navigation (3 files)
| File | Changes |
|------|---------|
| `apps/web/src/components/navigation/Sidebar.tsx` | Active state: 3px teal left border, 20px icons, divider below New Project CTA |
| `apps/web/src/components/navigation/BottomNav.tsx` | Added `md:hidden` to hide on desktop |
| `apps/web/src/components/navigation/index.ts` | Added Sidebar export |

### Layout + Styles (2 files)
| File | Changes |
|------|---------|
| `apps/web/src/app/layout.tsx` | Flex layout with Sidebar + main content area |
| `apps/web/src/app/globals.css` | `--theme-card-shadow` updated to `0 1px 3px rgba(0,0,0,0.08)`, `.card:hover` with translateY(-1px) + stronger shadow |

### Seed Data (1 file)
| File | Changes |
|------|---------|
| `apps/web/src/lib/seed/seedData.ts` | Demo customers now have `'lead'` + `'source:xxx'` + `'interest:xxx'` tags so they appear in lead pipeline |

---

## CSS Changes Summary

- **Card shadow:** `0 2px 8px rgba(0,0,0,0.06)` → `0 1px 3px rgba(0,0,0,0.08)` (subtler, more professional)
- **Card hover:** `translateY(-1px)` + `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` (lift effect)
- **Content width:** `max-w-lg` → `max-w-lg md:max-w-4xl` on all pages (uses desktop space)
- **Stat numbers:** `text-2xl` → `text-3xl font-bold` (bigger, bolder)
- **Section headers:** Standardized to `text-[13px] font-semibold uppercase tracking-wider` in `#6B7280`
- **Progress bars:** `h-1` → `h-2` (thicker, more visible)
- **Touch targets:** Maintained 48px minimum throughout

---

## Design Patterns Established

1. **StatCard:** White bg, 4px left-border accent, text-3xl number, text-[13px] label
2. **Section header:** `text-[13px] font-semibold uppercase tracking-wider` in gray
3. **Card hover:** `transition-all duration-150 hover:shadow-md hover:-translate-y-px`
4. **Content width:** `max-w-lg md:max-w-4xl mx-auto px-4 md:px-8`
5. **Page header:** White bg, border-bottom, responsive padding
6. **Empty state:** Icon (28-32px) + title (text-base) + subtitle (text-sm) + CTA button
