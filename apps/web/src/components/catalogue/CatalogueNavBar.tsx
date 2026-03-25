'use client';

/**
 * CatalogueNavBar — horizontal two-tier tab bar for /catalogue.
 *
 * Top row:    category tabs (All | General | Flooring | …)
 * Second row: subcategory tabs (visible when a category is selected)
 *
 * Uses CSS custom properties from the .catalogue-theme scope.
 * No hardcoded hex values — all colours via var(--*) tokens.
 */

import { NAV_TREE } from '@/lib/catalogue/catalogue.nav';

export interface CatalogueSelection {
  catId: string | null;
  sectionId: string | null;
}

interface Props {
  selected: CatalogueSelection;
  onChange: (sel: CatalogueSelection) => void;
  counts?: Record<string, number>;
}

export function CatalogueNavBar({ selected, onChange, counts = {} }: Props) {
  const activeCat = NAV_TREE.find((c) => c.id === selected.catId) ?? null;

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Category row */}
      <div
        style={{
          display: 'flex',
          paddingLeft: 8,
          borderBottom: activeCat ? '1px solid var(--border)' : 'none',
        }}
      >
        <TabBtn
          label="All"
          active={selected.catId === null}
          onClick={() => onChange({ catId: null, sectionId: null })}
        />
        {NAV_TREE.map((cat) => (
          <TabBtn
            key={cat.id}
            label={cat.label}
            active={selected.catId === cat.id}
            onClick={() =>
              onChange(
                selected.catId === cat.id && selected.sectionId === null
                  ? { catId: null, sectionId: null }
                  : { catId: cat.id, sectionId: null }
              )
            }
          />
        ))}
      </div>

      {/* Subcategory row */}
      {activeCat && (
        <div style={{ display: 'flex', paddingLeft: 8, background: 'var(--bg)' }}>
          {activeCat.subcategories.map((sub) => {
            const count = counts[sub.id];
            return (
              <TabBtn
                key={sub.id}
                label={sub.label}
                active={selected.sectionId === sub.id}
                sub
                count={count}
                onClick={() =>
                  onChange(
                    selected.sectionId === sub.id
                      ? { catId: activeCat.id, sectionId: null }
                      : { catId: activeCat.id, sectionId: sub.id }
                  )
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  label,
  active,
  sub = false,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  sub?: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: sub ? '0.65rem' : '0.7rem',
        color: active ? 'var(--charcoal)' : 'var(--muted)',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        padding: sub ? '6px 12px' : '9px 14px',
        cursor: 'pointer',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            color: 'var(--faint)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
