'use client';

/**
 * Loop Hierarchy API Hooks
 * React Query hooks for the nested loop architecture
 *
 * Loops are the core unit of Hooomz:
 * Project → Work Category → Location → Task → Checklist Item
 *
 * Each loop has a health score (0-100) that bubbles up from children.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

const QUERY_KEYS = {
  all: ['loops'] as const,
  tree: (projectId: string) => [...QUERY_KEYS.all, 'tree', projectId] as const,
  children: (parentId: string) => [...QUERY_KEYS.all, 'children', parentId] as const,
  detail: (id: string) => [...QUERY_KEYS.all, 'detail', id] as const,
};

/**
 * Loop iteration in the hierarchy
 */
export interface LoopIteration {
  id: string;
  name: string;
  parent_id: string | null;
  loop_context_id: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'complete';
  health_score: number; // 0-100
  is_leaf: boolean;
  work_category_code?: string;
  stage_code?: string;
  location_id?: string;
  children?: LoopIteration[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

/**
 * Loop tree response with full hierarchy
 */
export interface LoopTreeResponse {
  project_id: string;
  root: LoopIteration;
  total_loops: number;
  health_score: number;
}

/**
 * Fetch the complete loop tree for a project
 * Returns the full hierarchy from project down to tasks
 */
export function useLoopTree(projectId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tree(projectId),
    queryFn: () => apiClient.get<LoopTreeResponse>(`/api/projects/${projectId}/loops/tree`),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds - loops change less frequently
  });
}

/**
 * Fetch children of a specific loop
 * Used for lazy-loading deeper levels of the hierarchy
 */
export function useLoopChildren(parentId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.children(parentId),
    queryFn: () => apiClient.get<LoopIteration[]>(`/api/loops/${parentId}/children`),
    enabled: !!parentId,
  });
}

/**
 * Fetch a single loop iteration by ID
 */
export function useLoopIteration(iterationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(iterationId),
    queryFn: () => apiClient.get<LoopIteration>(`/api/loops/${iterationId}`),
    enabled: !!iterationId,
  });
}

/**
 * Update a loop's status
 * Status bubbles up to parent loops automatically on the backend
 */
export function useUpdateLoopStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: LoopIteration['status'];
    }) => apiClient.patch<LoopIteration>(`/api/loops/${id}/status`, { status }),
    onSuccess: (data) => {
      // Invalidate the loop itself
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(data.id) });
      // Invalidate parent's children list
      if (data.parent_id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.children(data.parent_id),
        });
      }
      // Note: Should also invalidate the project tree, but we need project_id for that
      // The backend should handle health score propagation
    },
  });
}

/**
 * Create a new loop iteration (child of an existing loop)
 */
export function useCreateLoop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      parent_id: string;
      loop_context_id: string;
      work_category_code?: string;
      stage_code?: string;
      location_id?: string;
    }) => apiClient.post<LoopIteration>('/api/loops', data),
    onSuccess: (data) => {
      if (data.parent_id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.children(data.parent_id),
        });
      }
    },
  });
}
