/**
 * Test file to verify all exports are accessible and working correctly
 * This is not a unit test - it's a compile-time verification
 */

// Test: Import from main entry point
import {
  // Types/Enums
  ProjectStatus,
  ProjectType,
  TaskStatus,
  TaskPriority,
  InspectionStatus,
  InspectionType,
  ContactMethod,
  UnitOfMeasure,
  CostCategory,

  // Schemas and Types
  Project,
  Customer,
  Task,
  LineItem,
  Inspection,
  Address,
  CreateProject,
  CreateCustomer,
  UpdateProject,

  // Validation Functions
  validateProject,
  validateCreateProject,
  validateCustomer,
  ProjectSchema,
  CustomerSchema,

  // Constants
  PROJECT_STATUSES,
  PROJECT_TYPES,
  TASK_STATUSES,
  COST_CATEGORIES,
  CANADIAN_PROVINCES,
  POSTAL_CODE_REGEX,
  PHONE_REGEX,
  EMAIL_REGEX,

  // Utilities
  generateProjectId,
  generateCustomerId,
  formatDate,
  formatCurrency,
  parseCurrency,
  getStatusColor,
  getNextStatuses,
  isTerminalStatus,
  createMetadata,
  sumLineItems,

  // API Contracts
  ApiResponse,
  PaginatedApiResponse,
  QueryParams,
  ProjectFilters,
  ProjectOperations,
  CoreOperations,
  EstimatingOperations,
  SchedulingOperations,
  HooomzApi,
  isSuccessResponse,
  createSuccessResponse,
  createErrorResponse,
} from '../index';

// Test: Import from specific paths
import { ProjectStatus as PS } from '../types';
import { PROJECT_STATUSES as STATUSES } from '../constants';
import { Project as P, validateProject as vp } from '../schemas';
import { generateProjectId as gpid } from '../utils';
import { ApiResponse as AR } from '../api';

// Compile-time verification: Use the imports
function testExports() {
  // Test enums
  const status: ProjectStatus = ProjectStatus.IN_PROGRESS;
  const projectType: ProjectType = ProjectType.KITCHEN_REMODEL;
  const taskStatus: TaskStatus = TaskStatus.IN_PROGRESS;
  const priority: TaskPriority = TaskPriority.HIGH;

  // Test types
  const address: Address = {
    street: '123 Main St',
    city: 'Fredericton',
    province: 'NB',
    postalCode: 'E3B 1A1',
    country: 'Canada',
  };

  const createProjectData: CreateProject = {
    name: 'Test Project',
    address,
    status: ProjectStatus.LEAD,
    projectType: ProjectType.RENOVATION,
    clientId: 'cust-123',
    dates: {},
    budget: {
      estimatedCost: 50000,
      actualCost: 0,
    },
  };

  // Test validation
  const validationResult = validateCreateProject(createProjectData);
  if (validationResult.success) {
    console.log('Valid project:', validationResult.data);
  }

  // Test schema parsing
  const project = ProjectSchema.safeParse({
    id: 'proj-123',
    ...createProjectData,
    metadata: createMetadata(),
  });

  // Test constants
  const statuses = PROJECT_STATUSES;
  const types = PROJECT_TYPES;
  const postalRegex = POSTAL_CODE_REGEX;

  // Test utilities
  const projectId = generateProjectId();
  const customerId = generateCustomerId();
  const formattedDate = formatDate(new Date(), 'medium');
  const formattedCurrency = formatCurrency(1234.56);
  const parsedCurrency = parseCurrency('$1,234.56');
  const statusColor = getStatusColor(ProjectStatus.IN_PROGRESS);
  const nextStatuses = getNextStatuses(ProjectStatus.LEAD);
  const isTerminal = isTerminalStatus(ProjectStatus.COMPLETE);
  const metadata = createMetadata();

  // Test line items
  const lineItems: LineItem[] = [
    {
      id: 'line-1',
      projectId: 'proj-1',
      category: CostCategory.MATERIALS,
      description: 'Test',
      quantity: 10,
      unit: UnitOfMeasure.EACH,
      unitCost: 100,
      totalCost: 1000,
      isLabor: false,
      metadata: createMetadata(),
    },
  ];
  const total = sumLineItems(lineItems);

  // Test API types
  const apiResponse: ApiResponse<Project> = createSuccessResponse({
    id: 'proj-123',
    ...createProjectData,
    metadata: createMetadata(),
  });

  const errorResponse: ApiResponse<never> = createErrorResponse(
    'NOT_FOUND',
    'Not found'
  );

  const paginatedResponse: PaginatedApiResponse<Project[]> = {
    success: true,
    data: [],
    meta: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    },
  };

  // Test type guards
  if (isSuccessResponse(apiResponse)) {
    const data: Project = apiResponse.data;
  }

  // Test query params
  const queryParams: QueryParams<'name' | 'createdAt', ProjectFilters> = {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortOrder: 'asc',
    filters: {
      status: ProjectStatus.IN_PROGRESS,
      search: 'test',
    },
  };

  console.log('All exports verified successfully');
  console.log({
    status,
    projectType,
    projectId,
    formattedDate,
    formattedCurrency,
    statusColor,
    total,
  });
}

// Export the test function
export { testExports };

// If running directly, execute the test
if (require.main === module) {
  testExports();
}
