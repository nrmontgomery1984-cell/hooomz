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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* HOOOMZ — H + circles + MZ */}
      <div style={{ display: 'flex', alignItems: 'center', height: 18 }}>
        <span
          style={{
            fontFamily: 'var(--font-cond)',
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--sidebar-text)',
            lineHeight: 1,
          }}
        >
          H
        </span>
        <div style={{ position: 'relative', width: 38, height: 16, marginLeft: 0, marginRight: -1 }}>
          {/* Red circle — back */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2.5px solid #C62828',
              background: 'var(--sidebar-bg)',
            }}
          />
          {/* Amber circle — middle */}
          <div
            style={{
              position: 'absolute',
              left: 11,
              top: 0,
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2.5px solid #F9A825',
              background: 'var(--sidebar-bg)',
            }}
          />
          {/* Green circle — front */}
          <div
            style={{
              position: 'absolute',
              left: 22,
              top: 0,
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2.5px solid #2E7D32',
              background: 'var(--sidebar-bg)',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-cond)',
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--sidebar-text)',
            lineHeight: 1,
          }}
        >
          MZ
        </span>
      </div>
      {/* INTERIORS subtitle */}
      <div
        style={{
          fontFamily: 'var(--font-cond)',
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: '0.22em',
          color: 'var(--sidebar-muted)',
          textTransform: 'uppercase',
        }}
      >
        INTERIORS
      </div>
    </div>
  );
}
