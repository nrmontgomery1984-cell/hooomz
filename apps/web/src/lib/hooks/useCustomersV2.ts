'use client';

/**
 * Customer V2 Hooks — query and mutate platform-level customer records.
 * Reads from customers_v2 IndexedDB store. Does NOT touch the legacy customers store.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useServicesContext } from '../services/ServicesContext';
import type { CustomerRecord, CustomerStatus } from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const CUSTOMER_V2_KEYS = {
  all: ['customersV2'] as const,
  list: (filter?: CustomerStatus) => ['customersV2', 'list', filter] as const,
  detail: (id: string) => ['customersV2', 'detail', id] as const,
  search: (query: string) => ['customersV2', 'search', query] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useCustomers(filter?: CustomerStatus) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: CUSTOMER_V2_KEYS.list(filter),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      if (filter) {
        return services.customersV2.findByStatus(filter);
      }
      return services.customersV2.findAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}

export function useCustomer(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: CUSTOMER_V2_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!services || !id) return null;
      return services.customersV2.findById(id);
    },
    enabled: !servicesLoading && !!services && !!id,
    staleTime: 5_000,
  });
}

export function useCustomerSearch(query: string) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: CUSTOMER_V2_KEYS.search(debouncedQuery),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.customersV2.search(debouncedQuery);
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateCustomerV2() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.customersV2.create(data);
      // Log activity event
      await services.activity.create({
        event_type: 'customer_created',
        project_id: '',
        entity_type: 'customer_v2',
        entity_id: record.id,
        summary: `Customer created: ${record.firstName} ${record.lastName}`,
      });
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_V2_KEYS.all });
    },
  });
}

export function useUpdateCustomerV2() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<CustomerRecord, 'id' | 'createdAt'>> }) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.customersV2.update(id, data);
      if (record) {
        await services.activity.create({
          event_type: 'customer_updated',
          project_id: '',
          entity_type: 'customer_v2',
          entity_id: record.id,
          summary: `Customer updated: ${record.firstName} ${record.lastName}`,
        });
      }
      return record;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_V2_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_V2_KEYS.detail(id) });
    },
  });
}

export function useAddCustomerNote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, note }: { customerId: string; note: string }) => {
      if (!services) throw new Error('Services not initialized');
      await services.activity.create({
        event_type: 'customer_note',
        project_id: '',
        entity_type: 'customer_v2',
        entity_id: customerId,
        summary: note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local', 'recentActivity'] });
    },
  });
}
