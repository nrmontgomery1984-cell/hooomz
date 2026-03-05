/**
 * Material Selection Types — Phase 3 (v30)
 *
 * A ProjectMaterialSelection records the user's chosen product (from the
 * Good/Better/Best tier catalog) for a specific room and trade.
 *
 * Selections are per-room (decided: 2026-03-02).
 * jobId === projectId in the current routing scheme.
 */

import type { ProductTier, ProductTrade, ProductUnit, CatalogProduct } from './catalogProduct.types';

export type SelectionStatus = 'pending' | 'confirmed' | 'ordered' | 'delivered';

export interface ProjectMaterialSelection {
  id: string;
  projectId: string;
  jobId: string;
  roomId: string;
  trade: ProductTrade;

  // Selected product (denormalized for display without joins)
  productId: string;
  productName: string;
  productSku: string;
  tier: ProductTier;

  // Quantity
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  totalPrice: number;

  // Waste factor applied at time of selection
  wasteFactor: number;          // e.g., 0.10 for 10%
  quantityWithWaste: number;

  // Status tracking
  status: SelectionStatus;
  confirmedAt: string | null;
  confirmedBy: string | null;

  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateMaterialSelection = Omit<
  ProjectMaterialSelection,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateMaterialSelection = Partial<
  Omit<ProjectMaterialSelection, 'id' | 'projectId' | 'jobId' | 'roomId' | 'trade' | 'createdAt'>
>;

// ─── Derived / computed shapes ──────────────────────────────────────────────

export interface TradeSelectionRow {
  trade: ProductTrade;
  selection: ProjectMaterialSelection | null;
  isComplete: boolean;
}

export interface RoomSelectionSummary {
  roomId: string;
  roomName: string;
  trades: TradeSelectionRow[];
  totalPrice: number;
  confirmedCount: number;
  allConfirmed: boolean;
}

export interface TierOption {
  product: CatalogProduct | null;
  totalPrice: number;
}

export interface TierComparison {
  trade: ProductTrade;
  roomId: string;
  good: TierOption;
  better: TierOption;
  best: TierOption;
  selectedTier: ProductTier | null;
}
