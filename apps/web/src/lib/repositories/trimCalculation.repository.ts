/**
 * TrimCalculationRepository — stores per-room trim cut list results.
 * One record per room (upsert on save).
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { TrimCalculation } from '../types/trim.types';

export class TrimCalculationRepository {
  private storage: StorageAdapter;
  private store = StoreNames.TRIM_CALCULATIONS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async findById(id: string): Promise<TrimCalculation | null> {
    return this.storage.get<TrimCalculation>(this.store, id);
  }

  async findByRoom(roomId: string): Promise<TrimCalculation | null> {
    const all = await this.storage.query<TrimCalculation>(this.store, (item) => item.roomId === roomId);
    return all[0] ?? null;
  }

  async findByProject(projectId: string): Promise<TrimCalculation[]> {
    return this.storage.query<TrimCalculation>(this.store, (item) => item.projectId === projectId);
  }

  async upsertForRoom(data: Omit<TrimCalculation, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrimCalculation> {
    const existing = await this.findByRoom(data.roomId);
    const ts = this.now();
    const record: TrimCalculation = {
      ...data,
      id: existing?.id ?? `trim-${data.roomId}`,
      createdAt: existing?.createdAt ?? ts,
      updatedAt: ts,
    };
    await this.storage.set(this.store, record.id, record);
    return record;
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(this.store, id);
  }

  async deleteByRoom(roomId: string): Promise<void> {
    const existing = await this.findByRoom(roomId);
    if (existing) await this.storage.delete(this.store, existing.id);
  }
}
