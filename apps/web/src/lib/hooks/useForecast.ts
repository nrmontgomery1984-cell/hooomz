/**
 * Forecast Hooks
 * TanStack Query wrappers for forecast services
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { computeForecast } from '../services/financialForecast.service';
import type { ForecastConfig, ForecastSnapshot, FinancialActuals } from '../types/forecast.types';

export const FORECAST_QUERY_KEYS = {
  configs: {
    all: ['forecast', 'configs'] as const,
    active: ['forecast', 'configs', 'active'] as const,
  },
  snapshots: {
    all: ['forecast', 'snapshots'] as const,
    byConfig: (id: string) => ['forecast', 'snapshots', 'config', id] as const,
  },
  actuals: (from: string, to: string) => ['forecast', 'actuals', from, to] as const,
};

// ============================================================================
// Config Hooks
// ============================================================================

export function useForecastConfigs() {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: FORECAST_QUERY_KEYS.configs.all,
    queryFn: () => services!.forecast.configs.findAll(),
    enabled: !servicesLoading && !!services,
    staleTime: 30_000,
  });
}

export function useActiveForecastConfig() {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: FORECAST_QUERY_KEYS.configs.active,
    queryFn: () => services!.forecast.configs.findActive(),
    enabled: !servicesLoading && !!services,
    staleTime: 30_000,
  });
}

export function useSaveForecastConfig() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: async (config: ForecastConfig) => {
      return services!.forecast.configs.update(config.id, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast', 'configs'] });
    },
  });
}

export function useCreateForecastConfig() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: async (data: Omit<ForecastConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      return services!.forecast.configs.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast', 'configs'] });
    },
  });
}

// ============================================================================
// Actuals Hooks
// ============================================================================

export function useFinancialActuals(from: string, to: string) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery<FinancialActuals>({
    queryKey: FORECAST_QUERY_KEYS.actuals(from, to),
    queryFn: () => services!.forecast.actuals.computeActuals({ from, to }),
    enabled: !servicesLoading && !!services && !!from && !!to,
    staleTime: 10_000,
  });
}

// ============================================================================
// Projection (pure compute — no query needed, but useful for caching)
// ============================================================================

export function useForecastProjection(config: ForecastConfig | null) {
  return useQuery({
    queryKey: ['forecast', 'projection', config?.id, config?.updatedAt],
    queryFn: () => computeForecast(config!),
    enabled: !!config,
    staleTime: Infinity, // Pure computation — only changes when config changes
  });
}

// ============================================================================
// Snapshot Hooks
// ============================================================================

export function useForecastSnapshots() {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: FORECAST_QUERY_KEYS.snapshots.all,
    queryFn: () => services!.forecast.snapshots.findAll(),
    enabled: !servicesLoading && !!services,
    staleTime: 30_000,
  });
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: async (data: Omit<ForecastSnapshot, 'id' | 'createdAt'>) => {
      return services!.forecast.snapshots.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast', 'snapshots'] });
    },
  });
}
