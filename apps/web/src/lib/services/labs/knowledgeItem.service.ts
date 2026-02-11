/**
 * Knowledge Item Service — wraps repository with activity logging (Phase 4)
 */

import type { KnowledgeItem, KnowledgeChallenge } from '@hooomz/shared-contracts';
import type { KnowledgeItemRepository, KnowledgeChallengeRepository } from '../../repositories/labs';
import type { NotificationRepository } from '../../repositories/labs';
import type { ActivityService } from '../../repositories/activity.repository';

export class KnowledgeItemService {
  constructor(
    private items: KnowledgeItemRepository,
    private challenges: KnowledgeChallengeRepository,
    private notifications: NotificationRepository,
    private activity: ActivityService
  ) {}

  // Knowledge Items
  async create(data: Omit<KnowledgeItem, 'id' | 'metadata'>): Promise<KnowledgeItem> {
    const item = await this.items.create(data);

    if (item.status === 'published') {
      this.activity.logLabsEvent('labs.knowledge_item_published', item.id, {
        entity_name: item.title,
        knowledge_type: item.knowledgeType,
      }).catch((err) => console.error('Failed to log labs.knowledge_item_published:', err));
    }

    return item;
  }

  async findById(id: string) { return this.items.findById(id); }
  async findAll() { return this.items.findAll(); }
  async findByKnowledgeType(type: string) { return this.items.findByKnowledgeType(type); }
  async findByStatus(status: string) { return this.items.findByStatus(status); }
  async findPublished() { return this.items.findPublished(); }
  async findLowConfidence(threshold?: number) { return this.items.findLowConfidence(threshold); }
  async findNeedingReview() { return this.items.findNeedingReview(); }
  async search(query: string) { return this.items.search(query); }

  async update(id: string, data: Partial<Omit<KnowledgeItem, 'id' | 'metadata'>>) {
    const updated = await this.items.update(id, data);

    if (updated && data.status === 'published') {
      this.activity.logLabsEvent('labs.knowledge_item_published', id, {
        entity_name: updated.title,
        knowledge_type: updated.knowledgeType,
      }).catch((err) => console.error('Failed to log labs.knowledge_item_published:', err));
    }

    return updated;
  }

  async delete(id: string) { return this.items.delete(id); }

  // Challenges
  async fileChallenge(data: Omit<KnowledgeChallenge, 'id' | 'metadata'>): Promise<KnowledgeChallenge> {
    const challenge = await this.challenges.create(data);

    this.activity.logLabsEvent('labs.challenge_filed', challenge.id, {
      entity_name: challenge.reason,
      knowledge_item_id: challenge.knowledgeItemId,
    }).catch((err) => console.error('Failed to log labs.challenge_filed:', err));

    // Notify admin
    await this.notifications.create({
      userId: 'admin',
      type: 'challenge_update',
      title: 'New Knowledge Challenge',
      body: `Challenge filed: ${challenge.reason}`,
      actionUrl: `/labs/knowledge/${challenge.knowledgeItemId}`,
      isRead: false,
      timestamp: new Date().toISOString(),
    });

    return challenge;
  }

  async findChallengeById(id: string) { return this.challenges.findById(id); }
  async findChallengesForItem(knowledgeItemId: string) { return this.challenges.findByKnowledgeItem(knowledgeItemId); }
  async findPendingChallenges() { return this.challenges.findPending(); }

  async resolveChallenge(id: string, data: Partial<Omit<KnowledgeChallenge, 'id' | 'metadata'>>) {
    return this.challenges.update(id, data);
  }
}
