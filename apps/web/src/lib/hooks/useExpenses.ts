'use client';

/**
 * Expense Hooks — query and mutate expense records.
 * Reads from expenses IndexedDB store via ExpenseService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import type { CreateExpenseEntry } from '@hooomz/shared-contracts';

// ============================================================================
// Query Hooks
// ============================================================================

export function useExpenses(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.expenses.byProject(projectId || ''),
    queryFn: async () => {
      if (!services || !projectId) return [];
      return services.expenses.findByProject(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

export function useExpensesByTask(taskId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.expenses.byTask(taskId || ''),
    queryFn: async () => {
      if (!services || !taskId) return [];
      return services.expenses.findByTask(taskId);
    },
    enabled: !servicesLoading && !!services && !!taskId,
    staleTime: 5_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateExpense() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpenseEntry) => {
      if (!services) throw new Error('Services not initialized');
      return services.expenses.create(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.expenses.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useDeleteExpense() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      if (!services) throw new Error('Services not initialized');
      return services.expenses.delete(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.expenses.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}
