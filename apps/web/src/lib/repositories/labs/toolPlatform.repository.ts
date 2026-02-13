/**
 * Tool Platform Repository
 * IndexedDB storage for cordless platform comparison data
 */

import type { ToolPlatform } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class ToolPlatformRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.TOOL_PLATFORMS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `tp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<ToolPlatform, 'id' | 'metadata'>): Promise<ToolPlatform> {
    const item: ToolPlatform = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, item.id, item);
    await this.syncQueue.queueCreate(this.storeName, item.id, item);
    return item;
  }

  async findById(id: string): Promise<ToolPlatform | null> {
    return this.storage.get<ToolPlatform>(this.storeName, id);
  }

  async findAll(): Promise<ToolPlatform[]> {
    return this.storage.getAll<ToolPlatform>(this.storeName);
  }

  async findByTier(tier: string): Promise<ToolPlatform[]> {
    return this.storage.query<ToolPlatform>(this.storeName, (i) => i.tier === tier);
  }

  async update(id: string, data: Partial<Omit<ToolPlatform, 'id' | 'metadata'>>): Promise<ToolPlatform | null> {
    const existing = await this.storage.get<ToolPlatform>(this.storeName, id);
    if (!existing) return null;

    const updated: ToolPlatform = {
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
    const existing = await this.storage.get<ToolPlatform>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
