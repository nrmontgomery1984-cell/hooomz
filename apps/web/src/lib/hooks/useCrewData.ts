'use client';

/**
 * Crew, Training, and Budget hooks (Build 3c)
 * Offline-first: reads from IndexedDB via services
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type {
  SupervisedCompletion,
} from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const CREW_QUERY_KEYS = {
  members: {
    all: ['crew', 'members'] as const,
    active: ['crew', 'members', 'active'] as const,
    detail: (id: string) => ['crew', 'members', 'detail', id] as const,
  },
  training: {
    all: ['crew', 'training'] as const,
    byCrewMember: (crewMemberId: string) => ['crew', 'training', 'crew', crewMemberId] as const,
    bySop: (sopId: string) => ['crew', 'training', 'sop', sopId] as const,
    byCrewAndSop: (crewMemberId: string, sopId: string) =>
      ['crew', 'training', 'crewSop', crewMemberId, sopId] as const,
    summary: (crewMemberId: string) => ['crew', 'training', 'summary', crewMemberId] as const,
  },
  budget: {
    all: ['crew', 'budget'] as const,
    byTask: (taskId: string) => ['crew', 'budget', 'task', taskId] as const,
    byProject: (projectId: string) => ['crew', 'budget', 'project', projectId] as const,
    projectSummary: (projectId: string) => ['crew', 'budget', 'projectSummary', projectId] as const,
    overBudget: ['crew', 'budget', 'overBudget'] as const,
  },
};

// ============================================================================
// Crew Member Hooks
// ============================================================================

export function useCrewMembers() {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.members.all,
    queryFn: () => services!.crew.findAll(),
    enabled: !servicesLoading && !!services,
    staleTime: 30_000,
  });
}

export function useActiveCrewMembers() {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.members.active,
    queryFn: () => services!.crew.findActive(),
    enabled: !servicesLoading && !!services,
    staleTime: 30_000,
  });
}

export function useCrewMember(id: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.members.detail(id || ''),
    queryFn: () => services!.crew.findById(id!),
    enabled: !servicesLoading && !!services && !!id,
    staleTime: 30_000,
  });
}

// ============================================================================
// Training Hooks
// ============================================================================

export function useTrainingRecords() {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.training.all,
    queryFn: () => services!.training.findAll(),
    enabled: !servicesLoading && !!services,
    staleTime: 10_000,
  });
}

export function useCrewTrainingRecords(crewMemberId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.training.byCrewMember(crewMemberId || ''),
    queryFn: () => services!.training.findByCrewMember(crewMemberId!),
    enabled: !servicesLoading && !!services && !!crewMemberId,
    staleTime: 10_000,
  });
}

export function useCrewTrainingSummary(crewMemberId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.training.summary(crewMemberId || ''),
    queryFn: () => services!.training.getCrewTrainingSummary(crewMemberId!),
    enabled: !servicesLoading && !!services && !!crewMemberId,
    staleTime: 10_000,
  });
}

export function useTrainingRecord(crewMemberId: string | null, sopId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.training.byCrewAndSop(crewMemberId || '', sopId || ''),
    queryFn: () => services!.training.findByCrewAndSop(crewMemberId!, sopId!),
    enabled: !servicesLoading && !!services && !!crewMemberId && !!sopId,
    staleTime: 10_000,
  });
}

export function useSopTrainingStatus(sopId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.training.bySop(sopId || ''),
    queryFn: () => services!.training.getSopTrainingStatus(sopId!),
    enabled: !servicesLoading && !!services && !!sopId,
    staleTime: 10_000,
  });
}

export function useRecordSupervisedCompletion() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: async (params: {
      crewMemberId: string;
      sopId: string;
      completion: SupervisedCompletion;
    }) => {
      return services!.training.recordSupervisedCompletion(
        params.crewMemberId,
        params.sopId,
        params.completion,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew', 'training'] });
    },
  });
}

export function useRecordReviewAttempt() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: async (params: {
      crewMemberId: string;
      sopId: string;
      attempt: { date: string; score: number; passed: boolean; reviewedBy: string; notes: string | null };
    }) => {
      return services!.training.recordReviewAttempt(
        params.crewMemberId,
        params.sopId,
        params.attempt,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew', 'training'] });
    },
  });
}

export function useCertifyCrew() {
  const queryClient = useQueryClient();
  const { services } = useServicesContext();

  return useMutation({
    mutationFn: async (params: {
      crewMemberId: string;
      sopId: string;
      certifiedBy: string;
    }) => {
      return services!.training.certify(
        params.crewMemberId,
        params.sopId,
        params.certifiedBy,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew', 'training'] });
    },
  });
}

// ============================================================================
// Budget Hooks
// ============================================================================

export function useTaskBudget(taskId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.budget.byTask(taskId || ''),
    queryFn: () => services!.budget.findByTask(taskId!),
    enabled: !servicesLoading && !!services && !!taskId,
    staleTime: 5_000,
  });
}

export function useProjectBudgets(projectId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.budget.byProject(projectId || ''),
    queryFn: () => services!.budget.findByProject(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

export function useProjectBudgetSummary(projectId: string | null) {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.budget.projectSummary(projectId || ''),
    queryFn: () => services!.budget.getProjectBudgetSummary(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

export function useOverBudgetTasks() {
  const { services, isLoading: servicesLoading } = useServicesContext();
  return useQuery({
    queryKey: CREW_QUERY_KEYS.budget.overBudget,
    queryFn: () => services!.budget.findOverBudget(),
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}
