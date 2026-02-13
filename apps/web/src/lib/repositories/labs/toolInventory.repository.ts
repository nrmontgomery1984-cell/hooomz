/**
 * Tool Inventory Repository
 * IndexedDB storage for owned/purchasing tool inventory
 */

import type { ToolInventoryItem } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class ToolInventoryRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.TOOL_INVENTORY;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `tinv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<ToolInventoryItem, 'id' | 'metadata'> & { id?: string }): Promise<ToolInventoryItem> {
    const item: ToolInventoryItem = {
      ...data,
      id: data.id || this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, item.id, item);
    await this.syncQueue.queueCreate(this.storeName, item.id, item);
    return item;
  }

  async findById(id: string): Promise<ToolInventoryItem | null> {
    return this.storage.get<ToolInventoryItem>(this.storeName, id);
  }

  async findAll(): Promise<ToolInventoryItem[]> {
    return this.storage.getAll<ToolInventoryItem>(this.storeName);
  }

  async findByStatus(status: string): Promise<ToolInventoryItem[]> {
    return this.storage.query<ToolInventoryItem>(this.storeName, (i) => i.status === status);
  }

  async findByPlatform(platform: string): Promise<ToolInventoryItem[]> {
    return this.storage.query<ToolInventoryItem>(this.storeName, (i) => i.platform === platform);
  }

  async findByCategory(category: string): Promise<ToolInventoryItem[]> {
    return this.storage.query<ToolInventoryItem>(this.storeName, (i) => i.category === category);
  }

  async update(id: string, data: Partial<Omit<ToolInventoryItem, 'id' | 'metadata'>>): Promise<ToolInventoryItem | null> {
    const existing = await this.storage.get<ToolInventoryItem>(this.storeName, id);
    if (!existing) return null;

    const updated: ToolInventoryItem = {
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
    const existing = await this.storage.get<ToolInventoryItem>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
