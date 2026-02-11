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
  ACTIVITY_EVENTS: 'activityEvents',
  SOP_PROGRESS: 'sopProgress',
  // Labs Phase 1
  FIELD_OBSERVATIONS: 'fieldObservations',
  LABS_PRODUCTS: 'labsProducts',
  LABS_TECHNIQUES: 'labsTechniques',
  LABS_TOOL_METHODS: 'labsToolMethods',
  LABS_COMBINATIONS: 'labsCombinations',
  CREW_RATINGS: 'crewRatings',
  // Labs Phase 2
  FIELD_SUBMISSIONS: 'fieldSubmissions',
  NOTIFICATIONS: 'notifications',
  // Labs Phase 3
  EXPERIMENTS: 'experiments',
  EXPERIMENT_PARTICIPATIONS: 'experimentParticipations',
  CHECKPOINT_RESPONSES: 'checkpointResponses',
  // Labs Phase 4
  KNOWLEDGE_ITEMS: 'knowledgeItems',
  CONFIDENCE_EVENTS: 'confidenceEvents',
  KNOWLEDGE_CHALLENGES: 'knowledgeChallenges',
  // Integration (Data Spine)
  OBSERVATION_KNOWLEDGE_LINKS: 'observationKnowledgeLinks',
  CHANGE_ORDERS: 'changeOrders',
  CHANGE_ORDER_LINE_ITEMS: 'changeOrderLineItems',
  // SOPs (Build 1.5)
  SOPS: 'sops',
  SOP_CHECKLIST_ITEM_TEMPLATES: 'sopChecklistItemTemplates',
  // Build 2: Observation Trigger System
  PENDING_BATCH_OBSERVATIONS: 'pendingBatchObservations',
  // Build 3a: Time Clock + Crew Session
  ACTIVE_CREW_SESSION: 'activeCrewSession',
  TIME_ENTRIES: 'timeEntries',
  TIME_CLOCK_STATE: 'timeClockState',
  // Build 3b: Task Instance Pipeline
  SOP_TASK_BLUEPRINTS: 'sopTaskBlueprints',
  DEPLOYED_TASKS: 'deployedTasks',
  // Build 3c: Crew Members, Training, Budget
  CREW_MEMBERS: 'crewMembers',
  TRAINING_RECORDS: 'trainingRecords',
  TASK_BUDGETS: 'taskBudgets',
  // Build 3d: Loop Management
  LOOP_CONTEXTS: 'loopContexts',
  LOOP_ITERATIONS: 'loopIterations',
} as const;

export type StoreName = (typeof StoreNames)[keyof typeof StoreNames];
