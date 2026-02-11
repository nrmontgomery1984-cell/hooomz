'use client';

/**
 * Activity Log API Hooks
 * React Query hooks for the activity event feed
 *
 * The Activity Log is THE SPINE of Hooomz:
 * - Every action writes an immutable event
 * - Events are never edited or deleted
 * - All dashboards and reports derive from events
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

const QUERY_KEYS = {
  all: ['activity'] as const,
  project: (projectId: string, limit: number) =>
    [...QUERY_KEYS.all, 'project', projectId, limit] as const,
  recent: (limit: number) => [...QUERY_KEYS.all, 'recent', limit] as const,
  infinite: (projectId?: string) => [...QUERY_KEYS.all, 'infinite', projectId] as const,
};

/**
 * Activity event from the immutable log
 */
export interface ActivityEvent {
  id: string;
  event_type: string;
  timestamp: string;

  // Actor
  actor_id: string;
  actor_type: 'team_member' | 'system' | 'customer';
  actor_name?: string; // Denormalized for display

  // Context
  organization_id: string;
  project_id: string;
  project_name?: string; // Denormalized for display

  // Three-Axis Metadata
  work_category_code: string | null;
  stage_code: string | null;
  location_id: string | null;

  // Entity Reference
  entity_type: string;
  entity_id: string;

  // Visibility
  homeowner_visible: boolean;

  // Event-Specific Payload
  event_data: Record<string, unknown>;

  // Offline sync status (optimistic UI)
  _syncStatus?: 'pending' | 'syncing' | 'failed';
}

/**
 * Paginated activity response
 */
export interface ActivityResponse {
  events: ActivityEvent[];
  total: number;
  nextCursor?: number;
}

/**
 * Fetch activity for a specific project
 * Shows all events related to a project in reverse chronological order
 */
export function useProjectActivity(projectId: string, limit = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.project(projectId, limit),
    queryFn: () =>
      apiClient.get<ActivityResponse>(
        `/api/projects/${projectId}/activity?limit=${limit}`
      ),
    enabled: !!projectId,
    staleTime: 10 * 1000, // 10 seconds - activity updates frequently
  });
}

/**
 * Fetch recent activity across all projects
 * Used for the main activity feed on the dashboard
 */
export function useRecentActivity(limit = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.recent(limit),
    queryFn: () =>
      apiClient.get<ActivityResponse>(`/api/activity/recent?limit=${limit}`),
    staleTime: 10 * 1000,
  });
}

/**
 * Infinite scroll activity feed
 * Supports both project-specific and global activity
 */
export function useActivityInfinite(projectId?: string) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.infinite(projectId),
    queryFn: async ({ pageParam = 0 }) => {
      const url = projectId
        ? `/api/projects/${projectId}/activity?cursor=${pageParam}&limit=20`
        : `/api/activity/recent?cursor=${pageParam}&limit=20`;
      return apiClient.get<ActivityResponse>(url);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
}

/**
 * Create a new activity event
 * This should be called by other actions, not directly by UI
 * But exposed for manual event creation when needed
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      event_type: string;
      project_id: string;
      entity_type: string;
      entity_id: string;
      event_data: Record<string, unknown>;
      homeowner_visible?: boolean;
      work_category_code?: string;
      stage_code?: string;
      location_id?: string;
    }) => apiClient.post<ActivityEvent>('/api/activity', data),
    onSuccess: (data) => {
      // Invalidate both project-specific and global activity feeds
      queryClient.invalidateQueries({
        queryKey: ['activity', 'project', data.project_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['activity', 'recent'],
      });
      queryClient.invalidateQueries({
        queryKey: ['activity', 'infinite'],
      });
    },
  });
}

/**
 * Event type categories for filtering
 */
export const EVENT_CATEGORIES = {
  project: ['project.created', 'project.status_changed', 'project.completed'],
  task: [
    'task.template_created',
    'task.instance_created',
    'task.status_changed',
    'task.completed',
    'task.blocked',
  ],
  time: ['time.clock_in', 'time.clock_out', 'time.entry_approved'],
  financial: [
    'estimate.created',
    'estimate.sent',
    'estimate.approved',
    'change_order.created',
    'invoice.created',
    'payment.received',
  ],
  field: [
    'photo.uploaded',
    'photo.shared',
    'inspection.passed',
    'inspection.failed',
    'field_note.created',
  ],
} as const;
