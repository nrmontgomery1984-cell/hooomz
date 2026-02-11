/**
 * Labs Tool Method Repository
 * IndexedDB storage for tool/method catalog items
 */

import type { LabsToolMethod } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class LabsToolMethodRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LABS_TOOL_METHODS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `ltool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<LabsToolMethod, 'id' | 'metadata'>): Promise<LabsToolMethod> {
    const toolMethod: LabsToolMethod = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, toolMethod.id, toolMethod);
    await this.syncQueue.queueCreate(this.storeName, toolMethod.id, toolMethod);
    return toolMethod;
  }

  async findById(id: string): Promise<LabsToolMethod | null> {
    return this.storage.get<LabsToolMethod>(this.storeName, id);
  }

  async findAll(): Promise<LabsToolMethod[]> {
    return this.storage.getAll<LabsToolMethod>(this.storeName);
  }

  async findByToolType(toolType: string): Promise<LabsToolMethod[]> {
    return this.storage.query<LabsToolMethod>(this.storeName, (t) => t.toolType === toolType);
  }

  async search(query: string): Promise<LabsToolMethod[]> {
    const q = query.toLowerCase();
    return this.storage.query<LabsToolMethod>(this.storeName, (t) =>
      t.name.toLowerCase().includes(q) ||
      t.toolType.toLowerCase().includes(q) ||
      (t.specification?.toLowerCase().includes(q) ?? false) ||
      (t.brand?.toLowerCase().includes(q) ?? false)
    );
  }

  async findActive(): Promise<LabsToolMethod[]> {
    return this.storage.query<LabsToolMethod>(this.storeName, (t) => t.isActive);
  }

  async update(id: string, data: Partial<Omit<LabsToolMethod, 'id' | 'metadata'>>): Promise<LabsToolMethod | null> {
    const existing = await this.storage.get<LabsToolMethod>(this.storeName, id);
    if (!existing) return null;

    const updated: LabsToolMethod = {
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
    const existing = await this.storage.get<LabsToolMethod>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
