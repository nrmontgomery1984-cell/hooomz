/**
 * Quote Repository
 * Sales pipeline quote/proposal records stored in quotes IndexedDB store.
 */

import type { QuoteRecord, QuoteStatus } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class QuoteRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.QUOTES;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `quote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<QuoteRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuoteRecord> {
    const now = new Date().toISOString();
    const record: QuoteRecord = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await this.storage.set(this.storeName, record.id, record);
    await this.syncQueue.queueCreate(this.storeName, record.id, record);
    return record;
  }

  async findById(id: string): Promise<QuoteRecord | null> {
    return this.storage.get<QuoteRecord>(this.storeName, id);
  }

  async findAll(): Promise<QuoteRecord[]> {
    return this.storage.getAll<QuoteRecord>(this.storeName);
  }

  async findByStatus(status: QuoteStatus): Promise<QuoteRecord[]> {
    return this.storage.query<QuoteRecord>(this.storeName, (q) => q.status === status);
  }

  async findByCustomer(customerId: string): Promise<QuoteRecord[]> {
    return this.storage.query<QuoteRecord>(this.storeName, (q) => q.customerId === customerId);
  }

  async findByProject(projectId: string): Promise<QuoteRecord[]> {
    return this.storage.query<QuoteRecord>(this.storeName, (q) => q.projectId === projectId);
  }

  async update(id: string, data: Partial<Omit<QuoteRecord, 'id' | 'createdAt'>>): Promise<QuoteRecord | null> {
    const existing = await this.storage.get<QuoteRecord>(this.storeName, id);
    if (!existing) return null;

    const updated: QuoteRecord = {
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

  async send(id: string): Promise<QuoteRecord | null> {
    return this.update(id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
    });
  }

  async markViewed(id: string): Promise<QuoteRecord | null> {
    return this.update(id, {
      status: 'viewed',
      viewedAt: new Date().toISOString(),
    });
  }

  async accept(id: string): Promise<QuoteRecord | null> {
    return this.update(id, {
      status: 'accepted',
      respondedAt: new Date().toISOString(),
    });
  }

  async decline(id: string, reason: string): Promise<QuoteRecord | null> {
    return this.update(id, {
      status: 'declined',
      respondedAt: new Date().toISOString(),
      declineReason: reason,
    });
  }

  async expire(id: string): Promise<QuoteRecord | null> {
    return this.update(id, { status: 'expired' });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<QuoteRecord>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
