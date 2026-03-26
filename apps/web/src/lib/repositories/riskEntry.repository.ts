/**
 * Risk Entry Repository
 * IndexedDB storage for risk register entries.
 * Write pattern: resolve on transaction.oncomplete (via storage.set).
 */

import type { RiskEntry, RiskTrade, RiskSeverity, RiskStatus, RiskSource } from '../types/riskEntry';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class RiskEntryRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.RISK_ENTRIES;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `RSK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: Omit<RiskEntry, 'id' | 'metadata'>): Promise<RiskEntry> {
    const ts = this.now();
    const record: RiskEntry = {
      ...data,
      id: this.generateId(),
      metadata: { createdAt: ts, updatedAt: ts, version: 1 },
    };
    await this.storage.set(this.storeName, record.id, record);
    return record;
  }

  async findById(id: string): Promise<RiskEntry | null> {
    return this.storage.get<RiskEntry>(this.storeName, id);
  }

  async findAll(): Promise<RiskEntry[]> {
    return this.storage.getAll<RiskEntry>(this.storeName);
  }

  async update(id: string, changes: Partial<Omit<RiskEntry, 'id'>>): Promise<RiskEntry | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: RiskEntry = {
      ...existing,
      ...changes,
      id: existing.id,
      metadata: {
        ...existing.metadata,
        updatedAt: this.now(),
        version: existing.metadata.version + 1,
      },
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }

  async findByTrade(trade: RiskTrade): Promise<RiskEntry[]> {
    return this.storage.query<RiskEntry>(
      this.storeName,
      (entry) => entry.trade === trade,
    );
  }

  async findBySeverity(severity: RiskSeverity): Promise<RiskEntry[]> {
    return this.storage.query<RiskEntry>(
      this.storeName,
      (entry) => entry.severity === severity,
    );
  }

  async findByStatus(status: RiskStatus): Promise<RiskEntry[]> {
    return this.storage.query<RiskEntry>(
      this.storeName,
      (entry) => entry.status === status,
    );
  }

  async findByLinkedSop(sopId: string): Promise<RiskEntry[]> {
    return this.storage.query<RiskEntry>(
      this.storeName,
      (entry) => entry.linkedSopId === sopId,
    );
  }

  async findBySource(source: RiskSource): Promise<RiskEntry[]> {
    return this.storage.query<RiskEntry>(
      this.storeName,
      (entry) => entry.source === source,
    );
  }
}
