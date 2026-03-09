'use client';

/**
 * Production Score Widget — homeowner portal
 *
 * 40px dot + score number + status line + SCRIPT stage progression bar
 */

import { useProductionScore } from '@/lib/hooks/useProductionScore';
import { THREE_DOT_HEX } from '@/lib/constants/threeDot';

interface ProductionScoreWidgetProps {
  projectId: string;
}

export function ProductionScoreWidget({ projectId }: ProductionScoreWidgetProps) {
  const { data, isLoading } = useProductionScore(projectId);

  if (isLoading || !data) return null;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        {/* Dot */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: data.hex,
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', lineHeight: 1 }}>
              {data.score}
            </span>
            <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>/100</span>
          </div>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            {data.statusLine}
          </p>
        </div>
      </div>

      {/* SCRIPT stage bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 8 }}>
        {data.stageProgress.map((entry, i) => {
          const dotColor = entry.status === 'done'
            ? THREE_DOT_HEX.green
            : entry.status === 'active'
            ? '#3B82F6'
            : '#D1D5DB';

          return (
            <div key={entry.stage} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* Dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: entry.status === 'active' ? 12 : 8,
                    height: entry.status === 'active' ? 12 : 8,
                    borderRadius: '50%',
                    background: dotColor,
                    border: entry.status === 'active' ? '2px solid #3B82F6' : 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{
                  fontSize: 8,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: entry.status === 'upcoming' ? '#D1D5DB' : '#6B7280',
                }}>
                  {entry.label.charAt(0)}
                </span>
              </div>
              {/* Connector line */}
              {i < data.stageProgress.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: entry.status === 'done' ? THREE_DOT_HEX.green : '#E5E7EB',
                    marginBottom: 16, // offset for the label
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
