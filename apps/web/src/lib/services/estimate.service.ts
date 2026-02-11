/**
 * Estimate Service - Wraps LineItemRepository with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all estimate/line item operations are logged.
 */

import type { LineItem, CreateLineItem } from '@hooomz/shared-contracts';
import type { Services } from './index';

/**
 * EstimateService - Handles estimate line item operations with activity logging
 */
export class EstimateService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Create a new line item
   */
  async createLineItem(
    projectId: string,
    data: CreateLineItem,
    context?: {
      work_category_code?: string;
      trade?: string;
      location_id?: string;
    }
  ): Promise<LineItem> {
    const lineItem = await this.services.estimating.lineItems.create({
      ...data,
      projectId,
    });

    // Log to activity (non-blocking)
    this.services.activity.logEstimateLineItemEvent(
      'estimate.line_item_added',
      projectId,
      lineItem.id,
      {
        description: lineItem.description,
        quantity: lineItem.quantity,
        unit: lineItem.unit,
        total: lineItem.totalCost,
        category: lineItem.category,
        work_category_code: context?.work_category_code,
        trade: context?.trade,
        location_id: context?.location_id,
      }
    ).catch((err) => console.error('Failed to log estimate.line_item_added:', err));

    return lineItem;
  }

  /**
   * Update a line item
   */
  async updateLineItem(
    projectId: string,
    lineItemId: string,
    data: Partial<Omit<LineItem, 'id' | 'metadata'>>,
    context?: {
      work_category_code?: string;
      trade?: string;
      location_id?: string;
    }
  ): Promise<LineItem | null> {
    const updated = await this.services.estimating.lineItems.update(lineItemId, data);

    if (updated) {
      // Log update (non-blocking)
      this.services.activity.logEstimateLineItemEvent(
        'estimate.line_item_updated',
        projectId,
        lineItemId,
        {
          description: updated.description,
          quantity: updated.quantity,
          unit: updated.unit,
          total: updated.totalCost,
          category: updated.category,
          work_category_code: context?.work_category_code,
          trade: context?.trade,
          location_id: context?.location_id,
        }
      ).catch((err) => console.error('Failed to log estimate.line_item_updated:', err));
    }

    return updated;
  }

  /**
   * Delete a line item
   */
  async deleteLineItem(
    projectId: string,
    lineItemId: string,
    context?: {
      description?: string;
      work_category_code?: string;
      trade?: string;
      location_id?: string;
    }
  ): Promise<boolean> {
    const existing = await this.services.estimating.lineItems.findById(lineItemId);
    const deleted = await this.services.estimating.lineItems.delete(lineItemId);

    if (deleted) {
      // Log deletion (non-blocking)
      this.services.activity.logEstimateLineItemEvent(
        'estimate.line_item_deleted',
        projectId,
        lineItemId,
        {
          description: context?.description || existing?.description || 'Unknown',
          work_category_code: context?.work_category_code,
          trade: context?.trade,
          location_id: context?.location_id,
        }
      ).catch((err) => console.error('Failed to log estimate.line_item_deleted:', err));
    }

    return deleted;
  }

  /**
   * Bulk create line items (e.g., from a template or copy)
   */
  async bulkCreateLineItems(
    projectId: string,
    items: CreateLineItem[],
    context?: {
      work_category_code?: string;
      trade?: string;
      location_id?: string;
    }
  ): Promise<LineItem[]> {
    const created: LineItem[] = [];

    for (const item of items) {
      const lineItem = await this.createLineItem(projectId, item, context);
      created.push(lineItem);
    }

    return created;
  }

  /**
   * Delete all line items for a project
   */
  async deleteByProjectId(projectId: string): Promise<number> {
    const items = await this.services.estimating.lineItems.findByProjectId(projectId);
    let count = 0;

    for (const item of items) {
      const deleted = await this.deleteLineItem(projectId, item.id, {
        description: item.description,
      });
      if (deleted) count++;
    }

    return count;
  }

  /**
   * Copy line items from one project to another
   */
  async copyLineItems(
    sourceProjectId: string,
    targetProjectId: string
  ): Promise<LineItem[]> {
    const sourceItems = await this.services.estimating.lineItems.findByProjectId(sourceProjectId);
    const copiedItems: LineItem[] = [];

    for (const item of sourceItems) {
      const newItem = await this.createLineItem(targetProjectId, {
        projectId: targetProjectId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        isLabor: item.isLabor,
        category: item.category,
      });
      copiedItems.push(newItem);
    }

    return copiedItems;
  }

  // Passthrough methods for read operations (no logging needed)
  async findById(id: string) {
    return this.services.estimating.lineItems.findById(id);
  }

  async findByProjectId(projectId: string) {
    return this.services.estimating.lineItems.findByProjectId(projectId);
  }

  async getProjectTotals(projectId: string) {
    return this.services.estimating.lineItems.calculateProjectTotals(projectId);
  }
}

/**
 * Create an EstimateService instance
 */
export function createEstimateService(services: Services): EstimateService {
  return new EstimateService(services);
}
