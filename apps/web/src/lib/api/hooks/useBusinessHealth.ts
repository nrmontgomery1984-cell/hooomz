'use client';

/**
 * Business Health Hook
 * Calculates overall business health from active projects
 *
 * This powers the main sphere on the dashboard:
 * - Health score is average of all active project health scores
 * - Shows at-a-glance business status
 */

import { useProjects } from './useProjects';

/**
 * Project status values considered "active"
 * These projects contribute to the business health calculation
 */
const ACTIVE_STATUSES = ['in_progress', 'active', 'approved'] as const;

/**
 * Project status indicating work is blocked
 */
const BLOCKED_STATUS = 'blocked' as const;

/**
 * Business health summary
 */
export interface BusinessHealthData {
  /** Overall health score 0-100 (average of active project scores) */
  healthScore: number;
  /** Number of projects currently in progress */
  activeProjectCount: number;
  /** Number of projects with blocked status */
  blockedCount: number;
  /** List of active projects for drilling down */
  projects: Array<{
    id: string;
    name: string;
    status: string;
    health_score?: number;
  }>;
  /** Loading state from underlying query */
  isLoading: boolean;
}

/**
 * Calculate business health from active projects
 *
 * The health score is the sphere number displayed on the main dashboard.
 * It represents overall business health based on active project performance.
 *
 * Calculation:
 * - Filter to only active projects (in_progress, active, approved)
 * - Average the health_score of each project
 * - Default to 75 if a project has no score
 * - Return 0 if no active projects
 */
export function useBusinessHealth(): BusinessHealthData {
  const { data, isLoading } = useProjects();

  // Handle loading and no data states
  if (isLoading || !data) {
    return {
      healthScore: 0,
      activeProjectCount: 0,
      blockedCount: 0,
      projects: [],
      isLoading,
    };
  }

  // Extract projects from response (handle both array and object response)
  const projectList = Array.isArray(data) ? data : data.projects || [];

  // Filter to active projects
  const activeProjects = projectList.filter((p) =>
    ACTIVE_STATUSES.includes(p.status as (typeof ACTIVE_STATUSES)[number])
  );

  // Calculate average health score
  const healthScore =
    activeProjects.length > 0
      ? Math.round(
          activeProjects.reduce(
            (sum, p) => sum + ((p as { health_score?: number }).health_score || 75),
            0
          ) / activeProjects.length
        )
      : 0;

  // Count blocked projects
  const blockedCount = activeProjects.filter(
    (p) => p.status === BLOCKED_STATUS
  ).length;

  return {
    healthScore,
    activeProjectCount: activeProjects.length,
    blockedCount,
    projects: activeProjects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      health_score: (p as { health_score?: number }).health_score,
    })),
    isLoading,
  };
}

/**
 * Get health color based on score
 * Used for sphere coloring and status indicators
 */
export function getHealthColor(score: number): string {
  if (score >= 70) return 'var(--theme-status-green, #10b981)';
  if (score >= 40) return 'var(--theme-status-amber, #f59e0b)';
  return 'var(--theme-status-red, #ef4444)';
}

/**
 * Get health status label
 */
export function getHealthStatus(score: number): 'healthy' | 'attention' | 'critical' {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'attention';
  return 'critical';
}
