'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  Calculator,
  FlaskConical,
  User,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Home,
  DollarSign,
  FolderOpen,
  Calendar,
  Tag,
  TestTube2,
  Vote,
  TrendingUp,
  Sun,
  Moon,
} from 'lucide-react';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import type { LucideIcon } from 'lucide-react';
import { HooomzLogoMark } from './HooomzLogoMark';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import {
  useViewMode,
  SIDEBAR_SECTIONS,
  VIEW_MODE_LABELS,
} from '@/lib/viewmode';
import type { ViewMode } from '@/lib/viewmode';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';

// Map iconName strings from config to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Activity,
  Calculator,
  FlaskConical,
  User,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Home,
  DollarSign,
  FolderOpen,
  Calendar,
  Tag,
  TestTube2,
  Vote,
  TrendingUp,
};

// Cycle order for view mode
const MODE_CYCLE: ViewMode[] = ['manager', 'operator', 'installer', 'homeowner'];

const hiddenPaths = ['/intake', '/portal'];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useViewMode();
  const { data: projectsResult } = useLocalProjects();
  const { crewMemberName } = useActiveCrew();
  const { isDark, toggle: toggleDark } = useDarkMode();

  // Homeowner mode: redirect to portal using first real project
  useEffect(() => {
    if (viewMode === 'homeowner') {
      const projects = projectsResult?.projects || [];
      const firstProject = projects[0];
      if (firstProject) {
        router.push(`/portal/${firstProject.id}`);
      } else {
        setViewMode('manager');
      }
    }
  }, [viewMode, projectsResult, router, setViewMode]);

  if (hiddenPaths.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  if (viewMode === 'homeowner') {
    return null;
  }

  // Derive crew initials
  const initials = crewMemberName
    ? crewMemberName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'NM';

  // Cycle view mode on click
  const cycleMode = () => {
    const idx = MODE_CYCLE.indexOf(viewMode);
    const next = MODE_CYCLE[(idx + 1) % MODE_CYCLE.length];
    setViewMode(next);
  };

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen"
      style={{
        width: 200,
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ borderBottom: '1px solid var(--sidebar-border)', padding: '16px 16px', display: 'flex', alignItems: 'center' }}>
        <HooomzLogoMark />
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 0', gap: 1, overflowY: 'auto' }}>
        {SIDEBAR_SECTIONS.map((section, sectionIdx) => {
          const visibleItems = section.items.filter((item) =>
            item.allowedModes.includes(viewMode)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.id} style={{ width: '100%' }}>
              {sectionIdx > 0 && (
                <div style={{ height: 1, background: 'var(--sidebar-border)', margin: '6px 12px' }} />
              )}
              {visibleItems.map((item) => {
                const isActive = item.exactMatch
                  ? pathname === item.href
                  : !!pathname?.startsWith(item.href) && item.href !== '/';
                const finalActive = item.href === '/' ? pathname === '/' : isActive;
                const Icon = ICON_MAP[item.iconName] || LayoutDashboard;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '8px 12px',
                      borderLeft: finalActive ? '3px solid var(--blue)' : '3px solid transparent',
                      background: finalActive ? 'var(--sidebar-active)' : 'transparent',
                      color: finalActive ? 'var(--blue)' : 'var(--sidebar-muted)',
                      textDecoration: 'none',
                      transition: 'background 0.15s, color 0.15s',
                      minHeight: 38,
                    }}
                  >
                    <Icon size={18} strokeWidth={finalActive ? 2 : 1.5} style={{ flexShrink: 0 }} />
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      fontWeight: finalActive ? 600 : 500,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom — crew info + dark mode + view mode */}
      <div style={{ borderTop: '1px solid var(--sidebar-border)', padding: '12px' }}>
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--sidebar-muted)',
            borderRadius: 'var(--radius)',
            transition: 'background 0.15s',
            minHeight: 36,
          }}
          className="hover-surface"
        >
          {isDark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500 }}>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* Crew + View mode row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'var(--blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-cond)',
            fontSize: 11,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {crewMemberName || 'Nathan M.'}
            </div>
            <button
              onClick={cycleMode}
              title={`Switch mode (current: ${VIEW_MODE_LABELS[viewMode]})`}
              style={{
                fontFamily: 'var(--font-cond)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--blue)',
                background: 'var(--blue-dim)',
                padding: '1px 6px',
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                lineHeight: 1.6,
                marginTop: 2,
              }}
            >
              {VIEW_MODE_LABELS[viewMode]}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
