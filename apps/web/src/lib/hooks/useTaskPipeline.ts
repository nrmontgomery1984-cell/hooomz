'use client';

/**
 * Task Pipeline Hooks (Build 3b)
 * React Query hooks for blueprint generation and deployment
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { LineItem, ChangeOrderLineItem } from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const PIPELINE_QUERY_KEYS = {
  blueprints: {
    all: ['pipeline', 'blueprints'] as const,
    byProject: (projectId: string) => ['pipeline', 'blueprints', 'project', projectId] as const,
    pending: (projectId: string) => ['pipeline', 'blueprints', 'pending', projectId] as const,
    detail: (id: string) => ['pipeline', 'blueprints', 'detail', id] as const,
  },
  deployedTasks: {
    byTask: (taskId: string) => ['pipeline', 'deployedTasks', 'task', taskId] as const,
    byBlueprint: (blueprintId: string) => ['pipeline', 'deployedTasks', 'blueprint', blueprintId] as const,
  },
};

// ============================================================================
// Blueprint Queries
// ============================================================================

export function useBlueprintsByProject(projectId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: PIPELINE_QUERY_KEYS.blueprints.byProject(projectId),
    queryFn: () => services!.pipeline.getBlueprintsByProject(projectId),
    enabled: !isLoading && !!services && !!projectId,
  });
}

export function usePendingBlueprints(projectId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: PIPELINE_QUERY_KEYS.blueprints.pending(projectId),
    queryFn: () => services!.pipeline.getPendingBlueprints(projectId),
    enabled: !isLoading && !!services && !!projectId,
  });
}

// ============================================================================
// Deployed Task Queries
// ============================================================================

export function useDeployedTaskByTaskId(taskId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: PIPELINE_QUERY_KEYS.deployedTasks.byTask(taskId),
    queryFn: () => services!.pipeline.getDeployedTaskByTaskId(taskId),
    enabled: !isLoading && !!services && !!taskId,
  });
}

export function useDeployedTasksByBlueprint(blueprintId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: PIPELINE_QUERY_KEYS.deployedTasks.byBlueprint(blueprintId),
    queryFn: () => services!.pipeline.getDeployedTasksByBlueprint(blueprintId),
    enabled: !isLoading && !!services && !!blueprintId,
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useGenerateFromEstimate() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, lineItems }: { projectId: string; lineItems: LineItem[] }) =>
      services!.pipeline.generateFromEstimate(projectId, lineItems),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.blueprints.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useGenerateFromChangeOrder() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      changeOrderId,
      coLineItems,
    }: {
      projectId: string;
      changeOrderId: string;
      coLineItems: ChangeOrderLineItem[];
    }) => services!.pipeline.generateFromChangeOrder(projectId, changeOrderId, coLineItems),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.blueprints.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeployBlueprint() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      blueprintId,
      loopBindingLabel,
      loopIterationId,
    }: {
      blueprintId: string;
      loopBindingLabel?: string;
      loopIterationId?: string;
    }) => services!.pipeline.deployBlueprint(blueprintId, loopBindingLabel, loopIterationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.blueprints.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCancelBlueprint() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blueprintId: string) => services!.pipeline.cancelBlueprint(blueprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.blueprints.all });
    },
  });
}
