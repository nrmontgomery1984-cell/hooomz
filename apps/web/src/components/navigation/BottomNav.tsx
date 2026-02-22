'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Activity, Calculator, FlaskConical, TrendingUp, Plus, Sun, Moon, UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useQuickAdd } from '@/components/activity/QuickAddContext';
import {
  useViewMode,
  VIEW_MODE_LABELS,
  BOTTOM_NAV_ITEMS,
  isQuickAddButtonAllowed,
} from '@/lib/viewmode';
import type { ViewMode } from '@/lib/viewmode';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { useDarkMode } from '@/lib/hooks/useDarkMode';

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Activity,
  Calculator,
  TrendingUp,
  FlaskConical,
};

const ALL_MODES: ViewMode[] = ['manager', 'operator', 'installer', 'homeowner'];
const hiddenPaths = ['/intake', '/portal'];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, open, close } = useQuickAdd();
  const { viewMode, setViewMode } = useViewMode();
  const { crewMemberName } = useActiveCrew();
  const { data: projectsResult } = useLocalProjects();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside tap
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

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

  const initials = crewMemberName
    ? crewMemberName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'NM';

  const handleModeSelect = (mode: ViewMode) => {
    setViewMode(mode);
    setMenuOpen(false);
    if (mode === 'homeowner') {
      const projects = projectsResult?.projects || [];
      const firstProject = projects[0];
      if (firstProject) {
        router.push(`/portal/${firstProject.id}`);
      } else {
        setViewMode('manager');
      }
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t z-40 pb-safe md:hidden"
      style={{
        backgroundColor: 'var(--surface-1, #FFFFFF)',
        borderColor: 'var(--border, #e5e7eb)',
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

        {/* View mode switcher */}
        <div className="relative flex flex-col items-center justify-center w-16 h-16" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Switch view mode"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              width: 48,
              height: 48,
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--blue, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: 'white',
              fontFamily: 'var(--font-cond)',
            }}>
              {initials}
            </div>
            <span style={{
              fontSize: 10,
              marginTop: 2,
              fontWeight: 600,
              color: 'var(--blue, #3B82F6)',
              fontFamily: 'var(--font-cond)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}>
              {VIEW_MODE_LABELS[viewMode]}
            </span>
          </button>

          {/* Popover menu */}
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: 8,
                background: 'var(--surface-1, #FFFFFF)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                padding: 6,
                minWidth: 180,
                zIndex: 50,
              }}
            >
              {ALL_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeSelect(mode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    background: mode === viewMode ? 'var(--blue-dim, #EFF6FF)' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: mode === viewMode ? 'var(--blue, #3B82F6)' : 'var(--text, #111827)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    fontWeight: mode === viewMode ? 600 : 500,
                    minHeight: 44,
                    textAlign: 'left',
                  }}
                >
                  <UserCircle size={18} strokeWidth={1.5} />
                  {VIEW_MODE_LABELS[mode]}
                </button>
              ))}

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border, #e5e7eb)', margin: '4px 8px' }} />

              {/* Dark mode toggle */}
              <button
                onClick={() => { toggleDark(); setMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: 'var(--text, #111827)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 500,
                  minHeight: 44,
                  textAlign: 'left',
                }}
              >
                {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          )}
        </div>
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
