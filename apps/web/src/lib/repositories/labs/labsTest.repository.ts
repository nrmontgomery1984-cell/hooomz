/**
 * Labs Test Repository
 * IndexedDB storage for Labs test records (PDCA methodology)
 */

import type { LabsTest, LabsTestStatus, LabsTestCategory } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class LabsTestRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LABS_TESTS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `lt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<LabsTest, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<LabsTest> {
    const now = new Date().toISOString();
    const test: LabsTest = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await this.storage.set(this.storeName, test.id, test);
    await this.syncQueue.queueCreate(this.storeName, test.id, test);
    return test;
  }

  /** Create with a specific ID (for seeding) */
  async createWithId(data: LabsTest): Promise<LabsTest> {
    await this.storage.set(this.storeName, data.id, data);
    await this.syncQueue.queueCreate(this.storeName, data.id, data);
    return data;
  }

  async findById(id: string): Promise<LabsTest | null> {
    return this.storage.get<LabsTest>(this.storeName, id);
  }

  async findAll(): Promise<LabsTest[]> {
    return this.storage.getAll<LabsTest>(this.storeName);
  }

  async update(id: string, data: Partial<LabsTest>): Promise<LabsTest | null> {
    const existing = await this.storage.get<LabsTest>(this.storeName, id);
    if (!existing) return null;

    const updated: LabsTest = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<LabsTest>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async findByStatus(status: LabsTestStatus): Promise<LabsTest[]> {
    return this.storage.query<LabsTest>(
      this.storeName,
      (t) => t.status === status
    );
  }

  async findByCategory(category: LabsTestCategory): Promise<LabsTest[]> {
    return this.storage.query<LabsTest>(
      this.storeName,
      (t) => t.category === category
    );
  }

  async findActive(): Promise<LabsTest[]> {
    return this.storage.query<LabsTest>(
      this.storeName,
      (t) => t.status === 'planned' || t.status === 'in-progress' || t.status === 'voting'
    );
  }

  async findByTokenId(tokenId: string): Promise<LabsTest[]> {
    return this.storage.query<LabsTest>(
      this.storeName,
      (t) => t.tokenIds.includes(tokenId)
    );
  }
}
