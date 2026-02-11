/**
 * Inspection Service - Wraps InspectionRepository with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all inspection operations are logged.
 */

import type { Inspection, CreateInspection } from '@hooomz/shared-contracts';
import { InspectionStatus } from '@hooomz/shared-contracts';
import type { Services } from './index';

/**
 * InspectionService - Handles inspection operations with activity logging
 */
export class InspectionService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Schedule a new inspection
   */
  async schedule(
    projectId: string,
    data: CreateInspection
  ): Promise<Inspection> {
    const inspection = await this.services.fieldDocs.inspections.create(data);

    // Log to activity (non-blocking)
    this.services.activity.logInspectionEvent('inspection.scheduled', projectId, inspection.id, {
      inspection_type: inspection.inspectionType,
      inspector: inspection.inspector,
      scheduled_date: inspection.date,
    }).catch((err) => console.error('Failed to log inspection.scheduled:', err));

    return inspection;
  }

  /**
   * Record inspection passed
   */
  async recordPassed(
    projectId: string,
    inspectionId: string,
    notes?: string,
    photos?: string[]
  ): Promise<Inspection> {
    const existing = await this.services.fieldDocs.inspections.findById(inspectionId);
    if (!existing) {
      throw new Error(`Inspection ${inspectionId} not found`);
    }

    const updated = await this.services.fieldDocs.inspections.update(inspectionId, {
      status: InspectionStatus.PASSED,
      notes: notes || existing.notes,
      photos: photos || existing.photos,
    });

    // Log passed event (non-blocking)
    this.services.activity.logInspectionEvent('inspection.passed', projectId, inspectionId, {
      inspection_type: updated.inspectionType,
      inspector: updated.inspector,
      notes: notes,
      photos: photos,
    }).catch((err) => console.error('Failed to log inspection.passed:', err));

    return updated;
  }

  /**
   * Record inspection failed
   */
  async recordFailed(
    projectId: string,
    inspectionId: string,
    reason: string,
    notes?: string,
    photos?: string[]
  ): Promise<Inspection> {
    const existing = await this.services.fieldDocs.inspections.findById(inspectionId);
    if (!existing) {
      throw new Error(`Inspection ${inspectionId} not found`);
    }

    const updated = await this.services.fieldDocs.inspections.update(inspectionId, {
      status: InspectionStatus.FAILED,
      notes: notes ? `${reason}\n\n${notes}` : reason,
      photos: photos || existing.photos,
    });

    // Log failed event (non-blocking)
    this.services.activity.logInspectionEvent('inspection.failed', projectId, inspectionId, {
      inspection_type: updated.inspectionType,
      inspector: updated.inspector,
      reason: reason,
      notes: notes,
      photos: photos,
    }).catch((err) => console.error('Failed to log inspection.failed:', err));

    return updated;
  }

  /**
   * Reschedule an inspection
   */
  async reschedule(
    projectId: string,
    inspectionId: string,
    newDate: string,
    inspector?: string
  ): Promise<Inspection> {
    const existing = await this.services.fieldDocs.inspections.findById(inspectionId);
    if (!existing) {
      throw new Error(`Inspection ${inspectionId} not found`);
    }

    const updated = await this.services.fieldDocs.inspections.update(inspectionId, {
      date: newDate,
      inspector: inspector || existing.inspector,
      status: InspectionStatus.SCHEDULED,
    });

    // Log reschedule as a new scheduled event (non-blocking)
    this.services.activity.logInspectionEvent('inspection.scheduled', projectId, inspectionId, {
      inspection_type: updated.inspectionType,
      inspector: updated.inspector,
      scheduled_date: newDate,
    }).catch((err) => console.error('Failed to log inspection reschedule:', err));

    return updated;
  }

  /**
   * Add photos to an inspection
   */
  async addPhotos(
    _projectId: string,
    inspectionId: string,
    photoIds: string[]
  ): Promise<Inspection> {
    const existing = await this.services.fieldDocs.inspections.findById(inspectionId);
    if (!existing) {
      throw new Error(`Inspection ${inspectionId} not found`);
    }

    const updatedPhotos = [...new Set([...existing.photos, ...photoIds])];
    const updated = await this.services.fieldDocs.inspections.update(inspectionId, {
      photos: updatedPhotos,
    });

    return updated;
  }

  /**
   * Delete an inspection
   */
  async delete(_projectId: string, inspectionId: string): Promise<void> {
    const existing = await this.services.fieldDocs.inspections.findById(inspectionId);

    await this.services.fieldDocs.inspections.delete(inspectionId);

    // Log deletion (non-blocking) - no specific event, just log to console
    console.log(`Inspection deleted: ${existing?.inspectionType || inspectionId}`);
  }

  // Passthrough methods for read operations (no logging needed)
  async findById(id: string) {
    return this.services.fieldDocs.inspections.findById(id);
  }

  async findByProjectId(projectId: string) {
    return this.services.fieldDocs.inspections.findByProjectId(projectId);
  }

  async findUpcoming(days?: number) {
    return this.services.fieldDocs.inspections.findUpcoming(days);
  }

  async findAll(params?: { filters?: { projectId?: string; status?: InspectionStatus } }) {
    return this.services.fieldDocs.inspections.findAll(params);
  }
}

/**
 * Create an InspectionService instance
 */
export function createInspectionService(services: Services): InspectionService {
  return new InspectionService(services);
}
