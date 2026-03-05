'use client';

/**
 * Flooring Layout Hooks — React Query hooks for flooring layout calculation,
 * optimization, and persistence.
 *
 * All heavy calculation runs on the main thread via FlooringLayoutService
 * (which internally calls calculateLayout / optimizeLayout synchronously).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import type { TileDimensions, LayoutConfig } from '../types/flooringLayout.types';

// ============================================================================
// Query Hooks
// ============================================================================

export function useFlooringLayout(roomId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.flooringLayouts.byRoom(roomId ?? ''),
    queryFn: async () => {
      if (!services || !roomId) return null;
      return services.flooringLayout.findByRoom(roomId);
    },
    enabled: !servicesLoading && !!services && !!roomId,
    staleTime: 5_000,
  });
}

export function useProjectFlooringLayouts(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.flooringLayouts.byProject(projectId ?? ''),
    queryFn: async () => {
      if (!services || !projectId) return [];
      return services.flooringLayout.findByProject(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useSaveFlooringLayout() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      jobId,
      roomId,
      tile,
      config,
    }: {
      projectId: string;
      jobId: string;
      roomId: string;
      tile: TileDimensions;
      config: LayoutConfig;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.flooringLayout.saveLayout(projectId, jobId, roomId, tile, config);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.flooringLayouts.byRoom(variables.roomId),
      });
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.flooringLayouts.byProject(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useOptimizeAndSaveLayout() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      jobId,
      roomId,
      tile,
      baseConfig,
    }: {
      projectId: string;
      jobId: string;
      roomId: string;
      tile: TileDimensions;
      baseConfig?: Partial<LayoutConfig>;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.flooringLayout.optimizeAndSave(projectId, jobId, roomId, tile, baseConfig);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.flooringLayouts.byRoom(variables.roomId),
      });
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.flooringLayouts.byProject(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useDeleteFlooringLayout() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
    }: {
      roomId: string;
      projectId: string;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.flooringLayout.deleteLayout(roomId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.flooringLayouts.byRoom(variables.roomId),
      });
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.flooringLayouts.byProject(variables.projectId),
      });
    },
  });
}
