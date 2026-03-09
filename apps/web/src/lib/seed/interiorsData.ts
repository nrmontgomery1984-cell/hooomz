/**
 * Interiors Demo Seed Data
 *
 * 5 Customers, 7 Jobs at various pipeline stages, consultations, quotes,
 * change orders, line items, and 15-20 activity events spread across 30 days.
 *
 * Uses _seeded markers for bulk wipe. Does NOT delete activity events (append-only).
 */

import { ProjectStatus, ProjectType, CostCategory, UnitOfMeasure, TaskStatus, TaskPriority, JobStage } from '@hooomz/shared-contracts';
import type { CreateProject } from '@hooomz/shared-contracts';
import type { Services } from '../services';
import { getLoggedServices, getServices } from '../services';
import { getStorage } from '../storage/initialize';
import { StoreNames } from '../storage/StorageAdapter';
import { seedRevealGauges } from '../data/seed/reveal-gauges.seed';
import { seedSampleRooms } from '../data/seed/sample-rooms.seed';
import { seedSampleSelections } from '../data/seed/sample-selections.seed';

type LogFn = (msg: string) => void;

// ============================================================================
// Date Helpers
// ============================================================================

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0]; // date-only for scheduledDate
}

function daysFromNowISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ============================================================================
// Customer Data
// ============================================================================

const SEED_CUSTOMERS_V2 = [
  {
    firstName: 'Margaret',
    lastName: 'Arsenault',
    email: 'margaret.arsenault@email.com',
    phone: '506-555-3001',
    propertyAddress: '142 Elmwood Dr',
    propertyCity: 'Moncton',
    propertyProvince: 'NB',
    propertyPostalCode: 'E1C 5N2',
    leadSource: 'ritchies_referral' as const,
    notes: 'Margaret & Tom Arsenault. Main floor refresh in progress. Referred by Ritchies.',
    status: 'active' as const,
    jobIds: [] as string[],
    _seeded: true,
  },
  {
    firstName: 'Kevin',
    lastName: 'Bourque',
    email: 'kevin.bourque@email.com',
    phone: '506-555-3002',
    propertyAddress: '78 Pine St',
    propertyCity: 'Riverview',
    propertyProvince: 'NB',
    propertyPostalCode: 'E1B 3J4',
    leadSource: 'home_show' as const,
    notes: 'Kitchen & hallway renovation. Met at Home Show.',
    status: 'active' as const,
    jobIds: [] as string[],
    _seeded: true,
  },
  {
    firstName: 'Sandra',
    lastName: 'LeBlanc',
    email: 'sandra.leblanc@email.com',
    phone: '506-555-3003',
    propertyAddress: '234 Mapleton Rd',
    propertyCity: 'Moncton',
    propertyProvince: 'NB',
    propertyPostalCode: 'E1C 8K5',
    leadSource: 'word_of_mouth' as const,
    notes: 'Two projects: master bedroom flooring + basement stairs trim. Referred by a friend.',
    status: 'active' as const,
    jobIds: [] as string[],
    _seeded: true,
  },
  {
    firstName: 'James',
    lastName: 'Steeves',
    email: 'james.steeves@email.com',
    phone: '506-555-3004',
    propertyAddress: '19 Heritage Lane',
    propertyCity: 'Dieppe',
    propertyProvince: 'NB',
    propertyPostalCode: 'E1A 7K3',
    leadSource: 'website' as const,
    notes: 'James & Carol Steeves. Initial inquiry via website. Hot lead.',
    status: 'lead' as const,
    jobIds: [] as string[],
    _seeded: true,
  },
  {
    firstName: 'Patrick',
    lastName: 'Goguen',
    email: 'patrick.goguen@email.com',
    phone: '506-555-3005',
    propertyAddress: '55 Church St',
    propertyCity: 'Moncton',
    propertyProvince: 'NB',
    propertyPostalCode: 'E1C 4Z5',
    leadSource: 'repeat' as const,
    notes: 'Repeat customer. Living room project completed. Basement upcoming.',
    status: 'past' as const,
    jobIds: [] as string[],
    _seeded: true,
  },
];

// ============================================================================
// Project Data
// ============================================================================

function createProjects(customerIds: string[]): CreateProject[] {
  return [
    // 1. Arsenault Main Floor Refresh — Install stage ($14,200)
    {
      name: 'Arsenault Main Floor Refresh',
      projectType: ProjectType.RENOVATION,
      status: ProjectStatus.IN_PROGRESS,
      jobStage: JobStage.INSTALL,
      customerId: customerIds[0],
      address: { street: '142 Elmwood Dr', city: 'Moncton', province: 'NB', postalCode: 'E1C 5N2', country: 'Canada' },
      dates: { startDate: daysAgo(14).split('T')[0], estimatedEndDate: daysFromNow(7) },
      budget: { estimatedCost: 14200, actualCost: 5800 },
    },
    // 2. Bourque Kitchen & Hallway — Shield stage ($8,750)
    {
      name: 'Bourque Kitchen & Hallway',
      projectType: ProjectType.RENOVATION,
      status: ProjectStatus.APPROVED,
      jobStage: JobStage.SHIELD,
      customerId: customerIds[1],
      address: { street: '78 Pine St', city: 'Riverview', province: 'NB', postalCode: 'E1B 3J4', country: 'Canada' },
      dates: { startDate: daysFromNow(3), estimatedEndDate: daysFromNow(10) },
      budget: { estimatedCost: 8750, actualCost: 0 },
    },
    // 3. LeBlanc Master Bedroom — Quote stage ($6,400)
    {
      name: 'LeBlanc Master Bedroom',
      projectType: ProjectType.RENOVATION,
      status: ProjectStatus.QUOTED,
      jobStage: JobStage.QUOTE,
      customerId: customerIds[2],
      address: { street: '234 Mapleton Rd', city: 'Moncton', province: 'NB', postalCode: 'E1C 8K5', country: 'Canada' },
      dates: {},
      budget: { estimatedCost: 6400, actualCost: 0 },
    },
    // 4. LeBlanc Basement Stairs — Consultation stage ($3,200)
    {
      name: 'LeBlanc Basement Stairs',
      projectType: ProjectType.RENOVATION,
      status: ProjectStatus.LEAD,
      jobStage: JobStage.CONSULTATION,
      customerId: customerIds[2],
      address: { street: '234 Mapleton Rd', city: 'Moncton', province: 'NB', postalCode: 'E1C 8K5', country: 'Canada' },
      dates: {},
      budget: { estimatedCost: 3200, actualCost: 0 },
    },
    // 5. Steeves Initial Inquiry — Lead stage ($0)
    {
      name: 'Steeves Initial Inquiry',
      projectType: ProjectType.RENOVATION,
      status: ProjectStatus.LEAD,
      jobStage: JobStage.LEAD,
      customerId: customerIds[3],
      address: { street: '19 Heritage Lane', city: 'Dieppe', province: 'NB', postalCode: 'E1A 7K3', country: 'Canada' },
      dates: {},
      budget: { estimatedCost: 0, actualCost: 0 },
    },
    // 6. Goguen Living Room (Complete) ($11,500)
    {
      name: 'Goguen Living Room',
      projectType: ProjectType.RENOVATION,
      status: ProjectStatus.COMPLETE,
      jobStage: JobStage.COMPLETE,
      customerId: customerIds[4],
      address: { street: '55 Church St', city: 'Moncton', province: 'NB', postalCode: 'E1C 4Z5', country: 'Canada' },
      dates: { startDate: daysAgo(60).split('T')[0], estimatedEndDate: daysAgo(46).split('T')[0], actualEndDate: daysAgo(45).split('T')[0] },
      budget: { estimatedCost: 11500, actualCost: 11200 },
    },
    // 7. Arsenault Basement (Punch stage) ($9,800)
    {
      name: 'Arsenault Basement',
      projectType: ProjectType.RENOVATION,
      status: ProjectStatus.IN_PROGRESS,
      jobStage: JobStage.PUNCH,
      customerId: customerIds[0],
      address: { street: '142 Elmwood Dr', city: 'Moncton', province: 'NB', postalCode: 'E1C 5N2', country: 'Canada' },
      dates: { startDate: daysAgo(21).split('T')[0], estimatedEndDate: daysAgo(3).split('T')[0] },
      budget: { estimatedCost: 9800, actualCost: 9100 },
    },
  ];
}

// ============================================================================
// Main Seed Function
// ============================================================================

export async function seedInteriorsDemo(_services: Services, addLog: LogFn): Promise<void> {
  const services = getServices();
  const loggedServices = getLoggedServices();

  addLog('Starting Interiors demo seed...');

  // ---- 1. Customers (V2 store) ----
  const existingCustV2 = await services.customersV2.findAll();
  const customerIds: string[] = [];
  for (const custData of SEED_CUSTOMERS_V2) {
    const match = existingCustV2.find((c) => c.email === custData.email);
    if (match) {
      customerIds.push(match.id);
      addLog(`Customer exists (skipped): ${match.firstName} ${match.lastName}`);
      continue;
    }
    const record = await services.customersV2.create(custData);
    customerIds.push(record.id);
    addLog(`Created customer: ${record.firstName} ${record.lastName}`);
  }

  // ---- 2. Projects ----
  const { projects: existingProjects } = await services.projects.findAll();
  const projectData = createProjects(customerIds);
  const projectIds: string[] = [];
  for (const pData of projectData) {
    const match = existingProjects.find((p) => p.name === pData.name);
    if (match) {
      projectIds.push(match.id);
      // Patch jobStage if missing or changed
      if (pData.jobStage && match.jobStage !== pData.jobStage) {
        await loggedServices.projects.update(match.id, { id: match.id, jobStage: pData.jobStage } as import('@hooomz/shared-contracts').UpdateProject);
        addLog(`Patched jobStage on ${match.name}: ${pData.jobStage}`);
      } else {
        addLog(`Project exists (skipped): ${match.name}`);
      }
      continue;
    }
    const project = await loggedServices.projects.create(pData);
    projectIds.push(project.id);
    addLog(`Created project: ${project.name}`);
  }

  // Link projects to customers
  for (let i = 0; i < projectIds.length; i++) {
    const custIdx = [0, 1, 2, 2, 3, 4, 0][i]; // customer index per project
    const cust = await services.customersV2.findById(customerIds[custIdx]);
    if (cust && !cust.jobIds.includes(projectIds[i])) {
      await services.customersV2.addJobToCustomer(customerIds[custIdx], projectIds[i]);
    }
  }

  // ---- 3. Line Items for Arsenault Main Floor ($14,200) ----
  await seedLineItemsForProject(services, projectIds[0], 'Arsenault Main Floor', addLog);

  // ---- 4. Line Items for Goguen Living Room ($11,500) ----
  await seedLineItemsForProject(services, projectIds[5], 'Goguen Living Room', addLog);

  // ---- 5. Line Items for LeBlanc Master Bedroom ($6,400) ----
  await seedLineItemsForProject(services, projectIds[2], 'LeBlanc Master Bedroom', addLog);

  // ---- 5b. Tasks for active projects ----
  await seedTasksForProjects(services, projectIds, addLog);

  // ---- 6. Consultations ----
  const existingConsultations = await services.consultations.findAll();

  // Bourque: consultation completed 7 days ago
  if (!existingConsultations.find((c) => c.projectId === projectIds[1] && c._seeded)) {
    await services.consultations.create({
      customerId: customerIds[1],
      projectId: projectIds[1],
      scheduledDate: daysAgo(10).split('T')[0],
      completedDate: daysAgo(7).split('T')[0],
      sitePhotoIds: [],
      measurements: { kitchen_sqft: 180, hallway_sqft: 85 },
      scopeNotes: 'Kitchen LVP + hallway runner. Trim needed for doorway transitions.',
      status: 'completed',
      discoveryDraftId: null,
      _seeded: true,
    });
    addLog('Created consultation: Bourque Kitchen (completed)');
  }

  // LeBlanc Basement Stairs: consultation scheduled 3 days from now
  if (!existingConsultations.find((c) => c.projectId === projectIds[3] && c._seeded)) {
    await services.consultations.create({
      customerId: customerIds[2],
      projectId: projectIds[3],
      scheduledDate: daysFromNow(3),
      completedDate: null,
      sitePhotoIds: [],
      measurements: {},
      scopeNotes: 'Basement stairs trim and nosing. Measure stair dimensions.',
      status: 'scheduled',
      discoveryDraftId: null,
      _seeded: true,
    });
    addLog('Created consultation: LeBlanc Basement Stairs (scheduled in 3 days)');
  }

  // ---- 7. Quotes ----
  const existingQuotes = await services.quotes.findAll();

  // Goguen Living Room: quote accepted ($11,500)
  if (!existingQuotes.find((q) => q.projectId === projectIds[5] && q._seeded)) {
    await services.quotes.create({
      customerId: customerIds[4],
      projectId: projectIds[5],
      totalAmount: 11500,
      status: 'accepted',
      sentAt: daysAgo(55),
      viewedAt: daysAgo(54),
      respondedAt: daysAgo(52),
      expiresAt: null,
      coverNotes: 'Living room LVP, trim, and paint. Includes furniture move-back.',
      videoLink: '',
      declineReason: '',
      _seeded: true,
    });
    addLog('Created quote: Goguen Living Room (accepted, $11,500)');
  }

  // LeBlanc Master Bedroom: quote sent, expires 5 days from now
  if (!existingQuotes.find((q) => q.projectId === projectIds[2] && q._seeded)) {
    await services.quotes.create({
      customerId: customerIds[2],
      projectId: projectIds[2],
      totalAmount: 6400,
      status: 'sent',
      sentAt: daysAgo(3),
      viewedAt: null,
      respondedAt: null,
      expiresAt: daysFromNowISO(5),
      coverNotes: 'Master bedroom flooring with premium LVP and new baseboard throughout.',
      videoLink: '',
      declineReason: '',
      _seeded: true,
    });
    addLog('Created quote: LeBlanc Master Bedroom (sent, expires in 5 days)');
  }

  // Arsenault Main Floor: quote accepted ($14,200)
  if (!existingQuotes.find((q) => q.projectId === projectIds[0] && q._seeded)) {
    await services.quotes.create({
      customerId: customerIds[0],
      projectId: projectIds[0],
      totalAmount: 14200,
      status: 'accepted',
      sentAt: daysAgo(20),
      viewedAt: daysAgo(19),
      respondedAt: daysAgo(17),
      expiresAt: null,
      coverNotes: 'Main floor refresh: Flooring + Paint + Trim for living & dining room.',
      videoLink: '',
      declineReason: '',
      _seeded: true,
    });
    addLog('Created quote: Arsenault Main Floor (accepted, $14,200)');
  }

  // ---- 8. Change Order: Arsenault subfloor repair ($650, approved) ----
  // Use service flow: create → submit → approve
  const existingCOs = await services.integration.changeOrders.getByProject(projectIds[0]);
  if (!existingCOs.find((co: { title: string }) => co.title.includes('Subfloor Repair'))) {
    const co = await services.integration.changeOrders.createChangeOrder(projectIds[0], {
      title: 'Subfloor Repair — Living Room',
      description: 'Discovered soft spot near bay window during demo. Needs sistering of 2 joists and new 3/4" subfloor patch.',
      initiatorType: 'site_condition',
      initiatedBy: 'Nathan Montgomery',
      costImpact: 650,
      scheduleImpactDays: 1,
      createdBy: 'Nathan Montgomery',
    });
    await services.integration.changeOrders.submitForApproval(co.id);
    await services.integration.changeOrders.approveChangeOrder(co.id, 'Margaret Arsenault');
    addLog('Created change order: Arsenault subfloor repair ($650, approved)');
  }

  // ---- 9. Invoices + Payments ----
  await seedInvoicesAndPayments(services, customerIds, projectIds, addLog);

  // ---- 10. Activity Events (15-20 across 30 days) ----
  await seedActivityEvents(services, customerIds, projectIds, addLog);

  // ---- 11. Reveal Gauges (localStorage) ----
  const gaugesSeeded = seedRevealGauges();
  addLog(gaugesSeeded ? 'Seeded 4 reveal gauges' : 'Reveal gauges already exist (skipped)');

  // ---- 12. Sample Rooms for Arsenault Main Floor (projectIds[0]) ----
  const roomsSeeded = await seedSampleRooms(projectIds[0]);
  addLog(roomsSeeded ? 'Seeded 2 sample rooms (Living Room + Primary Bedroom)' : 'Sample rooms already exist (skipped)');

  // ---- 13. Material Selections for demo rooms ----
  const selectionsSeeded = await seedSampleSelections(projectIds[0]);
  addLog(selectionsSeeded ? 'Seeded 6 confirmed material selections (3 per room)' : 'Material selections already exist (skipped)');

  addLog('Interiors demo seed complete!');
}

// ============================================================================
// Line Items (Estimates)
// ============================================================================

async function seedLineItemsForProject(
  services: Services,
  projectId: string,
  label: string,
  addLog: LogFn
): Promise<void> {
  const existing = await services.estimating.lineItems.findByProjectId(projectId);
  if (existing.length > 0) {
    addLog(`Line items exist for ${label} (skipped)`);
    return;
  }

  const create = (item: Parameters<typeof services.estimating.lineItems.create>[0]) =>
    services.estimating.lineItems.create(item);

  if (label === 'Arsenault Main Floor') {
    // Materials (~$6,140)
    await create({ projectId, category: CostCategory.FLOORING, description: 'LVP Flooring — Living Room', quantity: 420, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5.50, totalCost: 2310, isLabor: false });
    await create({ projectId, category: CostCategory.FLOORING, description: 'LVP Flooring — Dining Room', quantity: 260, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5.50, totalCost: 1430, isLabor: false });
    await create({ projectId, category: CostCategory.FLOORING, description: 'Underlayment', quantity: 680, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 0.75, totalCost: 510, isLabor: false });
    await create({ projectId, category: CostCategory.INTERIOR_TRIM, description: 'Baseboard — MDF Primed', quantity: 140, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 3.50, totalCost: 490, isLabor: false });
    await create({ projectId, category: CostCategory.PAINTING, description: 'Paint + Primer', quantity: 10, unit: UnitOfMeasure.GALLON, unitCost: 65, totalCost: 650, isLabor: false });
    await create({ projectId, category: CostCategory.MATERIALS, description: 'Misc Supplies (transitions, adhesive, caulk)', quantity: 1, unit: UnitOfMeasure.LOT, unitCost: 750, totalCost: 750, isLabor: false });
    // Labor (~$8,060)
    await create({ projectId, category: CostCategory.LABOR, description: 'Flooring Installation', quantity: 680, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5.50, totalCost: 3740, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Trim Installation', quantity: 140, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 6, totalCost: 840, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Painting', quantity: 800, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 3, totalCost: 2400, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Demo & Prep', quantity: 16, unit: UnitOfMeasure.HOUR, unitCost: 45, totalCost: 720, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Cleanup & Moveout', quantity: 8, unit: UnitOfMeasure.HOUR, unitCost: 45, totalCost: 360, isLabor: true });
    addLog(`Created 11 line items for ${label}`);
  }

  if (label === 'Goguen Living Room') {
    // Materials (~$5,600)
    await create({ projectId, category: CostCategory.FLOORING, description: 'LVP Flooring — Living Room', quantity: 550, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5.00, totalCost: 2750, isLabor: false });
    await create({ projectId, category: CostCategory.FLOORING, description: 'Underlayment', quantity: 550, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 0.75, totalCost: 413, isLabor: false });
    await create({ projectId, category: CostCategory.INTERIOR_TRIM, description: 'Baseboard — MDF Primed', quantity: 120, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 3.50, totalCost: 420, isLabor: false });
    await create({ projectId, category: CostCategory.PAINTING, description: 'Paint + Primer', quantity: 8, unit: UnitOfMeasure.GALLON, unitCost: 65, totalCost: 520, isLabor: false });
    await create({ projectId, category: CostCategory.MATERIALS, description: 'Misc Supplies', quantity: 1, unit: UnitOfMeasure.LOT, unitCost: 500, totalCost: 500, isLabor: false });
    // Labor (~$5,900)
    await create({ projectId, category: CostCategory.LABOR, description: 'Flooring Installation', quantity: 550, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5.50, totalCost: 3025, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Trim Installation', quantity: 120, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 6, totalCost: 720, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Painting', quantity: 600, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 2.75, totalCost: 1650, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Demo & Cleanup', quantity: 12, unit: UnitOfMeasure.HOUR, unitCost: 42, totalCost: 504, isLabor: true });
    addLog(`Created 9 line items for ${label}`);
  }

  if (label === 'LeBlanc Master Bedroom') {
    // Materials (~$3,200)
    await create({ projectId, category: CostCategory.FLOORING, description: 'LVP Flooring — Master Bedroom', quantity: 320, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5.50, totalCost: 1760, isLabor: false });
    await create({ projectId, category: CostCategory.FLOORING, description: 'Underlayment', quantity: 320, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 0.75, totalCost: 240, isLabor: false });
    await create({ projectId, category: CostCategory.INTERIOR_TRIM, description: 'Baseboard — MDF Primed', quantity: 80, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 3.50, totalCost: 280, isLabor: false });
    await create({ projectId, category: CostCategory.PAINTING, description: 'Paint + Primer', quantity: 6, unit: UnitOfMeasure.GALLON, unitCost: 65, totalCost: 390, isLabor: false });
    await create({ projectId, category: CostCategory.MATERIALS, description: 'Misc Supplies', quantity: 1, unit: UnitOfMeasure.LOT, unitCost: 530, totalCost: 530, isLabor: false });
    // Labor (~$3,200)
    await create({ projectId, category: CostCategory.LABOR, description: 'Flooring Installation', quantity: 320, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 5, totalCost: 1600, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Trim Installation', quantity: 80, unit: UnitOfMeasure.LINEAR_FOOT, unitCost: 6, totalCost: 480, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Painting', quantity: 400, unit: UnitOfMeasure.SQUARE_FOOT, unitCost: 2.50, totalCost: 1000, isLabor: true });
    await create({ projectId, category: CostCategory.LABOR, description: 'Demo & Cleanup', quantity: 4, unit: UnitOfMeasure.HOUR, unitCost: 30, totalCost: 120, isLabor: true });
    addLog(`Created 9 line items for ${label}`);
  }
}

// ============================================================================
// Tasks for active projects
// ============================================================================

async function seedTasksForProjects(
  services: Services,
  projectIds: string[],
  addLog: LogFn
): Promise<void> {
  const create = (item: {
    projectId: string;
    title: string;
    description: string;
    status: typeof TaskStatus[keyof typeof TaskStatus];
    priority: typeof TaskPriority[keyof typeof TaskPriority];
    dependencies: string[];
  }) => services.scheduling.tasks.create(item);

  // Check if tasks already exist for the first project
  const existingTasks = await services.scheduling.tasks.findByProjectId(projectIds[0]);
  if (existingTasks.length > 0) {
    addLog('Tasks already exist for seed projects (skipped)');
    return;
  }

  let count = 0;

  // 1. Arsenault Main Floor Refresh — Install stage
  // Demo/prep DONE, flooring in-progress, trim/paint not started
  if (projectIds[0]) {
    const pid = projectIds[0];
    const tasks: { title: string; desc: string; status: typeof TaskStatus[keyof typeof TaskStatus] }[] = [
      { title: 'Remove existing flooring — Living Room', desc: 'Demolition · Flooring', status: TaskStatus.COMPLETE },
      { title: 'Remove existing flooring — Dining Room', desc: 'Demolition · Flooring', status: TaskStatus.COMPLETE },
      { title: 'Remove existing baseboard — Living Room', desc: 'Demolition · Finish Carpentry', status: TaskStatus.COMPLETE },
      { title: 'Remove existing baseboard — Dining Room', desc: 'Demolition · Finish Carpentry', status: TaskStatus.COMPLETE },
      { title: 'Prep subfloor — check for squeaks, level — Living Room', desc: 'Prime & Prep · Flooring\nsopId:HI-SOP-FL-001', status: TaskStatus.COMPLETE },
      { title: 'Prep subfloor — Dining Room', desc: 'Prime & Prep · Flooring\nsopId:HI-SOP-FL-001', status: TaskStatus.COMPLETE },
      { title: 'Install LVP (420 sqft) — Living Room', desc: 'Finish · Flooring\nsopId:HI-SOP-FL-004', status: TaskStatus.IN_PROGRESS },
      { title: 'Install LVP (260 sqft) — Dining Room', desc: 'Finish · Flooring\nsopId:HI-SOP-FL-004', status: TaskStatus.NOT_STARTED },
      { title: 'Install baseboard — Living Room', desc: 'Finish · Finish Carpentry\nsopId:HI-SOP-FC-003', status: TaskStatus.NOT_STARTED },
      { title: 'Install baseboard — Dining Room', desc: 'Finish · Finish Carpentry\nsopId:HI-SOP-FC-003', status: TaskStatus.NOT_STARTED },
      { title: 'Paint walls — Living Room', desc: 'Finish · Paint\nsopId:HI-SOP-PT-002', status: TaskStatus.NOT_STARTED },
      { title: 'Paint walls — Dining Room', desc: 'Finish · Paint\nsopId:HI-SOP-PT-002', status: TaskStatus.NOT_STARTED },
    ];
    for (const t of tasks) {
      await create({ projectId: pid, title: t.title, description: t.desc, status: t.status, priority: TaskPriority.MEDIUM, dependencies: [] });
      count++;
    }
  }

  // 2. Bourque Kitchen & Hallway — full SCRIPT task set
  if (projectIds[1]) {
    const pid = projectIds[1];
    const tasks: { title: string; desc: string }[] = [
      // Shield — protect the home before work begins
      { title: 'Lay floor protection — Kitchen', desc: 'Shield · Flooring' },
      { title: 'Lay floor protection — Hallway', desc: 'Shield · Flooring' },
      // Clear — demolition
      { title: 'Remove existing flooring — Kitchen', desc: 'Demolition · Flooring' },
      { title: 'Remove existing flooring — Hallway', desc: 'Demolition · Flooring' },
      // Ready — prep
      { title: 'Prep subfloor — Kitchen', desc: 'Prime & Prep · Flooring\nsopId:HI-SOP-FL-001' },
      // Install — finish work
      { title: 'Install LVP (180 sqft) — Kitchen', desc: 'Finish · Flooring\nsopId:HI-SOP-FL-004' },
      { title: 'Install LVP (85 sqft) — Hallway', desc: 'Finish · Flooring\nsopId:HI-SOP-FL-004' },
      { title: 'Install transition strips — Kitchen', desc: 'Finish · Flooring\nsopId:HI-SOP-FL-007' },
      { title: 'Install baseboard — Kitchen', desc: 'Finish · Finish Carpentry\nsopId:HI-SOP-FC-003' },
      { title: 'Install baseboard — Hallway', desc: 'Finish · Finish Carpentry\nsopId:HI-SOP-FC-003' },
      // Punch — deficiency review
      { title: 'Inspect LVP seams & transitions — Kitchen', desc: 'Punch List · Flooring' },
      { title: 'Touch up caulk & nail holes — Kitchen', desc: 'Punch List · Finish Carpentry' },
      { title: 'Touch up caulk & nail holes — Hallway', desc: 'Punch List · Finish Carpentry' },
      // Turnover — closeout & handoff
      { title: 'Final clean — Kitchen & Hallway', desc: 'Closeout · Overhead' },
      { title: 'Walkthrough & sign-off with homeowner', desc: 'Closeout · Overhead' },
    ];
    for (const t of tasks) {
      await create({ projectId: pid, title: t.title, description: t.desc, status: TaskStatus.NOT_STARTED, priority: TaskPriority.MEDIUM, dependencies: [] });
      count++;
    }
  }

  // 6. Goguen Living Room — Complete (all done)
  if (projectIds[5]) {
    const pid = projectIds[5];
    const tasks: { title: string; desc: string }[] = [
      { title: 'Remove existing flooring — Living Room', desc: 'Demolition · Flooring' },
      { title: 'Prep subfloor — Living Room', desc: 'Prime & Prep · Flooring\nsopId:HI-SOP-FL-001' },
      { title: 'Install LVP (550 sqft) — Living Room', desc: 'Finish · Flooring\nsopId:HI-SOP-FL-004' },
      { title: 'Install baseboard — Living Room', desc: 'Finish · Finish Carpentry\nsopId:HI-SOP-FC-003' },
      { title: 'Paint walls — Living Room', desc: 'Finish · Paint\nsopId:HI-SOP-PT-002' },
      { title: 'Final inspection — Living Room', desc: 'Closeout · Overhead' },
    ];
    for (const t of tasks) {
      await create({ projectId: pid, title: t.title, description: t.desc, status: TaskStatus.COMPLETE, priority: TaskPriority.MEDIUM, dependencies: [] });
      count++;
    }
  }

  // 7. Arsenault Basement — Punch stage (most done, punch items remaining)
  if (projectIds[6]) {
    const pid = projectIds[6];
    const tasks: { title: string; desc: string; status: typeof TaskStatus[keyof typeof TaskStatus] }[] = [
      { title: 'Remove existing flooring — Basement', desc: 'Demolition · Flooring', status: TaskStatus.COMPLETE },
      { title: 'Prep subfloor — Basement', desc: 'Prime & Prep · Flooring\nsopId:HI-SOP-FL-001', status: TaskStatus.COMPLETE },
      { title: 'Install LVP — Basement', desc: 'Finish · Flooring\nsopId:HI-SOP-FL-004', status: TaskStatus.COMPLETE },
      { title: 'Install baseboard — Basement', desc: 'Finish · Finish Carpentry\nsopId:HI-SOP-FC-003', status: TaskStatus.COMPLETE },
      { title: 'Paint walls — Basement', desc: 'Finish · Paint\nsopId:HI-SOP-PT-002', status: TaskStatus.COMPLETE },
      { title: 'Touch up paint scuffs — Basement', desc: 'Punch List · Paint', status: TaskStatus.NOT_STARTED },
      { title: 'Fix baseboard gap at stairwell — Basement', desc: 'Punch List · Finish Carpentry', status: TaskStatus.NOT_STARTED },
      { title: 'Final clean & walkthrough — Basement', desc: 'Closeout · Overhead', status: TaskStatus.NOT_STARTED },
    ];
    for (const t of tasks) {
      await create({ projectId: pid, title: t.title, description: t.desc, status: t.status, priority: TaskPriority.MEDIUM, dependencies: [] });
      count++;
    }
  }

  addLog(`Created ${count} tasks across seed projects`);
}

// ============================================================================
// Invoices + Payments
// ============================================================================

async function seedInvoicesAndPayments(
  services: Services,
  customerIds: string[],
  projectIds: string[],
  addLog: LogFn,
): Promise<void> {
  const storage = getStorage();

  // Check if already seeded
  const existingInvoices = await services.invoices.findAll();
  if (existingInvoices.some((inv) => inv._seeded)) {
    addLog('Invoices already seeded (skipped)');
    return;
  }

  const ts = new Date().toISOString();
  const meta = (v = 1) => ({ createdAt: ts, updatedAt: ts, version: v });

  // INV-2026-001: Arsenault Main Floor — deposit, PAID ($4,260 = 30% of $14,200)
  const inv1Id = `inv_seed_001`;
  const inv1: any = {
    id: inv1Id,
    projectId: projectIds[0],
    customerId: customerIds[0],
    invoiceNumber: 'INV-2026-001',
    invoiceType: 'deposit',
    status: 'paid',
    lineItems: [
      { description: 'Deposit — 30% of contract', quantity: 1, unit: 'lump_sum', unitCost: 4260, totalCost: 4260, category: 'flooring' },
    ],
    subtotal: 4260,
    taxRate: 0.15,
    taxAmount: 639,
    totalAmount: 4899,
    amountPaid: 4899,
    balanceDue: 0,
    dueDate: daysAgo(12).split('T')[0],
    sentAt: daysAgo(15),
    paidAt: daysAgo(12),
    _seeded: true,
    metadata: meta(),
  };
  await storage.set(StoreNames.INVOICES, inv1Id, inv1);

  // Payment for INV-2026-001
  const pay1Id = `pay_seed_001`;
  await storage.set(StoreNames.PAYMENTS, pay1Id, {
    id: pay1Id,
    invoiceId: inv1Id,
    projectId: projectIds[0],
    amount: 4899,
    method: 'etransfer',
    date: daysAgo(12).split('T')[0],
    reference: 'ET-1001',
    _seeded: true,
    metadata: meta(),
  });
  addLog('Created invoice: INV-2026-001 (Arsenault deposit, paid)');

  // INV-2026-002: Arsenault Basement — progress, PARTIAL ($6,860 = 70% of $9,800)
  const inv2Id = `inv_seed_002`;
  const inv2: any = {
    id: inv2Id,
    projectId: projectIds[6],
    customerId: customerIds[0],
    invoiceNumber: 'INV-2026-002',
    invoiceType: 'progress',
    status: 'partial',
    lineItems: [
      { description: 'Progress billing — 70% of contract', quantity: 1, unit: 'lump_sum', unitCost: 6860, totalCost: 6860, category: 'flooring' },
    ],
    subtotal: 6860,
    taxRate: 0.15,
    taxAmount: 1029,
    totalAmount: 7889,
    amountPaid: 5000,
    balanceDue: 2889,
    dueDate: daysFromNow(10),
    sentAt: daysAgo(5),
    _seeded: true,
    metadata: meta(),
  };
  await storage.set(StoreNames.INVOICES, inv2Id, inv2);

  // Two partial payments
  const pay2aId = `pay_seed_002a`;
  await storage.set(StoreNames.PAYMENTS, pay2aId, {
    id: pay2aId,
    invoiceId: inv2Id,
    projectId: projectIds[6],
    amount: 3000,
    method: 'etransfer',
    date: daysAgo(3).split('T')[0],
    reference: 'ET-1002',
    _seeded: true,
    metadata: meta(),
  });
  const pay2bId = `pay_seed_002b`;
  await storage.set(StoreNames.PAYMENTS, pay2bId, {
    id: pay2bId,
    invoiceId: inv2Id,
    projectId: projectIds[6],
    amount: 2000,
    method: 'cheque',
    date: daysAgo(1).split('T')[0],
    reference: 'CHQ-4455',
    _seeded: true,
    metadata: meta(),
  });
  addLog('Created invoice: INV-2026-002 (Arsenault Basement, partial — $5,000 of $7,889)');

  // INV-2026-003: Goguen Living Room — final, OVERDUE ($11,500)
  const inv3Id = `inv_seed_003`;
  const inv3: any = {
    id: inv3Id,
    projectId: projectIds[5],
    customerId: customerIds[4],
    invoiceNumber: 'INV-2026-003',
    invoiceType: 'final',
    status: 'sent', // refreshOverdueStatus will flip to 'overdue' on read
    lineItems: [
      { description: 'Living room LVP flooring', quantity: 320, unit: 'sqft', unitCost: 18.75, totalCost: 6000, category: 'flooring' },
      { description: 'Baseboard & shoe moulding', quantity: 120, unit: 'lnft', unitCost: 12.50, totalCost: 1500, category: 'interior-trim' },
      { description: 'Paint — walls & ceiling', quantity: 1, unit: 'lump_sum', unitCost: 4000, totalCost: 4000, category: 'painting' },
    ],
    subtotal: 11500,
    taxRate: 0.15,
    taxAmount: 1725,
    totalAmount: 13225,
    amountPaid: 0,
    balanceDue: 13225,
    dueDate: daysAgo(8).split('T')[0], // 8 days past due
    sentAt: daysAgo(22),
    _seeded: true,
    metadata: meta(),
  };
  await storage.set(StoreNames.INVOICES, inv3Id, inv3);
  addLog('Created invoice: INV-2026-003 (Goguen final, overdue — $13,225)');
}

// ============================================================================
// Activity Events (15-20 spread across 30 days)
// ============================================================================

async function seedActivityEvents(
  services: Services,
  customerIds: string[],
  projectIds: string[],
  addLog: LogFn
): Promise<void> {
  // We use direct activity.create() calls. The timestamps will be "now"
  // but the summary includes the narrative timeline. For a demo,
  // current timestamps work — the events will show up in "Today" grouping.
  // For historical spread, we write directly to storage after creation.

  const act = services.activity;
  let count = 0;

  const createEvent = async (
    data: Parameters<typeof act.create>[0],
    overrideTimestamp?: string
  ) => {
    const event = await act.create(data);
    // Patch timestamp for historical spread (seed-only workaround)
    if (overrideTimestamp && event) {
      const patched = { ...event, timestamp: overrideTimestamp };
      const storage = getStorage();
      await storage.set(StoreNames.ACTIVITY_EVENTS, event.id, patched);
    }
    count++;
  };

  // -- Goguen story (45-52 days ago) --
  await createEvent({
    event_type: 'customer_created',
    project_id: projectIds[5],
    entity_type: 'customer',
    entity_id: customerIds[4],
    summary: 'Customer created: Patrick Goguen',
    event_data: { _seeded: true },
  }, daysAgo(60));

  await createEvent({
    event_type: 'quote_sent',
    project_id: projectIds[5],
    entity_type: 'quote',
    entity_id: projectIds[5], // placeholder — real quote ID would be used
    summary: 'Quote sent to Patrick Goguen ($11,500)',
    event_data: { _seeded: true },
  }, daysAgo(55));

  await createEvent({
    event_type: 'quote_accepted',
    project_id: projectIds[5],
    entity_type: 'quote',
    entity_id: projectIds[5],
    summary: 'Quote accepted ($11,500) — Goguen Living Room',
    event_data: { _seeded: true },
  }, daysAgo(52));

  await createEvent({
    event_type: 'project.completed',
    project_id: projectIds[5],
    entity_type: 'project',
    entity_id: projectIds[5],
    summary: 'Project completed: Goguen Living Room',
    event_data: { _seeded: true },
  }, daysAgo(45));

  // -- Arsenault Main Floor story (20+ days ago) --
  await createEvent({
    event_type: 'customer_created',
    project_id: projectIds[0],
    entity_type: 'customer',
    entity_id: customerIds[0],
    summary: 'Customer created: Margaret Arsenault',
    event_data: { _seeded: true },
  }, daysAgo(25));

  await createEvent({
    event_type: 'quote_sent',
    project_id: projectIds[0],
    entity_type: 'quote',
    entity_id: projectIds[0],
    summary: 'Quote sent to Margaret Arsenault ($14,200)',
    event_data: { _seeded: true },
  }, daysAgo(20));

  await createEvent({
    event_type: 'quote_accepted',
    project_id: projectIds[0],
    entity_type: 'quote',
    entity_id: projectIds[0],
    summary: 'Quote accepted ($14,200) — Arsenault Main Floor Refresh',
    event_data: { _seeded: true },
  }, daysAgo(17));

  await createEvent({
    event_type: 'project.stage_advanced',
    project_id: projectIds[0],
    entity_type: 'project',
    entity_id: projectIds[0],
    summary: 'Stage advanced to Install — Arsenault Main Floor',
    event_data: { _seeded: true },
  }, daysAgo(14));

  await createEvent({
    event_type: 'change_order_created',
    project_id: projectIds[0],
    entity_type: 'change_order',
    entity_id: projectIds[0],
    summary: 'Change order: Subfloor Repair — Living Room ($650)',
    event_data: { _seeded: true },
  }, daysAgo(10));

  await createEvent({
    event_type: 'change_order_approved',
    project_id: projectIds[0],
    entity_type: 'change_order',
    entity_id: projectIds[0],
    summary: 'Change order approved by Margaret Arsenault ($650)',
    event_data: { _seeded: true },
  }, daysAgo(10));

  // -- Bourque story (10 days ago) --
  await createEvent({
    event_type: 'customer_created',
    project_id: projectIds[1],
    entity_type: 'customer',
    entity_id: customerIds[1],
    summary: 'Customer created: Kevin Bourque (Home Show)',
    event_data: { _seeded: true },
  }, daysAgo(14));

  await createEvent({
    event_type: 'consultation_completed',
    project_id: projectIds[1],
    entity_type: 'consultation',
    entity_id: projectIds[1],
    summary: 'Consultation completed — Bourque Kitchen & Hallway',
    event_data: { _seeded: true },
  }, daysAgo(7));

  // -- LeBlanc stories --
  await createEvent({
    event_type: 'customer_created',
    project_id: projectIds[2],
    entity_type: 'customer',
    entity_id: customerIds[2],
    summary: 'Customer created: Sandra LeBlanc',
    event_data: { _seeded: true },
  }, daysAgo(12));

  await createEvent({
    event_type: 'project.created',
    project_id: projectIds[2],
    entity_type: 'project',
    entity_id: projectIds[2],
    summary: 'Project created: LeBlanc Master Bedroom',
    event_data: { _seeded: true },
  }, daysAgo(10));

  await createEvent({
    event_type: 'quote_sent',
    project_id: projectIds[2],
    entity_type: 'quote',
    entity_id: projectIds[2],
    summary: 'Quote sent to Sandra LeBlanc ($6,400)',
    event_data: { _seeded: true },
  }, daysAgo(3));

  await createEvent({
    event_type: 'consultation_scheduled',
    project_id: projectIds[3],
    entity_type: 'consultation',
    entity_id: projectIds[3],
    summary: `Consultation scheduled — LeBlanc Basement Stairs (${daysFromNow(3)})`,
    event_data: { _seeded: true },
  }, daysAgo(2));

  // -- Steeves hot lead --
  await createEvent({
    event_type: 'customer_created',
    project_id: projectIds[4],
    entity_type: 'customer',
    entity_id: customerIds[3],
    summary: 'New lead: James Steeves (website inquiry)',
    event_data: { _seeded: true },
  }, daysAgo(1));

  // -- Arsenault Basement story --
  await createEvent({
    event_type: 'project.created',
    project_id: projectIds[6],
    entity_type: 'project',
    entity_id: projectIds[6],
    summary: 'Project created: Arsenault Basement',
    event_data: { _seeded: true },
  }, daysAgo(21));

  await createEvent({
    event_type: 'project.stage_advanced',
    project_id: projectIds[6],
    entity_type: 'project',
    entity_id: projectIds[6],
    summary: 'Stage advanced to Punch — Arsenault Basement',
    event_data: { _seeded: true },
  }, daysAgo(3));

  addLog(`Created ${count} activity events`);
}

// ============================================================================
// Wipe Function
// ============================================================================

export async function wipeInteriorsDemo(_services: Services, addLog: LogFn): Promise<void> {
  const services = getServices();

  addLog('Wiping Interiors demo data...');

  // 1. Wipe CustomerV2 records with _seeded flag
  const allCustV2 = await services.customersV2.findAll();
  let custCount = 0;
  for (const c of allCustV2) {
    if (c._seeded) {
      await services.customersV2.delete(c.id);
      custCount++;
    }
  }
  addLog(`Deleted ${custCount} seeded customers (V2)`);

  // 2. Wipe projects by name (seed projects have known names)
  const seedProjectNames = [
    'Arsenault Main Floor Refresh',
    'Bourque Kitchen & Hallway',
    'LeBlanc Master Bedroom',
    'LeBlanc Basement Stairs',
    'Steeves Initial Inquiry',
    'Goguen Living Room',
    'Arsenault Basement',
  ];
  const { projects: allProjects } = await services.projects.findAll();
  const storage = getStorage();
  let projCount = 0;
  for (const p of allProjects) {
    if (seedProjectNames.includes(p.name)) {
      // Wipe tasks via direct storage (avoids TaskRepository.delete hitting non-existent taskDependencies store)
      const tasks = await services.scheduling.tasks.findByProjectId(p.id);
      for (const t of tasks) {
        await storage.delete(StoreNames.TASKS, t.id);
      }
      // Wipe line items and change orders
      const lineItems = await services.estimating.lineItems.findByProjectId(p.id);
      for (const li of lineItems) {
        await services.estimating.lineItems.delete(li.id);
      }
      const cos = await services.integration.changeOrders.getByProject(p.id);
      for (const co of cos) {
        await storage.delete(StoreNames.CHANGE_ORDERS, co.id);
      }
      await services.projects.delete(p.id);
      projCount++;
    }
  }
  addLog(`Deleted ${projCount} seeded projects (with line items & change orders)`);

  // 4. Wipe consultations with _seeded flag
  const allConsultations = await services.consultations.findAll();
  let consultCount = 0;
  for (const c of allConsultations) {
    if (c._seeded) {
      await services.consultations.delete(c.id);
      consultCount++;
    }
  }
  addLog(`Deleted ${consultCount} seeded consultations`);

  // 5. Wipe quotes with _seeded flag
  const allQuotes = await services.quotes.findAll();
  let quoteCount = 0;
  for (const q of allQuotes) {
    if (q._seeded) {
      await services.quotes.delete(q.id);
      quoteCount++;
    }
  }
  addLog(`Deleted ${quoteCount} seeded quotes`);

  // 6. Wipe invoices with _seeded flag
  const allInvoices = await services.invoices.findAll();
  let invCount = 0;
  for (const inv of allInvoices) {
    if (inv._seeded) {
      await storage.delete(StoreNames.INVOICES, inv.id);
      invCount++;
    }
  }
  addLog(`Deleted ${invCount} seeded invoices`);

  // 7. Wipe payments with _seeded flag
  const allPayments = await services.payments.findAll();
  let payCount = 0;
  for (const p of allPayments) {
    if (p._seeded) {
      await storage.delete(StoreNames.PAYMENTS, p.id);
      payCount++;
    }
  }
  addLog(`Deleted ${payCount} seeded payments`);

  // 8. Wipe seed rooms + room scan
  const allRooms = await storage.getAll<{ id: string }>(StoreNames.ROOMS);
  let roomCount = 0;
  for (const r of allRooms) {
    if (r.id.startsWith('SEED-ROOM-')) {
      await storage.delete(StoreNames.ROOMS, r.id);
      roomCount++;
    }
  }
  const allScans = await storage.getAll<{ id: string }>(StoreNames.ROOM_SCANS);
  for (const s of allScans) {
    if (s.id.startsWith('SEED-SCAN-')) {
      await storage.delete(StoreNames.ROOM_SCANS, s.id);
    }
  }
  addLog(`Deleted ${roomCount} seeded rooms`);

  // 9. Wipe seed material selections
  const allSels = await storage.getAll<{ id: string }>(StoreNames.PROJECT_MATERIAL_SELECTIONS);
  let selCount = 0;
  for (const s of allSels) {
    if (s.id.startsWith('SEED-SEL-')) {
      await storage.delete(StoreNames.PROJECT_MATERIAL_SELECTIONS, s.id);
      selCount++;
    }
  }
  addLog(`Deleted ${selCount} seeded material selections`);

  // 10. Wipe seed reveal gauges from localStorage
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('hooomz_reveal_gauges');
    if (raw) {
      try {
        const gauges = JSON.parse(raw);
        if (Array.isArray(gauges) && gauges.some((g: { id: string }) => g.id === 'SEED-REVEAL-001')) {
          localStorage.removeItem('hooomz_reveal_gauges');
          addLog('Removed seeded reveal gauges');
        }
      } catch {
        // ignore
      }
    }
  }

  // Activity events are append-only — we do NOT delete them
  addLog('Activity events preserved (append-only per architecture rules)');

  addLog('Interiors demo wipe complete!');
}
