/**
 * View Mode — types, permissions, and navigation config
 *
 * Pure data module (no React). Centralizes all role-based visibility rules.
 * This is a testing/development tool — not production auth.
 */

// ============================================================================
// Core Types
// ============================================================================

export type ViewMode = 'manager' | 'operator' | 'installer' | 'homeowner';

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  manager: 'Manager',
  operator: 'Operator',
  installer: 'Installer',
  homeowner: 'Homeowner',
};

export const VIEW_MODE_STORAGE_KEY = 'hooomz-view-mode';
export const DEFAULT_VIEW_MODE: ViewMode = 'manager';

// ============================================================================
// Sidebar Sections
// ============================================================================

export interface SidebarNavItem {
  href: string;
  label: string;
  iconName: string;
  allowedModes: ViewMode[];
  exactMatch?: boolean;
  isDashboard?: boolean;
}

export interface SidebarSection {
  id: string;
  label: string;
  color: string;
  dashboardHref: string;
  items: SidebarNavItem[];
}

export const SECTION_COLORS: Record<string, string> = {
  work: '#3b82f6',
  standards: '#10b981',
  labs: '#a855f7',
  finance: '#f59e0b',
  admin: '#64748b',
};

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'work',
    label: 'WORK',
    color: SECTION_COLORS.work,
    dashboardHref: '/work',
    items: [
      { href: '/work', label: 'Work Dashboard', iconName: 'LayoutDashboard', allowedModes: ['manager', 'operator', 'installer'], exactMatch: true, isDashboard: true },
      { href: '/leads', label: 'Leads', iconName: 'Users', allowedModes: ['manager'] },
      { href: '/estimates', label: 'Estimates', iconName: 'Calculator', allowedModes: ['manager'] },
      { href: '/projects', label: 'Projects', iconName: 'FolderOpen', allowedModes: ['manager', 'operator'] },
      { href: '/schedule', label: 'Schedule', iconName: 'Calendar', allowedModes: ['manager', 'operator'] },
      { href: '/activity', label: 'Activity', iconName: 'Activity', allowedModes: ['manager', 'operator'] },
    ],
  },
  {
    id: 'standards',
    label: 'STANDARDS',
    color: SECTION_COLORS.standards,
    dashboardHref: '/standards',
    items: [
      { href: '/standards', label: 'Standards Dashboard', iconName: 'BookOpen', allowedModes: ['manager', 'operator'], exactMatch: true, isDashboard: true },
      { href: '/labs/sops', label: 'SOPs', iconName: 'FileCheck', allowedModes: ['manager', 'operator'] },
      { href: '/labs/training', label: 'Training', iconName: 'GraduationCap', allowedModes: ['manager', 'operator'] },
      { href: '/labs/knowledge', label: 'Knowledge', iconName: 'Lightbulb', allowedModes: ['manager', 'operator'] },
    ],
  },
  {
    id: 'labs',
    label: 'LABS',
    color: SECTION_COLORS.labs,
    dashboardHref: '/labs',
    items: [
      { href: '/labs', label: 'Labs Dashboard', iconName: 'FlaskConical', allowedModes: ['manager', 'operator'], exactMatch: true, isDashboard: true },
      { href: '/labs/tests', label: 'Tests', iconName: 'TestTube2', allowedModes: ['manager', 'operator'] },
      { href: '/labs/voting', label: 'Voting', iconName: 'Vote', allowedModes: ['manager', 'operator'] },
      { href: '/labs/tokens', label: 'Tokens', iconName: 'Tag', allowedModes: ['manager', 'operator'] },
    ],
  },
  {
    id: 'finance',
    label: 'FINANCE',
    color: SECTION_COLORS.finance,
    dashboardHref: '/finance',
    items: [
      { href: '/finance', label: 'Finance Dashboard', iconName: 'TrendingUp', allowedModes: ['manager'], exactMatch: true, isDashboard: true },
      { href: '/admin/rates', label: 'Cost Catalogue', iconName: 'DollarSign', allowedModes: ['manager'] },
      { href: '/forecast', label: 'Forecast', iconName: 'BarChart3', allowedModes: ['manager'] },
    ],
  },
  {
    id: 'admin',
    label: 'ADMIN',
    color: SECTION_COLORS.admin,
    dashboardHref: '/profile',
    items: [
      { href: '/profile', label: 'Profile', iconName: 'User', allowedModes: ['manager'] },
      { href: '/admin/crew', label: 'Crew', iconName: 'UsersRound', allowedModes: ['manager'] },
      { href: '/admin/settings', label: 'Settings', iconName: 'Settings', allowedModes: ['manager'] },
    ],
  },
];

// ============================================================================
// BottomNav Config
// ============================================================================

export interface BottomNavItem {
  href: string;
  label: string;
  iconName: string;
  allowedModes: ViewMode[];
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: '/', label: 'Home', iconName: 'Home', allowedModes: ['manager', 'operator', 'installer'] },
  { href: '/activity', label: 'Activity', iconName: 'Activity', allowedModes: ['manager', 'operator'] },
  // Center "+" handled separately
  { href: '/forecast', label: 'Forecast', iconName: 'TrendingUp', allowedModes: ['manager'] },
  { href: '/estimates', label: 'Estimates', iconName: 'Calculator', allowedModes: ['manager'] },
  { href: '/labs', label: 'Labs', iconName: 'FlaskConical', allowedModes: ['manager', 'operator'] },
];

// ============================================================================
// QuickAdd Permissions
// ============================================================================

const INSTALLER_QUICK_ADD_IDS = ['done', 'photo', 'note', 'time', 'blocked', 'delivery'];
const OPERATOR_EXCLUDED_QUICK_ADD_IDS = ['receipt'];

export function isQuickAddAllowed(actionId: string, mode: ViewMode): boolean {
  if (mode === 'homeowner') return false;
  if (mode === 'manager') return true;
  if (mode === 'installer') return INSTALLER_QUICK_ADD_IDS.includes(actionId);
  if (mode === 'operator') return !OPERATOR_EXCLUDED_QUICK_ADD_IDS.includes(actionId);
  return true;
}

// ============================================================================
// CTA Button Permissions
// ============================================================================

export function isNewProjectAllowed(mode: ViewMode): boolean {
  return mode === 'manager';
}

export function isQuickAddButtonAllowed(mode: ViewMode): boolean {
  return mode !== 'homeowner';
}
