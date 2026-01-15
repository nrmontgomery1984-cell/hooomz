/**
 * Service Layer - Offline-first service initialization
 * Integrates all @hooomz modules with IndexedDB repositories
 */

import { ProjectService } from '@hooomz/core';
import { CustomerService } from '@hooomz/customers';
import { EstimateService } from '@hooomz/estimating';
import { TaskService } from '@hooomz/scheduling';
import {
  InspectionService,
  PhotoService,
  ChecklistService,
} from '@hooomz/field-docs';
import {
  DashboardService,
  ReportService,
  ExportService,
} from '@hooomz/reporting';

import { ProjectRepository } from '../repositories/project.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { LineItemRepository } from '../repositories/lineitem.repository';
import { CatalogRepository } from '../repositories/catalog.repository';
import { TaskRepository } from '../repositories/task.repository';
import { InspectionRepository } from '../repositories/inspection.repository';
import { PhotoRepository } from '../repositories/photo.repository';
import { initializeStorage } from '../storage';

/**
 * Service container - holds all initialized services
 */
export interface Services {
  // Core module
  projects: ProjectService;

  // Customer module
  customers: CustomerService;

  // Estimating module
  estimating: EstimateService;

  // Scheduling module
  scheduling: {
    tasks: TaskService;
  };

  // Field docs module
  fieldDocs: {
    inspections: InspectionService;
    photos: PhotoService;
    checklists: ChecklistService;
  };

  // Reporting module
  reporting: {
    dashboards: DashboardService;
    reports: ReportService;
    exports: ExportService;
  };
}

// Singleton instance
let servicesInstance: Services | null = null;
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
    const projectRepository = new ProjectRepository(storage);
    const customerRepository = new CustomerRepository(storage);
    const lineItemRepository = new LineItemRepository(storage);
    const catalogRepository = new CatalogRepository(storage);
    const taskRepository = new TaskRepository(storage);
    const inspectionRepository = new InspectionRepository(storage);
    const photoRepository = new PhotoRepository(storage);

    // Initialize all services with their dependencies
    const services: Services = {
      // Core - Project management
      projects: new ProjectService({ projectRepository }),

      // Customers - Customer management
      customers: new CustomerService({ customerRepository }),

      // Estimating - Cost estimation
      estimating: new EstimateService({ lineItemRepository, catalogRepository }),

      // Scheduling - Task management
      scheduling: {
        tasks: new TaskService({ taskRepository }),
      },

      // Field Docs - Inspections, photos, checklists
      fieldDocs: {
        inspections: new InspectionService({ inspectionRepository }),
        photos: new PhotoService({ photoRepository }),
        checklists: new ChecklistService(),
      },

      // Reporting - Analytics and reports
      reporting: {
        dashboards: new DashboardService(),
        reports: new ReportService(),
        exports: new ExportService(),
      },
    };

    servicesInstance = services;
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
  initializationPromise = null;
}

/**
 * Convenience getter functions
 * Use these for quick access to individual services
 */

export function getProjectService(): ProjectService {
  return getServices().projects;
}

export function getCustomerService(): CustomerService {
  return getServices().customers;
}

export function getEstimateService(): EstimateService {
  return getServices().estimating;
}

export function getTaskService(): TaskService {
  return getServices().scheduling.tasks;
}

export function getInspectionService(): InspectionService {
  return getServices().fieldDocs.inspections;
}

export function getPhotoService(): PhotoService {
  return getServices().fieldDocs.photos;
}

export function getChecklistService(): ChecklistService {
  return getServices().fieldDocs.checklists;
}

export function getDashboardService(): DashboardService {
  return getServices().reporting.dashboards;
}

export function getReportService(): ReportService {
  return getServices().reporting.reports;
}

export function getExportService(): ExportService {
  return getServices().reporting.exports;
}
