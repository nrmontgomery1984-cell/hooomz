/**
 * MillworkConfigRepository — assembly configuration for the trim calculator.
 * Sentinel ID 'default' for company defaults.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { MillworkAssemblyConfig, CreateMillworkAssemblyConfig } from '../types/trim.types';

export class MillworkConfigRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.MILLWORK_ASSEMBLY_CONFIGS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async findById(id: string): Promise<MillworkAssemblyConfig | null> {
    return this.storage.get<MillworkAssemblyConfig>(this.storeName, id);
  }

  async findDefault(): Promise<MillworkAssemblyConfig | null> {
    return this.findById('default');
  }

  async findAll(): Promise<MillworkAssemblyConfig[]> {
    return this.storage.getAll<MillworkAssemblyConfig>(this.storeName);
  }

  async save(id: string, data: CreateMillworkAssemblyConfig): Promise<MillworkAssemblyConfig> {
    const ts = this.now();
    const existing = await this.findById(id);
    const config: MillworkAssemblyConfig = {
      ...data,
      id,
      createdAt: existing?.createdAt ?? ts,
      updatedAt: ts,
    };
    await this.storage.set(this.storeName, id, config);
    return config;
  }

  async update(id: string, changes: Partial<Omit<MillworkAssemblyConfig, 'id' | 'createdAt'>>): Promise<MillworkAssemblyConfig | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: MillworkAssemblyConfig = { ...existing, ...changes, id, updatedAt: this.now() };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
