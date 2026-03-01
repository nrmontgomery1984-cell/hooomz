'use client';

/**
 * Quote Hooks — query and mutate quote records.
 * Reads from quotes IndexedDB store.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { QuoteRecord, QuoteStatus } from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const QUOTE_KEYS = {
  all: ['quotes'] as const,
  list: (filter?: QuoteStatus) => ['quotes', 'list', filter] as const,
  detail: (id: string) => ['quotes', 'detail', id] as const,
  byProject: (projectId: string) => ['quotes', 'project', projectId] as const,
  byCustomer: (customerId: string) => ['quotes', 'customer', customerId] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useQuotes(filter?: QuoteStatus) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: QUOTE_KEYS.list(filter),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      if (filter) {
        return services.quotes.findByStatus(filter);
      }
      return services.quotes.findAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}

export function useQuote(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: QUOTE_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!services || !id) return null;
      return services.quotes.findById(id);
    },
    enabled: !servicesLoading && !!services && !!id,
    staleTime: 5_000,
  });
}

export function useQuotesByProject(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: QUOTE_KEYS.byProject(projectId || ''),
    queryFn: async () => {
      if (!services || !projectId) return [];
      return services.quotes.findByProject(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

export function useQuotesByCustomer(customerId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: QUOTE_KEYS.byCustomer(customerId || ''),
    queryFn: async () => {
      if (!services || !customerId) return [];
      return services.quotes.findByCustomer(customerId);
    },
    enabled: !servicesLoading && !!services && !!customerId,
    staleTime: 5_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<QuoteRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.create(data);
      await services.activity.create({
        event_type: 'quote_created',
        project_id: record.projectId,
        entity_type: 'quote',
        entity_id: record.id,
        summary: `Quote created for $${record.totalAmount.toLocaleString()}`,
      });
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
    },
  });
}

export function useUpdateQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<QuoteRecord, 'id' | 'createdAt'>> }) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.update(id, data);
      if (record) {
        await services.activity.create({
          event_type: 'quote_updated',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: 'Quote updated',
        });
      }
      return record;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
    },
  });
}

export function useSendQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.send(id);
      if (record) {
        await services.activity.create({
          event_type: 'quote_sent',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: `Quote sent to customer ($${record.totalAmount.toLocaleString()})`,
        });
      }
      return record;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
    },
  });
}

export function useMarkQuoteViewed() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.markViewed(id);
      if (record) {
        await services.activity.create({
          event_type: 'quote_viewed',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: 'Quote viewed by customer',
        });
      }
      return record;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
    },
  });
}

export function useAcceptQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.accept(id);
      if (record) {
        await services.activity.create({
          event_type: 'quote_accepted',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: `Quote accepted ($${record.totalAmount.toLocaleString()})`,
        });
      }
      return record;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
    },
  });
}

export function useDeclineQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.decline(id, reason);
      if (record) {
        await services.activity.create({
          event_type: 'quote_declined',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: `Quote declined${reason ? `: ${reason}` : ''}`,
        });
      }
      return record;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
    },
  });
}
