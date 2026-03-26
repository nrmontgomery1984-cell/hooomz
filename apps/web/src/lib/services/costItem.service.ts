/**
 * CostItemService — Read/write access to the costItems store.
 *
 * Phase 0: stubs only. Full implementation in Phase 1.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { CostItem, CostItemFilters, CreateCostItem } from '../types/catalogue.types';

export class CostItemService {
  constructor(private storage: StorageAdapter) {}

  async getAll(): Promise<CostItem[]> {
    return this.storage.getAll<CostItem>(StoreNames.COST_ITEMS);
  }

  async getById(id: string): Promise<CostItem | null> {
    return this.storage.get<CostItem>(StoreNames.COST_ITEMS, id);
  }

  async query(filters: CostItemFilters): Promise<CostItem[]> {
    return this.storage.query<CostItem>(StoreNames.COST_ITEMS, (item) => {
      if (filters.cat && item.cat !== filters.cat) return false;
      if (filters.section && item.section !== filters.section) return false;
      if (filters.phase && item.phase !== filters.phase) return false;
      if (filters.division && item.division !== filters.division) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        if (!item.name.toLowerCase().includes(term) && !item.id.toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    });
  }

  async upsert(item: CreateCostItem): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.getById(item.id);
    const record: CostItem = {
      ...item,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.storage.set<CostItem>(StoreNames.COST_ITEMS, item.id, record);
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(StoreNames.COST_ITEMS, id);
  }
}
