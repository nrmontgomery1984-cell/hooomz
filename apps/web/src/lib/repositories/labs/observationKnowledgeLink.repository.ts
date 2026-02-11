/**
 * Observation ↔ Knowledge Item Link Repository
 * Many-to-many bridge between field observations and knowledge items
 */

import type { ObservationKnowledgeLink } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class ObservationKnowledgeLinkRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.OBSERVATION_KNOWLEDGE_LINKS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `okl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(
    data: Omit<ObservationKnowledgeLink, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ObservationKnowledgeLink> {
    const now = new Date().toISOString();
    const link: ObservationKnowledgeLink = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await this.storage.set(this.storeName, link.id, link);
    await this.syncQueue.queueCreate(this.storeName, link.id, link);
    return link;
  }

  async findById(id: string): Promise<ObservationKnowledgeLink | null> {
    return this.storage.get<ObservationKnowledgeLink>(this.storeName, id);
  }

  async findAll(): Promise<ObservationKnowledgeLink[]> {
    return this.storage.getAll<ObservationKnowledgeLink>(this.storeName);
  }

  async getByObservationId(observationId: string): Promise<ObservationKnowledgeLink[]> {
    return this.storage.query<ObservationKnowledgeLink>(
      this.storeName,
      (link) => link.observationId === observationId
    );
  }

  async getByKnowledgeItemId(knowledgeItemId: string): Promise<ObservationKnowledgeLink[]> {
    return this.storage.query<ObservationKnowledgeLink>(
      this.storeName,
      (link) => link.knowledgeItemId === knowledgeItemId
    );
  }

  async getAutoDetectedLinks(): Promise<ObservationKnowledgeLink[]> {
    return this.storage.query<ObservationKnowledgeLink>(
      this.storeName,
      (link) => link.linkType === 'auto_detected'
    );
  }

  async deleteLink(id: string): Promise<boolean> {
    const existing = await this.storage.get<ObservationKnowledgeLink>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async deleteLinksByObservation(observationId: string): Promise<number> {
    const links = await this.getByObservationId(observationId);
    for (const link of links) {
      await this.storage.delete(this.storeName, link.id);
      await this.syncQueue.queueDelete(this.storeName, link.id);
    }
    return links.length;
  }

  async deleteLinksByKnowledgeItem(knowledgeItemId: string): Promise<number> {
    const links = await this.getByKnowledgeItemId(knowledgeItemId);
    for (const link of links) {
      await this.storage.delete(this.storeName, link.id);
      await this.syncQueue.queueDelete(this.storeName, link.id);
    }
    return links.length;
  }
}
