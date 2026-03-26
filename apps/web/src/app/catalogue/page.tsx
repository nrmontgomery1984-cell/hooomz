'use client';

/**
 * /catalogue — Cost Items catalogue.
 *
 * Layout: horizontal two-tier tab nav | search bar | table
 * Tokens come from .catalogue-theme scope (catalogue/layout.tsx).
 * No hardcoded hex values — all colours via CSS custom properties.
 */

import { useState, useMemo } from 'react';
import { CatalogueNavBar, type CatalogueSelection } from '@/components/catalogue/CatalogueNavBar';
import { CostItemsTable } from '@/components/catalogue/CostItemsTable';
import { useCostItems, useFlaggedCostItems } from '@/lib/hooks/useCostItems';
import { NAV_CAT_MAP, NAV_SECTION_MAP, NAV_TREE } from '@/lib/catalogue/catalogue.nav';
import type { CostCategory, CostItem } from '@/lib/types/catalogue.types';

// Domain-semantic flag colour — not a UI token
const FLAG_ACTIVE = '#c8a000';

// Canonical category sort order: GEN → FLR → PNT → TRM → ACC
const CAT_ORDER: Record<string, number> = {
  General: 0,
  Flooring: 1,
  Painting: 2,
  'Trim & Doors': 3,
  'Accent Walls': 4,
};

function sortItems(items: CostItem[]): CostItem[] {
  return [...items].sort((a, b) => {
    const catDiff = (CAT_ORDER[a.cat] ?? 99) - (CAT_ORDER[b.cat] ?? 99);
    if (catDiff !== 0) return catDiff;
    const aNum = parseInt(a.id.replace(/\D/g, ''), 10);
    const bNum = parseInt(b.id.replace(/\D/g, ''), 10);
    return aNum - bNum;
  });
}

export default function CataloguePage() {
  const [selection, setSelection] = useState<CatalogueSelection>({ catId: null, sectionId: null });
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const { data: allItems = [], isLoading } = useCostItems();
  const { flaggedIds, toggle: toggleFlag } = useFlaggedCostItems();

  const navFiltered = useMemo(() => {
    let result: CostItem[];
    if (!selection.catId) {
      result = allItems;
    } else {
      const cat: CostCategory = NAV_CAT_MAP[selection.catId];
      if (selection.sectionId) {
        const entry = NAV_SECTION_MAP[selection.sectionId];
        result = entry
          ? allItems.filter((item) => item.cat === cat && entry.sections.includes(item.section))
          : allItems;
      } else {
        result = allItems.filter((item) => item.cat === cat);
      }
    }
    return sortItems(result);
  }, [allItems, selection]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of NAV_TREE) {
      for (const sub of cat.subcategories) {
        const entry = NAV_SECTION_MAP[sub.id];
        if (entry) {
          counts[sub.id] = allItems.filter(
            (item) => item.cat === entry.cat && entry.sections.includes(item.section)
          ).length;
        }
      }
    }
    return counts;
  }, [allItems]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* Horizontal nav tabs */}
      <CatalogueNavBar selected={selection} onChange={setSelection} counts={sectionCounts} />

      {/* Search / filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}
      >
        <input
          type="search"
          placeholder="Search ID, name, section…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 280,
            height: 28,
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--charcoal)',
            background: 'var(--bg)',
            outline: 'none',
          }}
        />

        <button
          onClick={() => setFlaggedOnly((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            height: 28,
            padding: '0 10px',
            border: `1px solid ${flaggedOnly ? FLAG_ACTIVE : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            background: flaggedOnly ? 'rgba(200,160,0,0.06)' : 'transparent',
            color: flaggedOnly ? FLAG_ACTIVE : 'var(--muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            cursor: 'pointer',
          }}
        >
          <span>⚑</span>
          <span>Flagged{flaggedIds.size > 0 ? ` (${flaggedIds.size})` : ''}</span>
        </button>

        <div style={{ flex: 1 }} />

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--muted)',
          }}
        >
          {navFiltered.length} item{navFiltered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table area */}
      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--muted)',
            }}
          >
            Loading catalogue…
          </span>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <CostItemsTable
            items={navFiltered}
            flaggedIds={flaggedIds}
            onFlagToggle={toggleFlag}
            search={search}
            flaggedOnly={flaggedOnly}
          />
        </div>
      )}
    </div>
  );
}
