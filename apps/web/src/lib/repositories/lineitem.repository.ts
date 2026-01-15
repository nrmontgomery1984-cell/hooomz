/**
 * LineItem Repository - IndexedDB implementation for offline-first operation
 */

import type {
  LineItem,
  CreateLineItem,
  QueryParams,
  LineItemFilters,
  LineItemSortField,
} from '@hooomz/shared-contracts';
import {
  generateLineItemId,
  createMetadata,
  updateMetadata,
} from '@hooomz/shared-contracts';
import type { ILineItemRepository } from '@hooomz/estimating';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

/**
 * IndexedDB-backed LineItem Repository
 */
export class LineItemRepository implements ILineItemRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LINE_ITEMS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async findAll(
    params?: QueryParams<LineItemSortField, LineItemFilters>
  ): Promise<{
    lineItems: LineItem[];
    total: number;
  }> {
    let lineItems = await this.storage.getAll<LineItem>(this.storeName);

    // Apply filters
    if (params?.filters) {
      const { filters } = params;

      if (filters.projectId) {
        lineItems = lineItems.filter((item) => item.projectId === filters.projectId);
      }

      if (filters.category) {
        const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
        lineItems = lineItems.filter((item) => categories.includes(item.category));
      }

      if (filters.isLabor !== undefined) {
        lineItems = lineItems.filter((item) => item.isLabor === filters.isLabor);
      }
    }

    const total = lineItems.length;

    // Apply sorting
    if (params?.sortBy) {
      const { sortBy, sortOrder = 'asc' } = params;
      lineItems.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortBy) {
          case 'description':
            aVal = a.description.toLowerCase();
            bVal = b.description.toLowerCase();
            break;
          case 'totalCost':
            aVal = a.totalCost;
            bVal = b.totalCost;
            break;
          case 'category':
            aVal = (a.category || '').toLowerCase();
            bVal = (b.category || '').toLowerCase();
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
      lineItems = lineItems.slice(start, end);
    }

    return { lineItems, total };
  }

  async findById(id: string): Promise<LineItem | null> {
    return await this.storage.get<LineItem>(this.storeName, id);
  }

  async findByProjectId(projectId: string): Promise<LineItem[]> {
    const lineItems = await this.storage.getAll<LineItem>(this.storeName);
    return lineItems.filter((item) => item.projectId === projectId);
  }

  async create(data: CreateLineItem): Promise<LineItem> {
    const lineItem: LineItem = {
      ...data,
      id: generateLineItemId(),
      metadata: createMetadata(),
    };

    await this.storage.set(this.storeName, lineItem.id, lineItem);
    await this.syncQueue.queueCreate(this.storeName, lineItem.id, lineItem);

    return lineItem;
  }

  async update(
    id: string,
    data: Partial<Omit<LineItem, 'id' | 'metadata'>>
  ): Promise<LineItem | null> {
    const existing = await this.storage.get<LineItem>(this.storeName, id);
    if (!existing) return null;

    const updated: LineItem = {
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
    const existing = await this.storage.get<LineItem>(this.storeName, id);
    if (!existing) return false;

    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);

    return true;
  }

  async exists(id: string): Promise<boolean> {
    const lineItem = await this.storage.get<LineItem>(this.storeName, id);
    return lineItem !== null;
  }

  async deleteByProjectId(projectId: string): Promise<number> {
    const lineItems = await this.findByProjectId(projectId);
    let count = 0;

    for (const item of lineItems) {
      if (await this.delete(item.id)) {
        count++;
      }
    }

    return count;
  }
}
