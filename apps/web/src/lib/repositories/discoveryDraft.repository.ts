/**
 * Discovery Draft Repository
 * IndexedDB storage for discovery wizard drafts.
 * Local-only — no SyncQueue, no activity logging.
 * Follows the IntakeDraftRepository pattern.
 */

import type { DiscoveryDraft, DiscoveryDraftStatus } from '../types/discovery.types';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class DiscoveryDraftRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.DISCOVERY_DRAFTS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<DiscoveryDraft, 'id' | 'metadata'>): Promise<DiscoveryDraft> {
    const draft: DiscoveryDraft = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, draft.id, draft);
    return draft;
  }

  async findById(id: string): Promise<DiscoveryDraft | null> {
    return this.storage.get<DiscoveryDraft>(this.storeName, id);
  }

  async findByProjectId(projectId: string): Promise<DiscoveryDraft | null> {
    const drafts = await this.storage.query<DiscoveryDraft>(
      this.storeName,
      (d) => d.projectId === projectId
    );
    // Return most recent draft for this project
    if (drafts.length === 0) return null;
    return drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }

  async findAll(): Promise<DiscoveryDraft[]> {
    return this.storage.getAll<DiscoveryDraft>(this.storeName);
  }

  async findByStatus(status: DiscoveryDraftStatus): Promise<DiscoveryDraft[]> {
    return this.storage.query<DiscoveryDraft>(this.storeName, (d) => d.status === status);
  }

  async update(id: string, data: Partial<Omit<DiscoveryDraft, 'id' | 'metadata'>>): Promise<DiscoveryDraft | null> {
    const existing = await this.storage.get<DiscoveryDraft>(this.storeName, id);
    if (!existing) return null;

    const updated: DiscoveryDraft = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: this.updateMetadata(existing.metadata),
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<DiscoveryDraft>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }

  async markComplete(id: string): Promise<DiscoveryDraft | null> {
    return this.update(id, { status: 'complete', updatedAt: new Date().toISOString() });
  }

  /**
   * Cleanup stale drafts:
   * - complete > 30 days old
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
        (draft.status === 'complete' && age > 30) ||
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
