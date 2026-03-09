'use client';

/**
 * useProductionScore — composes project + tasks + punch count + activity for portal widget.
 */

import { useMemo } from 'react';
import { useLocalProject, useLocalTasks, useLocalProjectActivity } from './useLocalData';
import { usePunchListOpenCount } from './usePunchList';
import { useJobHealth } from './useJobHealth';
import { useChangeOrders } from './useIntegrationData';
import { computeProductionScore } from '../services/productionScore.service';
import type { ProductionScoreResult } from '../services/productionScore.service';

export function useProductionScore(projectId: string): {
  data: ProductionScoreResult | null;
  isLoading: boolean;
} {
  const { data: project, isLoading: projectLoading } = useLocalProject(projectId);
  const { data: tasksData, isLoading: tasksLoading } = useLocalTasks(projectId);
  const { data: punchOpenCount = 0 } = usePunchListOpenCount(projectId);
  const { data: healthResult } = useJobHealth(projectId);
  const { data: changeOrders = [] } = useChangeOrders(projectId);
  const { data: activityData } = useLocalProjectActivity(projectId);

  const tasks = tasksData?.tasks ?? [];

  const data = useMemo(() => {
    if (!project) return null;

    // Calculate last activity age in hours
    const events = activityData?.events ?? [];
    let lastActivityAgeHours = 0;
    if (events.length > 0) {
      const latest = events[0];
      const ts = (latest as unknown as Record<string, unknown>).created_at ?? (latest as unknown as Record<string, unknown>).timestamp;
      if (ts) {
        lastActivityAgeHours = (Date.now() - new Date(String(ts)).getTime()) / (1000 * 60 * 60);
      }
    } else {
      lastActivityAgeHours = 999; // No activity at all
    }

    const pendingCOs = changeOrders.filter((co) => co.status === 'pending_approval');

    return computeProductionScore({
      completedTasks: tasks.filter((t) => t.status === 'complete').length,
      totalTasks: tasks.length,
      openPunchCount: punchOpenCount,
      lastActivityAgeHours,
      pendingDecisionCount: pendingCOs.length,
      currentStage: project.jobStage,
      stageHealthScore: healthResult?.score ?? 100,
    });
  }, [project, tasks, punchOpenCount, healthResult, changeOrders, activityData]);

  return {
    data,
    isLoading: projectLoading || tasksLoading,
  };
}
