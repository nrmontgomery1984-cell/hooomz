/**
 * SOP Service
 * Manages SOP lifecycle, versioning, and checklist template management.
 * Implements SOP database records for Build 2's checklist→observation trigger logic.
 */

import type { Sop, SopChecklistItemTemplate, ObservationMode } from '@hooomz/shared-contracts';
import type { SopRepository } from '../../repositories/labs/sop.repository';
import type { SopChecklistItemTemplateRepository } from '../../repositories/labs/sopChecklistItemTemplate.repository';
import type { ActivityService } from '../../repositories/activity.repository';

export class SopService {
  constructor(
    private sopRepo: SopRepository,
    private checklistRepo: SopChecklistItemTemplateRepository,
    private activity: ActivityService
  ) {}

  // ============================================================================
  // SOP Lifecycle
  // ============================================================================

  /**
   * Create a new SOP (version 1, isCurrent = true)
   */
  async createSop(data: Omit<Sop, 'id' | 'metadata' | 'version' | 'isCurrent' | 'previousVersionId' | 'supersededDate'>): Promise<Sop> {
    const sop = await this.sopRepo.create({
      ...data,
      version: 1,
      isCurrent: true,
      previousVersionId: null,
      supersededDate: null,
    });

    this.activity.logLabsEvent('labs.sop_created', sop.id, {
      entity_name: `${sop.sopCode} — ${sop.title}`,
      sop_code: sop.sopCode,
      trade_family: sop.tradeFamily,
    }).catch((err) => console.error('Failed to log labs.sop_created:', err));

    return sop;
  }

  /**
   * Create a new version of an existing SOP.
   * 1. Supersedes the current version (isCurrent = false, supersededDate = now)
   * 2. Creates new version with incremented version number
   * 3. Copies checklist items from previous version to new version
   */
  async createNewVersion(
    sopCode: string,
    data: Partial<Omit<Sop, 'id' | 'metadata' | 'sopCode' | 'version' | 'isCurrent' | 'previousVersionId' | 'supersededDate'>>,
    versionNotes: string
  ): Promise<Sop> {
    const current = await this.sopRepo.getCurrentBySopCode(sopCode);
    if (!current) throw new Error(`No current SOP found for code: ${sopCode}`);

    const now = new Date().toISOString();

    // Supersede the current version
    await this.sopRepo.update(current.id, {
      isCurrent: false,
      supersededDate: now,
    });

    // Create the new version
    const newSop = await this.sopRepo.create({
      sopCode: current.sopCode,
      title: data.title ?? current.title,
      description: data.description !== undefined ? data.description : current.description,
      tradeFamily: current.tradeFamily,
      version: current.version + 1,
      versionNotes: versionNotes,
      previousVersionId: current.id,
      isCurrent: true,
      effectiveDate: data.effectiveDate ?? now,
      supersededDate: null,
      defaultObservationMode: data.defaultObservationMode ?? current.defaultObservationMode,
      certificationLevel: data.certificationLevel ?? current.certificationLevel,
      requiredSupervisedCompletions: data.requiredSupervisedCompletions ?? current.requiredSupervisedCompletions,
      reviewQuestionCount: data.reviewQuestionCount ?? current.reviewQuestionCount,
      reviewPassThreshold: data.reviewPassThreshold ?? current.reviewPassThreshold,
      fieldGuideRef: data.fieldGuideRef !== undefined ? data.fieldGuideRef : current.fieldGuideRef,
      status: data.status ?? current.status,
      createdBy: data.createdBy !== undefined ? data.createdBy : current.createdBy,
    });

    // Copy checklist items from previous version
    const previousItems = await this.checklistRepo.getBySopId(current.id);
    for (const item of previousItems) {
      await this.checklistRepo.create({
        sopId: newSop.id,
        stepNumber: item.stepNumber,
        title: item.title,
        description: item.description,
        checklistType: item.checklistType,
        category: item.category,
        isCritical: item.isCritical,
        generatesObservation: item.generatesObservation,
        observationKnowledgeType: item.observationKnowledgeType,
        requiresPhoto: item.requiresPhoto,
        hasTimingFollowup: item.hasTimingFollowup,
        triggerTiming: item.triggerTiming,
        defaultProductId: item.defaultProductId,
        defaultTechniqueId: item.defaultTechniqueId,
        defaultToolId: item.defaultToolId,
      });
    }

    this.activity.logLabsEvent('labs.sop_version_created', newSop.id, {
      entity_name: `${newSop.sopCode} v${newSop.version}`,
      sop_code: newSop.sopCode,
      previous_version_id: current.id,
      version_notes: versionNotes,
    }).catch((err) => console.error('Failed to log labs.sop_version_created:', err));

    return newSop;
  }

  /**
   * Archive an SOP (sets status = 'archived', isCurrent = false)
   */
  async archiveSop(sopId: string): Promise<Sop> {
    const sop = await this.sopRepo.findById(sopId);
    if (!sop) throw new Error(`SOP not found: ${sopId}`);

    const updated = await this.sopRepo.update(sopId, {
      status: 'archived',
      isCurrent: false,
    });
    if (!updated) throw new Error(`Failed to update SOP: ${sopId}`);

    this.activity.logLabsEvent('labs.sop_archived', sopId, {
      entity_name: `${sop.sopCode} — ${sop.title}`,
      sop_code: sop.sopCode,
    }).catch((err) => console.error('Failed to log labs.sop_archived:', err));

    return updated;
  }

  // ============================================================================
  // Checklist Template Management
  // ============================================================================

  /**
   * Add a checklist item at the next step number
   */
  async addChecklistItem(
    sopId: string,
    data: Omit<SopChecklistItemTemplate, 'id' | 'metadata' | 'sopId' | 'stepNumber'>
  ): Promise<SopChecklistItemTemplate> {
    const existing = await this.checklistRepo.getBySopId(sopId);
    const nextStep = existing.length > 0
      ? Math.max(...existing.map((i) => i.stepNumber)) + 1
      : 1;

    return this.checklistRepo.create({
      ...data,
      sopId,
      stepNumber: nextStep,
    });
  }

  /**
   * Insert a checklist item after a specified step number, renumbering subsequent items
   */
  async insertChecklistItem(
    sopId: string,
    data: Omit<SopChecklistItemTemplate, 'id' | 'metadata' | 'sopId' | 'stepNumber'>,
    afterStepNumber: number
  ): Promise<SopChecklistItemTemplate> {
    const existing = await this.checklistRepo.getBySopId(sopId);

    // Renumber items after the insertion point
    const toRenumber = existing.filter((i) => i.stepNumber > afterStepNumber);
    for (const item of toRenumber) {
      await this.checklistRepo.update(item.id, { stepNumber: item.stepNumber + 1 });
    }

    return this.checklistRepo.create({
      ...data,
      sopId,
      stepNumber: afterStepNumber + 1,
    });
  }

  /**
   * Remove a checklist item and renumber remaining items
   */
  async removeChecklistItem(itemId: string): Promise<void> {
    const item = await this.checklistRepo.findById(itemId);
    if (!item) throw new Error(`Checklist item not found: ${itemId}`);

    await this.checklistRepo.delete(itemId);

    // Renumber remaining items
    const remaining = await this.checklistRepo.getBySopId(item.sopId);
    const toRenumber = remaining.filter((i) => i.stepNumber > item.stepNumber);
    for (const i of toRenumber) {
      await this.checklistRepo.update(i.id, { stepNumber: i.stepNumber - 1 });
    }
  }

  /**
   * Update a checklist item
   */
  async updateChecklistItem(
    itemId: string,
    data: Partial<Omit<SopChecklistItemTemplate, 'id' | 'metadata' | 'sopId'>>
  ): Promise<SopChecklistItemTemplate> {
    const updated = await this.checklistRepo.update(itemId, data);
    if (!updated) throw new Error(`Checklist item not found: ${itemId}`);
    return updated;
  }

  // ============================================================================
  // Query Helpers for Build 2
  // ============================================================================

  /**
   * Returns everything Build 2 needs to wire up observation triggers:
   * the SOP, its observation-generating checklist items, and the default mode
   */
  async getObservationConfig(sopId: string): Promise<{
    sop: Sop;
    observationItems: SopChecklistItemTemplate[];
    mode: ObservationMode;
  }> {
    const sop = await this.sopRepo.findById(sopId);
    if (!sop) throw new Error(`SOP not found: ${sopId}`);

    const observationItems = await this.checklistRepo.getObservationGeneratingItems(sopId);

    return {
      sop,
      observationItems,
      mode: sop.defaultObservationMode,
    };
  }

  /**
   * Returns the ordered checklist items for a task's SOP, optionally filtered by type
   */
  async getChecklistForTask(sopId: string, checklistType?: string): Promise<SopChecklistItemTemplate[]> {
    if (checklistType) {
      return this.checklistRepo.getBySopIdAndType(sopId, checklistType);
    }
    return this.checklistRepo.getBySopId(sopId);
  }

  // ============================================================================
  // Pass-through reads
  // ============================================================================

  async findById(id: string) { return this.sopRepo.findById(id); }
  async findAll() { return this.sopRepo.findAll(); }
  async getCurrentBySopCode(sopCode: string) { return this.sopRepo.getCurrentBySopCode(sopCode); }
  async getAllCurrentByTradeFamily(tradeFamily: string) { return this.sopRepo.getAllCurrentByTradeFamily(tradeFamily); }
  async getAllCurrent() { return this.sopRepo.getAllCurrent(); }
  async getVersionHistory(sopCode: string) { return this.sopRepo.getVersionHistory(sopCode); }
  async getByStatus(status: string) { return this.sopRepo.getByStatus(status); }
}
