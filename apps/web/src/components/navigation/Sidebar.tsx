'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HooomzLogoMark } from './HooomzLogoMark';

// ============================================================================
// Nav Structure
// ============================================================================

interface NavItem {
  icon: string;   // unicode character
  label: string;
  href: string;
  badge?: { count: number; color: string };
  exactMatch?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function buildSections(): NavSection[] {
  return [
    {
      label: 'Main',
      items: [
        { icon: '⊞', label: 'Dashboard', href: '/dashboard', exactMatch: true },
        { icon: '◈', label: 'Jobs', href: '/jobs' },
        { icon: '◎', label: 'Pipeline', href: '/pipeline' },
        { icon: '$', label: 'Sales', href: '/sales' },
      ],
    },
    {
      label: 'Production',
      items: [
        { icon: '⬡', label: 'Site Visits', href: '/production/site-visits' },
        { icon: '≡', label: 'Estimates', href: '/production/estimates' },
        { icon: '✓', label: 'Contracts', href: '/production/contracts' },
        { icon: '▤', label: 'Materials', href: '/production/materials' },
        { icon: '⚑', label: 'Punch Lists', href: '/production/punch-lists' },
      ],
    },
    {
      label: 'Hooomz',
      items: [
        { icon: '◉', label: 'Labs', href: '/labs' },
        { icon: '⊙', label: 'Settings', href: '/settings' },
      ],
    },
  ];
}

// ============================================================================
// Helpers
// ============================================================================

function isActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  if (item.exactMatch) return pathname === item.href;
  return pathname.startsWith(item.href);
}

const hiddenPaths = ['/intake', '/portal'];

// ============================================================================
// Sidebar Component
// ============================================================================

export function Sidebar() {
  const pathname = usePathname();

  if (hiddenPaths.some((p) => pathname?.startsWith(p))) return null;

  const sections = buildSections();

  // Dynamic badges — Jobs green badge, Punch Lists amber badge
  // TODO: Wire to real counts from hooks when available
  const jobsItem = sections[0].items.find((i) => i.label === 'Jobs');
  if (jobsItem) jobsItem.badge = { count: 3, color: 'var(--green)' };
  const punchItem = sections[1].items.find((i) => i.label === 'Punch Lists');
  if (punchItem) punchItem.badge = { count: 2, color: 'var(--amber)' };

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen"
      style={{
        width: 220,
        minWidth: 220,
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '18px 18px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <HooomzLogoMark />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}>
        {sections.map((section) => (
          <div key={section.label} style={{ marginBottom: 16 }}>
            {/* Section label */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                fontWeight: 400,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                padding: '0 18px',
                marginBottom: 6,
                lineHeight: 1,
              }}
            >
              {section.label}
            </div>

            {/* Items */}
            {section.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 18px',
                    textDecoration: 'none',
                    borderLeft: active ? '3px solid var(--clay)' : '3px solid transparent',
                    background: active ? 'var(--sidebar-active)' : 'transparent',
                    transition: 'background 0.15s',
                    minHeight: 34,
                  }}
                >
                  {/* Icon */}
                  <span
                    style={{
                      width: 14,
                      textAlign: 'center',
                      fontSize: 13,
                      lineHeight: 1,
                      color: active ? 'var(--clay)' : 'var(--text-3)',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      fontWeight: active ? 500 : 400,
                      color: active ? 'var(--text-1)' : 'var(--text-3)',
                      lineHeight: 1,
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Badge */}
                  {item.badge && item.badge.count > 0 && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 7,
                        fontWeight: 500,
                        color: '#fff',
                        background: item.badge.color,
                        borderRadius: 99,
                        padding: '2px 5px',
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {item.badge.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
