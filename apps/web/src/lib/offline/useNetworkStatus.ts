'use client';

/**
 * useNetworkStatus Hook
 *
 * Provides network connectivity status for offline-first operation.
 * Uses navigator.onLine and online/offline events.
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: Works when cell signal is spotty
 * - #1 Activity Log: Enables queuing when offline
 */

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  /** Whether the device appears to be online */
  isOnline: boolean;
  /** Timestamp of last status change */
  lastChanged: Date | null;
  /** Whether we've detected network issues (failed requests while "online") */
  hasNetworkIssues: boolean;
}

/**
 * Hook to track network connectivity status
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastChanged: null,
    hasNetworkIssues: false,
  }));

  const handleOnline = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isOnline: true,
      lastChanged: new Date(),
      hasNetworkIssues: false,
    }));
  }, []);

  const handleOffline = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isOnline: false,
      lastChanged: new Date(),
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}

/**
 * Mark that we've detected network issues
 * (e.g., requests failing despite navigator.onLine === true)
 */
export function markNetworkIssue(): void {
  // This is a simple approach - in production you might want
  // to use a context or event emitter for this
  window.dispatchEvent(new CustomEvent('network-issue'));
}

/**
 * Simple check if browser reports online status
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export default useNetworkStatus;
