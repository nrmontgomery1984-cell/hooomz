'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { HooomzLogoMark } from './HooomzLogoMark';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useAuth } from '@/context/AuthContext';

// ============================================================================
// Nav Structure
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  module?: string; // permission module key — omit to always show
  exactMatch?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function buildSections(): NavSection[] {
  return [
    {
      label: 'Sales',
      items: [
        { label: 'Sales', href: '/sales', module: 'sales', exactMatch: true },
        { label: 'Leads', href: '/leads', module: 'leads' },
        { label: 'Estimates', href: '/estimates', module: 'estimates' },
        { label: 'Consultations', href: '/sales/consultations', module: 'sales' },
        { label: 'Quotes', href: '/sales/quotes', module: 'sales' },
      ],
    },
    {
      label: 'Production',
      items: [
        { label: 'Production', href: '/production', module: 'jobs', exactMatch: true },
        { label: 'Jobs', href: '/production/jobs', module: 'jobs' },
        { label: 'Schedule', href: '/schedule', module: 'jobs' },
        { label: 'Change Orders', href: '/production/change-orders', module: 'jobs' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { label: 'Finance', href: '/finance', exactMatch: true },
        { label: 'Invoices', href: '/finance/invoices' },
        { label: 'Forecast', href: '/forecast/actuals' },
      ],
    },
    {
      label: 'Standards',
      items: [
        { label: 'Standards', href: '/standards', exactMatch: true },
        { label: 'SOPs', href: '/standards/sops' },
        { label: 'Training', href: '/standards/training' },
        { label: 'Knowledge Base', href: '/standards/knowledge' },
        { label: 'Risk Register', href: '/standards/risk-register' },
      ],
    },
    {
      label: 'Labs',
      items: [
        { label: 'Labs', href: '/labs', module: 'labs', exactMatch: true },
        { label: 'Tests', href: '/labs/tests', module: 'labs' },
        { label: 'Tokens', href: '/labs/tokens', module: 'labs' },
        { label: 'Catalogs', href: '/labs/catalogs', module: 'labs' },
        { label: 'Tool Research', href: '/labs/tool-research', module: 'labs' },
      ],
    },
    {
      label: 'Admin',
      items: [
        { label: 'Customers', href: '/customers' },
        { label: 'Crew', href: '/admin/crew' },
        { label: 'Rates', href: '/admin/rates' },
        { label: 'Settings', href: '/admin/settings', module: 'settings' },
      ],
    },
  ];
}

// ============================================================================
// Section–route mapping
// ============================================================================

const SECTION_PREFIXES: Record<string, string[]> = {
  Sales:      ['/sales', '/leads', '/estimates', '/quotes'],
  Production: ['/production', '/schedule'],
  Finance:    ['/finance', '/forecast'],
  Standards:  ['/standards'],
  Labs:       ['/labs'],
  Admin:      ['/customers', '/admin'],
};

function detectActiveSection(pathname: string | null): string | null {
  if (!pathname) return null;
  for (const [section, prefixes] of Object.entries(SECTION_PREFIXES)) {
    if (prefixes.some((p) => pathname.startsWith(p))) return section;
  }
  return null;
}

const STORAGE_KEY = 'sidebar_open_section';

function loadOpenSection(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function saveOpenSection(section: string | null): void {
  try {
    if (section) sessionStorage.setItem(STORAGE_KEY, section);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent — sessionStorage may be unavailable
  }
}

// ============================================================================
// Helpers
// ============================================================================

function isActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  if (item.exactMatch) return pathname === item.href;
  return pathname.startsWith(item.href);
}

const hiddenPaths = ['/intake', '/portal', '/login'];

// ============================================================================
// Sidebar Component
// ============================================================================

export function Sidebar() {
  const pathname = usePathname();
  const { hasAccess } = usePermissions();
  const { services, isLoading: servicesLoading } = useServicesContext();

  // Pending CO count for badge
  const { data: pendingCOCount = 0 } = useQuery({
    queryKey: ['sidebar', 'pendingCOs'],
    queryFn: async () => {
      const all = await services!.storage.getAll<{ status: string }>('changeOrders');
      return all.filter((co) => co.status === 'pending_approval').length;
    },
    enabled: !servicesLoading && !!services,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const [openSection, setOpenSection] = useState<string | null>(() => {
    return loadOpenSection() ?? detectActiveSection(pathname);
  });

  // Persist on every toggle
  useEffect(() => {
    saveOpenSection(openSection);
  }, [openSection]);

  // When route changes, open the section containing the new route
  useEffect(() => {
    const active = detectActiveSection(pathname);
    if (active && active !== openSection) setOpenSection(active);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback((sectionLabel: string) => {
    setOpenSection((prev) => prev === sectionLabel ? null : sectionLabel);
  }, []);

  const router = useRouter();
  const { signOut, profile } = useAuth();

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push('/login');
  }, [signOut, router]);

  if (hiddenPaths.some((p) => pathname?.startsWith(p))) return null;

  const sections = buildSections().map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.module || hasAccess(item.module)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen"
      style={{
        width: 220,
        minWidth: 220,
        flexShrink: 0,
        background: 'var(--dark-nav)',
        borderRight: 'none',
        overflowY: 'auto',
        overflowX: 'hidden',
        color: '#fff',
        paddingBottom: 32,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '18px 18px 14px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          flexShrink: 0,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <HooomzLogoMark />
        </Link>
      </div>

      {/* Nav */}
      <nav>
        {sections.map((section, sectionIndex) => (
          <div key={section.label}>
            {/* Section label — clickable to toggle */}
            <div
              onClick={() => toggle(section.label)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                color: 'rgba(255,255,255,.5)',
                textTransform: 'uppercase' as const,
                padding: sectionIndex === 0 ? '12px 20px 4px 20px' : '16px 20px 4px 20px',
                marginTop: sectionIndex === 0 ? 0 : 8,
                display: 'block',
                lineHeight: 1,
                cursor: 'pointer',
                userSelect: 'none' as const,
              }}
            >
              {section.label}
            </div>

            {/* Items — only rendered when section is expanded */}
            {openSection === section.label && section.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="sidebar-link"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9.5px',
                    fontWeight: 400,
                    letterSpacing: '0.10em',
                    color: active ? '#fff' : 'rgba(255,255,255,.45)',
                    textTransform: 'uppercase' as const,
                    padding: active ? '7px 20px 7px 18px' : '7px 20px',
                    borderLeft: active ? '2px solid var(--green)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                    background: 'none',
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden' as const,
                    textOverflow: 'ellipsis',
                    lineHeight: 1,
                  }}
                >
                  {item.label}
                  {item.href === '/production/change-orders' && pendingCOCount > 0 && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 7,
                      fontWeight: 700,
                      background: 'var(--amber, #D97706)',
                      color: '#000',
                      borderRadius: 4,
                      padding: '1px 4px',
                      lineHeight: '12px',
                      flexShrink: 0,
                    }}>
                      {pendingCOCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Section divider — always visible */}
            {sectionIndex < sections.length - 1 && (
              <div
                style={{
                  borderBottom: '1px solid rgba(255,255,255,.06)',
                  margin: '8px 20px',
                }}
              />
            )}
          </div>
        ))}
      </nav>

      {/* Sign Out */}
      <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        {profile && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>
            {profile.full_name || profile.email}
          </div>
        )}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 400,
            letterSpacing: '0.10em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,.35)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, transition: 'color 0.15s',
          }}
          className="sidebar-link"
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
