/**
 * Knowledge Challenge Repository
 * IndexedDB storage for challenges to knowledge items (Phase 4)
 */

import type { KnowledgeChallenge } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class KnowledgeChallengeRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.KNOWLEDGE_CHALLENGES;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `kchal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<KnowledgeChallenge, 'id' | 'metadata'>): Promise<KnowledgeChallenge> {
    const challenge: KnowledgeChallenge = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, challenge.id, challenge);
    await this.syncQueue.queueCreate(this.storeName, challenge.id, challenge);
    return challenge;
  }

  async findById(id: string): Promise<KnowledgeChallenge | null> {
    return this.storage.get<KnowledgeChallenge>(this.storeName, id);
  }

  async findAll(): Promise<KnowledgeChallenge[]> {
    return this.storage.getAll<KnowledgeChallenge>(this.storeName);
  }

  async findByKnowledgeItem(knowledgeItemId: string): Promise<KnowledgeChallenge[]> {
    return this.storage.query<KnowledgeChallenge>(this.storeName, (c) => c.knowledgeItemId === knowledgeItemId);
  }

  async findByStatus(status: string): Promise<KnowledgeChallenge[]> {
    return this.storage.query<KnowledgeChallenge>(this.storeName, (c) => c.status === status);
  }

  async findPending(): Promise<KnowledgeChallenge[]> {
    return this.storage.query<KnowledgeChallenge>(this.storeName, (c) =>
      c.status === 'pending' || c.status === 'under_review'
    );
  }

  async findActiveForItem(knowledgeItemId: string): Promise<KnowledgeChallenge[]> {
    return this.storage.query<KnowledgeChallenge>(this.storeName, (c) =>
      c.knowledgeItemId === knowledgeItemId &&
      (c.status === 'pending' || c.status === 'under_review')
    );
  }

  async update(id: string, data: Partial<Omit<KnowledgeChallenge, 'id' | 'metadata'>>): Promise<KnowledgeChallenge | null> {
    const existing = await this.storage.get<KnowledgeChallenge>(this.storeName, id);
    if (!existing) return null;

    const updated: KnowledgeChallenge = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: this.updateMetadata(existing.metadata),
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<KnowledgeChallenge>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
