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

// --theme-* variables are the white-label layer for future division theming.
// Interiors canonical values must always match globals.css.
// globals.css is the source of truth. --theme-* are the Tailwind-accessible fallbacks.
// Rule: never change these defaults without updating globals.css first.
// Rule: do not add new --theme-* variables without a confirmed division use case.
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
 * Default Hooomz theme — monochrome base with warm grey accent.
 *
 * Rules:
 * - 90% monochrome, 10% accent
 * - Accent is for INTERACTION (buttons, links, selected states)
 * - Status colors are for INFORMATION (health dots, progress bars)
 * - They never compete — different jobs
 * - Max 2-3 accent elements per screen
 */
export const defaultTheme: HooomzTheme = {
  logo: '/hooomz-logo.svg',
  companyName: 'Hooomz',
  fontFamily: 'var(--font-body)',
  fontFamilyMono: 'var(--font-mono)',
  primary: 'var(--charcoal)',
  secondary: 'var(--mid)',
  muted: 'var(--muted)',
  textBody: 'var(--mid)',
  background: 'var(--bg)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  accent: 'var(--accent)',
  accentDark: 'var(--accent)',
  accentLight: 'var(--accent-bg)',
  statusGreen: 'var(--green)',
  statusBlue: 'var(--blue)',
  statusAmber: 'var(--yellow)',
  statusRed: 'var(--red)',
  statusGray: 'var(--muted)',
  borderRadius: 'var(--radius)',
  cardShadow: 'var(--shadow-card)',
};

/**
 * Get health/score color from a 0-100 score.
 * Uses status colors — never accent.
 */
export function getScoreColor(score: number, _theme: HooomzTheme = defaultTheme): string {
  if (score >= 90) return 'var(--green)';  // Green
  if (score >= 70) return 'var(--blue)';  // Blue
  if (score >= 50) return 'var(--yellow)';  // Amber
  if (score >= 30) return 'var(--yellow)';  // Orange
  return 'var(--red)';                    // Red
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
