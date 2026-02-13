/**
 * Tool Research Item Repository
 * IndexedDB storage for research items (saws, fastening, PPE, etc.)
 */

import type { ToolResearchItem, ToolResearchCategory } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class ToolResearchItemRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.TOOL_RESEARCH_ITEMS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `tri_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<ToolResearchItem, 'id' | 'metadata'>): Promise<ToolResearchItem> {
    const item: ToolResearchItem = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, item.id, item);
    await this.syncQueue.queueCreate(this.storeName, item.id, item);
    return item;
  }

  async findById(id: string): Promise<ToolResearchItem | null> {
    return this.storage.get<ToolResearchItem>(this.storeName, id);
  }

  async findAll(): Promise<ToolResearchItem[]> {
    return this.storage.getAll<ToolResearchItem>(this.storeName);
  }

  async findByCategory(category: ToolResearchCategory): Promise<ToolResearchItem[]> {
    return this.storage.query<ToolResearchItem>(this.storeName, (i) => i.category === category);
  }

  async findByPriority(priority: string): Promise<ToolResearchItem[]> {
    return this.storage.query<ToolResearchItem>(this.storeName, (i) => i.priority === priority);
  }

  async update(id: string, data: Partial<Omit<ToolResearchItem, 'id' | 'metadata'>>): Promise<ToolResearchItem | null> {
    const existing = await this.storage.get<ToolResearchItem>(this.storeName, id);
    if (!existing) return null;

    const updated: ToolResearchItem = {
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
    const existing = await this.storage.get<ToolResearchItem>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
