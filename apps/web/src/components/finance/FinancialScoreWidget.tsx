'use client';

/**
 * Financial Score Widget — 40px dot + score + label + three sub-indicator rows
 */

import { useFinancialScore } from '@/lib/hooks/useFinancialScore';

export function FinancialScoreWidget() {
  const { data, isLoading } = useFinancialScore();

  if (isLoading || !data) return null;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: data.hex, flexShrink: 0,
        }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--charcoal)', lineHeight: 1 }}>
              {data.score}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>/100</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--mid)', marginTop: 2, fontWeight: 500 }}>
            {data.label}
          </p>
        </div>
      </div>

      {/* Sub-indicators */}
      {(['receivables', 'margins', 'revenue'] as const).map((key) => {
        const sub = data.subIndicators[key];
        return (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 0',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sub.hex, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--mid)', flex: 1 }}>{sub.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--charcoal)' }}>
              {sub.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
