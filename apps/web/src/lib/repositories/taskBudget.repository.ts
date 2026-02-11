/**
 * Task Budget Repository
 * IndexedDB storage for estimate → budget conversion records (Build 3c)
 */

import type { TaskBudget } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class TaskBudgetRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.TASK_BUDGETS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `tb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<TaskBudget, 'id' | 'metadata'>): Promise<TaskBudget> {
    const budget: TaskBudget = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, budget.id, budget);
    await this.syncQueue.queueCreate(this.storeName, budget.id, budget);
    return budget;
  }

  async findById(id: string): Promise<TaskBudget | null> {
    return this.storage.get<TaskBudget>(this.storeName, id);
  }

  async findAll(): Promise<TaskBudget[]> {
    return this.storage.getAll<TaskBudget>(this.storeName);
  }

  async findByTask(taskId: string): Promise<TaskBudget | null> {
    const results = await this.storage.query<TaskBudget>(
      this.storeName,
      (b) => b.taskId === taskId
    );
    return results[0] || null;
  }

  async findByProject(projectId: string): Promise<TaskBudget[]> {
    return this.storage.query<TaskBudget>(
      this.storeName,
      (b) => b.projectId === projectId
    );
  }

  async findByBlueprint(blueprintId: string): Promise<TaskBudget[]> {
    return this.storage.query<TaskBudget>(
      this.storeName,
      (b) => b.blueprintId === blueprintId
    );
  }

  async findOverBudget(): Promise<TaskBudget[]> {
    return this.storage.query<TaskBudget>(
      this.storeName,
      (b) => b.status === 'over_budget'
    );
  }

  async update(id: string, data: Partial<Omit<TaskBudget, 'id' | 'metadata'>>): Promise<TaskBudget | null> {
    const existing = await this.storage.get<TaskBudget>(this.storeName, id);
    if (!existing) return null;

    const updated: TaskBudget = {
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
    const existing = await this.storage.get<TaskBudget>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
