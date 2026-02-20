/**
 * Labs Material Change Repository
 * Append-only audit trail for recommendation changes
 */

import type { LabsMaterialChange } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class LabsMaterialChangeRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LABS_MATERIAL_CHANGES;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `lmc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /** Create a material change record (append-only — never update or delete) */
  async create(data: Omit<LabsMaterialChange, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<LabsMaterialChange> {
    const now = new Date().toISOString();
    const change: LabsMaterialChange = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await this.storage.set(this.storeName, change.id, change);
    await this.syncQueue.queueCreate(this.storeName, change.id, change);
    return change;
  }

  async findAll(): Promise<LabsMaterialChange[]> {
    const results = await this.storage.getAll<LabsMaterialChange>(this.storeName);
    return results.sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  }

  async findById(id: string): Promise<LabsMaterialChange | null> {
    return this.storage.get<LabsMaterialChange>(this.storeName, id);
  }

  async findByTokenId(tokenId: string): Promise<LabsMaterialChange[]> {
    const results = await this.storage.query<LabsMaterialChange>(
      this.storeName,
      (c) => c.tokenId === tokenId
    );
    return results.sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  }

  async findByTestId(testId: string): Promise<LabsMaterialChange[]> {
    return this.storage.query<LabsMaterialChange>(
      this.storeName,
      (c) => c.testId === testId
    );
  }

  async findRecent(limit: number = 5): Promise<LabsMaterialChange[]> {
    const all = await this.findAll();
    return all.slice(0, limit);
  }
}
