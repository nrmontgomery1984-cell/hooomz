'use client';

/**
 * Task API Hooks
 * React Query hooks for task/scheduling operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Task, CreateTask, UpdateTask } from '@hooomz/shared-contracts';
import { TaskStatus } from '@hooomz/shared-contracts';

const QUERY_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  byProject: (projectId: string) => [...QUERY_KEYS.all, 'project', projectId] as const,
  myTasks: () => [...QUERY_KEYS.all, 'my-tasks'] as const,
};

interface TaskListParams {
  projectId?: string;
  status?: TaskStatus;
  assigneeId?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

interface TaskListResponse {
  tasks: Task[];
  total: number;
}

/**
 * Fetch all tasks with optional filters
 */
export function useTasks(params: TaskListParams = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () =>
      apiClient.get<TaskListResponse>(`/api/tasks${queryString ? `?${queryString}` : ''}`),
  });
}

/**
 * Fetch tasks for a specific project
 */
export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.byProject(projectId!),
    queryFn: () =>
      apiClient.get<TaskListResponse>(`/api/tasks?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

/**
 * Fetch current user's tasks
 */
export function useMyTasks() {
  return useQuery({
    queryKey: QUERY_KEYS.myTasks(),
    queryFn: () => apiClient.get<TaskListResponse>('/api/tasks/my-tasks'),
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => apiClient.get<Task>(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTask) =>
      apiClient.post<Task>('/api/tasks', data),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (task.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(task.projectId) });
      }
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTask }) =>
      apiClient.patch<Task>(`/api/tasks/${id}`, data),
    onSuccess: (task, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      if (task.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(task.projectId) });
      }
    },
  });
}

/**
 * Update task status
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      apiClient.patch<Task>(`/api/tasks/${id}/status`, { status }),
    onSuccess: (task, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myTasks() });
      if (task.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byProject(task.projectId) });
      }
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myTasks() });
    },
  });
}
