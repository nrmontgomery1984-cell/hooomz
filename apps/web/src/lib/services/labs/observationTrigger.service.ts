/**
 * Observation Trigger Service (Build 2)
 *
 * Bridge between task/checklist system and Labs observations.
 * When a crew member checks a checklist item:
 *   - on_check → immediate confirm-or-deviate UI
 *   - batch → queued for confirmation at task/shift end
 *   - no observation → passthrough
 */

import type {
  SopChecklistItemTemplate,
  ObservationMode,
  ObservationDraft,
  TriggerResult,
  BatchResult,
  PendingBatchObservation,
  FieldObservation,
  KnowledgeType,
  ConditionAssessment,
} from '@hooomz/shared-contracts';
import type { SopChecklistItemTemplateRepository } from '../../repositories/labs/sopChecklistItemTemplate.repository';
import type { SopRepository } from '../../repositories/labs/sop.repository';
import type { PendingBatchObservationRepository } from '../../repositories/labs/pendingBatchObservation.repository';
import type { FieldObservationService } from './fieldObservation.service';
import type { ObservationLinkingService } from './observationLinking.service';
import type { ActivityService } from '../../repositories/activity.repository';

export class ObservationTriggerService {
  constructor(
    private checklistItemRepo: SopChecklistItemTemplateRepository,
    private sopRepo: SopRepository,
    private pendingBatchRepo: PendingBatchObservationRepository,
    private observationService: FieldObservationService,
    private linkingService: ObservationLinkingService,
    private activity: ActivityService
  ) {}

  /**
   * Handle a checklist item being checked (completed).
   * This is the main entry point — called when crew toggles a step ON.
   */
  async handleChecklistItemComplete(
    checklistItemId: string,
    taskId: string,
    sopId: string,
    projectId: string,
    crewMemberId: string
  ): Promise<TriggerResult> {
    // Look up the template to see if it generates an observation
    const template = await this.checklistItemRepo.findById(checklistItemId);
    if (!template || !template.generatesObservation) {
      return { action: 'no_observation' };
    }

    // Get the SOP for observation mode
    const sop = await this.sopRepo.findById(sopId);
    const mode: ObservationMode = sop?.defaultObservationMode ?? 'standard';

    // Build the pre-filled draft
    const draft = this.buildDraftFromTemplate(template, mode);

    if (template.triggerTiming === 'on_check') {
      // Immediate: return draft for confirm-or-deviate UI
      return { action: 'immediate_confirm', draft };
    }

    // Batch: queue for later confirmation
    const pending = await this.pendingBatchRepo.create({
      taskId,
      sopId,
      checklistItemId: template.id,
      crewMemberId,
      projectId,
      draft,
      status: 'pending',
      queuedAt: new Date().toISOString(),
      processedAt: null,
    });

    return { action: 'queued_batch', pendingBatchId: pending.id };
  }

  /**
   * Get all pending batch items for a task
   */
  async getBatchQueue(taskId: string): Promise<PendingBatchObservation[]> {
    return this.pendingBatchRepo.getPendingByTaskId(taskId);
  }

  /**
   * Get pending batch count (for badge display)
   */
  async getPendingBatchCount(taskId?: string): Promise<number> {
    return this.pendingBatchRepo.getPendingCount(taskId);
  }

  /**
   * Confirm an observation (from either immediate or batch flow).
   * Creates the actual FieldObservation and runs auto-linking.
   */
  async confirmObservation(params: {
    draft: ObservationDraft;
    taskId: string;
    projectId: string;
    crewMemberId: string;
    sopVersionId?: string;
    deviated?: boolean;
    deviationFields?: string[];
    deviationReason?: string;
    notes?: string;
    photoIds?: string[];
    conditionAssessment?: ConditionAssessment;
  }): Promise<FieldObservation> {
    const observation = await this.observationService.create({
      projectId: params.projectId,
      taskId: params.taskId,
      knowledgeType: params.draft.knowledgeType,
      productId: params.draft.productId ?? undefined,
      techniqueId: params.draft.techniqueId ?? undefined,
      toolMethodId: params.draft.toolMethodId ?? undefined,
      crewMemberId: params.crewMemberId,
      captureMethod: 'automatic',
      sopVersionId: params.sopVersionId,
      notes: params.notes ?? params.draft.notes ?? undefined,
      photoIds: params.photoIds ?? (params.draft.photoIds.length > 0 ? params.draft.photoIds : undefined),
      deviated: params.deviated ?? false,
      deviationFields: params.deviationFields,
      deviationReason: params.deviationReason,
    });

    // Run auto-linking in background
    this.linkingService.linkObservation(observation).catch(() =>
      console.error('Failed to auto-link observation')
    );

    // Log appropriate event
    const eventType = params.deviated ? 'labs.observation_deviated' : 'labs.observation_confirmed';
    this.activity.logLabsEvent(eventType, observation.id, {
      entity_name: `${observation.knowledgeType} observation`,
      project_id: params.projectId,
      knowledge_type: observation.knowledgeType,
      deviated: params.deviated,
      deviation_fields: params.deviationFields,
    }).catch((err) => console.error(`Failed to log ${eventType}:`, err));

    return observation;
  }

  /**
   * Confirm a specific batch item, optionally with overrides
   */
  async confirmBatchItem(
    pendingBatchId: string,
    overrides?: {
      deviated?: boolean;
      deviationFields?: string[];
      deviationReason?: string;
      notes?: string;
      photoIds?: string[];
      conditionAssessment?: ConditionAssessment;
    }
  ): Promise<FieldObservation> {
    const pending = await this.pendingBatchRepo.findById(pendingBatchId);
    if (!pending) throw new Error(`Pending batch item not found: ${pendingBatchId}`);
    if (pending.status !== 'pending') throw new Error(`Batch item already processed: ${pendingBatchId}`);

    // Create the observation
    const observation = await this.confirmObservation({
      draft: pending.draft,
      taskId: pending.taskId,
      projectId: pending.projectId,
      crewMemberId: pending.crewMemberId,
      deviated: overrides?.deviated,
      deviationFields: overrides?.deviationFields,
      deviationReason: overrides?.deviationReason,
      notes: overrides?.notes,
      photoIds: overrides?.photoIds,
      conditionAssessment: overrides?.conditionAssessment,
    });

    // Mark as confirmed
    await this.pendingBatchRepo.update(pendingBatchId, {
      status: 'confirmed',
      processedAt: new Date().toISOString(),
    });

    return observation;
  }

  /**
   * Skip a batch item (crew decides not to create an observation)
   */
  async skipBatchItem(pendingBatchId: string): Promise<void> {
    const pending = await this.pendingBatchRepo.findById(pendingBatchId);
    if (!pending) throw new Error(`Pending batch item not found: ${pendingBatchId}`);

    await this.pendingBatchRepo.update(pendingBatchId, {
      status: 'skipped',
      processedAt: new Date().toISOString(),
    });
  }

  /**
   * Process entire batch — confirm all remaining pending items with defaults
   */
  async confirmAllBatch(taskId: string): Promise<BatchResult> {
    const pending = await this.pendingBatchRepo.getPendingByTaskId(taskId);
    const result: BatchResult = {
      totalItems: pending.length,
      confirmed: 0,
      skipped: 0,
      observationsCreated: [],
    };

    for (const item of pending) {
      const observation = await this.confirmBatchItem(item.id);
      result.confirmed++;
      result.observationsCreated.push(observation.id);
    }

    this.activity.logLabsEvent('labs.batch_processed', taskId, {
      entity_name: `Batch: ${result.confirmed} confirmed, ${result.skipped} skipped`,
      project_id: pending[0]?.projectId,
      total_items: result.totalItems,
      confirmed: result.confirmed,
      skipped: result.skipped,
    }).catch((err) => console.error('Failed to log labs.batch_processed:', err));

    return result;
  }

  /**
   * Clear processed (non-pending) batch items for a task
   */
  async clearProcessedBatch(taskId: string): Promise<number> {
    return this.pendingBatchRepo.clearProcessed(taskId);
  }

  /**
   * Build a pre-filled observation draft from a checklist item template.
   * Mode determines which fields are required vs optional.
   */
  private buildDraftFromTemplate(
    template: SopChecklistItemTemplate,
    mode: ObservationMode
  ): ObservationDraft {
    return {
      knowledgeType: template.observationKnowledgeType ?? ('procedure' as KnowledgeType),
      productId: template.defaultProductId,
      techniqueId: template.defaultTechniqueId,
      toolMethodId: template.defaultToolId,
      notes: null,
      photoIds: [],
      conditionAssessment: null,
      // Mode-dependent requirements
      requiresPhoto: mode === 'detailed' || template.requiresPhoto,
      requiresNotes: mode === 'detailed',
      requiresCondition: mode === 'detailed',
    };
  }
}
