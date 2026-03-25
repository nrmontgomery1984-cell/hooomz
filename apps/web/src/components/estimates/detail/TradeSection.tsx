'use client';

/**
 * TradeSection — Collapsible trade group with column toggles and line items table.
 * Matches estimate-detail-v4.html artifact.
 */

import { useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

// ─── Types ───

export interface TradeSectionLineItem {
  id: string;
  description: string;
  spec?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface TradeSectionProps {
  title: string;
  items: TradeSectionLineItem[];
  subtotal: number;
  isEditing?: boolean;
  onEditItem?: (id: string, field: string, value: string | number) => void;
  onRemoveItem?: (id: string) => void;
  onAddItem?: () => void;
  defaultCollapsed?: boolean;
}

type ColumnKey = 'qty' | 'unit' | 'unitcost';

const UNIT_LABELS: Record<string, string> = {
  sqft: 'sq ft',
  lf: 'lin ft',
  cy: 'cu yd',
  each: 'ea',
  hour: 'hour',
  day: 'day',
  lot: 'lot',
  gal: 'gal',
  lb: 'lb',
  ton: 'ton',
  bundle: 'bundle',
  box: 'box',
  bag: 'bag',
};

function formatUnit(unit: string): string {
  return UNIT_LABELS[unit] || unit;
}

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TradeSection({
  title,
  items,
  subtotal,
  isEditing = false,
  onEditItem,
  onRemoveItem,
  onAddItem,
  defaultCollapsed = false,
}: TradeSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hiddenCols, setHiddenCols] = useState<Set<ColumnKey>>(new Set());

  const toggleCol = useCallback((col: ColumnKey) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }, []);

  const isColHidden = (col: ColumnKey) => hiddenCols.has(col);

  return (
    <div className="mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* Trade Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 select-none"
        style={{
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          cursor: 'pointer',
        }}
      >
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold" style={{ color: 'var(--charcoal)' }}>
            {title}
          </h2>
          <span
            className="text-[10px] tracking-[0.04em] px-2 py-0.5"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--muted)',
              background: 'var(--bg)',
            }}
          >
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center">
          <span
            className="text-[13px] font-medium"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
          >
            {formatCurrency(subtotal)}
          </span>
          <ChevronDown
            size={16}
            className="ml-3 flex-shrink-0 transition-transform"
            style={{
              color: 'var(--muted)',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </button>

      {/* Column Toggle Pills */}
      {!collapsed && (
        <div
          className="flex items-center gap-1.5 px-4 py-2"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
        >
          <span
            className="text-[9px] font-medium uppercase tracking-[0.08em] mr-1"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Columns
          </span>
          {(['qty', 'unit', 'unitcost'] as ColumnKey[]).map((col) => {
            const isOff = isColHidden(col);
            const label = col === 'unitcost' ? 'Unit Cost' : col === 'qty' ? 'Qty' : 'Unit';
            return (
              <button
                key={col}
                onClick={() => toggleCol(col)}
                className="text-[10px] font-medium tracking-[0.04em] px-2.5 py-0.5 transition-all select-none"
                style={{
                  fontFamily: 'var(--font-mono)',
                  border: isOff ? '1px solid transparent' : '1px solid var(--border)',
                  background: isOff ? 'transparent' : 'var(--surface)',
                  color: isOff ? 'var(--muted)' : 'var(--charcoal)',
                  textDecoration: isOff ? 'line-through' : 'none',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Line Items Table */}
      {!collapsed && (
        <div>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  className="text-left text-[9px] font-medium uppercase tracking-[0.1em] px-4 py-2"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--muted)',
                    background: 'var(--bg)',
                    borderBottom: '1px solid var(--border)',
                    width: '40%',
                  }}
                >
                  Description
                </th>
                {!isColHidden('qty') && (
                  <th
                    className="text-right text-[9px] font-medium uppercase tracking-[0.1em] px-4 py-2"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--muted)',
                      background: 'var(--bg)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Qty
                  </th>
                )}
                {!isColHidden('unit') && (
                  <th
                    className="text-right text-[9px] font-medium uppercase tracking-[0.1em] px-4 py-2"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--muted)',
                      background: 'var(--bg)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Unit
                  </th>
                )}
                {!isColHidden('unitcost') && (
                  <th
                    className="text-right text-[9px] font-medium uppercase tracking-[0.1em] px-4 py-2"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--muted)',
                      background: 'var(--bg)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Unit Cost
                  </th>
                )}
                <th
                  className="text-right text-[9px] font-medium uppercase tracking-[0.1em] px-4 py-2"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--muted)',
                    background: 'var(--bg)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  Total
                </th>
                {isEditing && (
                  <th
                    style={{
                      width: '36px',
                      background: 'var(--bg)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  />
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td
                    className="px-4 py-2.5 align-top text-[13px]"
                    style={{ borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    {isEditing ? (
                      <>
                        <input
                          className="w-full text-[13px] font-medium px-2 py-1"
                          style={{
                            fontFamily: 'var(--font-body)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--charcoal)',
                          }}
                          defaultValue={item.description}
                          onBlur={(e) => onEditItem?.(item.id, 'description', e.target.value)}
                        />
                        {item.spec && (
                          <input
                            className="w-full text-[11px] mt-1 px-2 py-1"
                            style={{
                              fontFamily: 'var(--font-body)',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              color: 'var(--mid)',
                            }}
                            defaultValue={item.spec}
                            onBlur={(e) => onEditItem?.(item.id, 'spec', e.target.value)}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-medium" style={{ color: 'var(--charcoal)', lineHeight: 1.3 }}>
                          {item.description}
                        </div>
                        {item.spec && (
                          <div className="text-[11px] italic mt-0.5" style={{ color: 'var(--mid)' }}>
                            {item.spec}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  {!isColHidden('qty') && (
                    <td
                      className="px-4 py-2.5 text-right text-[12px] whitespace-nowrap align-top"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--charcoal)',
                        borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-[72px] text-right text-[12px] px-2 py-1"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--charcoal)',
                          }}
                          defaultValue={item.quantity}
                          onBlur={(e) => onEditItem?.(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      ) : (
                        item.quantity.toLocaleString()
                      )}
                    </td>
                  )}
                  {!isColHidden('unit') && (
                    <td
                      className="px-4 py-2.5 text-right text-[12px] whitespace-nowrap align-top"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--charcoal)',
                        borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      {isEditing ? (
                        <input
                          className="w-[56px] text-right text-[12px] px-2 py-1"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--charcoal)',
                          }}
                          defaultValue={formatUnit(item.unit)}
                          onBlur={(e) => onEditItem?.(item.id, 'unit', e.target.value)}
                        />
                      ) : (
                        formatUnit(item.unit)
                      )}
                    </td>
                  )}
                  {!isColHidden('unitcost') && (
                    <td
                      className="px-4 py-2.5 text-right text-[12px] whitespace-nowrap align-top"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--charcoal)',
                        borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          className="w-[72px] text-right text-[12px] px-2 py-1"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--charcoal)',
                          }}
                          defaultValue={item.unitCost}
                          onBlur={(e) => onEditItem?.(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                        />
                      ) : (
                        formatCurrency(item.unitCost)
                      )}
                    </td>
                  )}
                  <td
                    className="px-4 py-2.5 text-right text-[12px] whitespace-nowrap align-top"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--charcoal)',
                      borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {formatCurrency(item.totalCost)}
                  </td>
                  {isEditing && (
                    <td
                      className="px-2 py-2.5 align-top"
                      style={{
                        borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <button
                        onClick={() => onRemoveItem?.(item.id)}
                        className="w-6 h-6 flex items-center justify-center text-sm"
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          color: 'var(--muted)',
                        }}
                        title="Remove"
                      >
                        &times;
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Line Item (edit mode only) */}
          {isEditing && onAddItem && (
            <button
              onClick={onAddItem}
              className="w-full flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium tracking-[0.04em]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--blue)',
                background: 'none',
                border: 'none',
                borderTop: '1px dashed var(--border)',
              }}
            >
              + Add Line Item
            </button>
          )}

          {/* Trade Footer */}
          <div
            className="flex justify-end items-center px-4 py-2.5"
            style={{
              background: 'var(--bg)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <span
              className="text-[10px] uppercase tracking-[0.06em] mr-6 pt-0.5"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
            >
              Subtotal
            </span>
            <span
              className="text-sm font-medium"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}
            >
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
