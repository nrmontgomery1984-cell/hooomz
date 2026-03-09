'use client';

/**
 * Punch List Hooks
 *
 * usePunchListByProject(projectId) — all items for a project
 * usePunchListOpenCount(projectId) — count of open items
 * Mutations: create, resolve, verify, reopen, delete
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { PunchListItem, CreatePunchListItem } from '../types/punchList.types';

const PUNCH_KEYS = {
  byProject: (id: string) => ['punchList', 'project', id] as const,
  openCount: (id: string) => ['punchList', 'openCount', id] as const,
};

export function usePunchListByProject(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<PunchListItem[]>({
    queryKey: PUNCH_KEYS.byProject(projectId ?? ''),
    queryFn: () => services!.punchList.findByProject(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 10_000,
  });
}

export function usePunchListOpenCount(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<number>({
    queryKey: PUNCH_KEYS.openCount(projectId ?? ''),
    queryFn: () => services!.punchList.countOpenByProject(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 10_000,
  });
}

function useInvalidatePunch(projectId: string | undefined) {
  const qc = useQueryClient();
  return () => {
    if (projectId) {
      qc.invalidateQueries({ queryKey: PUNCH_KEYS.byProject(projectId) });
      qc.invalidateQueries({ queryKey: PUNCH_KEYS.openCount(projectId) });
    }
  };
}

export function useCreatePunchItem(projectId: string | undefined) {
  const { services } = useServicesContext();
  const invalidate = useInvalidatePunch(projectId);

  return useMutation({
    mutationFn: (data: CreatePunchListItem) => services!.punchList.create(data),
    onSuccess: invalidate,
  });
}

export function useResolvePunchItem(projectId: string | undefined) {
  const { services } = useServicesContext();
  const invalidate = useInvalidatePunch(projectId);

  return useMutation({
    mutationFn: (id: string) => services!.punchList.resolve(id),
    onSuccess: invalidate,
  });
}

export function useVerifyPunchItem(projectId: string | undefined) {
  const { services } = useServicesContext();
  const invalidate = useInvalidatePunch(projectId);

  return useMutation({
    mutationFn: (id: string) => services!.punchList.verify(id),
    onSuccess: invalidate,
  });
}

export function useReopenPunchItem(projectId: string | undefined) {
  const { services } = useServicesContext();
  const invalidate = useInvalidatePunch(projectId);

  return useMutation({
    mutationFn: (id: string) => services!.punchList.reopen(id),
    onSuccess: invalidate,
  });
}

export function useDeletePunchItem(projectId: string | undefined) {
  const { services } = useServicesContext();
  const invalidate = useInvalidatePunch(projectId);

  return useMutation({
    mutationFn: (id: string) => services!.punchList.delete(id),
    onSuccess: invalidate,
  });
}
