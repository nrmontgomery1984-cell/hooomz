/**
 * Checklist Service - Reusable inspection checklists
 * Provides predefined checklists for NB residential construction inspections
 */

import type { ApiResponse, Metadata } from '@hooomz/shared-contracts';
import {
  createSuccessResponse,
  createErrorResponse,
  generateId,
  createMetadata,
  updateMetadata,
} from '@hooomz/shared-contracts';

import type { InspectionType } from '../inspections/inspection.repository';

/**
 * Checklist item status
 */
export type ChecklistItemStatus = 'pending' | 'pass' | 'fail' | 'n/a';

/**
 * Checklist item definition
 */
export interface ChecklistItem {
  id: string;
  description: string;
  category?: string;
  required: boolean;
  notes?: string;
}

/**
 * Checklist template
 */
export interface ChecklistTemplate {
  id: string;
  type: InspectionType;
  name: string;
  description: string;
  items: ChecklistItem[];
  metadata: Metadata;
}

/**
 * Checklist instance item (with status)
 */
export interface ChecklistInstanceItem {
  itemId: string; // Reference to template item
  description: string;
  category?: string;
  required: boolean;
  status: ChecklistItemStatus;
  notes?: string;
  photos?: string[]; // Photo IDs
}

/**
 * Checklist instance (created from template for specific project)
 */
export interface ChecklistInstance {
  id: string;
  projectId: string;
  inspectionId?: string;
  templateId: string;
  type: InspectionType;
  name: string;
  items: ChecklistInstanceItem[];
  createdDate: string;
  completedDate?: string;
  completedBy?: string;
  metadata: Metadata;
}

/**
 * Create checklist instance data
 */
export interface CreateChecklistInstance {
  projectId: string;
  inspectionId?: string;
  type: InspectionType;
}

/**
 * Update checklist item data
 */
export interface UpdateChecklistItem {
  status: ChecklistItemStatus;
  notes?: string;
  photos?: string[];
}

/**
 * Checklist progress
 */
export interface ChecklistProgress {
  total: number;
  completed: number;
  passed: number;
  failed: number;
  notApplicable: number;
  pending: number;
  percentageComplete: number;
  allRequiredComplete: boolean;
}

/**
 * Checklist Service
 * Manages checklist templates and instances
 */
export class ChecklistService {
  private templates: Map<string, ChecklistTemplate> = new Map();
  private instances: Map<string, ChecklistInstance> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize predefined NB inspection checklists
   */
  private initializeTemplates(): void {
    // Footing/Foundation Checklist
    this.createTemplate({
      type: 'footing-foundation',
      name: 'Footing & Foundation Inspection',
      description: 'Inspection checklist for footing and foundation work',
      items: [
        {
          id: 'ff_1',
          description: 'Excavation depth and dimensions verified',
          category: 'Excavation',
          required: true,
        },
        {
          id: 'ff_2',
          description: 'Soil bearing capacity adequate',
          category: 'Excavation',
          required: true,
        },
        {
          id: 'ff_3',
          description: 'Footing forms properly installed and braced',
          category: 'Formwork',
          required: true,
        },
        {
          id: 'ff_4',
          description: 'Rebar placement and spacing correct',
          category: 'Reinforcement',
          required: true,
        },
        {
          id: 'ff_5',
          description: 'Rebar chairs and ties properly installed',
          category: 'Reinforcement',
          required: true,
        },
        {
          id: 'ff_6',
          description: 'Concrete strength specifications verified',
          category: 'Concrete',
          required: true,
        },
        {
          id: 'ff_7',
          description: 'Foundation waterproofing/dampproofing specified',
          category: 'Waterproofing',
          required: true,
        },
        {
          id: 'ff_8',
          description: 'Weeping tile/drainage system planned',
          category: 'Drainage',
          required: true,
        },
      ],
    });

    // Framing Checklist
    this.createTemplate({
      type: 'framing',
      name: 'Framing Inspection',
      description: 'Inspection checklist for rough framing',
      items: [
        {
          id: 'fr_1',
          description: 'Wall plates properly anchored to foundation',
          category: 'Foundation Connection',
          required: true,
        },
        {
          id: 'fr_2',
          description: 'Wall studs spacing correct (16" or 24" o.c.)',
          category: 'Wall Framing',
          required: true,
        },
        {
          id: 'fr_3',
          description: 'Headers properly sized for openings',
          category: 'Wall Framing',
          required: true,
        },
        {
          id: 'fr_4',
          description: 'Floor joists size and spacing correct',
          category: 'Floor System',
          required: true,
        },
        {
          id: 'fr_5',
          description: 'Floor joists properly supported (beams, bearing walls)',
          category: 'Floor System',
          required: true,
        },
        {
          id: 'fr_6',
          description: 'Subfloor properly fastened',
          category: 'Floor System',
          required: true,
        },
        {
          id: 'fr_7',
          description: 'Roof trusses/rafters properly installed',
          category: 'Roof System',
          required: true,
        },
        {
          id: 'fr_8',
          description: 'Roof sheathing properly fastened',
          category: 'Roof System',
          required: true,
        },
        {
          id: 'fr_9',
          description: 'Stair stringers properly supported',
          category: 'Stairs',
          required: false,
        },
        {
          id: 'fr_10',
          description: 'Fire blocking installed where required',
          category: 'Fire Protection',
          required: true,
        },
      ],
    });

    // Insulation/Vapor Barrier Checklist
    this.createTemplate({
      type: 'insulation-vapor-barrier',
      name: 'Insulation & Vapor Barrier Inspection',
      description: 'Inspection checklist for insulation and vapor barrier installation',
      items: [
        {
          id: 'iv_1',
          description: 'Wall insulation R-value meets code requirements',
          category: 'Wall Insulation',
          required: true,
        },
        {
          id: 'iv_2',
          description: 'Wall insulation properly installed (no gaps or compression)',
          category: 'Wall Insulation',
          required: true,
        },
        {
          id: 'iv_3',
          description: 'Ceiling/attic insulation R-value meets code',
          category: 'Ceiling Insulation',
          required: true,
        },
        {
          id: 'iv_4',
          description: 'Ceiling insulation properly installed',
          category: 'Ceiling Insulation',
          required: true,
        },
        {
          id: 'iv_5',
          description: 'Foundation insulation installed where required',
          category: 'Foundation Insulation',
          required: true,
        },
        {
          id: 'iv_6',
          description: 'Vapor barrier (poly) installed on warm side',
          category: 'Vapor Barrier',
          required: true,
        },
        {
          id: 'iv_7',
          description: 'Vapor barrier properly sealed at joints',
          category: 'Vapor Barrier',
          required: true,
        },
        {
          id: 'iv_8',
          description: 'Vapor barrier intact (no tears or gaps)',
          category: 'Vapor Barrier',
          required: true,
        },
        {
          id: 'iv_9',
          description: 'Air sealing at penetrations completed',
          category: 'Air Sealing',
          required: true,
        },
      ],
    });

    // Electrical Rough-in Checklist
    this.createTemplate({
      type: 'electrical-rough-in',
      name: 'Electrical Rough-in Inspection',
      description: 'Inspection checklist for electrical rough-in',
      items: [
        {
          id: 'el_1',
          description: 'Service panel location acceptable',
          category: 'Service',
          required: true,
        },
        {
          id: 'el_2',
          description: 'Service panel size adequate for load',
          category: 'Service',
          required: true,
        },
        {
          id: 'el_3',
          description: 'Branch circuit wiring properly sized',
          category: 'Wiring',
          required: true,
        },
        {
          id: 'el_4',
          description: 'Wiring properly stapled/supported',
          category: 'Wiring',
          required: true,
        },
        {
          id: 'el_5',
          description: 'Outlet boxes properly installed and secured',
          category: 'Boxes',
          required: true,
        },
        {
          id: 'el_6',
          description: 'GFCI protection where required (bathrooms, kitchen, exterior)',
          category: 'Safety',
          required: true,
        },
        {
          id: 'el_7',
          description: 'AFCI protection where required (bedrooms, living areas)',
          category: 'Safety',
          required: true,
        },
        {
          id: 'el_8',
          description: 'Smoke detector wiring installed',
          category: 'Safety',
          required: true,
        },
        {
          id: 'el_9',
          description: 'CO detector wiring installed',
          category: 'Safety',
          required: true,
        },
        {
          id: 'el_10',
          description: 'Grounding system properly installed',
          category: 'Grounding',
          required: true,
        },
      ],
    });

    // Plumbing Rough-in Checklist
    this.createTemplate({
      type: 'plumbing-rough-in',
      name: 'Plumbing Rough-in Inspection',
      description: 'Inspection checklist for plumbing rough-in',
      items: [
        {
          id: 'pl_1',
          description: 'Water supply lines properly sized',
          category: 'Water Supply',
          required: true,
        },
        {
          id: 'pl_2',
          description: 'Water supply lines properly supported',
          category: 'Water Supply',
          required: true,
        },
        {
          id: 'pl_3',
          description: 'Shut-off valves installed where required',
          category: 'Water Supply',
          required: true,
        },
        {
          id: 'pl_4',
          description: 'DWV piping properly sized',
          category: 'Drainage',
          required: true,
        },
        {
          id: 'pl_5',
          description: 'DWV piping proper slope maintained',
          category: 'Drainage',
          required: true,
        },
        {
          id: 'pl_6',
          description: 'Vent piping properly installed',
          category: 'Venting',
          required: true,
        },
        {
          id: 'pl_7',
          description: 'Cleanouts installed where required',
          category: 'Drainage',
          required: true,
        },
        {
          id: 'pl_8',
          description: 'Water hammer arrestors installed',
          category: 'Water Supply',
          required: false,
        },
        {
          id: 'pl_9',
          description: 'Pressure test completed and passed',
          category: 'Testing',
          required: true,
        },
      ],
    });

    // HVAC Checklist
    this.createTemplate({
      type: 'hvac',
      name: 'HVAC Inspection',
      description: 'Inspection checklist for HVAC systems',
      items: [
        {
          id: 'hv_1',
          description: 'Furnace/heating unit properly sized for space',
          category: 'Equipment',
          required: true,
        },
        {
          id: 'hv_2',
          description: 'Furnace clearances meet code',
          category: 'Equipment',
          required: true,
        },
        {
          id: 'hv_3',
          description: 'Ductwork properly sized and sealed',
          category: 'Distribution',
          required: true,
        },
        {
          id: 'hv_4',
          description: 'Supply registers properly located',
          category: 'Distribution',
          required: true,
        },
        {
          id: 'hv_5',
          description: 'Return air properly sized and located',
          category: 'Distribution',
          required: true,
        },
        {
          id: 'hv_6',
          description: 'Combustion air supply adequate',
          category: 'Ventilation',
          required: true,
        },
        {
          id: 'hv_7',
          description: 'Flue/venting properly installed',
          category: 'Venting',
          required: true,
        },
        {
          id: 'hv_8',
          description: 'HRV/ERV installed and ducted properly',
          category: 'Ventilation',
          required: false,
        },
        {
          id: 'hv_9',
          description: 'Bathroom exhaust fans properly vented',
          category: 'Ventilation',
          required: true,
        },
      ],
    });

    // Final Inspection Checklist
    this.createTemplate({
      type: 'final',
      name: 'Final Inspection',
      description: 'Final inspection checklist before occupancy',
      items: [
        {
          id: 'fi_1',
          description: 'All previous inspection deficiencies corrected',
          category: 'General',
          required: true,
        },
        {
          id: 'fi_2',
          description: 'Handrails and guards meet code requirements',
          category: 'Safety',
          required: true,
        },
        {
          id: 'fi_3',
          description: 'Smoke detectors installed and tested',
          category: 'Safety',
          required: true,
        },
        {
          id: 'fi_4',
          description: 'CO detectors installed and tested',
          category: 'Safety',
          required: true,
        },
        {
          id: 'fi_5',
          description: 'Electrical fixtures installed and operational',
          category: 'Electrical',
          required: true,
        },
        {
          id: 'fi_6',
          description: 'Plumbing fixtures installed and tested',
          category: 'Plumbing',
          required: true,
        },
        {
          id: 'fi_7',
          description: 'HVAC system operational',
          category: 'HVAC',
          required: true,
        },
        {
          id: 'fi_8',
          description: 'Windows and doors properly installed and operational',
          category: 'Building Envelope',
          required: true,
        },
        {
          id: 'fi_9',
          description: 'Exterior grading slopes away from foundation',
          category: 'Grading',
          required: true,
        },
        {
          id: 'fi_10',
          description: 'Address numbers posted and visible',
          category: 'General',
          required: true,
        },
        {
          id: 'fi_11',
          description: 'Final cleanup completed',
          category: 'General',
          required: false,
        },
      ],
    });
  }

  /**
   * Create checklist template
   */
  private createTemplate(
    data: Omit<ChecklistTemplate, 'id' | 'metadata'>
  ): void {
    const template: ChecklistTemplate = {
      id: generateId('checklist_template'),
      ...data,
      metadata: createMetadata(),
    };

    this.templates.set(template.type, template);
  }

  /**
   * Get checklist template by type
   */
  async getChecklist(
    type: InspectionType
  ): Promise<ApiResponse<ChecklistTemplate>> {
    try {
      const template = this.templates.get(type);

      if (!template) {
        return createErrorResponse(
          'NOT_FOUND',
          `Checklist template for ${type} not found`
        );
      }

      return createSuccessResponse(template);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get checklist template',
        { error }
      );
    }
  }

  /**
   * Get all checklist templates
   */
  async getAllChecklists(): Promise<ApiResponse<ChecklistTemplate[]>> {
    try {
      const templates = Array.from(this.templates.values());
      return createSuccessResponse(templates);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get checklist templates',
        { error }
      );
    }
  }

  /**
   * Create checklist instance from template for a project
   */
  async createChecklistInstance(
    data: CreateChecklistInstance
  ): Promise<ApiResponse<ChecklistInstance>> {
    try {
      // Get template
      const templateResult = await this.getChecklist(data.type);
      if (!templateResult.success || !templateResult.data) {
        return createErrorResponse(
          'NOT_FOUND',
          `Checklist template for ${data.type} not found`
        );
      }

      const template = templateResult.data;

      // Create instance from template
      const instance: ChecklistInstance = {
        id: generateId('checklist_instance'),
        projectId: data.projectId,
        inspectionId: data.inspectionId,
        templateId: template.id,
        type: data.type,
        name: template.name,
        items: template.items.map((item) => ({
          itemId: item.id,
          description: item.description,
          category: item.category,
          required: item.required,
          status: 'pending',
          notes: item.notes,
        })),
        createdDate: new Date().toISOString(),
        metadata: createMetadata(),
      };

      this.instances.set(instance.id, instance);
      return createSuccessResponse(instance);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to create checklist instance',
        { error }
      );
    }
  }

  /**
   * Get checklist instance by ID
   */
  async getChecklistInstance(
    instanceId: string
  ): Promise<ApiResponse<ChecklistInstance>> {
    try {
      const instance = this.instances.get(instanceId);

      if (!instance) {
        return createErrorResponse(
          'NOT_FOUND',
          `Checklist instance ${instanceId} not found`
        );
      }

      return createSuccessResponse(instance);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get checklist instance',
        { error }
      );
    }
  }

  /**
   * Update checklist item status and notes
   */
  async updateChecklistItem(
    instanceId: string,
    itemId: string,
    update: UpdateChecklistItem
  ): Promise<ApiResponse<ChecklistInstance>> {
    try {
      const instance = this.instances.get(instanceId);

      if (!instance) {
        return createErrorResponse(
          'NOT_FOUND',
          `Checklist instance ${instanceId} not found`
        );
      }

      const itemIndex = instance.items.findIndex((i) => i.itemId === itemId);

      if (itemIndex === -1) {
        return createErrorResponse(
          'NOT_FOUND',
          `Checklist item ${itemId} not found in instance`
        );
      }

      // Update item
      instance.items[itemIndex] = {
        ...instance.items[itemIndex],
        ...update,
      };

      // Update metadata
      instance.metadata = updateMetadata(instance.metadata);

      // Check if all items are complete
      const allComplete = instance.items.every(
        (item) => item.status !== 'pending'
      );

      if (allComplete && !instance.completedDate) {
        instance.completedDate = new Date().toISOString();
      }

      this.instances.set(instanceId, instance);
      return createSuccessResponse(instance);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to update checklist item',
        { error }
      );
    }
  }

  /**
   * Get checklist progress/completion percentage
   */
  async getChecklistProgress(
    instanceId: string
  ): Promise<ApiResponse<ChecklistProgress>> {
    try {
      const instance = this.instances.get(instanceId);

      if (!instance) {
        return createErrorResponse(
          'NOT_FOUND',
          `Checklist instance ${instanceId} not found`
        );
      }

      const progress: ChecklistProgress = {
        total: instance.items.length,
        completed: instance.items.filter((i) => i.status !== 'pending').length,
        passed: instance.items.filter((i) => i.status === 'pass').length,
        failed: instance.items.filter((i) => i.status === 'fail').length,
        notApplicable: instance.items.filter((i) => i.status === 'n/a').length,
        pending: instance.items.filter((i) => i.status === 'pending').length,
        percentageComplete: 0,
        allRequiredComplete: false,
      };

      // Calculate percentage
      if (progress.total > 0) {
        progress.percentageComplete = Math.round(
          (progress.completed / progress.total) * 100
        );
      }

      // Check if all required items are complete
      const requiredItems = instance.items.filter((i) => i.required);
      progress.allRequiredComplete = requiredItems.every(
        (i) => i.status !== 'pending'
      );

      return createSuccessResponse(progress);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get checklist progress',
        { error }
      );
    }
  }

  /**
   * Get all checklist instances for a project
   */
  async getProjectChecklists(
    projectId: string
  ): Promise<ApiResponse<ChecklistInstance[]>> {
    try {
      const instances = Array.from(this.instances.values()).filter(
        (i) => i.projectId === projectId
      );

      return createSuccessResponse(instances);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get project checklists',
        { error }
      );
    }
  }

  /**
   * Get checklist instance for inspection
   */
  async getInspectionChecklist(
    inspectionId: string
  ): Promise<ApiResponse<ChecklistInstance | null>> {
    try {
      const instance = Array.from(this.instances.values()).find(
        (i) => i.inspectionId === inspectionId
      );

      return createSuccessResponse(instance || null);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get inspection checklist',
        { error }
      );
    }
  }

  /**
   * Mark checklist as complete
   */
  async completeChecklist(
    instanceId: string,
    completedBy: string
  ): Promise<ApiResponse<ChecklistInstance>> {
    try {
      const instance = this.instances.get(instanceId);

      if (!instance) {
        return createErrorResponse(
          'NOT_FOUND',
          `Checklist instance ${instanceId} not found`
        );
      }

      // Check if all required items are complete
      const requiredPending = instance.items.filter(
        (i) => i.required && i.status === 'pending'
      );

      if (requiredPending.length > 0) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          `Cannot complete checklist: ${requiredPending.length} required items still pending`
        );
      }

      instance.completedDate = new Date().toISOString();
      instance.completedBy = completedBy;
      instance.metadata = updateMetadata(instance.metadata);

      this.instances.set(instanceId, instance);
      return createSuccessResponse(instance);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to complete checklist',
        { error }
      );
    }
  }
}
