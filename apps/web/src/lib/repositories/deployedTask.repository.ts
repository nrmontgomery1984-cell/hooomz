/**
 * Deployed Task Repository
 * IndexedDB storage for deployed task sidecar records (Build 3b: Task Instance Pipeline)
 */

import type { DeployedTask } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class DeployedTaskRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.DEPLOYED_TASKS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `dt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<DeployedTask, 'id' | 'createdAt'>): Promise<DeployedTask> {
    const deployed: DeployedTask = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    await this.storage.set(this.storeName, deployed.id, deployed);
    await this.syncQueue.queueCreate(this.storeName, deployed.id, deployed);
    return deployed;
  }

  async findById(id: string): Promise<DeployedTask | null> {
    return this.storage.get<DeployedTask>(this.storeName, id);
  }

  async findAll(): Promise<DeployedTask[]> {
    return this.storage.getAll<DeployedTask>(this.storeName);
  }

  async findByTaskId(taskId: string): Promise<DeployedTask | null> {
    const results = await this.storage.query<DeployedTask>(
      this.storeName,
      (d) => d.taskId === taskId
    );
    return results[0] || null;
  }

  async findByBlueprintId(blueprintId: string): Promise<DeployedTask[]> {
    return this.storage.query<DeployedTask>(
      this.storeName,
      (d) => d.blueprintId === blueprintId
    );
  }

  async findBySopId(sopId: string): Promise<DeployedTask[]> {
    return this.storage.query<DeployedTask>(
      this.storeName,
      (d) => d.sopId === sopId
    );
  }

  async update(id: string, data: Partial<Omit<DeployedTask, 'id' | 'createdAt'>>): Promise<DeployedTask | null> {
    const existing = await this.storage.get<DeployedTask>(this.storeName, id);
    if (!existing) return null;
    const updated: DeployedTask = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async findByProjectBlueprints(blueprintIds: string[]): Promise<DeployedTask[]> {
    if (blueprintIds.length === 0) return [];
    const idSet = new Set(blueprintIds);
    return this.storage.query<DeployedTask>(
      this.storeName,
      (d) => idSet.has(d.blueprintId)
    );
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<DeployedTask>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
