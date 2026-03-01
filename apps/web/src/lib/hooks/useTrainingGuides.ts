'use client';

/**
 * Training Guide Hooks — query training guide records.
 * Reads from trainingGuides IndexedDB store via TrainingGuideService.
 */

import { useQuery } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { TrainingGuide } from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const TRAINING_GUIDE_KEYS = {
  all: ['trainingGuides'] as const,
  list: () => ['trainingGuides', 'list'] as const,
  detail: (id: string) => ['trainingGuides', 'detail', id] as const,
  byTrade: (trade: string) => ['trainingGuides', 'trade', trade] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useTrainingGuides() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<TrainingGuide[]>({
    queryKey: TRAINING_GUIDE_KEYS.list(),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.trainingGuides.getAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 30_000,
  });
}

export function useTrainingGuide(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<TrainingGuide | null>({
    queryKey: TRAINING_GUIDE_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!services || !id) return null;
      return services.trainingGuides.getById(id);
    },
    enabled: !servicesLoading && !!services && !!id,
    staleTime: 30_000,
  });
}

export function useTrainingGuidesByTrade(trade: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<TrainingGuide[]>({
    queryKey: TRAINING_GUIDE_KEYS.byTrade(trade || ''),
    queryFn: async () => {
      if (!services || !trade) return [];
      return services.trainingGuides.getByTrade(trade);
    },
    enabled: !servicesLoading && !!services && !!trade,
    staleTime: 30_000,
  });
}
