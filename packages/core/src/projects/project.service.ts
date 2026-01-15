/**
 * Project Service
 *
 * Business logic layer for project management.
 * Implements CoreOperations from the API contract.
 */

import type {
  Project,
  CreateProject,
  UpdateProject,
  ProjectStatus,
  QueryParams,
  ProjectFilters,
  ProjectSortField,
  ApiResponse,
  PaginatedApiResponse,
  ProjectWithDetails,
  ProjectStats,
  CoreOperations,
  Customer,
  Task,
  LineItem,
  Inspection,
} from '@hooomz/shared-contracts';

import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePaginationMeta,
  validateCreateProject,
  validateUpdateProject,
  daysUntil,
} from '@hooomz/shared-contracts';

import type { IProjectRepository } from './project.repository';
import {
  isValidProjectStatusTransition,
  getValidNextStatuses,
  isTerminalProjectStatus,
  getProjectHealth,
  calculateProjectProgress,
  getProjectSummary,
  validateCustomerExists,
  validateProjectDates,
  validateProjectBudget,
  type ProjectHealth,
  type ProjectSummary,
} from './project.business-logic';

/**
 * Dependencies for fetching related entities
 * These would be injected from other modules
 */
export interface ProjectServiceDependencies {
  projectRepository: IProjectRepository;
  customerRepository?: {
    findById(id: string): Promise<Customer | null>;
  };
  taskRepository?: {
    findByProjectId(projectId: string): Promise<Task[]>;
  };
  lineItemRepository?: {
    findByProjectId(projectId: string): Promise<LineItem[]>;
  };
  inspectionRepository?: {
    findByProjectId(projectId: string): Promise<Inspection[]>;
  };
}

/**
 * Project Service - Business logic for project management
 */
export class ProjectService implements CoreOperations {
  constructor(private deps: ProjectServiceDependencies) {}

  /**
   * List projects with filtering, sorting, and pagination
   */
  async list(
    params?: QueryParams<ProjectSortField, ProjectFilters>
  ): Promise<PaginatedApiResponse<Project[]>> {
    try {
      const { projects, total } = await this.deps.projectRepository.findAll(params);

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;

      return createPaginatedResponse(
        projects,
        calculatePaginationMeta(total, page, pageSize)
      );
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list projects',
        },
      };
    }
  }

  /**
   * Get a project by ID
   */
  async getById(id: string): Promise<ApiResponse<Project>> {
    try {
      const project = await this.deps.projectRepository.findById(id);

      if (!project) {
        return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found`);
      }

      return createSuccessResponse(project);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch project'
      );
    }
  }

  /**
   * Create a new project
   */
  async create(data: CreateProject): Promise<ApiResponse<Project>> {
    try {
      // Validate input
      const validation = validateCreateProject(data);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid project data',
            details: validation.error.errors,
          },
        };
      }

      // Verify customer exists (if repository available)
      if (this.deps.customerRepository) {
        const customer = await this.deps.customerRepository.findById(data.clientId);
        const customerValidation = validateCustomerExists(data.clientId, !!customer);
        if (!customerValidation.valid) {
          return {
            success: false,
            error: {
              code: 'CUSTOMER_NOT_FOUND',
              message: customerValidation.errors[0].message,
              details: { errors: customerValidation.errors },
            },
          };
        }
      }

      // Validate dates
      const datesValidation = validateProjectDates(data.dates);
      if (!datesValidation.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid project dates',
            details: { errors: datesValidation.errors },
          },
        };
      }

      // Validate budget
      const budgetValidation = validateProjectBudget(data.budget);
      if (!budgetValidation.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid project budget',
            details: { errors: budgetValidation.errors },
          },
        };
      }

      const project = await this.deps.projectRepository.create(validation.data);
      return createSuccessResponse(project);
    } catch (error) {
      return createErrorResponse(
        'CREATE_ERROR',
        error instanceof Error ? error.message : 'Failed to create project'
      );
    }
  }

  /**
   * Update a project
   */
  async update(id: string, data: UpdateProject): Promise<ApiResponse<Project>> {
    try {
      // Validate input
      const validation = validateUpdateProject(data);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validation.error.errors,
          },
        };
      }

      // Get existing project
      const existing = await this.deps.projectRepository.findById(id);
      if (!existing) {
        return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found`);
      }

      // Validate status transition if status is being updated
      if (data.status && data.status !== existing.status) {
        if (!isValidProjectStatusTransition(existing.status, data.status)) {
          const validNext = getValidNextStatuses(existing.status);
          return createErrorResponse(
            'INVALID_STATUS_TRANSITION',
            `Cannot transition from ${existing.status} to ${data.status}. Valid transitions: ${validNext.join(', ')}`
          );
        }
      }

      // Perform update
      const updated = await this.deps.projectRepository.update(id, {
        ...data,
        id: undefined, // Remove id from update data
        metadata: undefined, // Metadata handled by repository
      });

      if (!updated) {
        return createErrorResponse('UPDATE_ERROR', 'Failed to update project');
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to update project'
      );
    }
  }

  /**
   * Delete a project
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      // Check if project exists
      const exists = await this.deps.projectRepository.exists(id);
      if (!exists) {
        return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found`);
      }

      // Check if project can be deleted (not in a terminal state with dependencies)
      const project = await this.deps.projectRepository.findById(id);
      if (project && isTerminalProjectStatus(project.status)) {
        // Allow deletion of completed/cancelled projects
        // In a real app, you might want to archive instead of delete
      }

      const deleted = await this.deps.projectRepository.delete(id);
      if (!deleted) {
        return createErrorResponse('DELETE_ERROR', 'Failed to delete project');
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(
        'DELETE_ERROR',
        error instanceof Error ? error.message : 'Failed to delete project'
      );
    }
  }

  /**
   * Get project with all related details
   */
  async getProjectWithDetails(id: string): Promise<ApiResponse<ProjectWithDetails>> {
    try {
      const project = await this.deps.projectRepository.findById(id);
      if (!project) {
        return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found`);
      }

      // Fetch related entities in parallel
      const [customer, tasks, lineItems, inspections] = await Promise.all([
        this.deps.customerRepository?.findById(project.clientId) || null,
        this.deps.taskRepository?.findByProjectId(id) || [],
        this.deps.lineItemRepository?.findByProjectId(id) || [],
        this.deps.inspectionRepository?.findByProjectId(id) || [],
      ]);

      if (!customer) {
        return createErrorResponse(
          'CUSTOMER_NOT_FOUND',
          `Customer ${project.clientId} not found`
        );
      }

      return createSuccessResponse({
        project,
        customer,
        tasks,
        lineItems,
        inspections,
      });
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch project details'
      );
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(id: string): Promise<ApiResponse<ProjectStats>> {
    try {
      const project = await this.deps.projectRepository.findById(id);
      if (!project) {
        return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found`);
      }

      // Fetch tasks for progress calculation
      const tasks = (await this.deps.taskRepository?.findByProjectId(id)) || [];

      // Calculate statistics
      const totalCost = project.budget.actualCost;
      const budgetVariance = project.budget.actualCost - project.budget.estimatedCost;
      const budgetPercentage =
        project.budget.estimatedCost > 0
          ? Math.round((project.budget.actualCost / project.budget.estimatedCost) * 100)
          : 0;

      const completedTasks = tasks.filter((t) => t.status === 'complete').length;
      const totalTasks = tasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate time statistics
      let daysElapsed = 0;
      let daysRemaining: number | null = null;

      if (project.dates.startDate) {
        const startDays = daysUntil(project.dates.startDate);
        daysElapsed = startDays !== null ? Math.abs(startDays) : 0;
      }

      if (project.dates.estimatedEndDate) {
        daysRemaining = daysUntil(project.dates.estimatedEndDate);
      }

      return createSuccessResponse({
        totalCost,
        budgetVariance,
        budgetPercentage,
        completedTasks,
        totalTasks,
        progressPercentage,
        daysElapsed,
        daysRemaining,
      });
    } catch (error) {
      return createErrorResponse(
        'STATS_ERROR',
        error instanceof Error ? error.message : 'Failed to calculate project statistics'
      );
    }
  }

  /**
   * Duplicate a project (for templates/repeating projects)
   */
  async duplicateProject(id: string, newName: string): Promise<ApiResponse<Project>> {
    try {
      const original = await this.deps.projectRepository.findById(id);
      if (!original) {
        return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found`);
      }

      // Create new project with same data but new name and reset status
      const createData: CreateProject = {
        name: newName,
        address: original.address,
        status: 'lead' as ProjectStatus,
        projectType: original.projectType,
        clientId: original.clientId,
        dates: {},
        budget: {
          estimatedCost: original.budget.estimatedCost,
          actualCost: 0,
        },
      };

      return this.create(createData);
    } catch (error) {
      return createErrorResponse(
        'DUPLICATE_ERROR',
        error instanceof Error ? error.message : 'Failed to duplicate project'
      );
    }
  }

  /**
   * Calculate project progress percentage (weighted by task priority)
   */
  async calculateProjectProgress(id: string): Promise<number> {
    const project = await this.deps.projectRepository.findById(id);
    if (!project) return 0;

    const tasks = (await this.deps.taskRepository?.findByProjectId(id)) || [];
    return calculateProjectProgress(project, tasks);
  }

  /**
   * Get project health status
   * Returns: 'on-track', 'at-risk', 'behind', or 'over-budget'
   */
  async getProjectHealth(id: string): Promise<ProjectHealth> {
    const project = await this.deps.projectRepository.findById(id);
    if (!project) return 'over-budget'; // Default to worst case if project not found

    const tasks = (await this.deps.taskRepository?.findByProjectId(id)) || [];
    const lineItems = (await this.deps.lineItemRepository?.findByProjectId(id)) || [];

    return getProjectHealth(project, tasks, lineItems);
  }

  /**
   * Get comprehensive project summary for UI display
   */
  async getProjectSummary(id: string): Promise<ApiResponse<ProjectSummary>> {
    try {
      const project = await this.deps.projectRepository.findById(id);
      if (!project) {
        return createErrorResponse('PROJECT_NOT_FOUND', `Project ${id} not found`);
      }

      // Fetch all related data
      const [customer, tasks, lineItems] = await Promise.all([
        this.deps.customerRepository?.findById(project.clientId) || null,
        this.deps.taskRepository?.findByProjectId(id) || [],
        this.deps.lineItemRepository?.findByProjectId(id) || [],
      ]);

      if (!customer) {
        return createErrorResponse(
          'CUSTOMER_NOT_FOUND',
          `Customer ${project.clientId} not found`
        );
      }

      const summary = getProjectSummary(project, tasks, lineItems, customer);
      return createSuccessResponse(summary);
    } catch (error) {
      return createErrorResponse(
        'SUMMARY_ERROR',
        error instanceof Error ? error.message : 'Failed to generate project summary'
      );
    }
  }
}
