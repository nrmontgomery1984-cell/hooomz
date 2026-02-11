/**
 * Hooomz Theme Configuration
 *
 * White-label theming system. Every component references theme tokens,
 * not hardcoded hex values. This is the licensing play — any contractor
 * using Hooomz OS customizes their brand in 60 seconds.
 *
 * Status colors are LOCKED (semantic). Brand colors, accent, font, logo
 * are customizable per organization.
 */

export interface HooomzTheme {
  logo: string;
  companyName: string;
  fontFamily: string;
  fontFamilyMono: string;
  primary: string;
  secondary: string;
  muted: string;
  textBody: string;
  background: string;
  surface: string;
  border: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  statusGreen: string;
  statusBlue: string;
  statusAmber: string;
  statusRed: string;
  statusGray: string;
  borderRadius: string;
  cardShadow: string;
}

/**
 * Default Hooomz theme — monochrome base with deep teal accent.
 *
 * Rules:
 * - 90% monochrome, 10% accent
 * - Teal is for INTERACTION (buttons, links, selected states)
 * - Status colors are for INFORMATION (health dots, progress bars)
 * - They never compete — different jobs
 * - Max 2-3 teal elements per screen
 */
export const defaultTheme: HooomzTheme = {
  logo: '/hooomz-logo.svg',
  companyName: 'Hooomz',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
  primary: '#111827',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  textBody: '#374151',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  accent: '#0F766E',
  accentDark: '#0D5F58',
  accentLight: '#F0FDFA',
  statusGreen: '#10B981',
  statusBlue: '#3B82F6',
  statusAmber: '#F59E0B',
  statusRed: '#EF4444',
  statusGray: '#9CA3AF',
  borderRadius: '12px',
  cardShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
};

/**
 * Get health/score color from a 0-100 score.
 * Uses status colors — never accent.
 */
export function getScoreColor(score: number, _theme: HooomzTheme = defaultTheme): string {
  if (score >= 90) return '#10B981';  // Green
  if (score >= 70) return '#14B8A6';  // Teal
  if (score >= 50) return '#F59E0B';  // Amber
  if (score >= 30) return '#F97316';  // Orange
  return '#EF4444';                    // Red
}

/**
 * Get status color from a status string.
 */
export function getStatusColor(
  status: 'not_started' | 'in_progress' | 'blocked' | 'complete',
  theme: HooomzTheme = defaultTheme
): string {
  switch (status) {
    case 'complete': return theme.statusGreen;
    case 'in_progress': return theme.statusBlue;
    case 'blocked': return theme.statusRed;
    case 'not_started':
    default: return theme.statusGray;
  }
}

/**
 * Convert theme to CSS custom properties for injection into :root.
 */
export function themeToCSSProperties(theme: HooomzTheme): Record<string, string> {
  return {
    '--theme-primary': theme.primary,
    '--theme-secondary': theme.secondary,
    '--theme-muted': theme.muted,
    '--theme-text-body': theme.textBody,
    '--theme-background': theme.background,
    '--theme-surface': theme.surface,
    '--theme-border': theme.border,
    '--theme-accent': theme.accent,
    '--theme-accent-dark': theme.accentDark,
    '--theme-accent-light': theme.accentLight,
    '--theme-status-green': theme.statusGreen,
    '--theme-status-blue': theme.statusBlue,
    '--theme-status-amber': theme.statusAmber,
    '--theme-status-red': theme.statusRed,
    '--theme-status-gray': theme.statusGray,
    '--theme-radius': theme.borderRadius,
    '--theme-card-shadow': theme.cardShadow,
    '--theme-font': theme.fontFamily,
    '--theme-font-mono': theme.fontFamilyMono,
  };
}
