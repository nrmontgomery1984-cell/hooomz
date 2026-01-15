/**
 * IndexedDB Storage Adapter
 * Offline-first storage implementation using IndexedDB
 */

import type { StorageAdapter, StoreName } from './StorageAdapter';
import { StoreNames } from './StorageAdapter';

const DB_NAME = 'hooomz_db';
const DB_VERSION = 1;

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB with all required object stores
   */
  async initialize(): Promise<void> {
    // Return existing initialization if in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        const stores = Object.values(StoreNames);

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, {
              keyPath: 'id',
            });

            // Create indexes for common queries
            if (storeName === StoreNames.PROJECTS) {
              objectStore.createIndex('customerId', 'customerId', {
                unique: false,
              });
              objectStore.createIndex('status', 'status', { unique: false });
            } else if (storeName === StoreNames.LINE_ITEMS) {
              objectStore.createIndex('estimateId', 'estimateId', {
                unique: false,
              });
            } else if (storeName === StoreNames.TASKS) {
              objectStore.createIndex('projectId', 'projectId', {
                unique: false,
              });
              objectStore.createIndex('assigneeId', 'assigneeId', {
                unique: false,
              });
            } else if (storeName === StoreNames.INSPECTIONS) {
              objectStore.createIndex('projectId', 'projectId', {
                unique: false,
              });
              objectStore.createIndex('status', 'status', { unique: false });
            } else if (storeName === StoreNames.PHOTOS) {
              objectStore.createIndex('projectId', 'projectId', {
                unique: false,
              });
              objectStore.createIndex('uploadedToCloud', 'uploadedToCloud', {
                unique: false,
              });
            } else if (storeName === StoreNames.SYNC_QUEUE) {
              objectStore.createIndex('timestamp', 'timestamp', {
                unique: false,
              });
              objectStore.createIndex('synced', 'synced', { unique: false });
            }
          }
        });
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure DB is initialized before operations
   */
  private async ensureInitialized(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.db;
  }

  /**
   * Get a single item by key
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.ensureInitialized();

    return new Promise<T | null>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get item from ${storeName}`));
      };
    });
  }

  /**
   * Get all items from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureInitialized();

    return new Promise<T[]>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get all items from ${storeName}`));
      };
    });
  }

  /**
   * Get items matching a query
   */
  async query<T>(
    storeName: string,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    const allItems = await this.getAll<T>(storeName);
    return allItems.filter(predicate);
  }

  /**
   * Get items by index
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: string
  ): Promise<T[]> {
    const db = await this.ensureInitialized();

    return new Promise<T[]>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const index = objectStore.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(
          new Error(
            `Failed to get items from ${storeName} by index ${indexName}`
          )
        );
      };
    });
  }

  /**
   * Set a single item
   */
  async set<T>(storeName: string, key: string, value: T): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);

      // Ensure the value has the id field
      const valueWithId = { ...value, id: key } as any;
      const request = objectStore.put(valueWithId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set item in ${storeName}`));
      };
    });
  }

  /**
   * Delete a single item
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete item from ${storeName}`));
      };
    });
  }

  /**
   * Clear all items from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear ${storeName}`));
      };
    });
  }

  /**
   * Check if IndexedDB is available
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.indexedDB;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}
