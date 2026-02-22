'use client';

/**
 * Labour Estimation Hooks
 *
 * React Query hooks for the Labour Estimation Engine.
 * Provides config management, estimate previews, task estimates,
 * project variance summaries, and crew variance history.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { EstimateParams, SkillRateConfig } from '../types/labourEstimation.types';

// ============================================================================
// Query Keys
// ============================================================================

export const LABOUR_QUERY_KEYS = {
  all: ['labour'] as const,
  config: ['labour', 'config'] as const,
  estimatePreview: (params: EstimateParams | null) =>
    ['labour', 'estimatePreview', params] as const,
  taskEstimate: (deployedTaskId: string) =>
    ['labour', 'taskEstimate', deployedTaskId] as const,
  projectVariance: (projectId: string) =>
    ['labour', 'projectVariance', projectId] as const,
  crewVariance: (crewMemberId: string) =>
    ['labour', 'crewVariance', crewMemberId] as const,
};

// ============================================================================
// Config Hooks
// ============================================================================

/**
 * Read the skill rate config (for settings UI and estimate previews).
 * Always returns a config (seeds defaults if empty).
 */
export function useSkillRateConfig() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LABOUR_QUERY_KEYS.config,
    queryFn: () => services!.skillRateConfig.get(),
    enabled: !servicesLoading && !!services,
    staleTime: 60_000,
  });
}

/**
 * Update skill rate config (triggers recalculation prompt).
 */
export function useUpdateSkillRateConfig() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Omit<SkillRateConfig, 'id'>>) =>
      services!.skillRateConfig.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABOUR_QUERY_KEYS.config });
      queryClient.invalidateQueries({ queryKey: LABOUR_QUERY_KEYS.all });

      // Log activity event
      services!.activity.logLabourEvent(
        'labour.config_updated',
        'org_level',
        'singleton',
        {},
      ).catch((err) => console.error('Failed to log config update:', err));
    },
  });
}

// ============================================================================
// Estimate Hooks
// ============================================================================

/**
 * Calculate estimate on the fly (for preview in blueprint editor).
 * Does NOT save — pure calculation for display.
 */
export function useEstimatePreview(params: EstimateParams | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LABOUR_QUERY_KEYS.estimatePreview(params),
    queryFn: () => services!.labourEstimation.calculateTaskEstimate(params!),
    enabled: !servicesLoading && !!services && !!params && params.quantity > 0 && params.catalogueSellRate > 0,
    staleTime: 30_000,
  });
}

/**
 * Apply estimate to a deployed task (persist).
 */
export function useApplyTaskEstimate() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deployedTaskId, params }: { deployedTaskId: string; params: EstimateParams }) =>
      services!.labourEstimation.applyEstimateToTask(deployedTaskId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABOUR_QUERY_KEYS.all });
    },
  });
}

/**
 * Assign crew to a deployed task.
 */
export function useAssignCrewToTask() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deployedTaskId, crewMemberId }: { deployedTaskId: string; crewMemberId: string }) =>
      services!.labourEstimation.assignCrew(deployedTaskId, crewMemberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABOUR_QUERY_KEYS.all });
    },
  });
}

/**
 * Record actual hours on task completion.
 */
export function useRecordActualHours() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deployedTaskId, actualHours }: { deployedTaskId: string; actualHours: number }) =>
      services!.labourEstimation.recordActualHours(deployedTaskId, actualHours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABOUR_QUERY_KEYS.all });
    },
  });
}

// ============================================================================
// Read Hooks
// ============================================================================

/**
 * Get a deployed task's labour estimate and actual data.
 */
export function useTaskLabourEstimate(deployedTaskId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LABOUR_QUERY_KEYS.taskEstimate(deployedTaskId ?? ''),
    queryFn: () => services!.labourEstimation.getDeployedTaskLabourData(deployedTaskId!),
    enabled: !servicesLoading && !!services && !!deployedTaskId,
    staleTime: 10_000,
  });
}

/**
 * Get project variance summary (for finance dashboard).
 */
export function useProjectVarianceSummary(projectId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LABOUR_QUERY_KEYS.projectVariance(projectId ?? ''),
    queryFn: () => services!.labourEstimation.getProjectVarianceSummary(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 10_000,
  });
}

/**
 * Get crew variance history (for crew performance view).
 */
export function useCrewVarianceHistory(crewMemberId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LABOUR_QUERY_KEYS.crewVariance(crewMemberId ?? ''),
    queryFn: () => services!.labourEstimation.getCrewVarianceHistory(crewMemberId!),
    enabled: !servicesLoading && !!services && !!crewMemberId,
    staleTime: 10_000,
  });
}

/**
 * Recalculate all open estimates for a project.
 */
export function useRecalculateProjectEstimates() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      services!.labourEstimation.recalculateProjectEstimates(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABOUR_QUERY_KEYS.all });
    },
  });
}
