'use client';

/**
 * Invoice Hooks — query and mutate invoice records.
 * Reads from invoices IndexedDB store via InvoiceService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import type { CreateInvoiceInput } from '@hooomz/shared-contracts';

// ============================================================================
// Query Hooks
// ============================================================================

export function useInvoices(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.invoices.byProject(projectId || ''),
    queryFn: async () => {
      if (!services || !projectId) return [];
      return services.invoices.findByProjectId(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

export function useInvoice(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.invoices.detail(id || ''),
    queryFn: async () => {
      if (!services || !id) return null;
      return services.invoices.findById(id);
    },
    enabled: !servicesLoading && !!services && !!id,
    staleTime: 5_000,
  });
}

export function useInvoicesByCustomer(customerId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.invoices.byCustomer(customerId || ''),
    queryFn: async () => {
      if (!services || !customerId) return [];
      return services.invoices.findByCustomerId(customerId);
    },
    enabled: !servicesLoading && !!services && !!customerId,
    staleTime: 5_000,
  });
}

export function useAllInvoices() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.invoices.all,
    queryFn: async () => {
      if (!services) return [];
      return services.invoices.findAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateInvoice() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceInput) => {
      if (!services) throw new Error('Services not initialized');
      return services.invoices.create(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'send' | 'view' | 'cancel'; projectId: string }) => {
      if (!services) throw new Error('Services not initialized');
      switch (action) {
        case 'send': return services.invoices.markSent(id);
        case 'view': return services.invoices.markViewed(id);
        case 'cancel': return services.invoices.cancel(id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useDeleteInvoice() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      if (!services) throw new Error('Services not initialized');
      return services.invoices.delete(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}
