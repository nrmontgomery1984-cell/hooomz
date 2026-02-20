'use client';

/**
 * Estimate Group Section — Collapsible group header for grouped line items
 *
 * Adapted from RoomSection. Shows icon, label, item count, cost subtotal.
 * CSS grid-template-rows collapse animation.
 */

import { ChevronDown } from 'lucide-react';

interface EstimateGroupSectionProps {
  label: string;
  icon: string;
  itemCount: number;
  subtotal: number;
  accentColor?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children: React.ReactNode;
  /** Override the default "$X,XXX" display with custom text (e.g., "3/5 done") */
  subtotalLabel?: string;
}

export function EstimateGroupSection({
  label,
  icon,
  itemCount,
  subtotal,
  accentColor,
  isCollapsed,
  onToggleCollapse,
  children,
  subtotalLabel,
}: EstimateGroupSectionProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
    >
      <button
        onClick={onToggleCollapse}
        className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left"
        style={{ minHeight: '40px' }}
      >
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: '#9CA3AF',
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        />

        {accentColor && (
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: accentColor }}
          />
        )}

        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold" style={{ color: '#111827' }}>
            {icon} {label}
          </span>
        </div>

        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: '#F3F4F6', color: '#6B7280' }}
        >
          {itemCount}
        </span>

        <span className="text-xs font-medium flex-shrink-0" style={{ color: '#9CA3AF' }}>
          {subtotalLabel || `$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        </span>
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: isCollapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 200ms ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
