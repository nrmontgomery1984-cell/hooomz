/**
 * Knowledge Item Repository
 * IndexedDB storage for knowledge items (Phase 4)
 */

import type { KnowledgeItem } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class KnowledgeItemRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.KNOWLEDGE_ITEMS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `ki_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<KnowledgeItem, 'id' | 'metadata'>): Promise<KnowledgeItem> {
    const item: KnowledgeItem = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, item.id, item);
    await this.syncQueue.queueCreate(this.storeName, item.id, item);
    return item;
  }

  async findById(id: string): Promise<KnowledgeItem | null> {
    return this.storage.get<KnowledgeItem>(this.storeName, id);
  }

  async findAll(): Promise<KnowledgeItem[]> {
    return this.storage.getAll<KnowledgeItem>(this.storeName);
  }

  async findByKnowledgeType(knowledgeType: string): Promise<KnowledgeItem[]> {
    return this.storage.query<KnowledgeItem>(this.storeName, (i) => i.knowledgeType === knowledgeType);
  }

  async findByStatus(status: string): Promise<KnowledgeItem[]> {
    return this.storage.query<KnowledgeItem>(this.storeName, (i) => i.status === status);
  }

  async findPublished(): Promise<KnowledgeItem[]> {
    return this.storage.query<KnowledgeItem>(this.storeName, (i) => i.status === 'published');
  }

  async findLowConfidence(threshold: number = 50): Promise<KnowledgeItem[]> {
    return this.storage.query<KnowledgeItem>(this.storeName, (i) => i.confidenceScore < threshold);
  }

  async findNeedingReview(): Promise<KnowledgeItem[]> {
    const now = new Date().toISOString();
    return this.storage.query<KnowledgeItem>(this.storeName, (i) =>
      i.status === 'under_review' || (i.nextReviewDate !== undefined && i.nextReviewDate <= now)
    );
  }

  async search(query: string): Promise<KnowledgeItem[]> {
    const q = query.toLowerCase();
    return this.storage.query<KnowledgeItem>(this.storeName, (i) =>
      i.title.toLowerCase().includes(q) ||
      i.summary.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      (i.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
    );
  }

  async update(id: string, data: Partial<Omit<KnowledgeItem, 'id' | 'metadata'>>): Promise<KnowledgeItem | null> {
    const existing = await this.storage.get<KnowledgeItem>(this.storeName, id);
    if (!existing) return null;

    const updated: KnowledgeItem = {
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
    const existing = await this.storage.get<KnowledgeItem>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
