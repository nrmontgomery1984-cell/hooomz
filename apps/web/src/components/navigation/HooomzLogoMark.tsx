/**
 * Hooomz Logo Mark
 *
 * "H" + three overlapping colored circles (OOO) + "MZ"
 * "INTERIORS" subtitle below.
 *
 * Theme-aware: text uses --sidebar-text (dark in light mode, light in dark mode).
 * Circle fills match --sidebar-bg so overlap layering looks correct.
 */

export function HooomzLogoMark() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* HOOOMZ — H + circles + MZ */}
      <div style={{ display: 'flex', alignItems: 'center', height: 22 }}>
        <span
          style={{
            fontFamily: 'var(--font-cond)',
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--sidebar-text)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          H
        </span>
        <div style={{ position: 'relative', width: 46, height: 20, marginLeft: 1, marginRight: 0 }}>
          {/* Red circle — back */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2.5px solid #C62828',
              background: 'var(--sidebar-bg)',
            }}
          />
          {/* Amber circle — middle */}
          <div
            style={{
              position: 'absolute',
              left: 13,
              top: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2.5px solid #F9A825',
              background: 'var(--sidebar-bg)',
            }}
          />
          {/* Green circle — front */}
          <div
            style={{
              position: 'absolute',
              left: 26,
              top: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2.5px solid #2E7D32',
              background: 'var(--sidebar-bg)',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-cond)',
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--sidebar-text)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          MZ
        </span>
      </div>
      {/* INTERIORS subtitle */}
      <div
        style={{
          fontFamily: 'var(--font-cond)',
          fontSize: 8.5,
          fontWeight: 600,
          letterSpacing: '0.24em',
          color: 'var(--sidebar-muted)',
          textTransform: 'uppercase',
        }}
      >
        INTERIORS
      </div>
    </div>
  );
}
