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

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<DeployedTask>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
