/**
 * Callback Project Service
 * Creates callback projects linked to original projects and propagates outcome data
 * Implements Resolved Item I from the Master Integration Spec
 *
 * Uses canonical Project type from Zod schemas (Build 1.5 alignment).
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { ActivityService } from '../repositories/activity.repository';
import type { FieldObservationRepository } from '../repositories/labs';
import type { CallbackReason, Project } from '@hooomz/shared-contracts';

export class CallbackProjectService {
  constructor(
    private storage: StorageAdapter,
    private observationRepo: FieldObservationRepository,
    private activity: ActivityService
  ) {}

  /**
   * Create a callback project linked to the original project.
   * The original project remains closed; a new project is created for the callback work.
   */
  async createCallbackProject(
    originalProjectId: string,
    reason: CallbackReason,
    name: string
  ): Promise<Project> {
    const original = await this.storage.get<Project>(StoreNames.PROJECTS, originalProjectId);
    if (!original) throw new Error(`Original project not found: ${originalProjectId}`);

    const now = new Date().toISOString();
    const callbackProject: Project = {
      ...original,
      id: `proj_cb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      integrationProjectType: 'callback',
      linkedProjectId: originalProjectId,
      callbackReason: reason,
      callbackReportedAt: now,
      observationModeOverride: null,
      activeExperimentIds: [],
      dates: { startDate: now.split('T')[0] },
      budget: { estimatedCost: 0, actualCost: 0 },
      metadata: { createdAt: now, updatedAt: now, version: 1 },
    };

    await this.storage.set(StoreNames.PROJECTS, callbackProject.id, callbackProject);

    this.activity.logLabsEvent('project.callback_created', callbackProject.id, {
      entity_name: name,
      project_id: callbackProject.id,
      linked_project_id: originalProjectId,
      callback_reason: reason,
    }).catch((err) => console.error('Failed to log project.callback_created:', err));

    return callbackProject;
  }

  /**
   * Propagate callback outcomes to the original project's observations.
   * This is the negative signal that degrades confidence scores.
   */
  async propagateCallbackOutcomes(callbackProjectId: string): Promise<number> {
    const callbackProject = await this.storage.get<Project>(
      StoreNames.PROJECTS,
      callbackProjectId
    );
    if (!callbackProject) throw new Error(`Callback project not found: ${callbackProjectId}`);
    if (callbackProject.integrationProjectType !== 'callback') {
      throw new Error(`Project ${callbackProjectId} is not a callback project`);
    }

    const originalProjectId = callbackProject.linkedProjectId;
    if (!originalProjectId) throw new Error('Callback project has no linked project');

    // Get observations from the callback project (these describe what went wrong)
    const callbackObservations = await this.observationRepo.findByProject(callbackProjectId);

    // Get observations from the original project (these need outcome updates)
    const originalObservations = await this.observationRepo.findByProject(originalProjectId);

    let updatedCount = 0;

    // For each callback observation, find matching original observations
    // and mark them with negative outcome data
    for (const cbObs of callbackObservations) {
      for (const origObs of originalObservations) {
        const isMatch = this.isRelatedObservation(cbObs, origObs);
        if (isMatch) {
          await this.observationRepo.update(origObs.id, {
            captureMethod: 'callback' as const,
            notes: `${origObs.notes || ''}\n[CALLBACK ${callbackProject.callbackReason}]: ${cbObs.notes || 'Issue identified during callback'}`.trim(),
          });
          updatedCount++;
        }
      }
    }

    this.activity.logLabsEvent('project.callback_propagated', callbackProjectId, {
      entity_name: callbackProject.name,
      project_id: callbackProjectId,
      linked_project_id: originalProjectId,
      updated_observations: updatedCount,
    }).catch((err) => console.error('Failed to log project.callback_propagated:', err));

    return updatedCount;
  }

  /**
   * Get callback projects for an original project
   */
  async getCallbacksForProject(originalProjectId: string): Promise<Project[]> {
    return this.storage.query<Project>(
      StoreNames.PROJECTS,
      (p) => p.integrationProjectType === 'callback' && p.linkedProjectId === originalProjectId
    );
  }

  /**
   * Check if two observations are related (same product/technique/tool/combination)
   */
  private isRelatedObservation(
    callbackObs: { productId?: string; techniqueId?: string; toolMethodId?: string; knowledgeType: string },
    originalObs: { productId?: string; techniqueId?: string; toolMethodId?: string; knowledgeType: string }
  ): boolean {
    // Must be same knowledge type
    if (callbackObs.knowledgeType !== originalObs.knowledgeType) return false;

    // Match on catalog references
    if (callbackObs.productId && callbackObs.productId === originalObs.productId) return true;
    if (callbackObs.techniqueId && callbackObs.techniqueId === originalObs.techniqueId) return true;
    if (callbackObs.toolMethodId && callbackObs.toolMethodId === originalObs.toolMethodId) return true;

    return false;
  }
}
