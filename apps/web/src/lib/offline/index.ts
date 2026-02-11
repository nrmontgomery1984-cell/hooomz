/**
 * Offline Support Module
 *
 * Provides offline-first capabilities for the Activity Log.
 * Works when cell signal is spotty - never loses data.
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: Works offline on job sites
 * - #1 Activity Log: Queue ensures all events reach server
 */

export { useNetworkStatus, isOnline, markNetworkIssue } from './useNetworkStatus';
export type { NetworkStatus } from './useNetworkStatus';

export { ActivitySyncService } from './ActivitySyncService';
export type { SyncResult, SyncItemResult } from './ActivitySyncService';

export { useSyncStatus } from './useSyncStatus';
export type { SyncStatus } from './useSyncStatus';
