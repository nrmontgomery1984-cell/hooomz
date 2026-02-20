'use client';

// ============================================================================
// FlagCard — single risk / attention item row
// Used inside RiskAttentionPanel and anywhere a compact flag item is needed
// ============================================================================

import type { LucideIcon } from 'lucide-react';

export type FlagType = 'blocked' | 'over_budget' | 'overdue' | 'pending_co' | 'training_gap';

const FLAG_COLORS: Record<FlagType, { border: string; bg: string; text: string }> = {
  blocked:       { border: 'var(--red)',   bg: 'var(--red-dim)',   text: 'var(--red)'   },
  over_budget:   { border: 'var(--red)',   bg: 'var(--red-dim)',   text: 'var(--red)'   },
  overdue:       { border: 'var(--amber)', bg: 'var(--amber-dim)', text: 'var(--amber)' },
  pending_co:    { border: 'var(--blue)',  bg: 'var(--blue-dim)',  text: 'var(--blue)'  },
  training_gap:  { border: 'var(--amber)', bg: 'var(--amber-dim)', text: 'var(--amber)' },
};

interface FlagCardProps {
  type: FlagType;
  label: string;
  detail: string;
  icon: LucideIcon;
}

export function FlagCard({ type, label, detail, icon: Icon }: FlagCardProps) {
  const colors = FLAG_COLORS[type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '6px 12px',
        borderLeft: `3px solid ${colors.border}`,
        background: colors.bg,
        margin: '0 0 1px',
      }}
    >
      <Icon
        size={12}
        strokeWidth={1.75}
        style={{ color: colors.border, flexShrink: 0, marginTop: 2 }}
      />
      <div style={{ minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-cond)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: colors.text,
            display: 'block',
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-2)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}
        >
          {detail}
        </span>
      </div>
    </div>
  );
}
