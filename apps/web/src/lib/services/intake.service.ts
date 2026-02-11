/**
 * Intake Service - Processes intake wizard data
 *
 * Responsibilities:
 * 1. Create projects from intake data
 * 2. Generate loops based on scope (three-axis tagging)
 * 3. Create tasks from bundle type per room
 * 4. Log all activity events
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 */

import {
  generateId,
  generateCustomerId,
  ProjectStatus,
  ProjectType as ContractProjectType,
  ContactMethod,
  TaskStatus,
  TaskPriority,
  CostCategory,
  UnitOfMeasure,
} from '@hooomz/shared-contracts';
import type {
  CreateCustomer,
  CreateProject,
} from '@hooomz/shared-contracts';
import type {
  HomeownerIntakeData,
  ContractorIntakeData,
  IntakeResult,
  GeneratedLoop,
  GeneratedTask,
  ScopeItem,
  ProjectType,
} from '@/lib/types/intake.types';
import { ROOM_LOCATIONS, TRADE_CODES, STAGE_CODES } from '@/lib/types/intake.types';
import { getSOPForTask } from '@/lib/data/sops';
import type { Services } from './index';

// Wet rooms get tile tasks in Full Interior bundle
const WET_ROOMS = ['master-bath', 'guest-bath', 'kitchen', 'laundry'];

/**
 * Task templates per bundle type.
 * Each entry: { title, stage, trade }
 */
const FLOOR_REFRESH_TASKS = [
  { title: 'Remove existing flooring', stage: 'ST-DM', trade: 'FL' },
  { title: 'Remove existing baseboard', stage: 'ST-DM', trade: 'FC' },
  { title: 'Floor prep and leveling', stage: 'ST-PR', trade: 'FL' },
  { title: 'LVP installation', stage: 'ST-FN', trade: 'FL' },
  { title: 'Baseboard installation', stage: 'ST-FN', trade: 'FC' },
  { title: 'Transitions', stage: 'ST-FN', trade: 'FL' },
  { title: 'Touch-ups', stage: 'ST-PL', trade: 'OH' },
  { title: 'Final walkthrough', stage: 'ST-CL', trade: 'OH' },
  { title: 'Cleaning', stage: 'ST-CL', trade: 'OH' },
];

const ROOM_REFRESH_TASKS = [
  { title: 'Remove existing flooring', stage: 'ST-DM', trade: 'FL' },
  { title: 'Remove existing baseboard', stage: 'ST-DM', trade: 'FC' },
  { title: 'Floor prep and leveling', stage: 'ST-PR', trade: 'FL' },
  { title: 'Wall patching', stage: 'ST-PR', trade: 'DW' },
  { title: 'Priming', stage: 'ST-PR', trade: 'PT' },
  { title: 'LVP installation', stage: 'ST-FN', trade: 'FL' },
  { title: 'Baseboard installation', stage: 'ST-FN', trade: 'FC' },
  { title: 'Wall painting', stage: 'ST-FN', trade: 'PT' },
  { title: 'Transitions', stage: 'ST-FN', trade: 'FL' },
  { title: 'Touch-ups', stage: 'ST-PL', trade: 'OH' },
  { title: 'Final walkthrough', stage: 'ST-CL', trade: 'OH' },
  { title: 'Cleaning', stage: 'ST-CL', trade: 'OH' },
];

const FULL_INTERIOR_TASKS = [
  { title: 'Remove existing flooring', stage: 'ST-DM', trade: 'FL' },
  { title: 'Remove existing baseboard', stage: 'ST-DM', trade: 'FC' },
  { title: 'Remove existing trim', stage: 'ST-DM', trade: 'FC' },
  { title: 'Floor prep and leveling', stage: 'ST-PR', trade: 'FL' },
  { title: 'Wall patching', stage: 'ST-PR', trade: 'DW' },
  { title: 'Drywall repair', stage: 'ST-PR', trade: 'DW' },
  { title: 'Priming', stage: 'ST-PR', trade: 'PT' },
  { title: 'LVP installation', stage: 'ST-FN', trade: 'FL' },
  { title: 'Baseboard installation', stage: 'ST-FN', trade: 'FC' },
  { title: 'Casing installation', stage: 'ST-FN', trade: 'FC' },
  { title: 'Shoe molding', stage: 'ST-FN', trade: 'FC' },
  { title: 'Crown molding', stage: 'ST-FN', trade: 'FC' },
  { title: 'Wall painting', stage: 'ST-FN', trade: 'PT' },
  { title: 'Ceiling painting', stage: 'ST-FN', trade: 'PT' },
  { title: 'Trim painting', stage: 'ST-FN', trade: 'PT' },
  { title: 'Transitions', stage: 'ST-FN', trade: 'FL' },
  { title: 'Touch-ups', stage: 'ST-PL', trade: 'OH' },
  { title: 'Final walkthrough', stage: 'ST-CL', trade: 'OH' },
  { title: 'Cleaning', stage: 'ST-CL', trade: 'OH' },
];

// Tile task added for wet rooms only in Full Interior
const TILE_TASK = { title: 'Tile work', stage: 'ST-FN', trade: 'TL' };

// =============================================================================
// Cost Estimates & Mapping (NB market rates, per unit)
// =============================================================================

const SCOPE_ITEM_COSTS: Record<string, { materialCost: number; laborCost: number }> = {
  'Install LVP/LVT': { materialCost: 4, laborCost: 3 },
  'Install hardwood': { materialCost: 7, laborCost: 4 },
  'Install engineered hardwood': { materialCost: 6, laborCost: 3.50 },
  'Install laminate': { materialCost: 3, laborCost: 2.50 },
  'Install underlayment': { materialCost: 0.50, laborCost: 0.50 },
  'Sand and finish hardwood': { materialCost: 1.50, laborCost: 3.50 },
  'Floor leveling compound': { materialCost: 0.75, laborCost: 1.25 },
  'Remove existing flooring': { materialCost: 0, laborCost: 1.25 },
  'Prime walls': { materialCost: 0.15, laborCost: 0.40 },
  'Paint walls': { materialCost: 0.20, laborCost: 0.60 },
  'Paint ceiling': { materialCost: 0.20, laborCost: 0.70 },
  'Paint trim': { materialCost: 0.50, laborCost: 1.50 },
  'Paint doors': { materialCost: 15, laborCost: 45 },
  'Install baseboard': { materialCost: 2.50, laborCost: 3.50 },
  'Install shoe molding': { materialCost: 1.00, laborCost: 1.50 },
  'Install door casing': { materialCost: 25, laborCost: 45 },
  'Install window casing': { materialCost: 30, laborCost: 50 },
  'Install crown molding': { materialCost: 4, laborCost: 6 },
  'Install interior doors': { materialCost: 150, laborCost: 150 },
  'Install wainscoting': { materialCost: 8, laborCost: 12 },
  'Install board and batten': { materialCost: 6, laborCost: 10 },
  'Install picture frame molding': { materialCost: 3, laborCost: 8 },
  'Remove existing baseboard': { materialCost: 0, laborCost: 1.00 },
  'Install floor tile': { materialCost: 6, laborCost: 12 },
  'Install wall tile': { materialCost: 8, laborCost: 15 },
  'Install backsplash': { materialCost: 12, laborCost: 18 },
  'Grout tile': { materialCost: 0.50, laborCost: 2 },
  'Tape and mud': { materialCost: 0.15, laborCost: 0.85 },
  'Sand and prep': { materialCost: 0.05, laborCost: 0.35 },
  'Patch drywall': { materialCost: 5, laborCost: 25 },
  'Texture matching': { materialCost: 0.10, laborCost: 0.50 },
};

const TRADE_TO_COST_CATEGORY: Record<string, CostCategory> = {
  'FL': CostCategory.FLOORING,
  'PT': CostCategory.PAINTING,
  'FC': CostCategory.INTERIOR_TRIM,
  'DW': CostCategory.DRYWALL,
  'TL': CostCategory.FLOORING,
  'OH': CostCategory.OTHER,
};

function mapUnitOfMeasure(unit: string): UnitOfMeasure {
  switch (unit) {
    case 'sqft': return UnitOfMeasure.SQUARE_FOOT;
    case 'lf': return UnitOfMeasure.LINEAR_FOOT;
    case 'ea': return UnitOfMeasure.EACH;
    case 'hr': return UnitOfMeasure.HOUR;
    default: return UnitOfMeasure.EACH;
  }
}

/**
 * Get task templates for a bundle type + room
 */
function getTasksForBundle(bundleType: ProjectType, roomId: string): { title: string; stage: string; trade: string }[] {
  switch (bundleType) {
    case 'floor_refresh':
      return FLOOR_REFRESH_TASKS;
    case 'room_refresh':
      return ROOM_REFRESH_TASKS;
    case 'full_interior':
    case 'custom': {
      const tasks = [...FULL_INTERIOR_TASKS];
      if (WET_ROOMS.includes(roomId)) {
        // Insert tile task before the transitions task
        const transitionIdx = tasks.findIndex((t) => t.title === 'Transitions');
        if (transitionIdx >= 0) {
          tasks.splice(transitionIdx, 0, TILE_TASK);
        } else {
          tasks.push(TILE_TASK);
        }
      }
      return tasks;
    }
    default:
      return FULL_INTERIOR_TASKS;
  }
}

/**
 * Map Interiors bundle types to the contract's project types
 */
function mapProjectType(type: ProjectType): ContractProjectType {
  const mapping: Record<ProjectType, ContractProjectType> = {
    floor_refresh: ContractProjectType.FLOORING,
    room_refresh: ContractProjectType.FLOORING,
    full_interior: ContractProjectType.RENOVATION,
    custom: ContractProjectType.RENOVATION,
  };
  return mapping[type] || ContractProjectType.RENOVATION;
}

/**
 * Map our contact preference to the contract's contact method
 */
function mapContactMethod(method: 'email' | 'phone' | 'text'): ContactMethod {
  const mapping: Record<string, ContactMethod> = {
    email: ContactMethod.EMAIL,
    phone: ContactMethod.PHONE,
    text: ContactMethod.TEXT,
  };
  return mapping[method] || ContactMethod.EMAIL;
}

/**
 * IntakeService - Transforms intake wizard data into system entities
 */
export class IntakeService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Process homeowner intake and create project structure
   */
  async processHomeownerIntake(data: HomeownerIntakeData): Promise<IntakeResult> {
    const intakeId = generateId('intake');
    const projectId = generateId('project');
    const activityEventIds: string[] = [];

    // 1. Log intake started
    const startEvent = await this.services.activity.logIntakeEvent('intake.started', intakeId, {
      intake_type: 'homeowner',
      project_name: data.project.name || 'New Project',
    });
    activityEventIds.push(startEvent.id);

    // 2. Create customer if contact info provided
    let customerId: string | undefined;
    if (data.contact.email) {
      customerId = generateCustomerId();
      const customer: CreateCustomer = {
        firstName: data.contact.first_name,
        lastName: data.contact.last_name,
        email: data.contact.email,
        phone: data.contact.phone || '000-000-0000',
        type: 'residential',
        address: {
          street: data.project.address.street,
          city: data.project.address.city,
          province: data.project.address.province,
          postalCode: data.project.address.postal_code.toUpperCase().replace(/\s/g, ''),
          country: 'CA',
        },
        tags: [],
        preferredContactMethod: mapContactMethod(data.contact.preferred_contact),
      };
      await this.services.customers.create(customer);

      const customerEvent = await this.services.activity.logCustomerEvent(
        'customer.created',
        customerId,
        { customer_name: `${data.contact.first_name} ${data.contact.last_name}`, project_id: projectId }
      );
      activityEventIds.push(customerEvent.id);
    }

    // 3. Create project
    const projectName = data.project.name || `${data.contact.first_name}'s Project`;
    const now = new Date().toISOString().split('T')[0];
    const project: CreateProject = {
      name: projectName,
      address: {
        street: data.project.address.street,
        city: data.project.address.city,
        province: data.project.address.province,
        postalCode: data.project.address.postal_code.toUpperCase().replace(/\s/g, ''),
        country: 'CA',
      },
      projectType: mapProjectType(data.project.project_type),
      status: ProjectStatus.LEAD,
      clientId: customerId || 'homeowner_direct',
      dates: {
        startDate: now,
        estimatedEndDate: now,
      },
      budget: {
        estimatedCost: 0,
        actualCost: 0,
      },
    };
    const createdProject = await this.services.projects.create(project);
    // Use the repository-generated ID (proj-xxx), not our intake ID
    const actualProjectId = createdProject.id;

    const projectEvent = await this.services.activity.logProjectEvent(
      'project.created',
      actualProjectId,
      {
        project_name: projectName,
        details: `Created from homeowner intake — ${data.project.project_type} bundle, ${data.project.selected_rooms.length} rooms`,
      }
    );
    activityEventIds.push(projectEvent.id);

    // 4. Generate loops (one per room)
    const loops = await this.generateLoopsFromRooms(actualProjectId, data.project.selected_rooms, activityEventIds);

    // 5. Generate tasks from bundle type per room
    const tasks = await this.generateTasksFromBundle(
      actualProjectId,
      data.project.project_type,
      data.project.selected_rooms,
      loops,
      activityEventIds
    );

    // 6. Log intake completed
    const completeEvent = await this.services.activity.logIntakeEvent('intake.submitted', intakeId, {
      intake_type: 'homeowner',
      project_name: projectName,
      rooms_selected: data.project.selected_rooms,
    });
    activityEventIds.push(completeEvent.id);

    return {
      project_id: actualProjectId,
      loops,
      tasks,
      activity_events: activityEventIds,
    };
  }

  /**
   * Process contractor intake and create project structure
   */
  async processContractorIntake(data: ContractorIntakeData): Promise<IntakeResult> {
    const intakeId = generateId('intake');
    const projectId = generateId('project');
    const activityEventIds: string[] = [];

    // 1. Log intake started
    const startEvent = await this.services.activity.logIntakeEvent('intake.started', intakeId, {
      intake_type: 'contractor',
      project_name: data.project.name,
      trades_selected: data.scope.enabled_trades,
    });
    activityEventIds.push(startEvent.id);

    // 2. Create customer if client info provided
    let customerId: string | undefined;
    const clientName = data.client?.name;
    if (clientName) {
      const nameParts = clientName.trim().split(' ');
      const firstName = nameParts[0] || 'Client';
      const lastName = nameParts.slice(1).join(' ') || 'Unknown';

      customerId = generateCustomerId();
      const customer: CreateCustomer = {
        firstName,
        lastName,
        email: data.client?.email || 'client@example.com',
        phone: data.client?.phone || '000-000-0000',
        type: 'residential',
        address: {
          street: data.project.address.street,
          city: data.project.address.city,
          province: data.project.address.province,
          postalCode: data.project.address.postal_code.toUpperCase().replace(/\s/g, ''),
          country: 'CA',
        },
        tags: [],
        preferredContactMethod: ContactMethod.EMAIL,
      };
      await this.services.customers.create(customer);

      const customerEvent = await this.services.activity.logCustomerEvent(
        'customer.created',
        customerId,
        { customer_name: clientName, project_id: projectId }
      );
      activityEventIds.push(customerEvent.id);
    }

    // 3. Create project
    const projectName = data.project.name;
    const now = new Date().toISOString().split('T')[0];
    const project: CreateProject = {
      name: projectName,
      address: {
        street: data.project.address.street,
        city: data.project.address.city,
        province: data.project.address.province,
        postalCode: data.project.address.postal_code.toUpperCase().replace(/\s/g, ''),
        country: 'CA',
      },
      projectType: mapProjectType(data.project.project_type),
      status: ProjectStatus.LEAD,
      clientId: customerId || 'contractor_internal',
      dates: {
        startDate: data.schedule.estimated_start || now,
        estimatedEndDate: now,
      },
      budget: {
        estimatedCost: data.estimates?.low || 0,
        actualCost: 0,
      },
    };
    const createdProject = await this.services.projects.create(project);
    const actualProjectId = createdProject.id;

    const projectEvent = await this.services.activity.logProjectEvent(
      'project.created',
      actualProjectId,
      {
        project_name: projectName,
        details: `Created from contractor intake with ${data.scope.enabled_trades.length} trades and ${data.scope.items.length} scope items`,
      }
    );
    activityEventIds.push(projectEvent.id);

    // 4. Generate loops from scope (trade-based for contractors)
    const loops = await this.generateLoopsFromContractorScope(actualProjectId, data, activityEventIds);

    // 5. Generate tasks from scope items (already have three-axis tags)
    const tasks = await this.generateTasksFromContractorScope(actualProjectId, data.scope.items, loops, activityEventIds);

    // 5b. Generate pre-populated line items from scope (estimate page ready)
    await this.generateLineItemsFromScope(actualProjectId, data.scope.items, activityEventIds);

    // 6. Log intake completed
    const completeEvent = await this.services.activity.logIntakeEvent('intake.submitted', intakeId, {
      intake_type: 'contractor',
      project_name: projectName,
      trades_selected: data.scope.enabled_trades,
    });
    activityEventIds.push(completeEvent.id);

    return {
      project_id: actualProjectId,
      loops,
      tasks,
      activity_events: activityEventIds,
    };
  }

  /**
   * Generate one loop per selected room
   */
  private async generateLoopsFromRooms(
    projectId: string,
    selectedRooms: string[],
    activityEventIds: string[]
  ): Promise<GeneratedLoop[]> {
    const loops: GeneratedLoop[] = [];

    for (const roomId of selectedRooms) {
      const roomInfo = ROOM_LOCATIONS[`loc-${roomId}` as keyof typeof ROOM_LOCATIONS];
      const loopId = generateId('loop');
      const loop: GeneratedLoop = {
        id: loopId,
        name: roomInfo?.name || roomId,
        parent_id: null,
        loop_type: 'location',
        status: 'not-started',
        health_score: 100,
        work_category_code: '',
        stage_code: '',
        location_id: `loc-${roomId}`,
      };

      loops.push(loop);

      const loopEvent = await this.services.activity.logLoopEvent('loop.created', projectId, loopId, {
        loop_name: loop.name,
        loop_type: 'location',
        parent_loop_id: null,
        location_id: loop.location_id,
      });
      activityEventIds.push(loopEvent.id);
    }

    return loops;
  }

  /**
   * Generate tasks from bundle type per room
   */
  private async generateTasksFromBundle(
    projectId: string,
    bundleType: ProjectType,
    selectedRooms: string[],
    loops: GeneratedLoop[],
    activityEventIds: string[]
  ): Promise<GeneratedTask[]> {
    const tasks: GeneratedTask[] = [];

    for (const roomId of selectedRooms) {
      const locationId = `loc-${roomId}`;
      const roomLoop = loops.find((l) => l.location_id === locationId);
      if (!roomLoop) continue;

      const roomName = roomLoop.name;
      const taskTemplates = getTasksForBundle(bundleType, roomId);

      for (const template of taskTemplates) {
        const taskTitle = `${template.title} — ${roomName}`;
        const tradeName = TRADE_CODES[template.trade as keyof typeof TRADE_CODES]?.name || template.trade;
        const stageName = STAGE_CODES[template.stage as keyof typeof STAGE_CODES]?.name || template.stage;

        // Look up linked SOP for this task
        const sopId = getSOPForTask(template.title, template.trade);

        // Persist task to IndexedDB
        const persistedTask = await this.services.scheduling.tasks.create({
          projectId,
          title: taskTitle,
          description: `${stageName} · ${tradeName}${sopId ? `\nsopId:${sopId}` : ''}`,
          status: TaskStatus.NOT_STARTED,
          priority: TaskPriority.MEDIUM,
          dependencies: [],
        });

        const task: GeneratedTask = {
          id: persistedTask.id,
          loop_id: roomLoop.id,
          title: taskTitle,
          status: 'not-started',
          priority: 'medium',
          work_category_code: template.trade,
          stage_code: template.stage,
          location_id: locationId,
        };

        tasks.push(task);

        const taskEvent = await this.services.activity.logTaskEvent('task.instance_created', projectId, persistedTask.id, {
          task_title: task.title,
          work_category_code: task.work_category_code,
          stage_code: task.stage_code,
          location_id: task.location_id,
        });
        activityEventIds.push(taskEvent.id);
      }
    }

    return tasks;
  }

  /**
   * Generate loops from contractor scope (trade-based hierarchy)
   */
  private async generateLoopsFromContractorScope(
    projectId: string,
    data: ContractorIntakeData,
    activityEventIds: string[]
  ): Promise<GeneratedLoop[]> {
    const loops: GeneratedLoop[] = [];
    const { TRADE_CODES } = await import('@/lib/types/intake.types');

    for (const tradeCode of data.scope.enabled_trades) {
      const tradeInfo = TRADE_CODES[tradeCode as keyof typeof TRADE_CODES];

      const loopId = generateId('loop');
      const loop: GeneratedLoop = {
        id: loopId,
        name: tradeInfo?.name || tradeCode,
        parent_id: null,
        loop_type: 'trade',
        status: 'not-started',
        health_score: 100,
        work_category_code: tradeCode,
        stage_code: '',
        location_id: '',
      };

      loops.push(loop);

      const loopEvent = await this.services.activity.logLoopEvent('loop.created', projectId, loopId, {
        loop_name: loop.name,
        loop_type: 'trade',
        parent_loop_id: null,
        work_category_code: tradeCode,
      });
      activityEventIds.push(loopEvent.id);

      // Get unique locations for this trade's scope items
      const tradeItems = data.scope.items.filter((item) => item.trade_code === tradeCode);
      const uniqueLocations = [...new Set(tradeItems.map((item) => item.location_id))];

      for (const locationId of uniqueLocations) {
        const locationInfo = ROOM_LOCATIONS[locationId as keyof typeof ROOM_LOCATIONS];

        const locationLoopId = generateId('loop');
        const locationLoop: GeneratedLoop = {
          id: locationLoopId,
          name: `${tradeInfo?.name || tradeCode} — ${locationInfo?.name || locationId}`,
          parent_id: loopId,
          loop_type: 'location',
          status: 'not-started',
          health_score: 100,
          work_category_code: tradeCode,
          stage_code: '',
          location_id: locationId,
        };

        loops.push(locationLoop);

        const locationEvent = await this.services.activity.logLoopEvent('loop.created', projectId, locationLoopId, {
          loop_name: locationLoop.name,
          loop_type: 'location',
          parent_loop_id: loopId,
          work_category_code: tradeCode,
          location_id: locationId,
        });
        activityEventIds.push(locationEvent.id);
      }
    }

    return loops;
  }

  /**
   * Generate line items from scope items (pre-populated estimate)
   * Creates separate material and labor line items per scope item.
   */
  private async generateLineItemsFromScope(
    projectId: string,
    scopeItems: ScopeItem[],
    activityEventIds: string[]
  ): Promise<void> {
    for (const item of scopeItems) {
      const costs = SCOPE_ITEM_COSTS[item.item_name];
      if (!costs) continue;

      const category = TRADE_TO_COST_CATEGORY[item.trade_code] || CostCategory.OTHER;
      const unit = mapUnitOfMeasure(item.unit);

      // Material line item
      if (costs.materialCost > 0) {
        const totalCost = costs.materialCost * item.quantity;
        const lineItem = await this.services.estimating.lineItems.create({
          projectId,
          category,
          description: `Material: ${item.item_name}`,
          quantity: item.quantity,
          unit,
          unitCost: costs.materialCost,
          totalCost,
          isLabor: false,
          sopCodes: item.sopCodes,
          isLooped: item.isLooped,
          loopContextLabel: item.loopContextLabel,
          estimatedHoursPerUnit: item.estimatedHoursPerUnit,
        });

        this.services.activity.logEstimateLineItemEvent(
          'estimate.line_item_added', projectId, lineItem.id,
          {
            description: `Material: ${item.item_name}`,
            quantity: item.quantity,
            unit: item.unit,
            total: totalCost,
            category,
            work_category_code: item.work_category_code,
            trade: item.trade_code,
            location_id: item.location_id,
          }
        ).catch((err) => console.error('Failed to log line item event:', err));
        activityEventIds.push(lineItem.id);
      }

      // Labor line item
      if (costs.laborCost > 0) {
        const totalCost = costs.laborCost * item.quantity;
        const lineItem = await this.services.estimating.lineItems.create({
          projectId,
          category,
          description: `Labor: ${item.item_name}`,
          quantity: item.quantity,
          unit,
          unitCost: costs.laborCost,
          totalCost,
          isLabor: true,
          sopCodes: item.sopCodes,
          isLooped: item.isLooped,
          loopContextLabel: item.loopContextLabel,
          estimatedHoursPerUnit: item.estimatedHoursPerUnit,
        });

        this.services.activity.logEstimateLineItemEvent(
          'estimate.line_item_added', projectId, lineItem.id,
          {
            description: `Labor: ${item.item_name}`,
            quantity: item.quantity,
            unit: item.unit,
            total: totalCost,
            category,
            work_category_code: item.work_category_code,
            trade: item.trade_code,
            location_id: item.location_id,
          }
        ).catch((err) => console.error('Failed to log line item event:', err));
        activityEventIds.push(lineItem.id);
      }
    }
  }

  /**
   * Generate tasks from contractor scope items
   */
  private async generateTasksFromContractorScope(
    projectId: string,
    scopeItems: ScopeItem[],
    loops: GeneratedLoop[],
    activityEventIds: string[]
  ): Promise<GeneratedTask[]> {
    const tasks: GeneratedTask[] = [];

    for (const item of scopeItems) {
      const loop = loops.find(
        (l) =>
          l.work_category_code === item.trade_code &&
          l.location_id === item.location_id &&
          l.loop_type === 'location'
      ) || loops.find(
        (l) => l.work_category_code === item.trade_code && !l.parent_id
      );

      if (!loop) continue;

      const persistedTask = await this.services.scheduling.tasks.create({
        projectId,
        title: item.item_name,
        description: item.notes,
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
      });

      const task: GeneratedTask = {
        id: persistedTask.id,
        loop_id: loop.id,
        title: item.item_name,
        description: item.notes,
        status: 'not-started',
        priority: 'medium',
        source_scope_item_id: item.id,
        work_category_code: item.work_category_code,
        stage_code: item.stage_code,
        location_id: item.location_id,
      };

      tasks.push(task);

      const taskEvent = await this.services.activity.logTaskEvent('task.instance_created', projectId, persistedTask.id, {
        task_title: task.title,
        work_category_code: task.work_category_code,
        stage_code: task.stage_code,
        location_id: task.location_id,
      });
      activityEventIds.push(taskEvent.id);
    }

    return tasks;
  }
}

/**
 * Create an IntakeService instance
 */
export function createIntakeService(services: Services): IntakeService {
  return new IntakeService(services);
}
