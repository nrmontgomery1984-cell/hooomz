/**
 * Seed Data Utility - Populates IndexedDB with demo data
 *
 * Hooomz Interiors: Trades-based renovation company
 * Owner: Nathan Montgomery (Red Seal Journeyman Carpenter)
 * Operator: Nishant (learning tiered skill progression)
 * Location: Moncton, New Brunswick, Canada
 * Partnership: Ritchies flooring retailer sends installation leads
 *
 * Core Services: LVP, Hardwood, Laminate, Baseboard, Shoe Molding, Paint
 * Upsells: Board & Batten, Wainscoting, Picture Frame Molding, Accent Wallpaper
 */

import type { CreateProject, CreateCustomer } from '@hooomz/shared-contracts';
import { ProjectStatus, ProjectType, ContactMethod, TaskStatus, TaskPriority } from '@hooomz/shared-contracts';
import type { Services } from '../services';
import { getLoggedServices, getServices } from '../services';

// ============================================================================
// Demo Customers - Moncton, NB Area
// ============================================================================

const DEMO_CUSTOMERS: CreateCustomer[] = [
  {
    type: 'residential',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@email.com',
    phone: '506-555-1234',
    preferredContactMethod: ContactMethod.EMAIL,
    address: {
      street: '45 Highfield St',
      city: 'Moncton',
      province: 'NB',
      postalCode: 'E1C 5N2',
      country: 'Canada',
    },
    tags: ['ritchies-referral'],
    notes: 'Referred by Ritchies. Main floor refresh - living room and dining room.',
  },
  {
    type: 'residential',
    firstName: 'Mike',
    lastName: 'Cole',
    email: 'mike.cole@email.com',
    phone: '506-555-2345',
    preferredContactMethod: ContactMethod.PHONE,
    address: {
      street: '82 Elmwood Dr',
      city: 'Riverview',
      province: 'NB',
      postalCode: 'E1B 3J4',
      country: 'Canada',
    },
    tags: ['budget-conscious'],
    notes: 'Mike & Jennifer Cole. Whole-home flooring project. Budget-conscious but wants quality.',
  },
  {
    type: 'residential',
    firstName: 'Tom',
    lastName: 'Bradley',
    email: 'tom.bradley@email.com',
    phone: '506-555-3456',
    preferredContactMethod: ContactMethod.TEXT,
    address: {
      street: '12 Queen St',
      city: 'Moncton',
      province: 'NB',
      postalCode: 'E1C 1K8',
      country: 'Canada',
    },
    tags: ['landlord', 'rental-property'],
    notes: 'Rental property owner. Wants durable LVP throughout. Quick turnaround needed.',
  },
];

// ============================================================================
// Demo Projects - Real Trades Work
// ============================================================================

const createDemoProjects = (customerIds: string[]): CreateProject[] => [
  {
    name: 'Mitchell Main Floor — Room Refresh',
    projectType: ProjectType.RENOVATION,
    status: ProjectStatus.IN_PROGRESS,
    clientId: customerIds[0],
    address: {
      street: '45 Highfield St',
      city: 'Moncton',
      province: 'NB',
      postalCode: 'E1C 5N2',
      country: 'Canada',
    },
    dates: {
      startDate: '2025-01-22',
      estimatedEndDate: '2025-02-05',
    },
    budget: {
      estimatedCost: 14200,
      actualCost: 4200,
    },
  },
  {
    name: 'Cole Whole-Home Flooring',
    projectType: ProjectType.RENOVATION,
    status: ProjectStatus.QUOTED,
    clientId: customerIds[1],
    address: {
      street: '82 Elmwood Dr',
      city: 'Riverview',
      province: 'NB',
      postalCode: 'E1B 3J4',
      country: 'Canada',
    },
    dates: {
      startDate: undefined,
      estimatedEndDate: undefined,
    },
    budget: {
      estimatedCost: 9800,
      actualCost: 0,
    },
  },
  {
    name: 'Bradley Rental Refresh',
    projectType: ProjectType.RENOVATION,
    status: ProjectStatus.APPROVED,
    clientId: customerIds[2],
    address: {
      street: '12 Queen St',
      city: 'Moncton',
      province: 'NB',
      postalCode: 'E1C 1K8',
      country: 'Canada',
    },
    dates: {
      startDate: '2025-02-10',
      estimatedEndDate: '2025-02-14',
    },
    budget: {
      estimatedCost: 6400,
      actualCost: 0,
    },
  },
];

// ============================================================================
// Seed Functions
// ============================================================================

/**
 * Seed demo customers into IndexedDB
 */
export async function seedCustomers(_services: Services): Promise<string[]> {
  const loggedServices = getLoggedServices();
  const customerIds: string[] = [];

  for (const customerData of DEMO_CUSTOMERS) {
    const customer = await loggedServices.customers.create(customerData);
    customerIds.push(customer.id);
    console.log(`Created customer: ${customer.firstName} ${customer.lastName}`);
  }

  return customerIds;
}

/**
 * Seed demo projects into IndexedDB
 */
export async function seedProjects(
  _services: Services,
  customerIds: string[]
): Promise<string[]> {
  const loggedServices = getLoggedServices();
  const projectIds: string[] = [];

  const demoProjects = createDemoProjects(customerIds);

  for (const projectData of demoProjects) {
    const project = await loggedServices.projects.create(projectData);
    projectIds.push(project.id);
    console.log(`Created project: ${project.name}`);
  }

  return projectIds;
}

/**
 * Seed tasks for demo projects
 */
export async function seedTasks(
  services: Services,
  projectIds: string[]
): Promise<number> {
  let count = 0;

  // Mitchell Main Floor — Room Refresh (In Progress)
  // Living Room + Dining Room: LVP, baseboard, paint
  if (projectIds[0]) {
    const pid = projectIds[0];
    const mitchellTasks: { title: string; desc: string; status: typeof TaskStatus[keyof typeof TaskStatus] }[] = [
      { title: 'Move furniture to center, lay drop cloths', desc: 'PREP · General', status: TaskStatus.COMPLETE },
      { title: 'Remove existing baseboard — Living Room', desc: 'DEMO · General', status: TaskStatus.COMPLETE },
      { title: 'Remove existing baseboard — Dining Room', desc: 'DEMO · General', status: TaskStatus.COMPLETE },
      { title: 'Prep subfloor — check for squeaks, level', desc: 'FLOORING · Flooring\nsopId:HI-SOP-FL-001', status: TaskStatus.IN_PROGRESS },
      { title: 'Install LVP — Living Room (420 sqft)', desc: 'FLOORING · Flooring\nsopId:HI-SOP-FL-007', status: TaskStatus.NOT_STARTED },
      { title: 'Install LVP — Dining Room (260 sqft)', desc: 'FLOORING · Flooring\nsopId:HI-SOP-FL-007', status: TaskStatus.NOT_STARTED },
      { title: 'Install baseboard — Living Room', desc: 'TRIM · Finish Carpentry\nsopId:HI-SOP-FC-003', status: TaskStatus.NOT_STARTED },
      { title: 'Install baseboard — Dining Room', desc: 'TRIM · Finish Carpentry\nsopId:HI-SOP-FC-003', status: TaskStatus.NOT_STARTED },
      { title: 'Paint walls — Living Room + Dining Room', desc: 'PAINT · Painting\nsopId:HI-SOP-PT-001', status: TaskStatus.NOT_STARTED },
    ];
    for (const t of mitchellTasks) {
      await services.scheduling.tasks.create({
        projectId: pid,
        title: t.title,
        description: t.desc,
        status: t.status,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
      });
      count++;
    }
  }

  // Bradley Rental Refresh (Approved — scheduled to start)
  // 3 bedrooms + hallway: LVP, baseboard, ceiling paint
  if (projectIds[2]) {
    const pid = projectIds[2];
    const bradleyTasks: { title: string; desc: string }[] = [
      { title: 'Remove existing flooring — Bedroom 1', desc: 'DEMO · General' },
      { title: 'Remove existing flooring — Bedroom 2', desc: 'DEMO · General' },
      { title: 'Remove existing flooring — Bedroom 3', desc: 'DEMO · General' },
      { title: 'Install LVP — Bedroom 1', desc: 'FLOORING · Flooring\nsopId:HI-SOP-FL-007' },
      { title: 'Install LVP — Bedroom 2', desc: 'FLOORING · Flooring\nsopId:HI-SOP-FL-007' },
      { title: 'Install LVP — Bedroom 3', desc: 'FLOORING · Flooring\nsopId:HI-SOP-FL-007' },
      { title: 'Install LVP — Hallway', desc: 'FLOORING · Flooring\nsopId:HI-SOP-FL-007' },
      { title: 'Install baseboard — All rooms', desc: 'TRIM · Finish Carpentry\nsopId:HI-SOP-FC-003' },
      { title: 'Paint ceilings — All rooms', desc: 'PAINT · Painting\nsopId:HI-SOP-PT-002' },
    ];
    for (const t of bradleyTasks) {
      await services.scheduling.tasks.create({
        projectId: pid,
        title: t.title,
        description: t.desc,
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
      });
      count++;
    }
  }

  console.log(`Created ${count} tasks`);
  return count;
}

/**
 * Seed demo activity events for projects
 * Work categories: FLOORING, TRIM, PAINT, PREP, DEMO, CLOSEOUT
 * Trades: Nathan, Nishant
 */
export async function seedActivityEvents(
  services: Services,
  projectIds: string[]
): Promise<void> {
  const activityService = services.activity;

  // ========================================================================
  // Project 1: Mitchell Main Floor — Room Refresh (In Progress)
  // Living room + dining room: 680 sqft LVP, baseboard, paint
  // ========================================================================
  if (projectIds[0]) {
    const mitchellId = projectIds[0];

    // Project created
    await activityService.logProjectEvent('project.created', mitchellId, {
      project_name: 'Mitchell Main Floor — Room Refresh',
      details: 'Referred by Ritchies',
    });

    // Estimate line items added using logEstimateLineItemEvent
    await activityService.logEstimateLineItemEvent(
      'estimate.line_item_added',
      mitchellId,
      'li-lvp-lr',
      {
        description: 'LVP Flooring — Living Room',
        quantity: 420,
        unit: 'sqft',
        total: 2730,
        work_category_code: 'FLOORING',
        trade: 'Nathan',
      }
    );

    await activityService.logEstimateLineItemEvent(
      'estimate.line_item_added',
      mitchellId,
      'li-lvp-dr',
      {
        description: 'LVP Flooring — Dining Room',
        quantity: 260,
        unit: 'sqft',
        total: 1690,
        work_category_code: 'FLOORING',
        trade: 'Nathan',
      }
    );

    await activityService.logEstimateLineItemEvent(
      'estimate.line_item_added',
      mitchellId,
      'li-base-lr',
      {
        description: 'Baseboard — Living Room',
        quantity: 85,
        unit: 'lft',
        total: 361,
        work_category_code: 'TRIM',
        trade: 'Nathan',
      }
    );

    await activityService.logEstimateLineItemEvent(
      'estimate.line_item_added',
      mitchellId,
      'li-base-dr',
      {
        description: 'Baseboard — Dining Room',
        quantity: 52,
        unit: 'lft',
        total: 221,
        work_category_code: 'TRIM',
        trade: 'Nathan',
      }
    );

    await activityService.logEstimateLineItemEvent(
      'estimate.line_item_added',
      mitchellId,
      'li-paint-walls',
      {
        description: 'Paint Walls — Living + Dining',
        quantity: 800,
        unit: 'sqft',
        total: 1680,
        work_category_code: 'PAINT',
        trade: 'Nathan',
      }
    );

    // Estimate approved
    await activityService.logFinancialEvent(
      'estimate.approved',
      mitchellId,
      'estimate',
      'est-mitchell',
      {
        amount: 14200,
        description: 'Room Refresh: LVP, baseboard, paint',
      }
    );

    // Task events - Prep phase complete
    await activityService.logTaskEvent('task.started', mitchellId, 'task-prep', {
      task_title: 'Move furniture to center, lay drop cloths',
      work_category_code: 'PREP',
      trade: 'Nishant',
    });

    await activityService.logTaskEvent('task.completed', mitchellId, 'task-prep', {
      task_title: 'Move furniture to center, lay drop cloths',
      work_category_code: 'PREP',
      trade: 'Nishant',
    });

    // Demo phase complete
    await activityService.logTaskEvent('task.started', mitchellId, 'task-demo-lr', {
      task_title: 'Remove existing baseboard — Living Room',
      work_category_code: 'DEMO',
      trade: 'Nishant',
    });

    await activityService.logTaskEvent('task.completed', mitchellId, 'task-demo-lr', {
      task_title: 'Remove existing baseboard — Living Room',
      work_category_code: 'DEMO',
      trade: 'Nishant',
    });

    await activityService.logTaskEvent('task.started', mitchellId, 'task-demo-dr', {
      task_title: 'Remove existing baseboard — Dining Room',
      work_category_code: 'DEMO',
      trade: 'Nishant',
    });

    await activityService.logTaskEvent('task.completed', mitchellId, 'task-demo-dr', {
      task_title: 'Remove existing baseboard — Dining Room',
      work_category_code: 'DEMO',
      trade: 'Nishant',
    });

    // Flooring phase in progress
    await activityService.logTaskEvent('task.started', mitchellId, 'task-subfloor', {
      task_title: 'Prep subfloor — check for squeaks, level',
      work_category_code: 'FLOORING',
      trade: 'Nishant',
    });

    console.log('Seeded activity for Mitchell Main Floor — Room Refresh');
  }

  // ========================================================================
  // Project 2: Cole Whole-Home Flooring (Estimated - waiting for approval)
  // 1,400 sqft LVP throughout main floor, all baseboard, shoe molding
  // ========================================================================
  if (projectIds[1]) {
    const coleId = projectIds[1];

    await activityService.logProjectEvent('project.created', coleId, {
      project_name: 'Cole Whole-Home Flooring',
    });

    await activityService.logFinancialEvent(
      'estimate.created',
      coleId,
      'estimate',
      'est-cole',
      {
        description: '1,400 sqft LVP throughout main floor, all baseboard, shoe molding',
        amount: 9800,
      }
    );

    await activityService.logFinancialEvent(
      'estimate.sent',
      coleId,
      'estimate',
      'est-cole',
      {
        amount: 9800,
        description: 'Sent to Mike & Jennifer Cole',
      }
    );

    console.log('Seeded activity for Cole Whole-Home Flooring');
  }

  // ========================================================================
  // Project 3: Bradley Rental Refresh (Approved - scheduled to start)
  // 3 bedrooms + hallway: 520 sqft LVP, baseboard, ceiling paint only
  // ========================================================================
  if (projectIds[2]) {
    const bradleyId = projectIds[2];

    await activityService.logProjectEvent('project.created', bradleyId, {
      project_name: 'Bradley Rental Refresh',
    });

    await activityService.logFinancialEvent(
      'estimate.created',
      bradleyId,
      'estimate',
      'est-bradley',
      {
        description: '3 bedrooms + hallway: 520 sqft LVP, baseboard, ceiling paint only',
        amount: 6400,
      }
    );

    await activityService.logFinancialEvent(
      'estimate.approved',
      bradleyId,
      'estimate',
      'est-bradley',
      {
        amount: 6400,
        description: 'Approved by Tom Bradley',
      }
    );

    await activityService.logProjectEvent('project.status_changed', bradleyId, {
      project_name: 'Bradley Rental Refresh',
      old_status: 'quoted',
      new_status: 'approved',
      details: 'Scheduled to start Feb 10, 2025',
    });

    console.log('Seeded activity for Bradley Rental Refresh');
  }
}

/**
 * Seed all demo data
 */
export async function seedAllData(): Promise<{
  customerIds: string[];
  projectIds: string[];
}> {
  const services = getServices();

  console.log('🌱 Starting demo data seed...');

  // Seed customers first
  const customerIds = await seedCustomers(services);
  console.log(`✅ Created ${customerIds.length} customers`);

  // Seed projects with customer references
  const projectIds = await seedProjects(services, customerIds);
  console.log(`✅ Created ${projectIds.length} projects`);

  // Seed tasks for demo projects
  await seedTasks(services, projectIds);
  console.log('✅ Created tasks');

  // Seed activity events
  await seedActivityEvents(services, projectIds);
  console.log('✅ Created activity events');

  console.log('🎉 Demo data seed complete!');

  return { customerIds, projectIds };
}

/**
 * Check if data already exists (to avoid duplicate seeding)
 */
export async function hasExistingData(): Promise<boolean> {
  const services = getServices();
  const { projects } = await services.projects.findAll();
  return projects.length > 0;
}

/**
 * Clear all data from IndexedDB (use with caution!)
 */
export async function clearAllData(): Promise<void> {
  // This would require implementing delete methods on repositories
  // For now, recommend clearing IndexedDB from browser dev tools
  console.warn(
    'To clear all data, use browser dev tools: Application > IndexedDB > hooomz_db > Delete database'
  );
}
