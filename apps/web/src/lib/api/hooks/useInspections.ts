'use client';

/**
 * Inspection API Hooks
 * React Query hooks for inspection operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Inspection, CreateInspection, UpdateInspection } from '@hooomz/shared-contracts';
import { InspectionStatus } from '@hooomz/shared-contracts';

const QUERY_KEYS = {
  all: ['inspections'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  byProject: (projectId: string) => [...QUERY_KEYS.all, 'project', projectId] as const,
};

interface InspectionListParams {
  projectId?: string;
  status?: InspectionStatus;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface InspectionListResponse {
  inspections: Inspection[];
  total: number;
}

/**
 * Fetch all inspections with optional filters
 */
export function useInspections(params: InspectionListParams = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () =>
      apiClient.get<InspectionListResponse>(`/api/inspections${queryString ? `?${queryString}` : ''}`),
  });
}

/**
 * Fetch inspections for a specific project
 */
export function useProjectInspections(projectId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.byProject(projectId!),
    queryFn: () =>
      apiClient.get<InspectionListResponse>(`/api/inspections?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

/**
 * Fetch a single inspection by ID
 */
export function useInspection(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => apiClient.get<Inspection>(`/api/inspections/${id}`),
    enabled: !!id,
  });
}

/**
 * Create a new inspection
 */
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInspection) =>
      apiClient.post<Inspection>('/api/inspections', data),
    onSuccess: (inspection) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (inspection.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(inspection.projectId) });
      }
    },
  });
}

/**
 * Update an existing inspection
 */
export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInspection }) =>
      apiClient.patch<Inspection>(`/api/inspections/${id}`, data),
    onSuccess: (inspection, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (inspection.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(inspection.projectId) });
      }
    },
  });
}

/**
 * Complete an inspection
 */
export function useCompleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, result, notes }: { id: string; result: 'pass' | 'fail' | 'partial'; notes?: string }) =>
      apiClient.post<Inspection>(`/api/inspections/${id}/complete`, { result, notes }),
    onSuccess: (inspection, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (inspection.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(inspection.projectId) });
      }
    },
  });
}

/**
 * Delete an inspection
 */
export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/inspections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}
