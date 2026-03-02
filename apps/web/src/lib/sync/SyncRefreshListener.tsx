'use client';

/**
 * SyncRefreshListener — Invalidates all React Query caches
 * when cross-device sync pulls new data from Supabase.
 *
 * Listens for the 'hooomz-sync-complete' custom event dispatched
 * by runCrossDeviceSync() in ServicesContext.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function SyncRefreshListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleSyncComplete() {
      // Invalidate all cached queries so they refetch from IndexedDB
      queryClient.invalidateQueries();
    }

    window.addEventListener('hooomz-sync-complete', handleSyncComplete);
    return () => {
      window.removeEventListener('hooomz-sync-complete', handleSyncComplete);
    };
  }, [queryClient]);

  return null;
}
