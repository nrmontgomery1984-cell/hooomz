'use client';

/**
 * Catalog API Hooks
 * React Query hooks for catalog/line item operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { CatalogItem, CreateCatalogItem, UpdateCatalogItem } from '@hooomz/shared-contracts';

const QUERY_KEYS = {
  all: ['catalog'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  byCategory: (category: string) => [...QUERY_KEYS.all, 'category', category] as const,
};

interface CatalogListParams {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface CatalogListResponse {
  items: CatalogItem[];
  total: number;
}

/**
 * Fetch all catalog items with optional filters
 */
export function useCatalogItems(params: CatalogListParams = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () =>
      apiClient.get<CatalogListResponse>(`/api/catalog${queryString ? `?${queryString}` : ''}`),
  });
}

/**
 * Fetch catalog items by category
 */
export function useCatalogByCategory(category: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.byCategory(category!),
    queryFn: () =>
      apiClient.get<CatalogListResponse>(`/api/catalog?category=${encodeURIComponent(category!)}`),
    enabled: !!category,
  });
}

/**
 * Fetch a single catalog item by ID
 */
export function useCatalogItem(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => apiClient.get<CatalogItem>(`/api/catalog/${id}`),
    enabled: !!id,
  });
}

/**
 * Create a new catalog item
 */
export function useCreateCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCatalogItem) =>
      apiClient.post<CatalogItem>('/api/catalog', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Update an existing catalog item
 */
export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCatalogItem }) =>
      apiClient.patch<CatalogItem>(`/api/catalog/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Delete a catalog item
 */
export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/catalog/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}
