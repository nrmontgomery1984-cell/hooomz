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
  RoomScope,
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

// =============================================================================
// Room Scope → Scope Items Derivation
// =============================================================================

/**
 * Derive ScopeItem[] from RoomScope[].
 * Each enabled trade within a room generates one or more scope items
 * with per-room quantities based on measurements.
 */
function deriveScopeItemsFromRooms(rooms: RoomScope[]): ScopeItem[] {
  const items: ScopeItem[] = [];
  let idx = 0;

  for (const room of rooms) {
    const sqft = room.measurements.sqft ?? 0;
    const perimeterLf = room.measurements.perimeter_lf ?? 0;
    const locationId = room.id;

    // Material data for enrichment
    const mats = room.materials;

    // Flooring
    if (room.trades.flooring?.enabled) {
      const fl = room.trades.flooring;
      const flooringType = fl.type === 'hardwood' ? 'Install hardwood'
        : fl.type === 'engineered' ? 'Install engineered hardwood'
        : fl.type === 'laminate' ? 'Install laminate'
        : fl.type === 'tile' ? 'Install floor tile'
        : 'Install LVP/LVT';
      const floorSqft = fl.sqft_override ?? sqft;

      // Build material description from intake selections
      const flMat = mats?.flooring;
      const flMatDesc = flMat
        ? [flMat.product, flMat.color].filter(Boolean).join(' (') + (flMat.color ? ')' : '')
        : undefined;

      if (fl.condition === 'remove_replace') {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'FL', category: 'demo', item_name: 'Remove existing flooring',
          quantity: floorSqft, unit: 'sqft',
          work_category_code: 'FL', stage_code: 'ST-DM', location_id: locationId,
          sopCodes: ['HI-SOP-FL-001'], isLooped: true, loopContextLabel: room.name,
        });
      }
      items.push({
        id: `scope-room-${idx++}`,
        trade_code: 'FL', category: fl.type === 'tile' ? 'tile' : 'vinyl',
        item_name: flMatDesc ? `${flooringType} — ${flMatDesc}` : flooringType,
        quantity: floorSqft, unit: 'sqft',
        work_category_code: 'FL', stage_code: 'ST-FN', location_id: locationId,
        sopCodes: ['HI-SOP-FL-004'], isLooped: true, loopContextLabel: room.name,
        estimatedHoursPerUnit: 4,
        materialDescription: flMatDesc,
        materialCostPerUnit: flMat?.pricePerSqft,
        catalogSku: flMat?.sku,
      });
      if (fl.type !== 'tile' && fl.condition !== 'new_subfloor') {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'FL', category: 'prep', item_name: 'Install underlayment',
          quantity: floorSqft, unit: 'sqft',
          work_category_code: 'FL', stage_code: 'ST-PR', location_id: locationId,
          sopCodes: ['HI-SOP-FL-001'], isLooped: true, loopContextLabel: room.name,
          estimatedHoursPerUnit: 2,
        });
      }
    }

    // Paint
    if (room.trades.paint?.enabled) {
      const pt = room.trades.paint;
      const ptMat = mats?.paint;
      const wallSqft = sqft * 2; // rough wall area ≈ 2× floor area
      // Build paint description: "Brand Product, Finish"
      const ptMatDesc = ptMat
        ? [ptMat.brand, ptMat.product, ptMat.finish?.replace('_', ' ')].filter(Boolean).join(' ')
        : undefined;

      if (pt.surfaces.includes('walls')) {
        const wallColor = ptMat?.colors?.walls;
        const wallDesc = [ptMatDesc, wallColor].filter(Boolean).join(' — ');
        if (pt.prep !== 'minimal') {
          items.push({
            id: `scope-room-${idx++}`,
            trade_code: 'PT', category: 'prep', item_name: 'Prime walls',
            quantity: wallSqft, unit: 'sqft',
            work_category_code: 'PT', stage_code: 'ST-PR', location_id: locationId,
            sopCodes: ['HI-SOP-PT-001'], isLooped: true, loopContextLabel: room.name,
            estimatedHoursPerUnit: 2,
          });
        }
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'PT', category: 'paint',
          item_name: wallDesc ? `Paint walls — ${wallDesc}` : 'Paint walls',
          quantity: wallSqft, unit: 'sqft',
          work_category_code: 'PT', stage_code: 'ST-FN', location_id: locationId,
          sopCodes: ['HI-SOP-PT-002'], isLooped: true, loopContextLabel: room.name,
          estimatedHoursPerUnit: 3,
          materialDescription: wallDesc || undefined,
        });
      }
      if (pt.surfaces.includes('ceiling')) {
        const ceilingColor = ptMat?.colors?.ceiling;
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'PT', category: 'paint',
          item_name: ceilingColor ? `Paint ceiling — ${ceilingColor}` : 'Paint ceiling',
          quantity: sqft, unit: 'sqft',
          work_category_code: 'PT', stage_code: 'ST-FN', location_id: locationId,
          sopCodes: ['HI-SOP-PT-002'], isLooped: true, loopContextLabel: room.name,
          estimatedHoursPerUnit: 1.5,
          materialDescription: ceilingColor || undefined,
        });
      }
      if (pt.surfaces.includes('trim')) {
        const trimColor = ptMat?.colors?.trim;
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'PT', category: 'paint',
          item_name: trimColor ? `Paint trim — ${trimColor}` : 'Paint trim',
          quantity: perimeterLf || Math.ceil(Math.sqrt(sqft) * 4), unit: 'lf',
          work_category_code: 'PT', stage_code: 'ST-FN', location_id: locationId,
          sopCodes: ['HI-SOP-PT-002'], isLooped: true, loopContextLabel: room.name,
          estimatedHoursPerUnit: 1,
          materialDescription: trimColor || undefined,
        });
      }
    }

    // Trim / Finish Carpentry
    if (room.trades.trim?.enabled) {
      const tr = room.trades.trim;
      const trMat = mats?.trim;
      const trimLf = tr.lf_override ?? perimeterLf ?? Math.ceil(Math.sqrt(sqft) * 4);
      // Build trim description: "Colonial MDF, Paint Grade"
      const trMatDesc = trMat
        ? [trMat.profile?.replace('_', ' '), trMat.material?.toUpperCase(), trMat.finish?.replace('_', ' ')].filter(Boolean).join(', ')
        : undefined;

      if (tr.action === 'replace') {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'FC', category: 'demo', item_name: 'Remove existing baseboard',
          quantity: trimLf, unit: 'lf',
          work_category_code: 'FC', stage_code: 'ST-DM', location_id: locationId,
        });
      }
      if (tr.items.includes('baseboard')) {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'FC', category: 'trim',
          item_name: trMatDesc ? `Install baseboard — ${trMatDesc}` : 'Install baseboard',
          quantity: trimLf, unit: 'lf',
          work_category_code: 'FC', stage_code: 'ST-FN', location_id: locationId,
          sopCodes: ['HI-SOP-FC-003'], isLooped: true, loopContextLabel: room.name,
          estimatedHoursPerUnit: 1.5,
          materialDescription: trMatDesc,
        });
      }
      if (tr.items.includes('shoe')) {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'FC', category: 'trim',
          item_name: trMatDesc ? `Install shoe molding — ${trMatDesc}` : 'Install shoe molding',
          quantity: trimLf, unit: 'lf',
          work_category_code: 'FC', stage_code: 'ST-FN', location_id: locationId,
          sopCodes: ['HI-SOP-FC-003'], isLooped: true, loopContextLabel: room.name,
          materialDescription: trMatDesc,
        });
      }
      if (tr.items.includes('crown')) {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'FC', category: 'trim',
          item_name: trMatDesc ? `Install crown molding — ${trMatDesc}` : 'Install crown molding',
          quantity: trimLf, unit: 'lf',
          work_category_code: 'FC', stage_code: 'ST-FN', location_id: locationId,
          sopCodes: ['HI-SOP-FC-001'], isLooped: true, loopContextLabel: room.name,
          materialDescription: trMatDesc,
        });
      }
      if (tr.items.includes('casing')) {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'FC', category: 'trim',
          item_name: trMatDesc ? `Install door casing — ${trMatDesc}` : 'Install door casing',
          quantity: 2, unit: 'ea',
          work_category_code: 'FC', stage_code: 'ST-FN', location_id: locationId,
          sopCodes: ['HI-SOP-FC-001'], isLooped: false,
          estimatedHoursPerUnit: 0.5,
          materialDescription: trMatDesc,
        });
      }
      if (tr.items.includes('wainscoting')) {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'FC', category: 'trim',
          item_name: trMatDesc ? `Install wainscoting — ${trMatDesc}` : 'Install wainscoting',
          quantity: Math.ceil(sqft * 0.3), unit: 'sqft',
          work_category_code: 'FC', stage_code: 'ST-FN', location_id: locationId,
          sopCodes: ['HI-SOP-FC-005'], isLooped: true, loopContextLabel: room.name,
          materialDescription: trMatDesc,
        });
      }
    }

    // Tile
    if (room.trades.tile?.enabled) {
      const tl = room.trades.tile;
      const tlMat = mats?.tile;
      const tileSqft = tl.sqft_override ?? sqft;
      // Build tile description: "Porcelain 12x24, Herringbone"
      const tlMatDesc = tlMat
        ? [tlMat.type?.replace('_', ' '), tlMat.size, tlMat.color, tlMat.pattern?.replace('_', ' ')].filter(Boolean).join(', ')
        : undefined;

      if (tl.surfaces.includes('floor')) {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'TL', category: 'tile',
          item_name: tlMatDesc ? `Install floor tile — ${tlMatDesc}` : 'Install floor tile',
          quantity: tileSqft, unit: 'sqft',
          work_category_code: 'TL', stage_code: 'ST-FN', location_id: locationId,
          isLooped: true, loopContextLabel: room.name,
          materialDescription: tlMatDesc,
        });
      }
      if (tl.surfaces.includes('walls')) {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'TL', category: 'tile',
          item_name: tlMatDesc ? `Install wall tile — ${tlMatDesc}` : 'Install wall tile',
          quantity: Math.ceil(tileSqft * 0.5), unit: 'sqft',
          work_category_code: 'TL', stage_code: 'ST-FN', location_id: locationId,
          isLooped: true, loopContextLabel: room.name,
          materialDescription: tlMatDesc,
        });
      }
      if (tl.surfaces.includes('backsplash')) {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'TL', category: 'tile',
          item_name: tlMatDesc ? `Install backsplash — ${tlMatDesc}` : 'Install backsplash',
          quantity: Math.ceil(tileSqft * 0.15), unit: 'sqft',
          work_category_code: 'TL', stage_code: 'ST-FN', location_id: locationId,
          isLooped: true, loopContextLabel: room.name,
          materialDescription: tlMatDesc,
        });
      }
    }

    // Drywall
    if (room.trades.drywall?.enabled) {
      const dw = room.trades.drywall;
      const dwSqft = dw.sqft_override ?? sqft;
      if (dw.extent === 'patch') {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'DW', category: 'repair', item_name: 'Patch drywall',
          quantity: 3, unit: 'ea', // typical ~3 patches per room
          work_category_code: 'DW', stage_code: 'ST-PR', location_id: locationId,
          sopCodes: ['HI-SOP-DW-002'], isLooped: true, loopContextLabel: room.name,
        });
      } else {
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'DW', category: 'repair', item_name: 'Tape and mud',
          quantity: dwSqft, unit: 'sqft',
          work_category_code: 'DW', stage_code: 'ST-PR', location_id: locationId,
          sopCodes: ['HI-SOP-DW-002'], isLooped: true, loopContextLabel: room.name,
          estimatedHoursPerUnit: 3,
        });
        items.push({
          id: `scope-room-${idx++}`,
          trade_code: 'DW', category: 'repair', item_name: 'Sand and prep',
          quantity: dwSqft, unit: 'sqft',
          work_category_code: 'DW', stage_code: 'ST-PR', location_id: locationId,
          sopCodes: ['HI-SOP-DW-003'], isLooped: true, loopContextLabel: room.name,
          estimatedHoursPerUnit: 2,
        });
      }
    }
  }

  return items;
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

    // 4. Generate loops and tasks — room-scope-aware when available
    const roomScopes = data.project.room_scopes;
    let loops: GeneratedLoop[];
    let tasks: GeneratedTask[];

    if (roomScopes && roomScopes.length > 0) {
      // Derive enabled trades from room scopes for loop hierarchy
      const enabledTrades = new Set<string>();
      roomScopes.forEach((r) => {
        if (r.trades.flooring?.enabled) enabledTrades.add('FL');
        if (r.trades.paint?.enabled) enabledTrades.add('PT');
        if (r.trades.trim?.enabled) enabledTrades.add('FC');
        if (r.trades.tile?.enabled) enabledTrades.add('TL');
        if (r.trades.drywall?.enabled) enabledTrades.add('DW');
      });
      loops = await this.generateLoopsFromRoomScopes(
        actualProjectId, roomScopes, Array.from(enabledTrades), activityEventIds
      );
      const scopeItems = deriveScopeItemsFromRooms(roomScopes);
      tasks = await this.generateTasksFromContractorScope(actualProjectId, scopeItems, loops, activityEventIds);
      await this.generateLineItemsFromScope(actualProjectId, scopeItems, activityEventIds);
    } else {
      // Legacy path: simple selected_rooms list
      loops = await this.generateLoopsFromRooms(actualProjectId, data.project.selected_rooms, activityEventIds);
      tasks = await this.generateTasksFromBundle(
        actualProjectId, data.project.project_type, data.project.selected_rooms, loops, activityEventIds
      );
    }

    // 5b. Transfer photos from room scopes to photos store
    if (roomScopes && roomScopes.length > 0) {
      await this.transferPhotosFromRoomScopes(actualProjectId, roomScopes, activityEventIds);
    }

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
        details: `Created from contractor intake with ${data.scope.enabled_trades.length} trades, ${data.scope.room_scopes?.length ?? 0} rooms, and ${data.scope.items.length} scope items`,
      }
    );
    activityEventIds.push(projectEvent.id);

    // 4. Derive scope items from room scopes if available, otherwise use provided items
    const roomScopes = data.scope.room_scopes;
    const scopeItems = (roomScopes && roomScopes.length > 0)
      ? deriveScopeItemsFromRooms(roomScopes)
      : data.scope.items;

    // 4b. Generate loops — room-based when room scopes exist, trade-based otherwise
    const loops = (roomScopes && roomScopes.length > 0)
      ? await this.generateLoopsFromRoomScopes(actualProjectId, roomScopes, data.scope.enabled_trades, activityEventIds)
      : await this.generateLoopsFromContractorScope(actualProjectId, data, activityEventIds);

    // 5. Generate tasks from scope items (already have three-axis tags)
    const tasks = await this.generateTasksFromContractorScope(actualProjectId, scopeItems, loops, activityEventIds);

    // 5b. Generate pre-populated line items from scope (estimate page ready)
    await this.generateLineItemsFromScope(actualProjectId, scopeItems, activityEventIds);

    // 5c. Transfer photos from room scopes to photos store
    if (roomScopes && roomScopes.length > 0) {
      await this.transferPhotosFromRoomScopes(actualProjectId, roomScopes, activityEventIds);
    }

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
   * Generate loops from RoomScope[] — one location loop per room,
   * grouped under a parent trade loop per enabled trade.
   */
  private async generateLoopsFromRoomScopes(
    projectId: string,
    roomScopes: RoomScope[],
    enabledTrades: string[],
    activityEventIds: string[]
  ): Promise<GeneratedLoop[]> {
    const loops: GeneratedLoop[] = [];

    // Create a parent loop per trade
    const tradeLoopMap = new Map<string, string>(); // tradeCode → loopId
    for (const tradeCode of enabledTrades) {
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
      tradeLoopMap.set(tradeCode, loopId);

      const loopEvent = await this.services.activity.logLoopEvent('loop.created', projectId, loopId, {
        loop_name: loop.name,
        loop_type: 'trade',
        parent_loop_id: null,
        work_category_code: tradeCode,
      });
      activityEventIds.push(loopEvent.id);
    }

    // Create a location loop per room, nested under each relevant trade
    for (const room of roomScopes) {
      // Determine which trades are active in this room
      const roomTrades: string[] = [];
      if (room.trades.flooring?.enabled) roomTrades.push('FL');
      if (room.trades.paint?.enabled) roomTrades.push('PT');
      if (room.trades.trim?.enabled) roomTrades.push('FC');
      if (room.trades.tile?.enabled) roomTrades.push('TL');
      if (room.trades.drywall?.enabled) roomTrades.push('DW');

      for (const tradeCode of roomTrades) {
        const parentId = tradeLoopMap.get(tradeCode);
        if (!parentId) continue;

        const tradeInfo = TRADE_CODES[tradeCode as keyof typeof TRADE_CODES];
        const loopId = generateId('loop');
        const loop: GeneratedLoop = {
          id: loopId,
          name: `${tradeInfo?.name || tradeCode} — ${room.name}`,
          parent_id: parentId,
          loop_type: 'location',
          status: 'not-started',
          health_score: 100,
          work_category_code: tradeCode,
          stage_code: '',
          location_id: room.id,
        };
        loops.push(loop);

        const loopEvent = await this.services.activity.logLoopEvent('loop.created', projectId, loopId, {
          loop_name: loop.name,
          loop_type: 'location',
          parent_loop_id: parentId,
          work_category_code: tradeCode,
          location_id: room.id,
        });
        activityEventIds.push(loopEvent.id);
      }
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
      // Strip material description from item_name for cost lookup
      // (item_name may be "Install LVP/LVT — Lifeproof Sterling Oak")
      const baseName = item.item_name.includes(' — ')
        ? item.item_name.split(' — ')[0]
        : item.item_name;
      const costs = SCOPE_ITEM_COSTS[baseName];
      if (!costs) continue;

      const category = TRADE_TO_COST_CATEGORY[item.trade_code] || CostCategory.OTHER;
      const unit = mapUnitOfMeasure(item.unit);

      // Use intake material cost when available, otherwise fall back to defaults
      const materialUnitCost = item.materialCostPerUnit ?? costs.materialCost;

      // Material line item
      if (materialUnitCost > 0) {
        const totalCost = materialUnitCost * item.quantity;
        const desc = item.materialDescription
          ? `Material: ${item.item_name}`
          : `Material: ${baseName}`;
        const lineItem = await this.services.estimating.lineItems.create({
          projectId,
          category,
          description: desc,
          quantity: item.quantity,
          unit,
          unitCost: materialUnitCost,
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
            description: desc,
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

      // Labor line item (not affected by material pricing)
      if (costs.laborCost > 0) {
        const totalCost = costs.laborCost * item.quantity;
        const desc = `Labor: ${baseName}`;
        const lineItem = await this.services.estimating.lineItems.create({
          projectId,
          category,
          description: desc,
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
            description: desc,
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

  /**
   * Transfer photos from room scopes into the photos IndexedDB store.
   * Each RoomPhoto from intake draft becomes a persisted Photo entity
   * tagged with the project ID, room location, and trade.
   */
  private async transferPhotosFromRoomScopes(
    projectId: string,
    roomScopes: RoomScope[],
    activityEventIds: string[]
  ): Promise<void> {
    for (const room of roomScopes) {
      if (!room.photos || room.photos.length === 0) continue;

      const roomInfo = ROOM_LOCATIONS[room.id as keyof typeof ROOM_LOCATIONS];
      const locationName = roomInfo?.name || room.name;

      for (const photo of room.photos) {
        const tags = ['intake', room.id];
        if (photo.trade) tags.push(photo.trade);

        // Map trade tag to work category code
        const tradeMap: Record<string, string> = {
          flooring: 'FL', paint: 'PT', trim: 'FC', tile: 'TL', drywall: 'DW',
        };
        const workCategoryCode = photo.trade ? tradeMap[photo.trade] : undefined;

        const created = await this.services.fieldDocs.photos.create({
          projectId,
          filePath: photo.dataUrl, // dataUrl stored as filePath for offline-first
          fileSize: Math.round(photo.dataUrl.length * 0.75), // approximate decoded size
          mimeType: 'image/jpeg',
          width: 1200,  // resized max dimension from intake
          height: 900,  // approximate
          metadata: {
            caption: photo.caption,
            tags,
            timestamp: photo.timestamp || new Date().toISOString(),
            takenBy: 'intake',
          },
        });

        // Log photo upload (non-blocking)
        this.services.activity.logPhotoEvent('photo.uploaded', projectId, created.id, {
          caption: photo.caption,
          tags,
          location_name: locationName,
          work_category_code: workCategoryCode,
          location_id: room.id,
        }).catch((err) => console.error('Failed to log intake photo:', err));
        activityEventIds.push(created.id);
      }
    }
  }
}

/**
 * Create an IntakeService instance
 */
export function createIntakeService(services: Services): IntakeService {
  return new IntakeService(services);
}
