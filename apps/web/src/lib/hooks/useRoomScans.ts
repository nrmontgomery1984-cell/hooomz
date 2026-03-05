'use client';

/**
 * RoomScan Hooks — query and mutate RoomScan + Room records.
 * Reads from roomScans / rooms IndexedDB stores via RoomScanService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import type { UpdateRoom } from '../types/roomScan.types';

// ============================================================================
// RoomScan Query Hooks
// ============================================================================

export function useRoomScans(jobId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.roomScans.byJob(jobId ?? ''),
    queryFn: async () => {
      if (!services || !jobId) return [];
      return services.roomScan.findScansByJob(jobId);
    },
    enabled: !servicesLoading && !!services && !!jobId,
    staleTime: 5_000,
  });
}

export function useRoomScan(scanId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.roomScans.detail(scanId ?? ''),
    queryFn: async () => {
      if (!services || !scanId) return null;
      return services.roomScan.findScanById(scanId);
    },
    enabled: !servicesLoading && !!services && !!scanId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

// ============================================================================
// Room Query Hooks
// ============================================================================

export function useRooms(jobId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.rooms.byJob(jobId ?? ''),
    queryFn: async () => {
      if (!services || !jobId) return [];
      return services.roomScan.findRoomsByJob(jobId);
    },
    enabled: !servicesLoading && !!services && !!jobId,
    staleTime: 5_000,
  });
}

export function useRoomsByScan(scanId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.rooms.byScan(scanId ?? ''),
    queryFn: async () => {
      if (!services || !scanId) return [];
      return services.roomScan.findRoomsByScan(scanId);
    },
    enabled: !servicesLoading && !!services && !!scanId,
    staleTime: 5_000,
  });
}

export function useRoom(roomId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.rooms.detail(roomId ?? ''),
    queryFn: async () => {
      if (!services || !roomId) return null;
      return services.roomScan.findRoomById(roomId);
    },
    enabled: !servicesLoading && !!services && !!roomId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useImportRoomScan() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      filename,
      xmlString,
    }: {
      jobId: string;
      filename: string;
      xmlString: string;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.roomScan.importFromXML(jobId, filename, xmlString);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.roomScans.byJob(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.rooms.byJob(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useDeleteRoomScan() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; jobId: string }) => {
      if (!services) throw new Error('Services not initialized');
      return services.roomScan.deleteScan(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.roomScans.byJob(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.rooms.byJob(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

export function useUpdateRoom() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      changes,
    }: {
      id: string;
      jobId: string;
      scanId: string;
      changes: UpdateRoom;
    }) => {
      if (!services) throw new Error('Services not initialized');
      return services.roomScan.updateRoom(id, changes);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.rooms.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.rooms.byJob(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.rooms.byScan(variables.scanId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

// ─── Demo Seed ────────────────────────────────────────────────────────────────

export function useSeedDemoRooms() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => {
      if (!services) throw new Error('Services not initialized');
      return services.roomScan.seedDemoRooms(jobId);
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.roomScans.byJob(jobId) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.rooms.byJob(jobId) });
    },
  });
}
