'use client';

/**
 * Loop Management hooks (Build 3d)
 * Offline-first: reads from IndexedDB via LoopManagementService
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { LoopType } from '@hooomz/shared';
import type { StandardResidentialFloor } from '../services/loopManagement.service';

// ============================================================================
// Query Keys
// ============================================================================

export const LOOP_MGMT_QUERY_KEYS = {
  contexts: {
    all: ['loops', 'contexts'] as const,
    byProject: (projectId: string) => ['loops', 'contexts', 'project', projectId] as const,
  },
  iterations: {
    all: ['loops', 'iterations'] as const,
    byProject: (projectId: string) => ['loops', 'iterations', 'project', projectId] as const,
    byContext: (contextId: string) => ['loops', 'iterations', 'context', contextId] as const,
    byParent: (parentId: string) => ['loops', 'iterations', 'parent', parentId] as const,
    roots: (projectId: string) => ['loops', 'iterations', 'roots', projectId] as const,
    detail: (id: string) => ['loops', 'iterations', 'detail', id] as const,
  },
  tree: {
    byProject: (projectId: string) => ['loops', 'tree', projectId] as const,
  },
};

// ============================================================================
// Context Hooks
// ============================================================================

export function useProjectLoopContexts(projectId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: LOOP_MGMT_QUERY_KEYS.contexts.byProject(projectId || ''),
    queryFn: () => services!.loopManagement.getProjectContexts(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Iteration Hooks
// ============================================================================

export function useProjectIterations(projectId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: LOOP_MGMT_QUERY_KEYS.iterations.byProject(projectId || ''),
    queryFn: () => services!.loopManagement.getProjectIterations(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 10_000,
  });
}

export function useContextIterations(contextId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: LOOP_MGMT_QUERY_KEYS.iterations.byContext(contextId || ''),
    queryFn: () => services!.loopManagement.getContextIterations(contextId!),
    enabled: !servicesLoading && !!services && !!contextId,
    staleTime: 10_000,
  });
}

export function useChildIterations(parentId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: LOOP_MGMT_QUERY_KEYS.iterations.byParent(parentId || ''),
    queryFn: () => services!.loopManagement.getChildIterations(parentId!),
    enabled: !servicesLoading && !!services && !!parentId,
    staleTime: 10_000,
  });
}

export function useRootIterations(projectId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: LOOP_MGMT_QUERY_KEYS.iterations.roots(projectId || ''),
    queryFn: () => services!.loopManagement.getRootIterations(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 10_000,
  });
}

// ============================================================================
// Tree Hook
// ============================================================================

export function useLoopTree(projectId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: LOOP_MGMT_QUERY_KEYS.tree.byProject(projectId || ''),
    queryFn: () => services!.loopManagement.buildProjectTree(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 10_000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateLoopContext() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: (params: {
      projectId: string;
      name: string;
      loopType: LoopType;
      parentContextId?: string;
      bindingKey?: string;
    }) => services!.loopManagement.createContext(
      params.projectId,
      params.name,
      params.loopType,
      {
        parentContextId: params.parentContextId,
        bindingKey: params.bindingKey,
      }
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops'] });
    },
  });
}

export function useCreateIteration() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: (params: {
      contextId: string;
      projectId: string;
      name: string;
      parentIterationId?: string;
    }) => services!.loopManagement.createIteration(
      params.contextId,
      params.projectId,
      params.name,
      { parentIterationId: params.parentIterationId }
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops'] });
    },
  });
}

export function useUpdateIteration() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: (params: {
      iterationId: string;
      data: { name?: string; display_order?: number };
    }) => services!.loopManagement.updateIteration(params.iterationId, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops'] });
    },
  });
}

export function useDeleteIteration() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: (iterationId: string) => services!.loopManagement.deleteIteration(iterationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops'] });
    },
  });
}

export function useDeleteLoopContext() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: (contextId: string) => services!.loopManagement.deleteContext(contextId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops'] });
    },
  });
}

export function useApplyStandardResidentialTemplate() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: (params: {
      projectId: string;
      floors?: StandardResidentialFloor[];
    }) => services!.loopManagement.applyStandardResidentialTemplate(
      params.projectId,
      params.floors
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loops'] });
    },
  });
}
