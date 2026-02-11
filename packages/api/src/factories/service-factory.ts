/**
 * Service Factory
 * Creates and wires up all domain services with their dependencies
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Activity service
import { ActivityService, createActivityLogger, type ActivityLogger } from '../services';

// Core repositories and services
import {
  ProjectRepository,
  LoopContextRepository,
  LoopIterationRepository,
  InstalledProductRepository,
  HomeScanRepository,
  MaintenanceRecordRepository,
} from '@hooomz/core';
import {
  ProjectService,
  LoopService,
  ProjectLifecycleService,
  LoopFactoryService,
  PropertyBridgeService,
  ProjectCompletionService,
  HomeProfileService,
} from '@hooomz/core';

// Customer repositories and services
import {
  CustomerRepository,
  CustomerService,
  PortalService,
} from '@hooomz/customers';

// Field docs repositories and services
import {
  PhotoRepository,
  DocumentRepository,
  InspectionRepository,
  FieldNoteRepository,
  PhotoService,
  DocumentService,
  InspectionService,
  FieldNoteService,
} from '@hooomz/field-docs';

// Reporting services
import { ReportService } from '@hooomz/reporting';

export interface ServiceContainer {
  // Core
  projectService: ProjectService;
  loopService: LoopService;
  lifecycleService: ProjectLifecycleService;
  loopFactoryService: LoopFactoryService;
  propertyBridgeService: PropertyBridgeService;
  completionService: ProjectCompletionService;

  // Home Profile / Lifecycle
  homeProfileService: HomeProfileService;

  // Customers
  customerService: CustomerService;
  portalService: PortalService;

  // Field docs
  photoService: PhotoService;
  documentService: DocumentService;
  inspectionService: InspectionService;
  fieldNoteService: FieldNoteService;

  // Reporting
  reportService: ReportService;

  // Activity - full service with query methods
  activityService: ActivityService;
  // Activity - simple logger interface for backward compatibility
  activityLogger: ActivityLogger;

  // Supabase client for direct queries in routes
  supabase: SupabaseClient;
}

export function createServiceContainer(supabase: SupabaseClient): ServiceContainer {
  // Create activity service first (used by many services)
  const activityService = new ActivityService(supabase);

  // Create a logger interface for services that expect the old interface
  const activityLogger = createActivityLogger(activityService);

  // Create core repositories
  const projectRepo = new ProjectRepository(supabase);
  const loopContextRepo = new LoopContextRepository(supabase);
  const loopIterationRepo = new LoopIterationRepository(supabase);

  // Create customer repositories
  const customerRepo = new CustomerRepository(supabase);

  // Create field docs repositories
  const photoRepo = new PhotoRepository(supabase);
  const documentRepo = new DocumentRepository(supabase);
  const inspectionRepo = new InspectionRepository(supabase);
  const fieldNoteRepo = new FieldNoteRepository(supabase);

  // Core services (use activityLogger for backward compatibility with log() interface)
  const projectService = new ProjectService(projectRepo, activityLogger);
  const loopService = new LoopService(loopContextRepo, loopIterationRepo, projectRepo);
  const lifecycleService = new ProjectLifecycleService(projectService, loopService);
  const loopFactoryService = new LoopFactoryService(loopService);
  const propertyBridgeService = new PropertyBridgeService(supabase);
  const completionService = new ProjectCompletionService(supabase);

  // Home Profile repositories and service
  const installedProductRepo = new InstalledProductRepository(supabase);
  const homeScanRepo = new HomeScanRepository(supabase);
  const maintenanceRecordRepo = new MaintenanceRecordRepository(supabase);
  const homeProfileService = new HomeProfileService(
    supabase,
    installedProductRepo,
    homeScanRepo,
    maintenanceRecordRepo,
    activityLogger
  );

  // Customer services
  const customerService = new CustomerService(customerRepo);
  const portalService = new PortalService(customerRepo, undefined, activityLogger);

  // Field docs services (use activityLogger for backward compatibility)
  const photoService = new PhotoService({
    photoRepo,
    activityService: activityLogger,
  });
  const documentService = new DocumentService({
    documentRepo,
    activityService: activityLogger,
  });
  const inspectionService = new InspectionService({
    inspectionRepo,
    activityService: activityLogger,
  });
  const fieldNoteService = new FieldNoteService({
    fieldNoteRepo,
    activityService: activityLogger,
  });

  // Reporting services
  const reportService = new ReportService();

  return {
    projectService,
    loopService,
    lifecycleService,
    loopFactoryService,
    propertyBridgeService,
    completionService,
    homeProfileService,
    customerService,
    portalService,
    photoService,
    documentService,
    inspectionService,
    fieldNoteService,
    reportService,
    activityService,
    activityLogger,
    supabase,
  };
}
