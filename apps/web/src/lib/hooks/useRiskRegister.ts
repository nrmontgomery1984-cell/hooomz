'use client';

/**
 * Risk Register Hooks — query and mutate risk entries.
 * Reads from riskEntries IndexedDB store via RiskEntryRepository.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { RiskEntry, RiskTrade, RiskSeverity, RiskStatus, RiskSource } from '../types/riskEntry';

// ============================================================================
// Query Keys
// ============================================================================

export const RISK_QUERY_KEYS = {
  all: ['riskEntries'] as const,
  list: (filters?: RiskFilters) => ['riskEntries', 'list', filters] as const,
  detail: (id: string) => ['riskEntries', 'detail', id] as const,
  bySop: (sopId: string) => ['riskEntries', 'bySop', sopId] as const,
  flaggedSops: ['riskEntries', 'flaggedSops'] as const,
};

// ============================================================================
// Filter Types
// ============================================================================

export interface RiskFilters {
  trade?: RiskTrade;
  severity?: RiskSeverity;
  status?: RiskStatus;
  source?: RiskSource;
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useRiskEntries(filters?: RiskFilters) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: RISK_QUERY_KEYS.list(filters),
    queryFn: async () => {
      if (!services) return [];
      let entries = await services.riskEntries.findAll();

      if (filters?.trade) {
        entries = entries.filter((e) => e.trade === filters.trade);
      }
      if (filters?.severity) {
        entries = entries.filter((e) => e.severity === filters.severity);
      }
      if (filters?.status) {
        entries = entries.filter((e) => e.status === filters.status);
      }
      if (filters?.source) {
        entries = entries.filter((e) => e.source === filters.source);
      }

      return entries;
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}

export function useRiskEntry(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: RISK_QUERY_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!services || !id) return null;
      return services.riskEntries.findById(id);
    },
    enabled: !servicesLoading && !!services && !!id,
    staleTime: 5_000,
  });
}

export function useRiskEntriesBySop(sopId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: RISK_QUERY_KEYS.bySop(sopId || ''),
    queryFn: async () => {
      if (!services || !sopId) return [];
      return services.riskEntries.findByLinkedSop(sopId);
    },
    enabled: !servicesLoading && !!services && !!sopId,
    staleTime: 5_000,
  });
}

export function useFlaggedSops() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: RISK_QUERY_KEYS.flaggedSops,
    queryFn: async () => {
      if (!services) return [];
      const allEntries = await services.riskEntries.findAll();
      // Collect unique SOP IDs where sopFlaggedForReview is true
      const flaggedSopIds = new Set<string>();
      for (const entry of allEntries) {
        if (entry.sopFlaggedForReview && entry.linkedSopId) {
          flaggedSopIds.add(entry.linkedSopId);
        }
      }
      return Array.from(flaggedSopIds);
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateRiskEntry() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<RiskEntry, 'id' | 'metadata'>) => {
      if (!services) throw new Error('Services not initialized');
      return services.riskEntries.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RISK_QUERY_KEYS.all });
    },
  });
}

export function useUpdateRiskEntry() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<Omit<RiskEntry, 'id'>> }) => {
      if (!services) throw new Error('Services not initialized');
      return services.riskEntries.update(id, changes);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RISK_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RISK_QUERY_KEYS.detail(variables.id) });
    },
  });
}
