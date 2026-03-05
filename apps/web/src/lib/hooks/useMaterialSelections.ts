'use client';

/**
 * Material Selection Hooks — React Query hooks for material selection.
 * Reads from projectMaterialSelections store via MaterialSelectionService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import type { ProductTrade } from '../types/catalogProduct.types';
import type { SelectionStatus } from '../types/materialSelection.types';

// ============================================================================
// Query Hooks
// ============================================================================

export function useRoomSelections(roomId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.materialSelections.byRoom(roomId ?? ''),
    queryFn: async () => {
      if (!services || !roomId) return [];
      return services.materialSelection.findByRoom(roomId);
    },
    enabled: !servicesLoading && !!services && !!roomId,
    staleTime: 5_000,
  });
}

export function useProjectSelections(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.materialSelections.byProject(projectId ?? ''),
    queryFn: async () => {
      if (!services || !projectId) return [];
      return services.materialSelection.findByProject(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

export function useRoomSelectionSummary(roomId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.materialSelections.roomSummary(roomId ?? ''),
    queryFn: async () => {
      if (!services || !roomId) return null;
      return services.materialSelection.getRoomSummary(roomId);
    },
    enabled: !servicesLoading && !!services && !!roomId,
    staleTime: 5_000,
  });
}

export function useTierComparison(
  roomId: string | undefined,
  trade: ProductTrade | undefined,
) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.materialSelections.tierComparison(
      roomId ?? '',
      trade ?? '',
    ),
    queryFn: async () => {
      if (!services || !roomId || !trade) return null;
      return services.materialSelection.getTierComparison(roomId, trade);
    },
    enabled: !servicesLoading && !!services && !!roomId && !!trade,
    staleTime: 30_000, // tier catalog changes rarely
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useSelectMaterial() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      jobId,
      roomId,
      trade,
      productId,
      customWasteFactor,
    }: {
      projectId: string;
      jobId: string;
      roomId: string;
      trade: ProductTrade;
      productId: string;
      customWasteFactor?: number;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.materialSelection.selectMaterial(
        projectId,
        jobId,
        roomId,
        trade,
        productId,
        customWasteFactor,
      );
    },
    onSuccess: (_, variables) => {
      const { roomId, trade, projectId } = variables;
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.byRoom(roomId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.roomSummary(roomId) });
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.materialSelections.tierComparison(roomId, trade),
      });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useConfirmSelection() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectionId,
      confirmedBy,
    }: {
      selectionId: string;
      roomId: string;
      projectId: string;
      confirmedBy: string;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.materialSelection.confirmSelection(selectionId, confirmedBy);
    },
    onSuccess: (_, variables) => {
      const { roomId, projectId } = variables;
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.byRoom(roomId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.roomSummary(roomId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useUpdateSelectionStatus() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectionId,
      status,
    }: {
      selectionId: string;
      roomId: string;
      projectId: string;
      status: SelectionStatus;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.materialSelection.updateStatus(selectionId, status);
    },
    onSuccess: (_, variables) => {
      const { roomId, projectId } = variables;
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.byRoom(roomId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.roomSummary(roomId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

// ============================================================================
// Selection → Quote Sync
// ============================================================================

export function useSyncSelectionsToQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      if (!services) throw new Error('Services not initialized');
      return services.materialToLineItems.generateLineItemsFromSelections(projectId);
    },
    onSuccess: (_, variables) => {
      const { projectId } = variables;
      // Invalidate line items so quote page picks up new items
      queryClient.invalidateQueries({ queryKey: ['local', 'lineItems'] });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useMaterialLineItemCount(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: ['local', 'materialLineItemCount', projectId ?? ''],
    queryFn: async () => {
      if (!services || !projectId) return 0;
      return services.materialToLineItems.countExistingMaterialLineItems(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

export function useDeleteMaterialSelection() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectionId,
    }: {
      selectionId: string;
      roomId: string;
      projectId: string;
      trade: ProductTrade;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.materialSelection.deleteSelection(selectionId);
    },
    onSuccess: (_, variables) => {
      const { roomId, projectId, trade } = variables;
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.byRoom(roomId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.materialSelections.roomSummary(roomId) });
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.materialSelections.tierComparison(roomId, trade),
      });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}
