/**
 * Hooomz Logo — Text wordmark
 *
 * H●O●O●MZ where each O is a traffic-light colour.
 * "INTERIORS" subtitle below.
 */

export function HooomzLogoMark() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* H O O O M Z */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          lineHeight: 1,
          color: 'var(--text-1)',
        }}
      >
        H
        <span style={{ color: 'var(--o-red)' }}>O</span>
        <span style={{ color: 'var(--o-yellow)' }}>O</span>
        <span style={{ color: 'var(--o-green)' }}>O</span>
        MZ
      </div>

      {/* INTERIORS */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 8,
          fontWeight: 300,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          lineHeight: 1,
        }}
      >
        INTERIORS
      </div>
    </div>
  );
}
