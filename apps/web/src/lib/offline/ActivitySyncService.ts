/**
 * Activity Sync Service
 *
 * Handles syncing queued activity events to the server when online.
 * Implements FIFO ordering and exponential backoff for retries.
 *
 * Decision Filter Check:
 * - #6 Mobile/Field: Syncs automatically when connection restored
 * - #1 Activity Log: Ensures all events eventually reach the server
 * - #7 Traceability: local_id enables duplicate detection
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue, type SyncQueueItem } from '../repositories/SyncQueue';
import { isOnline } from './useNetworkStatus';

/**
 * Sync result for a single item
 */
export interface SyncItemResult {
  itemId: string;
  success: boolean;
  error?: string;
}

/**
 * Overall sync result
 */
export interface SyncResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: SyncItemResult[];
}

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMs: [1000, 5000, 30000], // 1s, 5s, 30s
};

/**
 * Activity Sync Service
 * Singleton that manages syncing activity events to the server
 */
export class ActivitySyncService {
  private static instance: ActivitySyncService | null = null;
  private syncQueue: SyncQueue;
  private isSyncing = false;
  private syncListeners: Set<(result: SyncResult) => void> = new Set();
  private pendingCountListeners: Set<(count: number) => void> = new Set();

  private constructor(storage: StorageAdapter) {
    this.syncQueue = SyncQueue.getInstance(storage);
    this.setupNetworkListener();
  }

  /**
   * Get singleton instance
   */
  static getInstance(storage: StorageAdapter): ActivitySyncService {
    if (!ActivitySyncService.instance) {
      ActivitySyncService.instance = new ActivitySyncService(storage);
    }
    return ActivitySyncService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    ActivitySyncService.instance = null;
  }

  /**
   * Setup listener for network restoration
   */
  private setupNetworkListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      // Small delay to let connection stabilize
      setTimeout(() => {
        this.onNetworkRestore();
      }, 1000);
    });
  }

  /**
   * Called when network is restored
   * Triggers sync of pending items
   */
  async onNetworkRestore(): Promise<void> {
    if (!isOnline()) return;
    await this.syncPending();
  }

  /**
   * Process pending sync queue in FIFO order
   */
  async syncPending(): Promise<SyncResult> {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      return { processed: 0, succeeded: 0, failed: 0, results: [] };
    }

    if (!isOnline()) {
      return { processed: 0, succeeded: 0, failed: 0, results: [] };
    }

    this.isSyncing = true;

    const result: SyncResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    };

    try {
      // Get pending items for activity events, sorted by timestamp (FIFO)
      const pendingItems = await this.syncQueue.getPendingItemsForStore(
        StoreNames.ACTIVITY_EVENTS
      );

      // Sort by timestamp to ensure FIFO
      pendingItems.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      for (const item of pendingItems) {
        // Skip items that have exceeded max retries
        if (item.retryCount >= RETRY_CONFIG.maxRetries) {
          continue;
        }

        const itemResult = await this.syncItem(item);
        result.results.push(itemResult);
        result.processed++;

        if (itemResult.success) {
          result.succeeded++;
        } else {
          result.failed++;
        }
      }

      // Notify listeners
      this.notifySyncListeners(result);
      await this.notifyPendingCountListeners();
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync a single item to the server
   */
  private async syncItem(item: SyncQueueItem): Promise<SyncItemResult> {
    try {
      // TODO: Replace with actual API call when backend is ready
      // For now, simulate API call
      const response = await this.sendToServer(item);

      if (response.success) {
        await this.syncQueue.markAsSynced(item.id);
        return { itemId: item.id, success: true };
      } else {
        await this.syncQueue.markAsFailed(item.id, response.error || 'Unknown error');
        return { itemId: item.id, success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Network error';
      await this.syncQueue.markAsFailed(item.id, errorMessage);
      return { itemId: item.id, success: false, error: errorMessage };
    }
  }

  /**
   * Send item to server (placeholder for actual API call)
   */
  private async sendToServer(
    _item: SyncQueueItem
  ): Promise<{ success: boolean; error?: string }> {
    // TODO: Implement actual API call
    // This would look something like:
    //
    // const response = await fetch('/api/activity', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     ...item.data,
    //     local_id: item.entityId, // For duplicate detection
    //   }),
    // });
    //
    // if (!response.ok) {
    //   throw new Error(`HTTP ${response.status}`);
    // }
    //
    // return { success: true };

    // For now, simulate successful sync after a short delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate 95% success rate for testing
    if (Math.random() > 0.95) {
      return { success: false, error: 'Simulated server error' };
    }

    return { success: true };
  }

  /**
   * Retry failed items with exponential backoff
   */
  async retryFailed(): Promise<SyncResult> {
    if (!isOnline()) {
      return { processed: 0, succeeded: 0, failed: 0, results: [] };
    }

    const pendingItems = await this.syncQueue.getPendingItemsForStore(
      StoreNames.ACTIVITY_EVENTS
    );

    // Filter to items that have failed at least once but not exceeded max retries
    const failedItems = pendingItems.filter(
      (item) => item.error && item.retryCount < RETRY_CONFIG.maxRetries
    );

    const result: SyncResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    };

    for (const item of failedItems) {
      // Calculate backoff delay
      const backoffIndex = Math.min(
        item.retryCount,
        RETRY_CONFIG.backoffMs.length - 1
      );
      const backoffMs = RETRY_CONFIG.backoffMs[backoffIndex];

      // Wait for backoff period
      await new Promise((resolve) => setTimeout(resolve, backoffMs));

      const itemResult = await this.syncItem(item);
      result.results.push(itemResult);
      result.processed++;

      if (itemResult.success) {
        result.succeeded++;
      } else {
        result.failed++;
      }
    }

    this.notifySyncListeners(result);
    await this.notifyPendingCountListeners();

    return result;
  }

  /**
   * Get count of pending (unsynced) activity events
   */
  async getPendingCount(): Promise<number> {
    const pendingItems = await this.syncQueue.getPendingItemsForStore(
      StoreNames.ACTIVITY_EVENTS
    );
    return pendingItems.filter(
      (item) => item.retryCount < RETRY_CONFIG.maxRetries
    ).length;
  }

  /**
   * Get count of permanently failed items (exceeded max retries)
   */
  async getFailedCount(): Promise<number> {
    const pendingItems = await this.syncQueue.getPendingItemsForStore(
      StoreNames.ACTIVITY_EVENTS
    );
    return pendingItems.filter(
      (item) => item.retryCount >= RETRY_CONFIG.maxRetries
    ).length;
  }

  /**
   * Get all pending activity events (for display in UI)
   */
  async getPendingEvents(): Promise<SyncQueueItem[]> {
    return this.syncQueue.getPendingItemsForStore(StoreNames.ACTIVITY_EVENTS);
  }

  /**
   * Clear synced items from queue
   */
  async clearSynced(): Promise<void> {
    await this.syncQueue.clearSynced();
    await this.notifyPendingCountListeners();
  }

  /**
   * Subscribe to sync completion events
   */
  onSyncComplete(listener: (result: SyncResult) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Subscribe to pending count changes
   */
  onPendingCountChange(listener: (count: number) => void): () => void {
    this.pendingCountListeners.add(listener);
    return () => this.pendingCountListeners.delete(listener);
  }

  /**
   * Notify sync listeners
   */
  private notifySyncListeners(result: SyncResult): void {
    this.syncListeners.forEach((listener) => listener(result));
  }

  /**
   * Notify pending count listeners
   */
  private async notifyPendingCountListeners(): Promise<void> {
    const count = await this.getPendingCount();
    this.pendingCountListeners.forEach((listener) => listener(count));
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export default ActivitySyncService;
