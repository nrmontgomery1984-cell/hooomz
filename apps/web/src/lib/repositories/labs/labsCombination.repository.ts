/**
 * Labs Combination Repository
 * IndexedDB storage for tracked product+technique+tool combinations
 */

import type { LabsCombination } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class LabsCombinationRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LABS_COMBINATIONS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `lcomb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<LabsCombination, 'id' | 'metadata'>): Promise<LabsCombination> {
    const combination: LabsCombination = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, combination.id, combination);
    await this.syncQueue.queueCreate(this.storeName, combination.id, combination);
    return combination;
  }

  async findById(id: string): Promise<LabsCombination | null> {
    return this.storage.get<LabsCombination>(this.storeName, id);
  }

  async findAll(): Promise<LabsCombination[]> {
    return this.storage.getAll<LabsCombination>(this.storeName);
  }

  async findByComponentId(referenceId: string): Promise<LabsCombination[]> {
    return this.storage.query<LabsCombination>(this.storeName, (c) =>
      c.components.some((comp) => comp.referenceId === referenceId)
    );
  }

  async findByComponentType(type: string): Promise<LabsCombination[]> {
    return this.storage.query<LabsCombination>(this.storeName, (c) =>
      c.components.some((comp) => comp.type === type)
    );
  }

  async incrementObserved(id: string, quality?: number): Promise<LabsCombination | null> {
    const existing = await this.storage.get<LabsCombination>(this.storeName, id);
    if (!existing) return null;

    const newCount = existing.timesObserved + 1;
    let avgQuality = existing.avgQuality;
    if (quality !== undefined) {
      avgQuality = existing.avgQuality
        ? (existing.avgQuality * existing.timesObserved + quality) / newCount
        : quality;
    }

    const updated: LabsCombination = {
      ...existing,
      timesObserved: newCount,
      avgQuality,
      metadata: this.updateMetadata(existing.metadata),
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async update(id: string, data: Partial<Omit<LabsCombination, 'id' | 'metadata'>>): Promise<LabsCombination | null> {
    const existing = await this.storage.get<LabsCombination>(this.storeName, id);
    if (!existing) return null;

    const updated: LabsCombination = {
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
    const existing = await this.storage.get<LabsCombination>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
