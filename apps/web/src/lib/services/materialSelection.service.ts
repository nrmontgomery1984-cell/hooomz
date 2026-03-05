/**
 * MaterialSelectionService — orchestrates material selection for rooms.
 *
 * Activity events logged:
 *   material.selected   — product chosen for a room/trade
 *   material.confirmed  — selection confirmed (customer approved)
 *   material.status_changed — status updated (ordered, delivered)
 *
 * Unit convention: All room measurements come in mm from Phase 2.
 * This service converts to display units (sqft, lf) for quantity calculation.
 */

import type { MaterialSelectionRepository } from '../repositories/materialSelection.repository';
import type { CatalogProductRepository } from '../repositories/catalogProduct.repository';
import type { RoomRepository } from '../repositories/room.repository';
import type { ActivityService } from '../repositories/activity.repository';
import type { Room } from '../types/roomScan.types';
import type { CatalogProduct, ProductTrade, TieredOptions } from '../types/catalogProduct.types';
import type {
  ProjectMaterialSelection,
  SelectionStatus,
  RoomSelectionSummary,
  TierComparison,
  TradeSelectionRow,
} from '../types/materialSelection.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVE_TRADES: ProductTrade[] = ['flooring', 'paint', 'trim', 'tile', 'drywall'];

const DEFAULT_WASTE_FACTORS: Record<ProductTrade, number> = {
  flooring: 0.10,
  paint: 0.10,
  trim: 0.15,
  tile: 0.12,
  drywall: 0.10,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a coverage string like '350-400 sqft/gal' → lower bound number */
function parseCoverage(specs: Record<string, unknown>): number {
  const raw = specs['coverage'];
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const match = raw.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return 400;
}

/** mm → sqft */
function sqmmToSqft(sqmm: number): number {
  return sqmm / 92_903;
}

/** mm → linear feet */
function mmToLf(mm: number): number {
  return mm / 304.8;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class MaterialSelectionService {
  constructor(
    private selectionRepo: MaterialSelectionRepository,
    private catalogRepo: CatalogProductRepository,
    private roomRepo: RoomRepository,
    private activity: ActivityService,
  ) {}

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<ProjectMaterialSelection | null> {
    return this.selectionRepo.findById(id);
  }

  async findByProject(projectId: string): Promise<ProjectMaterialSelection[]> {
    return this.selectionRepo.findByProject(projectId);
  }

  async findByRoom(roomId: string): Promise<ProjectMaterialSelection[]> {
    return this.selectionRepo.findByRoom(roomId);
  }

  async findByRoomAndTrade(roomId: string, trade: ProductTrade): Promise<ProjectMaterialSelection | null> {
    return this.selectionRepo.findByRoomAndTrade(roomId, trade);
  }

  // ─── Quantity calculation ──────────────────────────────────────────────────

  /**
   * Calculate raw quantity (before waste) based on room dimensions and trade.
   * Returns value in the product's native unit (sqft, lf, gallon, each).
   */
  private calculateQuantity(room: Room, trade: ProductTrade, product: CatalogProduct): number {
    const areaSqft = sqmmToSqft(room.polygon.area_sqmm);
    const perimeterLf = mmToLf(room.polygon.perimeter_mm);
    const ceilingHeightFt = room.ceilingHeight_mm / 304.8;
    const wallAreaSqft = perimeterLf * ceilingHeightFt;

    switch (trade) {
      case 'flooring':
      case 'tile':
        return areaSqft;

      case 'paint': {
        const paintableWallArea = wallAreaSqft * 0.85; // 85% — subtract openings
        const coverage = parseCoverage(product.specs);
        const coats = typeof product.specs['coats'] === 'number' ? product.specs['coats'] : 2;
        return (paintableWallArea / coverage) * coats;
      }

      case 'trim':
        // Baseboard = perimeter in lf (openings subtracted at install time)
        return perimeterLf;

      case 'drywall':
        // Sheets (each) — 1 sheet covers 32 sqft
        return Math.ceil(wallAreaSqft / 32);

      default:
        return areaSqft;
    }
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Select a material for a room/trade. Replaces any existing selection.
   * Logs material.selected to the activity spine.
   */
  async selectMaterial(
    projectId: string,
    jobId: string,
    roomId: string,
    trade: ProductTrade,
    productId: string,
    customWasteFactor?: number,
  ): Promise<ProjectMaterialSelection> {
    const product = await this.catalogRepo.findById(productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    const room = await this.roomRepo.findById(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const wasteFactor = customWasteFactor ?? DEFAULT_WASTE_FACTORS[trade] ?? 0.10;
    const quantity = this.calculateQuantity(room, trade, product);
    const quantityWithWaste = quantity * (1 + wasteFactor);
    const totalPrice = parseFloat((quantityWithWaste * product.unitPrice).toFixed(2));

    const selectionData = {
      projectId,
      jobId,
      roomId,
      trade,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      tier: product.tier,
      quantity: parseFloat(quantity.toFixed(4)),
      unit: product.unit,
      unitPrice: product.unitPrice,
      totalPrice,
      wasteFactor,
      quantityWithWaste: parseFloat(quantityWithWaste.toFixed(4)),
      status: 'pending' as SelectionStatus,
      confirmedAt: null,
      confirmedBy: null,
      notes: '',
    };

    const selection = await this.selectionRepo.upsertForRoomTrade(selectionData);

    await this.activity.create({
      event_type: 'material.selected',
      project_id: projectId,
      entity_type: 'room',
      entity_id: roomId,
      summary: `Material selected: ${product.name} (${product.tier}) for ${room.name}`,
      event_data: {
        trade,
        productId: product.id,
        productName: product.name,
        tier: product.tier,
        totalPrice,
        roomName: room.name,
      },
    });

    return selection;
  }

  /**
   * Confirm a selection (customer approved).
   */
  async confirmSelection(
    selectionId: string,
    confirmedBy: string,
  ): Promise<ProjectMaterialSelection> {
    const selection = await this.selectionRepo.findById(selectionId);
    if (!selection) throw new Error(`Selection ${selectionId} not found`);

    const updated = await this.selectionRepo.update(selectionId, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      confirmedBy,
    });
    if (!updated) throw new Error(`Failed to update selection ${selectionId}`);

    await this.activity.create({
      event_type: 'material.confirmed',
      project_id: selection.projectId,
      entity_type: 'room',
      entity_id: selection.roomId,
      summary: `Material confirmed: ${selection.productName} for ${selection.trade}`,
      event_data: { selectionId, trade: selection.trade, confirmedBy },
    });

    return updated;
  }

  /**
   * Update selection status (ordered, delivered).
   */
  async updateStatus(
    selectionId: string,
    status: SelectionStatus,
  ): Promise<ProjectMaterialSelection> {
    const selection = await this.selectionRepo.findById(selectionId);
    if (!selection) throw new Error(`Selection ${selectionId} not found`);

    const updated = await this.selectionRepo.update(selectionId, { status });
    if (!updated) throw new Error(`Failed to update selection ${selectionId}`);

    await this.activity.create({
      event_type: 'material.status_changed',
      project_id: selection.projectId,
      entity_type: 'material_selection',
      entity_id: selectionId,
      summary: `Material status updated: ${selection.productName} → ${status}`,
      event_data: {
        previousStatus: selection.status,
        newStatus: status,
        trade: selection.trade,
      },
    });

    return updated;
  }

  async deleteSelection(id: string): Promise<boolean> {
    return this.selectionRepo.delete(id);
  }

  // ─── Derived queries ───────────────────────────────────────────────────────

  /**
   * Compute Good/Better/Best price comparison for a room and trade.
   * Quantities are calculated from room dimensions and include the default waste factor.
   */
  async getTierComparison(roomId: string, trade: ProductTrade): Promise<TierComparison> {
    const room = await this.roomRepo.findById(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const tieredOptions: TieredOptions = await this.catalogRepo.getTieredOptions(trade);
    const existing = await this.selectionRepo.findByRoomAndTrade(roomId, trade);
    const wasteFactor = DEFAULT_WASTE_FACTORS[trade] ?? 0.10;

    const makeTierOption = (products: CatalogProduct[]) => {
      if (products.length === 0) return { product: null, totalPrice: 0 };
      const product = products[0]; // representative product for this tier
      const qty = this.calculateQuantity(room, trade, product);
      const qtyWithWaste = qty * (1 + wasteFactor);
      const totalPrice = parseFloat((qtyWithWaste * product.unitPrice).toFixed(2));
      return { product, totalPrice };
    };

    return {
      trade,
      roomId,
      good: makeTierOption(tieredOptions.good),
      better: makeTierOption(tieredOptions.better),
      best: makeTierOption(tieredOptions.best),
      selectedTier: existing?.tier ?? null,
    };
  }

  /**
   * Summary of all selections for a room, grouped by trade.
   */
  async getRoomSummary(roomId: string): Promise<RoomSelectionSummary> {
    const room = await this.roomRepo.findById(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const selections = await this.selectionRepo.findByRoom(roomId);

    const trades: TradeSelectionRow[] = ACTIVE_TRADES.map((trade) => {
      const selection = selections.find((s) => s.trade === trade) ?? null;
      return { trade, selection, isComplete: selection !== null };
    });

    const totalPrice = parseFloat(
      selections.reduce((sum, s) => sum + s.totalPrice, 0).toFixed(2),
    );
    const confirmedCount = selections.filter((s) => s.status === 'confirmed').length;
    const allConfirmed = selections.length > 0 && confirmedCount === selections.length;

    return {
      roomId,
      roomName: room.name,
      trades,
      totalPrice,
      confirmedCount,
      allConfirmed,
    };
  }

  /**
   * Project-wide summary: all rooms' selections and total price.
   */
  async getProjectSummary(projectId: string): Promise<{
    selections: ProjectMaterialSelection[];
    totalPrice: number;
    confirmedCount: number;
  }> {
    const selections = await this.selectionRepo.findByProject(projectId);
    const totalPrice = parseFloat(
      selections.reduce((sum, s) => sum + s.totalPrice, 0).toFixed(2),
    );
    const confirmedCount = selections.filter((s) => s.status === 'confirmed').length;
    return { selections, totalPrice, confirmedCount };
  }
}

export function createMaterialSelectionService(
  selectionRepo: MaterialSelectionRepository,
  catalogRepo: CatalogProductRepository,
  roomRepo: RoomRepository,
  activity: ActivityService,
): MaterialSelectionService {
  return new MaterialSelectionService(selectionRepo, catalogRepo, roomRepo, activity);
}
