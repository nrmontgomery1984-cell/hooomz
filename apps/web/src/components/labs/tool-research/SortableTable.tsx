'use client';

import { useState, useMemo, type ReactNode } from 'react';

const NAVY = 'var(--charcoal)';
const LIGHT_BG = 'var(--surface-2)';

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  P0: { bg: 'var(--green-bg)', text: 'var(--green)' },
  P1: { bg: '#FFF8E1', text: '#F57F17' },
  P2: { bg: 'var(--amber-dim)', text: 'var(--amber)' },
  P3: { bg: 'var(--red-bg)', text: 'var(--red)' },
};

export interface TableColumn<T> {
  key: string;
  label: string;
  minW?: number | string;
  maxW?: number | string;
  nowrap?: boolean;
  small?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
}

interface SortableTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  defaultSort?: number;
  rowStyle?: (row: T) => React.CSSProperties | undefined;
  onRowClick?: (row: T) => void;
}

export function SortableTable<T extends object>({
  columns,
  data,
  defaultSort = 0,
  rowStyle,
  onRowClick,
}: SortableTableProps<T>) {
  const [sortCol, setSortCol] = useState(defaultSort);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const key = columns[sortCol].key;
    return [...data].sort((a, b) => {
      const va = (a as Record<string, unknown>)[key] ?? '';
      const vb = (b as Record<string, unknown>)[key] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data, sortCol, sortDir, columns]);

  const toggle = (i: number) => {
    if (sortCol === i) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(i);
      setSortDir('asc');
    }
  };

  return (
    <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                onClick={() => toggle(i)}
                style={{
                  background: NAVY,
                  color: 'white',
                  padding: '10px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  fontWeight: 600,
                  minWidth: col.minW || 'auto',
                  position: 'sticky',
                  top: 0,
                }}
              >
                {col.label} {sortCol === i ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, ri) => (
            <tr
              key={ri}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={(e) => {
                if (onRowClick) (e.currentTarget as HTMLElement).style.background = '#EDF2F7';
              }}
              onMouseLeave={(e) => {
                if (onRowClick) {
                  const rs = rowStyle?.(row);
                  (e.currentTarget as HTMLElement).style.background =
                    rs?.background as string ?? (ri % 2 === 0 ? 'var(--surface)' : LIGHT_BG);
                }
              }}
              style={{ background: ri % 2 === 0 ? 'var(--surface)' : LIGHT_BG, cursor: onRowClick ? 'pointer' : undefined, ...rowStyle?.(row) }}
            >
              {columns.map((col, ci) => {
                const val = (row as Record<string, unknown>)[col.key];
                const isPriority =
                  col.key === 'priority' && typeof val === 'string' && PRIORITY_COLORS[val];
                return (
                  <td
                    key={ci}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border)',
                      background: isPriority ? PRIORITY_COLORS[val as string].bg : undefined,
                      color: isPriority
                        ? PRIORITY_COLORS[val as string].text
                        : '#2D3748',
                      fontWeight: isPriority || ci === 0 ? 600 : 400,
                      fontSize: col.small ? 11 : 13,
                      whiteSpace: col.nowrap ? 'nowrap' : 'normal',
                      maxWidth: col.maxW || 'none',
                    }}
                  >
                    {col.render ? col.render(val, row) : (val as ReactNode)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
