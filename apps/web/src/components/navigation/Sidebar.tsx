'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Grid3X3,
  FileCheck,
  UsersRound,
  BarChart3,
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
import type { ViewMode, SidebarSection } from '@/lib/viewmode';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';

// ============================================================================
// Icon Map
// ============================================================================

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
  Settings,
  Grid3X3,
  FileCheck,
  UsersRound,
  BarChart3,
};

// ============================================================================
// Constants
// ============================================================================

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 56;
const STORAGE_KEY_COLLAPSED = 'hooomz_sidebar_collapsed';
const STORAGE_KEY_SECTIONS = 'hooomz_sidebar_sections';
const MODE_CYCLE: ViewMode[] = ['manager', 'operator', 'installer', 'homeowner'];
const hiddenPaths = ['/intake', '/portal'];

const DEFAULT_SECTION_STATE: Record<string, boolean> = {
  work: true,
  standards: false,
  labs: false,
  finance: false,
  admin: false,
};

// ============================================================================
// Helpers
// ============================================================================

function loadCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_COLLAPSED) === 'true';
  } catch {
    return false;
  }
}

function loadSectionState(): Record<string, boolean> {
  if (typeof window === 'undefined') return DEFAULT_SECTION_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SECTIONS);
    if (raw) return { ...DEFAULT_SECTION_STATE, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_SECTION_STATE;
}

function isItemActive(pathname: string | null, href: string, exactMatch?: boolean): boolean {
  if (!pathname) return false;
  if (exactMatch || href === '/') return pathname === href;
  return pathname.startsWith(href);
}

function sectionContainsActive(section: SidebarSection, pathname: string | null): boolean {
  if (!pathname) return false;
  return section.items.some((item) => isItemActive(pathname, item.href, item.exactMatch));
}

// ============================================================================
// Sidebar Component
// ============================================================================

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useViewMode();
  const { data: projectsResult } = useLocalProjects();
  const { crewMemberName } = useActiveCrew();
  const { isDark, toggle: toggleDark } = useDarkMode();

  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [sectionStates, setSectionStates] = useState(loadSectionState);

  // Persist collapsed state
  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY_COLLAPSED, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Persist section states
  const toggleSection = useCallback((sectionId: string) => {
    setSectionStates((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try { localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Homeowner mode: redirect to portal
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

  if (hiddenPaths.some((path) => pathname?.startsWith(path))) return null;
  if (viewMode === 'homeowner') return null;

  const initials = crewMemberName
    ? crewMemberName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'NM';

  const cycleMode = () => {
    const idx = MODE_CYCLE.indexOf(viewMode);
    const next = MODE_CYCLE[(idx + 1) % MODE_CYCLE.length];
    setViewMode(next);
  };

  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const handleSectionDotClick = (section: SidebarSection) => {
    if (collapsed) {
      setCollapsed(false);
      try { localStorage.setItem(STORAGE_KEY_COLLAPSED, 'false'); } catch { /* ignore */ }
      setSectionStates((prev) => {
        const next = { ...prev, [section.id]: true };
        try { localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
      router.push(section.dashboardHref);
    } else {
      toggleSection(section.id);
      router.push(section.dashboardHref);
    }
  };

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen"
      style={{
        width,
        minWidth: width,
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        overflow: 'hidden',
        transition: 'width 0.2s ease, min-width 0.2s ease',
      }}
    >
      {/* Logo + Toggle */}
      <div
        style={{
          borderBottom: '1px solid var(--sidebar-border)',
          padding: collapsed ? '16px 0' : '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          height: 56,
          flexShrink: 0,
        }}
      >
        <div style={{ overflow: 'hidden', flexShrink: 0 }}>
          <HooomzLogoMark />
        </div>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            title="Collapse sidebar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--sidebar-muted)',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Command Centre — always visible */}
      <div style={{ padding: collapsed ? '8px 0' : '8px', flexShrink: 0 }}>
        <Link
          href="/"
          title={collapsed ? 'Command Centre' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: collapsed ? '8px 0' : '8px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 6,
            background: pathname === '/' ? 'var(--sidebar-active)' : 'transparent',
            color: pathname === '/' ? 'var(--text)' : 'var(--sidebar-muted)',
            textDecoration: 'none',
            transition: 'background 0.15s, color 0.15s',
            minHeight: 40,
          }}
        >
          <Grid3X3 size={18} strokeWidth={pathname === '/' ? 2 : 1.5} style={{ flexShrink: 0 }} />
          {!collapsed && (
            <span style={{
              fontFamily: 'var(--font-cond)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}>
              Command Centre
            </span>
          )}
        </Link>
      </div>

      <div style={{ height: 1, background: 'var(--sidebar-border)', margin: '0 12px', flexShrink: 0 }} />

      {/* Nav Sections */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {SIDEBAR_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.allowedModes.includes(viewMode)
          );
          if (visibleItems.length === 0) return null;

          const isOpen = sectionStates[section.id] ?? false;
          const hasActive = sectionContainsActive(section, pathname);

          return (
            <SidebarSectionGroup
              key={section.id}
              section={section}
              visibleItems={visibleItems}
              isOpen={isOpen}
              hasActive={hasActive}
              collapsed={collapsed}
              pathname={pathname}
              onToggle={() => toggleSection(section.id)}
              onDotClick={() => handleSectionDotClick(section)}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--sidebar-border)', padding: collapsed ? '8px 4px' : '12px', flexShrink: 0 }}>
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          title={collapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: collapsed ? '8px 0' : '8px 4px',
            justifyContent: collapsed ? 'center' : 'flex-start',
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
          {!collapsed && (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500 }}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Crew + View mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div
            title={collapsed ? (crewMemberName || 'Nathan M.') : undefined}
            style={{
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
            }}
          >
            {initials}
          </div>
          {!collapsed && (
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
          )}
        </div>

        {/* Expand button (only when collapsed) */}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            title="Expand sidebar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginTop: 8,
              padding: '6px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--sidebar-muted)',
            }}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}

// ============================================================================
// Section Group
// ============================================================================

interface SidebarSectionGroupProps {
  section: SidebarSection;
  visibleItems: SidebarSection['items'];
  isOpen: boolean;
  hasActive: boolean;
  collapsed: boolean;
  pathname: string | null;
  onToggle: () => void;
  onDotClick: () => void;
}

function SidebarSectionGroup({
  section,
  visibleItems,
  isOpen,
  hasActive,
  collapsed,
  pathname,
  onToggle,
  onDotClick,
}: SidebarSectionGroupProps) {
  if (collapsed) {
    // Collapsed: show colored dot + first icon only
    return (
      <div style={{ padding: '6px 0' }}>
        <button
          onClick={onDotClick}
          title={section.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '8px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: section.color,
              boxShadow: hasActive ? `0 0 6px ${section.color}` : 'none',
              transition: 'box-shadow 0.3s',
            }}
          />
        </button>
        {/* Show icons for each item when collapsed */}
        {visibleItems.map((item) => {
          const active = isItemActive(pathname, item.href, item.exactMatch);
          const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '6px 0',
                color: active ? section.color : 'var(--sidebar-muted)',
                textDecoration: 'none',
                transition: 'color 0.15s',
                minHeight: 36,
              }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
            </Link>
          );
        })}
      </div>
    );
  }

  // Expanded: section header + collapsible items
  return (
    <div style={{ padding: '4px 0' }}>
      {/* Section header */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          minHeight: 32,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: section.color,
            flexShrink: 0,
            boxShadow: hasActive ? `0 0 6px ${section.color}` : 'none',
            transition: 'box-shadow 0.3s',
          }}
        />
        <span style={{
          fontFamily: 'var(--font-cond)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: hasActive ? section.color : 'var(--sidebar-muted)',
          flex: 1,
          textAlign: 'left',
          transition: 'color 0.15s',
        }}>
          {section.label}
        </span>
        <ChevronDown
          size={12}
          style={{
            color: 'var(--sidebar-muted)',
            flexShrink: 0,
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Section items — animated collapse */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? visibleItems.length * 44 : 0,
          opacity: isOpen ? 1 : 0,
          transition: 'max-height 0.25s ease, opacity 0.2s ease',
        }}
      >
        {visibleItems.map((item) => {
          const active = isItemActive(pathname, item.href, item.exactMatch);
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
                padding: '7px 12px 7px 28px',
                borderLeft: active ? `3px solid ${section.color}` : '3px solid transparent',
                background: active ? `${section.color}10` : 'transparent',
                color: active ? section.color : 'var(--sidebar-muted)',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
                minHeight: 38,
              }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} style={{ flexShrink: 0 }} />
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
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
    </div>
  );
}
