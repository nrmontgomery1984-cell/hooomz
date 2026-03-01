/**
 * Customer V2 Repository
 * Platform-level customer records stored in customers_v2 IndexedDB store.
 * Coexists with the legacy `customers` store — does NOT modify it.
 */

import type { CustomerRecord, CustomerStatus } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class CustomerV2Repository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CUSTOMERS_V2;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerRecord> {
    const now = new Date().toISOString();
    const record: CustomerRecord = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await this.storage.set(this.storeName, record.id, record);
    await this.syncQueue.queueCreate(this.storeName, record.id, record);
    return record;
  }

  async findById(id: string): Promise<CustomerRecord | null> {
    return this.storage.get<CustomerRecord>(this.storeName, id);
  }

  async findAll(): Promise<CustomerRecord[]> {
    return this.storage.getAll<CustomerRecord>(this.storeName);
  }

  async findByStatus(status: CustomerStatus): Promise<CustomerRecord[]> {
    return this.storage.query<CustomerRecord>(this.storeName, (c) => c.status === status);
  }

  async search(query: string): Promise<CustomerRecord[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.findAll();
    return this.storage.query<CustomerRecord>(this.storeName, (c) =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.propertyAddress.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }

  async update(id: string, data: Partial<Omit<CustomerRecord, 'id' | 'createdAt'>>): Promise<CustomerRecord | null> {
    const existing = await this.storage.get<CustomerRecord>(this.storeName, id);
    if (!existing) return null;

    const updated: CustomerRecord = {
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

  async addJobToCustomer(customerId: string, jobId: string): Promise<CustomerRecord | null> {
    const existing = await this.storage.get<CustomerRecord>(this.storeName, customerId);
    if (!existing) return null;

    if (existing.jobIds.includes(jobId)) return existing;

    return this.update(customerId, {
      jobIds: [...existing.jobIds, jobId],
    });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<CustomerRecord>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
