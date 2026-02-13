'use client';

const TEAL = '#2A9D8F';

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
          background: '#E0E0E0',
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
      <span style={{ fontSize: 11, color: '#666', minWidth: 14 }}>{value}</span>
    </div>
  );
}
