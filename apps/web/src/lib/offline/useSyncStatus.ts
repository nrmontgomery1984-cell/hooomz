'use client';

/**
 * useSyncStatus Hook
 *
 * Provides sync status for UI indicators.
 * Shows pending count and sync state.
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: Subtle indicator, not alarming
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { ActivitySyncService } from './ActivitySyncService';
import { initializeStorage } from '../storage';

export interface SyncStatus {
  /** Number of events pending sync */
  pendingCount: number;
  /** Number of permanently failed events */
  failedCount: number;
  /** Whether sync is currently in progress */
  isSyncing: boolean;
  /** Whether device is online */
  isOnline: boolean;
  /** Trigger manual sync */
  triggerSync: () => Promise<void>;
  /** Retry failed items */
  retryFailed: () => Promise<void>;
}

/**
 * Hook to track sync status for UI display
 */
export function useSyncStatus(): SyncStatus {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncService, setSyncService] = useState<ActivitySyncService | null>(null);

  // Initialize sync service
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const storage = await initializeStorage();
        const service = ActivitySyncService.getInstance(storage);

        if (mounted) {
          setSyncService(service);

          // Get initial counts
          const pending = await service.getPendingCount();
          const failed = await service.getFailedCount();
          setPendingCount(pending);
          setFailedCount(failed);
        }
      } catch (error) {
        console.error('Failed to initialize sync service:', error);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to pending count changes
  useEffect(() => {
    if (!syncService) return;

    const unsubscribe = syncService.onPendingCountChange((count) => {
      setPendingCount(count);
      // Also refresh failed count
      syncService.getFailedCount().then(setFailedCount);
    });

    return unsubscribe;
  }, [syncService]);

  // Trigger sync when coming online
  useEffect(() => {
    if (isOnline && syncService && pendingCount > 0) {
      syncService.syncPending();
    }
  }, [isOnline, syncService, pendingCount]);

  /**
   * Manually trigger sync
   */
  const triggerSync = useCallback(async () => {
    if (!syncService || !isOnline) return;

    setIsSyncing(true);
    try {
      await syncService.syncPending();
      const pending = await syncService.getPendingCount();
      const failed = await syncService.getFailedCount();
      setPendingCount(pending);
      setFailedCount(failed);
    } finally {
      setIsSyncing(false);
    }
  }, [syncService, isOnline]);

  /**
   * Retry failed items
   */
  const retryFailed = useCallback(async () => {
    if (!syncService || !isOnline) return;

    setIsSyncing(true);
    try {
      await syncService.retryFailed();
      const pending = await syncService.getPendingCount();
      const failed = await syncService.getFailedCount();
      setPendingCount(pending);
      setFailedCount(failed);
    } finally {
      setIsSyncing(false);
    }
  }, [syncService, isOnline]);

  return {
    pendingCount,
    failedCount,
    isSyncing,
    isOnline,
    triggerSync,
    retryFailed,
  };
}

export default useSyncStatus;
