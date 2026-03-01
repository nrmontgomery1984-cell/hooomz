/**
 * Payment Repository
 * IndexedDB storage for payment records.
 * Write pattern: resolve on transaction.oncomplete (via storage.set).
 */

import type { PaymentRecord, CreatePaymentInput } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class PaymentRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.PAYMENTS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: CreatePaymentInput): Promise<PaymentRecord> {
    const ts = this.now();
    const record: PaymentRecord = {
      ...data,
      id: this.generateId(),
      metadata: { createdAt: ts, updatedAt: ts, version: 1 },
    };
    await this.storage.set(this.storeName, record.id, record);
    return record;
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    return this.storage.get<PaymentRecord>(this.storeName, id);
  }

  async findByInvoiceId(invoiceId: string): Promise<PaymentRecord[]> {
    return this.storage.query<PaymentRecord>(
      this.storeName,
      (p) => p.invoiceId === invoiceId,
    );
  }

  async findByProjectId(projectId: string): Promise<PaymentRecord[]> {
    return this.storage.query<PaymentRecord>(
      this.storeName,
      (p) => p.projectId === projectId,
    );
  }

  async findAll(): Promise<PaymentRecord[]> {
    return this.storage.getAll<PaymentRecord>(this.storeName);
  }

  async sumByInvoiceId(invoiceId: string): Promise<number> {
    const payments = await this.findByInvoiceId(invoiceId);
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
