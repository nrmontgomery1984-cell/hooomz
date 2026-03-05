'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { TrimCalculationInput } from '../types/trim.types';

const KEYS = {
  byRoom:    (roomId: string)    => ['local', 'trimCalculation', 'room', roomId] as const,
  byProject: (projectId: string) => ['local', 'trimCalculation', 'project', projectId] as const,
  config:    ()                  => ['local', 'millworkConfig', 'default'] as const,
};

export function useTrimCalculation(roomId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: KEYS.byRoom(roomId),
    queryFn: () => services!.trimCalculation.findByRoom(roomId),
    enabled: !isLoading && !!services,
    staleTime: 60_000,
  });
}

export function useDefaultMillworkConfig() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: KEYS.config(),
    queryFn: () => services!.trimCalculation.getDefaultConfig(),
    enabled: !isLoading && !!services,
    staleTime: 5 * 60_000,
  });
}

export function useSaveTrimCalculation() {
  const { services } = useServicesContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TrimCalculationInput & { perimeter_mm: number }) =>
      services!.trimCalculation.save(input),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: KEYS.byRoom(result.roomId) });
      qc.invalidateQueries({ queryKey: KEYS.byProject(result.projectId) });
    },
  });
}

export function useDeleteTrimCalculation() {
  const { services } = useServicesContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => services!.trimCalculation.deleteByRoom(roomId),
    onSuccess: (_v, roomId) => {
      qc.invalidateQueries({ queryKey: KEYS.byRoom(roomId) });
    },
  });
}
