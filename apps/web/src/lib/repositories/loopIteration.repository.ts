/**
 * Loop Iteration Repository
 * IndexedDB storage for loop iteration instances (Build 3d)
 *
 * A LoopIteration is a SPECIFIC instance of a LoopContext:
 * e.g. "1st Floor" (instance of Floors context), "Kitchen" (instance of Rooms context)
 * Nesting: parent_iteration_id links rooms under floors.
 */

import type { LoopIteration, LoopStatus } from '@hooomz/shared';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class LoopIterationRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LOOP_ITERATIONS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `litr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<LoopIteration, 'id'>): Promise<LoopIteration> {
    const iteration: LoopIteration = {
      ...data,
      id: this.generateId(),
    };
    await this.storage.set(this.storeName, iteration.id, iteration);
    await this.syncQueue.queueCreate(this.storeName, iteration.id, iteration);
    return iteration;
  }

  async findById(id: string): Promise<LoopIteration | null> {
    return this.storage.get<LoopIteration>(this.storeName, id);
  }

  async findAll(): Promise<LoopIteration[]> {
    return this.storage.getAll<LoopIteration>(this.storeName);
  }

  async findByContext(contextId: string): Promise<LoopIteration[]> {
    return this.storage.query<LoopIteration>(this.storeName, (i) => i.context_id === contextId);
  }

  async findByProject(projectId: string): Promise<LoopIteration[]> {
    return this.storage.query<LoopIteration>(this.storeName, (i) => i.project_id === projectId);
  }

  async findByParent(parentIterationId: string): Promise<LoopIteration[]> {
    return this.storage.query<LoopIteration>(
      this.storeName,
      (i) => i.parent_iteration_id === parentIterationId
    );
  }

  async findRootIterations(projectId: string): Promise<LoopIteration[]> {
    return this.storage.query<LoopIteration>(
      this.storeName,
      (i) => i.project_id === projectId && i.parent_iteration_id === null
    );
  }

  async update(id: string, data: Partial<Omit<LoopIteration, 'id'>>): Promise<LoopIteration | null> {
    const existing = await this.storage.get<LoopIteration>(this.storeName, id);
    if (!existing) return null;

    const updated: LoopIteration = {
      ...existing,
      ...data,
      id: existing.id,
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async updateStatus(id: string, status: LoopStatus): Promise<LoopIteration | null> {
    return this.update(id, { computed_status: status });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<LoopIteration>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
