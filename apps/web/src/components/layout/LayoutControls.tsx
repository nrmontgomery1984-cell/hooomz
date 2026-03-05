'use client';

/**
 * LayoutControls — inline controls for adjusting flooring layout config.
 * Renders pattern selector, start corner, stagger offset, and grout width.
 */

import type { LayoutConfig, PatternType, StartCorner } from '@/lib/types/flooringLayout.types';

interface Props {
  config: LayoutConfig;
  onChange: (config: LayoutConfig) => void;
}

const PATTERNS: { value: PatternType; label: string }[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'staggered', label: 'Staggered' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'herringbone', label: 'Herringbone' },
];

const CORNERS: { value: StartCorner; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bot Left' },
  { value: 'bottom-right', label: 'Bot Right' },
];

const STAGGER_OPTIONS = [
  { value: 0.25, label: '1/4' },
  { value: 0.33, label: '1/3' },
  { value: 0.5, label: '1/2' },
];

function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-3)',
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

export function LayoutControls({ config, onChange }: Props) {
  const set = (patch: Partial<LayoutConfig>) => onChange({ ...config, ...patch });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Pattern */}
      <div>
        <ControlLabel>Pattern</ControlLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PATTERNS.map((p) => (
            <button
              key={p.value}
              onClick={() =>
                set({
                  pattern: p.value,
                  rotation: p.value === 'diagonal' ? 45 : 0,
                })
              }
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: `2px solid ${config.pattern === p.value ? '#1E3A8A' : 'var(--border)'}`,
                background: config.pattern === p.value ? 'rgba(30,58,138,0.1)' : 'var(--surface-1)',
                color: config.pattern === p.value ? '#1E3A8A' : 'var(--text-3)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Start corner */}
      <div>
        <ControlLabel>Start Corner</ControlLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CORNERS.map((c) => (
            <button
              key={c.value}
              onClick={() => set({ startCorner: c.value })}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: `2px solid ${config.startCorner === c.value ? '#1E3A8A' : 'var(--border)'}`,
                background:
                  config.startCorner === c.value ? 'rgba(30,58,138,0.1)' : 'var(--surface-1)',
                color: config.startCorner === c.value ? '#1E3A8A' : 'var(--text-3)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stagger offset — only relevant for staggered */}
      {config.pattern === 'staggered' && (
        <div>
          <ControlLabel>Stagger Offset</ControlLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {STAGGER_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => set({ staggerOffset: s.value })}
                style={{
                  width: 48,
                  height: 36,
                  borderRadius: 8,
                  border: `2px solid ${config.staggerOffset === s.value ? '#1E3A8A' : 'var(--border)'}`,
                  background:
                    config.staggerOffset === s.value ? 'rgba(30,58,138,0.1)' : 'var(--surface-1)',
                  color: config.staggerOffset === s.value ? '#1E3A8A' : 'var(--text-3)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grout width */}
      <div>
        <ControlLabel>Grout Width (inches)</ControlLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { value: 0, label: 'None' },
            { value: 0.0625, label: '1/16"' },
            { value: 0.125, label: '1/8"' },
            { value: 0.25, label: '1/4"' },
          ].map((g) => (
            <button
              key={g.value}
              onClick={() => set({ groutWidth: g.value })}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: `2px solid ${config.groutWidth === g.value ? '#1E3A8A' : 'var(--border)'}`,
                background:
                  config.groutWidth === g.value ? 'rgba(30,58,138,0.1)' : 'var(--surface-1)',
                color: config.groutWidth === g.value ? '#1E3A8A' : 'var(--text-3)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
