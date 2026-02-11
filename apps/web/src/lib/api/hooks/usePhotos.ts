'use client';

/**
 * Photo API Hooks
 * React Query hooks for photo operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Photo, CreatePhoto, UpdatePhoto } from '@hooomz/shared-contracts';

const QUERY_KEYS = {
  all: ['photos'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  byProject: (projectId: string) => [...QUERY_KEYS.all, 'project', projectId] as const,
};

interface PhotoListParams {
  projectId?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface PhotoListResponse {
  photos: Photo[];
  total: number;
}

/**
 * Fetch all photos with optional filters
 */
export function usePhotos(params: PhotoListParams = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () =>
      apiClient.get<PhotoListResponse>(`/api/photos${queryString ? `?${queryString}` : ''}`),
  });
}

/**
 * Fetch photos for a specific project
 */
export function useProjectPhotos(projectId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.byProject(projectId!),
    queryFn: () =>
      apiClient.get<PhotoListResponse>(`/api/photos?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

/**
 * Fetch a single photo by ID
 */
export function usePhoto(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => apiClient.get<Photo>(`/api/photos/${id}`),
    enabled: !!id,
  });
}

/**
 * Upload a new photo
 */
export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePhoto) =>
      apiClient.post<Photo>('/api/photos', data),
    onSuccess: (photo) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (photo.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(photo.projectId) });
      }
    },
  });
}

/**
 * Update photo metadata
 */
export function useUpdatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePhoto }) =>
      apiClient.patch<Photo>(`/api/photos/${id}`, data),
    onSuccess: (photo, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (photo.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(photo.projectId) });
      }
    },
  });
}

/**
 * Delete a photo
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/photos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}
