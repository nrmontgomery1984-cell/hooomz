'use client';

/**
 * Hooomz Logo — H + three coloured O's + MZ in white Figtree 800.
 *
 * Each O represents an independent business health dimension:
 *   O1 (left)   — Sales health: pipeline, leads, quotes
 *   O2 (middle) — Production health: SCRIPT jobs, blockers
 *   O3 (right)  — Financial health: AR, invoices, margins
 *
 * All three CAN be green simultaneously — that's the target state.
 * Green #16A34A / Amber #D97706 / Red #DC2626
 */

import { useJobHealthSummary, type DimensionHealth } from '@/lib/hooks/useJobHealthSummary';

const HEALTH_HEX: Record<DimensionHealth, string> = {
  green: '#16A34A',
  amber: '#D97706',
  red:   '#DC2626',
};

export function HooomzLogoMark({ size = 20 }: { size?: number }) {
  const { sales, production, finance } = useJobHealthSummary();

  const tooltip = `${sales.label}\n${production.label}\n${finance.label}`;

  return (
    <span
      title={tooltip}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: size,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        cursor: 'default',
      }}
    >
      H
      <span style={{ color: HEALTH_HEX[sales.state], transition: 'color 0.6s ease' }}>O</span>
      <span style={{ color: HEALTH_HEX[production.state], transition: 'color 0.6s ease' }}>O</span>
      <span style={{ color: HEALTH_HEX[finance.state], transition: 'color 0.6s ease' }}>O</span>
      MZ
    </span>
  );
}
