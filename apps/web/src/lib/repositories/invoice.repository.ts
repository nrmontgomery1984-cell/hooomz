/**
 * Invoice Repository
 * IndexedDB storage for invoice records.
 * Write pattern: resolve on transaction.oncomplete (via storage.set).
 */

import type { InvoiceRecord } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class InvoiceRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.INVOICES;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: Omit<InvoiceRecord, 'id' | 'metadata'>): Promise<InvoiceRecord> {
    const ts = this.now();
    const record: InvoiceRecord = {
      ...data,
      id: this.generateId(),
      metadata: { createdAt: ts, updatedAt: ts, version: 1 },
    };
    await this.storage.set(this.storeName, record.id, record);
    return record;
  }

  async findById(id: string): Promise<InvoiceRecord | null> {
    return this.storage.get<InvoiceRecord>(this.storeName, id);
  }

  async findByProjectId(projectId: string): Promise<InvoiceRecord[]> {
    return this.storage.query<InvoiceRecord>(
      this.storeName,
      (inv) => inv.projectId === projectId,
    );
  }

  async findByCustomerId(customerId: string): Promise<InvoiceRecord[]> {
    return this.storage.query<InvoiceRecord>(
      this.storeName,
      (inv) => inv.customerId === customerId,
    );
  }

  async findByStatus(status: string): Promise<InvoiceRecord[]> {
    return this.storage.query<InvoiceRecord>(
      this.storeName,
      (inv) => inv.status === status,
    );
  }

  async findAll(): Promise<InvoiceRecord[]> {
    return this.storage.getAll<InvoiceRecord>(this.storeName);
  }

  async update(id: string, changes: Partial<Omit<InvoiceRecord, 'id'>>): Promise<InvoiceRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: InvoiceRecord = {
      ...existing,
      ...changes,
      id: existing.id,
      metadata: {
        ...existing.metadata,
        updatedAt: this.now(),
        version: existing.metadata.version + 1,
      },
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
