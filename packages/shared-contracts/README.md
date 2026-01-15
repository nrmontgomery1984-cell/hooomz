# @hooomz/shared-contracts

Shared types, interfaces, and constants for the Hooomz construction management platform.

## Overview

This package is the single source of truth for all data types and constants used across the Hooomz monorepo. All other packages import from this package to ensure type consistency.

## Core Entities

### Project
Represents a construction job or project with status tracking, budget information, and timeline.

### Customer
Client or homeowner information with contact details and preferences.

### Task
Individual work items within a project with status, priority, and dependency tracking.

### LineItem
Cost and estimate line items with quantity, unit pricing, and categorization.

### Inspection
Field documentation including inspections, status, notes, and photo references.

## Installation

This package uses Zod for runtime validation. Zod is included as a dependency.

## Usage

### Basic Type Usage

```typescript
import { Project, ProjectStatus, ProjectType } from '@hooomz/shared-contracts';
import { PROJECT_STATUSES, COST_CATEGORIES } from '@hooomz/shared-contracts';

// Or import from specific paths
import { ProjectStatus, ProjectType } from '@hooomz/shared-contracts/types';
import { PROJECT_STATUSES } from '@hooomz/shared-contracts/constants';
import { Project, Customer, validateProject } from '@hooomz/shared-contracts/schemas';
```

### Runtime Validation

All entity types are validated using Zod schemas:

```typescript
import {
  validateProject,
  validateCreateProject,
  validateUpdateProject,
  type Project,
  type CreateProject
} from '@hooomz/shared-contracts';

// Validate existing entity
const result = validateProject(data);
if (result.success) {
  const project: Project = result.data;
  // Use validated data
} else {
  console.error(result.error.errors);
}

// Validate data for creating new entity (no id or metadata required)
const createResult = validateCreateProject(newData);

// Validate partial update (only id is required)
const updateResult = validateUpdateProject({ id: 'proj-1', status: 'complete' });
```

### Using Schemas Directly

```typescript
import { ProjectSchema, CreateProjectSchema } from '@hooomz/shared-contracts/schemas';

// Parse and throw on error
const project = ProjectSchema.parse(data);

// Safe parse (no throw)
const result = CreateProjectSchema.safeParse(data);
```

## Enums

- `ProjectStatus` - Project lifecycle statuses
- `ProjectType` - Types of construction projects
- `TaskStatus` - Task completion statuses
- `TaskPriority` - Task priority levels
- `InspectionStatus` - Inspection result statuses
- `InspectionType` - Types of inspections
- `ContactMethod` - Customer contact preferences
- `UnitOfMeasure` - Construction measurement units
- `CostCategory` - Budget and estimate categories

## Constants

Pre-configured arrays with labels for UI components:
- `PROJECT_STATUSES`
- `PROJECT_TYPES`
- `TASK_STATUSES`
- `TASK_PRIORITIES`
- `INSPECTION_STATUSES`
- `INSPECTION_TYPES`
- `CONTACT_METHODS`
- `UNITS_OF_MEASURE`
- `COST_CATEGORIES`
- `CANADIAN_PROVINCES`

## Validation

### Validation Functions

Each entity has three validation functions:
- `validate[Entity]()` - Validate complete entity with all fields
- `validateCreate[Entity]()` - Validate data for creating new entity (excludes id and metadata)
- `validateUpdate[Entity]()` - Validate partial update (only id required, all other fields optional)

Available validators:
- `validateProject()`, `validateCreateProject()`, `validateUpdateProject()`
- `validateCustomer()`, `validateCreateCustomer()`, `validateUpdateCustomer()`
- `validateTask()`, `validateCreateTask()`, `validateUpdateTask()`
- `validateLineItem()`, `validateCreateLineItem()`, `validateUpdateLineItem()`
- `validateInspection()`, `validateCreateInspection()`, `validateUpdateInspection()`
- `validateAddress()`

### Schemas

All Zod schemas are exported:
- `ProjectSchema`, `CreateProjectSchema`, `UpdateProjectSchema`
- `CustomerSchema`, `CreateCustomerSchema`, `UpdateCustomerSchema`
- `TaskSchema`, `CreateTaskSchema`, `UpdateTaskSchema`
- `LineItemSchema`, `CreateLineItemSchema`, `UpdateLineItemSchema`
- `InspectionSchema`, `CreateInspectionSchema`, `UpdateInspectionSchema`
- `AddressSchema`, `MetadataSchema`

### Validation Rules

Built-in validations include:
- Email format validation
- Phone number format validation (North American)
- Postal code format validation (Canadian)
- Non-negative numbers for costs and quantities
- Required fields checking
- String length constraints
- LineItem totalCost must equal quantity × unitCost
- Date format validation (ISO 8601)

Regular expressions available:
- `POSTAL_CODE_REGEX` - Canadian postal code format
- `PHONE_REGEX` - North American phone number format
- `EMAIL_REGEX` - Email address format

## Type Inference

All TypeScript types are inferred from Zod schemas, making them the single source of truth for both runtime validation and compile-time type checking.

## Utility Functions

The package includes comprehensive utility functions for common operations:

### ID Generation

```typescript
import { generateProjectId, generateCustomerId, generateId } from '@hooomz/shared-contracts';

const projectId = generateProjectId(); // "proj-abc123xyz789"
const customerId = generateCustomerId(); // "cust-abc123xyz789"
const genericId = generateId('custom'); // "custom-abc123xyz789"
```

Available ID generators:
- `generateId(prefix?)` - Generate unique ID with optional prefix
- `generateProjectId()` - Generate project ID
- `generateCustomerId()` - Generate customer ID
- `generateTaskId()` - Generate task ID
- `generateLineItemId()` - Generate line item ID
- `generateInspectionId()` - Generate inspection ID

### Date Utilities

```typescript
import { formatDate, parseDate, isOverdue, daysUntil, createMetadata } from '@hooomz/shared-contracts';

// Format dates for display
formatDate(new Date(), 'short');  // "02/15/2024"
formatDate(new Date(), 'medium'); // "Feb 15, 2024"
formatDate(new Date(), 'long');   // "February 15, 2024"
formatDate(new Date(), 'iso');    // "2024-02-15"

// Parse form input
const date = parseDate('2024-02-15'); // "2024-02-15"

// Check if overdue
isOverdue('2024-01-01'); // true if past today

// Calculate days until
daysUntil('2024-12-31'); // number of days (negative if past)

// Create/update metadata
const metadata = createMetadata(); // { createdAt, updatedAt }
const updated = updateMetadata(metadata); // updates updatedAt
```

### Money Utilities

```typescript
import {
  formatCurrency,
  parseCurrency,
  sumLineItems,
  calculateLineItemTotal,
  calculateBudgetPercentage,
  isOverBudget
} from '@hooomz/shared-contracts';

// Format currency
formatCurrency(1234.56); // "$1,234.56"
formatCurrency(1000, false); // "$1,000" (no cents)

// Parse currency input
parseCurrency('$1,234.56'); // 1234.56
parseCurrency('1000'); // 1000

// Calculate totals
const total = sumLineItems(lineItems);
const itemTotal = calculateLineItemTotal(10, 99.99); // 999.90

// Budget calculations
const percent = calculateBudgetPercentage(4500, 5000); // 90
const overBudget = isOverBudget(5500, 5000); // true
```

### Status Utilities

```typescript
import {
  getStatusColor,
  getPriorityColor,
  getNextStatuses,
  isTerminalStatus,
  isValidStatusTransition
} from '@hooomz/shared-contracts';

// Get colors for UI
const color = getStatusColor(ProjectStatus.IN_PROGRESS); // "#FBBF24"
const priorityColor = getPriorityColor(TaskPriority.URGENT); // "#EF4444"

// Status transitions
const nextStatuses = getNextStatuses(ProjectStatus.LEAD);
// [ProjectStatus.QUOTED, ProjectStatus.CANCELLED]

const isTerminal = isTerminalStatus(ProjectStatus.COMPLETE); // true

const canTransition = isValidStatusTransition(
  ProjectStatus.QUOTED,
  ProjectStatus.APPROVED
); // true
```

Status transition rules:
- **Projects**: LEAD → QUOTED → APPROVED → IN_PROGRESS → COMPLETE
  - Can go ON_HOLD from IN_PROGRESS
  - Can CANCEL at any time before COMPLETE
- **Tasks**: NOT_STARTED → IN_PROGRESS → COMPLETE
  - Can go BLOCKED from IN_PROGRESS or NOT_STARTED
  - Can return to IN_PROGRESS from BLOCKED
- **Inspections**: SCHEDULED → PASSED/FAILED → PENDING_REINSPECTION → SCHEDULED

## API Contract

The package defines a complete API contract that all modules must implement. These are pure TypeScript type definitions - implementations are provided by each module.

### Standard Response Types

```typescript
import type {
  ApiResponse,
  PaginatedApiResponse,
  isSuccessResponse,
  isErrorResponse
} from '@hooomz/shared-contracts';

// Standard response
const response: ApiResponse<Project> = {
  success: true,
  data: project
};

// Paginated response
const listResponse: PaginatedApiResponse<Project[]> = {
  success: true,
  data: projects,
  meta: {
    page: 1,
    pageSize: 10,
    total: 100,
    totalPages: 10
  }
};

// Error response
const errorResponse: ApiResponse<never> = {
  success: false,
  error: {
    code: 'PROJECT_NOT_FOUND',
    message: 'Project not found'
  }
};

// Type-safe response handling
if (isSuccessResponse(response)) {
  console.log(response.data); // TypeScript knows data is defined
}
```

### CRUD Operations

Every entity has a standard CRUD interface:

```typescript
import type { ProjectOperations } from '@hooomz/shared-contracts';

// All modules implement this pattern
interface CrudOperations<T, TCreate, TUpdate, TFilters, TSortFields> {
  list(params?: QueryParams): Promise<PaginatedApiResponse<T[]>>;
  getById(id: string): Promise<ApiResponse<T>>;
  create(data: TCreate): Promise<ApiResponse<T>>;
  update(id: string, data: TUpdate): Promise<ApiResponse<T>>;
  delete(id: string): Promise<ApiResponse<void>>;
}
```

Available CRUD interfaces:
- `ProjectOperations` - Core project management
- `CustomerOperations` - Customer management
- `TaskOperations` - Task management
- `LineItemOperations` - Cost line items
- `InspectionOperations` - Field inspections

### Query Parameters

Standard filtering, sorting, and pagination:

```typescript
import type { QueryParams, ProjectFilters, ProjectSortField } from '@hooomz/shared-contracts';

const params: QueryParams<ProjectSortField, ProjectFilters> = {
  // Pagination
  page: 1,
  pageSize: 20,

  // Sorting
  sortBy: 'createdAt',
  sortOrder: 'desc',

  // Filtering
  filters: {
    status: ['in-progress', 'approved'],
    estimatedCostMin: 10000,
    estimatedCostMax: 50000,
    search: 'kitchen'
  }
};

const response = await api.core.list(params);
```

### Module-Specific Operations

Each module extends CRUD with specialized operations:

**Core Module** (`CoreOperations`):
- `getProjectWithDetails(id)` - Project + customer + tasks + line items + inspections
- `getProjectStats(id)` - Budget variance, progress, timeline stats
- `duplicateProject(id, newName)` - Copy project for templates

**Estimating Module** (`EstimatingOperations`):
- `calculateEstimate(projectId)` - Full estimate breakdown by category
- `getEstimateSummary(projectId)` - Cost summary and variance
- `bulkCreateLineItems(projectId, items)` - Batch create line items
- `copyLineItems(fromProjectId, toProjectId)` - Template copying

**Scheduling Module** (`SchedulingOperations`):
- `getSchedule(startDate, endDate)` - Tasks in date range
- `getTaskWithDependencies(id)` - Task with dependency tree
- `getOverdueTasks(params)` - All overdue tasks
- `updateTaskDependencies(taskId, dependencies)` - Reorder dependencies

**Customer Module** (`CustomerManagementOperations`):
- `getCustomerWithProjects(id)` - Customer + all projects
- `searchCustomers(query)` - Full-text search

**Field Docs Module** (`FieldDocsOperations`):
- `getInspectionsWithProject(params)` - Inspections with project details
- `uploadPhotos(inspectionId, photos)` - Photo upload
- `getUpcomingInspections(days)` - Scheduled inspections

**Reporting Module** (`ReportingOperations`):
- `getDashboardMetrics(params)` - Overview metrics
- `getProjectPerformance(params)` - Performance analysis
- `exportProjectReport(projectId, format)` - PDF/Excel export
- `getRevenueByCategory(params)` - Revenue breakdown

### Response Helpers

```typescript
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePaginationMeta
} from '@hooomz/shared-contracts';

// Create responses
const success = createSuccessResponse(project);
const error = createErrorResponse('NOT_FOUND', 'Project not found');
const paginated = createPaginatedResponse(
  projects,
  calculatePaginationMeta(100, 1, 10)
);
```

### Complete API Interface

The `HooomzApi` interface defines the complete application API:

```typescript
import type { HooomzApi } from '@hooomz/shared-contracts';

const api: HooomzApi = {
  core: coreImplementation,
  estimating: estimatingImplementation,
  scheduling: schedulingImplementation,
  customers: customersImplementation,
  fieldDocs: fieldDocsImplementation,
  reporting: reportingImplementation,
};

// All modules follow the same contract
const projects = await api.core.list();
const estimate = await api.estimating.calculateEstimate('proj-123');
const schedule = await api.scheduling.getSchedule('2024-01-01', '2024-12-31');
```
