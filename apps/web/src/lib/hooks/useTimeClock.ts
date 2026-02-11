'use client';

/**
 * Time Clock React Query Hooks (Build 3a)
 *
 * Provides queries and mutations for the time clock system.
 * All mutations invalidate relevant queries on success.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../services/ServicesContext';
import type { TimeClockService } from '../services/timeClock.service';

// ============================================================================
// Query Keys
// ============================================================================

export const timeClockKeys = {
  all: ['timeClock'] as const,
  state: (crewMemberId: string) => ['timeClock', 'state', crewMemberId] as const,
  todayEntries: (crewMemberId: string) => ['timeClock', 'todayEntries', crewMemberId] as const,
  todayTotal: (crewMemberId: string) => ['timeClock', 'todayTotal', crewMemberId] as const,
  taskEntries: (taskId: string) => ['timeClock', 'taskEntries', taskId] as const,
  taskTotal: (taskId: string) => ['timeClock', 'taskTotal', taskId] as const,
};

// ============================================================================
// Helper — get TimeClockService from Services
// ============================================================================

function useTimeClockService(): TimeClockService {
  const services = useServices();
  return services.timeClock;
}

// ============================================================================
// Queries
// ============================================================================

export function useTimeClockState(crewMemberId: string | null) {
  const service = useTimeClockService();

  return useQuery({
    queryKey: timeClockKeys.state(crewMemberId || ''),
    queryFn: () => service.getCurrentState(crewMemberId!),
    enabled: !!crewMemberId,
    staleTime: 5_000,
  });
}

export function useTodayEntries(crewMemberId: string | null) {
  const service = useTimeClockService();

  return useQuery({
    queryKey: timeClockKeys.todayEntries(crewMemberId || ''),
    queryFn: () => service.getTodayEntries(crewMemberId!),
    enabled: !!crewMemberId,
    staleTime: 10_000,
  });
}

export function useTodayTotal(crewMemberId: string | null) {
  const service = useTimeClockService();

  return useQuery({
    queryKey: timeClockKeys.todayTotal(crewMemberId || ''),
    queryFn: () => service.getTodayTotalMinutes(crewMemberId!),
    enabled: !!crewMemberId,
    staleTime: 10_000,
  });
}

export function useTaskTime(taskId: string | null) {
  const service = useTimeClockService();

  return useQuery({
    queryKey: timeClockKeys.taskTotal(taskId || ''),
    queryFn: () => service.getTaskTotalMinutes(taskId!),
    enabled: !!taskId,
    staleTime: 10_000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useClockIn() {
  const service = useTimeClockService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      crewMemberId: string;
      crewMemberName: string;
      projectId: string;
      taskId: string;
      taskTitle: string;
      hourlyRate?: number;
    }) => service.clockIn(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: timeClockKeys.state(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayEntries(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayTotal(variables.crewMemberId) });
    },
  });
}

export function useClockOut() {
  const service = useTimeClockService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { crewMemberId: string; crewMemberName: string }) =>
      service.clockOut(params.crewMemberId, params.crewMemberName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: timeClockKeys.state(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayEntries(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayTotal(variables.crewMemberId) });
    },
  });
}

export function useSwitchTask() {
  const service = useTimeClockService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      crewMemberId: string;
      crewMemberName: string;
      newTaskId: string;
      newTaskTitle: string;
    }) => service.switchTask(params.crewMemberId, params.crewMemberName, params.newTaskId, params.newTaskTitle),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: timeClockKeys.state(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayEntries(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayTotal(variables.crewMemberId) });
    },
  });
}

export function useCompleteTimedTask() {
  const service = useTimeClockService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { crewMemberId: string; crewMemberName: string }) =>
      service.completeCurrentTask(params.crewMemberId, params.crewMemberName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: timeClockKeys.state(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayEntries(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayTotal(variables.crewMemberId) });
    },
  });
}

export function useStartBreak() {
  const service = useTimeClockService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { crewMemberId: string }) =>
      service.startBreak(params.crewMemberId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: timeClockKeys.state(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayEntries(variables.crewMemberId) });
    },
  });
}

export function useEndBreak() {
  const service = useTimeClockService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      crewMemberId: string;
      resumeTaskId?: string;
      resumeTaskTitle?: string;
    }) => service.endBreak(params.crewMemberId, params.resumeTaskId, params.resumeTaskTitle),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: timeClockKeys.state(variables.crewMemberId) });
      queryClient.invalidateQueries({ queryKey: timeClockKeys.todayEntries(variables.crewMemberId) });
    },
  });
}
