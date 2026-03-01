/**
 * Consultation Repository
 * Sales pipeline consultation records stored in consultations IndexedDB store.
 */

import type { ConsultationRecord, ConsultationStatus } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class ConsultationRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CONSULTATIONS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `consult_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<ConsultationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConsultationRecord> {
    const now = new Date().toISOString();
    const record: ConsultationRecord = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await this.storage.set(this.storeName, record.id, record);
    await this.syncQueue.queueCreate(this.storeName, record.id, record);
    return record;
  }

  async findById(id: string): Promise<ConsultationRecord | null> {
    return this.storage.get<ConsultationRecord>(this.storeName, id);
  }

  async findAll(): Promise<ConsultationRecord[]> {
    return this.storage.getAll<ConsultationRecord>(this.storeName);
  }

  async findByStatus(status: ConsultationStatus): Promise<ConsultationRecord[]> {
    return this.storage.query<ConsultationRecord>(this.storeName, (c) => c.status === status);
  }

  async findByCustomer(customerId: string): Promise<ConsultationRecord[]> {
    return this.storage.query<ConsultationRecord>(this.storeName, (c) => c.customerId === customerId);
  }

  async findByProject(projectId: string): Promise<ConsultationRecord | null> {
    const results = await this.storage.query<ConsultationRecord>(
      this.storeName,
      (c) => c.projectId === projectId
    );
    return results[0] ?? null;
  }

  async update(id: string, data: Partial<Omit<ConsultationRecord, 'id' | 'createdAt'>>): Promise<ConsultationRecord | null> {
    const existing = await this.storage.get<ConsultationRecord>(this.storeName, id);
    if (!existing) return null;

    const updated: ConsultationRecord = {
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

  async complete(id: string, completedDate: string): Promise<ConsultationRecord | null> {
    return this.update(id, {
      status: 'completed',
      completedDate,
    });
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<ConsultationRecord>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
