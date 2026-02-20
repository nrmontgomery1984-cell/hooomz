'use client';

/**
 * Schedule Hooks — React Query hooks for calendar/scheduling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { CrewScheduleStatus } from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const SCHEDULE_QUERY_KEYS = {
  weekSchedule: (crewId: string, weekStart: string) =>
    ['schedule', 'week', crewId, weekStart] as const,
  projectWeekSchedule: (projectId: string, weekStart: string) =>
    ['schedule', 'project', projectId, weekStart] as const,
  teamWeekSchedule: (weekStart: string) =>
    ['schedule', 'team', weekStart] as const,
  unscheduledTasks: (projectId?: string) =>
    ['schedule', 'unscheduled', projectId ?? 'all'] as const,
  dayHours: (crewId: string, date: string) =>
    ['schedule', 'hours', 'day', crewId, date] as const,
  weekHours: (crewId: string, weekStart: string) =>
    ['schedule', 'hours', 'week', crewId, weekStart] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useWeekSchedule(crewId: string, weekStart: string) {
  const { services } = useServicesContext();
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.weekSchedule(crewId, weekStart),
    queryFn: () => services!.schedule.getWeekSchedule(crewId, weekStart),
    enabled: !!services && !!crewId && !!weekStart,
  });
}

export function useProjectWeekSchedule(projectId: string, weekStart: string) {
  const { services } = useServicesContext();
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.projectWeekSchedule(projectId, weekStart),
    queryFn: () => services!.schedule.getProjectWeekSchedule(projectId, weekStart),
    enabled: !!services && !!projectId && !!weekStart,
  });
}

export function useTeamWeekSchedule(weekStart: string) {
  const { services } = useServicesContext();
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.teamWeekSchedule(weekStart),
    queryFn: () => services!.schedule.getTeamWeekSchedule(weekStart),
    enabled: !!services && !!weekStart,
  });
}

export function useUnscheduledTasks(projectId?: string) {
  const { services } = useServicesContext();
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.unscheduledTasks(projectId),
    queryFn: () => services!.schedule.getUnscheduledTasks(projectId),
    enabled: !!services,
  });
}

export function useDayHours(crewId: string, date: string) {
  const { services } = useServicesContext();
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.dayHours(crewId, date),
    queryFn: () => services!.schedule.getDayHours(crewId, date),
    enabled: !!services && !!crewId && !!date,
  });
}

export function useWeekHours(crewId: string, weekStart: string) {
  const { services } = useServicesContext();
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.weekHours(crewId, weekStart),
    queryFn: () => services!.schedule.getWeekHours(crewId, weekStart),
    enabled: !!services && !!crewId && !!weekStart,
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useScheduleTask() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      taskId: string;
      crewMemberId: string;
      date: string;
      startTime?: string;
      endTime?: string;
      estimatedHours?: number;
    }) => services!.schedule.scheduleTask(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

export function useRescheduleBlock() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      blockId: string;
      newDate: string;
      newStartTime?: string;
      newEndTime?: string;
    }) => services!.schedule.rescheduleBlock(
      params.blockId,
      params.newDate,
      params.newStartTime,
      params.newEndTime,
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

export function useUnscheduleBlock() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockId: string) => services!.schedule.unscheduleBlock(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

export function useUpdateBlockStatus() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { blockId: string; status: CrewScheduleStatus }) =>
      services!.schedule.updateBlockStatus(params.blockId, params.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

export function useBulkSchedule() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignments: Array<{
      taskId: string;
      crewMemberId: string;
      date: string;
      startTime?: string;
      endTime?: string;
      estimatedHours?: number;
    }>) => services!.schedule.bulkSchedule(assignments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}
