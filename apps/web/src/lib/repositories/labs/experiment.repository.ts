/**
 * Experiment Repository
 * IndexedDB storage for active experiments (Phase 3)
 */

import type { Experiment } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class ExperimentRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.EXPERIMENTS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<Experiment, 'id' | 'metadata'>): Promise<Experiment> {
    const experiment: Experiment = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, experiment.id, experiment);
    await this.syncQueue.queueCreate(this.storeName, experiment.id, experiment);
    return experiment;
  }

  async findById(id: string): Promise<Experiment | null> {
    return this.storage.get<Experiment>(this.storeName, id);
  }

  async findAll(): Promise<Experiment[]> {
    return this.storage.getAll<Experiment>(this.storeName);
  }

  async findByStatus(status: string): Promise<Experiment[]> {
    return this.storage.query<Experiment>(this.storeName, (e) => e.status === status);
  }

  async findActive(): Promise<Experiment[]> {
    return this.storage.query<Experiment>(this.storeName, (e) => e.status === 'active');
  }

  async findByKnowledgeType(knowledgeType: string): Promise<Experiment[]> {
    return this.storage.query<Experiment>(this.storeName, (e) => e.knowledgeType === knowledgeType);
  }

  async update(id: string, data: Partial<Omit<Experiment, 'id' | 'metadata'>>): Promise<Experiment | null> {
    const existing = await this.storage.get<Experiment>(this.storeName, id);
    if (!existing) return null;

    const updated: Experiment = {
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
    const existing = await this.storage.get<Experiment>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
