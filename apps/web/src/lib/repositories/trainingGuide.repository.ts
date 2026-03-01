/**
 * Training Guide Repository
 * IndexedDB storage for TrainingGuide entities.
 * TGs are imported as pre-built JSON — IDs and metadata come from the conversion prompt.
 */

import type { TrainingGuide } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class TrainingGuideRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.TRAINING_GUIDES;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  async getAll(): Promise<TrainingGuide[]> {
    return this.storage.getAll<TrainingGuide>(this.storeName);
  }

  async getById(id: string): Promise<TrainingGuide | null> {
    return this.storage.get<TrainingGuide>(this.storeName, id);
  }

  async getByCode(code: string): Promise<TrainingGuide | null> {
    const results = await this.storage.query<TrainingGuide>(
      this.storeName,
      (tg) => tg.code === code,
    );
    return results[0] ?? null;
  }

  async getByTrade(trade: string): Promise<TrainingGuide[]> {
    return this.storage.query<TrainingGuide>(
      this.storeName,
      (tg) => tg.trade === trade,
    );
  }

  async save(tg: TrainingGuide): Promise<void> {
    await this.storage.set(this.storeName, tg.id, tg);
  }

  async saveMany(tgs: TrainingGuide[]): Promise<void> {
    await this.storage.setMany(
      this.storeName,
      tgs.map((tg) => ({ key: tg.id, value: tg })),
    );
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
