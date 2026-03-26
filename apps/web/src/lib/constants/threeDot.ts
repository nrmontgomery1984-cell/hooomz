/**
 * Three-Dot Health System — Constants & Utilities
 *
 * Green / Yellow / Red dot system for job health.
 * Thresholds: Green ≥ 70, Yellow ≥ 40, Red < 40
 */

// ============================================================================
// Types
// ============================================================================

export type ThreeDotColor = 'green' | 'yellow' | 'red';

export interface JobHealthResult {
  score: number;           // 0-100
  color: ThreeDotColor;
  hex: string;
  label: string;           // "On Track" | "At Risk" | "Critical"
  completionPct: number;   // task completion %
  budgetPct: number;       // budget health %
  blockerPenalty: number;  // points deducted for blockers
}

// ============================================================================
// Constants
// ============================================================================

export const THREE_DOT_HEX = {
  green:  'var(--green)',
  yellow: 'var(--yellow)',
  red:    'var(--red)',
} as const;

export const THREE_DOT_LABELS: Record<ThreeDotColor, string> = {
  green:  'On Track',
  yellow: 'At Risk',
  red:    'Critical',
};

// ============================================================================
// Utilities
// ============================================================================

/** Map a 0-100 score to a Three-Dot color. */
export function scoreToThreeDot(score: number): ThreeDotColor {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

/** Map a 0-100 score to a hex color string. */
export function threeDotHex(score: number): string {
  return THREE_DOT_HEX[scoreToThreeDot(score)];
}
