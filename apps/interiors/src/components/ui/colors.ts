import type { LoopStatus } from '../../types/database';

/**
 * Status Colors — Use EXACTLY these values
 * From CLAUDE.md locked decisions
 */
export const statusColors: Record<LoopStatus, string> = {
  not_started: '#9CA3AF',  // Grey
  in_progress: '#3B82F6',  // Blue
  blocked: '#EF4444',      // Red
  complete: '#10B981',     // Green
};

/**
 * Status labels for display — single source of truth
 */
export const statusLabels: Record<LoopStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  complete: 'Complete',
};

/**
 * Status options for dropdowns/selectors
 */
export const STATUS_OPTIONS: { value: LoopStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
];

/**
 * Score-to-Color mapping for spheres
 * From CLAUDE.md locked decisions
 */
export const scoreToColor = (score: number): string => {
  if (score >= 90) return '#10B981';  // Green
  if (score >= 70) return '#14B8A6';  // Teal
  if (score >= 50) return '#F59E0B';  // Amber
  if (score >= 30) return '#F97316';  // Orange
  return '#EF4444';                    // Red
};

/**
 * Get glow intensity based on score
 */
export const scoreToGlowIntensity = (score: number): 'strong' | 'medium' | 'low' | 'pulsing' => {
  if (score >= 90) return 'strong';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'low';
  return 'pulsing';
};
