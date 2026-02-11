/**
 * Field Submission Repository
 * IndexedDB storage for crew-initiated field submissions (Phase 2)
 */

import type { FieldSubmission } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class FieldSubmissionRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.FIELD_SUBMISSIONS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `fsub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<FieldSubmission, 'id' | 'metadata'>): Promise<FieldSubmission> {
    const submission: FieldSubmission = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, submission.id, submission);
    await this.syncQueue.queueCreate(this.storeName, submission.id, submission);
    return submission;
  }

  async findById(id: string): Promise<FieldSubmission | null> {
    return this.storage.get<FieldSubmission>(this.storeName, id);
  }

  async findAll(): Promise<FieldSubmission[]> {
    return this.storage.getAll<FieldSubmission>(this.storeName);
  }

  async findByStatus(status: string): Promise<FieldSubmission[]> {
    return this.storage.query<FieldSubmission>(this.storeName, (s) => s.status === status);
  }

  async findBySubmitter(submittedBy: string): Promise<FieldSubmission[]> {
    return this.storage.query<FieldSubmission>(this.storeName, (s) => s.submittedBy === submittedBy);
  }

  async findPending(): Promise<FieldSubmission[]> {
    return this.storage.query<FieldSubmission>(this.storeName, (s) => s.status === 'submitted');
  }

  async update(id: string, data: Partial<Omit<FieldSubmission, 'id' | 'metadata'>>): Promise<FieldSubmission | null> {
    const existing = await this.storage.get<FieldSubmission>(this.storeName, id);
    if (!existing) return null;

    const updated: FieldSubmission = {
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
    const existing = await this.storage.get<FieldSubmission>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
