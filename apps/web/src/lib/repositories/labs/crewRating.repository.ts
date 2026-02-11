/**
 * Crew Rating Repository
 * IndexedDB storage for crew ratings submitted at job closeout
 */

import type { CrewRating } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class CrewRatingRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CREW_RATINGS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `crat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<CrewRating, 'id' | 'metadata'>): Promise<CrewRating> {
    const rating: CrewRating = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, rating.id, rating);
    await this.syncQueue.queueCreate(this.storeName, rating.id, rating);
    return rating;
  }

  async findById(id: string): Promise<CrewRating | null> {
    return this.storage.get<CrewRating>(this.storeName, id);
  }

  async findAll(): Promise<CrewRating[]> {
    return this.storage.getAll<CrewRating>(this.storeName);
  }

  async findByProject(projectId: string): Promise<CrewRating[]> {
    return this.storage.query<CrewRating>(this.storeName, (r) => r.projectId === projectId);
  }

  async findBySubmitter(submittedBy: string): Promise<CrewRating[]> {
    return this.storage.query<CrewRating>(this.storeName, (r) => r.submittedBy === submittedBy);
  }

  async update(id: string, data: Partial<Omit<CrewRating, 'id' | 'metadata'>>): Promise<CrewRating | null> {
    const existing = await this.storage.get<CrewRating>(this.storeName, id);
    if (!existing) return null;

    const updated: CrewRating = {
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
    const existing = await this.storage.get<CrewRating>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
