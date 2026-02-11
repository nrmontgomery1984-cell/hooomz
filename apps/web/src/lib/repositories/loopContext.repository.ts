/**
 * Loop Context Repository
 * IndexedDB storage for loop context definitions (Build 3d)
 *
 * A LoopContext defines a TYPE of repeating structure:
 * e.g. "Floors" (floor type), "Rooms" (location type)
 */

import type { LoopContext, LoopType } from '@hooomz/shared';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class LoopContextRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LOOP_CONTEXTS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `lctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<LoopContext, 'id'>): Promise<LoopContext> {
    const context: LoopContext = {
      ...data,
      id: this.generateId(),
    };
    await this.storage.set(this.storeName, context.id, context);
    await this.syncQueue.queueCreate(this.storeName, context.id, context);
    return context;
  }

  async findById(id: string): Promise<LoopContext | null> {
    return this.storage.get<LoopContext>(this.storeName, id);
  }

  async findAll(): Promise<LoopContext[]> {
    return this.storage.getAll<LoopContext>(this.storeName);
  }

  async findByProject(projectId: string): Promise<LoopContext[]> {
    return this.storage.query<LoopContext>(this.storeName, (c) => c.project_id === projectId);
  }

  async findByProjectAndType(projectId: string, loopType: LoopType): Promise<LoopContext[]> {
    return this.storage.query<LoopContext>(
      this.storeName,
      (c) => c.project_id === projectId && c.loop_type === loopType
    );
  }

  async findByParent(parentContextId: string): Promise<LoopContext[]> {
    return this.storage.query<LoopContext>(
      this.storeName,
      (c) => c.parent_context_id === parentContextId
    );
  }

  async update(id: string, data: Partial<Omit<LoopContext, 'id'>>): Promise<LoopContext | null> {
    const existing = await this.storage.get<LoopContext>(this.storeName, id);
    if (!existing) return null;

    const updated: LoopContext = {
      ...existing,
      ...data,
      id: existing.id,
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<LoopContext>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
