/**
 * SOP Repository
 * IndexedDB storage for Standard Operating Procedure records
 */

import type { Sop } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class SopRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.SOPS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `sop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<Sop, 'id' | 'metadata'>): Promise<Sop> {
    const sop: Sop = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, sop.id, sop);
    await this.syncQueue.queueCreate(this.storeName, sop.id, sop);
    return sop;
  }

  async findById(id: string): Promise<Sop | null> {
    return this.storage.get<Sop>(this.storeName, id);
  }

  async findAll(): Promise<Sop[]> {
    return this.storage.getAll<Sop>(this.storeName);
  }

  async update(id: string, data: Partial<Omit<Sop, 'id' | 'metadata'>>): Promise<Sop | null> {
    const existing = await this.storage.get<Sop>(this.storeName, id);
    if (!existing) return null;

    const updated: Sop = {
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
    const existing = await this.storage.get<Sop>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  /**
   * Get the current version of an SOP by its code (e.g., "FL-02")
   */
  async getCurrentBySopCode(sopCode: string): Promise<Sop | null> {
    const results = await this.storage.query<Sop>(
      this.storeName,
      (s) => s.sopCode === sopCode && s.isCurrent === true
    );
    return results[0] || null;
  }

  /**
   * Get all current SOPs for a trade family (e.g., all current "FL" SOPs)
   */
  async getAllCurrentByTradeFamily(tradeFamily: string): Promise<Sop[]> {
    return this.storage.query<Sop>(
      this.storeName,
      (s) => s.tradeFamily === tradeFamily && s.isCurrent === true
    );
  }

  /**
   * Get all SOPs where isCurrent = true
   */
  async getAllCurrent(): Promise<Sop[]> {
    return this.storage.query<Sop>(
      this.storeName,
      (s) => s.isCurrent === true
    );
  }

  /**
   * Get all versions of an SOP code, ordered by version number descending
   */
  async getVersionHistory(sopCode: string): Promise<Sop[]> {
    const results = await this.storage.query<Sop>(
      this.storeName,
      (s) => s.sopCode === sopCode
    );
    return results.sort((a, b) => b.version - a.version);
  }

  /**
   * Get SOPs by status
   */
  async getByStatus(status: string): Promise<Sop[]> {
    return this.storage.query<Sop>(
      this.storeName,
      (s) => s.status === status
    );
  }
}
