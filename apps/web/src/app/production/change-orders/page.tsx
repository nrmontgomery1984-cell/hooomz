'use client';

import { SECTION_COLORS } from '@/lib/viewmode';

const COLOR = SECTION_COLORS.production;

export default function ChangeOrdersPage() {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
              Change Orders
            </h1>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Out-of-scope work discovered during Clear phase</p>
        </div>
      </div>
      <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6" style={{ marginTop: 24, textAlign: 'center', padding: '48px 16px' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>Change Orders</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Coming Soon</p>
      </div>
    </div>
  );
}
