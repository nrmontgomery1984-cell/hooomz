# Hooomz Interiors — Design System Audit

> **Date:** 2026-03-21
> **Scope:** `apps/web/src/` — all `.tsx`, `.ts`, `.css` files
> **Reference:** `globals.css`, `interiors-landing.html`, `interiors.html`
> **Action:** Report only. No fixes applied.

---

## 1. COLOUR TOKENS

### 1.1 CSS Custom Properties Defined in `globals.css`

#### Light mode (`:root`)

| Token | Value | Purpose |
|-------|-------|---------|
| `--bg` | `#F0EDE8` | Page background |
| `--surface-1` | `#FAF8F5` | Card / table surface |
| `--surface-2` | `#EAE4DB` | Secondary surface |
| `--surface-3` | `#E0D9CF` | Tertiary surface |
| `--border` | `#E0DCD7` | Default border |
| `--border-l` | `#E8E2D8` | Light border |
| `--border-strong` | `#C8BFB3` | Strong border |
| `--text-1` | `#1A1714` | Primary text |
| `--text-2` | `#5C5349` | Secondary text |
| `--text-3` | `#6B6560` | Muted text |
| `--sidebar-bg` | `#111010` | Sidebar background |
| `--color-bg` | `#F0EDE8` | Alias of --bg |
| `--color-surface` | `#FAF8F5` | Alias of --surface-1 |
| `--color-sidebar` | `#111010` | Alias of --sidebar-bg |
| `--color-text` | `#1A1714` | Alias of --text-1 |
| `--color-muted` | `#6B6560` | Alias of --text-3 |
| `--color-border` | `#E0DCD7` | Alias of --border |
| `--font-primary` | `'Figtree', sans-serif` | Alias |
| `--text` | `var(--text-1)` | Legacy alias |
| `--shadow-card` | `0 1px 4px rgba(0,0,0,0.07)` | Card shadow |
| `--shadow-panel` | `0 2px 8px rgba(0,0,0,0.06)` | Panel shadow |
| `--clay` | `#A07355` | Brand accent (clay) |
| `--clay-l` | `#C4997A` | Clay light |
| `--clay-d` | `#6B4A35` | Clay dark |
| `--o-red` | `#DC2626` | Operational red |
| `--o-yellow` | `#D97706` | Operational yellow |
| `--o-green` | `#16A34A` | Operational green |
| `--green` | `#16A34A` | Status green |
| `--amber` | `#D97706` | Status amber |
| `--red` | `#DC2626` | Status red |
| `--blue` | `#4A7FA5` | Status blue |
| `--font-display` | `'Figtree', sans-serif` | Display headings |
| `--font-mono` | `'DM Mono', monospace` | Mono / data |
| `--font-body` | `'Zen Kaku Gothic New', sans-serif` | Body text |
| `--font-sans` | `'IBM Plex Sans', system-ui, sans-serif` | Sans fallback |
| `--font-cond` | `'Barlow Condensed', sans-serif` | Condensed labels |
| `--radius` | `10px` | Default border-radius |
| `--radius-sm` | `6px` | Small border-radius |
| `--surface` | `#FAF8F5` | Alias |
| `--charcoal` | `#1A1714` | Primary text alias |
| `--dark-nav` | `#111010` | Nav background |
| `--mid` | `#5C5349` | Secondary text alias |
| `--muted` | `#A09C98` | Tertiary / placeholder |
| `--faint` | `#D4CEC7` | Subtle dividers |
| `--border-s` | `rgba(0,0,0,.18)` | Strong border |
| `--yellow` | `#D97706` | Warning alias |
| `--blue-dim` | `rgba(74,127,165,0.08)` | Blue tint |
| `--blue-hover` | `#3A6F95` | Blue hover |
| `--green-dim` | `rgba(22,163,74,0.08)` | Green tint |
| `--amber-dim` | `rgba(217,119,6,0.08)` | Amber tint |
| `--red-dim` | `rgba(220,38,38,0.07)` | Red tint |
| `--sidebar-border` | `var(--border)` | Sidebar border |
| `--sidebar-text` | `var(--text-1)` | Sidebar text |
| `--sidebar-muted` | `var(--text-3)` | Sidebar muted |
| `--sidebar-active` | `rgba(160,115,85,0.1)` | Sidebar active bg |
| `--theme-*` | (15 aliases) | Legacy theme bridge |

#### Dark mode (`[data-theme="dark"]` + `.dark`)

| Token | Value |
|-------|-------|
| `--bg` | `#1E1B17` |
| `--surface-1` | `#38332D` |
| `--surface-2` | `#2A2520` |
| `--surface-3` | `#332E28` |
| `--border` | `#524C45` |
| `--border-l` | `rgba(82,76,69,.4)` |
| `--border-strong` | `#6B6359` |
| `--text-1` | `#E8DFD4` |
| `--text-2` | `#C4997A` |
| `--text-3` | `#8A8278` |
| `--sidebar-bg` | `#2A2520` |

---

### 1.2 Hardcoded Hex Colors in `.tsx` / `.ts` Files

**Total occurrences: ~3,097 across 172 files**
**Unique hex values: 131**

#### Top 30 by Frequency

| Hex | Count | Should Map To | Category |
|-----|-------|---------------|----------|
| `#6B7280` | 333 | `var(--text-3)` or `var(--muted)` | Tailwind gray-500 |
| `#9CA3AF` | 264 | `var(--muted)` | Tailwind gray-400 |
| `#0F766E` | 264 | Should be `var(--green)` or new `--teal` token | Teal-700 accent |
| `#FFFFFF` | 236 | `#fff` / `var(--surface-1)` context-dependent | White |
| `#111827` | 195 | `var(--text-1)` / `var(--charcoal)` | Tailwind gray-900 |
| `#374151` | 166 | `var(--text-2)` / `var(--mid)` | Tailwind gray-700 |
| `#F3F4F6` | 144 | `var(--surface-2)` / `var(--surface-3)` | Tailwind gray-100 |
| `#EF4444` | 104 | `var(--red)` | Red-500 |
| `#10B981` | 94 | `var(--green)` | Green-500 |
| `#F59E0B` | 78 | `var(--amber)` | Amber-500 |
| `#E5E7EB` | 78 | `var(--border)` | Tailwind gray-200 |
| `#F9FAFB` | 76 | `var(--surface-1)` | Tailwind gray-50 |
| `#3B82F6` | 74 | `var(--blue)` | Blue-500 |
| `#D1D5DB` | 66 | `var(--border-strong)` | Tailwind gray-300 |
| `#F0FDFA` | 54 | New `--teal-dim` token needed | Teal-50 |
| `#059669` | 37 | `var(--green)` (darker shade) | Green-600 |
| `#1E3A8A` | 36 | New `--blue-dark` or use `var(--blue)` | Blue-900 |
| `#1F2937` | 30 | `var(--text-1)` | Tailwind gray-800 |
| `#1A1A1A` | 29 | `var(--charcoal)` | Near-black |
| `#92400E` | 28 | New `--amber-dark` token | Amber-800 |
| `#FEF3C7` | 25 | `var(--amber-dim)` | Amber-100 |
| `#111010` | 24 | `var(--dark-nav)` | Nav black |
| `#DBEAFE` | 23 | `var(--blue-dim)` | Blue-100 |
| `#1A1714` | 21 | `var(--charcoal)` | Brand dark |
| `#D1FAE5` | 20 | `var(--green-dim)` | Green-100 |
| `#FEF2F2` | 19 | `var(--red-dim)` | Red-50 |
| `#DC2626` | 19 | `var(--red)` | Red-600 |
| `#2A9D8F` | 19 | New token or `var(--green)` variant | Custom teal |
| `#065F46` | 16 | Dark green variant | Green-800 |
| `#7C3AED` | 14 | New `--violet` token needed | Violet-600 |

#### Top 15 Worst-Offending Files

| File | Hardcoded Hex Count |
|------|---------------------|
| `app/estimates/[id]/page.tsx` | 254 |
| `app/leads/new/page.tsx` | 165 |
| `app/admin/rates/page.tsx` | 159 |
| `app/portal/[projectId]/page.tsx` | 124 |
| `components/intake/RoomDetailPanel.tsx` | 93 |
| `components/icons/ServiceIcons.tsx` | 72 |
| `app/labs/training/[crewId]/page.tsx` | 65 |
| `components/intake/IntakeWizard.tsx` | 63 |
| `components/intake/ContractorIntakeWizard.tsx` | 62 |
| `app/customers/[id]/page.tsx` | 60 |
| `app/leads/page.tsx` | 59 |
| `app/sales/quotes/[id]/page.tsx` | 54 |
| `app/jobs/[id]/page.tsx` | 54 |
| `app/discovery/[projectId]/page.tsx` | 49 |
| `app/intake/page.tsx` | 48 |

#### Hardcoded `rgba()` in `.tsx`/`.ts`

**~192 occurrences across ~50 files, 113 unique patterns.**

Most common: `rgba(0,0,0,0.06)` (15x), `rgba(30,58,138,0.1)` (9x), `rgba(0,0,0,0.4)` (6x), `rgba(0,0,0,0.5)` (4x for modal overlays).

---

## 2. TYPOGRAPHY

### 2.1 Font-Family Declarations NOT Using CSS Variables

#### PDF Files (expected -- `@react-pdf/renderer` limitation)

| File | Count | Fonts Used |
|------|-------|------------|
| `components/change-orders/ChangeOrderPDF.tsx` | 1 | `Helvetica` |
| `components/care-sheet/HomeCareSheetPDF.tsx` | 2 | `Helvetica`, `Courier` |
| `components/invoices/InvoicePDF.tsx` | 8 | `Helvetica`, `Courier` |
| `components/quotes/QuotePDF.tsx` | 6 | `Helvetica`, `Courier` |
| `components/quotes/ContractPDF.tsx` | 6 | `Helvetica`, `Courier` |
| `components/discovery/DiscoverySummaryPDF.tsx` | 2 | `Helvetica`, `Courier` |
| `components/trim/TrimCutListPDF.tsx` | 2 | `Helvetica`, `Courier` |
| **Subtotal** | **27** | *Not fixable* |

#### Non-PDF Files (true violations)

| File | Line | Hardcoded Value | Should Be |
|------|------|-----------------|-----------|
| `app/layout.tsx` | 55 | `'Figtree', sans-serif` | `var(--font-display)` |
| `components/navigation/HooomzLogoMark.tsx` | 9 | `'Figtree', sans-serif` | `var(--font-display)` |
| `components/navigation/MobileModuleNav.tsx` | 77 | `'DM Mono', monospace` | `var(--font-mono)` |
| `app/labs/tool-research/page.tsx` | 120, 167 | `'Inter, system-ui, sans-serif'` | `var(--font-sans)` |
| `app/production/jobs/[id]/rooms/worker-spike/page.tsx` | 24 | `'monospace'` | `var(--font-mono)` |

**True violations: 7 across 5 files**

### 2.2 Tailwind Gray / Slate / bg-white Classes

**Total occurrences: 596 across 78 files**

| Pattern | Count | Files |
|---------|-------|-------|
| `text-gray-*` | 233 | 45 |
| `text-slate-*` | 127 | 19 |
| `bg-white` | 102 | 49 |
| `bg-gray-*` | 84 | 35 |
| `border-gray-*` | 79 | 30 |
| `bg-slate-*` | 45 | 13 |
| `border-slate-*` | 26 | 10 |
| `ring-gray-*` | 2 | 1 |
| `divide-gray-*` | 2 | 1 |

#### Top 10 Worst-Offending Files

| File | Count | Class Family |
|------|-------|--------------|
| `components/intake/ContractorIntakeWizard.tsx` | ~43 | slate |
| `app/schedule/assign/page.tsx` | ~40 | gray |
| `components/activity/QuickAddMenu.tsx` | ~31 | slate |
| `components/schedule/TaskDetailSheet.tsx` | ~29 | gray |
| `app/schedule/day/[date]/page.tsx` | ~28 | gray |
| `app/labs/sops/new/page.tsx` | ~26 | gray |
| `components/voice/VoiceConfirmationCard.tsx` | ~24 | slate |
| `app/labs/sops/[id]/script/page.tsx` | ~19 | gray |
| `components/labs/SOPCard.tsx` | ~16 | gray |
| `components/labs/VoteBallotCard.tsx` | ~16 | gray |

**Pattern:** Activity/voice/intake components use `slate-*`; labs/schedule/ui use `gray-*`. Both need migration to CSS variables.

---

## 3. SPACING

### 3.1 Hardcoded Padding/Margin Assessment

The codebase overwhelmingly uses inline `style={{}}` with pixel values (`padding: '12px 14px'`, `gap: 8`, `marginTop: 16`, etc.) rather than a spacing scale. This is consistent across all app pages, so is a codebase-wide pattern rather than isolated violations.

### 3.2 Website vs App Section Padding

| Context | Desktop Padding | Standard |
|---------|----------------|----------|
| **Website** (`interiors.html`) | `64px 80px` | Brand spec |
| **Website** (`interiors-landing.html`) | `96px 64px` | Older version |
| **App pages** (typical) | `py-3 md:py-4 px-4 md:px-6` (~12-24px) | Tighter for app context |
| **App cards** | `12px 14px` to `20px` | Consistent within app |

The app intentionally uses tighter spacing than the marketing website. This is appropriate for a data-dense management app vs. a marketing landing page. No action needed on this gap.

### 3.3 Pages With Notably Tight Spacing

| File | Issue |
|------|-------|
| `components/projects/ChangeOrderPanel.tsx` | `padding: '5px 12px'` on rows (compact but intentional for panel list) |
| `components/navigation/Sidebar.tsx` | `padding: '7px 20px'` on nav items (appropriate for sidebar) |
| Sidebar section headers | `padding: '12px 20px 4px 20px'` (tight but works at 9px font) |

No critical spacing violations found. The app's spacing is internally consistent.

---

## 4. COMPONENT GAPS

### 4.1 Components Using Local Color Instead of CSS Variable

All 172 files listed in Section 1.2 qualify. The worst offenders by hardcoded hex count:

1. `app/estimates/[id]/page.tsx` (254)
2. `app/leads/new/page.tsx` (165)
3. `app/admin/rates/page.tsx` (159)
4. `app/portal/[projectId]/page.tsx` (124)
5. `components/intake/RoomDetailPanel.tsx` (93)

### 4.2 Buttons NOT Using `var(--font-mono)`

**18 buttons need attention across 10 files:**

| Category | Count | Details |
|----------|-------|---------|
| Hardcoded font string (via `MONO` const) | 5 | `app/leads/page.tsx` (lines 1237-1525) |
| Inline fontSize/fontWeight but no fontFamily | 13 | Spread across settings, customers, quotes, consultations, jobs, CO pages |

### 4.3 Badges/Tags NOT Using `var(--font-mono)`

**17 badges need attention:**

| Category | Count | Files |
|----------|-------|-------|
| No fontFamily at all | 11 | `InventoryTab.tsx` (5), `standards/page.tsx` (2), `standards/knowledge/page.tsx` (3), `production/jobs/page.tsx` (1) |
| Hardcoded font string instead of CSS var | 4 | `app/leads/page.tsx` (4) |
| Using `var(--font-cond)` instead of mono | 2 | `LoopRow.tsx`, `finance/page.tsx` |

---

## 5. WEBSITE vs APP GAPS

### 5.1 Token Comparison

| Token | Website (`interiors.html`) | Website (`interiors-landing.html`) | App (`globals.css`) | Gap |
|-------|---------------------------|-----------------------------------|--------------------|-----|
| Background | `#F0EDE8` | `#F0EDE8` | `#F0EDE8` | Match |
| Surface | `#FAF8F5` | `#FAF8F5` | `#FAF8F5` | Match |
| Primary text | `#1A1714` (--charcoal) | `#1A1714` (--dark) | `#1A1714` (--text-1) | Match (different name) |
| Secondary text | `#5C5349` (--mid) | `#6B6560` (--grey) | `#5C5349` (--text-2) | **Mismatch**: landing uses `#6B6560` |
| Muted text | `#9A8E84` (--muted) | `#A09C98` (--grey-lt) | `#6B6560` (--text-3) | **Mismatch**: app `--text-3` is darker |
| Border | `rgba(0,0,0,.10)` | `#E0DCD7` | `#E0DCD7` | **Mismatch**: interiors.html uses rgba |
| Nav background | `#111010` | `#111010` | `#111010` | Match |
| Accent | `#6B6560` (grey) | N/A (uses --dark) | `#A07355` (--clay) | **Major gap**: website uses grey accent, app uses clay |
| Font display | `'Figtree'` | `'Figtree'` | `'Figtree'` | Match |
| Font mono | `'DM Mono'` | `'DM Mono'` | `'DM Mono'` | Match |
| Font body | `'Figtree'` | `'Figtree'` | `'Zen Kaku Gothic New'` | **Major gap**: website uses Figtree, app uses Zen Kaku |
| Border radius | `10px` | `10px` | `10px` | Match |

### 5.2 Specific Visual Differences

| Element | Website | App | Impact |
|---------|---------|-----|--------|
| **Body font** | Figtree throughout | Zen Kaku Gothic New / IBM Plex Sans | High -- different reading feel |
| **Hero heading size** | `clamp(44px, 5.5vw, 72px)` | 16px `font-cond` headers | Expected (app vs marketing) |
| **Section padding** | `64px 80px` | `12-24px` | Expected (app density) |
| **Card treatment** | `border: 1px solid var(--border)` | `border: 1px solid var(--border)` + `box-shadow` | Minor -- app adds shadow |
| **Button style** | Mono font, 9.5px, letter-spacing 0.10em | Mixed -- some mono, some sans | Gap -- app buttons inconsistent |
| **Badge/tag style** | Mono 8px, border, 3px radius | Mixed -- some mono, some missing font | Gap -- app badges inconsistent |
| **Nav CTA** | White bg, charcoal text | Green bg (`var(--green)`) | Intentional difference |
| **Accent color** | Grey (`#6B6560`) | Teal (`#0F766E`) + Clay (`#A07355`) | **Major**: website is monochromatic, app uses teal everywhere |
| **Card hover** | `background: var(--surface)` | `background: var(--surface-2)` + transform | Minor styling difference |
| **Muted color** | `#9A8E84` / `#A09C98` | `#6B6560` (--text-3) / `#A09C98` (--muted) | `--muted` token exists but most code uses `--text-3` |

### 5.3 Key Structural Gaps

1. **Website uses `--accent` (`#6B6560`)** -- a grey tone. App has no `--accent` token; uses `#0F766E` (teal) ~264 times as the de facto accent.
2. **Website body font is Figtree**. App declares `--font-body: 'Zen Kaku Gothic New'` but then uses `--font-primary: 'Figtree'` on `<body>`. The tokens contradict each other.
3. **Website CTA buttons** use `var(--font-mono)` at 9.5px consistently. App buttons are a mix of `var(--font-sans)`, `var(--font-mono)`, and inherited fonts.
4. **Website `interiors.html`** defines `--accent-bg`, `--accent-border`, `--green-bg`, `--yellow-bg`, `--red-bg` tokens not present in `globals.css`.

---

## Summary Totals

| Metric | Count |
|--------|-------|
| **Hardcoded hex values** | ~3,097 across 172 files |
| **Hardcoded rgba() values** | ~192 across ~50 files |
| **Unique hex colors** | 131 |
| **Tailwind gray/slate/bg-white** | 596 across 78 files |
| **Typography violations (non-PDF)** | 7 across 5 files |
| **Buttons needing font fix** | 18 across 10 files |
| **Badges needing font fix** | 17 across 8 files |
| **Website vs app token mismatches** | 5 significant |

---

## Priority Fix Order (Highest Impact First)

### Batch 1: Token Foundation (3 files)
Align `globals.css` tokens with website. Add missing tokens (`--accent`, `--teal`, status dim variants). Resolve `--font-body` vs `--font-primary` conflict.
- `globals.css` (1 file)
- Estimated impact: Unlocks all subsequent batches

### Batch 2: Worst Hex Offenders (5 files, ~795 hex values)
Migrate the 5 files with 100+ hardcoded hex values to CSS variables.
- `estimates/[id]/page.tsx` (254)
- `leads/new/page.tsx` (165)
- `admin/rates/page.tsx` (159)
- `portal/[projectId]/page.tsx` (124)
- `intake/RoomDetailPanel.tsx` (93)

### Batch 3: Tailwind Gray/Slate Cleanup (15 files, ~350 occurrences)
Replace all `text-gray-*`, `bg-gray-*`, `text-slate-*`, `bg-slate-*`, `bg-white` with CSS variable equivalents. Start with the 15 worst files.
- `ContractorIntakeWizard.tsx` (~43)
- `schedule/assign/page.tsx` (~40)
- `QuickAddMenu.tsx` (~31)
- `TaskDetailSheet.tsx` (~29)
- `schedule/day/[date]/page.tsx` (~28)
- + 10 more files

### Batch 4: Status Color Consolidation (30 files, ~400 occurrences)
Replace hardcoded `#EF4444`, `#10B981`, `#F59E0B`, `#3B82F6` with `var(--red)`, `var(--green)`, `var(--amber)`, `var(--blue)`.
- ~30 files using these 4 hex values

### Batch 5: Teal Accent Migration (50+ files, ~264 occurrences)
Decide: is `#0F766E` the app accent? If yes, add `--accent: #0F766E` to tokens. Replace all 264 hardcoded instances.
- ~50 files

### Batch 6: Typography + Button/Badge Consistency (18 files)
Fix 7 hardcoded font-family violations, 18 button font issues, 17 badge font issues.
- 18 files total

### Batch 7: Remaining Hex Cleanup (120+ files, ~1,500 occurrences)
Migrate all remaining hardcoded hex values in files with <100 occurrences.
- ~120 files

### Batch 8: Website Token Alignment (2 files)
Update `interiors.html` and `interiors-landing.html` to import from shared tokens or align values.
- 2 HTML files

---

## Estimated Files Affected Per Batch

| Batch | Files | Hex/Class Fixes | Priority |
|-------|-------|-----------------|----------|
| 1 | 1 | Foundation | Critical |
| 2 | 5 | ~795 | High |
| 3 | 15 | ~350 | High |
| 4 | 30 | ~400 | Medium |
| 5 | 50 | ~264 | Medium |
| 6 | 18 | ~42 | Medium |
| 7 | 120 | ~1,500 | Low |
| 8 | 2 | Token sync | Low |
| **Total** | **~241** | **~3,351** | |
