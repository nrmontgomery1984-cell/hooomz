/**
 * Intake Draft Repository
 * IndexedDB storage for intake wizard drafts.
 * Local-only — no SyncQueue, no activity logging.
 */

import type { IntakeDraft, IntakeDraftStatus } from '../types/intakeDraft.types';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class IntakeDraftRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.INTAKE_DRAFTS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<IntakeDraft, 'id' | 'metadata'>): Promise<IntakeDraft> {
    const draft: IntakeDraft = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, draft.id, draft);
    return draft;
  }

  async findById(id: string): Promise<IntakeDraft | null> {
    return this.storage.get<IntakeDraft>(this.storeName, id);
  }

  async findAll(): Promise<IntakeDraft[]> {
    return this.storage.getAll<IntakeDraft>(this.storeName);
  }

  async findByStatus(status: IntakeDraftStatus): Promise<IntakeDraft[]> {
    return this.storage.query<IntakeDraft>(this.storeName, (d) => d.status === status);
  }

  async findInProgress(): Promise<IntakeDraft[]> {
    const drafts = await this.storage.query<IntakeDraft>(
      this.storeName,
      (d) => d.status === 'in_progress'
    );
    return drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async update(id: string, data: Partial<Omit<IntakeDraft, 'id' | 'metadata'>>): Promise<IntakeDraft | null> {
    const existing = await this.storage.get<IntakeDraft>(this.storeName, id);
    if (!existing) return null;

    const updated: IntakeDraft = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: this.updateMetadata(existing.metadata),
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<IntakeDraft>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }

  async markSubmitted(id: string): Promise<IntakeDraft | null> {
    return this.update(id, { status: 'submitted', updatedAt: new Date().toISOString() });
  }

  /**
   * Cleanup stale drafts:
   * - submitted > 30 days old
   * - in_progress > 90 days old
   */
  async cleanupStale(): Promise<number> {
    const all = await this.findAll();
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const draft of all) {
      const age = (now - new Date(draft.updatedAt).getTime()) / DAY_MS;
      const shouldDelete =
        (draft.status === 'submitted' && age > 30) ||
        (draft.status === 'in_progress' && age > 90);

      if (shouldDelete) {
        await this.storage.delete(this.storeName, draft.id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
