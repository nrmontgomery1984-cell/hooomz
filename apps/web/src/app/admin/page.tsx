'use client';

import Link from 'next/link';
import { User, UsersRound, DollarSign, Settings } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';

const ADMIN_LINKS = [
  { href: '/profile', label: 'Profile', description: 'Your account and business info', icon: User },
  { href: '/admin/crew', label: 'Crew', description: 'Manage crew members and roles', icon: UsersRound },
  { href: '/admin/rates', label: 'Rates', description: 'Labour rates and cost multipliers', icon: DollarSign },
  { href: '/admin/settings', label: 'Settings', description: 'App preferences and configuration', icon: Settings },
];

export default function AdminPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: SECTION_COLORS.admin }} />
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
              Admin
            </h1>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            Account, crew, rates, and settings
          </p>
        </div>
      </div>

      {/* Links grid */}
      <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 mt-4">
        <div style={{ display: 'grid', gap: 10 }} className="md:grid-cols-2">
          {ADMIN_LINKS.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                transition: 'box-shadow 0.15s',
                minHeight: 56,
              }}
              className="hover-surface"
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={18} style={{ color: SECTION_COLORS.admin }} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
