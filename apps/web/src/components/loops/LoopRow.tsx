'use client';

import { ChevronRight } from 'lucide-react';

// ============================================================================
// LoopRow — compact hierarchical row for loop/task trees
// Used in project detail (loop column) and dashboard (project list)
// ============================================================================

export type LoopStatus = 'green' | 'amber' | 'red' | 'blue' | 'grey';
export type LoopDepth = 0 | 1 | 2 | 3;

export interface LoopRowProps {
  name: string;
  subLabel?: string;
  depth: LoopDepth;
  status: LoopStatus;
  pct: number;
  delta?: string;
  tradeBadge?: string;
  icon?: React.ReactNode;
  isComplete?: boolean;
  isBlocked?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onFlagClick?: () => void;
  onClick?: () => void;
}

// Left padding by depth level
const DEPTH_PADDING: Record<LoopDepth, number> = {
  0: 14,
  1: 26,
  2: 38,
  3: 50,
};

// Status → color mapping
const STATUS_COLOR: Record<LoopStatus, string> = {
  green: 'var(--green)',
  amber: 'var(--amber)',
  red:   'var(--red)',
  blue:  'var(--blue)',
  grey:  'var(--text-3)',
};

// Trade badge color configs
const TRADE_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  FL:   { bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B' },
  FC:   { bg: 'rgba(37,99,235,0.15)',   color: '#60A5FA' },
  DEMO: { bg: 'rgba(239,68,68,0.12)',   color: '#F87171' },
  GEN:  { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
};

export function LoopRow({
  name,
  subLabel,
  depth,
  status,
  pct,
  delta,
  tradeBadge,
  icon,
  isComplete = false,
  isBlocked = false,
  hasChildren = false,
  isExpanded = false,
  onToggle,
  onFlagClick,
  onClick,
}: LoopRowProps) {
  const color = STATUS_COLOR[status];
  const paddingLeft = DEPTH_PADDING[depth];
  const tradeColors = tradeBadge ? (TRADE_BADGE_COLORS[tradeBadge] ?? { bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' }) : null;

  // Delta color
  let deltaColor = 'var(--text-3)';
  if (delta) {
    if (delta.startsWith('+')) deltaColor = 'var(--green)';
    else if (delta.toUpperCase() === 'BLOCKED') deltaColor = 'var(--red)';
    else deltaColor = 'var(--amber)';
  }

  const handleClick = () => {
    if (hasChildren && onToggle) onToggle();
    else if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingLeft,
        paddingRight: 10,
        cursor: 'pointer',
        borderLeft: `4px solid ${color}`,
        background: depth === 0 ? 'var(--surface-2)' : 'transparent',
        transition: 'background 0.1s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = depth === 0 ? 'var(--surface-2)' : 'transparent'; }}
    >
      {/* Expand chevron */}
      {hasChildren ? (
        <ChevronRight
          size={10}
          color="var(--text-3)"
          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: 10, flexShrink: 0 }} />
      )}

      {/* Icon */}
      {icon && (
        <div style={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'center', color: 'var(--text-3)' }}>
          {icon}
        </div>
      )}

      {/* Name block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
            ...(isComplete ? { textDecoration: 'line-through', opacity: 0.45 } : {}),
          }}
        >
          {name}
        </div>
        {subLabel && (
          <div style={{ fontSize: 10, color: 'var(--text-2)', lineHeight: 1, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subLabel}
          </div>
        )}
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Trade badge */}
        {tradeBadge && tradeColors && (
          <span style={{ fontFamily: 'var(--font-cond)', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', background: tradeColors.bg, color: tradeColors.color, padding: '1px 4px', borderRadius: 2 }}>
            {tradeBadge}
          </span>
        )}

        {/* Pct + progress bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, lineHeight: 1 }}>
            {pct}%
          </span>
          <div style={{ width: 52, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 1, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Delta */}
        {delta && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: deltaColor, flexShrink: 0 }}>
            {delta}
          </span>
        )}

        {/* Block flag */}
        {isBlocked && (
          <button
            onClick={(e) => { e.stopPropagation(); onFlagClick?.(); }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, lineHeight: 1 }}
            title="Blocked"
          >
            🚩
          </button>
        )}
      </div>
    </div>
  );
}
