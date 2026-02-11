'use client';

/**
 * Local Estimate Hooks — IndexedDB-backed React Query hooks for line items
 *
 * Reads/writes via EstimateService (activity-logged) and LineItemRepository.
 * No API dependency — 100% offline-first.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { getLoggedServices } from '../services';
import type { CreateLineItem, LineItem } from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const ESTIMATE_LOCAL_KEYS = {
  lineItems: {
    all: ['local', 'estimate', 'lineItems'] as const,
    byProject: (projectId: string) =>
      ['local', 'estimate', 'lineItems', projectId] as const,
  },
  totals: {
    byProject: (projectId: string) =>
      ['local', 'estimate', 'totals', projectId] as const,
  },
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all line items for a project from IndexedDB
 */
export function useProjectLineItems(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: ESTIMATE_LOCAL_KEYS.lineItems.byProject(projectId || ''),
    queryFn: async (): Promise<LineItem[]> => {
      if (!services || !projectId) return [];
      return services.estimating.lineItems.findByProjectId(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5 * 1000,
  });
}

/**
 * Fetch calculated totals for a project's line items
 */
export function useProjectEstimateTotals(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: ESTIMATE_LOCAL_KEYS.totals.byProject(projectId || ''),
    queryFn: async () => {
      if (!services || !projectId)
        return { subtotal: 0, laborTotal: 0, materialTotal: 0, itemCount: 0 };
      return services.estimating.lineItems.calculateProjectTotals(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new line item (activity-logged)
 */
export function useCreateLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: CreateLineItem;
    }) => {
      const loggedServices = getLoggedServices();
      return loggedServices.estimates.createLineItem(projectId, data);
    },
    onSuccess: (lineItem) => {
      queryClient.invalidateQueries({
        queryKey: ESTIMATE_LOCAL_KEYS.lineItems.byProject(lineItem.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ESTIMATE_LOCAL_KEYS.totals.byProject(lineItem.projectId),
      });
    },
  });
}

/**
 * Update an existing line item (activity-logged)
 */
export function useUpdateLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      lineItemId,
      data,
    }: {
      projectId: string;
      lineItemId: string;
      data: Partial<Omit<LineItem, 'id' | 'metadata'>>;
    }) => {
      const loggedServices = getLoggedServices();
      return loggedServices.estimates.updateLineItem(projectId, lineItemId, data);
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: ESTIMATE_LOCAL_KEYS.lineItems.byProject(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ESTIMATE_LOCAL_KEYS.totals.byProject(projectId),
      });
    },
  });
}

/**
 * Delete a line item (activity-logged)
 */
export function useDeleteLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      lineItemId,
    }: {
      projectId: string;
      lineItemId: string;
    }) => {
      const loggedServices = getLoggedServices();
      return loggedServices.estimates.deleteLineItem(projectId, lineItemId);
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: ESTIMATE_LOCAL_KEYS.lineItems.byProject(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ESTIMATE_LOCAL_KEYS.totals.byProject(projectId),
      });
    },
  });
}
