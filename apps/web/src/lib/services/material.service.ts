/**
 * MaterialService — Read/write access to the materialRecords store.
 *
 * Phase 0: stubs only. Full implementation in Phase 1.
 *
 * NOTE: photo_url must be a Supabase Storage URL — never base64 in IndexedDB.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type {
  MaterialRecord,
  MaterialRecordFilters,
  CreateMaterialRecord,
  MaterialPriceLog,
  CreateMaterialPriceLog,
} from '../types/catalogue.types';

export class MaterialService {
  constructor(private storage: StorageAdapter) {}

  async getAll(): Promise<MaterialRecord[]> {
    return this.storage.getAll<MaterialRecord>(StoreNames.MATERIAL_RECORDS);
  }

  async getById(id: string): Promise<MaterialRecord | null> {
    return this.storage.get<MaterialRecord>(StoreNames.MATERIAL_RECORDS, id);
  }

  async query(filters: MaterialRecordFilters): Promise<MaterialRecord[]> {
    return this.storage.query<MaterialRecord>(StoreNames.MATERIAL_RECORDS, (item) => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.tier && item.tier !== filters.tier) return false;
      if (filters.labs_status && item.labs_status !== filters.labs_status) return false;
      if (filters.supplier && item.supplier !== filters.supplier) return false;
      if (filters.division && item.division !== filters.division) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        if (
          !item.name.toLowerCase().includes(term) &&
          !item.brand.toLowerCase().includes(term) &&
          !item.sku.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }

  /** Returns all materials linked to a given CostItem ID */
  async getByLinkedCostItem(costItemId: string): Promise<MaterialRecord[]> {
    return this.storage.query<MaterialRecord>(StoreNames.MATERIAL_RECORDS, (item) =>
      item.linked_cost_items.includes(costItemId)
    );
  }

  async upsert(item: CreateMaterialRecord): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.getById(item.id);
    const record: MaterialRecord = {
      ...item,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    // Log price change if cost_per_unit changed
    if (existing && existing.cost_per_unit !== item.cost_per_unit) {
      const logEntry: MaterialPriceLog = {
        id: `MPL-${item.id}-${Date.now()}`,
        material_id: item.id,
        cost_per_unit: item.cost_per_unit,
        unit_type: item.unit_type,
        source: 'manual',
        recorded_at: now,
        recorded_by: 'system',
      };
      await this.storage.set<MaterialPriceLog>(
        StoreNames.MATERIAL_PRICE_LOG,
        logEntry.id,
        logEntry
      );
    }

    await this.storage.set<MaterialRecord>(StoreNames.MATERIAL_RECORDS, item.id, record);
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(StoreNames.MATERIAL_RECORDS, id);
  }

  // ── Price Log ────────────────────────────────────────────────────────────────

  async getPriceLog(materialId: string): Promise<MaterialPriceLog[]> {
    return this.storage.query<MaterialPriceLog>(
      StoreNames.MATERIAL_PRICE_LOG,
      (entry) => entry.material_id === materialId
    );
  }

  async addPriceLogEntry(entry: CreateMaterialPriceLog): Promise<void> {
    const record: MaterialPriceLog = {
      ...entry,
      recorded_at: new Date().toISOString(),
    };
    await this.storage.set<MaterialPriceLog>(
      StoreNames.MATERIAL_PRICE_LOG,
      record.id,
      record
    );
  }
}
