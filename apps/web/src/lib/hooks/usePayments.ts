'use client';

/**
 * Payment Hooks — query and mutate payment records.
 * Reads from payments IndexedDB store via PaymentService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import type { CreatePaymentInput } from '@hooomz/shared-contracts';

// ============================================================================
// Query Hooks
// ============================================================================

export function usePayments(invoiceId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.payments.byInvoice(invoiceId || ''),
    queryFn: async () => {
      if (!services || !invoiceId) return [];
      return services.payments.findByInvoiceId(invoiceId);
    },
    enabled: !servicesLoading && !!services && !!invoiceId,
    staleTime: 5_000,
  });
}

export function usePaymentsByProject(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.payments.byProject(projectId || ''),
    queryFn: async () => {
      if (!services || !projectId) return [];
      return services.payments.findByProjectId(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useRecordPayment() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentInput) => {
      if (!services) throw new Error('Services not initialized');
      return services.payments.create(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.payments.byInvoice(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.payments.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.detail(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useDeletePayment() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; invoiceId: string; projectId: string }) => {
      if (!services) throw new Error('Services not initialized');
      return services.payments.delete(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.payments.byInvoice(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.payments.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.detail(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.invoices.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}
