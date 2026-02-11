/**
 * Confidence Event Repository
 * IndexedDB storage for confidence score change events (Phase 4)
 */

import type { ConfidenceEvent } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class ConfidenceEventRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CONFIDENCE_EVENTS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `cevt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  async create(data: Omit<ConfidenceEvent, 'id' | 'metadata'>): Promise<ConfidenceEvent> {
    const event: ConfidenceEvent = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, event.id, event);
    await this.syncQueue.queueCreate(this.storeName, event.id, event);
    return event;
  }

  async findById(id: string): Promise<ConfidenceEvent | null> {
    return this.storage.get<ConfidenceEvent>(this.storeName, id);
  }

  async findAll(): Promise<ConfidenceEvent[]> {
    return this.storage.getAll<ConfidenceEvent>(this.storeName);
  }

  async findByKnowledgeItem(knowledgeItemId: string): Promise<ConfidenceEvent[]> {
    const events = await this.storage.query<ConfidenceEvent>(
      this.storeName,
      (e) => e.knowledgeItemId === knowledgeItemId
    );
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getLatestForItem(knowledgeItemId: string): Promise<ConfidenceEvent | null> {
    const events = await this.findByKnowledgeItem(knowledgeItemId);
    return events[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<ConfidenceEvent>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
