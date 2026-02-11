/**
 * Change Order Service
 * Manages the full CO lifecycle: create, add line items, approve, decline
 * Implements Agreement B from the Master Integration Spec
 */

import type { ChangeOrder, ChangeOrderLineItem } from '@hooomz/shared-contracts';
import type { ChangeOrderRepository } from '../repositories/changeOrder.repository';
import type { ChangeOrderLineItemRepository } from '../repositories/changeOrderLineItem.repository';
import type { ActivityService } from '../repositories/activity.repository';

export class ChangeOrderService {
  constructor(
    private coRepo: ChangeOrderRepository,
    private lineItemRepo: ChangeOrderLineItemRepository,
    private activity: ActivityService
  ) {}

  /**
   * Create a new change order for a project
   */
  async createChangeOrder(
    projectId: string,
    data: Omit<ChangeOrder, 'id' | 'metadata' | 'projectId' | 'coNumber' | 'status' | 'approvedBy' | 'approvedAt' | 'declinedReason'>
  ): Promise<ChangeOrder> {
    const coNumber = await this.coRepo.getNextCoNumber(projectId);

    const changeOrder = await this.coRepo.create({
      ...data,
      projectId,
      coNumber,
      status: 'draft',
      approvedBy: null,
      approvedAt: null,
      declinedReason: null,
    });

    this.activity.logLabsEvent('co.created', changeOrder.id, {
      entity_name: `${coNumber}: ${changeOrder.title}`,
      project_id: projectId,
    }).catch((err) => console.error('Failed to log co.created:', err));

    return changeOrder;
  }

  /**
   * Add a line item to a change order
   */
  async addLineItem(
    changeOrderId: string,
    data: Omit<ChangeOrderLineItem, 'id' | 'metadata' | 'changeOrderId' | 'taskTemplateIds'>
  ): Promise<ChangeOrderLineItem> {
    const co = await this.coRepo.findById(changeOrderId);
    if (!co) throw new Error(`Change order not found: ${changeOrderId}`);
    if (co.status !== 'draft') {
      throw new Error(`Cannot add line items to a ${co.status} change order`);
    }

    return this.lineItemRepo.create({
      ...data,
      changeOrderId,
      taskTemplateIds: [],
    });
  }

  /**
   * Submit a CO for approval (draft → pending_approval)
   */
  async submitForApproval(id: string): Promise<ChangeOrder> {
    const co = await this.coRepo.findById(id);
    if (!co) throw new Error(`Change order not found: ${id}`);
    if (co.status !== 'draft') {
      throw new Error(`Cannot submit a ${co.status} change order for approval`);
    }

    const updated = await this.coRepo.update(id, { status: 'pending_approval' });
    if (!updated) throw new Error('Failed to update change order');

    this.activity.logLabsEvent('co.submitted', id, {
      entity_name: `${co.coNumber}: ${co.title}`,
      project_id: co.projectId,
    }).catch((err) => console.error('Failed to log co.submitted:', err));

    return updated;
  }

  /**
   * Approve a change order (all-or-nothing at launch)
   * Returns the approved CO. Task generation is handled separately in Build 2.
   */
  async approveChangeOrder(
    id: string,
    approvedBy: string
  ): Promise<{ changeOrder: ChangeOrder; lineItems: ChangeOrderLineItem[] }> {
    const co = await this.coRepo.findById(id);
    if (!co) throw new Error(`Change order not found: ${id}`);
    if (co.status !== 'pending_approval') {
      throw new Error(`Cannot approve a ${co.status} change order`);
    }

    const updated = await this.coRepo.update(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
    if (!updated) throw new Error('Failed to update change order');

    const lineItems = await this.lineItemRepo.findByChangeOrder(id);

    this.activity.logLabsEvent('co.approved', id, {
      entity_name: `${co.coNumber}: ${co.title}`,
      project_id: co.projectId,
    }).catch((err) => console.error('Failed to log co.approved:', err));

    return { changeOrder: updated, lineItems };
  }

  /**
   * Decline a change order
   * Note: Task reclassification (in-progress → uncaptured) handled by UncapturedWorkService
   */
  async declineChangeOrder(
    id: string,
    reason: string
  ): Promise<ChangeOrder> {
    const co = await this.coRepo.findById(id);
    if (!co) throw new Error(`Change order not found: ${id}`);
    if (co.status !== 'pending_approval') {
      throw new Error(`Cannot decline a ${co.status} change order`);
    }

    const updated = await this.coRepo.update(id, {
      status: 'declined',
      declinedReason: reason,
    });
    if (!updated) throw new Error('Failed to update change order');

    this.activity.logLabsEvent('co.declined', id, {
      entity_name: `${co.coNumber}: ${co.title}`,
      project_id: co.projectId,
    }).catch((err) => console.error('Failed to log co.declined:', err));

    return updated;
  }

  /**
   * Cancel a change order (any status → cancelled)
   */
  async cancelChangeOrder(id: string): Promise<ChangeOrder> {
    const co = await this.coRepo.findById(id);
    if (!co) throw new Error(`Change order not found: ${id}`);

    const updated = await this.coRepo.update(id, { status: 'cancelled' });
    if (!updated) throw new Error('Failed to update change order');
    return updated;
  }

  /**
   * Get all COs for a project
   */
  async getByProject(projectId: string): Promise<ChangeOrder[]> {
    return this.coRepo.findByProject(projectId);
  }

  /**
   * Get a single CO with its line items
   */
  async getWithLineItems(id: string): Promise<{ changeOrder: ChangeOrder; lineItems: ChangeOrderLineItem[] } | null> {
    const changeOrder = await this.coRepo.findById(id);
    if (!changeOrder) return null;

    const lineItems = await this.lineItemRepo.findByChangeOrder(id);
    return { changeOrder, lineItems };
  }

  /**
   * Calculate budget impact of all COs for a project
   */
  async getProjectBudgetImpact(projectId: string): Promise<{
    approved: number;
    pending: number;
    declined: number;
    total: number;
  }> {
    const allCOs = await this.coRepo.findByProject(projectId);

    let approved = 0;
    let pending = 0;
    let declined = 0;

    for (const co of allCOs) {
      switch (co.status) {
        case 'approved':
          approved += co.costImpact;
          break;
        case 'pending_approval':
          pending += co.costImpact;
          break;
        case 'declined':
          declined += co.costImpact;
          break;
      }
    }

    return { approved, pending, declined, total: approved + pending };
  }

  /**
   * Get line items for a change order
   */
  async getLineItems(changeOrderId: string): Promise<ChangeOrderLineItem[]> {
    return this.lineItemRepo.findByChangeOrder(changeOrderId);
  }

  /**
   * Remove a line item from a draft CO
   */
  async removeLineItem(changeOrderId: string, lineItemId: string): Promise<boolean> {
    const co = await this.coRepo.findById(changeOrderId);
    if (!co) throw new Error(`Change order not found: ${changeOrderId}`);
    if (co.status !== 'draft') {
      throw new Error(`Cannot remove line items from a ${co.status} change order`);
    }

    return this.lineItemRepo.delete(lineItemId);
  }
}
