/**
 * Training Record Repository
 * IndexedDB storage for per-crew, per-SOP training progression (Build 3c)
 */

import type { TrainingRecord } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class TrainingRecordRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.TRAINING_RECORDS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `tr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<TrainingRecord, 'id' | 'metadata'>): Promise<TrainingRecord> {
    const record: TrainingRecord = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, record.id, record);
    await this.syncQueue.queueCreate(this.storeName, record.id, record);
    return record;
  }

  async findById(id: string): Promise<TrainingRecord | null> {
    return this.storage.get<TrainingRecord>(this.storeName, id);
  }

  async findAll(): Promise<TrainingRecord[]> {
    return this.storage.getAll<TrainingRecord>(this.storeName);
  }

  async findByCrewMember(crewMemberId: string): Promise<TrainingRecord[]> {
    return this.storage.query<TrainingRecord>(
      this.storeName,
      (r) => r.crewMemberId === crewMemberId
    );
  }

  async findBySop(sopId: string): Promise<TrainingRecord[]> {
    return this.storage.query<TrainingRecord>(
      this.storeName,
      (r) => r.sopId === sopId
    );
  }

  async findByCrewAndSop(crewMemberId: string, sopId: string): Promise<TrainingRecord | null> {
    const results = await this.storage.query<TrainingRecord>(
      this.storeName,
      (r) => r.crewMemberId === crewMemberId && r.sopId === sopId
    );
    return results[0] || null;
  }

  async findByStatus(status: string): Promise<TrainingRecord[]> {
    return this.storage.query<TrainingRecord>(
      this.storeName,
      (r) => r.status === status
    );
  }

  async update(id: string, data: Partial<Omit<TrainingRecord, 'id' | 'metadata'>>): Promise<TrainingRecord | null> {
    const existing = await this.storage.get<TrainingRecord>(this.storeName, id);
    if (!existing) return null;

    const updated: TrainingRecord = {
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
    const existing = await this.storage.get<TrainingRecord>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
