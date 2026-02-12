'use client';

/**
 * Dashboard Data Hook — aggregates data from multiple sources for the manager dashboard.
 * Composes existing hooks + direct service queries. No new stores or services.
 */

import { useQuery } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { useLocalBusinessHealth, useLocalRecentActivity, useIntakeDrafts } from './useLocalData';
import { useOverBudgetTasks, useTrainingRecords, useActiveCrewMembers } from './useCrewData';
import type { TaskBudget, TrainingRecord, ChangeOrder, CrewMember } from '@hooomz/shared-contracts';

// ============================================================================
// Types
// ============================================================================

export interface ActiveProjectSummary {
  id: string;
  name: string;
  status: string;
  healthScore: number;
  taskCount: number;
  completedCount: number;
  nextTask?: string;
}

export interface DashboardData {
  // Summary cards
  healthScore: number;
  activeProjectCount: number;   // in-progress + approved only
  pipelineCount: number;        // lead + quoted
  blockedCount: number;
  tasksDue: number;             // total incomplete tasks across active projects
  blockedTaskCount: number;

  // Projects
  activeProjects: ActiveProjectSummary[];

  // Needs attention
  overBudgetTasks: TaskBudget[];
  readyForReview: TrainingRecord[];
  pendingChangeOrders: ChangeOrder[];

  // Crew
  crewMembers: CrewMember[];

  // Activity
  recentEvents: Array<Record<string, unknown>>;

  // Intake drafts
  draftCount: number;

  // State
  isLoading: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useDashboardData(): DashboardData {
  const { services, isLoading: servicesLoading } = useServicesContext();

  // Core business health (already aggregates projects + tasks)
  const health = useLocalBusinessHealth();

  // Over-budget tasks (global query)
  const { data: overBudgetRaw = [] } = useOverBudgetTasks();

  // Training records (global query, filter for review_ready)
  const { data: trainingRaw = [] } = useTrainingRecords();

  // Active crew members
  const { data: crewRaw = [] } = useActiveCrewMembers();

  // Recent activity
  const { data: activityData } = useLocalRecentActivity(10);

  // Intake drafts
  const { data: drafts = [] } = useIntakeDrafts();

  // Pending change orders — iterate over active projects
  const projectIds = health.projects.map((p) => p.id);
  const { data: pendingCOs = [] } = useQuery({
    queryKey: ['dashboard', 'pendingChangeOrders', ...projectIds],
    queryFn: async () => {
      if (!services) return [];
      const allCOs: ChangeOrder[] = [];
      for (const pid of projectIds) {
        try {
          const cos = await services.integration.changeOrders.getByProject(pid);
          allCOs.push(...cos);
        } catch {
          // Skip projects with no COs
        }
      }
      return allCOs.filter(
        (co) => co.status === 'pending_approval'
      );
    },
    enabled: !servicesLoading && !!services && projectIds.length > 0,
    staleTime: 10_000,
  });

  // Derive computed values
  const activeProjects = health.projects
    .filter((p) => p.status === 'in-progress' || p.status === 'approved')
    .map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      healthScore: p.health_score ?? 0,
      taskCount: p.taskCount,
      completedCount: p.completedCount,
      nextTask: p.nextTask,
    }));

  const pipelineProjects = health.projects.filter(
    (p) => p.status === 'lead' || p.status === 'quoted'
  );

  const tasksDue = activeProjects.reduce(
    (sum, p) => sum + (p.taskCount - p.completedCount),
    0
  );

  const readyForReview = trainingRaw.filter(
    (t) => t.status === 'review_ready'
  );

  return {
    healthScore: health.healthScore,
    activeProjectCount: activeProjects.length,
    pipelineCount: pipelineProjects.length,
    blockedCount: health.blockedCount,
    tasksDue,
    blockedTaskCount: 0, // TODO: would need per-task status tracking

    activeProjects,

    overBudgetTasks: overBudgetRaw,
    readyForReview,
    pendingChangeOrders: pendingCOs,

    crewMembers: crewRaw,

    recentEvents: (activityData?.events as unknown as Array<Record<string, unknown>>) ?? [],

    draftCount: drafts.length,

    isLoading: health.isLoading,
  };
}
