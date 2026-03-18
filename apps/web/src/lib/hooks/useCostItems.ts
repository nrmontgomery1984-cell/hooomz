'use client';

/**
 * useCostItems — query CostItem records from IndexedDB.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { CostItemService } from '../services/costItem.service';
import type { CostItem, CostItemFilters } from '../types/catalogue.types';

export const COST_ITEM_KEYS = {
  all:    ['costItems'] as const,
  list:   (filters?: CostItemFilters) => ['costItems', 'list', filters ?? {}] as const,
  detail: (id: string) => ['costItems', 'detail', id] as const,
};

export function useCostItems(filters?: CostItemFilters) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<CostItem[]>({
    queryKey: COST_ITEM_KEYS.list(filters),
    queryFn: async () => {
      if (!services) return [];
      const svc = new CostItemService(services.storage);
      if (filters && Object.keys(filters).some((k) => (filters as Record<string, unknown>)[k] !== undefined)) {
        return svc.query(filters);
      }
      return svc.getAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCostItem(id: string) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<CostItem | null>({
    queryKey: COST_ITEM_KEYS.detail(id),
    queryFn: async () => {
      if (!services) return null;
      return new CostItemService(services.storage).getById(id);
    },
    enabled: !servicesLoading && !!services && !!id,
  });
}

/**
 * Mutation to upsert a cost item.
 * Used by the edit form in Phase 2.
 */
export function useUpsertCostItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: CostItem) => {
      if (!services) throw new Error('Services not initialized');
      await new CostItemService(services.storage).upsert(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COST_ITEM_KEYS.all });
    },
  });
}

/**
 * Hook for flag state — stored in localStorage for Phase 1.
 * Key: 'catalogue_flagged_cost_items' → JSON array of IDs.
 * Promoted to IndexedDB in a later phase if needed.
 */
const FLAG_KEY = 'catalogue_flagged_cost_items';

function loadFlags(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(FLAG_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveFlags(flags: Set<string>): void {
  localStorage.setItem(FLAG_KEY, JSON.stringify(Array.from(flags)));
}

export function useFlaggedCostItems() {
  const queryClient = useQueryClient();

  const { data: flaggedIds = new Set<string>() } = useQuery<Set<string>>({
    queryKey: ['costItems', 'flags'],
    queryFn: () => loadFlags(),
    staleTime: Infinity,
  });

  const toggle = useMutation({
    mutationFn: async (id: string) => {
      const flags = loadFlags();
      if (flags.has(id)) flags.delete(id);
      else flags.add(id);
      saveFlags(flags);
      return flags;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costItems', 'flags'] });
    },
  });

  return { flaggedIds, toggle: toggle.mutate };
}
