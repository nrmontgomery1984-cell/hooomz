import type { LoopService } from './loop.service';

// Division types - ideally imported from @hooomz/shared-contracts but avoiding circular deps
type Division = 'interiors' | 'exteriors' | 'diy' | 'maintenance';

/**
 * Interiors work categories (from SOP training system)
 */
const INTERIORS_WORK_CATEGORIES = [
  'Flooring',         // FL - LVP, hardwood, engineered, laminate
  'Paint',            // PT - walls, ceilings, trim
  'Finish Carpentry', // FC - baseboard, shoe molding, casing, crown
  'Tile',             // TL - backsplash, bathroom (Year 2)
  'Drywall',          // DW - patching and repairs
];

/**
 * Interiors project stages (from three-axis model)
 */
const INTERIORS_STAGES = [
  'Demolition',     // ST-DM - Remove existing flooring, baseboard, trim
  'Prime & Prep',   // ST-PR - Floor prep, wall prep, patching, priming
  'Finish',         // ST-FN - Flooring install, trim install, paint
  'Punch List',     // ST-PL - Touch-ups, corrections, rework
  'Closeout',       // ST-CL - Final walkthrough, cleaning, sign-off
];

export interface FloorPlanInput {
  projectId: string;
  floors: {
    name: string;
    rooms: {
      name: string;
      zones?: string[];
    }[];
  }[];
}

export interface SimpleRoomInput {
  projectId: string;
  rooms: string[];
}

export class LoopFactoryService {
  constructor(private loopService: LoopService) {}

  // Create standard floor/room/zone hierarchy
  async createFloorPlan(input: FloorPlanInput, actorId: string): Promise<void> {
    // Create floor context
    const floorContext = await this.loopService.createContext(
      {
        project_id: input.projectId,
        name: 'Floors',
        loop_type: 'floor',
        display_order: 0,
      },
      actorId
    );

    // Create room context (child of floors conceptually, but separate context)
    const roomContext = await this.loopService.createContext(
      {
        project_id: input.projectId,
        name: 'Rooms',
        loop_type: 'location',
        display_order: 1,
      },
      actorId
    );

    // Create zone context if any rooms have zones
    let zoneContext;
    const hasZones = input.floors.some((f) => f.rooms.some((r) => r.zones?.length));
    if (hasZones) {
      zoneContext = await this.loopService.createContext(
        {
          project_id: input.projectId,
          name: 'Zones',
          loop_type: 'zone',
          display_order: 2,
        },
        actorId
      );
    }

    // Create iterations
    for (let floorIndex = 0; floorIndex < input.floors.length; floorIndex++) {
      const floor = input.floors[floorIndex];

      const floorIteration = await this.loopService.createIteration(
        {
          context_id: floorContext.id,
          project_id: input.projectId,
          name: floor.name,
          display_order: floorIndex,
        },
        actorId
      );

      for (let roomIndex = 0; roomIndex < floor.rooms.length; roomIndex++) {
        const room = floor.rooms[roomIndex];

        const roomIteration = await this.loopService.createIteration(
          {
            context_id: roomContext.id,
            project_id: input.projectId,
            name: room.name,
            parent_iteration_id: floorIteration.id,
            display_order: roomIndex,
          },
          actorId
        );

        // Create zones if any
        if (room.zones && zoneContext) {
          for (let zoneIndex = 0; zoneIndex < room.zones.length; zoneIndex++) {
            await this.loopService.createIteration(
              {
                context_id: zoneContext.id,
                project_id: input.projectId,
                name: room.zones[zoneIndex],
                parent_iteration_id: roomIteration.id,
                display_order: zoneIndex,
              },
              actorId
            );
          }
        }
      }
    }
  }

  // Create simple room list (no floors)
  async createSimpleRooms(input: SimpleRoomInput, actorId: string): Promise<void> {
    const roomContext = await this.loopService.createContext(
      {
        project_id: input.projectId,
        name: 'Rooms',
        loop_type: 'location',
        display_order: 0,
      },
      actorId
    );

    for (let i = 0; i < input.rooms.length; i++) {
      await this.loopService.createIteration(
        {
          context_id: roomContext.id,
          project_id: input.projectId,
          name: input.rooms[i],
          display_order: i,
        },
        actorId
      );
    }
  }

  // Create work category contexts (Electrical, Plumbing, etc.)
  // Note: work_category is NOT property-transformable
  async createWorkCategories(
    projectId: string,
    categories: string[],
    actorId: string
  ): Promise<void> {
    for (let i = 0; i < categories.length; i++) {
      await this.loopService.createContext(
        {
          project_id: projectId,
          name: categories[i],
          loop_type: 'work_category',
          display_order: i,
        },
        actorId
      );
    }
  }

  // Create phase contexts (Demo, Rough-in, Finishes, etc.)
  // Note: phase is NOT property-transformable
  async createPhases(projectId: string, phases: string[], actorId: string): Promise<void> {
    for (let i = 0; i < phases.length; i++) {
      await this.loopService.createContext(
        {
          project_id: projectId,
          name: phases[i],
          loop_type: 'phase',
          display_order: i,
        },
        actorId
      );
    }
  }

  // Standard renovation setup
  async createStandardRenovationStructure(
    projectId: string,
    rooms: string[],
    actorId: string
  ): Promise<void> {
    // Create rooms
    await this.createSimpleRooms({ projectId, rooms }, actorId);

    // Create standard phases
    await this.createPhases(
      projectId,
      ['Demo', 'Rough-In', 'Insulation & Drywall', 'Finishes', 'Punch List'],
      actorId
    );

    // Create common work categories
    await this.createWorkCategories(
      projectId,
      [
        'Electrical',
        'Plumbing',
        'HVAC',
        'Framing',
        'Drywall',
        'Flooring',
        'Trim & Millwork',
        'Paint',
      ],
      actorId
    );
  }

  // Standard new construction setup
  async createNewConstructionStructure(
    projectId: string,
    floorPlan: FloorPlanInput['floors'],
    actorId: string
  ): Promise<void> {
    // Create floor/room structure
    await this.createFloorPlan({ projectId, floors: floorPlan }, actorId);

    // Create construction phases
    await this.createPhases(
      projectId,
      [
        'Site Prep',
        'Foundation',
        'Framing',
        'Rough-In (MEP)',
        'Insulation',
        'Drywall',
        'Interior Finishes',
        'Exterior Finishes',
        'Final Inspection',
        'Punch List',
      ],
      actorId
    );

    // Create work categories
    await this.createWorkCategories(
      projectId,
      [
        'Site Work',
        'Concrete',
        'Framing',
        'Roofing',
        'Electrical',
        'Plumbing',
        'HVAC',
        'Insulation',
        'Drywall',
        'Flooring',
        'Trim & Millwork',
        'Cabinets & Counters',
        'Paint',
        'Exterior',
        'Landscaping',
      ],
      actorId
    );
  }

  // Kitchen/bath remodel setup
  async createKitchenBathStructure(
    projectId: string,
    rooms: string[],
    actorId: string
  ): Promise<void> {
    // Create rooms
    await this.createSimpleRooms({ projectId, rooms }, actorId);

    // Create K&B specific phases
    await this.createPhases(
      projectId,
      [
        'Demo',
        'Rough Plumbing',
        'Rough Electrical',
        'Framing & Backing',
        'Drywall',
        'Tile',
        'Cabinet Install',
        'Countertops',
        'Finish Plumbing',
        'Finish Electrical',
        'Paint & Touch-up',
        'Punch List',
      ],
      actorId
    );

    // Create K&B specific work categories
    await this.createWorkCategories(
      projectId,
      [
        'Plumbing',
        'Electrical',
        'Framing',
        'Drywall',
        'Tile',
        'Cabinets',
        'Countertops',
        'Flooring',
        'Paint',
        'Hardware & Accessories',
      ],
      actorId
    );
  }

  // ============================================================================
  // Division-Specific Factory Methods
  // ============================================================================

  /**
   * Create structure for Hooomz Interiors projects.
   * Uses Interiors-specific work categories and stages.
   *
   * Work Categories: Flooring, Paint, Finish Carpentry, Tile, Drywall
   * Stages: Demolition → Prime & Prep → Finish → Punch List → Closeout
   */
  async createInteriorsStructure(
    projectId: string,
    rooms: string[],
    actorId: string,
    _division: Division = 'interiors'
  ): Promise<void> {
    // Create rooms
    await this.createSimpleRooms({ projectId, rooms }, actorId);

    // Create Interiors-specific phases
    await this.createPhases(projectId, INTERIORS_STAGES, actorId);

    // Create Interiors-specific work categories
    await this.createWorkCategories(projectId, INTERIORS_WORK_CATEGORIES, actorId);
  }

  /**
   * Create structure for Hooomz Exteriors projects.
   * Uses Exteriors-specific work categories and stages.
   */
  async createExteriorsStructure(
    projectId: string,
    areas: string[],
    actorId: string,
    _division: Division = 'exteriors'
  ): Promise<void> {
    // Delegate to existing exterior structure method
    await this.createExteriorStructure(projectId, areas, actorId);
  }

  /**
   * Create project structure based on division.
   * This is the main entry point for division-aware project setup.
   */
  async createStructureForDivision(
    projectId: string,
    division: Division,
    locations: string[],
    actorId: string
  ): Promise<void> {
    switch (division) {
      case 'interiors':
        await this.createInteriorsStructure(projectId, locations, actorId);
        break;
      case 'exteriors':
        await this.createExteriorsStructure(projectId, locations, actorId);
        break;
      case 'diy':
      case 'maintenance':
        // DIY and Maintenance use simpler structures
        await this.createSimpleRooms({ projectId, rooms: locations }, actorId);
        break;
      default:
        throw new Error(`Unknown division: ${division}`);
    }
  }

  // ============================================================================
  // Legacy Methods (kept for backward compatibility with Exteriors)
  // ============================================================================

  // Exterior/siding project setup
  async createExteriorStructure(
    projectId: string,
    areas: string[],
    actorId: string
  ): Promise<void> {
    // Create areas as zones
    const areaContext = await this.loopService.createContext(
      {
        project_id: projectId,
        name: 'Areas',
        loop_type: 'zone',
        display_order: 0,
      },
      actorId
    );

    for (let i = 0; i < areas.length; i++) {
      await this.loopService.createIteration(
        {
          context_id: areaContext.id,
          project_id: projectId,
          name: areas[i],
          display_order: i,
        },
        actorId
      );
    }

    // Create exterior phases
    await this.createPhases(
      projectId,
      [
        'Strip Existing',
        'Repair Sheathing',
        'Weather Barrier',
        'Trim Work',
        'Siding Install',
        'Flashing & Details',
        'Paint/Finish',
        'Clean-up',
      ],
      actorId
    );

    // Create exterior work categories
    await this.createWorkCategories(
      projectId,
      ['Siding', 'Trim', 'Windows', 'Doors', 'Roofing', 'Gutters', 'Paint'],
      actorId
    );
  }
}
