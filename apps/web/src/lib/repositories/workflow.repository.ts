/**
 * Workflow Repository
 * IndexedDB storage for workflow records (Labs — construction sequencing)
 */

import type { Workflow } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class WorkflowRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.WORKFLOWS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<Workflow, 'id' | 'metadata'>): Promise<Workflow> {
    const workflow: Workflow = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, workflow.id, workflow);
    await this.syncQueue.queueCreate(this.storeName, workflow.id, workflow);
    return workflow;
  }

  async createWithId(id: string, data: Omit<Workflow, 'id' | 'metadata'>): Promise<Workflow> {
    const workflow: Workflow = {
      ...data,
      id,
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, workflow.id, workflow);
    await this.syncQueue.queueCreate(this.storeName, workflow.id, workflow);
    return workflow;
  }

  async findById(id: string): Promise<Workflow | null> {
    return this.storage.get<Workflow>(this.storeName, id);
  }

  async findAll(): Promise<Workflow[]> {
    return this.storage.getAll<Workflow>(this.storeName);
  }

  async findDefault(): Promise<Workflow | null> {
    const all = await this.findAll();
    return all.find((w) => w.isDefault && w.status === 'active') || null;
  }

  async findActive(): Promise<Workflow[]> {
    const all = await this.findAll();
    return all.filter((w) => w.status === 'active');
  }

  async update(id: string, data: Partial<Omit<Workflow, 'id' | 'metadata'>>): Promise<Workflow | null> {
    const existing = await this.storage.get<Workflow>(this.storeName, id);
    if (!existing) return null;

    const updated: Workflow = {
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
    const existing = await this.storage.get<Workflow>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
