/**
 * Storage Adapter Interface
 * Abstraction layer for different storage backends
 */

export interface StorageAdapter {
  /**
   * Initialize the storage (create tables, indexes, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Get a single item by key
   */
  get<T>(storeName: string, key: string): Promise<T | null>;

  /**
   * Get all items from a store
   */
  getAll<T>(storeName: string): Promise<T[]>;

  /**
   * Get items matching a query
   */
  query<T>(
    storeName: string,
    predicate: (item: T) => boolean
  ): Promise<T[]>;

  /**
   * Set a single item
   */
  set<T>(storeName: string, key: string, value: T): Promise<void>;

  /**
   * Delete a single item
   */
  delete(storeName: string, key: string): Promise<void>;

  /**
   * Clear all items from a store
   */
  clear(storeName: string): Promise<void>;

  /**
   * Check if storage is available
   */
  isAvailable(): boolean;
}

/**
 * Store names for different entity types
 */
export const StoreNames = {
  PROJECTS: 'projects',
  CUSTOMERS: 'customers',
  LINE_ITEMS: 'lineItems',
  CATALOG_ITEMS: 'catalogItems',
  TASKS: 'tasks',
  INSPECTIONS: 'inspections',
  PHOTOS: 'photos',
  SYNC_QUEUE: 'syncQueue',
} as const;

export type StoreName = (typeof StoreNames)[keyof typeof StoreNames];
