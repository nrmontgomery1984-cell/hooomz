'use client';

/**
 * CostItemsTable — cost items table for /catalogue.
 *
 * 14 columns: Flag | ID | Name | Phase | Unit | lG | lB | lBB | mG | mB | mBB | tG | tB | tBB
 * Two-row sticky thead: group headers (Labour/Material/Total ×3) + Good/Better/Best sub-headers.
 * Section header rows in tbody, alternating row shading.
 *
 * Uses CSS custom properties from .catalogue-theme — no hardcoded UI hex values.
 * Phase badge colours and flag colours are domain-semantic and remain hardcoded.
 */

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { CostItem } from '@/lib/types/catalogue.types';

// Domain-semantic phase colours — not UI tokens, intentionally hardcoded
const PHASE_META: Record<string, { color: string; bg: string; label: string }> = {
  S: { color: '#2a6e3f', bg: '#e6f4ec', label: 'Shield' },
  C: { color: '#7a5c1e', bg: '#f5eddb', label: 'Clear' },
  R: { color: '#8b2020', bg: '#faeaea', label: 'Remove' },
  I: { color: '#ffffff', bg: '#111111', label: 'Install' },
  P: { color: '#1a4a7a', bg: '#deeaf5', label: 'Punch' },
  T: { color: '#4a3a6e', bg: '#ede8f5', label: 'Turnover' },
};

// Flag colours — domain-semantic, hardcoded
const FLAG_ACTIVE   = '#c8a000';
const FLAG_ROW_BG   = '#fffbf0';

function fmt(val: number): string {
  if (val === 0) return '—';
  return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)}`;
}

function thBase(align: 'left' | 'right' | 'center'): CSSProperties {
  return {
    padding: '7px 12px',
    textAlign: align,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    background: 'var(--surface-2)',
    whiteSpace: 'nowrap',
  };
}

function rateCell(leftBorder: boolean): CSSProperties {
  return {
    padding: '7px 12px',
    textAlign: 'right',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--charcoal)',
    background: 'var(--surface)',
    borderLeft: leftBorder ? '1px solid var(--border)' : 'none',
    borderBottom: '1px solid var(--border)',
  };
}

interface Props {
  items: CostItem[];
  flaggedIds: Set<string>;
  onFlagToggle: (id: string) => void;
  search?: string;
  flaggedOnly?: boolean;
}

export function CostItemsTable({
  items,
  flaggedIds,
  onFlagToggle,
  search = '',
  flaggedOnly = false,
}: Props) {
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (flaggedOnly && !flaggedIds.has(item.id)) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !item.name.toLowerCase().includes(q) &&
            !item.id.toLowerCase().includes(q) &&
            !item.section.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      }),
    [items, flaggedIds, flaggedOnly, search]
  );

  const grouped = useMemo(() => {
    const sectionOrder: string[] = [];
    const bySection: Record<string, CostItem[]> = {};
    for (const item of filtered) {
      if (!bySection[item.section]) {
        bySection[item.section] = [];
        sectionOrder.push(item.section);
      }
      bySection[item.section].push(item);
    }
    return { sectionOrder, bySection };
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--muted)',
          }}
        >
          No items
        </span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', minHeight: 0 }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          minWidth: 1140,
        }}
      >
        <colgroup>
          <col style={{ width: 32 }} />
          <col style={{ width: 72 }} />
          <col />
          <col style={{ width: 90 }} />
          <col style={{ width: 64 }} />
          <col style={{ width: 72 }} />
          <col style={{ width: 72 }} />
          <col style={{ width: 72 }} />
          <col style={{ width: 72 }} />
          <col style={{ width: 72 }} />
          <col style={{ width: 72 }} />
          <col style={{ width: 76 }} />
          <col style={{ width: 76 }} />
          <col style={{ width: 76 }} />
        </colgroup>

        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
          {/* Group headers */}
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th colSpan={5} style={thBase('left')} />
            <th
              colSpan={3}
              style={{ ...thBase('center'), borderLeft: '1px solid var(--border)' }}
            >
              Labour
            </th>
            <th
              colSpan={3}
              style={{ ...thBase('center'), borderLeft: '1px solid var(--border)' }}
            >
              Material
            </th>
            <th
              colSpan={3}
              style={{ ...thBase('center'), borderLeft: '1px solid var(--border)' }}
            >
              Total
            </th>
          </tr>
          {/* Sub-headers */}
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={thBase('center')} />
            <th style={thBase('left')}>ID</th>
            <th style={thBase('left')}>Name</th>
            <th style={thBase('center')}>Phase</th>
            <th style={thBase('left')}>Unit</th>
            <th style={{ ...thBase('right'), borderLeft: '1px solid var(--border)' }}>Good</th>
            <th style={thBase('right')}>Better</th>
            <th style={thBase('right')}>Best</th>
            <th style={{ ...thBase('right'), borderLeft: '1px solid var(--border)' }}>Good</th>
            <th style={thBase('right')}>Better</th>
            <th style={thBase('right')}>Best</th>
            <th style={{ ...thBase('right'), borderLeft: '1px solid var(--border)' }}>Good</th>
            <th style={thBase('right')}>Better</th>
            <th style={thBase('right')}>Best</th>
          </tr>
        </thead>

        <tbody>
          {grouped.sectionOrder.map((section) => (
            <SectionGroup
              key={section}
              section={section}
              items={grouped.bySection[section]}
              flaggedIds={flaggedIds}
              onFlagToggle={onFlagToggle}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionGroup({
  section,
  items,
  flaggedIds,
  onFlagToggle,
}: {
  section: string;
  items: CostItem[];
  flaggedIds: Set<string>;
  onFlagToggle: (id: string) => void;
}) {
  const sectionHeaderTd: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.57rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    background: 'var(--surface-2)',
    padding: '6px 14px',
    borderBottom: '1px solid var(--border)',
    borderTop: '1px solid var(--border)',
  };

  return (
    <>
      <tr>
        <td colSpan={14} style={sectionHeaderTd}>
          {section}
        </td>
      </tr>
      {items.map((item, i) => {
        const flagged = flaggedIds.has(item.id);
        const phase = PHASE_META[item.phase] ?? {
          color: 'var(--mid)',
          bg: 'var(--surface-2)',
          label: item.phase,
        };
        const tG = item.lG + item.mG;
        const tB = item.lB + item.mB;
        const tBB = item.lBB + item.mBB;
        const rowBg = flagged
          ? FLAG_ROW_BG
          : i % 2 === 0
          ? 'var(--surface)'
          : 'var(--surface-2)';
        const tdBase: CSSProperties = { borderBottom: '1px solid var(--border)' };

        return (
          <tr
            key={item.id}
            style={{ background: rowBg }}
            onMouseEnter={(e) => {
              if (!flagged)
                (e.currentTarget as HTMLTableRowElement).style.background =
                  'var(--surface-2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLTableRowElement).style.background = rowBg;
            }}
          >
            {/* Flag */}
            <td style={{ ...tdBase, padding: '4px', textAlign: 'center' }}>
              <button
                onClick={() => onFlagToggle(item.id)}
                title={flagged ? 'Remove flag' : 'Flag for review'}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: flagged ? FLAG_ACTIVE : 'var(--charcoal)',
                  opacity: flagged ? 1 : 0.15,
                  padding: '2px 4px',
                  lineHeight: 1,
                }}
              >
                ⚑
              </button>
            </td>

            {/* ID */}
            <td
              style={{
                ...tdBase,
                padding: '7px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {item.id}
            </td>

            {/* Name — sans-serif, not mono */}
            <td
              style={{
                ...tdBase,
                padding: '7px 12px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.81rem',
                color: 'var(--charcoal)',
              }}
            >
              {item.name}
            </td>

            {/* Phase */}
            <td style={{ ...tdBase, padding: '7px 4px', textAlign: 'center' }}>
              <span
                title={phase.label}
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: phase.color,
                  background: phase.bg,
                  padding: '2px 5px',
                  borderRadius: 3,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                }}
              >
                {item.phase} · {phase.label}
              </span>
            </td>

            {/* Unit */}
            <td
              style={{
                ...tdBase,
                padding: '7px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.67rem',
                color: 'var(--muted)',
              }}
            >
              {item.unit}
            </td>

            {/* Labour */}
            <td style={rateCell(true)}>{fmt(item.lG)}</td>
            <td style={rateCell(false)}>{fmt(item.lB)}</td>
            <td style={rateCell(false)}>{fmt(item.lBB)}</td>

            {/* Material */}
            <td style={rateCell(true)}>{fmt(item.mG)}</td>
            <td style={rateCell(false)}>{fmt(item.mB)}</td>
            <td style={rateCell(false)}>{fmt(item.mBB)}</td>

            {/* Total */}
            <td style={{ ...rateCell(true), fontSize: '0.78rem' }}>{fmt(tG)}</td>
            <td style={{ ...rateCell(false), fontSize: '0.78rem' }}>{fmt(tB)}</td>
            <td style={{ ...rateCell(false), fontSize: '0.78rem' }}>{fmt(tBB)}</td>
          </tr>
        );
      })}
    </>
  );
}
