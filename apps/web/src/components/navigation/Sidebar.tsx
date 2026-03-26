'use client';

/**
 * Sidebar — DESIGN / SCRIPT navigation
 *
 * Accordion nav: DESIGN and SCRIPT groups collapse/expand (one open at a time) + flat items below.
 * Adapted from apps/interiors Sidebar for Next.js App Router.
 */

import { useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { colors, typography, fontSizes } from '@/lib/constants/designSystem';

// ============================================================================
// NAV STRUCTURE
// ============================================================================

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const DESIGN_GROUP: NavGroup = {
  label: 'DESIGN',
  items: [
    { label: 'Dashboard', href: '/design' },
    { label: 'Discover', href: '/design/discover' },
    { label: 'Estimate', href: '/design/estimate' },
    { label: 'Survey', href: '/design/survey' },
    { label: 'Iterations', href: '/design/iterations' },
    { label: 'Go-Ahead', href: '/design/go-ahead' },
    { label: 'Notify', href: '/design/notify' },
  ],
};

const SCRIPT_GROUP: NavGroup = {
  label: 'SCRIPT',
  items: [
    { label: 'Dashboard', href: '/script' },
    { label: 'Shield', href: '/script/shield' },
    { label: 'Clear', href: '/script/clear' },
    { label: 'Ready', href: '/script/ready' },
    { label: 'Install', href: '/script/install' },
    { label: 'Punch', href: '/script/punch' },
    { label: 'Turnover', href: '/script/turnover' },
  ],
};

const FLAT_ITEMS: NavItem[] = [
  { label: 'Finance', href: '/finance' },
  { label: 'Standards', href: '/standards' },
  { label: 'Labs', href: '/labs' },
  { label: 'Admin', href: '/admin' },
];

// ============================================================================
// HELPERS
// ============================================================================

const hiddenPaths = ['/intake', '/portal', '/login'];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  // Exact match for dashboard routes, prefix match for sub-routes
  if (href === '/design' || href === '/script') return pathname === href;
  if (href === '/finance' || href === '/standards' || href === '/labs' || href === '/admin') {
    return pathname === href || pathname.startsWith(href + '/');
  }
  return pathname === href || pathname.startsWith(href + '/');
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

/** Determine which group owns a given pathname */
function groupForPath(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname.startsWith('/design')) return DESIGN_GROUP.label;
  if (pathname.startsWith('/script')) return SCRIPT_GROUP.label;
  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, profile } = useAuth();

  // Accordion: only one group open at a time. Initial = active route's group.
  const initialGroup = useMemo(() => groupForPath(pathname), []);
  const [openGroup, setOpenGroup] = useState<string | null>(initialGroup);

  const toggleGroup = useCallback((label: string) => {
    setOpenGroup((prev) => (prev === label ? null : label));
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push('/login');
  }, [signOut, router]);

  if (hiddenPaths.some((p) => pathname?.startsWith(p))) return null;

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen"
      style={{
        width: 220,
        minWidth: 220,
        flexShrink: 0,
        background: colors.sidebarBg,
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
          padding: '18px 16px 14px',
          borderBottom: `1px solid ${colors.sidebarDivider}`,
          flexShrink: 0,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span
            style={{
              fontFamily: typography.primary,
              fontSize: 20,
              fontWeight: 800,
              color: colors.sidebarNavActive,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            H
            <span style={{ color: colors.red }}>O</span>
            <span style={{ color: colors.amber }}>O</span>
            <span style={{ color: colors.green }}>O</span>
            MZ
          </span>
        </Link>
        <div
          style={{
            fontFamily: typography.mono,
            fontSize: fontSizes.monoBase,
            color: colors.sidebarUserText,
            letterSpacing: '0.12em',
            marginTop: 2,
          }}
        >
          INTERIORS OS
        </div>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto">
        {/* DESIGN group */}
        <NavGroupSection group={DESIGN_GROUP} pathname={pathname} open={openGroup === DESIGN_GROUP.label} onToggle={toggleGroup} />

        {/* Divider */}
        <div
          className="mx-3 my-1.5"
          style={{ height: 1, background: colors.sidebarDivider }}
        />

        {/* SCRIPT group */}
        <NavGroupSection group={SCRIPT_GROUP} pathname={pathname} open={openGroup === SCRIPT_GROUP.label} onToggle={toggleGroup} />

        {/* Divider */}
        <div
          className="mx-3 my-1.5"
          style={{ height: 1, background: colors.sidebarDivider }}
        />

        {/* Flat items */}
        <div className="py-3">
          {FLAT_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              indent={false}
            />
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div style={{ marginTop: 'auto', padding: '16px 16px', borderTop: `1px solid ${colors.sidebarDivider}` }}>
        {profile && (
          <div
            style={{
              fontFamily: typography.mono,
              fontSize: fontSizes.monoBase,
              color: colors.sidebarUserText,
              letterSpacing: '0.08em',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            {profile.full_name || profile.email}
          </div>
        )}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: typography.mono,
            fontSize: fontSizes.monoMd,
            fontWeight: 400,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: colors.sidebarNavDefault,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.15s',
          }}
          className="sidebar-link"
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function NavGroupSection({
  group,
  pathname,
  open,
  onToggle,
}: {
  group: NavGroup;
  pathname: string | null;
  open: boolean;
  onToggle: (label: string) => void;
}) {
  // Each item is ~31px tall (7px padding top + 7px bottom + ~17px content)
  const itemHeight = 31;
  const maxHeight = open ? group.items.length * itemHeight : 0;

  return (
    <div className="py-3">
      {/* Group label — clickable toggle */}
      <button
        onClick={() => onToggle(group.label)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          fontFamily: typography.mono,
          fontSize: fontSizes.monoGroupLabel,
          color: colors.sidebarGroupLabel,
          letterSpacing: '0.2em',
          padding: '6px 16px 4px',
          textTransform: 'uppercase' as const,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
        className="sidebar-link"
      >
        <ChevronRight
          size={10}
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
        {group.label}
      </button>

      {/* Collapsible item list */}
      <div
        style={{
          maxHeight,
          overflow: 'hidden',
          transition: 'max-height 0.2s ease',
        }}
      >
        {group.items.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            indent
          />
        ))}
      </div>
    </div>
  );
}

function SidebarNavItem({
  item,
  active,
  indent,
}: {
  item: NavItem;
  active: boolean;
  indent: boolean;
}) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-2.5 no-underline sidebar-link"
      style={{
        fontFamily: typography.mono,
        fontSize: fontSizes.monoNavSub,
        letterSpacing: '0.04em',
        padding: `7px 16px 7px ${indent ? '24px' : '16px'}`,
        color: active ? colors.sidebarNavActive : colors.sidebarNavDefault,
        background: active ? colors.sidebarActiveBg : 'transparent',
        fontWeight: active ? 500 : 400,
        borderLeft: active
          ? `2px solid ${colors.sidebarActiveBorder}`
          : '2px solid transparent',
        transition: 'color 0.15s, background 0.15s',
        textDecoration: 'none',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis',
      }}
    >
      {/* Nav dot */}
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: 5,
          height: 5,
          background: active ? colors.sidebarActiveBorder : 'rgba(255,255,255,0.12)',
        }}
      />
      {item.label}
    </Link>
  );
}

export default Sidebar;
