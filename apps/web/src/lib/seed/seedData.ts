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
import { ProjectStatus, ProjectType, ContactMethod, TaskStatus, TaskPriority, CostCategory, UnitOfMeasure } from '@hooomz/shared-contracts';
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
    tags: ['lead', 'source:referral', 'interest:flooring', 'interest:paint', 'ritchies-referral'],
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
    tags: ['lead', 'source:referral', 'interest:flooring', 'budget-conscious'],
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
    tags: ['lead', 'source:other', 'interest:flooring', 'interest:paint', 'landlord', 'rental-property'],
    notes: 'Rental property owner. Wants durable LVP throughout. Quick turnaround needed.',
  },
];

// ============================================================================
// Demo Leads — New structured tag format for lead capture flow
// ============================================================================

const PLACEHOLDER_LEAD_ADDRESS = {
  street: 'TBD',
  city: 'Moncton',
  province: 'NB',
  postalCode: 'E1A 0A1',
  country: 'Canada',
};

const DEMO_LEADS: CreateCustomer[] = [
  {
    type: 'residential',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.m.homeshow@email.com',
    phone: '506-555-8001',
    preferredContactMethod: ContactMethod.TEXT,
    address: PLACEHOLDER_LEAD_ADDRESS,
    tags: [
      'lead', 'source:home_show',
      'scope:floors', 'scope:paint', 'scope:trim',
      'interest:flooring', 'interest:paint', 'interest:trim',
      'timeline:asap', 'budget:5k-10k', 'rooms:4',
      'sqft:540', 'material-floors:lvp', 'material-paint:walls_ceiling', 'material-trim:baseboard',
      'preferred-contact:text', 'temperature:hot',
      'estimate-low:4000', 'estimate-mid:5500', 'estimate-high:7000',
    ],
    notes: 'Home Show lead. Main floor refresh — 4 rooms, 540 sqft. LVP + paint + baseboard.',
  },
  {
    type: 'residential',
    firstName: 'David',
    lastName: 'Park',
    email: 'david.park@email.com',
    phone: '506-555-8002',
    preferredContactMethod: ContactMethod.PHONE,
    address: PLACEHOLDER_LEAD_ADDRESS,
    tags: [
      'lead', 'source:referral',
      'scope:floors',
      'interest:flooring',
      'timeline:few_months', 'budget:10k-20k', 'rooms:6',
      'sqft:900', 'material-floors:hardwood',
      'preferred-contact:call', 'temperature:hot',
      'referral-source:Ritchies',
      'estimate-low:7500', 'estimate-mid:10000', 'estimate-high:12500',
    ],
    notes: 'Referred by Ritchies. Whole main floor hardwood, 900 sqft. Timeline: few months.',
  },
  {
    type: 'residential',
    firstName: 'Amanda',
    lastName: 'Torres',
    email: 'amanda.torres@email.com',
    phone: '506-555-8003',
    preferredContactMethod: ContactMethod.EMAIL,
    address: PLACEHOLDER_LEAD_ADDRESS,
    tags: [
      'lead', 'source:website',
      'scope:not_sure',
      'interest:other',
      'timeline:exploring', 'budget:unknown', 'rooms:whole-floor',
      'preferred-contact:email', 'temperature:cool',
      'estimate-low:7000', 'estimate-mid:11000', 'estimate-high:16000',
    ],
    notes: 'Website inquiry. Not sure what they need yet. Just exploring options.',
  },
  {
    type: 'residential',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@email.com',
    phone: '506-555-8004',
    preferredContactMethod: ContactMethod.TEXT,
    address: PLACEHOLDER_LEAD_ADDRESS,
    tags: [
      'lead', 'source:google',
      'scope:floors', 'scope:tile',
      'interest:flooring', 'interest:tile',
      'timeline:few_months', 'budget:20k+', 'rooms:3',
      'sqft:320', 'material-floors:lvp', 'material-tile:shower',
      'preferred-contact:text', 'temperature:warm',
      'estimate-low:6500', 'estimate-mid:9000', 'estimate-high:11000',
    ],
    notes: 'Google lead. Bathroom shower tile + hallway LVP. 3 rooms, 320 sqft.',
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
 * Seed demo customers into IndexedDB.
 * Idempotent: skips customers whose email already exists.
 */
export async function seedCustomers(_services: Services): Promise<string[]> {
  const services = getServices();
  const loggedServices = getLoggedServices();
  const customerIds: string[] = [];

  const { customers: existing } = await services.customers.findAll();

  for (const customerData of DEMO_CUSTOMERS) {
    const match = existing.find((c) => c.email === customerData.email);
    if (match) {
      customerIds.push(match.id);
      console.log(`Customer exists (skipped): ${match.firstName} ${match.lastName}`);
      continue;
    }
    const customer = await loggedServices.customers.create(customerData);
    customerIds.push(customer.id);
    console.log(`Created customer: ${customer.firstName} ${customer.lastName}`);
  }

  return customerIds;
}

/**
 * Seed demo leads into IndexedDB (new structured tag format).
 * Idempotent: skips leads whose email already exists.
 */
export async function seedLeads(_services: Services): Promise<number> {
  const services = getServices();
  const loggedServices = getLoggedServices();
  let count = 0;

  const { customers: existing } = await services.customers.findAll();

  for (const leadData of DEMO_LEADS) {
    const match = existing.find((c) => c.email === leadData.email);
    if (match) {
      console.log(`Lead exists (skipped): ${match.firstName} ${match.lastName}`);
      continue;
    }
    await loggedServices.customers.create(leadData);
    count++;
    console.log(`Created lead: ${leadData.firstName} ${leadData.lastName}`);
  }

  return count;
}

/**
 * Seed demo projects into IndexedDB.
 * Idempotent: skips projects whose name already exists.
 */
export async function seedProjects(
  _services: Services,
  customerIds: string[]
): Promise<string[]> {
  const services = getServices();
  const loggedServices = getLoggedServices();
  const projectIds: string[] = [];

  const { projects: existing } = await services.projects.findAll();
  const demoProjects = createDemoProjects(customerIds);

  for (const projectData of demoProjects) {
    const match = existing.find((p) => p.name === projectData.name);
    if (match) {
      projectIds.push(match.id);
      console.log(`Project exists (skipped): ${match.name}`);
      continue;
    }
    const project = await loggedServices.projects.create(projectData);
    projectIds.push(project.id);
    console.log(`Created project: ${project.name}`);
  }

  return projectIds;
}

/**
 * Seed line items (estimates) for demo projects.
 * Creates actual LineItem records in IndexedDB so /estimates shows data.
 */
export async function seedLineItems(
  services: Services,
  projectIds: string[]
): Promise<number> {
  let count = 0;

  const createItem = async (item: Parameters<typeof services.estimating.lineItems.create>[0]) => {
    await services.estimating.lineItems.create(item);
    count++;
  };

  // Helper: skip projects that already have line items
  const shouldSeed = async (pid: string) => {
    const existing = await services.estimating.lineItems.findByProjectId(pid);
    return existing.length === 0;
  };

  // ======================================================================
  // Mitchell Main Floor — Room Refresh ($14,200)
  // Living Room + Dining Room: LVP, baseboard, paint
  // ======================================================================
  if (projectIds[0] && await shouldSeed(projectIds[0])) {
    const pid = projectIds[0];

    // Materials ($6,140)
    await createItem({ projectId: pid, category: CostCategory.FLOORING, description: 'LVP Flooring — Living Room', quantity: 420, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5.50, totalCost: 2310, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.FLOORING, description: 'LVP Flooring — Dining Room', quantity: 260, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5.50, totalCost: 1430, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.FLOORING, description: 'Underlayment', quantity: 680, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 0.75, totalCost: 510, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.INTERIOR_TRIM, description: 'Baseboard — MDF Primed', quantity: 140, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 3.50, totalCost: 490, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.PAINTING, description: 'Paint + Primer', quantity: 10, unit: UnitOfMeasure.GALLON, unitCost: 65, totalCost: 650, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.MATERIALS, description: 'Misc Supplies (transitions, adhesive, caulk)', quantity: 1, unit: UnitOfMeasure.LOT, unitCost: 750, totalCost: 750, isLabor: false });

    // Labor ($8,060)
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Flooring Installation', quantity: 680, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5.50, totalCost: 3740, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Trim Installation', quantity: 140, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 6, totalCost: 840, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Painting', quantity: 800, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 3, totalCost: 2400, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Demo & Prep', quantity: 16, unit: UnitOfMeasure.HOUR, unitCost: 45, totalCost: 720, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Cleanup & Moveout', quantity: 8, unit: UnitOfMeasure.HOUR, unitCost: 45, totalCost: 360, isLabor: true });
  }

  // ======================================================================
  // Cole Whole-Home Flooring ($9,800)
  // 1,400 sqft LVP, baseboard, shoe molding
  // ======================================================================
  if (projectIds[1] && await shouldSeed(projectIds[1])) {
    const pid = projectIds[1];

    // Materials ($6,800)
    await createItem({ projectId: pid, category: CostCategory.FLOORING, description: 'LVP Flooring — Main Floor', quantity: 1400, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 3.50, totalCost: 4900, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.FLOORING, description: 'Underlayment', quantity: 1400, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 0.50, totalCost: 700, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.INTERIOR_TRIM, description: 'Baseboard — MDF Primed', quantity: 200, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 3.25, totalCost: 650, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.INTERIOR_TRIM, description: 'Shoe Molding', quantity: 200, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 1.50, totalCost: 300, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.MATERIALS, description: 'Transitions & Adhesive', quantity: 1, unit: UnitOfMeasure.LOT, unitCost: 250, totalCost: 250, isLabor: false });

    // Labor ($3,000)
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Flooring Installation', quantity: 1400, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 1.50, totalCost: 2100, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Trim Installation', quantity: 200, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 3, totalCost: 600, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Shoe Molding Install', quantity: 200, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 1.50, totalCost: 300, isLabor: true });
  }

  // ======================================================================
  // Bradley Rental Refresh ($6,400)
  // 3 bedrooms + hallway: LVP, baseboard, ceiling paint
  // ======================================================================
  if (projectIds[2] && await shouldSeed(projectIds[2])) {
    const pid = projectIds[2];

    // Materials ($3,580)
    await createItem({ projectId: pid, category: CostCategory.FLOORING, description: 'LVP Flooring — Bedrooms + Hallway', quantity: 520, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 4.50, totalCost: 2340, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.FLOORING, description: 'Underlayment', quantity: 520, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 0.50, totalCost: 260, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.INTERIOR_TRIM, description: 'Baseboard — MDF Primed', quantity: 180, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 3, totalCost: 540, isLabor: false });
    await createItem({ projectId: pid, category: CostCategory.PAINTING, description: 'Ceiling Paint', quantity: 8, unit: UnitOfMeasure.GALLON, unitCost: 55, totalCost: 440, isLabor: false });

    // Labor ($2,820)
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Demo — Remove Existing Flooring', quantity: 8, unit: UnitOfMeasure.HOUR, unitCost: 45, totalCost: 360, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Flooring Installation', quantity: 520, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 2.50, totalCost: 1300, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Trim Installation', quantity: 180, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 3.50, totalCost: 630, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Ceiling Painting', quantity: 8, unit: UnitOfMeasure.HOUR, unitCost: 45, totalCost: 360, isLabor: true });
    await createItem({ projectId: pid, category: CostCategory.LABOR, description: 'Cleanup', quantity: 4, unit: UnitOfMeasure.HOUR, unitCost: 42.50, totalCost: 170, isLabor: true });
  }

  console.log(`Created ${count} line items`);
  return count;
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
 * Seed discovery drafts for demo projects.
 * Creates a completed discovery for Mitchell (projectIds[0]).
 */
export async function seedDiscoveryDrafts(
  _services: Services,
  projectIds: string[]
): Promise<number> {
  const services = getServices();
  let count = 0;

  // Mitchell Main Floor — completed discovery
  if (projectIds[0]) {
    const existing = await services.discoveryDrafts.findByProjectId(projectIds[0]);
    if (!existing) {
      const now = new Date().toISOString();
      await services.discoveryDrafts.create({
        projectId: projectIds[0],
        currentStep: 2,
        property: {
          address: { street: '45 Highfield St', city: 'Moncton', province: 'NB', postalCode: 'E1C 5N2' },
          homeType: 'detached',
          homeAge: '25-50',
          storeys: 2,
          totalSqft: 1400,
          parking: 'driveway',
          occupancy: 'occupied',
          pets: true,
          petDetails: '1 cat',
          accessNotes: 'Side door preferred. Ring doorbell.',
        },
        preferences: {
          style: 'transitional',
          colorDirection: 'warm',
          floorLook: 'warm_wood',
          trimStyle: 'match_existing',
          priorities: ['durability', 'appearance', 'pet_friendly'],
          inspirationNotes: 'Likes the warm oak look from Ritchies showroom. Wants something the cat can\'t scratch up.',
        },
        status: 'complete',
        customerName: 'Sarah Mitchell',
        createdAt: now,
        updatedAt: now,
      });
      count++;
      console.log('Created discovery draft: Mitchell Main Floor');
    } else {
      console.log('Discovery draft exists (skipped): Mitchell Main Floor');
    }
  }

  return count;
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

  // Seed leads (new structured tag format)
  const leadCount = await seedLeads(services);
  console.log(`✅ Created ${leadCount} leads`);

  // Seed projects with customer references
  const projectIds = await seedProjects(services, customerIds);
  console.log(`✅ Created ${projectIds.length} projects`);

  // Seed line items (estimates)
  await seedLineItems(services, projectIds);
  console.log('✅ Created line items');

  // Seed tasks for demo projects
  await seedTasks(services, projectIds);
  console.log('✅ Created tasks');

  // Seed activity events
  await seedActivityEvents(services, projectIds);
  console.log('✅ Created activity events');

  // Seed discovery drafts
  const discoveryCount = await seedDiscoveryDrafts(services, projectIds);
  console.log(`✅ Created ${discoveryCount} discovery drafts`);

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
