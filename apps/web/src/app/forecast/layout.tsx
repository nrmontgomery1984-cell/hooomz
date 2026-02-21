'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

const TABS = [
  { id: 'actuals', label: 'Actuals', href: '/forecast/actuals' },
  { id: 'projections', label: 'Projections', href: '/forecast/projections' },
  { id: 'variance', label: 'Variance', href: '/forecast/variance' },
] as const;

export default function ForecastLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F9FAFB)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-1, #FFFFFF)', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <TrendingUp size={24} style={{ color: 'var(--blue, #3B82F6)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text, #111827)', margin: 0, fontFamily: 'var(--font-sans)' }}>
              Financial Forecast
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3, #9CA3AF)', margin: '0 0 16px', fontFamily: 'var(--font-sans)' }}>
            Revenue tracking, projections, and variance analysis
          </p>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderBottom: 'none' }}>
            {TABS.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  style={{
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--blue, #3B82F6)' : 'var(--text-2, #6B7280)',
                    borderBottom: isActive ? '2px solid var(--blue, #3B82F6)' : '2px solid transparent',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-sans)',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 100px' }}>
        {children}
      </div>
    </div>
  );
}
