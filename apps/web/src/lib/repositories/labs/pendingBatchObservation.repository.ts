/**
 * Pending Batch Observation Repository
 * IndexedDB storage for queued observations awaiting batch confirmation (Build 2)
 */

import type { PendingBatchObservation } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';

export class PendingBatchObservationRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.PENDING_BATCH_OBSERVATIONS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `pbo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  async create(data: Omit<PendingBatchObservation, 'id' | 'metadata'>): Promise<PendingBatchObservation> {
    const item: PendingBatchObservation = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, item.id, item);
    return item;
  }

  async findById(id: string): Promise<PendingBatchObservation | null> {
    return this.storage.get<PendingBatchObservation>(this.storeName, id);
  }

  async findAll(): Promise<PendingBatchObservation[]> {
    return this.storage.getAll<PendingBatchObservation>(this.storeName);
  }

  async getByTaskId(taskId: string): Promise<PendingBatchObservation[]> {
    return this.storage.query<PendingBatchObservation>(
      this.storeName,
      (item) => item.taskId === taskId
    );
  }

  async getPendingByTaskId(taskId: string): Promise<PendingBatchObservation[]> {
    return this.storage.query<PendingBatchObservation>(
      this.storeName,
      (item) => item.taskId === taskId && item.status === 'pending'
    );
  }

  async getPendingByCrewMember(crewMemberId: string): Promise<PendingBatchObservation[]> {
    return this.storage.query<PendingBatchObservation>(
      this.storeName,
      (item) => item.crewMemberId === crewMemberId && item.status === 'pending'
    );
  }

  async getPendingCount(taskId?: string): Promise<number> {
    if (taskId) {
      const items = await this.getPendingByTaskId(taskId);
      return items.length;
    }
    const all = await this.storage.query<PendingBatchObservation>(
      this.storeName,
      (item) => item.status === 'pending'
    );
    return all.length;
  }

  async update(id: string, changes: Partial<PendingBatchObservation>): Promise<PendingBatchObservation | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: PendingBatchObservation = {
      ...existing,
      ...changes,
      id: existing.id,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        version: existing.metadata.version + 1,
      },
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async clearProcessed(taskId: string): Promise<number> {
    const items = await this.storage.query<PendingBatchObservation>(
      this.storeName,
      (item) => item.taskId === taskId && item.status !== 'pending'
    );
    for (const item of items) {
      await this.storage.delete(this.storeName, item.id);
    }
    return items.length;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
