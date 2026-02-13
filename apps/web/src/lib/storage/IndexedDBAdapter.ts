/**
 * IndexedDB Storage Adapter
 * Offline-first storage implementation using IndexedDB
 */

import type { StorageAdapter } from './StorageAdapter';
import { StoreNames } from './StorageAdapter';

const DB_NAME = 'hooomz_db';
const DB_VERSION = 13; // v13: added toolPlatforms, toolResearchItems, toolInventory (Tool Research)

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

      // Timeout: if DB doesn't open in 5s, delete and retry
      const timeout = setTimeout(() => {
        console.warn('IndexedDB open timed out. Deleting DB and retrying...');
        try { request.result?.close(); } catch (_) { /* ignore */ }
        const delReq = window.indexedDB.deleteDatabase(DB_NAME);
        delReq.onsuccess = () => {
          this.initPromise = null;
          this.initialize().then(resolve, reject);
        };
        delReq.onerror = () => {
          reject(new Error('Failed to delete blocked IndexedDB'));
        };
      }, 5000);

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        console.warn('IndexedDB upgrade blocked — waiting for timeout to handle...');
      };

      request.onsuccess = () => {
        clearTimeout(timeout);
        this.db = request.result;

        // Close DB if another tab requests an upgrade
        this.db.onversionchange = () => {
          this.db?.close();
          this.db = null;
          this.initPromise = null;
        };

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const tx = (event.target as IDBOpenDBRequest).transaction!;

        // Handle upgrade transaction errors
        tx.onerror = () => {
          clearTimeout(timeout);
          console.error('IndexedDB upgrade transaction error:', tx.error);
          reject(new Error(`IndexedDB upgrade failed: ${tx.error?.message}`));
        };

        tx.onabort = () => {
          clearTimeout(timeout);
          console.error('IndexedDB upgrade transaction aborted:', tx.error);
          reject(new Error(`IndexedDB upgrade aborted: ${tx.error?.message}`));
        };

        // Create object stores if they don't exist
        const stores = Object.values(StoreNames);

        for (const storeName of stores) {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, {
              keyPath: 'id',
            });

            // Create indexes for common queries
            this.createIndexesForStore(storeName, objectStore);
          }
        }

        // Build 3b migration: fix timeEntries indexes (crewMemberId → team_member_id)
        const oldVersion = event.oldVersion;
        if (oldVersion < 9 && db.objectStoreNames.contains(StoreNames.TIME_ENTRIES)) {
          const teStore = tx.objectStore(StoreNames.TIME_ENTRIES);
          // Remove wrong index names from v8
          if (teStore.indexNames.contains('crewMemberId')) {
            teStore.deleteIndex('crewMemberId');
          }
          if (teStore.indexNames.contains('projectId')) {
            teStore.deleteIndex('projectId');
          }
          // Add correct indexes matching actual TimeEntry field names
          if (!teStore.indexNames.contains('team_member_id')) {
            teStore.createIndex('team_member_id', 'team_member_id', { unique: false });
          }
          if (!teStore.indexNames.contains('project_id')) {
            teStore.createIndex('project_id', 'project_id', { unique: false });
          }
          if (!teStore.indexNames.contains('task_instance_id')) {
            teStore.createIndex('task_instance_id', 'task_instance_id', { unique: false });
          }
          if (!teStore.indexNames.contains('entryType')) {
            teStore.createIndex('entryType', 'entryType', { unique: false });
          }
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Create indexes for a given store
   */
  private createIndexesForStore(
    storeName: string,
    objectStore: IDBObjectStore
  ): void {
    const indexes: Record<string, string[]> = {
      [StoreNames.PROJECTS]: ['customerId', 'status'],
      [StoreNames.LINE_ITEMS]: ['projectId'],
      [StoreNames.TASKS]: ['projectId', 'status'],
      [StoreNames.INSPECTIONS]: ['projectId'],
      [StoreNames.PHOTOS]: ['projectId'],
      [StoreNames.SYNC_QUEUE]: ['status'],
      [StoreNames.ACTIVITY_EVENTS]: ['projectId', 'eventType'],
      [StoreNames.SOP_PROGRESS]: ['projectId', 'sopId'],
      // Labs Phase 1
      [StoreNames.FIELD_OBSERVATIONS]: ['projectId', 'taskId', 'knowledgeType'],
      [StoreNames.LABS_PRODUCTS]: ['category', 'name'],
      [StoreNames.LABS_TECHNIQUES]: ['category', 'name'],
      [StoreNames.LABS_TOOL_METHODS]: ['toolType', 'name'],
      [StoreNames.LABS_COMBINATIONS]: [],
      [StoreNames.CREW_RATINGS]: ['projectId', 'submittedBy'],
      // Labs Phase 2
      [StoreNames.FIELD_SUBMISSIONS]: ['submittedBy', 'status', 'category'],
      [StoreNames.NOTIFICATIONS]: ['userId', 'isRead'],
      // Labs Phase 3
      [StoreNames.EXPERIMENTS]: ['status', 'knowledgeType'],
      [StoreNames.EXPERIMENT_PARTICIPATIONS]: ['experimentId', 'projectId'],
      [StoreNames.CHECKPOINT_RESPONSES]: ['checkpointId', 'participationId'],
      // Labs Phase 4
      [StoreNames.KNOWLEDGE_ITEMS]: ['knowledgeType', 'status'],
      [StoreNames.CONFIDENCE_EVENTS]: ['knowledgeItemId'],
      [StoreNames.KNOWLEDGE_CHALLENGES]: ['knowledgeItemId', 'status'],
      // Integration (Data Spine)
      [StoreNames.OBSERVATION_KNOWLEDGE_LINKS]: ['observationId', 'knowledgeItemId', 'linkType'],
      [StoreNames.CHANGE_ORDERS]: ['projectId', 'status'],
      [StoreNames.CHANGE_ORDER_LINE_ITEMS]: ['changeOrderId', 'sopCode'],
      // SOPs (Build 1.5)
      [StoreNames.SOPS]: ['sopCode', 'tradeFamily', 'isCurrent', 'status'],
      [StoreNames.SOP_CHECKLIST_ITEM_TEMPLATES]: ['sopId', 'checklistType', 'generatesObservation', 'observationKnowledgeType', 'stepNumber'],
      // Build 2: Observation Trigger System
      [StoreNames.PENDING_BATCH_OBSERVATIONS]: ['taskId', 'crewMemberId', 'status', 'projectId'],
      // Build 3a: Time Clock + Crew Session
      [StoreNames.ACTIVE_CREW_SESSION]: ['crewMemberId', 'isActive'],
      [StoreNames.TIME_ENTRIES]: ['team_member_id', 'project_id', 'entryType', 'task_instance_id'],
      [StoreNames.TIME_CLOCK_STATE]: ['crewMemberId'],
      // Build 3b: Task Instance Pipeline
      [StoreNames.SOP_TASK_BLUEPRINTS]: ['projectId', 'sopId', 'sopCode', 'workSource', 'status'],
      [StoreNames.DEPLOYED_TASKS]: ['taskId', 'blueprintId', 'sopId'],
      // Build 3c: Crew Members, Training, Budget
      [StoreNames.CREW_MEMBERS]: ['tier', 'isActive'],
      [StoreNames.TRAINING_RECORDS]: ['crewMemberId', 'sopId', 'sopCode', 'status'],
      [StoreNames.TASK_BUDGETS]: ['taskId', 'blueprintId', 'projectId', 'status'],
      // Build 3d: Loop Management
      [StoreNames.LOOP_CONTEXTS]: ['project_id', 'loop_type', 'parent_context_id'],
      [StoreNames.LOOP_ITERATIONS]: ['context_id', 'project_id', 'parent_iteration_id'],
      // Intake Drafts
      [StoreNames.INTAKE_DRAFTS]: ['type', 'status', 'updatedAt'],
      // Tool Research
      [StoreNames.TOOL_PLATFORMS]: ['tier', 'name'],
      [StoreNames.TOOL_RESEARCH_ITEMS]: ['category', 'priority'],
      [StoreNames.TOOL_INVENTORY]: ['status', 'platform', 'category', 'brand'],
    };

    const storeIndexes = indexes[storeName] || [];
    for (const indexField of storeIndexes) {
      if (!objectStore.indexNames.contains(indexField)) {
        objectStore.createIndex(indexField, indexField, { unique: false });
      }
    }
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
