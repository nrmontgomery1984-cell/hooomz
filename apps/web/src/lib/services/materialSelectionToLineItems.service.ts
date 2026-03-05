/**
 * MaterialSelectionToLineItems — bridges material selections into quote line items.
 *
 * generateLineItemsFromSelections(projectId):
 *   1. Reads all confirmed ProjectMaterialSelection records for the project
 *   2. For each selection, upserts a LineItem with source='material_selection'
 *   3. Returns the created/updated LineItem array
 *
 * Activity event: material.synced_to_quote
 */

import type { LineItem, CreateLineItem } from '@hooomz/shared-contracts';
import { CostCategory, UnitOfMeasure } from '@hooomz/shared-contracts';
import type { LineItemRepository } from '../repositories/lineitem.repository';
import type { MaterialSelectionRepository } from '../repositories/materialSelection.repository';
import type { ActivityService } from '../repositories/activity.repository';
import type { ProductTrade } from '../types/catalogProduct.types';
import type { ProductUnit } from '../types/catalogProduct.types';

// ─── Mapping helpers ──────────────────────────────────────────────────────────

const TRADE_TO_CATEGORY: Record<ProductTrade, CostCategory> = {
  flooring: CostCategory.FLOORING,
  paint: CostCategory.PAINTING,
  trim: CostCategory.INTERIOR_TRIM,
  tile: CostCategory.FLOORING,
  drywall: CostCategory.DRYWALL,
};

const UNIT_TO_UOM: Record<ProductUnit, UnitOfMeasure> = {
  sqft: UnitOfMeasure.SQUARE_FOOT,
  lf: UnitOfMeasure.LINEAR_FOOT,
  gallon: UnitOfMeasure.GALLON,
  each: UnitOfMeasure.EACH,
  box: UnitOfMeasure.BOX,
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class MaterialSelectionToLineItemsService {
  constructor(
    private lineItemRepo: LineItemRepository,
    private selectionRepo: MaterialSelectionRepository,
    private activity: ActivityService,
  ) {}

  /**
   * Sync confirmed material selections into line items for the project.
   * Creates new line items or updates existing ones (matched by source_id).
   */
  async generateLineItemsFromSelections(projectId: string): Promise<LineItem[]> {
    // 1. Get all confirmed selections for this project
    const allSelections = await this.selectionRepo.findByProject(projectId);
    const confirmedSelections = allSelections.filter((s) => s.status === 'confirmed');

    if (confirmedSelections.length === 0) return [];

    // 2. Get all existing material_selection line items for this project
    const existingLineItems = await this.lineItemRepo.findByProjectId(projectId);
    const existingBySourceId = new Map<string, LineItem>();
    for (const li of existingLineItems) {
      const raw = li as LineItem & { source?: string; source_id?: string | null };
      if (raw.source === 'material_selection' && raw.source_id) {
        existingBySourceId.set(raw.source_id, li);
      }
    }

    const result: LineItem[] = [];

    // 3. Upsert each confirmed selection
    for (const selection of confirmedSelections) {
      const category = TRADE_TO_CATEGORY[selection.trade] ?? CostCategory.OTHER;
      const unit = UNIT_TO_UOM[selection.unit] ?? UnitOfMeasure.EACH;
      const description = `${selection.productName} — ${selection.tier} tier`;
      const quantity = selection.quantityWithWaste;
      const unitCost = selection.unitPrice;
      const totalCost = selection.totalPrice;

      const existing = existingBySourceId.get(selection.id);

      if (existing) {
        // Update if anything changed
        const needsUpdate =
          existing.description !== description ||
          existing.quantity !== quantity ||
          existing.unitCost !== unitCost ||
          existing.totalCost !== totalCost;

        if (needsUpdate) {
          const updated = await this.lineItemRepo.update(existing.id, {
            description,
            quantity,
            unitCost,
            totalCost,
            category,
            unit,
          });
          if (updated) result.push(updated);
        } else {
          result.push(existing);
        }
      } else {
        // Create new line item
        const createData: CreateLineItem = {
          projectId,
          category,
          description,
          quantity,
          unit,
          unitCost,
          totalCost,
          isLabor: false,
          source: 'material_selection',
          source_id: selection.id,
        };
        const created = await this.lineItemRepo.create(createData);
        result.push(created);
      }
    }

    // 4. Log activity
    await this.activity.create({
      event_type: 'material.synced_to_quote',
      project_id: projectId,
      entity_type: 'project',
      entity_id: projectId,
      summary: `${result.length} material selection${result.length === 1 ? '' : 's'} synced to quote`,
      event_data: {
        lineItemCount: result.length,
        totalAmount: result.reduce((sum, li) => sum + li.totalCost, 0),
      },
    });

    return result;
  }

  /**
   * Count how many material_selection line items exist for a project.
   */
  async countExistingMaterialLineItems(projectId: string): Promise<number> {
    const lineItems = await this.lineItemRepo.findByProjectId(projectId);
    return lineItems.filter((li) => {
      const raw = li as LineItem & { source?: string };
      return raw.source === 'material_selection';
    }).length;
  }
}

export function createMaterialSelectionToLineItemsService(
  lineItemRepo: LineItemRepository,
  selectionRepo: MaterialSelectionRepository,
  activity: ActivityService,
): MaterialSelectionToLineItemsService {
  return new MaterialSelectionToLineItemsService(lineItemRepo, selectionRepo, activity);
}
