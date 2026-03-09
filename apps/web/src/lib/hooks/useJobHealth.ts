'use client';

/**
 * Job Health Hooks
 *
 * useJobHealth(projectId)      — single project health
 * useAllJobHealth(projectIds)  — batch health for dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { JobHealthResult } from '../constants/threeDot';

const JOB_HEALTH_KEYS = {
  single: (id: string) => ['jobHealth', id] as const,
  batch:  (ids: string[]) => ['jobHealth', 'batch', ...ids] as const,
};

export function useJobHealth(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<JobHealthResult>({
    queryKey: JOB_HEALTH_KEYS.single(projectId ?? ''),
    queryFn: () => services!.jobHealth.getJobHealthStatus(projectId!),
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 15_000,
  });
}

export function useAllJobHealth(projectIds: string[]) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<Map<string, JobHealthResult>>({
    queryKey: JOB_HEALTH_KEYS.batch(projectIds),
    queryFn: async () => {
      const map = new Map<string, JobHealthResult>();
      await Promise.all(
        projectIds.map(async (id) => {
          try {
            const result = await services!.jobHealth.getJobHealthStatus(id);
            map.set(id, result);
          } catch {
            // Skip failed lookups
          }
        }),
      );
      return map;
    },
    enabled: !servicesLoading && !!services && projectIds.length > 0,
    staleTime: 15_000,
  });
}
