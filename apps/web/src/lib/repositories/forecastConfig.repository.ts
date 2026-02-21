/**
 * Forecast Config Repository
 * IndexedDB storage for financial forecast configurations
 */

import type { ForecastConfig } from '../types/forecast.types';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class ForecastConfigRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.FORECAST_CONFIGS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `fc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<ForecastConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ForecastConfig> {
    const now = new Date().toISOString();
    const config: ForecastConfig = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    // If this config is active, deactivate all others
    if (config.isActive) {
      await this.deactivateAll();
    }

    await this.storage.set(this.storeName, config.id, config);
    return config;
  }

  async findById(id: string): Promise<ForecastConfig | null> {
    return this.storage.get<ForecastConfig>(this.storeName, id);
  }

  async findAll(): Promise<ForecastConfig[]> {
    return this.storage.getAll<ForecastConfig>(this.storeName);
  }

  async findActive(): Promise<ForecastConfig | null> {
    const all = await this.storage.getAll<ForecastConfig>(this.storeName);
    return all.find((c) => c.isActive) || null;
  }

  async update(id: string, data: Partial<ForecastConfig>): Promise<ForecastConfig | null> {
    const existing = await this.storage.get<ForecastConfig>(this.storeName, id);
    if (!existing) return null;

    // If activating, deactivate others first
    if (data.isActive && !existing.isActive) {
      await this.deactivateAll();
    }

    const updated: ForecastConfig = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<ForecastConfig>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }

  private async deactivateAll(): Promise<void> {
    const all = await this.storage.getAll<ForecastConfig>(this.storeName);
    for (const config of all) {
      if (config.isActive) {
        await this.storage.set(this.storeName, config.id, {
          ...config,
          isActive: false,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
}
