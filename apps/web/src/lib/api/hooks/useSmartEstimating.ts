/**
 * Smart Estimating Hooks
 * React Query hooks for the learning system that makes estimates more accurate
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

// ============================================================================
// TYPES
// ============================================================================

export type ConfidenceLevel = 'verified' | 'limited' | 'estimate';

export interface PriceBaseline {
  item_name: string;
  unit: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  data_point_count: number;
  confidence: ConfidenceLevel;
}

export interface LaborBaseline {
  task_name: string;
  work_category?: string;
  avg_hours: number;
  min_hours: number;
  max_hours: number;
  data_point_count: number;
  confidence: ConfidenceLevel;
}

export interface EstimateAccuracyTrend {
  month: string;
  projects_completed: number;
  avg_variance: number;
  avg_absolute_variance: number;
}

export interface AccuracyStats {
  totalProjects: number;
  avgVariancePercent: number;
  avgAbsoluteVariancePercent: number;
  accuracyScore: number;
  trend: 'improving' | 'declining' | 'stable';
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  priceBaseline: (itemName: string) => ['price-baseline', itemName] as const,
  priceSearch: (query: string) => ['price-search', query] as const,
  laborBaseline: (taskName: string) => ['labor-baseline', taskName] as const,
  laborSearch: (query: string) => ['labor-search', query] as const,
  accuracyTrend: () => ['estimate-accuracy-trend'] as const,
  accuracyStats: () => ['estimate-accuracy-stats'] as const,
};

// ============================================================================
// PRICE HOOKS
// ============================================================================

/**
 * Get the baseline price for an item
 */
export function usePriceBaseline(itemName: string) {
  return useQuery({
    queryKey: QUERY_KEYS.priceBaseline(itemName),
    queryFn: () =>
      apiClient.get<PriceBaseline>(
        `/api/learning/prices/baseline?item=${encodeURIComponent(itemName)}`
      ),
    enabled: !!itemName && itemName.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Search for price baselines
 */
export function usePriceSearch(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.priceSearch(query),
    queryFn: () =>
      apiClient.get<PriceBaseline[]>(
        `/api/learning/prices/search?q=${encodeURIComponent(query)}`
      ),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Record a new price
 */
export function useRecordPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      item_name: string;
      unit_price: number;
      unit: string;
      vendor?: string;
      source_type: string;
      project_id?: string;
    }) => apiClient.post('/api/learning/prices', data),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.priceBaseline(variables.item_name),
      });
    },
  });
}

// ============================================================================
// LABOR HOOKS
// ============================================================================

/**
 * Get the baseline duration for a task
 */
export function useLaborBaseline(taskName: string) {
  return useQuery({
    queryKey: QUERY_KEYS.laborBaseline(taskName),
    queryFn: () =>
      apiClient.get<LaborBaseline>(
        `/api/learning/labor/baseline?task=${encodeURIComponent(taskName)}`
      ),
    enabled: !!taskName && taskName.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Search for labor baselines
 */
export function useLaborSearch(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.laborSearch(query),
    queryFn: () =>
      apiClient.get<LaborBaseline[]>(
        `/api/learning/labor/search?q=${encodeURIComponent(query)}`
      ),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Record a new labor entry
 */
export function useRecordLabor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      task_name: string;
      duration_hours: number;
      work_category?: string;
      source_type: string;
      project_id?: string;
    }) => apiClient.post('/api/learning/labor', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.laborBaseline(variables.task_name),
      });
    },
  });
}

// ============================================================================
// ACCURACY HOOKS
// ============================================================================

/**
 * Get estimate accuracy trend over time
 */
export function useEstimateAccuracyTrend(months = 12) {
  return useQuery({
    queryKey: QUERY_KEYS.accuracyTrend(),
    queryFn: () =>
      apiClient.get<EstimateAccuracyTrend[]>(
        `/api/learning/accuracy/trend?months=${months}`
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get overall accuracy statistics
 */
export function useEstimateAccuracyStats() {
  return useQuery({
    queryKey: QUERY_KEYS.accuracyStats(),
    queryFn: () => apiClient.get<AccuracyStats>('/api/learning/accuracy/stats'),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Record estimate accuracy when a project is completed
 */
export function useRecordAccuracy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      project_id: string;
      estimate_id: string;
      estimated_total: number;
      actual_total: number;
    }) => apiClient.post('/api/learning/accuracy', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accuracyTrend() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accuracyStats() });
    },
  });
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Get a suggested price with confidence for an estimate line item
 */
export function useSuggestedPrice(itemName: string) {
  const { data: baseline, isLoading } = usePriceBaseline(itemName);

  if (!baseline) {
    return {
      price: null,
      confidence: 'estimate' as ConfidenceLevel,
      dataPoints: 0,
      isLoading,
    };
  }

  return {
    price: baseline.avg_price,
    confidence: baseline.confidence,
    dataPoints: baseline.data_point_count,
    isLoading,
  };
}

/**
 * Get a suggested duration with confidence for a task
 */
export function useSuggestedDuration(taskName: string) {
  const { data: baseline, isLoading } = useLaborBaseline(taskName);

  if (!baseline) {
    return {
      hours: null,
      confidence: 'estimate' as ConfidenceLevel,
      dataPoints: 0,
      isLoading,
    };
  }

  return {
    hours: baseline.avg_hours,
    confidence: baseline.confidence,
    dataPoints: baseline.data_point_count,
    isLoading,
  };
}
