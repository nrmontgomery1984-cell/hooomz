/**
 * Labs Technique Repository
 * IndexedDB storage for technique catalog items
 */

import type { LabsTechnique } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class LabsTechniqueRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LABS_TECHNIQUES;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `ltech_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<LabsTechnique, 'id' | 'metadata'>): Promise<LabsTechnique> {
    const technique: LabsTechnique = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, technique.id, technique);
    await this.syncQueue.queueCreate(this.storeName, technique.id, technique);
    return technique;
  }

  async findById(id: string): Promise<LabsTechnique | null> {
    return this.storage.get<LabsTechnique>(this.storeName, id);
  }

  async findAll(): Promise<LabsTechnique[]> {
    return this.storage.getAll<LabsTechnique>(this.storeName);
  }

  async findByCategory(category: string): Promise<LabsTechnique[]> {
    return this.storage.query<LabsTechnique>(this.storeName, (t) => t.category === category);
  }

  async search(query: string): Promise<LabsTechnique[]> {
    const q = query.toLowerCase();
    return this.storage.query<LabsTechnique>(this.storeName, (t) =>
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false)
    );
  }

  async findActive(): Promise<LabsTechnique[]> {
    return this.storage.query<LabsTechnique>(this.storeName, (t) => t.isActive);
  }

  async findBySopId(sopId: string): Promise<LabsTechnique[]> {
    return this.storage.query<LabsTechnique>(this.storeName, (t) =>
      t.sopIds?.includes(sopId) ?? false
    );
  }

  async update(id: string, data: Partial<Omit<LabsTechnique, 'id' | 'metadata'>>): Promise<LabsTechnique | null> {
    const existing = await this.storage.get<LabsTechnique>(this.storeName, id);
    if (!existing) return null;

    const updated: LabsTechnique = {
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
    const existing = await this.storage.get<LabsTechnique>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
