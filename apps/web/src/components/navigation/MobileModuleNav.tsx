'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SIDEBAR_SECTIONS } from '@/lib/viewmode';
import { useViewMode } from '@/lib/viewmode';

/**
 * MobileModuleNav — horizontal scrolling sub-page tabs visible only on mobile.
 *
 * Reads SIDEBAR_SECTIONS to determine which module the user is in,
 * then renders that module's sub-pages as a scrollable tab strip.
 * Hidden on md+ screens (sidebar handles navigation there).
 */
export function MobileModuleNav() {
  const pathname = usePathname();
  const { viewMode } = useViewMode();

  // Find which section the current path belongs to
  const activeSection = SIDEBAR_SECTIONS.find((section) => {
    // Check if pathname matches the dashboard href or any item href
    if (pathname === section.dashboardHref) return true;
    return section.items.some((item) => {
      if (item.exactMatch) return pathname === item.href;
      if (pathname.startsWith(item.href) && item.href !== '/') return true;
      // Check activePaths
      if (item.activePaths) {
        return item.activePaths.some((p) => pathname.startsWith(p));
      }
      return false;
    });
  });

  // Don't render if no matching section, or if section has only 1 item (e.g., Customers)
  if (!activeSection || activeSection.items.length <= 1) return null;

  // Filter items by current view mode
  const visibleItems = activeSection.items.filter(
    (item) => item.allowedModes.includes(viewMode)
  );

  if (visibleItems.length <= 1) return null;

  return (
    <nav
      className="md:hidden"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        display: 'flex',
        gap: 0,
        padding: '0 12px',
        flexShrink: 0,
      }}
    >
      {visibleItems.map((item) => {
        // Determine if this item is active
        const isActive = item.exactMatch
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/') ||
            (item.activePaths?.some((p) => pathname.startsWith(p)) ?? false);

        // Use short label (strip "Dashboard", "Sales ", etc.)
        const label = item.isDashboard
          ? 'Dashboard'
          : item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: isActive ? 'var(--dark-nav)' : 'var(--muted)',
              background: 'none',
              borderBottom: isActive
                ? '2px solid #111010'
                : '2px solid transparent',
              padding: '10px 10px',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
