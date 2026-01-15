/**
 * Sync Queue
 * Tracks changes made offline for syncing when connection is restored
 */

import type { StorageAdapter, StoreName } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  storeName: StoreName;
  entityId: string;
  data?: any;
  timestamp: string;
  synced: boolean;
  retryCount: number;
  error?: string;
}

export class SyncQueue {
  private static instance: SyncQueue | null = null;
  private storage: StorageAdapter;
  private storeName = StoreNames.SYNC_QUEUE;

  private constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Get singleton instance
   */
  static getInstance(storage: StorageAdapter): SyncQueue {
    if (!SyncQueue.instance) {
      SyncQueue.instance = new SyncQueue(storage);
    }
    return SyncQueue.instance;
  }

  /**
   * Generate unique ID for queue item
   */
  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Queue a create operation
   */
  async queueCreate(
    storeName: StoreName,
    entityId: string,
    data: any
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: this.generateId(),
      operation: 'create',
      storeName,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    await this.storage.set(this.storeName, item.id, item);
  }

  /**
   * Queue an update operation
   */
  async queueUpdate(
    storeName: StoreName,
    entityId: string,
    data: any
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: this.generateId(),
      operation: 'update',
      storeName,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    await this.storage.set(this.storeName, item.id, item);
  }

  /**
   * Queue a delete operation
   */
  async queueDelete(storeName: StoreName, entityId: string): Promise<void> {
    const item: SyncQueueItem = {
      id: this.generateId(),
      operation: 'delete',
      storeName,
      entityId,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    await this.storage.set(this.storeName, item.id, item);
  }

  /**
   * Get all pending sync items
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    const allItems = await this.storage.getAll<SyncQueueItem>(this.storeName);
    return allItems.filter((item) => !item.synced);
  }

  /**
   * Get sync items for a specific store
   */
  async getPendingItemsForStore(
    storeName: StoreName
  ): Promise<SyncQueueItem[]> {
    const pending = await this.getPendingItems();
    return pending.filter((item) => item.storeName === storeName);
  }

  /**
   * Mark an item as synced
   */
  async markAsSynced(itemId: string): Promise<void> {
    const item = await this.storage.get<SyncQueueItem>(this.storeName, itemId);
    if (item) {
      item.synced = true;
      await this.storage.set(this.storeName, itemId, item);
    }
  }

  /**
   * Mark an item as failed with error
   */
  async markAsFailed(itemId: string, error: string): Promise<void> {
    const item = await this.storage.get<SyncQueueItem>(this.storeName, itemId);
    if (item) {
      item.retryCount += 1;
      item.error = error;
      await this.storage.set(this.storeName, itemId, item);
    }
  }

  /**
   * Get count of pending items
   */
  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingItems();
    return pending.length;
  }

  /**
   * Clear all synced items
   */
  async clearSynced(): Promise<void> {
    const allItems = await this.storage.getAll<SyncQueueItem>(this.storeName);
    const syncedItems = allItems.filter((item) => item.synced);

    for (const item of syncedItems) {
      await this.storage.delete(this.storeName, item.id);
    }
  }

  /**
   * Clear all items (for testing/reset)
   */
  async clearAll(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
