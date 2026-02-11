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
