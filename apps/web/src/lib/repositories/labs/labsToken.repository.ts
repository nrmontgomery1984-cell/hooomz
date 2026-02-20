/**
 * Labs Token Repository
 * IndexedDB storage for dynamic material reference tokens
 */

import type { LabsToken, LabsTokenStatus } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class LabsTokenRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LABS_TOKENS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async create(data: Omit<LabsToken, 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<LabsToken> {
    const now = new Date().toISOString();
    const token: LabsToken = {
      ...data,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await this.storage.set(this.storeName, token.id, token);
    await this.syncQueue.queueCreate(this.storeName, token.id, token);
    return token;
  }

  /** Create with a specific ID (for seeding) */
  async createWithId(data: LabsToken): Promise<LabsToken> {
    await this.storage.set(this.storeName, data.id, data);
    await this.syncQueue.queueCreate(this.storeName, data.id, data);
    return data;
  }

  async findById(id: string): Promise<LabsToken | null> {
    return this.storage.get<LabsToken>(this.storeName, id);
  }

  async findAll(): Promise<LabsToken[]> {
    return this.storage.getAll<LabsToken>(this.storeName);
  }

  async update(id: string, data: Partial<LabsToken>): Promise<LabsToken | null> {
    const existing = await this.storage.get<LabsToken>(this.storeName, id);
    if (!existing) return null;

    const updated: LabsToken = {
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
    const existing = await this.storage.get<LabsToken>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async findByCategory(category: string): Promise<LabsToken[]> {
    return this.storage.query<LabsToken>(
      this.storeName,
      (t) => t.category === category
    );
  }

  async findByStatus(status: LabsTokenStatus): Promise<LabsToken[]> {
    return this.storage.query<LabsToken>(
      this.storeName,
      (t) => t.status === status
    );
  }

  async findValidated(): Promise<LabsToken[]> {
    return this.findByStatus('validated');
  }

  async findByContext(context: string): Promise<LabsToken[]> {
    return this.storage.query<LabsToken>(
      this.storeName,
      (t) => t.context === context
    );
  }
}
