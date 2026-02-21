/**
 * Forecast Snapshot Repository
 * IndexedDB storage for immutable forecast-vs-actual snapshots
 */

import type { ForecastSnapshot } from '../types/forecast.types';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class ForecastSnapshotRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.FORECAST_SNAPSHOTS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `fsnap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<ForecastSnapshot, 'id' | 'createdAt'>): Promise<ForecastSnapshot> {
    const snapshot: ForecastSnapshot = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    await this.storage.set(this.storeName, snapshot.id, snapshot);
    return snapshot;
  }

  async findById(id: string): Promise<ForecastSnapshot | null> {
    return this.storage.get<ForecastSnapshot>(this.storeName, id);
  }

  async findAll(): Promise<ForecastSnapshot[]> {
    return this.storage.getAll<ForecastSnapshot>(this.storeName);
  }

  async findByConfig(configId: string): Promise<ForecastSnapshot[]> {
    return this.storage.query<ForecastSnapshot>(
      this.storeName,
      (s) => s.configId === configId
    );
  }

  async findByPeriod(periodLabel: string): Promise<ForecastSnapshot[]> {
    return this.storage.query<ForecastSnapshot>(
      this.storeName,
      (s) => s.periodLabel === periodLabel
    );
  }
}
