/**
 * Catalogue Types — Hooomz Cost Catalogue & Material Records
 *
 * Two distinct data models live here:
 *
 * CostItem — one row per labour/material line item. Tier selects which price
 *   column to use (lG/lB/lBB for labour; mG/mB/mBB for material). A single
 *   CostItem covers all three Good/Better/Best tiers.
 *
 * MaterialRecord — one record PER tier. MaterialRecord.tier means "this
 *   record IS the Good, Better, or Best variant of this physical product."
 *   Do not confuse with CostItem's tier-column model.
 */

export type ScriptPhase = 'S' | 'C' | 'R' | 'I' | 'P' | 'T';

export type CostCategory =
  | 'General'
  | 'Flooring'
  | 'Painting'
  | 'Trim & Doors'
  | 'Accent Walls';

export type MaterialTier = 'Good' | 'Better' | 'Best';

export type LabsStatus = 'needs_review' | 'being_reviewed' | 'reviewed';

export type MaterialStyle = 'Basic' | 'Modern' | 'Traditional' | 'Craftsman';

// ─── CostItem ─────────────────────────────────────────────────────────────────
/**
 * One row per labour/material cost item. Three price tiers are stored as
 * separate columns (lG, lB, lBB / mG, mB, mBB). At estimation time the
 * active tier selects the correct column — NOT a separate record.
 */
export interface CostItem {
  id: string;         // e.g. "GEN-001", "FLR-020"
  cat: CostCategory;
  section: string;    // sub-group within category, e.g. "Subfloor Prep"
  phase: ScriptPhase; // SCRIPT phase this item belongs to
  name: string;
  unit: string;       // e.g. "sq ft", "per room", "each"

  // Labour costs by tier (CAD)
  lG: number;         // labour — Good tier
  lB: number;         // labour — Better tier
  lBB: number;        // labour — Best tier

  // Material costs by tier (CAD); 0 = labour-only line
  mG: number;         // material — Good tier
  mB: number;         // material — Better tier
  mBB: number;        // material — Best tier

  division: string;   // required — no default. e.g. "interiors"

  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

export type CreateCostItem = Omit<CostItem, 'createdAt' | 'updatedAt'>;

export interface CostItemFilters {
  cat?: CostCategory;
  section?: string;
  phase?: ScriptPhase;
  division?: string;
  searchTerm?: string;
}

// ─── MaterialRecord ────────────────────────────────────────────────────────────
/**
 * One record per physical-product tier variant.
 * MaterialRecord.tier = 'Better' means THIS record IS the Better-tier product.
 * This differs from CostItem where a single row covers all three tiers via columns.
 *
 * linked_cost_items stores CostItem IDs only (e.g. ["FLR-020"]).
 * The multiEntry index on this field enables fast reverse-lookup:
 *   "which materials are linked to cost item FLR-020?"
 */
export interface MaterialRecord {
  id: string;         // e.g. "MAT-001"
  name: string;
  brand: string;
  sku: string;
  category: string;   // e.g. "LVP / LVT", "Solid Hardwood", "Tile"
  subcategory: string;
  supplier: string;
  supplier_sku: string;
  cost_per_unit: number; // CAD
  unit_type: string;  // e.g. "sq ft", "linear ft", "each"
  qty_per_box: string;
  coverage_per_box: string;
  dimensions: string;
  thickness: string;
  material_composition: string;
  finish: string;
  color_name: string;
  color_code: string;
  weight_per_unit: string;
  wear_rating: string;
  water_resistance: string;
  warranty_years: string;
  warranty_notes: string;
  fire_rating: string;
  install_method: string;
  subfloor_requirements: string;
  acclimation_required: string;
  install_notes: string;
  maintenance_notes: string;
  cleaning_instructions: string;
  refinishable: string;
  manufacturer_url: string;

  labs_status: LabsStatus;
  labs_notes: string;

  /**
   * IDs of linked CostItems — stored as string[] of IDs only.
   * Never store the old "FLR-020 — Name" format here; IDs only.
   * The multiEntry index on this field makes reverse-lookup fast.
   */
  linked_cost_items: string[];

  notes: string;
  photo_url: string | null; // Supabase Storage URL only — never base64 in IDB

  /**
   * This record IS the Good/Better/Best tier of this physical product.
   * Separate MaterialRecord per tier; unlike CostItem which uses columns.
   */
  tier: MaterialTier;
  style: MaterialStyle | string;

  source_verified: boolean;
  division: string;   // required — no default. e.g. "interiors"

  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

export type CreateMaterialRecord = Omit<MaterialRecord, 'createdAt' | 'updatedAt'>;

export interface MaterialRecordFilters {
  category?: string;
  tier?: MaterialTier;
  labs_status?: LabsStatus;
  supplier?: string;
  division?: string;
  searchTerm?: string;
}

// ─── LabsReview ────────────────────────────────────────────────────────────────
export interface LabsReview {
  id: string;
  material_id: string;  // references MaterialRecord.id
  reviewer_id: string;  // crew member ID
  score: number;        // 0–100
  notes: string;
  phase: string;        // which SCRIPT phase the review was conducted in
  createdAt: string;    // ISO 8601
}

export type CreateLabsReview = Omit<LabsReview, 'createdAt'>;

// ─── MaterialPriceLog ──────────────────────────────────────────────────────────
/**
 * Immutable price-history entries for a MaterialRecord.
 * Written whenever cost_per_unit changes; never updated in place.
 */
export interface MaterialPriceLog {
  id: string;
  material_id: string;  // references MaterialRecord.id
  cost_per_unit: number; // CAD snapshot at time of recording
  unit_type: string;
  source: string;       // e.g. "manual", "supplier_quote"
  recorded_at: string;  // ISO 8601
  recorded_by: string;  // crew member ID or "system"
}

export type CreateMaterialPriceLog = Omit<MaterialPriceLog, 'recorded_at'>;
