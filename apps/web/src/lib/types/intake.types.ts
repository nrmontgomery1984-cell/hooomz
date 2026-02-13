/**
 * Intake Form Types - HOOOMZ INTERIORS
 *
 * This app serves Hooomz Interiors (flooring, paint, trim, tile, drywall).
 * Types here are scoped to Interiors-only work categories and stages.
 *
 * Work Categories: FL (Flooring), PT (Paint), FC (Finish Carpentry), TL (Tile), DW (Drywall), OH (Overhead)
 * Stages: ST-DM (Demo), ST-PR (Prime & Prep), ST-FN (Finish), ST-PL (Punch List), ST-CL (Closeout)
 *
 * For the full ecosystem types (including Exteriors), see @hooomz/shared-contracts.
 */

// =============================================================================
// Three-Axis Tagging (Required on all loops and tasks)
// =============================================================================

export interface ThreeAxisTags {
  work_category_code: string;  // "FL", "PT", "FC", "TL", "DW", "OH" (Interiors codes)
  stage_code: string;          // "ST-DM", "ST-PR", "ST-FN", "ST-PL", "ST-CL"
  location_id: string;         // "loc-kitchen", "loc-master-bath", etc.
}

// =============================================================================
// Tier Systems
// =============================================================================

/** Scope Tier: How much work to do (per room) */
export type ScopeTier = 'refresh' | 'full';

/** Quality Tier: What quality level (per item/selection) */
export type QualityTier = 'good' | 'better' | 'best';

export interface RoomScopeTier {
  room_id: string;
  room_name: string;
  scope_tier: ScopeTier;
  price_range?: { low: number; high: number };
}

// =============================================================================
// Per-Room Scope Details (Intake Refinement 2/3)
// =============================================================================

export interface FlooringScope {
  enabled: boolean;
  type: 'lvp' | 'hardwood' | 'engineered' | 'laminate' | 'tile' | 'carpet';
  condition: 'new_subfloor' | 'over_existing' | 'remove_replace';
  scope: 'full_room' | 'partial';
  sqft_override?: number;
}

export interface PaintScope {
  enabled: boolean;
  surfaces: ('walls' | 'ceiling' | 'trim')[];
  prep: 'minimal' | 'standard' | 'extensive';
  coats: 1 | 2 | 3;
}

export interface TrimScope {
  enabled: boolean;
  items: ('baseboard' | 'casing' | 'crown' | 'shoe' | 'wainscoting')[];
  action: 'replace' | 'new_install' | 'repair_repaint';
  lf_override?: number;
}

export interface TileScope {
  enabled: boolean;
  surfaces: ('floor' | 'walls' | 'backsplash')[];
  sqft_override?: number;
}

export interface DrywallScope {
  enabled: boolean;
  extent: 'patch' | 'skim_coat' | 'full_replacement';
  sqft_override?: number;
}

// =============================================================================
// Per-Trade Material Selections (Intake Refinement 3/3)
// =============================================================================

export type PaintFinish = 'flat' | 'matte' | 'eggshell' | 'satin' | 'semi_gloss' | 'gloss';
export type TrimProfile = 'colonial' | 'craftsman' | 'modern_flat' | 'ogee' | 'ranch' | 'custom';
export type TrimMaterialType = 'mdf' | 'pine' | 'poplar' | 'oak' | 'pvc';
export type TileType = 'ceramic' | 'porcelain' | 'natural_stone' | 'glass' | 'mosaic';
export type TilePattern = 'straight' | 'offset' | 'herringbone' | 'diagonal';

export interface FlooringMaterial {
  category: 'lvp' | 'hardwood' | 'laminate' | 'tile' | 'carpet' | 'other';
  product?: string;
  sku?: string;
  color?: string;
  grade?: QualityTier;
  pricePerSqft?: number;
  notes?: string;
}

export interface PaintMaterial {
  brand?: string;
  product?: string;
  finish: PaintFinish;
  colors: {
    walls?: string;
    ceiling?: string;
    trim?: string;
    accent?: string;
  };
  notes?: string;
}

export interface TrimMaterial {
  profile: TrimProfile;
  material: TrimMaterialType;
  width?: string;
  finish: 'paint_grade' | 'stain_grade' | 'prefinished';
  notes?: string;
}

export interface TileMaterial {
  type: TileType;
  size?: string;
  color?: string;
  grout_color?: string;
  pattern?: TilePattern;
  notes?: string;
}

// =============================================================================
// Room Photos (Intake Refinement 3/3)
// =============================================================================

export type PhotoTradeTag = 'flooring' | 'paint' | 'trim' | 'tile' | 'drywall' | 'general';

export interface RoomPhoto {
  id: string;
  dataUrl: string;
  caption?: string;
  trade?: PhotoTradeTag;
  timestamp: string;
}

export interface RoomTradeScopes {
  flooring?: FlooringScope;
  paint?: PaintScope;
  trim?: TrimScope;
  tile?: TileScope;
  drywall?: DrywallScope;
}

// Per-trade material selections (attached to room, not trade scope)
export interface RoomMaterials {
  flooring?: FlooringMaterial;
  paint?: PaintMaterial;
  trim?: TrimMaterial;
  tile?: TileMaterial;
}

export interface RoomMeasurements {
  length_ft?: number;
  width_ft?: number;
  height_ft?: number;
  sqft?: number;          // auto = length * width, or manual override
  perimeter_lf?: number;  // auto = 2*(length+width), or manual override
}

export interface RoomScope {
  id: string;              // matches ROOM_LOCATIONS key: "loc-kitchen"
  name: string;            // display name: "Kitchen"
  measurements: RoomMeasurements;
  priority: 'high' | 'medium' | 'low';
  trades: RoomTradeScopes;
  materials?: RoomMaterials;
  photos?: RoomPhoto[];
  notes?: string;
}

/** Default trade scopes based on bundle type */
export function getDefaultTradesForBundle(
  bundle: InteriorsBundle,
  roomId?: string
): RoomTradeScopes {
  const WET_ROOMS = ['loc-master-bath', 'loc-guest-bath', 'loc-kitchen', 'loc-laundry'];
  const isWet = roomId ? WET_ROOMS.includes(roomId) : false;

  switch (bundle) {
    case 'floor_refresh':
      return {
        flooring: { enabled: true, type: 'lvp', condition: 'remove_replace', scope: 'full_room' },
        trim: { enabled: true, items: ['baseboard'], action: 'replace' },
      };
    case 'room_refresh':
      return {
        flooring: { enabled: true, type: 'lvp', condition: 'remove_replace', scope: 'full_room' },
        paint: { enabled: true, surfaces: ['walls', 'ceiling'], prep: 'standard', coats: 2 },
        trim: { enabled: true, items: ['baseboard'], action: 'replace' },
      };
    case 'full_interior':
      return {
        flooring: { enabled: true, type: 'lvp', condition: 'remove_replace', scope: 'full_room' },
        paint: { enabled: true, surfaces: ['walls', 'ceiling', 'trim'], prep: 'standard', coats: 2 },
        trim: { enabled: true, items: ['baseboard', 'casing', 'crown', 'shoe'], action: 'replace' },
        drywall: { enabled: true, extent: 'patch' },
        ...(isWet ? { tile: { enabled: true, surfaces: ['floor', 'walls'] } } : {}),
      };
    case 'custom':
    default:
      return {};
  }
}

/** Get default trade scopes from enabled trade codes (contractor flow) */
export function getDefaultTradesFromCodes(tradeCodes: string[]): RoomTradeScopes {
  const trades: RoomTradeScopes = {};
  if (tradeCodes.includes('FL')) {
    trades.flooring = { enabled: true, type: 'lvp', condition: 'remove_replace', scope: 'full_room' };
  }
  if (tradeCodes.includes('PT')) {
    trades.paint = { enabled: true, surfaces: ['walls', 'ceiling'], prep: 'standard', coats: 2 };
  }
  if (tradeCodes.includes('FC')) {
    trades.trim = { enabled: true, items: ['baseboard'], action: 'replace' };
  }
  if (tradeCodes.includes('TL')) {
    trades.tile = { enabled: true, surfaces: ['floor'] };
  }
  if (tradeCodes.includes('DW')) {
    trades.drywall = { enabled: true, extent: 'patch' };
  }
  return trades;
}

/** Get active trade codes from a RoomTradeScopes object */
export function getActiveTradesFromScopes(trades: RoomTradeScopes): string[] {
  const active: string[] = [];
  if (trades.flooring?.enabled) active.push('FL');
  if (trades.paint?.enabled) active.push('PT');
  if (trades.trim?.enabled) active.push('FC');
  if (trades.tile?.enabled) active.push('TL');
  if (trades.drywall?.enabled) active.push('DW');
  return active;
}

export interface MaterialSelection {
  category: string;          // "flooring", "paint", "trim", "tile" (Interiors categories)
  subcategory?: string;
  selected_option: string;
  quality_tier: QualityTier;
  manufacturer?: string;
  model?: string;
  unit_cost?: number;
}

// =============================================================================
// Project Types
// =============================================================================

/**
 * INTERIORS Bundle Types
 * These are the project types for Hooomz Interiors.
 *
 * Floor Refresh (~$5,400): Flooring + baseboard
 * Room Refresh (~$8,200): Flooring + paint + baseboard
 * Full Interior (~$11,800): Flooring + paint + full trim + tile (wet areas) + drywall
 * Custom: Pick specific trades
 */
export type InteriorsBundle =
  | 'floor_refresh'    // FL + basic FC (~$5,400)
  | 'room_refresh'     // FL + PT + basic FC (~$8,200)
  | 'full_interior'    // FL + PT + FC + TL + DW (~$11,800)
  | 'custom';          // Custom scope

/** @deprecated Use InteriorsBundle instead for Interiors projects */
export type ProjectType =
  | 'floor_refresh'
  | 'room_refresh'
  | 'full_interior'
  | 'custom';

export type SpecLevel = 'good' | 'better' | 'best';

// =============================================================================
// Homeowner Intake Data (4 steps)
// =============================================================================

export interface HomeownerIntakeData {
  // Step 1: Client & Property
  contact: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    preferred_contact: 'email' | 'phone' | 'text';
  };

  // Step 2: Bundle + Address + Rooms
  project: {
    name: string;
    address: {
      street: string;
      city: string;
      province: string;
      postal_code: string;
    };
    project_type: ProjectType;
    selected_rooms: string[];  // ["kitchen", "master-bath", "living"]
    room_scopes?: RoomScope[]; // detailed per-room scope with measurements
  };

  // Step 4: Notes
  notes: {
    special_requests?: string;
  };
}

// =============================================================================
// Contractor Intake Data (4 steps - more efficient)
// =============================================================================

export interface ScopeItem {
  id: string;
  trade_code: string;         // "FL", "PT", "FC"
  category: string;           // "rough", "finish"
  item_name: string;
  quantity: number;
  unit: string;               // "sqft", "lf", "ea"
  assembly_id?: string;       // Link to cost catalog
  notes?: string;

  // Three-axis tags
  work_category_code: string;
  stage_code: string;
  location_id: string;

  // Pipeline-ready fields (Build 3b integration)
  sopCodes?: string[];
  isLooped?: boolean;
  loopContextLabel?: string;
  estimatedHoursPerUnit?: number;

  // Material enrichment (Intake Refinement 3/3)
  materialDescription?: string;   // e.g., "Lifeproof Sterling Oak (Natural Oak)"
  materialCostPerUnit?: number;   // overrides default cost lookup when set
  catalogSku?: string;            // links to catalog item by SKU
}

export interface ContractorIntakeData {
  // Step 1: Project Info
  project: {
    name: string;
    address: {
      street: string;
      city: string;
      province: string;
      postal_code: string;
    };
    project_type: ProjectType;
    spec_level: SpecLevel;
    storeys: number;
    has_basement: boolean;
    ceiling_heights: Record<string, number>;
    notes?: string;
  };

  // Optional client info
  client?: {
    name: string;
    email?: string;
    phone?: string;
  };

  // Step 2: Scope (organized by trade)
  scope: {
    enabled_trades: string[];  // ["FL", "PT", "FC", "DW"]
    items: ScopeItem[];
    room_scopes?: RoomScope[]; // detailed per-room scope with measurements
  };

  // Step 3: Schedule
  schedule: {
    estimated_start?: string;
    estimated_duration_weeks?: number;
    phases?: Array<{
      name: string;
      duration_weeks: number;
      dependencies?: string[];
    }>;
  };

  // Calculated estimates
  estimates?: {
    low: number;
    high: number;
    confidence: 'verified' | 'limited' | 'estimate';
  };
}

// =============================================================================
// Generated Project Data (output of intake processing)
// =============================================================================

export interface GeneratedLoop extends ThreeAxisTags {
  id: string;
  name: string;
  parent_id: string | null;
  loop_type: 'trade' | 'stage' | 'location';
  status: 'not-started' | 'in-progress' | 'complete';
  health_score: number;
}

export interface GeneratedTask extends ThreeAxisTags {
  id: string;
  loop_id: string;
  title: string;
  description?: string;
  status: 'not-started' | 'in-progress' | 'blocked' | 'complete';
  estimated_hours?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source_scope_item_id?: string;
}

export interface IntakeResult {
  project_id: string;
  loops: GeneratedLoop[];
  tasks: GeneratedTask[];
  estimate_id?: string;
  activity_events: string[];  // IDs of created events
}

// =============================================================================
// Trade/Category Reference Data
// =============================================================================

/**
 * INTERIORS Work Category Codes
 * From SOP training system: FL-01 to FL-08, PT-01 to PT-03, FC-01 to FC-08, etc.
 */
export const TRADE_CODES = {
  'FL': { name: 'Flooring', icon: '🪵', order: 1 },
  'PT': { name: 'Paint', icon: '🎨', order: 2 },
  'FC': { name: 'Finish Carpentry', icon: '📐', order: 3 },
  'TL': { name: 'Tile', icon: '🔲', order: 4 },
  'DW': { name: 'Drywall', icon: '🧱', order: 5 },
  'OH': { name: 'Overhead', icon: '⚙️', order: 6 },
} as const;

/**
 * INTERIORS Project Stage Codes
 * From three-axis model: Demolition → Prime & Prep → Finish → Punch List → Closeout
 */
export const STAGE_CODES = {
  'ST-DM': { name: 'Demolition', order: 1 },
  'ST-PR': { name: 'Prime & Prep', order: 2 },
  'ST-FN': { name: 'Finish', order: 3 },
  'ST-PL': { name: 'Punch List', order: 4 },
  'ST-CL': { name: 'Closeout', order: 5 },
} as const;

export const ROOM_LOCATIONS = {
  'loc-general': { name: 'General', icon: '🏠' },
  'loc-kitchen': { name: 'Kitchen', icon: '🍳' },
  'loc-master-bath': { name: 'Master Bath', icon: '🛁' },
  'loc-master-bed': { name: 'Master Bedroom', icon: '🛏️' },
  'loc-living': { name: 'Living Room', icon: '🛋️' },
  'loc-dining': { name: 'Dining Room', icon: '🍽️' },
  'loc-guest-bath': { name: 'Guest Bath', icon: '🚿' },
  'loc-guest-bed': { name: 'Guest Bedroom', icon: '🛏️' },
  'loc-basement': { name: 'Basement', icon: '⬇️' },
  'loc-garage': { name: 'Garage', icon: '🚗' },
  'loc-laundry': { name: 'Laundry', icon: '🧺' },
  'loc-office': { name: 'Office', icon: '💼' },
  'loc-hallway': { name: 'Hallway', icon: '🚪' },
  'loc-entryway': { name: 'Entryway', icon: '🚪' },
} as const;
