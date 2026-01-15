/**
 * Inspection Repository - Data access layer for inspections
 * Designed for offline-first operation with eventual sync
 */

import type {
  ApiResponse,
  PaginatedApiResponse,
  QueryParams,
  Metadata,
} from '@hooomz/shared-contracts';
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  generateId,
  createMetadata,
  updateMetadata,
} from '@hooomz/shared-contracts';

/**
 * NB-specific inspection types for residential construction
 */
export type InspectionType =
  | 'footing-foundation'
  | 'framing'
  | 'insulation-vapor-barrier'
  | 'electrical-rough-in'
  | 'plumbing-rough-in'
  | 'hvac'
  | 'final';

/**
 * Inspection status
 */
export type InspectionStatus =
  | 'scheduled'    // Inspection scheduled but not yet performed
  | 'in-progress'  // Inspector on site
  | 'passed'       // Inspection passed
  | 'failed'       // Inspection failed, needs correction
  | 'cancelled';   // Inspection cancelled

/**
 * Inspection entity
 */
export interface Inspection {
  id: string;
  projectId: string;
  type: InspectionType;
  status: InspectionStatus;
  scheduledDate: string;
  completedDate?: string;
  inspectorName?: string;
  inspectorContact?: string;
  notes?: string;
  failedItems?: string[]; // List of items that failed
  photoIds?: string[]; // References to photos taken during inspection
  checklistInstanceId?: string; // Reference to checklist if used
  requiresReinspection: boolean;
  reinspectionOf?: string; // ID of original inspection if this is a reinspection
  metadata: Metadata;
}

/**
 * Create inspection data
 */
export interface CreateInspection {
  projectId: string;
  type: InspectionType;
  scheduledDate: string;
  inspectorName?: string;
  inspectorContact?: string;
  notes?: string;
}

/**
 * Update inspection data
 */
export interface UpdateInspection {
  scheduledDate?: string;
  completedDate?: string;
  status?: InspectionStatus;
  inspectorName?: string;
  inspectorContact?: string;
  notes?: string;
  failedItems?: string[];
  photoIds?: string[];
  checklistInstanceId?: string;
  requiresReinspection?: boolean;
}

/**
 * Inspection filters
 */
export interface InspectionFilters {
  projectId?: string;
  type?: InspectionType;
  status?: InspectionStatus;
  requiresReinspection?: boolean;
  inspectorName?: string;
  scheduledAfter?: string;
  scheduledBefore?: string;
}

/**
 * Inspection result data
 */
export interface InspectionResult {
  status: InspectionStatus;
  completedDate: string;
  notes?: string;
  failedItems?: string[];
  photoIds?: string[];
  requiresReinspection: boolean;
}

/**
 * Inspection repository interface
 */
export interface IInspectionRepository {
  // CRUD operations
  findAll(params?: QueryParams<InspectionFilters>): Promise<Inspection[]>;
  findById(id: string): Promise<Inspection | null>;
  findByProjectId(projectId: string): Promise<Inspection[]>;
  create(data: CreateInspection): Promise<Inspection>;
  update(id: string, data: UpdateInspection): Promise<Inspection>;
  delete(id: string): Promise<void>;

  // Specialized queries
  findUpcoming(days?: number): Promise<Inspection[]>;
  findFailed(): Promise<Inspection[]>;
  findByType(type: InspectionType): Promise<Inspection[]>;
  findByStatus(status: InspectionStatus): Promise<Inspection[]>;
  findByDateRange(startDate: string, endDate: string): Promise<Inspection[]>;
}

/**
 * In-memory implementation of inspection repository
 * Suitable for offline-first operation with local storage
 */
export class InMemoryInspectionRepository implements IInspectionRepository {
  private inspections: Map<string, Inspection> = new Map();

  /**
   * Find all inspections with optional filtering, sorting, and pagination
   */
  async findAll(
    params?: QueryParams<InspectionFilters>
  ): Promise<Inspection[]> {
    let results = Array.from(this.inspections.values());

    // Apply filters
    if (params?.filters) {
      const { filters } = params;

      if (filters.projectId) {
        results = results.filter((i) => i.projectId === filters.projectId);
      }

      if (filters.type) {
        results = results.filter((i) => i.type === filters.type);
      }

      if (filters.status) {
        results = results.filter((i) => i.status === filters.status);
      }

      if (filters.requiresReinspection !== undefined) {
        results = results.filter(
          (i) => i.requiresReinspection === filters.requiresReinspection
        );
      }

      if (filters.inspectorName) {
        results = results.filter(
          (i) =>
            i.inspectorName?.toLowerCase().includes(filters.inspectorName!.toLowerCase())
        );
      }

      if (filters.scheduledAfter) {
        const afterDate = new Date(filters.scheduledAfter);
        results = results.filter(
          (i) => new Date(i.scheduledDate) >= afterDate
        );
      }

      if (filters.scheduledBefore) {
        const beforeDate = new Date(filters.scheduledBefore);
        results = results.filter(
          (i) => new Date(i.scheduledDate) <= beforeDate
        );
      }
    }

    // Apply sorting
    if (params?.sortBy) {
      results.sort((a, b) => {
        const aValue = a[params.sortBy as keyof Inspection] as any;
        const bValue = b[params.sortBy as keyof Inspection] as any;

        if (aValue < bValue) return params.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return params.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default: sort by scheduled date, newest first
      results.sort(
        (a, b) =>
          new Date(b.scheduledDate).getTime() -
          new Date(a.scheduledDate).getTime()
      );
    }

    // Apply pagination
    if (params?.limit) {
      const offset = params.offset || 0;
      results = results.slice(offset, offset + params.limit);
    }

    return results;
  }

  /**
   * Find inspection by ID
   */
  async findById(id: string): Promise<Inspection | null> {
    return this.inspections.get(id) || null;
  }

  /**
   * Find all inspections for a project
   */
  async findByProjectId(projectId: string): Promise<Inspection[]> {
    return Array.from(this.inspections.values()).filter(
      (i) => i.projectId === projectId
    );
  }

  /**
   * Create new inspection
   */
  async create(data: CreateInspection): Promise<Inspection> {
    const inspection: Inspection = {
      id: generateId('inspection'),
      projectId: data.projectId,
      type: data.type,
      status: 'scheduled',
      scheduledDate: data.scheduledDate,
      inspectorName: data.inspectorName,
      inspectorContact: data.inspectorContact,
      notes: data.notes,
      requiresReinspection: false,
      metadata: createMetadata(),
    };

    this.inspections.set(inspection.id, inspection);
    return inspection;
  }

  /**
   * Update existing inspection
   */
  async update(id: string, data: UpdateInspection): Promise<Inspection> {
    const inspection = this.inspections.get(id);
    if (!inspection) {
      throw new Error(`Inspection ${id} not found`);
    }

    const updated: Inspection = {
      ...inspection,
      ...data,
      metadata: updateMetadata(inspection.metadata),
    };

    this.inspections.set(id, updated);
    return updated;
  }

  /**
   * Delete inspection
   */
  async delete(id: string): Promise<void> {
    if (!this.inspections.has(id)) {
      throw new Error(`Inspection ${id} not found`);
    }
    this.inspections.delete(id);
  }

  /**
   * Find upcoming inspections within specified days
   */
  async findUpcoming(days: number = 7): Promise<Inspection[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.inspections.values())
      .filter((i) => {
        const scheduledDate = new Date(i.scheduledDate);
        return (
          i.status === 'scheduled' &&
          scheduledDate >= now &&
          scheduledDate <= futureDate
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      );
  }

  /**
   * Find failed inspections that need reinspection
   */
  async findFailed(): Promise<Inspection[]> {
    return Array.from(this.inspections.values())
      .filter((i) => i.status === 'failed' || i.requiresReinspection)
      .sort(
        (a, b) =>
          new Date(b.completedDate || b.scheduledDate).getTime() -
          new Date(a.completedDate || a.scheduledDate).getTime()
      );
  }

  /**
   * Find inspections by type
   */
  async findByType(type: InspectionType): Promise<Inspection[]> {
    return Array.from(this.inspections.values()).filter((i) => i.type === type);
  }

  /**
   * Find inspections by status
   */
  async findByStatus(status: InspectionStatus): Promise<Inspection[]> {
    return Array.from(this.inspections.values()).filter(
      (i) => i.status === status
    );
  }

  /**
   * Find inspections within date range
   */
  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Inspection[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return Array.from(this.inspections.values())
      .filter((i) => {
        const scheduledDate = new Date(i.scheduledDate);
        return scheduledDate >= start && scheduledDate <= end;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      );
  }
}
