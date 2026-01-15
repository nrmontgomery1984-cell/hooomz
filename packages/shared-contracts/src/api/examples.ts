/**
 * Example API contract usage
 * This file demonstrates how modules should implement the API contracts
 */

import type {
  ApiResponse,
  PaginatedApiResponse,
  ProjectOperations,
  CoreOperations,
  EstimatingOperations,
  SchedulingOperations,
  QueryParams,
  ProjectFilters,
  ProjectSortField,
} from './index';

import {
  isSuccessResponse,
  isErrorResponse,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePaginationMeta,
} from './index';

import type { Project, CreateProject, UpdateProject } from '../schemas';
import { ProjectStatus, ProjectType } from '../types';

// ============================================================================
// Example: Implementing Project CRUD Operations
// ============================================================================

/**
 * Example implementation of ProjectOperations
 * Real implementations would interact with a database
 */
class ExampleProjectService implements ProjectOperations {
  async list(
    params?: QueryParams<ProjectSortField, ProjectFilters>
  ): Promise<PaginatedApiResponse<Project[]>> {
    // In a real implementation:
    // 1. Query database with filters
    // 2. Apply sorting
    // 3. Apply pagination
    // 4. Return results with metadata

    const mockProjects: Project[] = [
      /* ... */
    ];
    const total = 100;
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;

    return createPaginatedResponse(
      mockProjects,
      calculatePaginationMeta(total, page, pageSize)
    );
  }

  async getById(id: string): Promise<ApiResponse<Project>> {
    // In a real implementation: fetch from database
    const project: Project | null = null;

    if (!project) {
      return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found`);
    }

    return createSuccessResponse(project);
  }

  async create(data: CreateProject): Promise<ApiResponse<Project>> {
    // In a real implementation:
    // 1. Validate data (already done by Zod)
    // 2. Generate ID
    // 3. Add metadata
    // 4. Save to database
    // 5. Return created project

    const project: Project = {
      ...data,
      id: 'proj-123',
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    return createSuccessResponse(project);
  }

  async update(id: string, data: UpdateProject): Promise<ApiResponse<Project>> {
    // In a real implementation:
    // 1. Fetch existing project
    // 2. Validate update data
    // 3. Merge changes
    // 4. Update metadata.updatedAt
    // 5. Save to database
    // 6. Return updated project

    const project: Project | null = null;

    if (!project) {
      return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found`);
    }

    return createSuccessResponse(project);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    // In a real implementation:
    // 1. Check if project exists
    // 2. Check if safe to delete (no dependencies)
    // 3. Delete from database

    return createSuccessResponse(undefined);
  }
}

// ============================================================================
// Example: Using the API
// ============================================================================

async function exampleUsage() {
  const projectService = new ExampleProjectService();

  // Example 1: List projects with filters and pagination
  const listResponse = await projectService.list({
    filters: {
      status: [ProjectStatus.IN_PROGRESS, ProjectStatus.APPROVED],
      estimatedCostMin: 10000,
      estimatedCostMax: 50000,
    },
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  if (isSuccessResponse(listResponse)) {
    console.log('Projects:', listResponse.data);
    console.log('Total:', listResponse.meta?.total);
    console.log('Pages:', listResponse.meta?.totalPages);
  } else if (isErrorResponse(listResponse)) {
    console.error('Error:', listResponse.error.message);
  }

  // Example 2: Create a new project
  const createData: CreateProject = {
    name: 'New Kitchen Renovation',
    address: {
      street: '123 Main St',
      city: 'Fredericton',
      province: 'NB',
      postalCode: 'E3B 1A1',
      country: 'Canada',
    },
    status: ProjectStatus.LEAD,
    projectType: ProjectType.KITCHEN_REMODEL,
    clientId: 'cust-123',
    dates: {},
    budget: {
      estimatedCost: 45000,
      actualCost: 0,
    },
  };

  const createResponse = await projectService.create(createData);

  if (isSuccessResponse(createResponse)) {
    console.log('Created project:', createResponse.data);
  }

  // Example 3: Update a project
  const updateResponse = await projectService.update('proj-123', {
    id: 'proj-123',
    status: ProjectStatus.QUOTED,
  });

  if (isSuccessResponse(updateResponse)) {
    console.log('Updated project:', updateResponse.data);
  }
}

// ============================================================================
// Example: Module-Specific Operations
// ============================================================================

/**
 * Example implementation of CoreOperations
 */
class ExampleCoreService implements CoreOperations {
  // Implement all ProjectOperations methods...
  list = new ExampleProjectService().list;
  getById = new ExampleProjectService().getById;
  create = new ExampleProjectService().create;
  update = new ExampleProjectService().update;
  delete = new ExampleProjectService().delete;

  // Module-specific methods
  async getProjectWithDetails(id: string) {
    // Fetch project + customer + tasks + line items + inspections
    // This would involve multiple database queries or a complex join

    return createSuccessResponse({
      project: {} as Project,
      customer: {} as any,
      tasks: [] as any[],
      lineItems: [] as any[],
      inspections: [] as any[],
    });
  }

  async getProjectStats(id: string) {
    // Calculate statistics from project data
    return createSuccessResponse({
      totalCost: 45000,
      budgetVariance: -2500,
      budgetPercentage: 95,
      completedTasks: 8,
      totalTasks: 10,
      progressPercentage: 80,
      daysElapsed: 30,
      daysRemaining: 10,
    });
  }

  async duplicateProject(id: string, newName: string) {
    // Copy project and all line items
    return createSuccessResponse({} as Project);
  }
}

// ============================================================================
// Example: Error Handling Patterns
// ============================================================================

async function errorHandlingExamples() {
  const projectService = new ExampleProjectService();

  // Pattern 1: Early return with type guard
  const response1 = await projectService.getById('proj-123');
  if (!isSuccessResponse(response1)) {
    console.error(response1.error?.message);
    return;
  }
  // TypeScript knows response1.data is defined here
  console.log(response1.data.name);

  // Pattern 2: Handle both cases
  const response2 = await projectService.getById('proj-123');
  if (isSuccessResponse(response2)) {
    console.log('Success:', response2.data);
  } else if (isErrorResponse(response2)) {
    console.error('Error:', response2.error.message);
  }

  // Pattern 3: Throw on error (for non-UI code)
  const response3 = await projectService.getById('proj-123');
  if (!response3.success) {
    throw new Error(response3.error?.message || 'Unknown error');
  }
  return response3.data;
}

// ============================================================================
// Example: Full API Implementation Structure
// ============================================================================

/**
 * Example of how the complete API would be structured
 * Each module provides its implementation
 */
const exampleApi = {
  core: new ExampleCoreService(),
  estimating: {} as EstimatingOperations,
  scheduling: {} as SchedulingOperations,
  customers: {} as any,
  fieldDocs: {} as any,
  reporting: {} as any,
};

// Usage in application code
async function applicationExample() {
  // All modules follow the same contract
  const projects = await exampleApi.core.list({ page: 1, pageSize: 10 });
  const estimate = await exampleApi.estimating.calculateEstimate('proj-123');
  const schedule = await exampleApi.scheduling.getSchedule('2024-01-01', '2024-01-31');

  // Consistent error handling across all modules
  if (isSuccessResponse(projects)) {
    console.log(projects.data);
  }
}

export {
  ExampleProjectService,
  ExampleCoreService,
  exampleUsage,
  errorHandlingExamples,
  applicationExample,
};
