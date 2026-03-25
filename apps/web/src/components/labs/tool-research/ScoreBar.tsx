'use client';

const TEAL = 'var(--accent)';

interface ScoreBarProps {
  value: number;
  max?: number;
  color?: string;
}

export function ScoreBar({ value, max = 5, color = TEAL }: ScoreBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          width: 60,
          height: 8,
          background: 'var(--border)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${(value / max) * 100}%`,
            height: '100%',
            background: color,
            borderRadius: 4,
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 14 }}>{value}</span>
    </div>
  );
}
