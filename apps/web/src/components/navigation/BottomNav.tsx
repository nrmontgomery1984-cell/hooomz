'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Activity, Calculator, FlaskConical, Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useQuickAdd } from '@/components/activity/QuickAddContext';
import {
  useViewMode,
  BOTTOM_NAV_ITEMS,
  isQuickAddButtonAllowed,
} from '@/lib/viewmode';

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Activity,
  Calculator,
  FlaskConical,
};

const hiddenPaths = ['/intake', '/portal'];

export function BottomNav() {
  const pathname = usePathname();
  const { isOpen, open, close } = useQuickAdd();
  const { viewMode } = useViewMode();

  if (hiddenPaths.some((path) => pathname?.startsWith(path))) return null;
  if (viewMode === 'homeowner') return null;

  const visibleItems = BOTTOM_NAV_ITEMS.filter((item) =>
    item.allowedModes.includes(viewMode)
  );
  const showQuickAdd = isQuickAddButtonAllowed(viewMode);

  // Split items for left/right of center button
  const midpoint = Math.ceil(visibleItems.length / 2);
  const leftItems = visibleItems.slice(0, midpoint);
  const rightItems = visibleItems.slice(midpoint);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t z-40 pb-safe md:hidden"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div className="flex items-end justify-around max-w-lg mx-auto h-16">
        {/* Left items */}
        {leftItems.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Home;
          const isActive = item.href === '/'
            ? pathname === '/'
            : !!pathname?.startsWith(item.href);
          return (
            <NavLink
              key={item.href}
              href={item.href}
              icon={Icon}
              label={item.label}
              isActive={isActive}
            />
          );
        })}

        {/* Center "+" button */}
        {showQuickAdd && (
          <div className="flex flex-col items-center justify-end pb-1 -mt-4">
            <button
              onClick={() => isOpen ? close() : open()}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200"
              style={{ backgroundColor: 'var(--theme-accent)' }}
              aria-label={isOpen ? 'Close quick add' : 'Quick add'}
              aria-expanded={isOpen}
            >
              <Plus
                size={28}
                color="white"
                strokeWidth={2.5}
                className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
              />
            </button>
          </div>
        )}

        {/* Right items */}
        {rightItems.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Home;
          const isActive = item.href === '/'
            ? pathname === '/'
            : !!pathname?.startsWith(item.href);
          return (
            <NavLink
              key={item.href}
              href={item.href}
              icon={Icon}
              label={item.label}
              isActive={isActive}
            />
          );
        })}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center w-16 h-16 transition-colors"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        size={20}
        strokeWidth={1.5}
        style={{ color: isActive ? 'var(--theme-accent)' : 'var(--theme-muted)' }}
      />
      <span
        className="text-[10px] mt-1 font-medium"
        style={{ color: isActive ? 'var(--theme-accent)' : 'var(--theme-muted)' }}
      >
        {label}
      </span>
    </Link>
  );
}
