/**
 * Inspection Service - Business logic for managing inspections
 * Handles scheduling, recording results, and inspection workflows
 */

import type {
  ApiResponse,
  PaginatedApiResponse,
  QueryParams,
} from '@hooomz/shared-contracts';
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from '@hooomz/shared-contracts';

import type {
  IInspectionRepository,
  Inspection,
  CreateInspection,
  UpdateInspection,
  InspectionFilters,
  InspectionType,
  InspectionStatus,
  InspectionResult,
} from './inspection.repository';

/**
 * Inspection service dependencies
 */
export interface InspectionServiceDependencies {
  inspectionRepository: IInspectionRepository;
}

/**
 * Inspection with additional context
 */
export interface InspectionWithContext extends Inspection {
  daysUntilInspection?: number;
  isOverdue?: boolean;
  reinspectionCount?: number;
}

/**
 * Inspection Service
 * Provides business logic for inspection management
 */
export class InspectionService {
  constructor(private deps: InspectionServiceDependencies) {}

  /**
   * List inspections with filtering, sorting, and pagination
   */
  async list(
    params?: QueryParams<InspectionFilters>
  ): Promise<PaginatedApiResponse<Inspection[]>> {
    try {
      const inspections = await this.deps.inspectionRepository.findAll(params);
      const total = inspections.length;

      return createPaginatedResponse(inspections, {
        total,
        limit: params?.limit || total,
        offset: params?.offset || 0,
      });
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to list inspections',
        { error }
      );
    }
  }

  /**
   * Get inspection by ID
   */
  async getById(id: string): Promise<ApiResponse<Inspection>> {
    try {
      const inspection = await this.deps.inspectionRepository.findById(id);

      if (!inspection) {
        return createErrorResponse(
          'NOT_FOUND',
          `Inspection ${id} not found`
        );
      }

      return createSuccessResponse(inspection);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get inspection',
        { error }
      );
    }
  }

  /**
   * Create new inspection
   */
  async create(data: CreateInspection): Promise<ApiResponse<Inspection>> {
    try {
      // Validate scheduled date is not in the past
      const scheduledDate = new Date(data.scheduledDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (scheduledDate < now) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'Scheduled date cannot be in the past'
        );
      }

      const inspection = await this.deps.inspectionRepository.create(data);
      return createSuccessResponse(inspection);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to create inspection',
        { error }
      );
    }
  }

  /**
   * Update inspection
   */
  async update(
    id: string,
    data: UpdateInspection
  ): Promise<ApiResponse<Inspection>> {
    try {
      const inspection = await this.deps.inspectionRepository.update(id, data);
      return createSuccessResponse(inspection);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return createErrorResponse('NOT_FOUND', `Inspection ${id} not found`);
      }
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to update inspection',
        { error }
      );
    }
  }

  /**
   * Delete inspection
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await this.deps.inspectionRepository.delete(id);
      return createSuccessResponse(undefined);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return createErrorResponse('NOT_FOUND', `Inspection ${id} not found`);
      }
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to delete inspection',
        { error }
      );
    }
  }

  /**
   * Get inspections by project
   */
  async getInspectionsByProject(
    projectId: string
  ): Promise<ApiResponse<Inspection[]>> {
    try {
      const inspections =
        await this.deps.inspectionRepository.findByProjectId(projectId);
      return createSuccessResponse(inspections);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get project inspections',
        { error }
      );
    }
  }

  /**
   * Schedule a new inspection
   */
  async scheduleInspection(
    projectId: string,
    type: InspectionType,
    date: string,
    inspector?: { name: string; contact: string }
  ): Promise<ApiResponse<Inspection>> {
    try {
      const inspection = await this.deps.inspectionRepository.create({
        projectId,
        type,
        scheduledDate: date,
        inspectorName: inspector?.name,
        inspectorContact: inspector?.contact,
      });

      return createSuccessResponse(inspection);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to schedule inspection',
        { error }
      );
    }
  }

  /**
   * Record inspection result
   */
  async recordInspectionResult(
    inspectionId: string,
    result: InspectionResult
  ): Promise<ApiResponse<Inspection>> {
    try {
      // Get existing inspection
      const existing = await this.deps.inspectionRepository.findById(
        inspectionId
      );

      if (!existing) {
        return createErrorResponse(
          'NOT_FOUND',
          `Inspection ${inspectionId} not found`
        );
      }

      // Validate status transition
      if (existing.status !== 'scheduled' && existing.status !== 'in-progress') {
        return createErrorResponse(
          'INVALID_STATE',
          `Cannot record result for inspection with status ${existing.status}`
        );
      }

      // Update inspection with result
      const updated = await this.deps.inspectionRepository.update(
        inspectionId,
        {
          status: result.status,
          completedDate: result.completedDate,
          notes: result.notes,
          failedItems: result.failedItems,
          photoIds: result.photoIds,
          requiresReinspection: result.requiresReinspection,
        }
      );

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to record inspection result',
        { error }
      );
    }
  }

  /**
   * Get upcoming inspections within specified days
   */
  async getUpcomingInspections(
    days: number = 7
  ): Promise<ApiResponse<InspectionWithContext[]>> {
    try {
      const inspections = await this.deps.inspectionRepository.findUpcoming(
        days
      );

      // Add context
      const now = new Date();
      const withContext: InspectionWithContext[] = inspections.map((i) => {
        const scheduledDate = new Date(i.scheduledDate);
        const daysUntil = Math.ceil(
          (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...i,
          daysUntilInspection: daysUntil,
          isOverdue: daysUntil < 0,
        };
      });

      return createSuccessResponse(withContext);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get upcoming inspections',
        { error }
      );
    }
  }

  /**
   * Get failed inspections that need reinspection
   */
  async getFailedInspections(): Promise<ApiResponse<Inspection[]>> {
    try {
      const inspections = await this.deps.inspectionRepository.findFailed();
      return createSuccessResponse(inspections);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get failed inspections',
        { error }
      );
    }
  }

  /**
   * Schedule reinspection for a failed inspection
   */
  async scheduleReinspection(
    originalInspectionId: string,
    scheduledDate: string
  ): Promise<ApiResponse<Inspection>> {
    try {
      // Get original inspection
      const original = await this.deps.inspectionRepository.findById(
        originalInspectionId
      );

      if (!original) {
        return createErrorResponse(
          'NOT_FOUND',
          `Inspection ${originalInspectionId} not found`
        );
      }

      if (original.status !== 'failed') {
        return createErrorResponse(
          'INVALID_STATE',
          'Can only schedule reinspection for failed inspections'
        );
      }

      // Create new inspection
      const reinspection = await this.deps.inspectionRepository.create({
        projectId: original.projectId,
        type: original.type,
        scheduledDate,
        inspectorName: original.inspectorName,
        inspectorContact: original.inspectorContact,
        notes: `Reinspection for ${original.type}. Original inspection failed on ${original.completedDate}`,
      });

      // Update original to reference reinspection
      await this.deps.inspectionRepository.update(originalInspectionId, {
        requiresReinspection: false, // Reinspection scheduled
      });

      // Update new inspection to reference original
      const updated = await this.deps.inspectionRepository.update(
        reinspection.id,
        {
          reinspectionOf: originalInspectionId,
        }
      );

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to schedule reinspection',
        { error }
      );
    }
  }

  /**
   * Get inspection statistics for a project
   */
  async getProjectInspectionStats(projectId: string): Promise<
    ApiResponse<{
      total: number;
      scheduled: number;
      passed: number;
      failed: number;
      passRate: number;
      requiresReinspection: number;
      byType: Record<InspectionType, number>;
    }>
  > {
    try {
      const inspections =
        await this.deps.inspectionRepository.findByProjectId(projectId);

      const stats = {
        total: inspections.length,
        scheduled: inspections.filter((i) => i.status === 'scheduled').length,
        passed: inspections.filter((i) => i.status === 'passed').length,
        failed: inspections.filter((i) => i.status === 'failed').length,
        passRate: 0,
        requiresReinspection: inspections.filter((i) => i.requiresReinspection)
          .length,
        byType: {} as Record<InspectionType, number>,
      };

      // Calculate pass rate
      const completed = stats.passed + stats.failed;
      if (completed > 0) {
        stats.passRate = Math.round((stats.passed / completed) * 100);
      }

      // Count by type
      const types: InspectionType[] = [
        'footing-foundation',
        'framing',
        'insulation-vapor-barrier',
        'electrical-rough-in',
        'plumbing-rough-in',
        'hvac',
        'final',
      ];

      for (const type of types) {
        stats.byType[type] = inspections.filter((i) => i.type === type).length;
      }

      return createSuccessResponse(stats);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get inspection statistics',
        { error }
      );
    }
  }

  /**
   * Get inspection history for a project (sorted by date)
   */
  async getInspectionHistory(
    projectId: string
  ): Promise<ApiResponse<Inspection[]>> {
    try {
      const inspections =
        await this.deps.inspectionRepository.findByProjectId(projectId);

      // Sort by completed date (or scheduled if not completed)
      const sorted = inspections.sort((a, b) => {
        const aDate = new Date(a.completedDate || a.scheduledDate);
        const bDate = new Date(b.completedDate || b.scheduledDate);
        return bDate.getTime() - aDate.getTime();
      });

      return createSuccessResponse(sorted);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to get inspection history',
        { error }
      );
    }
  }

  /**
   * Start inspection (mark as in-progress)
   */
  async startInspection(inspectionId: string): Promise<ApiResponse<Inspection>> {
    try {
      const inspection = await this.deps.inspectionRepository.findById(
        inspectionId
      );

      if (!inspection) {
        return createErrorResponse(
          'NOT_FOUND',
          `Inspection ${inspectionId} not found`
        );
      }

      if (inspection.status !== 'scheduled') {
        return createErrorResponse(
          'INVALID_STATE',
          `Cannot start inspection with status ${inspection.status}`
        );
      }

      const updated = await this.deps.inspectionRepository.update(
        inspectionId,
        {
          status: 'in-progress',
        }
      );

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to start inspection',
        { error }
      );
    }
  }

  /**
   * Cancel inspection
   */
  async cancelInspection(
    inspectionId: string,
    reason?: string
  ): Promise<ApiResponse<Inspection>> {
    try {
      const inspection = await this.deps.inspectionRepository.findById(
        inspectionId
      );

      if (!inspection) {
        return createErrorResponse(
          'NOT_FOUND',
          `Inspection ${inspectionId} not found`
        );
      }

      if (inspection.status === 'passed' || inspection.status === 'failed') {
        return createErrorResponse(
          'INVALID_STATE',
          'Cannot cancel completed inspection'
        );
      }

      const updated = await this.deps.inspectionRepository.update(
        inspectionId,
        {
          status: 'cancelled',
          notes: reason
            ? `${inspection.notes || ''}\n\nCancelled: ${reason}`.trim()
            : inspection.notes,
        }
      );

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to cancel inspection',
        { error }
      );
    }
  }
}
