/**
 * Storage Initialization
 * Setup and initialize IndexedDB storage
 */

import { IndexedDBAdapter } from './IndexedDBAdapter';
import type { StorageAdapter } from './StorageAdapter';

let storageInstance: StorageAdapter | null = null;
let initializationPromise: Promise<StorageAdapter> | null = null;

/**
 * Initialize storage adapter (singleton)
 * Returns the same instance on subsequent calls
 */
export async function initializeStorage(): Promise<StorageAdapter> {
  // Return existing instance if already initialized
  if (storageInstance) {
    return storageInstance;
  }

  // Return pending initialization if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start new initialization
  initializationPromise = (async () => {
    const storage = new IndexedDBAdapter();

    // Check if IndexedDB is available
    if (!storage.isAvailable()) {
      throw new Error(
        'IndexedDB is not available in this browser. Offline functionality will not work.'
      );
    }

    // Initialize the database
    await storage.initialize();

    storageInstance = storage;
    return storage;
  })();

  return initializationPromise;
}

/**
 * Get current storage instance (must be initialized first)
 */
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    throw new Error(
      'Storage not initialized. Call initializeStorage() first.'
    );
  }
  return storageInstance;
}

/**
 * Check if storage is initialized
 */
export function isStorageInitialized(): boolean {
  return storageInstance !== null;
}

/**
 * Reset storage (for testing)
 */
export function resetStorage(): void {
  storageInstance = null;
  initializationPromise = null;
}
