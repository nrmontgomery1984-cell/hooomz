/**
 * Estimate Repository
 *
 * Data access layer for line items (estimates) on projects.
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

/**
 * Line Item Repository Interface
 */
export interface ILineItemRepository {
  findAll(params?: QueryParams<LineItemSortField, LineItemFilters>): Promise<{
    lineItems: LineItem[];
    total: number;
  }>;
  findById(id: string): Promise<LineItem | null>;
  findByProjectId(projectId: string): Promise<LineItem[]>;
  create(data: CreateLineItem): Promise<LineItem>;
  update(
    id: string,
    data: Partial<Omit<LineItem, 'id' | 'metadata'>>
  ): Promise<LineItem | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  deleteByProjectId(projectId: string): Promise<number>; // Returns count deleted
}

/**
 * In-Memory Line Item Repository
 */
export class InMemoryLineItemRepository implements ILineItemRepository {
  private lineItems: Map<string, LineItem> = new Map();

  async findAll(
    params?: QueryParams<LineItemSortField, LineItemFilters>
  ): Promise<{
    lineItems: LineItem[];
    total: number;
  }> {
    let lineItems = Array.from(this.lineItems.values());

    // Apply filters
    if (params?.filters) {
      const { filters } = params;

      if (filters.projectId) {
        lineItems = lineItems.filter((item) => item.projectId === filters.projectId);
      }

      if (filters.category) {
        lineItems = lineItems.filter((item) => item.category === filters.category);
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
    return this.lineItems.get(id) || null;
  }

  async findByProjectId(projectId: string): Promise<LineItem[]> {
    const lineItems = Array.from(this.lineItems.values());
    return lineItems.filter((item) => item.projectId === projectId);
  }

  async create(data: CreateLineItem): Promise<LineItem> {
    const lineItem: LineItem = {
      ...data,
      id: generateLineItemId(),
      metadata: createMetadata(),
    };

    this.lineItems.set(lineItem.id, lineItem);
    return lineItem;
  }

  async update(
    id: string,
    data: Partial<Omit<LineItem, 'id' | 'metadata'>>
  ): Promise<LineItem | null> {
    const existing = this.lineItems.get(id);
    if (!existing) return null;

    const updated: LineItem = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: updateMetadata(existing.metadata),
    };

    this.lineItems.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.lineItems.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.lineItems.has(id);
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
