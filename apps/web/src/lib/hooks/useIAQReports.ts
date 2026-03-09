'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StoreNames } from '../storage/StorageAdapter';
import type { IAQReport } from '../types/iaqReport.types';

const IAQ_KEYS = {
  all: ['iaq', 'reports'] as const,
  detail: (id: string) => ['iaq', 'reports', id] as const,
};

async function getStorage() {
  const { initializeStorage } = await import('../storage');
  return initializeStorage();
}

export function useIAQReports() {
  return useQuery({
    queryKey: [...IAQ_KEYS.all],
    queryFn: async () => {
      const storage = await getStorage();
      return storage.getAll<IAQReport>(StoreNames.IAQ_REPORTS);
    },
  });
}

export function useIAQReport(id: string | undefined) {
  return useQuery({
    queryKey: [...IAQ_KEYS.detail(id ?? '')],
    queryFn: async () => {
      const storage = await getStorage();
      return storage.get<IAQReport>(StoreNames.IAQ_REPORTS, id!);
    },
    enabled: !!id,
  });
}

export function useSaveIAQReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: IAQReport) => {
      const storage = await getStorage();
      await storage.set(StoreNames.IAQ_REPORTS, report.id, report);
      return report;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...IAQ_KEYS.all] });
    },
  });
}
