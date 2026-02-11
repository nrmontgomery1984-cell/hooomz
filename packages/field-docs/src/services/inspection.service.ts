/**
 * Inspection Service
 * Business logic for inspection management
 */

import type { ActivityEventType } from '@hooomz/shared';
import { EVENT_VISIBILITY_DEFAULTS } from '@hooomz/shared';
import type { IInspectionRepository } from '../repositories';
import type {
  Inspection,
  CreateInspection,
  UpdateInspection,
  InspectionFilters,
  InspectionResult,
  InspectionStatus,
  UpcomingInspection,
} from '../types';

// Activity service interface
export interface ActivityService {
  log(event: {
    organization_id: string;
    project_id: string;
    property_id: string;
    event_type: ActivityEventType;
    actor_id: string;
    actor_type: 'team_member' | 'system' | 'customer';
    entity_type: string;
    entity_id: string;
    homeowner_visible: boolean;
    event_data: Record<string, unknown>;
    loop_iteration_id?: string | null;
  }): Promise<void>;
}

export interface InspectionServiceDependencies {
  inspectionRepo: IInspectionRepository;
  activityService?: ActivityService;
}

export class InspectionService {
  private inspectionRepo: IInspectionRepository;
  private activityService?: ActivityService;

  constructor(deps: InspectionServiceDependencies) {
    this.inspectionRepo = deps.inspectionRepo;
    this.activityService = deps.activityService;
  }

  async scheduleInspection(data: CreateInspection, actorId: string): Promise<Inspection> {
    const inspection = await this.inspectionRepo.create({
      ...data,
      created_by: actorId,
    });

    if (this.activityService) {
      await this.activityService.log({
        organization_id: data.organization_id,
        project_id: data.project_id,
        property_id: data.property_id,
        event_type: 'inspection.scheduled',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'inspection',
        entity_id: inspection.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['inspection.scheduled'],
        event_data: {
          inspection_type: inspection.inspection_type,
          scheduled_date: inspection.scheduled_date,
          scheduled_time: inspection.scheduled_time,
          inspector_name: inspection.inspector_name,
        },
        loop_iteration_id: data.location_id,
      });
    }

    return inspection;
  }

  async getInspection(id: string): Promise<Inspection | null> {
    return this.inspectionRepo.findById(id);
  }

  async listByProject(projectId: string): Promise<Inspection[]> {
    return this.inspectionRepo.findByProject(projectId);
  }

  async listByProperty(propertyId: string): Promise<Inspection[]> {
    return this.inspectionRepo.findByProperty(propertyId);
  }

  async listByFilters(filters: InspectionFilters): Promise<Inspection[]> {
    return this.inspectionRepo.findByFilters(filters);
  }

  async getUpcoming(organizationId: string, days?: number): Promise<UpcomingInspection[]> {
    const inspections = await this.inspectionRepo.findUpcoming(organizationId, days);
    // In a full implementation, we'd join with project/property to get names
    return inspections as UpcomingInspection[];
  }

  async updateInspection(id: string, data: UpdateInspection): Promise<Inspection> {
    return this.inspectionRepo.update(id, data);
  }

  async reschedule(
    id: string,
    scheduledDate: string,
    scheduledTime?: string,
    actorId?: string
  ): Promise<Inspection> {
    const inspection = await this.inspectionRepo.update(id, {
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
    });

    if (this.activityService && actorId) {
      await this.activityService.log({
        organization_id: inspection.organization_id,
        project_id: inspection.project_id,
        property_id: inspection.property_id,
        event_type: 'inspection.scheduled',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'inspection',
        entity_id: inspection.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['inspection.scheduled'],
        event_data: {
          inspection_type: inspection.inspection_type,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          rescheduled: true,
        },
        loop_iteration_id: inspection.location_id,
      });
    }

    return inspection;
  }

  async recordResult(id: string, result: InspectionResult, actorId: string): Promise<Inspection> {
    const inspection = await this.inspectionRepo.updateStatus(
      id,
      result.status,
      result.result_notes
    );

    // Link photos if provided
    if (result.photo_ids && result.photo_ids.length > 0) {
      await this.inspectionRepo.linkPhotos(id, result.photo_ids);
    }

    // Link document if provided
    if (result.document_id) {
      await this.inspectionRepo.linkDocument(id, result.document_id);
    }

    // Log activity
    if (this.activityService) {
      const eventType: ActivityEventType =
        result.status === 'passed' ? 'inspection.passed' : 'inspection.failed';

      await this.activityService.log({
        organization_id: inspection.organization_id,
        project_id: inspection.project_id,
        property_id: inspection.property_id,
        event_type: eventType,
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'inspection',
        entity_id: inspection.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS[eventType],
        event_data: {
          inspection_type: inspection.inspection_type,
          result_notes: result.result_notes,
          photo_count: result.photo_ids?.length || 0,
        },
        loop_iteration_id: inspection.location_id,
      });
    }

    return inspection;
  }

  async markPassed(id: string, notes: string, actorId: string): Promise<Inspection> {
    return this.recordResult(id, { status: 'passed', result_notes: notes }, actorId);
  }

  async markFailed(id: string, notes: string, actorId: string): Promise<Inspection> {
    return this.recordResult(id, { status: 'failed', result_notes: notes }, actorId);
  }

  async cancel(id: string): Promise<Inspection> {
    return this.inspectionRepo.updateStatus(id, 'cancelled');
  }

  async linkPhotos(id: string, photoIds: string[]): Promise<Inspection> {
    return this.inspectionRepo.linkPhotos(id, photoIds);
  }

  async linkDocument(id: string, documentId: string): Promise<Inspection> {
    return this.inspectionRepo.linkDocument(id, documentId);
  }

  async deleteInspection(id: string): Promise<void> {
    return this.inspectionRepo.delete(id);
  }

  // Get inspections grouped by status for a project
  async getByStatus(projectId: string): Promise<Record<InspectionStatus, Inspection[]>> {
    const inspections = await this.inspectionRepo.findByProject(projectId);

    const grouped: Record<InspectionStatus, Inspection[]> = {
      scheduled: [],
      passed: [],
      failed: [],
      cancelled: [],
    };

    for (const inspection of inspections) {
      grouped[inspection.status].push(inspection);
    }

    return grouped;
  }
}
