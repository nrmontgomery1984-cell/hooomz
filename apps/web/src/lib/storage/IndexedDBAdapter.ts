/**
 * IndexedDB Storage Adapter
 * Offline-first storage implementation using IndexedDB
 */

import type { StorageAdapter } from './StorageAdapter';
import { StoreNames } from './StorageAdapter';

const DB_NAME = 'hooomz_db';
const DB_VERSION = 37; // v37: Expense & PO Tracker

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

        const oldVersion = event.oldVersion;

        // v17 migration: add scriptPhase index to existing checklist items store
        if (oldVersion < 17 && db.objectStoreNames.contains(StoreNames.SOP_CHECKLIST_ITEM_TEMPLATES)) {
          const clStore = tx.objectStore(StoreNames.SOP_CHECKLIST_ITEM_TEMPLATES);
          if (!clStore.indexNames.contains('scriptPhase')) {
            clStore.createIndex('scriptPhase', 'scriptPhase', { unique: false });
          }
        }

        // v27 migration: rename clientId → customerId on project records
        if (oldVersion < 27) {
          if (db.objectStoreNames.contains('projects')) {
            const projStore = tx.objectStore('projects');
            const cursorReq = projStore.openCursor();
            cursorReq.onsuccess = () => {
              const cursor = cursorReq.result;
              if (cursor) {
                const record = cursor.value as Record<string, unknown>;
                if ('clientId' in record && !('customerId' in record)) {
                  record.customerId = record.clientId;
                  delete record.clientId;
                  cursor.update(record);
                }
                cursor.continue();
              }
            };
          }
        }

        // v30 migration: add source + source_id to existing lineItems records
        if (oldVersion < 30 && db.objectStoreNames.contains(StoreNames.LINE_ITEMS)) {
          const lineItemsStore = tx.objectStore(StoreNames.LINE_ITEMS);
          const lineItemsCursor = lineItemsStore.openCursor();
          lineItemsCursor.onsuccess = () => {
            const cursor = lineItemsCursor.result;
            if (cursor) {
              const record = cursor.value as Record<string, unknown>;
              if (!('source' in record)) {
                record.source = 'manual';
                record.source_id = null;
                cursor.update(record);
              }
              cursor.continue();
            }
          };
        }

        // v33 migration: add multiEntry linked_cost_items index to materialRecords
        // multiEntry means one record with ["FLR-020","FLR-021"] is indexed under both keys,
        // enabling fast reverse-lookup: "which materials link to cost item FLR-020?"
        if (oldVersion < 33 && db.objectStoreNames.contains(StoreNames.MATERIAL_RECORDS)) {
          const matStore = tx.objectStore(StoreNames.MATERIAL_RECORDS);
          if (!matStore.indexNames.contains('linked_cost_items')) {
            matStore.createIndex('linked_cost_items', 'linked_cost_items', { unique: false, multiEntry: true });
          }
        }

        // v34 migration: create properties store with indexes
        if (oldVersion < 34 && !db.objectStoreNames.contains('properties')) {
          const propertyStore = db.createObjectStore('properties', {
            keyPath: 'id',
          });
          propertyStore.createIndex('org_id', 'org_id', { unique: false });
          propertyStore.createIndex('customer_id', 'customer_id', { unique: false });
          propertyStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // v35: Passports + passport entries
        if (oldVersion < 35 && !db.objectStoreNames.contains('passports')) {
          const passportStore = db.createObjectStore('passports', {
            keyPath: 'id',
          });
          passportStore.createIndex('org_id', 'org_id', { unique: false });
          passportStore.createIndex('property_id', 'property_id', { unique: true });
        }

        if (oldVersion < 35 && !db.objectStoreNames.contains('passportEntries')) {
          const entryStore = db.createObjectStore('passportEntries', {
            keyPath: 'id',
          });
          entryStore.createIndex('org_id', 'org_id', { unique: false });
          entryStore.createIndex('passport_id', 'passport_id', { unique: false });
          entryStore.createIndex('project_id', 'project_id', { unique: true });
          entryStore.createIndex('property_id', 'property_id', { unique: false });
        }

        // v36: Risk Register
        if (oldVersion < 36 && !db.objectStoreNames.contains('riskEntries')) {
          const riskStore = db.createObjectStore('riskEntries', { keyPath: 'id' });
          riskStore.createIndex('by_trade', 'trade', { unique: false });
          riskStore.createIndex('by_severity', 'severity', { unique: false });
          riskStore.createIndex('by_status', 'status', { unique: false });
          riskStore.createIndex('by_linked_sop', 'linkedSopId', { unique: false });
          riskStore.createIndex('by_source', 'source', { unique: false });
        }

        // v37: Expense & PO Tracker
        if (oldVersion < 37) {
          if (!db.objectStoreNames.contains('vendors')) {
            const vendorStore = db.createObjectStore('vendors', { keyPath: 'id' });
            vendorStore.createIndex('by_name', 'name', { unique: false });
            vendorStore.createIndex('by_type', 'type', { unique: false });
          }
          if (!db.objectStoreNames.contains('jobExpenses')) {
            const expStore = db.createObjectStore('jobExpenses', { keyPath: 'id' });
            expStore.createIndex('by_jobId', 'jobId', { unique: false });
            expStore.createIndex('by_woId', 'woId', { unique: false });
            expStore.createIndex('by_crewMemberId', 'crewMemberId', { unique: false });
            expStore.createIndex('by_status', 'status', { unique: false });
            expStore.createIndex('by_reimbursementOwing', 'reimbursementOwing', { unique: false });
          }
          if (!db.objectStoreNames.contains('purchaseOrders')) {
            const poStore = db.createObjectStore('purchaseOrders', { keyPath: 'id' });
            poStore.createIndex('by_jobId', 'jobId', { unique: false });
            poStore.createIndex('by_woId', 'woId', { unique: false });
            poStore.createIndex('by_status', 'status', { unique: false });
            poStore.createIndex('by_approvalStatus', 'approvalStatus', { unique: false });
          }
        }

        // Build 3b migration: fix timeEntries indexes (crewMemberId → team_member_id)
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
      [StoreNames.SOPS]: ['sopCode', 'tradeFamily', 'isCurrent', 'status', 'code', 'trade'],
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
      // Workflows (Labs construction sequencing)
      [StoreNames.WORKFLOWS]: ['isDefault', 'status'],
      // Labs Integration: Tokens, Tests, Voting, Material Changes
      [StoreNames.LABS_TOKENS]: ['category', 'status', 'context'],
      [StoreNames.LABS_TESTS]: ['status', 'priority', 'category'],
      [StoreNames.LABS_VOTE_BALLOTS]: ['status'],
      [StoreNames.LABS_VOTES]: ['ballotId', 'partnerId'],
      [StoreNames.LABS_MATERIAL_CHANGES]: ['tokenId', 'testId', 'changedAt'],
      // Calendar / Scheduling
      [StoreNames.CREW_SCHEDULE_BLOCKS]: ['date', 'crewMemberId', 'projectId', 'taskId', 'status'],
      [StoreNames.SCHEDULE_NOTES]: ['blockId', 'projectId', 'date', 'authorId', 'targetCrewMemberId'],
      // Financial Forecasting
      [StoreNames.FORECAST_CONFIGS]: ['isActive', 'scenario'],
      [StoreNames.FORECAST_SNAPSHOTS]: ['configId', 'periodType', 'snapshotDate'],
      // Customers V2 (Platform-level)
      [StoreNames.CUSTOMERS_V2]: ['status', 'leadSource', 'propertyCity'],
      // Consultations (Sales pipeline)
      [StoreNames.CONSULTATIONS]: ['customerId', 'projectId', 'status', 'scheduledDate'],
      // Quotes (Sales pipeline)
      [StoreNames.QUOTES]: ['customerId', 'projectId', 'status', 'expiresAt'],
      // Expense Tracker
      [StoreNames.EXPENSES]: ['projectId', 'taskId', 'category', 'date'],
      // Invoices + Payments (Build 9)
      [StoreNames.INVOICES]: ['projectId', 'customerId', 'status', 'dueDate'],
      [StoreNames.PAYMENTS]: ['invoiceId', 'projectId', 'date'],
      // Training Guides
      [StoreNames.TRAINING_GUIDES]: ['code', 'trade', 'status'],
      // Checklist Submissions
      [StoreNames.CHECKLIST_SUBMISSIONS]: ['sopId', 'sopCode', 'projectId', 'technicianId', 'status'],
      // Material Selection (Block 2)
      [StoreNames.CATALOG_PRODUCTS]: ['category', 'trade', 'tier', 'sku'],
      [StoreNames.PROJECT_MATERIAL_SELECTIONS]: ['projectId', 'roomId', 'trade', 'status'],
      // RoomScan (Block 3)
      [StoreNames.ROOM_SCANS]: ['projectId', 'uploadedAt'],
      [StoreNames.ROOMS]: ['scanId', 'projectId', 'name'],
      // Layout Selector (Block 4)
      [StoreNames.FLOORING_LAYOUTS]: ['roomId', 'projectId'],
      // Trim Cut Calculator (Block 5)
      [StoreNames.MILLWORK_ASSEMBLY_CONFIGS]: [],
      [StoreNames.TRIM_CALCULATIONS]: ['roomId', 'projectId', 'openingId'],
      // Punch List (v31)
      [StoreNames.PUNCH_LIST_ITEMS]: ['projectId', 'status', 'priority', 'assignedTo'],
      // IAQ Reports (v32)
      [StoreNames.IAQ_REPORTS]: ['clientName', 'createdAt'],
      // Catalogue (v33)
      [StoreNames.COST_ITEMS]: ['cat', 'section', 'phase', 'division'],
      // materialRecords: linked_cost_items is multiEntry — handled in v33 migration below
      [StoreNames.MATERIAL_RECORDS]: ['category', 'tier', 'division', 'labs_status', 'supplier'],
      [StoreNames.LABS_REVIEWS]: ['material_id', 'reviewer_id'],
      [StoreNames.MATERIAL_PRICE_LOG]: ['material_id', 'recorded_at'],
      // Properties (v34)
      [StoreNames.PROPERTIES]: ['org_id', 'customer_id', 'created_at'],
      // Passports (v35)
      [StoreNames.PASSPORTS]: ['org_id', 'property_id'],
      [StoreNames.PASSPORT_ENTRIES]: ['org_id', 'passport_id', 'project_id', 'property_id'],
      // Risk Register (v36)
      [StoreNames.RISK_ENTRIES]: ['trade', 'severity', 'status', 'linkedSopId', 'source'],
      // Expense & PO Tracker (v37)
      [StoreNames.VENDORS]: ['name', 'type'],
      [StoreNames.JOB_EXPENSES]: ['jobId', 'woId', 'crewMemberId', 'status', 'reimbursementOwing'],
      [StoreNames.PURCHASE_ORDERS]: ['jobId', 'woId', 'status', 'approvalStatus'],
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
   * Set a single item.
   * Waits for transaction.oncomplete to ensure data is committed to disk.
   */
  async set<T>(storeName: string, key: string, value: T): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);

      // Ensure the value has the id field
      const valueWithId = { ...value, id: key } as any;
      objectStore.put(valueWithId);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error(`Failed to set item in ${storeName}: ${transaction.error?.message}`));
      };

      transaction.onabort = () => {
        reject(new Error(`Transaction aborted while setting item in ${storeName}: ${transaction.error?.message}`));
      };
    });
  }

  /**
   * Set multiple items in a single transaction (bulk insert).
   * Much faster than calling set() in a loop — one transaction instead of N.
   */
  async setMany<T>(storeName: string, items: { key: string; value: T }[]): Promise<void> {
    if (items.length === 0) return;
    const db = await this.ensureInitialized();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);

      for (const { key, value } of items) {
        const valueWithId = { ...value, id: key } as any;
        objectStore.put(valueWithId);
      }

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error(`Failed to bulk set items in ${storeName}: ${transaction.error?.message}`));
      };

      transaction.onabort = () => {
        reject(new Error(`Transaction aborted while bulk setting items in ${storeName}: ${transaction.error?.message}`));
      };
    });
  }

  /**
   * Delete a single item.
   * Waits for transaction.oncomplete to ensure deletion is committed.
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      objectStore.delete(key);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error(`Failed to delete item from ${storeName}: ${transaction.error?.message}`));
      };

      transaction.onabort = () => {
        reject(new Error(`Transaction aborted while deleting from ${storeName}: ${transaction.error?.message}`));
      };
    });
  }

  /**
   * Clear all items from a store.
   * Waits for transaction.oncomplete to ensure clear is committed.
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      objectStore.clear();

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error(`Failed to clear ${storeName}: ${transaction.error?.message}`));
      };

      transaction.onabort = () => {
        reject(new Error(`Transaction aborted while clearing ${storeName}: ${transaction.error?.message}`));
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
