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
   * Set multiple items in a single transaction (bulk insert)
   */
  setMany<T>(storeName: string, items: { key: string; value: T }[]): Promise<void>;

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
  CUSTOMERS: 'customers',  // Legacy — empty after v27 migration, kept for callers
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
  // Discovery Drafts (Prompt 2)
  DISCOVERY_DRAFTS: 'discoveryDrafts',
  // Intake Drafts
  INTAKE_DRAFTS: 'intakeDrafts',
  // Tool Research
  TOOL_PLATFORMS: 'toolPlatforms',
  TOOL_RESEARCH_ITEMS: 'toolResearchItems',
  TOOL_INVENTORY: 'toolInventory',
  // Admin: Cost Catalogue
  COST_CATALOG: 'costCatalog',
  // Workflows (Labs — construction sequencing)
  WORKFLOWS: 'workflows',
  // Labs Integration: Tokens, Tests, Voting, Material Changes
  LABS_TOKENS: 'labsTokens',
  LABS_TESTS: 'labsTests',
  LABS_VOTE_BALLOTS: 'labsVoteBallots',
  LABS_VOTES: 'labsVotes',
  LABS_MATERIAL_CHANGES: 'labsMaterialChanges',
  // Calendar / Scheduling
  CREW_SCHEDULE_BLOCKS: 'crewScheduleBlocks',
  SCHEDULE_NOTES: 'scheduleNotes',
  // Financial Forecasting
  FORECAST_CONFIGS: 'forecastConfigs',
  FORECAST_SNAPSHOTS: 'forecastSnapshots',
  // Labour Estimation Engine
  SKILL_RATE_CONFIG: 'skillRateConfig',
  // Customers V2 (Platform-level)
  CUSTOMERS_V2: 'customersV2',
  // Consultations (Sales pipeline)
  CONSULTATIONS: 'consultations',
  // Quotes (Sales pipeline)
  QUOTES: 'quotes',
  // Expense Tracker
  EXPENSES: 'expenses',
  // Invoices + Payments (Build 9)
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  // Training Guides
  TRAINING_GUIDES: 'trainingGuides',
  // Checklist Submissions (SOP checklist completions)
  CHECKLIST_SUBMISSIONS: 'checklistSubmissions',
  // Material Selection (Block 2)
  CATALOG_PRODUCTS: 'catalogProducts',
  PROJECT_MATERIAL_SELECTIONS: 'projectMaterialSelections',
  // RoomScan (Block 3)
  ROOM_SCANS: 'roomScans',
  ROOMS: 'rooms',
  // Layout Selector (Block 4)
  FLOORING_LAYOUTS: 'flooringLayouts',
  // Trim Cut Calculator (Block 5)
  MILLWORK_ASSEMBLY_CONFIGS: 'millworkAssemblyConfigs',
  TRIM_CALCULATIONS: 'trimCalculations',
  // Punch List (v31)
  PUNCH_LIST_ITEMS: 'punchListItems',
  // IAQ Reports (v32)
  IAQ_REPORTS: 'iaqReports',
  // Catalogue v33: Cost Items, Material Records, Labs Reviews, Price Log
  COST_ITEMS: 'costItems',
  MATERIAL_RECORDS: 'materialRecords',
  LABS_REVIEWS: 'labsReviews',
  MATERIAL_PRICE_LOG: 'materialPriceLog',
  // Properties (v34)
  PROPERTIES: 'properties',
  // Passports (v35)
  PASSPORTS: 'passports',
  PASSPORT_ENTRIES: 'passportEntries',
  // Risk Register (v36)
  RISK_ENTRIES: 'riskEntries',
  // Expense & PO Tracker (v37)
  VENDORS: 'vendors',
  JOB_EXPENSES: 'jobExpenses',
  PURCHASE_ORDERS: 'purchaseOrders',
} as const;

export type StoreName = (typeof StoreNames)[keyof typeof StoreNames];
