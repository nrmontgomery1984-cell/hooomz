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
  activePaths?: string[]; // Additional path prefixes that trigger the active state
}

export interface SidebarSection {
  id: string;
  label: string;
  color: string;
  dashboardHref: string;
  items: SidebarNavItem[];
}

export const SECTION_COLORS: Record<string, string> = {
  sales: 'var(--blue)',
  production: 'var(--blue)',
  finance: 'var(--yellow)',
  standards: 'var(--green)',
  labs: 'var(--violet)',
  admin: 'var(--muted)',
  customers: 'var(--accent)',
  // Legacy aliases
  work: 'var(--blue)',
};

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'sales',
    label: 'SALES',
    color: SECTION_COLORS.sales,
    dashboardHref: '/sales',
    items: [
      { href: '/sales', label: 'Sales Dashboard', iconName: 'LayoutDashboard', allowedModes: ['manager', 'operator'], exactMatch: true, isDashboard: true },
      { href: '/leads', label: 'Leads', iconName: 'Users', allowedModes: ['manager', 'operator'] },
      { href: '/sales/estimates', label: 'Estimates', iconName: 'Calculator', allowedModes: ['manager'] },
      { href: '/sales/consultations', label: 'Consultations', iconName: 'ClipboardList', allowedModes: ['manager', 'operator'] },
      { href: '/sales/quotes', label: 'Quotes', iconName: 'FileText', allowedModes: ['manager'] },
    ],
  },
  {
    id: 'production',
    label: 'PRODUCTION',
    color: SECTION_COLORS.production,
    dashboardHref: '/production',
    items: [
      { href: '/production', label: 'Production Dashboard', iconName: 'HardHat', allowedModes: ['manager', 'operator', 'installer'], exactMatch: true, isDashboard: true },
      { href: '/production/jobs', label: 'Jobs', iconName: 'FolderOpen', allowedModes: ['manager', 'operator'], activePaths: ['/projects'] },
      { href: '/production/schedule', label: 'Schedule', iconName: 'Calendar', allowedModes: ['manager', 'operator'] },
      { href: '/production/crew', label: 'Crew', iconName: 'HardHat', allowedModes: ['manager', 'operator'] },
      { href: '/production/change-orders', label: 'Change Orders', iconName: 'FileDiff', allowedModes: ['manager'] },
      { href: '/activity', label: 'Activity Log', iconName: 'Activity', allowedModes: ['manager', 'operator', 'installer'] },
    ],
  },
  {
    id: 'finance',
    label: 'FINANCE',
    color: SECTION_COLORS.finance,
    dashboardHref: '/finance',
    items: [
      { href: '/finance', label: 'Finance Dashboard', iconName: 'TrendingUp', allowedModes: ['manager'], exactMatch: true, isDashboard: true },
      { href: '/finance/invoices', label: 'Invoices', iconName: 'Receipt', allowedModes: ['manager'] },
      { href: '/finance/cost-catalogue', label: 'Cost Catalogue', iconName: 'DollarSign', allowedModes: ['manager'] },
      { href: '/finance/forecast', label: 'Forecast', iconName: 'BarChart3', allowedModes: ['manager'] },
    ],
  },
  {
    id: 'standards',
    label: 'STANDARDS',
    color: SECTION_COLORS.standards,
    dashboardHref: '/standards',
    items: [
      { href: '/standards', label: 'Standards Dashboard', iconName: 'BookOpen', allowedModes: ['manager', 'operator'], exactMatch: true, isDashboard: true },
      { href: '/standards/sops', label: 'SOPs', iconName: 'FileCheck', allowedModes: ['manager', 'operator'] },
      { href: '/standards/training', label: 'Training', iconName: 'GraduationCap', allowedModes: ['manager', 'operator'] },
      { href: '/standards/knowledge', label: 'Knowledge Base', iconName: 'Lightbulb', allowedModes: ['manager', 'operator'] },
      { href: '/standards/risk-register', label: 'Risk Register', iconName: 'ShieldAlert', allowedModes: ['manager', 'operator'] },
    ],
  },
  {
    id: 'labs',
    label: 'LABS',
    color: SECTION_COLORS.labs,
    dashboardHref: '/labs',
    items: [
      { href: '/labs', label: 'Labs Dashboard', iconName: 'FlaskConical', allowedModes: ['manager', 'operator'], exactMatch: true, isDashboard: true },
      { href: '/labs/observations', label: 'Observations', iconName: 'Eye', allowedModes: ['manager', 'operator'] },
      { href: '/labs/tests', label: 'Tests', iconName: 'TestTube2', allowedModes: ['manager', 'operator'] },
      { href: '/labs/voting', label: 'Voting', iconName: 'Vote', allowedModes: ['manager', 'operator'] },
      { href: '/labs/tokens', label: 'Tokens', iconName: 'Tag', allowedModes: ['manager', 'operator'] },
      { href: '/labs/catalogs', label: 'Catalogs', iconName: 'Package', allowedModes: ['manager', 'operator'] },
      { href: '/labs/knowledge', label: 'Knowledge', iconName: 'Lightbulb', allowedModes: ['manager', 'operator'] },
    ],
  },
  {
    id: 'admin',
    label: 'ADMIN',
    color: SECTION_COLORS.admin,
    dashboardHref: '/admin',
    items: [
      { href: '/admin', label: 'Admin Dashboard', iconName: 'Settings', allowedModes: ['manager'], exactMatch: true, isDashboard: true },
      { href: '/profile', label: 'Profile', iconName: 'User', allowedModes: ['manager'] },
      { href: '/admin/crew', label: 'Crew', iconName: 'UsersRound', allowedModes: ['manager'] },
      { href: '/admin/rates', label: 'Rates', iconName: 'DollarSign', allowedModes: ['manager'] },
      { href: '/admin/settings', label: 'Settings', iconName: 'Settings', allowedModes: ['manager'] },
    ],
  },
  {
    id: 'customers',
    label: 'CUSTOMERS',
    color: SECTION_COLORS.customers,
    dashboardHref: '/customers',
    items: [
      { href: '/customers', label: 'Customer List', iconName: 'Contact', allowedModes: ['manager', 'operator'], isDashboard: true },
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
  { href: '/sales', label: 'Sales', iconName: 'Users', allowedModes: ['manager', 'operator'] },
  // Center "+" handled separately
  { href: '/production', label: 'Production', iconName: 'HardHat', allowedModes: ['manager', 'operator', 'installer'] },
  { href: '/finance', label: 'Finance', iconName: 'TrendingUp', allowedModes: ['manager'] },
  { href: '/labs', label: 'Labs', iconName: 'FlaskConical', allowedModes: ['manager', 'operator'] },
  { href: '/customers', label: 'Admin', iconName: 'Settings', allowedModes: ['manager'] },
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
