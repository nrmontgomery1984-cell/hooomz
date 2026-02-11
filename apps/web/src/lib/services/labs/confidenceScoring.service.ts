/**
 * Confidence Scoring Service — calculates and updates confidence scores (Phase 4)
 *
 * Algorithm:
 * Base = 50%
 * + 2 pts per field observation (max 30 from observations)
 * + 10 pts per completed experiment (max 40 from experiments)
 * + 3 pts per positive crew rating
 * - 5 pts per negative crew rating
 * - 10 pts per active challenge
 * - 1 pt per month since last supporting data
 * Clamp 0-100%
 */

import type { ConfidenceEvent, ConfidenceEventType } from '@hooomz/shared-contracts';
import type { KnowledgeItemRepository, ConfidenceEventRepository, KnowledgeChallengeRepository } from '../../repositories/labs';
import type { ActivityService } from '../../repositories/activity.repository';

export class ConfidenceScoringService {
  constructor(
    private knowledgeItems: KnowledgeItemRepository,
    private confidenceEvents: ConfidenceEventRepository,
    private challenges: KnowledgeChallengeRepository,
    private activity: ActivityService
  ) {}

  async calculateScore(knowledgeItemId: string): Promise<number> {
    const item = await this.knowledgeItems.findById(knowledgeItemId);
    if (!item) return 0;

    let score = 50; // Base

    // +2 per observation (max 30)
    score += Math.min(item.observationCount * 2, 30);

    // +10 per experiment (max 40)
    score += Math.min(item.experimentCount * 10, 40);

    // Crew agreement rate effect
    if (item.crewAgreementRate !== undefined) {
      const ratingDelta = (item.crewAgreementRate - 0.5) * 20; // -10 to +10
      score += ratingDelta;
    }

    // Active challenges
    const activeChallenges = await this.challenges.findActiveForItem(knowledgeItemId);
    score -= activeChallenges.length * 10;

    // Age decay: -1 per month since last update
    const lastUpdate = new Date(item.lastConfidenceUpdate);
    const monthsSinceUpdate = Math.floor(
      (Date.now() - lastUpdate.getTime()) / (30 * 24 * 60 * 60 * 1000)
    );
    score -= monthsSinceUpdate;

    // Clamp 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  async recordEvent(
    knowledgeItemId: string,
    eventType: ConfidenceEventType,
    change: number,
    sourceId?: string,
    notes?: string
  ): Promise<ConfidenceEvent> {
    const item = await this.knowledgeItems.findById(knowledgeItemId);
    const newScore = await this.calculateScore(knowledgeItemId);

    const event = await this.confidenceEvents.create({
      knowledgeItemId,
      eventType,
      confidenceChange: change,
      newConfidenceScore: newScore,
      sourceId,
      notes,
      timestamp: new Date().toISOString(),
    });

    // Update knowledge item confidence
    if (item) {
      await this.knowledgeItems.update(knowledgeItemId, {
        confidenceScore: newScore,
        lastConfidenceUpdate: new Date().toISOString(),
        status: this.determineStatus(newScore, item.status),
      });

      this.activity.logLabsEvent('labs.confidence_updated', knowledgeItemId, {
        entity_name: item.title,
        knowledge_type: item.knowledgeType,
        new_score: newScore,
        change,
      }).catch((err) => console.error('Failed to log labs.confidence_updated:', err));
    }

    return event;
  }

  private determineStatus(score: number, currentStatus: string): 'draft' | 'published' | 'under_review' | 'deprecated' {
    if (score < 50 && currentStatus === 'published') return 'under_review';
    if (score >= 70 && currentStatus === 'draft') return 'published';
    return currentStatus as 'draft' | 'published' | 'under_review' | 'deprecated';
  }

  async getHistory(knowledgeItemId: string): Promise<ConfidenceEvent[]> {
    return this.confidenceEvents.findByKnowledgeItem(knowledgeItemId);
  }
}
