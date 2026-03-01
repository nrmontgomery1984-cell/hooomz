'use client';

/**
 * Consultation Hooks — query and mutate consultation records.
 * Reads from consultations IndexedDB store.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { ConsultationRecord, ConsultationStatus } from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const CONSULTATION_KEYS = {
  all: ['consultations'] as const,
  list: (filter?: ConsultationStatus) => ['consultations', 'list', filter] as const,
  detail: (id: string) => ['consultations', 'detail', id] as const,
  byProject: (projectId: string) => ['consultations', 'project', projectId] as const,
  byCustomer: (customerId: string) => ['consultations', 'customer', customerId] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useConsultations(filter?: ConsultationStatus) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: CONSULTATION_KEYS.list(filter),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      if (filter) {
        return services.consultations.findByStatus(filter);
      }
      return services.consultations.findAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}

export function useConsultation(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: CONSULTATION_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!services || !id) return null;
      return services.consultations.findById(id);
    },
    enabled: !servicesLoading && !!services && !!id,
    staleTime: 5_000,
  });
}

export function useConsultationByProject(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: CONSULTATION_KEYS.byProject(projectId || ''),
    queryFn: async () => {
      if (!services || !projectId) return null;
      return services.consultations.findByProject(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateConsultation() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ConsultationRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.consultations.create(data);
      await services.activity.create({
        event_type: 'consultation_created',
        project_id: record.projectId,
        entity_type: 'consultation',
        entity_id: record.id,
        summary: `Consultation ${record.scheduledDate ? `scheduled for ${record.scheduledDate}` : 'created'}`,
      });
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSULTATION_KEYS.all });
    },
  });
}

export function useUpdateConsultation() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<ConsultationRecord, 'id' | 'createdAt'>> }) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.consultations.update(id, data);
      if (record) {
        await services.activity.create({
          event_type: 'consultation_updated',
          project_id: record.projectId,
          entity_type: 'consultation',
          entity_id: record.id,
          summary: `Consultation updated`,
        });
      }
      return record;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CONSULTATION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONSULTATION_KEYS.detail(id) });
    },
  });
}

export function useCompleteConsultation() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completedDate }: { id: string; completedDate: string }) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.consultations.complete(id, completedDate);
      if (record) {
        await services.activity.create({
          event_type: 'consultation_completed',
          project_id: record.projectId,
          entity_type: 'consultation',
          entity_id: record.id,
          summary: `Consultation completed on ${completedDate}`,
        });
      }
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSULTATION_KEYS.all });
    },
  });
}
