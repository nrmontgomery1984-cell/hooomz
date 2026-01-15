# @hooomz/core

Core project management module for the Hooomz construction management platform.

## Overview

This package handles the central project management functionality, including CRUD operations, status management, and business logic calculations.

## Features

- ✅ Project CRUD operations
- ✅ Status transition validation
- ✅ Project statistics calculation
- ✅ Project health assessment
- ✅ Repository pattern for data access abstraction
- ✅ Implements CoreOperations from shared-contracts

## Architecture

### Repository Pattern

The module uses the repository pattern to abstract data access. This allows:
- Swapping storage backends (PostgreSQL, MongoDB, in-memory, etc.)
- Testing with mock implementations
- Clear separation between business logic and data access

### Service Layer

Business logic is encapsulated in the `ProjectService` class, which:
- Validates input data using Zod schemas
- Enforces status transition rules
- Calculates project statistics and health
- Implements the CoreOperations API contract

## Usage

### Basic Setup

```typescript
import {
  ProjectService,
  InMemoryProjectRepository,
  type ProjectServiceDependencies
} from '@hooomz/core';

// Create repository instance
const projectRepository = new InMemoryProjectRepository();

// Create service with dependencies
const projectService = new ProjectService({
  projectRepository,
  // Optional: inject other repositories
  // customerRepository,
  // taskRepository,
  // lineItemRepository,
  // inspectionRepository
});
```

### CRUD Operations

```typescript
import { ProjectStatus, ProjectType } from '@hooomz/shared-contracts';

// Create a project
const createResponse = await projectService.create({
  name: 'Smith Kitchen Renovation',
  address: {
    street: '123 Main St',
    city: 'Fredericton',
    province: 'NB',
    postalCode: 'E3B 1A1',
    country: 'Canada'
  },
  status: ProjectStatus.LEAD,
  projectType: ProjectType.KITCHEN_REMODEL,
  clientId: 'cust-123',
  dates: {},
  budget: {
    estimatedCost: 50000,
    actualCost: 0
  }
});

if (createResponse.success) {
  const project = createResponse.data;
  console.log('Created project:', project.id);
}

// List projects with filtering
const listResponse = await projectService.list({
  filters: {
    status: ProjectStatus.IN_PROGRESS
  },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  pageSize: 20
});

// Get project by ID
const getResponse = await projectService.getById('proj-123');

// Update project with status transition validation
const updateResponse = await projectService.update('proj-123', {
  id: 'proj-123',
  status: ProjectStatus.QUOTED // Validates transition from current status
});

// Delete project
const deleteResponse = await projectService.delete('proj-123');
```

### Status Management

Status transitions are automatically validated:

```typescript
// Valid transition: LEAD -> QUOTED
await projectService.update('proj-123', {
  id: 'proj-123',
  status: ProjectStatus.QUOTED
}); // ✅ Succeeds

// Invalid transition: LEAD -> COMPLETE
await projectService.update('proj-123', {
  id: 'proj-123',
  status: ProjectStatus.COMPLETE
}); // ❌ Returns error: "Cannot transition from lead to complete"
```

Valid status transitions:
- **LEAD** → QUOTED, CANCELLED
- **QUOTED** → APPROVED, CANCELLED
- **APPROVED** → IN_PROGRESS, CANCELLED
- **IN_PROGRESS** → ON_HOLD, COMPLETE, CANCELLED
- **ON_HOLD** → IN_PROGRESS, CANCELLED
- **COMPLETE** → (terminal state)
- **CANCELLED** → (terminal state)

### Project Statistics

```typescript
const statsResponse = await projectService.getProjectStats('proj-123');

if (statsResponse.success) {
  const stats = statsResponse.data;
  console.log('Budget:', {
    total: stats.totalCost,
    variance: stats.budgetVariance,
    percentage: stats.budgetPercentage
  });
  console.log('Progress:', {
    completed: stats.completedTasks,
    total: stats.totalTasks,
    percentage: stats.progressPercentage
  });
  console.log('Timeline:', {
    elapsed: stats.daysElapsed,
    remaining: stats.daysRemaining
  });
}
```

### Project Health

```typescript
const health = await projectService.getProjectHealth('proj-123');
// Returns: 'on-track', 'at-risk', 'behind', or 'over-budget'

switch (health) {
  case 'on-track':
    console.log('✅ Project is on track');
    break;
  case 'at-risk':
    console.log('⚠️ Project needs attention');
    break;
  case 'behind':
    console.log('🕐 Project is behind schedule');
    break;
  case 'over-budget':
    console.log('🚨 Project is over budget');
    break;
}
```

Health assessment considers:
- **over-budget**: Actual cost exceeds estimated cost
- **behind**: Past estimated end date or has overdue tasks
- **at-risk**: >85% budget used or <15 days remaining with <50% complete
- **on-track**: Everything looks good, project progressing well

### Project with Details

Fetch project with all related entities:

```typescript
const detailsResponse = await projectService.getProjectWithDetails('proj-123');

if (detailsResponse.success) {
  const { project, customer, tasks, lineItems, inspections } = detailsResponse.data;

  console.log('Project:', project.name);
  console.log('Customer:', customer.firstName, customer.lastName);
  console.log('Tasks:', tasks.length);
  console.log('Line Items:', lineItems.length);
  console.log('Inspections:', inspections.length);
}
```

### Project Summary

Get a comprehensive summary for UI display:

```typescript
const summaryResponse = await projectService.getProjectSummary('proj-123');

if (summaryResponse.success) {
  const summary = summaryResponse.data;

  // Customer info
  console.log('Customer:', summary.customerName);
  console.log('Email:', summary.customerEmail);

  // Financial
  console.log('Budget:', summary.estimatedCost);
  console.log('Actual:', summary.actualCost);
  console.log('Utilization:', summary.budgetUtilization + '%');

  // Progress (weighted by task priority)
  console.log('Simple Progress:', summary.progressPercentage + '%');
  console.log('Weighted Progress:', summary.weightedProgress + '%');

  // Timeline
  console.log('Days Elapsed:', summary.daysElapsed);
  console.log('Days Remaining:', summary.daysRemaining);

  // Costs breakdown
  console.log('Labor Cost:', summary.laborCost);
  console.log('Material Cost:', summary.materialCost);

  // Health
  console.log('Health:', summary.health);
}
```

### Duplicate Project

Create a copy of a project (useful for templates):

```typescript
const duplicateResponse = await projectService.duplicateProject(
  'proj-123',
  'Smith Bathroom Renovation'
);

if (duplicateResponse.success) {
  const newProject = duplicateResponse.data;
  console.log('Created duplicate:', newProject.id);
  // New project has same budget/type but reset status (LEAD) and zero actual cost
}
```

### Business Logic Functions

The core package also exports pure functions for business logic that can be used independently:

```typescript
import {
  isValidProjectStatusTransition,
  getProjectHealth,
  calculateProjectProgress,
  getProjectSummary,
  type ProjectHealth
} from '@hooomz/core';

// Validate status transitions
const canTransition = isValidProjectStatusTransition('lead', 'quoted'); // true
const cannotTransition = isValidProjectStatusTransition('lead', 'complete'); // false

// Calculate weighted progress (by task priority)
// Urgent tasks (weight 4) contribute more than low priority (weight 1)
const progress = calculateProjectProgress(project, tasks);

// Get health directly
const health: ProjectHealth = getProjectHealth(project, tasks, lineItems);

// Generate comprehensive summary
const summary = getProjectSummary(project, tasks, lineItems, customer);
```

## Custom Repository Implementation

Implement `IProjectRepository` for your database:

```typescript
import { IProjectRepository } from '@hooomz/core';
import type { Project, CreateProject } from '@hooomz/shared-contracts';

class PostgresProjectRepository implements IProjectRepository {
  constructor(private db: DatabaseClient) {}

  async findById(id: string): Promise<Project | null> {
    const result = await this.db.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateProject): Promise<Project> {
    const { generateProjectId, createMetadata } = await import('@hooomz/shared-contracts');

    const project = {
      ...data,
      id: generateProjectId(),
      metadata: createMetadata()
    };

    await this.db.query(
      'INSERT INTO projects (id, name, ...) VALUES ($1, $2, ...)',
      [project.id, project.name, ...]
    );

    return project;
  }

  // Implement other methods...
}

// Use with service
const projectService = new ProjectService({
  projectRepository: new PostgresProjectRepository(dbClient)
});
```

## Exports

```typescript
// Service
export { ProjectService, type ProjectServiceDependencies } from '@hooomz/core';

// Repository
export {
  type IProjectRepository,
  InMemoryProjectRepository
} from '@hooomz/core';

// Types (re-exported from shared-contracts)
export type {
  Project,
  CreateProject,
  UpdateProject,
  ProjectStatus,
  ProjectWithDetails,
  ProjectStats
} from '@hooomz/core';
```

## Dependencies

- `@hooomz/shared-contracts` - Types, validation, and utilities

## Testing

The `InMemoryProjectRepository` is perfect for testing:

```typescript
import { ProjectService, InMemoryProjectRepository } from '@hooomz/core';

describe('ProjectService', () => {
  let service: ProjectService;
  let repository: InMemoryProjectRepository;

  beforeEach(() => {
    repository = new InMemoryProjectRepository();
    service = new ProjectService({ projectRepository: repository });
  });

  it('should create a project', async () => {
    const response = await service.create({
      // ... project data
    });

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });
});
```

## Next Steps

- Implement concrete repository for your database
- Add event emitters for project state changes
- Integrate with other modules (customers, tasks, etc.)
- Add caching layer if needed
