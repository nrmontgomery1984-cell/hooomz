'use client';

/**
 * Standard SOP Hooks — query SOP records and checklist submissions.
 * Reads from sops + checklistSubmissions IndexedDB stores.
 */

import { useQuery } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { StandardSOP, ChecklistSubmission } from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const STANDARD_SOP_KEYS = {
  all: ['standardSops'] as const,
  list: () => ['standardSops', 'list'] as const,
  detail: (id: string) => ['standardSops', 'detail', id] as const,
  byTrade: (trade: string) => ['standardSops', 'trade', trade] as const,
  byCode: (code: string) => ['standardSops', 'code', code] as const,
};

export const CHECKLIST_KEYS = {
  all: ['checklists'] as const,
  bySop: (sopId: string) => ['checklists', 'sop', sopId] as const,
  byProject: (projectId: string) => ['checklists', 'project', projectId] as const,
  detail: (id: string) => ['checklists', 'detail', id] as const,
};

// ============================================================================
// SOP Query Hooks
// ============================================================================

export function useStandardSOPs() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<StandardSOP[]>({
    queryKey: STANDARD_SOP_KEYS.list(),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.standardSops.getAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 30_000,
  });
}

export function useStandardSOP(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<StandardSOP | null>({
    queryKey: STANDARD_SOP_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!services || !id) return null;
      return services.standardSops.getById(id);
    },
    enabled: !servicesLoading && !!services && !!id,
    staleTime: 30_000,
  });
}

export function useStandardSOPsByTrade(trade: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<StandardSOP[]>({
    queryKey: STANDARD_SOP_KEYS.byTrade(trade || ''),
    queryFn: async () => {
      if (!services || !trade) return [];
      return services.standardSops.getByTrade(trade);
    },
    enabled: !servicesLoading && !!services && !!trade,
    staleTime: 30_000,
  });
}

export function useStandardSOPByCode(code: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<StandardSOP | null>({
    queryKey: STANDARD_SOP_KEYS.byCode(code || ''),
    queryFn: async () => {
      if (!services || !code) return null;
      return services.standardSops.getByCode(code);
    },
    enabled: !servicesLoading && !!services && !!code,
    staleTime: 30_000,
  });
}

// ============================================================================
// Checklist Query Hooks
// ============================================================================

export function useChecklistSubmissions(sopId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<ChecklistSubmission[]>({
    queryKey: CHECKLIST_KEYS.bySop(sopId || ''),
    queryFn: async () => {
      if (!services || !sopId) return [];
      return services.checklists.getBySopId(sopId);
    },
    enabled: !servicesLoading && !!services && !!sopId,
    staleTime: 30_000,
  });
}

export function useChecklistSubmissionsByProject(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<ChecklistSubmission[]>({
    queryKey: CHECKLIST_KEYS.byProject(projectId || ''),
    queryFn: async () => {
      if (!services || !projectId) return [];
      return services.checklists.getByProjectId(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 30_000,
  });
}

export function useAllChecklists() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<ChecklistSubmission[]>({
    queryKey: [...CHECKLIST_KEYS.all, 'all'] as const,
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.checklists.getAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 30_000,
  });
}
