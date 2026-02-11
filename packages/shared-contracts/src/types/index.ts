// Enums for constrained values

// ============================================================================
// Division - Hooomz Business Divisions
// ============================================================================

/**
 * Hooomz operates multiple business divisions, each with its own
 * work categories, project types, and workflows.
 *
 * Year 1: Interiors, Exteriors, DIY, Maintenance
 * Year 2: Interiors adds K&B (kitchens & bathrooms), Exteriors adds Electrical
 */
export enum Division {
  INTERIORS = 'interiors',      // Flooring, paint, trim, accent walls
  EXTERIORS = 'exteriors',      // Roofing, siding, decks, windows/doors
  DIY = 'diy',                  // Slat wall system
  MAINTENANCE = 'maintenance',  // Seasonal packages, Home Partner tier
}

// ============================================================================
// Work Category - All trades across all divisions
// ============================================================================

/**
 * Work categories represent the type of work being done.
 * Each category belongs to one or more divisions.
 * Use WORK_CATEGORY_DIVISION_MAP to filter by division.
 */
export enum WorkCategory {
  // Interiors (Year 1)
  FL = 'FL',   // Flooring - LVP, hardwood, engineered, laminate
  PT = 'PT',   // Paint - walls, ceilings, trim
  FC = 'FC',   // Finish Carpentry - baseboard, shoe molding, casing, crown
  DW = 'DW',   // Drywall - patching and repairs only for Interiors

  // Interiors (Year 2 - K&B)
  TL = 'TL',   // Tile - backsplash, bathroom tile

  // Exteriors
  RF = 'RF',   // Roofing
  SD = 'SD',   // Siding
  DK = 'DK',   // Decks
  WD = 'WD',   // Windows & Doors
  EL = 'EL',   // Electrical (Year 2)
  PL = 'PL',   // Plumbing (sub only)
  HV = 'HV',   // HVAC (sub only)

  // Construction (full builds)
  FR = 'FR',   // Framing
  FN = 'FN',   // Foundation
  IN = 'IN',   // Insulation
  CN = 'CN',   // Concrete
  ST = 'ST',   // Site Work

  // Shared
  OH = 'OH',   // Overhead - applies to all divisions
  DM = 'DM',   // Demo - applies to most divisions
}

/**
 * Maps work categories to the divisions they belong to.
 * Used for filtering categories in division-specific UIs.
 */
export const WORK_CATEGORY_DIVISION_MAP: Record<WorkCategory, Division[]> = {
  // Interiors
  [WorkCategory.FL]: [Division.INTERIORS],
  [WorkCategory.PT]: [Division.INTERIORS],
  [WorkCategory.FC]: [Division.INTERIORS],
  [WorkCategory.TL]: [Division.INTERIORS],
  [WorkCategory.DW]: [Division.INTERIORS],

  // Exteriors
  [WorkCategory.RF]: [Division.EXTERIORS],
  [WorkCategory.SD]: [Division.EXTERIORS],
  [WorkCategory.DK]: [Division.EXTERIORS],
  [WorkCategory.WD]: [Division.EXTERIORS],
  [WorkCategory.EL]: [Division.EXTERIORS],
  [WorkCategory.PL]: [Division.EXTERIORS],
  [WorkCategory.HV]: [Division.EXTERIORS],

  // Construction (used by Exteriors for full builds)
  [WorkCategory.FR]: [Division.EXTERIORS],
  [WorkCategory.FN]: [Division.EXTERIORS],
  [WorkCategory.IN]: [Division.EXTERIORS],
  [WorkCategory.CN]: [Division.EXTERIORS],
  [WorkCategory.ST]: [Division.EXTERIORS],

  // Shared
  [WorkCategory.OH]: [Division.INTERIORS, Division.EXTERIORS, Division.DIY, Division.MAINTENANCE],
  [WorkCategory.DM]: [Division.INTERIORS, Division.EXTERIORS],
};

/**
 * Work category metadata for display.
 */
export const WORK_CATEGORY_META: Record<WorkCategory, { name: string; icon: string; order: number }> = {
  [WorkCategory.FL]: { name: 'Flooring', icon: '🪵', order: 1 },
  [WorkCategory.PT]: { name: 'Paint', icon: '🎨', order: 2 },
  [WorkCategory.FC]: { name: 'Finish Carpentry', icon: '📐', order: 3 },
  [WorkCategory.TL]: { name: 'Tile', icon: '🔲', order: 4 },
  [WorkCategory.DW]: { name: 'Drywall', icon: '🧱', order: 5 },
  [WorkCategory.RF]: { name: 'Roofing', icon: '🏠', order: 10 },
  [WorkCategory.SD]: { name: 'Siding', icon: '🏡', order: 11 },
  [WorkCategory.DK]: { name: 'Decks', icon: '🌲', order: 12 },
  [WorkCategory.WD]: { name: 'Windows & Doors', icon: '🚪', order: 13 },
  [WorkCategory.EL]: { name: 'Electrical', icon: '⚡', order: 14 },
  [WorkCategory.PL]: { name: 'Plumbing', icon: '🔧', order: 15 },
  [WorkCategory.HV]: { name: 'HVAC', icon: '❄️', order: 16 },
  [WorkCategory.FR]: { name: 'Framing', icon: '🪚', order: 20 },
  [WorkCategory.FN]: { name: 'Foundation', icon: '🧱', order: 21 },
  [WorkCategory.IN]: { name: 'Insulation', icon: '🧊', order: 22 },
  [WorkCategory.CN]: { name: 'Concrete', icon: '🪨', order: 23 },
  [WorkCategory.ST]: { name: 'Site Work', icon: '🚜', order: 24 },
  [WorkCategory.OH]: { name: 'Overhead', icon: '⚙️', order: 99 },
  [WorkCategory.DM]: { name: 'Demo', icon: '🔨', order: 0 },
};

// ============================================================================
// Project Stage - Workflow stages across divisions
// ============================================================================

/**
 * Project stages represent where work is in the workflow.
 * Different divisions use different subsets of stages.
 */
export enum ProjectStage {
  // Interiors stages
  ST_DM = 'ST-DM',   // Demolition
  ST_PR = 'ST-PR',   // Prime & Prep
  ST_FN = 'ST-FN',   // Finish
  ST_PL = 'ST-PL',   // Punch List
  ST_CL = 'ST-CL',   // Closeout

  // Exteriors/Construction stages
  ST_SITE = 'ST-SITE',       // Site Prep
  ST_FOUND = 'ST-FOUND',     // Foundation
  ST_FRAME = 'ST-FRAME',     // Framing
  ST_ROUGH = 'ST-ROUGH',     // Rough-In (MEP)
  ST_INSUL = 'ST-INSUL',     // Insulation
  ST_DRY = 'ST-DRY',         // Drywall
  ST_EXT = 'ST-EXT',         // Exterior finishing
  ST_INT = 'ST-INT',         // Interior finishing
  ST_FINAL = 'ST-FINAL',     // Final/Closeout
}

/**
 * Maps project stages to divisions.
 */
export const PROJECT_STAGE_DIVISION_MAP: Record<ProjectStage, Division[]> = {
  // Interiors workflow
  [ProjectStage.ST_DM]: [Division.INTERIORS],
  [ProjectStage.ST_PR]: [Division.INTERIORS],
  [ProjectStage.ST_FN]: [Division.INTERIORS],
  [ProjectStage.ST_PL]: [Division.INTERIORS, Division.EXTERIORS],
  [ProjectStage.ST_CL]: [Division.INTERIORS, Division.EXTERIORS],

  // Exteriors/Construction workflow
  [ProjectStage.ST_SITE]: [Division.EXTERIORS],
  [ProjectStage.ST_FOUND]: [Division.EXTERIORS],
  [ProjectStage.ST_FRAME]: [Division.EXTERIORS],
  [ProjectStage.ST_ROUGH]: [Division.EXTERIORS],
  [ProjectStage.ST_INSUL]: [Division.EXTERIORS],
  [ProjectStage.ST_DRY]: [Division.EXTERIORS],
  [ProjectStage.ST_EXT]: [Division.EXTERIORS],
  [ProjectStage.ST_INT]: [Division.EXTERIORS],
  [ProjectStage.ST_FINAL]: [Division.EXTERIORS],
};

/**
 * Stage metadata for display.
 */
export const PROJECT_STAGE_META: Record<ProjectStage, { name: string; order: number }> = {
  [ProjectStage.ST_DM]: { name: 'Demolition', order: 1 },
  [ProjectStage.ST_PR]: { name: 'Prime & Prep', order: 2 },
  [ProjectStage.ST_FN]: { name: 'Finish', order: 3 },
  [ProjectStage.ST_PL]: { name: 'Punch List', order: 4 },
  [ProjectStage.ST_CL]: { name: 'Closeout', order: 5 },
  [ProjectStage.ST_SITE]: { name: 'Site Prep', order: 1 },
  [ProjectStage.ST_FOUND]: { name: 'Foundation', order: 2 },
  [ProjectStage.ST_FRAME]: { name: 'Framing', order: 3 },
  [ProjectStage.ST_ROUGH]: { name: 'Rough-In', order: 4 },
  [ProjectStage.ST_INSUL]: { name: 'Insulation', order: 5 },
  [ProjectStage.ST_DRY]: { name: 'Drywall', order: 6 },
  [ProjectStage.ST_EXT]: { name: 'Exterior', order: 7 },
  [ProjectStage.ST_INT]: { name: 'Interior', order: 8 },
  [ProjectStage.ST_FINAL]: { name: 'Final', order: 9 },
};

// ============================================================================
// Interiors Bundle Types (Project Types for Interiors division)
// ============================================================================

export enum InteriorsBundle {
  FLOOR_REFRESH = 'floor-refresh',     // LVP + Baseboard (~$5,400)
  ROOM_REFRESH = 'room-refresh',       // LVP + Paint + Baseboard (~$8,200)
  FULL_INTERIOR = 'full-interior',     // LVP + Paint + Trim + Doors (~$11,800)
  ACCENT_PACKAGE = 'accent-package',   // Board & batten, wainscoting, picture frame, wallpaper
  CUSTOM = 'custom',                   // Custom scope
}

export const INTERIORS_BUNDLE_META: Record<InteriorsBundle, { name: string; description: string; workCategories: WorkCategory[] }> = {
  [InteriorsBundle.FLOOR_REFRESH]: {
    name: 'Floor Refresh',
    description: 'LVP flooring + new baseboard',
    workCategories: [WorkCategory.FL, WorkCategory.FC],
  },
  [InteriorsBundle.ROOM_REFRESH]: {
    name: 'Room Refresh',
    description: 'LVP flooring + paint + baseboard',
    workCategories: [WorkCategory.FL, WorkCategory.PT, WorkCategory.FC],
  },
  [InteriorsBundle.FULL_INTERIOR]: {
    name: 'Full Interior',
    description: 'LVP flooring + paint + full trim package + doors',
    workCategories: [WorkCategory.FL, WorkCategory.PT, WorkCategory.FC, WorkCategory.DW],
  },
  [InteriorsBundle.ACCENT_PACKAGE]: {
    name: 'Accent Package',
    description: 'Board & batten, wainscoting, picture frame molding, accent wallpaper',
    workCategories: [WorkCategory.FC, WorkCategory.PT],
  },
  [InteriorsBundle.CUSTOM]: {
    name: 'Custom',
    description: 'Custom scope of work',
    workCategories: [],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get work categories that belong to a specific division.
 */
export function getWorkCategoriesForDivision(division: Division): WorkCategory[] {
  return Object.entries(WORK_CATEGORY_DIVISION_MAP)
    .filter(([_, divisions]) => divisions.includes(division))
    .map(([code]) => code as WorkCategory)
    .sort((a, b) => WORK_CATEGORY_META[a].order - WORK_CATEGORY_META[b].order);
}

/**
 * Get project stages that belong to a specific division.
 */
export function getStagesForDivision(division: Division): ProjectStage[] {
  return Object.entries(PROJECT_STAGE_DIVISION_MAP)
    .filter(([_, divisions]) => divisions.includes(division))
    .map(([code]) => code as ProjectStage)
    .sort((a, b) => PROJECT_STAGE_META[a].order - PROJECT_STAGE_META[b].order);
}

/**
 * Check if a work category belongs to a division.
 */
export function isCategoryInDivision(category: WorkCategory, division: Division): boolean {
  return WORK_CATEGORY_DIVISION_MAP[category]?.includes(division) ?? false;
}

/**
 * Check if a stage belongs to a division.
 */
export function isStageInDivision(stage: ProjectStage, division: Division): boolean {
  return PROJECT_STAGE_DIVISION_MAP[stage]?.includes(division) ?? false;
}

// ============================================================================
// Original Enums (kept for backward compatibility)
// ============================================================================

export enum ProjectStatus {
  LEAD = 'lead',
  QUOTED = 'quoted',
  APPROVED = 'approved',
  IN_PROGRESS = 'in-progress',
  ON_HOLD = 'on-hold',
  COMPLETE = 'complete',
  CANCELLED = 'cancelled',
}

export enum ProjectType {
  NEW_CONSTRUCTION = 'new-construction',
  RENOVATION = 'renovation',
  ADDITION = 'addition',
  KITCHEN_REMODEL = 'kitchen-remodel',
  BATHROOM_REMODEL = 'bathroom-remodel',
  BASEMENT_FINISHING = 'basement-finishing',
  DECK_CONSTRUCTION = 'deck-construction',
  ROOFING = 'roofing',
  SIDING = 'siding',
  WINDOWS_DOORS = 'windows-doors',
  FLOORING = 'flooring',
  PAINTING = 'painting',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  LANDSCAPING = 'landscaping',
  OTHER = 'other',
}

export enum TaskStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  BLOCKED = 'blocked',
  COMPLETE = 'complete',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  PASSED = 'passed',
  FAILED = 'failed',
  PENDING_REINSPECTION = 'pending-reinspection',
}

export enum InspectionType {
  INITIAL = 'initial',
  PROGRESS = 'progress',
  FINAL = 'final',
  FRAMING = 'framing',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  INSULATION = 'insulation',
  DRYWALL = 'drywall',
  FOUNDATION = 'foundation',
  ROOFING = 'roofing',
  HVAC = 'hvac',
  BUILDING_CODE = 'building-code',
  SAFETY = 'safety',
  OTHER = 'other',
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  TEXT = 'text',
  IN_PERSON = 'in-person',
}

export enum UnitOfMeasure {
  SQUARE_FOOT = 'sqft',
  LINEAR_FOOT = 'lf',
  CUBIC_YARD = 'cy',
  EACH = 'each',
  HOUR = 'hour',
  DAY = 'day',
  LOT = 'lot',
  GALLON = 'gal',
  POUND = 'lb',
  TON = 'ton',
  BUNDLE = 'bundle',
  BOX = 'box',
  BAG = 'bag',
}

export enum CostCategory {
  SITE_WORK = 'site-work',
  FOUNDATION = 'foundation',
  FRAMING = 'framing',
  EXTERIOR = 'exterior',
  ROOFING = 'roofing',
  WINDOWS_DOORS = 'windows-doors',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HVAC = 'hvac',
  INSULATION = 'insulation',
  DRYWALL = 'drywall',
  INTERIOR_TRIM = 'interior-trim',
  FLOORING = 'flooring',
  PAINTING = 'painting',
  CABINETS_COUNTERTOPS = 'cabinets-countertops',
  APPLIANCES = 'appliances',
  FIXTURES = 'fixtures',
  LANDSCAPING = 'landscaping',
  PERMITS_FEES = 'permits-fees',
  LABOR = 'labor',
  MATERIALS = 'materials',
  EQUIPMENT_RENTAL = 'equipment-rental',
  SUBCONTRACTORS = 'subcontractors',
  CONTINGENCY = 'contingency',
  OTHER = 'other',
}

// NOTE: Core entity types (Project, Customer, Task, LineItem, Inspection, Address, Metadata)
// are now inferred from Zod schemas in ../schemas/index.ts
// Import those types from the schemas file or from the root index.ts

// Labs types
export * from './labs';

// Integration types (Data Spine)
export * from './integration';
