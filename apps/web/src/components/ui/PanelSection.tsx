'use client';

// ============================================================================
// PanelSection — consistent header + content wrapper for right-column panels
// ============================================================================

import type { ReactNode } from 'react';

interface PanelSectionProps {
  label: string;
  count?: number;
  countColor?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function PanelSection({ label, count, countColor, action, children }: PanelSectionProps) {
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-cond)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            flex: 1,
          }}
        >
          {label}
        </span>

        {count !== undefined && count > 0 && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              color: countColor ?? 'var(--red)',
              lineHeight: 1,
            }}
          >
            {count}
          </span>
        )}

        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>

      {/* Content */}
      <div style={{ padding: '8px 0' }}>
        {children}
      </div>
    </div>
  );
}
