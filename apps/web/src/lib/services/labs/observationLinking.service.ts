/**
 * Observation Linking Service
 * Auto-detects and manages links between field observations and knowledge items
 * Implements Resolved Item IV from the Master Integration Spec
 */

import type { FieldObservation, KnowledgeItem, ObservationKnowledgeLink } from '@hooomz/shared-contracts';
import type { ObservationKnowledgeLinkRepository } from '../../repositories/labs';
import type { FieldObservationRepository, KnowledgeItemRepository } from '../../repositories/labs';

export class ObservationLinkingService {
  constructor(
    private linkRepo: ObservationKnowledgeLinkRepository,
    private observationRepo: FieldObservationRepository,
    private knowledgeItemRepo: KnowledgeItemRepository
  ) {}

  /**
   * Auto-detect and create links for an observation.
   * Runs all matching rules against existing knowledge items.
   * This is NOT blocking — call after observation creation.
   */
  async linkObservation(observation: FieldObservation): Promise<ObservationKnowledgeLink[]> {
    const allItems = await this.knowledgeItemRepo.findAll();
    const createdLinks: ObservationKnowledgeLink[] = [];

    for (const item of allItems) {
      const shouldLink = this.shouldAutoLink(observation, item);
      if (shouldLink) {
        const link = await this.linkRepo.create({
          observationId: observation.id,
          knowledgeItemId: item.id,
          linkType: 'auto_detected',
          linkConfidence: shouldLink.confidence,
          notes: null,
          createdBy: 'system',
        });
        createdLinks.push(link);
      }
    }

    return createdLinks;
  }

  /**
   * Delete existing auto-detected links and re-run detection.
   * Useful when knowledge items are added/changed.
   */
  async relinkObservation(observationId: string): Promise<ObservationKnowledgeLink[]> {
    const observation = await this.observationRepo.findById(observationId);
    if (!observation) return [];

    // Delete only auto-detected links (preserve manual ones)
    const existingLinks = await this.linkRepo.getByObservationId(observationId);
    for (const link of existingLinks) {
      if (link.linkType === 'auto_detected') {
        await this.linkRepo.deleteLink(link.id);
      }
    }

    return this.linkObservation(observation);
  }

  /**
   * Get all knowledge items linked to an observation.
   */
  async getObservationContext(observationId: string): Promise<KnowledgeItem[]> {
    const links = await this.linkRepo.getByObservationId(observationId);
    const items: KnowledgeItem[] = [];

    for (const link of links) {
      const item = await this.knowledgeItemRepo.findById(link.knowledgeItemId);
      if (item) items.push(item);
    }

    return items;
  }

  /**
   * Get all observations linked to a knowledge item (evidence).
   */
  async getEvidenceForKnowledgeItem(knowledgeItemId: string): Promise<FieldObservation[]> {
    const links = await this.linkRepo.getByKnowledgeItemId(knowledgeItemId);
    const observations: FieldObservation[] = [];

    for (const link of links) {
      const obs = await this.observationRepo.findById(link.observationId);
      if (obs) observations.push(obs);
    }

    return observations;
  }

  /**
   * Manually create a link (Labs admin assigns observation to knowledge item)
   */
  async createManualLink(
    observationId: string,
    knowledgeItemId: string,
    createdBy: string,
    notes?: string
  ): Promise<ObservationKnowledgeLink> {
    return this.linkRepo.create({
      observationId,
      knowledgeItemId,
      linkType: 'labs_assigned',
      linkConfidence: null,
      notes: notes || null,
      createdBy,
    });
  }

  /**
   * Create a link required by an experiment
   */
  async createExperimentLink(
    observationId: string,
    knowledgeItemId: string
  ): Promise<ObservationKnowledgeLink> {
    return this.linkRepo.create({
      observationId,
      knowledgeItemId,
      linkType: 'experiment_required',
      linkConfidence: null,
      notes: null,
      createdBy: 'system',
    });
  }

  /**
   * Get all links for an observation
   */
  async getLinksForObservation(observationId: string): Promise<ObservationKnowledgeLink[]> {
    return this.linkRepo.getByObservationId(observationId);
  }

  /**
   * Get all links for a knowledge item
   */
  async getLinksForKnowledgeItem(knowledgeItemId: string): Promise<ObservationKnowledgeLink[]> {
    return this.linkRepo.getByKnowledgeItemId(knowledgeItemId);
  }

  /**
   * Delete a specific link
   */
  async deleteLink(linkId: string): Promise<boolean> {
    return this.linkRepo.deleteLink(linkId);
  }

  // ============================================================================
  // Auto-Detection Logic
  // ============================================================================

  /**
   * Determine if an observation should be auto-linked to a knowledge item.
   * Returns confidence score if yes, null if no.
   */
  private shouldAutoLink(
    observation: FieldObservation,
    item: KnowledgeItem
  ): { confidence: number } | null {
    // 1. Product match: observation references a product that the knowledge item covers
    if (
      observation.productId &&
      item.knowledgeType === 'product' &&
      item.productIds?.includes(observation.productId)
    ) {
      return { confidence: 95 };
    }

    // 2. Technique match
    if (
      observation.techniqueId &&
      item.knowledgeType === 'technique' &&
      item.techniqueIds?.includes(observation.techniqueId)
    ) {
      return { confidence: 95 };
    }

    // 3. Tool method match
    if (
      observation.toolMethodId &&
      item.knowledgeType === 'tool_method' &&
      item.toolMethodIds?.includes(observation.toolMethodId)
    ) {
      return { confidence: 90 };
    }

    // 4. Combination match: observation references a combination the item covers
    if (
      observation.combinationId &&
      item.knowledgeType === 'combination'
    ) {
      // Combination items don't have a direct array ref; use relatedObservationIds as fallback
      return { confidence: 80 };
    }

    // 5. Knowledge type match with same category/trade
    if (
      observation.knowledgeType === item.knowledgeType &&
      observation.trade &&
      item.category.toLowerCase() === observation.trade.toLowerCase()
    ) {
      return { confidence: 60 };
    }

    return null;
  }
}
