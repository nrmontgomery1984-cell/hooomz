/**
 * Standard SOP Repository
 * IndexedDB storage for StandardSOP entities (new SOP system).
 * SOPs are generated from Training Guide modules and stored as pre-built JSON.
 */

import type { StandardSOP } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class StandardSopRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.SOPS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  async getAll(): Promise<StandardSOP[]> {
    // Filter to only new-format SOPs (have `code` field, not old `sopCode`)
    const all = await this.storage.getAll<StandardSOP>(this.storeName);
    return all.filter((s) => 'code' in s && 'sourceRef' in s);
  }

  async getById(id: string): Promise<StandardSOP | null> {
    const record = await this.storage.get<StandardSOP>(this.storeName, id);
    if (!record || !('code' in record && 'sourceRef' in record)) return null;
    return record;
  }

  async getByCode(code: string): Promise<StandardSOP | null> {
    const results = await this.storage.query<StandardSOP>(
      this.storeName,
      (s) => (s as StandardSOP).code === code && 'sourceRef' in s,
    );
    return results[0] ?? null;
  }

  async getByTrade(trade: string): Promise<StandardSOP[]> {
    const all = await this.getAll();
    return all.filter((s) => s.trade === trade);
  }

  async getByTgCode(tgCode: string): Promise<StandardSOP[]> {
    const all = await this.getAll();
    return all.filter((s) => s.sourceRef.tgCode === tgCode);
  }

  async save(sop: StandardSOP): Promise<void> {
    await this.storage.set(this.storeName, sop.id, sop);
  }

  async saveMany(sops: StandardSOP[]): Promise<void> {
    await this.storage.setMany(
      this.storeName,
      sops.map((s) => ({ key: s.id, value: s })),
    );
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
