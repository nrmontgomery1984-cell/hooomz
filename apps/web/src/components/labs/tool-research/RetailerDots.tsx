'use client';

const TEAL = 'var(--accent)';
const ALL_RETAILERS = ['Home Depot', 'Home Hardware', 'Kent', 'Rona', 'Canadian Tire'];

interface RetailerDotsProps {
  retailers: string[];
}

export function RetailerDots({ retailers }: RetailerDotsProps) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
      {ALL_RETAILERS.map((r, i) => {
        const has = retailers.includes(r);
        return (
          <span
            key={i}
            title={r}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: has ? TEAL : '#DDD',
              display: 'inline-block',
            }}
          />
        );
      })}
      <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>{retailers.length}/5</span>
    </div>
  );
}
