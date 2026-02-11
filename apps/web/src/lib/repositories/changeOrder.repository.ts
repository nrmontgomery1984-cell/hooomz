/**
 * Change Order Repository
 * IndexedDB storage for change orders (Agreement B)
 */

import type { ChangeOrder } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class ChangeOrderRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CHANGE_ORDERS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `co_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<ChangeOrder, 'id' | 'metadata'>): Promise<ChangeOrder> {
    const changeOrder: ChangeOrder = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, changeOrder.id, changeOrder);
    await this.syncQueue.queueCreate(this.storeName, changeOrder.id, changeOrder);
    return changeOrder;
  }

  async findById(id: string): Promise<ChangeOrder | null> {
    return this.storage.get<ChangeOrder>(this.storeName, id);
  }

  async findAll(): Promise<ChangeOrder[]> {
    return this.storage.getAll<ChangeOrder>(this.storeName);
  }

  async findByProject(projectId: string): Promise<ChangeOrder[]> {
    return this.storage.query<ChangeOrder>(
      this.storeName,
      (co) => co.projectId === projectId
    );
  }

  async findByStatus(status: string): Promise<ChangeOrder[]> {
    return this.storage.query<ChangeOrder>(
      this.storeName,
      (co) => co.status === status
    );
  }

  async getNextCoNumber(projectId: string): Promise<string> {
    const existing = await this.findByProject(projectId);
    const nextNum = existing.length + 1;
    return `CO-${String(nextNum).padStart(3, '0')}`;
  }

  async update(id: string, data: Partial<Omit<ChangeOrder, 'id' | 'metadata'>>): Promise<ChangeOrder | null> {
    const existing = await this.storage.get<ChangeOrder>(this.storeName, id);
    if (!existing) return null;

    const updated: ChangeOrder = {
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
    const existing = await this.storage.get<ChangeOrder>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
