'use client';

/**
 * Cost Catalogue Hooks
 *
 * Loads/saves the editable rate tables from IndexedDB.
 * When no stored catalog exists, the estimate engine uses DEFAULT_COST_CATALOG.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { CostCatalog } from '../types/costCatalog.types';
import { DEFAULT_COST_CATALOG } from '../instantEstimate';

const COST_CATALOG_KEY = ['local', 'costCatalog'] as const;

/**
 * Load the stored cost catalog (or null if using defaults).
 */
export function useCostCatalog() {
  const { services } = useServicesContext();

  return useQuery({
    queryKey: [...COST_CATALOG_KEY],
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.costCatalog.get();
    },
    enabled: !!services,
    staleTime: 60 * 1000,
  });
}

/**
 * Returns the effective catalog: stored overrides or defaults.
 */
export function useEffectiveCatalog(): CostCatalog {
  const { data: stored } = useCostCatalog();
  return stored ?? DEFAULT_COST_CATALOG;
}

/**
 * Save a cost catalog to IndexedDB.
 */
export function useSaveCostCatalog() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (catalog: CostCatalog) => {
      if (!services) throw new Error('Services not initialized');
      await services.costCatalog.save({
        ...catalog,
        id: 'cost_catalog',
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COST_CATALOG_KEY] });
    },
  });
}

/**
 * Delete the stored catalog — reverts to hardcoded defaults.
 */
export function useResetCostCatalog() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!services) throw new Error('Services not initialized');
      await services.costCatalog.remove();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...COST_CATALOG_KEY] });
    },
  });
}
