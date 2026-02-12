/**
 * Service Layer - Offline-first service initialization
 * Uses IndexedDB repositories for offline-first operation
 *
 * NOTE: The web app uses its own offline-first repositories,
 * not the backend package services which expect SQL databases.
 *
 * IMPORTANT: The Activity Log is THE SPINE of Hooomz.
 * Every mutation must log to the ActivityService.
 *
 * Two layers of services are available:
 * 1. Services (raw) - Direct repository access (for reads and internal use)
 * 2. LoggedServices - Service wrappers with automatic activity logging (for mutations)
 */

import { ProjectRepository } from '../repositories/project.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { LineItemRepository } from '../repositories/lineitem.repository';
import { CatalogRepository } from '../repositories/catalog.repository';
import { TaskRepository } from '../repositories/task.repository';
import { InspectionRepository } from '../repositories/inspection.repository';
import { PhotoRepository } from '../repositories/photo.repository';
import { ActivityRepository, ActivityService } from '../repositories/activity.repository';
import { initializeStorage } from '../storage';
import { createLabsServices } from './labs';
import type { LabsServices } from './labs';

// Integration services
import { ChangeOrderRepository } from '../repositories/changeOrder.repository';
import { ChangeOrderLineItemRepository } from '../repositories/changeOrderLineItem.repository';
import { ChangeOrderService } from './changeOrder.service';
import { UncapturedWorkService } from './uncapturedWork.service';
import { CallbackProjectService } from './callbackProject.service';
import { FieldObservationRepository, PendingBatchObservationRepository } from '../repositories/labs';

// Activity-logging service wrappers
import { ProjectService, createProjectService } from './project.service';
import { TaskService, createTaskService } from './task.service';
import { CustomerService, createCustomerService } from './customer.service';
import { EstimateService, createEstimateService } from './estimate.service';
import { CatalogService, createCatalogService } from './catalog.service';
import { PropertyService, createPropertyService } from './property.service';
import { PhotoService, createPhotoService } from './photo.service';
import { InspectionService, createInspectionService } from './inspection.service';
import { LoopService, createLoopService } from './loop.service';

// Time clock (Build 3a)
import { TimeEntryRepository } from '../repositories/timeEntry.repository';
import { TimeClockStateRepository } from '../repositories/timeClockState.repository';
import { TimeClockService, createTimeClockService } from './timeClock.service';

// Task Pipeline (Build 3b)
import { SopTaskBlueprintRepository } from '../repositories/sopTaskBlueprint.repository';
import { DeployedTaskRepository } from '../repositories/deployedTask.repository';
import { TaskPipelineService, createTaskPipelineService } from './taskPipeline.service';
import { SopRepository } from '../repositories/labs/sop.repository';

// Build 3c: Crew Members, Training, Budget
import { CrewMemberRepository } from '../repositories/crewMember.repository';
import { TrainingRecordRepository } from '../repositories/trainingRecord.repository';
import { TaskBudgetRepository } from '../repositories/taskBudget.repository';
import { TrainingService, createTrainingService } from './training.service';
import { BudgetService, createBudgetService } from './budget.service';

// Build 3d: Loop Management
import { LoopContextRepository } from '../repositories/loopContext.repository';
import { LoopIterationRepository } from '../repositories/loopIteration.repository';
import { LoopManagementService, createLoopManagementService } from './loopManagement.service';

// Intake Drafts (local-only, no sync, no activity logging)
import { IntakeDraftRepository } from '../repositories/intakeDraft.repository';

/**
 * Repository container - provides access to all offline-first repositories
 * Use this for read operations and internal access.
 */
export interface Services {
  // Activity Log - THE SPINE (every mutation logs here)
  activity: ActivityService;

  // Core - Project management
  projects: ProjectRepository;

  // Customer management
  customers: CustomerRepository;

  // Estimating - Line items and catalog
  estimating: {
    lineItems: LineItemRepository;
    catalog: CatalogRepository;
  };

  // Scheduling - Task management
  scheduling: {
    tasks: TaskRepository;
  };

  // Field docs - Inspections, photos
  fieldDocs: {
    inspections: InspectionRepository;
    photos: PhotoRepository;
  };

  // Labs - Field data collection system
  labs: LabsServices;

  // Integration - Data Spine services
  integration: {
    changeOrders: ChangeOrderService;
    uncapturedWork: UncapturedWorkService;
    callbacks: CallbackProjectService;
  };

  // Time clock (Build 3a)
  timeClock: TimeClockService;

  // Task Pipeline (Build 3b)
  pipeline: TaskPipelineService;

  // Build 3c: Crew Members, Training, Budget
  crew: CrewMemberRepository;
  training: TrainingService;
  budget: BudgetService;

  // Build 3d: Loop Management
  loopManagement: LoopManagementService;

  // Intake Drafts (local-only, no sync, no activity logging)
  intakeDrafts: IntakeDraftRepository;
}

/**
 * Logged services container - service wrappers with automatic activity logging
 * USE THESE for all mutations (create, update, delete).
 * Every action through these services automatically logs to the Activity spine.
 */
export interface LoggedServices {
  // Project management with logging
  projects: ProjectService;

  // Task management with logging
  tasks: TaskService;

  // Customer management with logging
  customers: CustomerService;

  // Estimate/line items with logging
  estimates: EstimateService;

  // Catalog management with logging
  catalog: CatalogService;

  // Property management with logging
  properties: PropertyService;

  // Photo management with logging
  photos: PhotoService;

  // Inspection management with logging
  inspections: InspectionService;

  // Loop management with logging
  loops: LoopService;
}

// Singleton instances
let servicesInstance: Services | null = null;
let loggedServicesInstance: LoggedServices | null = null;
let initializationPromise: Promise<Services> | null = null;

/**
 * Initialize all services with offline-first repositories
 * This is the main integration point where all modules come together
 */
export async function initializeServices(): Promise<Services> {
  // Return existing instance if already initialized
  if (servicesInstance) {
    return servicesInstance;
  }

  // Return pending initialization if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start new initialization
  initializationPromise = (async () => {
    // Initialize storage first
    const storage = await initializeStorage();

    // Initialize all repositories with storage
    const activityRepository = new ActivityRepository(storage);
    const projectRepository = new ProjectRepository(storage);
    const customerRepository = new CustomerRepository(storage);
    const lineItemRepository = new LineItemRepository(storage);
    const catalogRepository = new CatalogRepository(storage);
    const taskRepository = new TaskRepository(storage);
    const inspectionRepository = new InspectionRepository(storage);
    const photoRepository = new PhotoRepository(storage);
    const timeEntryRepository = new TimeEntryRepository(storage);
    const timeClockStateRepository = new TimeClockStateRepository(storage);
    const sopRepository = new SopRepository(storage);
    const crewMemberRepository = new CrewMemberRepository(storage);
    const trainingRecordRepository = new TrainingRecordRepository(storage);
    const taskBudgetRepository = new TaskBudgetRepository(storage);
    const loopContextRepository = new LoopContextRepository(storage);
    const loopIterationRepository = new LoopIterationRepository(storage);
    const intakeDraftRepository = new IntakeDraftRepository(storage);

    // Create ActivityService (THE SPINE)
    const activityService = new ActivityService(activityRepository);

    // Create BudgetService early so pipeline can use it
    const budgetService = createBudgetService(taskBudgetRepository, activityService);

    // Use repositories directly for offline-first operation
    const services: Services = {
      // Activity Log - THE SPINE (every mutation logs here)
      activity: activityService,

      // Core - Project management
      projects: projectRepository,

      // Customer management
      customers: customerRepository,

      // Estimating - Line items and catalog
      estimating: {
        lineItems: lineItemRepository,
        catalog: catalogRepository,
      },

      // Scheduling - Task management
      scheduling: {
        tasks: taskRepository,
      },

      // Field docs - Inspections, photos
      fieldDocs: {
        inspections: inspectionRepository,
        photos: photoRepository,
      },

      // Labs - Field data collection system
      labs: createLabsServices(storage, activityService),

      // Integration - Data Spine services
      integration: {
        changeOrders: new ChangeOrderService(
          new ChangeOrderRepository(storage),
          new ChangeOrderLineItemRepository(storage),
          activityService
        ),
        uncapturedWork: new UncapturedWorkService(storage, activityService),
        callbacks: new CallbackProjectService(
          storage,
          new FieldObservationRepository(storage),
          activityService
        ),
      },

      // Time clock (Build 3a)
      timeClock: createTimeClockService(
        timeEntryRepository,
        timeClockStateRepository,
        new PendingBatchObservationRepository(storage),
        activityService
      ),

      // Task Pipeline (Build 3b)
      pipeline: createTaskPipelineService({
        blueprintRepo: new SopTaskBlueprintRepository(storage),
        deployedTaskRepo: new DeployedTaskRepository(storage),
        taskRepo: taskRepository,
        sopRepo: sopRepository,
        activity: activityService,
        budget: budgetService,
      }),

      // Build 3c: Crew Members, Training, Budget
      crew: crewMemberRepository,
      training: createTrainingService(trainingRecordRepository, sopRepository, activityService),
      budget: budgetService,

      // Build 3d: Loop Management
      loopManagement: createLoopManagementService(loopContextRepository, loopIterationRepository, activityService),

      // Intake Drafts (local-only)
      intakeDrafts: intakeDraftRepository,
    };

    servicesInstance = services;

    // Create logged services (wrappers with automatic activity logging)
    // These should be used for all mutations (create, update, delete)
    loggedServicesInstance = {
      projects: createProjectService(services),
      tasks: createTaskService(services),
      customers: createCustomerService(services),
      estimates: createEstimateService(services),
      catalog: createCatalogService(services),
      properties: createPropertyService(services),
      photos: createPhotoService(services),
      inspections: createInspectionService(services),
      loops: createLoopService(services),
    };

    return services;
  })();

  return initializationPromise;
}

/**
 * Get initialized services (must call initializeServices first)
 */
export function getServices(): Services {
  if (!servicesInstance) {
    throw new Error(
      'Services not initialized. Call initializeServices() first or use the ServicesProvider.'
    );
  }
  return servicesInstance;
}

/**
 * Check if services are initialized
 */
export function areServicesInitialized(): boolean {
  return servicesInstance !== null;
}

/**
 * Reset services (for testing)
 */
export function resetServices(): void {
  servicesInstance = null;
  loggedServicesInstance = null;
  initializationPromise = null;
}

/**
 * Get initialized logged services (must call initializeServices first)
 * USE THESE for all mutations - they automatically log to the Activity spine.
 */
export function getLoggedServices(): LoggedServices {
  if (!loggedServicesInstance) {
    throw new Error(
      'Services not initialized. Call initializeServices() first or use the ServicesProvider.'
    );
  }
  return loggedServicesInstance;
}

/**
 * Convenience getter functions
 * Use these for quick access to individual repositories
 */

export function getProjectRepository(): ProjectRepository {
  return getServices().projects;
}

export function getCustomerRepository(): CustomerRepository {
  return getServices().customers;
}

export function getLineItemRepository(): LineItemRepository {
  return getServices().estimating.lineItems;
}

export function getCatalogRepository(): CatalogRepository {
  return getServices().estimating.catalog;
}

export function getTaskRepository(): TaskRepository {
  return getServices().scheduling.tasks;
}

export function getInspectionRepository(): InspectionRepository {
  return getServices().fieldDocs.inspections;
}

export function getPhotoRepository(): PhotoRepository {
  return getServices().fieldDocs.photos;
}

export function getActivityService(): ActivityService {
  return getServices().activity;
}

export function getLabsServices(): LabsServices {
  return getServices().labs;
}

export function getIntegrationServices() {
  return getServices().integration;
}

export function getChangeOrderService(): ChangeOrderService {
  return getServices().integration.changeOrders;
}

export function getUncapturedWorkService(): UncapturedWorkService {
  return getServices().integration.uncapturedWork;
}

export function getCallbackProjectService(): CallbackProjectService {
  return getServices().integration.callbacks;
}

// ============================================================================
// Logged Service Getters (USE THESE for mutations)
// ============================================================================

/**
 * Get the ProjectService with activity logging
 * Use for: create, update, changeStatus, delete
 */
export function getProjectService(): ProjectService {
  return getLoggedServices().projects;
}

/**
 * Get the TaskService with activity logging
 * Use for: create, update, updateStatus, delete, addDependency, removeDependency
 */
export function getTaskService(): TaskService {
  return getLoggedServices().tasks;
}

/**
 * Get the CustomerService with activity logging
 * Use for: create, update, delete, addTag, removeTag
 */
export function getCustomerService(): CustomerService {
  return getLoggedServices().customers;
}

/**
 * Get the EstimateService with activity logging
 * Use for: createLineItem, updateLineItem, deleteLineItem, bulkCreateLineItems
 */
export function getEstimateService(): EstimateService {
  return getLoggedServices().estimates;
}

/**
 * Get the CatalogService with activity logging
 * Use for: create, update, delete, updatePricing, bulkImport
 */
export function getCatalogService(): CatalogService {
  return getLoggedServices().catalog;
}

/**
 * Get the PropertyService with activity logging
 * Use for: create, update, delete, linkHomeowner
 */
export function getPropertyService(): PropertyService {
  return getLoggedServices().properties;
}

/**
 * Get the PhotoService with activity logging
 * Use for: create, update, share, delete, addTags, removeTags
 */
export function getPhotoService(): PhotoService {
  return getLoggedServices().photos;
}

/**
 * Get the InspectionService with activity logging
 * Use for: schedule, recordPassed, recordFailed, reschedule, delete
 */
export function getInspectionService(): InspectionService {
  return getLoggedServices().inspections;
}

/**
 * Get the LoopService with activity logging
 * Use for: create, updateStatus, updateHealth, delete, addTask, removeTask
 */
export function getLoopService(): LoopService {
  return getLoggedServices().loops;
}

export function getTaskPipelineService(): TaskPipelineService {
  return getServices().pipeline;
}

export function getCrewMemberRepository(): CrewMemberRepository {
  return getServices().crew;
}

export function getTrainingService(): TrainingService {
  return getServices().training;
}

export function getBudgetService(): BudgetService {
  return getServices().budget;
}

export function getLoopManagementService(): LoopManagementService {
  return getServices().loopManagement;
}

// Re-export service types for convenience
export type {
  ProjectService,
  TaskService,
  CustomerService,
  EstimateService,
  CatalogService,
  PropertyService,
  PhotoService,
  InspectionService,
  LoopService,
  LabsServices,
  ChangeOrderService,
  UncapturedWorkService,
  CallbackProjectService,
  TimeClockService,
  TaskPipelineService,
  TrainingService,
  BudgetService,
  LoopManagementService,
};
