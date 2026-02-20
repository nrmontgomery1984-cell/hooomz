/**
 * Cost Catalogue Types
 *
 * Singleton document stored in IndexedDB that holds all editable rate tables.
 * When present, the estimate engine uses these rates instead of hardcoded defaults.
 */

// ============================================================================
// Units
// ============================================================================

export type CatalogUnit = 'sqft' | 'lft' | 'each' | 'bag' | 'box' | 'roll' | 'gal' | 'hour' | 'room';

export const CATALOG_UNITS: { value: CatalogUnit; label: string }[] = [
  { value: 'sqft', label: 'sq ft' },
  { value: 'lft', label: 'lin ft' },
  { value: 'each', label: 'each' },
  { value: 'bag', label: 'bag' },
  { value: 'box', label: 'box' },
  { value: 'roll', label: 'roll' },
  { value: 'gal', label: 'gallon' },
  { value: 'hour', label: 'hour' },
  { value: 'room', label: 'room' },
];

// ============================================================================
// Installed Rate Entry Types (existing — now with optional unit)
// ============================================================================

export interface FloorRateEntry {
  rate: number;
  label: string;
  unit?: CatalogUnit;
}

export interface PaintRateEntry {
  ratePerWallSqft: number;
  ceilingAdder: number;
  label: string;
  unit?: CatalogUnit;
}

export interface TrimRateEntry {
  ratePerLft: number;
  label: string;
  unit?: CatalogUnit;
}

export interface TileRateEntry {
  rate: number;
  label: string;
  unit?: CatalogUnit;
}

export interface DrywallRateEntry {
  rate: number;
  perRoom: boolean;
  label: string;
  unit?: CatalogUnit;
}

export interface SimpleRateEntry {
  rate: number;
  label: string;
  unit?: CatalogUnit;
}

export interface TradeRangeEntry {
  low: number;
  mid: number;
  high: number;
  label: string;
  unit?: CatalogUnit;
}

// ============================================================================
// Material Types (Good / Better / Best tiers)
// ============================================================================

export interface MaterialItem {
  name: string;
  unit: CatalogUnit;
  good: number;
  better: number;
  best: number;
  supplier?: string;
  sku?: string;
  manufacturer?: string;
  productName?: string;
  modelNumber?: string;
}

// ============================================================================
// Assembly Types (composite products)
// ============================================================================

export interface AssemblyComponent {
  type: 'material' | 'labour';
  sourceCategory: string;
  sourceKey: string;
  coverageRate: number;
}

export interface Assembly {
  name: string;
  category: string;
  unit: CatalogUnit;
  components: AssemblyComponent[];
}

// ============================================================================
// Labour Types
// ============================================================================

export interface LabourItem {
  name: string;
  unit: CatalogUnit;
  rate: number;
}

// ============================================================================
// Cost Catalog (singleton document)
// ============================================================================

export interface CostCatalog {
  id: 'cost_catalog';

  // Installed rates (combined material + labor) — drives estimate engine
  floorRates: Record<string, FloorRateEntry>;
  paintRates: Record<string, PaintRateEntry>;
  trimRates: Record<string, TrimRateEntry>;
  tileRates: Record<string, TileRateEntry>;
  drywallRates: Record<string, DrywallRateEntry>;
  doorTrimRates: Record<string, SimpleRateEntry>;
  windowTrimRates: Record<string, SimpleRateEntry>;
  hardwareRates: Record<string, SimpleRateEntry>;
  tradeRanges: Record<string, TradeRangeEntry>;
  variance: number;

  // Materials — raw material costs with Good/Better/Best tiers
  materials: Record<string, Record<string, MaterialItem>>;
  assemblies: Record<string, Assembly>;

  // Labour — labor rates by trade/task
  labour: Record<string, Record<string, LabourItem>>;

  updatedAt: string;
}
