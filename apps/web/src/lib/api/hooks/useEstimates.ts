'use client';

/**
 * Estimate API Hooks
 * React Query hooks for estimate operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Estimate, CreateEstimate, UpdateEstimate, EstimateStatus } from '@hooomz/shared-contracts';

const QUERY_KEYS = {
  all: ['estimates'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  byProject: (projectId: string) => [...QUERY_KEYS.all, 'project', projectId] as const,
};

interface EstimateListParams {
  projectId?: string;
  status?: EstimateStatus;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface EstimateListResponse {
  estimates: Estimate[];
  total: number;
}

/**
 * Fetch all estimates with optional filters
 */
export function useEstimates(params: EstimateListParams = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () =>
      apiClient.get<EstimateListResponse>(`/api/estimates${queryString ? `?${queryString}` : ''}`),
  });
}

/**
 * Fetch estimate for a specific project
 */
export function useProjectEstimate(projectId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.byProject(projectId!),
    queryFn: () =>
      apiClient.get<Estimate>(`/api/projects/${projectId}/estimate`),
    enabled: !!projectId,
  });
}

/**
 * Fetch a single estimate by ID
 */
export function useEstimate(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => apiClient.get<Estimate>(`/api/estimates/${id}`),
    enabled: !!id,
  });
}

/**
 * Create a new estimate
 */
export function useCreateEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEstimate) =>
      apiClient.post<Estimate>('/api/estimates', data),
    onSuccess: (estimate) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (estimate.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(estimate.projectId) });
      }
    },
  });
}

/**
 * Update an existing estimate
 */
export function useUpdateEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEstimate }) =>
      apiClient.patch<Estimate>(`/api/estimates/${id}`, data),
    onSuccess: (estimate, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (estimate.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(estimate.projectId) });
      }
    },
  });
}

/**
 * Approve an estimate
 */
export function useApproveEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Estimate>(`/api/estimates/${id}/approve`),
    onSuccess: (estimate, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (estimate.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(estimate.projectId) });
      }
    },
  });
}

/**
 * Delete an estimate
 */
export function useDeleteEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/estimates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}
