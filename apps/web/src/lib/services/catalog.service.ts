/**
 * Catalog Service - Wraps CatalogRepository with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all catalog operations are logged.
 */

import type { CatalogItem, CreateCatalogItem } from '@hooomz/estimating';
import type { Services } from './index';

/**
 * CatalogService - Handles catalog operations with activity logging
 */
export class CatalogService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Create a new catalog item
   */
  async create(data: CreateCatalogItem): Promise<CatalogItem> {
    const item = await this.services.estimating.catalog.create(data);

    // Log to activity (non-blocking)
    this.services.activity.logCatalogEvent('catalog.item_added', item.id, {
      item_name: item.name,
      category: item.category,
    }).catch((err) => console.error('Failed to log catalog.item_added:', err));

    return item;
  }

  /**
   * Update a catalog item
   */
  async update(
    itemId: string,
    data: Partial<Omit<CatalogItem, 'id' | 'metadata'>>
  ): Promise<CatalogItem | null> {
    const existing = await this.services.estimating.catalog.findById(itemId);
    if (!existing) return null;

    const updated = await this.services.estimating.catalog.update(itemId, data);

    if (updated) {
      // Log update (non-blocking)
      this.services.activity.logCatalogEvent('catalog.item_updated', itemId, {
        item_name: updated.name,
        category: updated.category,
      }).catch((err) => console.error('Failed to log catalog.item_updated:', err));
    }

    return updated;
  }

  /**
   * Delete a catalog item
   */
  async delete(itemId: string): Promise<boolean> {
    const existing = await this.services.estimating.catalog.findById(itemId);
    if (!existing) return false;

    const deleted = await this.services.estimating.catalog.delete(itemId);

    if (deleted) {
      // Log deletion (non-blocking)
      this.services.activity.logCatalogEvent('catalog.item_deleted', itemId, {
        item_name: existing.name,
        category: existing.category,
      }).catch((err) => console.error('Failed to log catalog.item_deleted:', err));
    }

    return deleted;
  }

  /**
   * Update pricing for a catalog item
   */
  async updatePricing(
    itemId: string,
    newUnitCost: number
  ): Promise<CatalogItem | null> {
    const existing = await this.services.estimating.catalog.findById(itemId);
    if (!existing) return null;

    const updated = await this.services.estimating.catalog.update(itemId, {
      unitCost: newUnitCost,
    });

    if (updated) {
      // Log price change (non-blocking)
      this.services.activity.logCatalogEvent('catalog.price_updated', itemId, {
        item_name: updated.name,
        old_price: existing.unitCost,
        new_price: newUnitCost,
      }).catch((err) => console.error('Failed to log catalog.price_updated:', err));
    }

    return updated;
  }

  /**
   * Bulk import catalog items
   */
  async bulkImport(items: CreateCatalogItem[]): Promise<CatalogItem[]> {
    const created: CatalogItem[] = [];

    for (const item of items) {
      const catalogItem = await this.create(item);
      created.push(catalogItem);
    }

    return created;
  }

  /**
   * Archive a catalog item (soft delete via isActive flag)
   */
  async archive(itemId: string): Promise<CatalogItem | null> {
    const existing = await this.services.estimating.catalog.findById(itemId);
    if (!existing) return null;

    const updated = await this.services.estimating.catalog.update(itemId, {
      isActive: false,
    });

    if (updated) {
      // Log archive as deletion event (non-blocking)
      this.services.activity.logCatalogEvent('catalog.item_deleted', itemId, {
        item_name: existing.name,
        category: existing.category,
      }).catch((err) => console.error('Failed to log catalog archive:', err));
    }

    return updated;
  }

  // Passthrough methods for read operations (no logging needed)
  async findById(id: string) {
    return this.services.estimating.catalog.findById(id);
  }

  async findAll(params?: { category?: string; search?: string; type?: 'material' | 'labor' }) {
    return this.services.estimating.catalog.findAll(params);
  }

  async findByCategory(category: string) {
    return this.services.estimating.catalog.findByCategory(category);
  }

  async search(query: string, type?: 'material' | 'labor') {
    return this.services.estimating.catalog.search(query, type);
  }
}

/**
 * Create a CatalogService instance
 */
export function createCatalogService(services: Services): CatalogService {
  return new CatalogService(services);
}
