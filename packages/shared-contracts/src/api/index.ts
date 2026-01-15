/**
 * API Contract Definitions
 *
 * This file defines the standard API contract that all modules must follow.
 * These are pure TypeScript type definitions - implementations are provided by each module.
 */

import type {
  Project,
  Customer,
  Task,
  LineItem,
  Inspection,
  CreateProject,
  CreateCustomer,
  CreateTask,
  CreateLineItem,
  CreateInspection,
  UpdateProject,
  UpdateCustomer,
  UpdateTask,
  UpdateLineItem,
  UpdateInspection,
} from '../schemas';

// ============================================================================
// Standard API Response Types
// ============================================================================

/**
 * Standard API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T> {
  meta?: PaginationMeta;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Sort order direction
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Sorting parameters
 */
export interface SortParams<T extends string = string> {
  sortBy?: T;
  sortOrder?: SortOrder;
}

/**
 * Generic filter parameters
 */
export interface FilterParams<T = Record<string, unknown>> {
  filters?: T;
}

/**
 * Combined query parameters
 */
export interface QueryParams<
  TSortFields extends string = string,
  TFilters = Record<string, unknown>
> extends PaginationParams, SortParams<TSortFields>, FilterParams<TFilters> {}

// ============================================================================
// Entity-Specific Filter Types
// ============================================================================

/**
 * Project filter parameters
 */
export interface ProjectFilters {
  status?: string | string[];
  projectType?: string | string[];
  clientId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  search?: string;
}

/**
 * Customer filter parameters
 */
export interface CustomerFilters {
  search?: string;
  preferredContactMethod?: string;
}

/**
 * Task filter parameters
 */
export interface TaskFilters {
  projectId?: string;
  status?: string | string[];
  priority?: string | string[];
  assignedTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
}

/**
 * LineItem filter parameters
 */
export interface LineItemFilters {
  projectId?: string;
  category?: string | string[];
  isLabor?: boolean;
}

/**
 * Inspection filter parameters
 */
export interface InspectionFilters {
  projectId?: string;
  inspectionType?: string | string[];
  status?: string | string[];
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// CRUD Operation Signatures
// ============================================================================

/**
 * Standard CRUD operations interface
 */
export interface CrudOperations<
  TEntity,
  TCreate,
  TUpdate,
  TFilters = Record<string, unknown>,
  TSortFields extends string = string
> {
  /**
   * List entities with optional filtering, pagination, and sorting
   */
  list(
    params?: QueryParams<TSortFields, TFilters>
  ): Promise<PaginatedApiResponse<TEntity[]>>;

  /**
   * Get a single entity by ID
   */
  getById(id: string): Promise<ApiResponse<TEntity>>;

  /**
   * Create a new entity
   */
  create(data: TCreate): Promise<ApiResponse<TEntity>>;

  /**
   * Update an existing entity
   */
  update(id: string, data: TUpdate): Promise<ApiResponse<TEntity>>;

  /**
   * Delete an entity
   */
  delete(id: string): Promise<ApiResponse<void>>;
}

// ============================================================================
// Entity-Specific CRUD Interfaces
// ============================================================================

/**
 * Project sortable fields
 */
export type ProjectSortField = 'name' | 'status' | 'createdAt' | 'updatedAt' | 'startDate' | 'estimatedCost';

/**
 * Project CRUD operations
 */
export interface ProjectOperations
  extends CrudOperations<Project, CreateProject, UpdateProject, ProjectFilters, ProjectSortField> {}

/**
 * Customer sortable fields
 */
export type CustomerSortField = 'lastName' | 'firstName' | 'email' | 'createdAt' | 'updatedAt';

/**
 * Customer CRUD operations
 */
export interface CustomerOperations
  extends CrudOperations<Customer, CreateCustomer, UpdateCustomer, CustomerFilters, CustomerSortField> {}

/**
 * Task sortable fields
 */
export type TaskSortField = 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt';

/**
 * Task CRUD operations
 */
export interface TaskOperations
  extends CrudOperations<Task, CreateTask, UpdateTask, TaskFilters, TaskSortField> {}

/**
 * LineItem sortable fields
 */
export type LineItemSortField = 'description' | 'category' | 'totalCost' | 'createdAt';

/**
 * LineItem CRUD operations
 */
export interface LineItemOperations
  extends CrudOperations<LineItem, CreateLineItem, UpdateLineItem, LineItemFilters, LineItemSortField> {}

/**
 * Inspection sortable fields
 */
export type InspectionSortField = 'date' | 'inspectionType' | 'status' | 'createdAt';

/**
 * Inspection CRUD operations
 */
export interface InspectionOperations
  extends CrudOperations<Inspection, CreateInspection, UpdateInspection, InspectionFilters, InspectionSortField> {}

// ============================================================================
// Module-Specific Operation Signatures
// ============================================================================

/**
 * Project with full details including related entities
 */
export interface ProjectWithDetails {
  project: Project;
  customer: Customer;
  tasks: Task[];
  lineItems: LineItem[];
  inspections: Inspection[];
}

/**
 * Project statistics
 */
export interface ProjectStats {
  totalCost: number;
  budgetVariance: number;
  budgetPercentage: number;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
  daysElapsed: number;
  daysRemaining: number | null;
}

/**
 * Core module operations (project/job management)
 */
export interface CoreOperations extends ProjectOperations {
  /**
   * Get project with all related details
   */
  getProjectWithDetails(id: string): Promise<ApiResponse<ProjectWithDetails>>;

  /**
   * Get project statistics
   */
  getProjectStats(id: string): Promise<ApiResponse<ProjectStats>>;

  /**
   * Duplicate a project (for templates/repeating projects)
   */
  duplicateProject(id: string, newName: string): Promise<ApiResponse<Project>>;
}

/**
 * Estimate breakdown by category
 */
export interface EstimateBreakdown {
  projectId: string;
  categories: {
    category: string;
    items: LineItem[];
    subtotal: number;
  }[];
  laborTotal: number;
  materialsTotal: number;
  grandTotal: number;
}

/**
 * Estimate summary
 */
export interface EstimateSummary {
  projectId: string;
  estimatedCost: number;
  actualCost: number;
  variance: number;
  variancePercentage: number;
  itemCount: number;
  lastUpdated: string;
}

/**
 * Estimating module operations
 */
export interface EstimatingOperations extends LineItemOperations {
  /**
   * Calculate full estimate breakdown for a project
   */
  calculateEstimate(projectId: string): Promise<ApiResponse<EstimateBreakdown>>;

  /**
   * Get estimate summary
   */
  getEstimateSummary(projectId: string): Promise<ApiResponse<EstimateSummary>>;

  /**
   * Bulk create line items
   */
  bulkCreateLineItems(projectId: string, items: CreateLineItem[]): Promise<ApiResponse<LineItem[]>>;

  /**
   * Copy line items from another project (for templates)
   */
  copyLineItems(fromProjectId: string, toProjectId: string): Promise<ApiResponse<LineItem[]>>;
}

/**
 * Task with dependencies populated
 */
export interface TaskWithDependencies extends Task {
  dependencyTasks: Task[];
  blockedBy: Task[];
}

/**
 * Schedule entry for calendar view
 */
export interface ScheduleEntry {
  task: Task;
  project: Project;
  isOverdue: boolean;
  daysUntilDue: number | null;
}

/**
 * Scheduling module operations
 */
export interface SchedulingOperations extends TaskOperations {
  /**
   * Get schedule for a date range
   */
  getSchedule(
    startDate: string,
    endDate: string,
    params?: {
      projectId?: string;
      assignedTo?: string;
      status?: string[];
    }
  ): Promise<ApiResponse<ScheduleEntry[]>>;

  /**
   * Get task with dependencies
   */
  getTaskWithDependencies(id: string): Promise<ApiResponse<TaskWithDependencies>>;

  /**
   * Get overdue tasks
   */
  getOverdueTasks(params?: {
    projectId?: string;
    assignedTo?: string;
  }): Promise<ApiResponse<Task[]>>;

  /**
   * Reorder task dependencies
   */
  updateTaskDependencies(taskId: string, dependencies: string[]): Promise<ApiResponse<Task>>;
}

/**
 * Customer with projects
 */
export interface CustomerWithProjects extends Customer {
  projects: Project[];
  totalProjects: number;
  activeProjects: number;
}

/**
 * Customer module operations
 */
export interface CustomerManagementOperations extends CustomerOperations {
  /**
   * Get customer with all their projects
   */
  getCustomerWithProjects(id: string): Promise<ApiResponse<CustomerWithProjects>>;

  /**
   * Search customers
   */
  searchCustomers(query: string): Promise<ApiResponse<Customer[]>>;
}

/**
 * Inspection with project details
 */
export interface InspectionWithProject extends Inspection {
  project: Project;
}

/**
 * Field documentation module operations
 */
export interface FieldDocsOperations extends InspectionOperations {
  /**
   * Get inspections with project details
   */
  getInspectionsWithProject(
    params?: QueryParams<InspectionSortField, InspectionFilters>
  ): Promise<PaginatedApiResponse<InspectionWithProject[]>>;

  /**
   * Upload inspection photos
   */
  uploadPhotos(inspectionId: string, photos: File[]): Promise<ApiResponse<string[]>>;

  /**
   * Get upcoming inspections
   */
  getUpcomingInspections(days?: number): Promise<ApiResponse<Inspection[]>>;
}

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  overdueTasksCount: number;
  upcomingInspectionsCount: number;
  projectsByStatus: Record<string, number>;
  revenueByMonth: { month: string; revenue: number }[];
}

/**
 * Project performance data
 */
export interface ProjectPerformance {
  projectId: string;
  projectName: string;
  budgetVariance: number;
  scheduleVariance: number;
  completionPercentage: number;
  status: string;
}

/**
 * Reporting module operations
 */
export interface ReportingOperations {
  /**
   * Get dashboard metrics
   */
  getDashboardMetrics(
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<DashboardMetrics>>;

  /**
   * Get project performance report
   */
  getProjectPerformance(
    params?: {
      status?: string[];
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<ProjectPerformance[]>>;

  /**
   * Export project report (PDF/Excel)
   */
  exportProjectReport(
    projectId: string,
    format: 'pdf' | 'excel'
  ): Promise<ApiResponse<Blob>>;

  /**
   * Get revenue by category
   */
  getRevenueByCategory(
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<{ category: string; revenue: number }[]>>;
}

// ============================================================================
// Combined API Interface
// ============================================================================

/**
 * Complete API contract for the entire application
 * Each module should implement its respective operations
 */
export interface HooomzApi {
  core: CoreOperations;
  estimating: EstimatingOperations;
  scheduling: SchedulingOperations;
  customers: CustomerManagementOperations;
  fieldDocs: FieldDocsOperations;
  reporting: ReportingOperations;
}

// ============================================================================
// Type Guards and Helpers
// ============================================================================

/**
 * Type guard to check if API response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success && response.data !== undefined;
}

/**
 * Type guard to check if API response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: false; error: ApiError } {
  return !response.success && response.error !== undefined;
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(code: string, message: string): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Create a paginated success response
 */
export function createPaginatedResponse<T>(
  data: T,
  meta: PaginationMeta
): PaginatedApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  page: number = 1,
  pageSize: number = 10
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
