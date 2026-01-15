/**
 * Catalog Repository - IndexedDB implementation for offline-first operation
 */

import type {
  CatalogItem,
  CreateCatalogItem,
  CatalogQueryParams,
  ICatalogRepository,
} from '@hooomz/estimating';
import { generateId, createMetadata, updateMetadata } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

/**
 * IndexedDB-backed Catalog Repository
 */
export class CatalogRepository implements ICatalogRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CATALOG_ITEMS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async findAll(params?: CatalogQueryParams): Promise<{
    items: CatalogItem[];
    total: number;
  }> {
    let items = await this.storage.getAll<CatalogItem>(this.storeName);

    // Apply filters
    if (params?.type) {
      items = items.filter((item) => item.type === params.type);
    }

    if (params?.category) {
      items = items.filter((item) => item.category === params.category);
    }

    if (params?.supplier) {
      items = items.filter((item) => item.supplier === params.supplier);
    }

    if (params?.isActive !== undefined) {
      items = items.filter((item) => item.isActive === params.isActive);
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.supplier?.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower)
      );
    }

    const total = items.length;

    // Apply sorting
    if (params?.sortBy) {
      const { sortBy, sortOrder = 'asc' } = params;
      items.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortBy) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'unitCost':
            aVal = a.unitCost;
            bVal = b.unitCost;
            break;
          case 'category':
            aVal = a.category.toLowerCase();
            bVal = b.category.toLowerCase();
            break;
          case 'createdAt':
            aVal = new Date(a.metadata.createdAt).getTime();
            bVal = new Date(b.metadata.createdAt).getTime();
            break;
          default:
            aVal = a.metadata.createdAt;
            bVal = b.metadata.createdAt;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (params?.page && params?.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      items = items.slice(start, end);
    }

    return { items, total };
  }

  async findById(id: string): Promise<CatalogItem | null> {
    return await this.storage.get<CatalogItem>(this.storeName, id);
  }

  async findByName(
    name: string,
    type?: 'material' | 'labor'
  ): Promise<CatalogItem | null> {
    const items = await this.storage.getAll<CatalogItem>(this.storeName);
    return (
      items.find(
        (item) =>
          item.name.toLowerCase() === name.toLowerCase() &&
          (!type || item.type === type)
      ) || null
    );
  }

  async search(query: string, type?: 'material' | 'labor'): Promise<CatalogItem[]> {
    const queryLower = query.toLowerCase();
    let items = await this.storage.getAll<CatalogItem>(this.storeName);

    if (type) {
      items = items.filter((item) => item.type === type);
    }

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower) ||
        item.category.toLowerCase().includes(queryLower) ||
        item.supplier?.toLowerCase().includes(queryLower) ||
        item.sku?.toLowerCase().includes(queryLower)
    );
  }

  async findByCategory(category: string): Promise<CatalogItem[]> {
    const items = await this.storage.getAll<CatalogItem>(this.storeName);
    return items.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
  }

  async create(data: CreateCatalogItem): Promise<CatalogItem> {
    const item: CatalogItem = {
      ...data,
      id: generateId('cat'),
      metadata: createMetadata(),
    };

    await this.storage.set(this.storeName, item.id, item);
    await this.syncQueue.queueCreate(this.storeName, item.id, item);

    return item;
  }

  async update(
    id: string,
    data: Partial<Omit<CatalogItem, 'id' | 'metadata'>>
  ): Promise<CatalogItem | null> {
    const existing = await this.storage.get<CatalogItem>(this.storeName, id);
    if (!existing) return null;

    const updated: CatalogItem = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: updateMetadata(existing.metadata),
    };

    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<CatalogItem>(this.storeName, id);
    if (!existing) return false;

    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);

    return true;
  }

  async exists(id: string): Promise<boolean> {
    const item = await this.storage.get<CatalogItem>(this.storeName, id);
    return item !== null;
  }
}
