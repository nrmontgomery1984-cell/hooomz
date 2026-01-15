/**
 * Example usage of the core module
 *
 * This file demonstrates how to use the ProjectService
 * with the InMemoryProjectRepository.
 */

import {
  ProjectService,
  InMemoryProjectRepository,
} from '../index';

import {
  ProjectStatus,
  ProjectType,
  isSuccessResponse,
  type CreateProject,
  type PaginatedApiResponse,
} from '@hooomz/shared-contracts';

/**
 * Example: Basic CRUD operations
 */
async function exampleCRUD() {
  // Create service with in-memory repository
  const repository = new InMemoryProjectRepository();
  const service = new ProjectService({ projectRepository: repository });

  console.log('=== CRUD Example ===\n');

  // Create a project
  console.log('1. Creating project...');
  const createData: CreateProject = {
    name: 'Smith Kitchen Renovation',
    address: {
      street: '123 Main Street',
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
      estimatedCost: 50000,
      actualCost: 0,
    },
  };

  const createResponse = await service.create(createData);
  if (!isSuccessResponse(createResponse)) {
    console.error('Failed to create:', createResponse.error);
    return;
  }

  const project = createResponse.data;
  console.log('✅ Created:', project.id, '-', project.name);

  // Read the project
  console.log('\n2. Reading project...');
  const getResponse = await service.getById(project.id);
  if (isSuccessResponse(getResponse)) {
    console.log('✅ Found:', getResponse.data.name);
  }

  // Update the project
  console.log('\n3. Updating project status...');
  const updateResponse = await service.update(project.id, {
    id: project.id,
    status: ProjectStatus.QUOTED,
  });
  if (isSuccessResponse(updateResponse)) {
    console.log('✅ Updated status:', updateResponse.data.status);
  }

  // List projects
  console.log('\n4. Listing projects...');
  const listResponse = await service.list({
    page: 1,
    pageSize: 10,
  });
  if (isSuccessResponse(listResponse)) {
    console.log('✅ Found', listResponse.data.length, 'project(s)');
    const paginated = listResponse as PaginatedApiResponse<any>;
    if (paginated.meta) {
      console.log('   Total:', paginated.meta.total);
    }
  }

  // Delete the project
  console.log('\n5. Deleting project...');
  const deleteResponse = await service.delete(project.id);
  if (isSuccessResponse(deleteResponse)) {
    console.log('✅ Deleted successfully');
  }
}

/**
 * Example: Status transition validation
 */
async function exampleStatusTransitions() {
  const repository = new InMemoryProjectRepository();
  const service = new ProjectService({ projectRepository: repository });

  console.log('\n=== Status Transition Example ===\n');

  // Create a project in LEAD status
  const createResponse = await service.create({
    name: 'Test Project',
    address: {
      street: '456 Oak Ave',
      city: 'Moncton',
      province: 'NB',
      postalCode: 'E1C 2B3',
      country: 'Canada',
    },
    status: ProjectStatus.LEAD,
    projectType: ProjectType.RENOVATION,
    clientId: 'cust-456',
    dates: {},
    budget: { estimatedCost: 30000, actualCost: 0 },
  });

  if (!isSuccessResponse(createResponse)) return;
  const projectId = createResponse.data.id;

  // Valid transition: LEAD -> QUOTED
  console.log('1. Valid transition (LEAD -> QUOTED)');
  const valid1 = await service.update(projectId, {
    id: projectId,
    status: ProjectStatus.QUOTED,
  });
  console.log(valid1.success ? '✅ Success' : '❌ Failed');

  // Valid transition: QUOTED -> APPROVED
  console.log('\n2. Valid transition (QUOTED -> APPROVED)');
  const valid2 = await service.update(projectId, {
    id: projectId,
    status: ProjectStatus.APPROVED,
  });
  console.log(valid2.success ? '✅ Success' : '❌ Failed');

  // Invalid transition: APPROVED -> COMPLETE (skipping IN_PROGRESS)
  console.log('\n3. Invalid transition (APPROVED -> COMPLETE)');
  const invalid = await service.update(projectId, {
    id: projectId,
    status: ProjectStatus.COMPLETE,
  });
  if (!invalid.success) {
    console.log('❌ Rejected:', invalid.error?.message);
  }

  // Valid transition: APPROVED -> IN_PROGRESS
  console.log('\n4. Valid transition (APPROVED -> IN_PROGRESS)');
  const valid3 = await service.update(projectId, {
    id: projectId,
    status: ProjectStatus.IN_PROGRESS,
  });
  console.log(valid3.success ? '✅ Success' : '❌ Failed');

  // Valid transition: IN_PROGRESS -> ON_HOLD
  console.log('\n5. Valid transition (IN_PROGRESS -> ON_HOLD)');
  const valid4 = await service.update(projectId, {
    id: projectId,
    status: ProjectStatus.ON_HOLD,
  });
  console.log(valid4.success ? '✅ Success' : '❌ Failed');

  // Valid transition: ON_HOLD -> IN_PROGRESS
  console.log('\n6. Valid transition (ON_HOLD -> IN_PROGRESS)');
  const valid5 = await service.update(projectId, {
    id: projectId,
    status: ProjectStatus.IN_PROGRESS,
  });
  console.log(valid5.success ? '✅ Success' : '❌ Failed');

  // Valid transition: IN_PROGRESS -> COMPLETE
  console.log('\n7. Valid transition (IN_PROGRESS -> COMPLETE)');
  const valid6 = await service.update(projectId, {
    id: projectId,
    status: ProjectStatus.COMPLETE,
  });
  console.log(valid6.success ? '✅ Success' : '❌ Failed');

  // Invalid transition: COMPLETE -> IN_PROGRESS (terminal state)
  console.log('\n8. Invalid transition (COMPLETE -> IN_PROGRESS)');
  const invalid2 = await service.update(projectId, {
    id: projectId,
    status: ProjectStatus.IN_PROGRESS,
  });
  if (!invalid2.success) {
    console.log('❌ Rejected:', invalid2.error?.message);
  }
}

/**
 * Example: Project statistics and health
 */
async function exampleStatistics() {
  const repository = new InMemoryProjectRepository();
  const service = new ProjectService({ projectRepository: repository });

  console.log('\n=== Statistics Example ===\n');

  // Create a project
  const createResponse = await service.create({
    name: 'Statistics Demo Project',
    address: {
      street: '789 Pine Rd',
      city: 'Saint John',
      province: 'NB',
      postalCode: 'E2K 3L4',
      country: 'Canada',
    },
    status: ProjectStatus.IN_PROGRESS,
    projectType: ProjectType.BATHROOM_REMODEL,
    clientId: 'cust-789',
    dates: {
      startDate: '2024-01-15',
      estimatedEndDate: '2024-03-15',
    },
    budget: {
      estimatedCost: 25000,
      actualCost: 18500,
    },
  });

  if (!isSuccessResponse(createResponse)) return;
  const projectId = createResponse.data.id;

  // Get project statistics
  console.log('1. Project Statistics');
  const statsResponse = await service.getProjectStats(projectId);
  if (isSuccessResponse(statsResponse)) {
    const stats = statsResponse.data;
    console.log('   Total Cost: $' + stats.totalCost.toLocaleString());
    console.log('   Budget Variance: $' + stats.budgetVariance.toLocaleString());
    console.log('   Budget Usage: ' + stats.budgetPercentage + '%');
    console.log('   Progress: ' + stats.progressPercentage + '%');
    console.log('   Days Elapsed: ' + stats.daysElapsed);
    console.log('   Days Remaining: ' + stats.daysRemaining);
  }

  // Get project health
  console.log('\n2. Project Health');
  const health = await service.getProjectHealth(projectId);
  const healthEmoji = {
    'on-track': '✅',
    'at-risk': '⚠️',
    'behind': '🕐',
    'over-budget': '🚨',
  };
  console.log('   Status:', healthEmoji[health], health.toUpperCase());

  // Get project summary
  console.log('\n3. Project Summary');
  const summaryResponse = await service.getProjectSummary(projectId);
  if (isSuccessResponse(summaryResponse)) {
    const summary = summaryResponse.data;
    console.log('   Customer:', summary.customerName);
    console.log('   Progress:', summary.progressPercentage + '% (simple)');
    console.log('   Weighted Progress:', summary.weightedProgress + '% (priority-weighted)');
    console.log('   Budget Utilization:', summary.budgetUtilization + '%');
    console.log('   Days Remaining:', summary.daysRemaining);
    console.log('   Health:', summary.health);
  }
}

/**
 * Example: Filtering and pagination
 */
async function exampleFiltering() {
  const repository = new InMemoryProjectRepository();
  const service = new ProjectService({ projectRepository: repository });

  console.log('\n=== Filtering Example ===\n');

  // Create multiple projects
  const projects = [
    { name: 'Kitchen Remodel', type: ProjectType.KITCHEN_REMODEL, status: ProjectStatus.IN_PROGRESS, cost: 50000 },
    { name: 'Bathroom Remodel', type: ProjectType.BATHROOM_REMODEL, status: ProjectStatus.QUOTED, cost: 25000 },
    { name: 'Deck Construction', type: ProjectType.DECK_CONSTRUCTION, status: ProjectStatus.IN_PROGRESS, cost: 15000 },
    { name: 'Basement Finishing', type: ProjectType.BASEMENT_FINISHING, status: ProjectStatus.COMPLETE, cost: 60000 },
  ];

  for (const p of projects) {
    await service.create({
      name: p.name,
      address: {
        street: '123 Test St',
        city: 'Fredericton',
        province: 'NB',
        postalCode: 'E3B 1A1',
        country: 'Canada',
      },
      status: p.status,
      projectType: p.type,
      clientId: 'cust-test',
      dates: {},
      budget: { estimatedCost: p.cost, actualCost: 0 },
    });
  }

  // Filter by status
  console.log('1. Filter by status (IN_PROGRESS)');
  const inProgress = await service.list({
    filters: { status: ProjectStatus.IN_PROGRESS },
  });
  if (isSuccessResponse(inProgress)) {
    console.log('   Found:', inProgress.data.length, 'projects');
    inProgress.data.forEach((p) => console.log('   -', p.name));
  }

  // Filter by cost range
  console.log('\n2. Filter by cost ($20,000 - $55,000)');
  const costRange = await service.list({
    filters: {
      estimatedCostMin: 20000,
      estimatedCostMax: 55000,
    },
  });
  if (isSuccessResponse(costRange)) {
    console.log('   Found:', costRange.data.length, 'projects');
    costRange.data.forEach((p) => console.log('   -', p.name, '($' + p.budget.estimatedCost.toLocaleString() + ')'));
  }

  // Sort by cost
  console.log('\n3. Sort by cost (descending)');
  const sorted = await service.list({
    sortBy: 'estimatedCost',
    sortOrder: 'desc',
  });
  if (isSuccessResponse(sorted)) {
    sorted.data.forEach((p) => console.log('   -', p.name, '($' + p.budget.estimatedCost.toLocaleString() + ')'));
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await exampleCRUD();
    await exampleStatusTransitions();
    await exampleStatistics();
    await exampleFiltering();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export for use elsewhere
export {
  exampleCRUD,
  exampleStatusTransitions,
  exampleStatistics,
  exampleFiltering,
  runExamples,
};

// Run if executed directly (uncomment if needed with CommonJS)
// if (require.main === module) {
//   runExamples();
// }
