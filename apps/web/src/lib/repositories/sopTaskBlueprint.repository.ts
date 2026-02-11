/**
 * SOP Task Blueprint Repository
 * IndexedDB storage for task blueprints (Build 3b: Task Instance Pipeline)
 */

import type { SopTaskBlueprint, BlueprintStatus } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class SopTaskBlueprintRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.SOP_TASK_BLUEPRINTS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `stb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<SopTaskBlueprint, 'id' | 'createdAt' | 'updatedAt'>): Promise<SopTaskBlueprint> {
    const now = new Date().toISOString();
    const blueprint: SopTaskBlueprint = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await this.storage.set(this.storeName, blueprint.id, blueprint);
    await this.syncQueue.queueCreate(this.storeName, blueprint.id, blueprint);
    return blueprint;
  }

  async findById(id: string): Promise<SopTaskBlueprint | null> {
    return this.storage.get<SopTaskBlueprint>(this.storeName, id);
  }

  async findAll(): Promise<SopTaskBlueprint[]> {
    return this.storage.getAll<SopTaskBlueprint>(this.storeName);
  }

  async findByProject(projectId: string): Promise<SopTaskBlueprint[]> {
    return this.storage.query<SopTaskBlueprint>(
      this.storeName,
      (b) => b.projectId === projectId
    );
  }

  async findByProjectAndStatus(projectId: string, status: BlueprintStatus): Promise<SopTaskBlueprint[]> {
    return this.storage.query<SopTaskBlueprint>(
      this.storeName,
      (b) => b.projectId === projectId && b.status === status
    );
  }

  async findBySopCode(sopCode: string): Promise<SopTaskBlueprint[]> {
    return this.storage.query<SopTaskBlueprint>(
      this.storeName,
      (b) => b.sopCode === sopCode
    );
  }

  async findByWorkSource(workSource: string, workSourceId: string): Promise<SopTaskBlueprint[]> {
    return this.storage.query<SopTaskBlueprint>(
      this.storeName,
      (b) => b.workSource === workSource && b.workSourceId === workSourceId
    );
  }

  async update(id: string, data: Partial<Omit<SopTaskBlueprint, 'id' | 'createdAt'>>): Promise<SopTaskBlueprint | null> {
    const existing = await this.storage.get<SopTaskBlueprint>(this.storeName, id);
    if (!existing) return null;

    const updated: SopTaskBlueprint = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<SopTaskBlueprint>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
