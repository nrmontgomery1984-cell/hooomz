'use client';

/**
 * Project API Hooks
 * React Query hooks for project operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Project, CreateProject, UpdateProject } from '@hooomz/shared-contracts';
import { ProjectStatus } from '@hooomz/shared-contracts';

const QUERY_KEYS = {
  all: ['projects'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

interface ProjectListParams {
  status?: ProjectStatus;
  customerId?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface ProjectListResponse {
  projects: Project[];
  total: number;
}

/**
 * Fetch all projects with optional filters
 */
export function useProjects(params: ProjectListParams = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () =>
      apiClient.get<ProjectListResponse>(`/api/projects${queryString ? `?${queryString}` : ''}`),
  });
}

/**
 * Fetch a single project by ID
 */
export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => apiClient.get<Project>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProject) =>
      apiClient.post<Project>('/api/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProject }) =>
      apiClient.patch<Project>(`/api/projects/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Update project status
 */
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) =>
      apiClient.patch<Project>(`/api/projects/${id}/status`, { status }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}
