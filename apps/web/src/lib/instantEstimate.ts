/**
 * Instant Estimate Engine
 *
 * Calculates a rough ballpark range for lead capture.
 * This is NOT a detailed estimate — it's a confidence-building marketing tool.
 *
 * Two modes:
 *   1. Sqft-based (preferred): actual room dimensions × per-sqft material rates
 *   2. Room-count fallback: room count × flat per-room averages
 *
 * Per-sqft rates derived from SCOPE_ITEM_COSTS in intake.service.ts
 * and the estimating catalog (Moncton NB market, 2026).
 *
 * The Labs flywheel will sharpen these over time as more jobs complete.
 *
 * Rates are editable via the admin Cost Catalogue (/admin/rates).
 * All calculate functions accept an optional CostCatalog parameter;
 * when omitted they fall back to DEFAULT_COST_CATALOG (hardcoded defaults).
 */

import type { CostCatalog, Assembly } from './types/costCatalog.types';

// ============================================================================
// Types
// ============================================================================

export interface RoomInput {
  name: string;
  lengthFt: number;
  widthFt: number;
  sqft: number;       // lengthFt × widthFt
}

export type FlooringMaterialPref = 'lvp' | 'hardwood' | 'laminate' | 'carpet' | 'tile' | 'not_sure';
export type PaintScopePref = 'walls' | 'walls_ceiling' | 'full';
export type TrimScopePref = 'baseboard' | 'casing' | 'crown' | 'other';
export type TileScopePref = 'floor' | 'backsplash' | 'shower' | 'not_sure';
export type DrywallScopePref = 'patches' | 'accent' | 'full_room';

export interface MaterialPreferences {
  floors?: FlooringMaterialPref;
  paint?: PaintScopePref;
  trim?: TrimScopePref;
  tile?: TileScopePref;
  drywall?: DrywallScopePref;
}

export interface DoorWindowInput {
  exteriorDoors: number;
  interiorDoors: number;
  closetDoors: number;
  patioDoors: number;
  windowsSmall: number;
  windowsMedium: number;
  windowsLarge: number;
  replaceHardware: boolean;
  replaceKnobs: boolean;
}

export interface SqftEstimateInput {
  rooms: RoomInput[];
  materials: MaterialPreferences;
  scopeTags: string[];
  doorWindows?: DoorWindowInput;
}

export interface InstantEstimateInput {
  scopeTags: string[];  // ['floors', 'paint', 'trim', 'tile', 'drywall', 'full_refresh', 'not_sure']
  roomCount: number;    // 1-8+, or 0 = whole floor (defaults to 6)
}

export interface InstantEstimateResult {
  low: number;
  mid: number;
  high: number;
  description: string;  // "LVP flooring + interior paint across 3 rooms (540 sqft)"
}

/** Per-trade line item for estimate breakdown display */
export interface EstimateLineItem {
  trade: string;        // 'Floors', 'Paint', 'Trim', etc.
  material: string;     // 'LVP', 'Walls + Ceiling', etc.
  quantity: number;
  unit: string;         // 'sqft', 'lft', 'rooms'
  rate: number;         // $/unit
  total: number;        // quantity × rate
}

export interface EstimateBreakdown {
  lines: EstimateLineItem[];
  totalMid: number;
  low: number;
  high: number;
  totalSqft: number;
  roomCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const WALL_HEIGHT_FT = 8;
const FULL_REFRESH_TRADES = ['floors', 'paint', 'trim'];
const NOT_SURE_TRADES = ['floors', 'paint'];
const WHOLE_FLOOR_DEFAULT_ROOMS = 6;
const VARIANCE = 0.25; // ±25% for low/high range

// ============================================================================
// Default Cost Catalogue — editable via /admin/rates
// ============================================================================

export const DEFAULT_COST_CATALOG: CostCatalog = {
  id: 'cost_catalog',
  floorRates: {
    lvp:       { rate: 6,  label: 'LVP flooring', unit: 'sqft' },
    hardwood:  { rate: 11, label: 'hardwood flooring', unit: 'sqft' },
    laminate:  { rate: 5,  label: 'laminate flooring', unit: 'sqft' },
    carpet:    { rate: 4,  label: 'carpet', unit: 'sqft' },
    tile:      { rate: 12, label: 'tile flooring', unit: 'sqft' },
    not_sure:  { rate: 7,  label: 'flooring', unit: 'sqft' },
  },
  paintRates: {
    walls:         { ratePerWallSqft: 1.50, ceilingAdder: 0,    label: 'wall paint', unit: 'sqft' },
    walls_ceiling: { ratePerWallSqft: 1.50, ceilingAdder: 1.25, label: 'walls + ceiling paint', unit: 'sqft' },
    full:          { ratePerWallSqft: 1.75, ceilingAdder: 1.25, label: 'full paint', unit: 'sqft' },
  },
  trimRates: {
    baseboard: { ratePerLft: 5.00,  label: 'baseboard', unit: 'lft' },
    casing:    { ratePerLft: 8.00,  label: 'door & window casing', unit: 'lft' },
    crown:     { ratePerLft: 7.50,  label: 'crown molding', unit: 'lft' },
    other:     { ratePerLft: 6.00,  label: 'trim', unit: 'lft' },
  },
  tileRates: {
    floor:      { rate: 14, label: 'floor tile', unit: 'sqft' },
    backsplash: { rate: 18, label: 'backsplash tile', unit: 'sqft' },
    shower:     { rate: 22, label: 'shower tile', unit: 'sqft' },
    not_sure:   { rate: 16, label: 'tile', unit: 'sqft' },
  },
  drywallRates: {
    patches:   { rate: 200,  perRoom: true,  label: 'drywall patches', unit: 'room' },
    accent:    { rate: 350,  perRoom: true,  label: 'accent wall', unit: 'room' },
    full_room: { rate: 5.50, perRoom: false, label: 'drywall', unit: 'sqft' },
  },
  doorTrimRates: {
    exterior: { rate: 180, label: 'exterior door casing', unit: 'each' },
    interior: { rate: 120, label: 'interior door casing', unit: 'each' },
    closet:   { rate: 90,  label: 'closet door casing', unit: 'each' },
    patio:    { rate: 250, label: 'patio door casing', unit: 'each' },
  },
  windowTrimRates: {
    small:  { rate: 65,  label: 'small window trim', unit: 'each' },
    medium: { rate: 95,  label: 'medium window trim', unit: 'each' },
    large:  { rate: 140, label: 'large window trim', unit: 'each' },
  },
  hardwareRates: {
    hardware: { rate: 45, label: 'door hardware (hinges + handles)', unit: 'each' },
    knobs:    { rate: 25, label: 'door knobs', unit: 'each' },
  },
  tradeRanges: {
    floors:  { low: 800,  mid: 1200, high: 1800, label: 'flooring', unit: 'room' },
    paint:   { low: 500,  mid: 750,  high: 1100, label: 'paint', unit: 'room' },
    trim:    { low: 250,  mid: 425,  high: 600,  label: 'trim', unit: 'room' },
    tile:    { low: 1200, mid: 1800, high: 2800, label: 'tile', unit: 'room' },
    drywall: { low: 600,  mid: 900,  high: 1400, label: 'drywall', unit: 'room' },
  },
  variance: VARIANCE,

  // Materials — raw material costs with Good/Better/Best tiers (NB market, 2026)
  materials: {
    flooring: {
      laminate:      { name: 'Laminate Flooring', unit: 'sqft', good: 1.49, better: 2.49, best: 4.49, supplier: 'Kent', manufacturer: 'Mohawk', productName: 'RevWood Select', modelNumber: 'REV24' },
      lvp:           { name: 'Vinyl Plank (LVP)', unit: 'sqft', good: 2.49, better: 3.99, best: 5.99, supplier: 'Kent', manufacturer: 'Shaw', productName: 'Endura Plus', modelNumber: 'SPC-EP-7' },
      hardwood:      { name: 'Hardwood Flooring', unit: 'sqft', good: 4.99, better: 6.99, best: 10.99, supplier: 'Kent', manufacturer: 'Lauzon', productName: 'Essential Red Oak', modelNumber: 'ERO-34' },
      carpet:        { name: 'Carpet', unit: 'sqft', good: 1.50, better: 2.50, best: 4.00, supplier: 'Kent', manufacturer: 'Shaw', productName: 'LifeGuard Waterproof', modelNumber: 'LG-WP-28' },
      underlayment:  { name: 'Underlayment', unit: 'sqft', good: 0.39, better: 0.59, best: 0.89, supplier: 'Kent', manufacturer: 'DMX', productName: '1-Step Underlayment', modelNumber: 'DMX-1STEP' },
      transition:    { name: 'T-Molding Transition', unit: 'each', good: 8.99, better: 12.99, best: 18.99, supplier: 'Kent', manufacturer: 'Mohawk', productName: 'T-Molding', modelNumber: 'TM-72' },
    },
    paint: {
      interior_paint: { name: 'Interior Paint', unit: 'gal', good: 32.00, better: 42.99, best: 64.99, supplier: 'Home Hardware', manufacturer: 'Beauti-Tone', productName: 'Signature Series', modelNumber: 'BT-SIG-INT' },
      exterior_paint: { name: 'Exterior Paint', unit: 'gal', good: 39.99, better: 54.99, best: 74.99, supplier: 'Home Hardware', manufacturer: 'Beauti-Tone', productName: 'Designer Series Exterior', modelNumber: 'BT-DSE-EXT' },
      primer:         { name: 'Primer', unit: 'gal', good: 19.99, better: 29.99, best: 39.99, supplier: 'Home Hardware', manufacturer: 'Beauti-Tone', productName: 'Premium Primer', modelNumber: 'BT-PRM-100' },
      tape:           { name: "Painter's Tape", unit: 'roll', good: 4.99, better: 6.99, best: 9.99, supplier: 'Home Hardware', manufacturer: 'FrogTape', productName: 'Multi-Surface', modelNumber: 'FT-MS-36' },
      drop_cloth:     { name: 'Drop Cloth', unit: 'each', good: 3.49, better: 4.99, best: 8.99, supplier: 'Home Hardware', manufacturer: 'Bennett', productName: 'Canvas Drop Cloth', modelNumber: 'BEN-DC-9x12' },
    },
    trim: {
      baseboard_3_5:  { name: 'MDF Baseboard 3.5"', unit: 'lft', good: 0.89, better: 1.29, best: 2.49, supplier: 'Kent', manufacturer: 'Metrie', productName: 'MDF Colonial Base', modelNumber: 'MET-CB-312' },
      baseboard_5_25: { name: 'MDF Baseboard 5.25"', unit: 'lft', good: 1.49, better: 2.49, best: 3.99, supplier: 'Kent', manufacturer: 'Metrie', productName: 'MDF Modern Base', modelNumber: 'MET-MB-514' },
      door_casing:    { name: 'Door Casing', unit: 'lft', good: 1.19, better: 1.89, best: 3.29, supplier: 'Kent', manufacturer: 'Metrie', productName: 'Colonial Casing', modelNumber: 'MET-CC-212' },
      crown:          { name: 'Crown Moulding', unit: 'lft', good: 2.49, better: 3.49, best: 5.99, supplier: 'Kent', manufacturer: 'Metrie', productName: 'MDF Crown', modelNumber: 'MET-CR-358' },
      shoe:           { name: 'Shoe Moulding', unit: 'lft', good: 0.49, better: 0.79, best: 1.29, supplier: 'Kent', manufacturer: 'Metrie', productName: 'MDF Shoe', modelNumber: 'MET-SH-34' },
      quarter_round:  { name: 'Quarter Round', unit: 'lft', good: 0.39, better: 0.69, best: 1.09, supplier: 'Kent', manufacturer: 'Metrie', productName: 'MDF Quarter Round', modelNumber: 'MET-QR-34' },
    },
    tile: {
      floor_tile:      { name: 'Floor Tile', unit: 'sqft', good: 2.99, better: 4.99, best: 9.99, supplier: 'Kent', manufacturer: 'Centura', productName: 'Porcelain Floor Tile', modelNumber: 'CEN-PF-12' },
      wall_tile:       { name: 'Wall Tile', unit: 'sqft', good: 2.49, better: 4.49, best: 8.99, supplier: 'Kent', manufacturer: 'Centura', productName: 'Ceramic Wall Tile', modelNumber: 'CEN-CW-08' },
      backsplash_tile: { name: 'Backsplash Tile', unit: 'sqft', good: 3.99, better: 6.99, best: 14.99, supplier: 'Kent', manufacturer: 'Centura', productName: 'Mosaic Backsplash', modelNumber: 'CEN-MB-12' },
      adhesive:        { name: 'Tile Adhesive (Thinset)', unit: 'bag', good: 19.99, better: 29.99, best: 39.99, supplier: 'Kent', manufacturer: 'Mapei', productName: 'Kerabond T', modelNumber: 'MAP-KBT-50' },
      grout:           { name: 'Grout', unit: 'bag', good: 9.99, better: 14.99, best: 24.99, supplier: 'Kent', manufacturer: 'Mapei', productName: 'Keracolor U', modelNumber: 'MAP-KCU-25' },
      spacers:         { name: 'Spacers', unit: 'bag', good: 2.99, better: 4.99, best: 7.99, supplier: 'Kent', manufacturer: 'QEP', productName: 'Tile Spacers', modelNumber: 'QEP-TS-316' },
      ditra:           { name: 'Ditra Membrane', unit: 'sqft', good: 3.50, better: 4.25, best: 5.50, supplier: 'Kent', manufacturer: 'Schluter', productName: 'DITRA', modelNumber: 'DITRA-XL' },
    },
    drywall: {
      sheet_4x8:       { name: 'Drywall Sheet 4x8', unit: 'each', good: 11.99, better: 14.99, best: 21.99, supplier: 'Kent', manufacturer: 'CGC', productName: 'Sheetrock', modelNumber: 'CGC-SR-48' },
      joint_compound:  { name: 'Joint Compound', unit: 'box', good: 17.99, better: 24.99, best: 34.99, supplier: 'Kent', manufacturer: 'CGC', productName: 'Sheetrock All Purpose', modelNumber: 'CGC-AP-23' },
      tape:            { name: 'Drywall Tape', unit: 'each', good: 3.49, better: 4.99, best: 7.99, supplier: 'Kent', manufacturer: 'CGC', productName: 'Paper Joint Tape', modelNumber: 'CGC-PT-75' },
      screws:          { name: 'Drywall Screws (1lb)', unit: 'bag', good: 6.99, better: 8.99, best: 12.99, supplier: 'Home Hardware', manufacturer: 'GRK', productName: 'Drywall Screws', modelNumber: 'GRK-DW-114' },
    },
    doors: {
      interior_prehung: { name: 'Interior Door (prehung)', unit: 'each', good: 149.99, better: 189.99, best: 349.99, supplier: 'Kent', manufacturer: 'Masonite', productName: 'Hollow Core Prehung', modelNumber: 'MAS-HC-30' },
      exterior:         { name: 'Exterior Door', unit: 'each', good: 299.99, better: 499.99, best: 899.99, supplier: 'Kent', manufacturer: 'Jeld-Wen', productName: 'Steel Entry Door', modelNumber: 'JW-SE-36' },
    },
    hardware: {
      knobs:  { name: 'Door Knobs', unit: 'each', good: 4.99, better: 8.99, best: 17.99, supplier: 'Home Hardware', manufacturer: 'Weiser', productName: 'Fairfax Passage', modelNumber: 'WS-FP-SN' },
      hinges: { name: 'Hinges', unit: 'each', good: 3.99, better: 6.99, best: 12.99, supplier: 'Home Hardware', manufacturer: 'Stanley', productName: 'Residential Hinge', modelNumber: 'STN-RH-35' },
      pulls:  { name: 'Cabinet Pulls', unit: 'each', good: 2.99, better: 5.99, best: 11.99, supplier: 'Home Hardware', manufacturer: 'Richelieu', productName: 'Contemporary Pull', modelNumber: 'RCH-CP-128' },
    },
    general: {
      adhesive:     { name: 'Construction Adhesive', unit: 'each', good: 4.49, better: 5.99, best: 8.99, supplier: 'Home Hardware', manufacturer: 'LePage', productName: 'PL Premium', modelNumber: 'LP-PLP-300' },
      wood_filler:  { name: 'Wood Filler', unit: 'each', good: 6.99, better: 8.99, best: 13.99, supplier: 'Home Hardware', manufacturer: 'DAP', productName: 'Plastic Wood', modelNumber: 'DAP-PW-946' },
      brad_nails:   { name: 'Brad Nails (1000ct)', unit: 'box', good: 9.99, better: 12.99, best: 17.99, supplier: 'Home Hardware', manufacturer: 'Paslode', productName: '18ga Brad Nails', modelNumber: 'PAS-BN-114' },
      finish_nails: { name: 'Finish Nails (1lb)', unit: 'bag', good: 5.99, better: 7.99, best: 11.99, supplier: 'Home Hardware', manufacturer: 'Grip-Rite', productName: 'Finish Nails', modelNumber: 'GR-FN-114' },
      caulk:        { name: 'Caulk (tube)', unit: 'each', good: 3.49, better: 4.99, best: 7.99, supplier: 'Home Hardware', manufacturer: 'DAP', productName: 'Alex Plus', modelNumber: 'DAP-AP-300' },
    },
  },

  // Assemblies — composite products (reference materials + labour by key)
  // These ARE the installed rates. Materials + Labour → Assembly G/B/B → Estimate.
  assemblies: {
    // --- Flooring ---
    lvp_floor_complete: {
      name: 'LVP Floor Complete',
      category: 'flooring',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'lvp', coverageRate: 1.05 },
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'underlayment', coverageRate: 1.05 },
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'transition', coverageRate: 0.02 },
        { type: 'labour', sourceCategory: 'flooring', sourceKey: 'installation', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'flooring', sourceKey: 'subfloor_prep', coverageRate: 1.0 },
      ],
    },
    hardwood_floor_complete: {
      name: 'Hardwood Floor Complete',
      category: 'flooring',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'hardwood', coverageRate: 1.05 },
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'underlayment', coverageRate: 1.05 },
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'transition', coverageRate: 0.02 },
        { type: 'labour', sourceCategory: 'flooring', sourceKey: 'installation', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'flooring', sourceKey: 'subfloor_prep', coverageRate: 1.0 },
      ],
    },
    laminate_floor_complete: {
      name: 'Laminate Floor Complete',
      category: 'flooring',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'laminate', coverageRate: 1.05 },
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'underlayment', coverageRate: 1.05 },
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'transition', coverageRate: 0.02 },
        { type: 'labour', sourceCategory: 'flooring', sourceKey: 'installation', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'flooring', sourceKey: 'subfloor_prep', coverageRate: 1.0 },
      ],
    },
    carpet_floor_complete: {
      name: 'Carpet Floor Complete',
      category: 'flooring',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'flooring', sourceKey: 'carpet', coverageRate: 1.10 },
        { type: 'labour', sourceCategory: 'flooring', sourceKey: 'installation', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'flooring', sourceKey: 'subfloor_prep', coverageRate: 0.5 },
      ],
    },
    tile_as_flooring: {
      name: 'Tile as Flooring',
      category: 'tile',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'tile', sourceKey: 'floor_tile', coverageRate: 1.10 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'adhesive', coverageRate: 0.04 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'grout', coverageRate: 0.03 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'spacers', coverageRate: 0.02 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'installation', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'grouting', coverageRate: 1.0 },
      ],
    },

    // --- Paint ---
    paint_walls: {
      name: 'Paint Walls',
      category: 'paint',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'paint', sourceKey: 'interior_paint', coverageRate: 0.006 },
        { type: 'material', sourceCategory: 'paint', sourceKey: 'tape', coverageRate: 0.003 },
        { type: 'material', sourceCategory: 'paint', sourceKey: 'drop_cloth', coverageRate: 0.001 },
        { type: 'labour', sourceCategory: 'paint', sourceKey: 'sanding_prep', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'paint', sourceKey: 'walls', coverageRate: 1.0 },
      ],
    },
    paint_ceiling: {
      name: 'Paint Ceiling',
      category: 'paint',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'paint', sourceKey: 'interior_paint', coverageRate: 0.006 },
        { type: 'material', sourceCategory: 'paint', sourceKey: 'drop_cloth', coverageRate: 0.002 },
        { type: 'labour', sourceCategory: 'paint', sourceKey: 'ceiling', coverageRate: 1.0 },
      ],
    },
    paint_full_prep: {
      name: 'Paint Full Prep',
      category: 'paint',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'paint', sourceKey: 'interior_paint', coverageRate: 0.006 },
        { type: 'material', sourceCategory: 'paint', sourceKey: 'primer', coverageRate: 0.006 },
        { type: 'material', sourceCategory: 'paint', sourceKey: 'tape', coverageRate: 0.003 },
        { type: 'material', sourceCategory: 'paint', sourceKey: 'drop_cloth', coverageRate: 0.002 },
        { type: 'labour', sourceCategory: 'paint', sourceKey: 'repairs', coverageRate: 0.02 },
        { type: 'labour', sourceCategory: 'paint', sourceKey: 'caulking_prep', coverageRate: 0.01 },
        { type: 'labour', sourceCategory: 'paint', sourceKey: 'sanding_prep', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'paint', sourceKey: 'priming', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'paint', sourceKey: 'walls', coverageRate: 1.0 },
      ],
    },

    // --- Trim ---
    baseboard_install: {
      name: 'Baseboard Install',
      category: 'trim',
      unit: 'lft',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'baseboard_3_5', coverageRate: 1.10 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.002 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.01 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'baseboard', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'caulk_fill', coverageRate: 0.02 },
      ],
    },
    baseboard_crown_install: {
      name: 'Baseboard + Crown Install',
      category: 'trim',
      unit: 'lft',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'baseboard_5_25', coverageRate: 1.10 },
        { type: 'material', sourceCategory: 'trim', sourceKey: 'crown', coverageRate: 1.10 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.004 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.015 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'baseboard', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'crown', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'caulk_fill', coverageRate: 0.03 },
      ],
    },
    full_trim_package: {
      name: 'Full Trim Package',
      category: 'trim',
      unit: 'lft',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'baseboard_5_25', coverageRate: 1.10 },
        { type: 'material', sourceCategory: 'trim', sourceKey: 'crown', coverageRate: 1.10 },
        { type: 'material', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 0.15 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.005 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.02 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'baseboard', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'crown', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 0.15 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'caulk_fill', coverageRate: 0.04 },
      ],
    },

    // --- Tile ---
    tile_floor_complete: {
      name: 'Tile Floor Complete',
      category: 'tile',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'tile', sourceKey: 'floor_tile', coverageRate: 1.10 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'adhesive', coverageRate: 0.04 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'grout', coverageRate: 0.03 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'spacers', coverageRate: 0.02 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'installation', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'grouting', coverageRate: 1.0 },
      ],
    },
    tile_floor_with_ditra: {
      name: 'Tile Floor with Ditra',
      category: 'tile',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'tile', sourceKey: 'floor_tile', coverageRate: 1.10 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'ditra', coverageRate: 1.05 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'adhesive', coverageRate: 0.06 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'grout', coverageRate: 0.03 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'spacers', coverageRate: 0.02 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'installation', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'grouting', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'waterproofing', coverageRate: 1.0 },
      ],
    },
    tile_backsplash: {
      name: 'Tile Backsplash',
      category: 'tile',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'tile', sourceKey: 'backsplash_tile', coverageRate: 1.10 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'adhesive', coverageRate: 0.04 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'grout', coverageRate: 0.03 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'installation', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'grouting', coverageRate: 1.0 },
      ],
    },
    tile_shower: {
      name: 'Tile Shower',
      category: 'tile',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'tile', sourceKey: 'wall_tile', coverageRate: 1.15 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'adhesive', coverageRate: 0.05 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'grout', coverageRate: 0.04 },
        { type: 'material', sourceCategory: 'tile', sourceKey: 'ditra', coverageRate: 1.05 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'waterproofing', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'installation', coverageRate: 1.2 },
        { type: 'labour', sourceCategory: 'tile', sourceKey: 'grouting', coverageRate: 1.0 },
      ],
    },

    // --- Drywall ---
    drywall_patches: {
      name: 'Drywall Patches',
      category: 'drywall',
      unit: 'room',
      components: [
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'joint_compound', coverageRate: 0.5 },
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'tape', coverageRate: 0.5 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'patching', coverageRate: 4.0 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'sanding', coverageRate: 20.0 },
      ],
    },
    drywall_accent_wall: {
      name: 'Drywall Accent Wall',
      category: 'drywall',
      unit: 'room',
      components: [
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'sheet_4x8', coverageRate: 4.0 },
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'joint_compound', coverageRate: 1.0 },
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'tape', coverageRate: 1.0 },
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'screws', coverageRate: 0.5 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'hanging', coverageRate: 32.0 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'taping', coverageRate: 32.0 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'mudding', coverageRate: 32.0 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'sanding', coverageRate: 32.0 },
      ],
    },
    drywall_full_room: {
      name: 'Drywall Full Room',
      category: 'drywall',
      unit: 'sqft',
      components: [
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'sheet_4x8', coverageRate: 0.03125 },
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'joint_compound', coverageRate: 0.005 },
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'tape', coverageRate: 0.005 },
        { type: 'material', sourceCategory: 'drywall', sourceKey: 'screws', coverageRate: 0.003 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'hanging', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'taping', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'mudding', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'drywall', sourceKey: 'sanding', coverageRate: 1.0 },
      ],
    },

    // --- Door Trim ---
    door_trim_exterior: {
      name: 'Exterior Door Casing',
      category: 'trim',
      unit: 'each',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 17.0 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.01 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.2 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'caulk_fill', coverageRate: 0.3 },
      ],
    },
    door_trim_interior: {
      name: 'Interior Door Casing',
      category: 'trim',
      unit: 'each',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 14.0 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.008 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.15 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'caulk_fill', coverageRate: 0.2 },
      ],
    },
    door_trim_closet: {
      name: 'Closet Door Casing',
      category: 'trim',
      unit: 'each',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 12.0 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.006 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.1 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'caulk_fill', coverageRate: 0.15 },
      ],
    },
    door_trim_patio: {
      name: 'Patio Door Casing',
      category: 'trim',
      unit: 'each',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 22.0 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.015 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.3 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'caulk_fill', coverageRate: 0.4 },
      ],
    },

    // --- Window Trim ---
    window_trim_small: {
      name: 'Small Window Trim',
      category: 'trim',
      unit: 'each',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 8.0 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.005 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.1 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'window_casing', coverageRate: 1.0 },
      ],
    },
    window_trim_medium: {
      name: 'Medium Window Trim',
      category: 'trim',
      unit: 'each',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 12.0 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.008 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.15 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'window_casing', coverageRate: 1.0 },
      ],
    },
    window_trim_large: {
      name: 'Large Window Trim',
      category: 'trim',
      unit: 'each',
      components: [
        { type: 'material', sourceCategory: 'trim', sourceKey: 'door_casing', coverageRate: 16.0 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'brad_nails', coverageRate: 0.01 },
        { type: 'material', sourceCategory: 'general', sourceKey: 'caulk', coverageRate: 0.2 },
        { type: 'labour', sourceCategory: 'trim', sourceKey: 'window_casing', coverageRate: 1.0 },
      ],
    },

    // --- Hardware ---
    door_hardware_full: {
      name: 'Door Hardware (Full)',
      category: 'hardware',
      unit: 'each',
      components: [
        { type: 'material', sourceCategory: 'hardware', sourceKey: 'knobs', coverageRate: 1.0 },
        { type: 'material', sourceCategory: 'hardware', sourceKey: 'hinges', coverageRate: 3.0 },
        { type: 'labour', sourceCategory: 'carpentry', sourceKey: 'general', coverageRate: 0.5 },
      ],
    },
    door_knobs_only: {
      name: 'Door Knobs Only',
      category: 'hardware',
      unit: 'each',
      components: [
        { type: 'material', sourceCategory: 'hardware', sourceKey: 'knobs', coverageRate: 1.0 },
        { type: 'labour', sourceCategory: 'carpentry', sourceKey: 'general', coverageRate: 0.25 },
      ],
    },
  },

  // Labour — labor rates by trade/task (Moncton NB market, 2026)
  labour: {
    flooring: {
      demo:            { name: 'Demo & Removal', unit: 'sqft', rate: 1.00 },
      subfloor_prep:   { name: 'Subfloor Prep', unit: 'sqft', rate: 0.75 },
      subfloor_repair: { name: 'Subfloor Repair', unit: 'hour', rate: 45.00 },
      installation:    { name: 'Flooring Installation', unit: 'sqft', rate: 3.00 },
      transitions:     { name: 'Transition Strips', unit: 'each', rate: 15.00 },
      cleanup:         { name: 'Cleanup & Haul-Away', unit: 'hour', rate: 25.00 },
    },
    paint: {
      repairs:        { name: 'Wall Repairs & Patching', unit: 'hour', rate: 45.00 },
      sanding_prep:   { name: 'Sanding & Surface Prep', unit: 'sqft', rate: 0.50 },
      caulking_prep:  { name: 'Caulking & Prep', unit: 'hour', rate: 35.00 },
      priming:        { name: 'Priming', unit: 'sqft', rate: 0.50 },
      walls:          { name: 'Painting (Walls)', unit: 'sqft', rate: 1.00 },
      ceiling:        { name: 'Painting (Ceiling)', unit: 'sqft', rate: 1.25 },
      trim_painting:  { name: 'Trim Painting', unit: 'lft', rate: 1.50 },
      cleanup:        { name: 'Cleanup & Touch-Up', unit: 'hour', rate: 25.00 },
    },
    trim: {
      demo:            { name: 'Demo & Removal', unit: 'lft', rate: 0.75 },
      baseboard:       { name: 'Baseboard Install', unit: 'lft', rate: 2.50 },
      crown:           { name: 'Crown Moulding Install', unit: 'lft', rate: 4.00 },
      door_casing:     { name: 'Door Casing Install', unit: 'each', rate: 45.00 },
      window_casing:   { name: 'Window Casing Install', unit: 'each', rate: 55.00 },
      shoe_moulding:   { name: 'Shoe Moulding Install', unit: 'lft', rate: 1.25 },
      caulk_fill:      { name: 'Caulking & Nail Filling', unit: 'hour', rate: 35.00 },
    },
    tile: {
      demo:            { name: 'Demo & Removal', unit: 'sqft', rate: 2.00 },
      substrate_prep:  { name: 'Substrate Prep', unit: 'sqft', rate: 1.50 },
      waterproofing:   { name: 'Waterproofing / Membrane', unit: 'sqft', rate: 2.00 },
      installation:    { name: 'Tile Installation', unit: 'sqft', rate: 6.00 },
      grouting:        { name: 'Grouting', unit: 'sqft', rate: 1.50 },
      cleanup:         { name: 'Cleanup & Sealing', unit: 'hour', rate: 35.00 },
    },
    drywall: {
      demo:       { name: 'Demo & Removal', unit: 'sqft', rate: 0.75 },
      hanging:    { name: 'Drywall Hanging', unit: 'sqft', rate: 1.25 },
      taping:     { name: 'Taping', unit: 'sqft', rate: 0.50 },
      mudding:    { name: 'Mudding / Finishing', unit: 'sqft', rate: 1.00 },
      sanding:    { name: 'Sanding', unit: 'sqft', rate: 0.35 },
      patching:   { name: 'Patching & Repairs', unit: 'each', rate: 25.00 },
    },
    carpentry: {
      general: { name: 'General Carpenter', unit: 'hour', rate: 45.00 },
      finish:  { name: 'Finish Carpenter', unit: 'hour', rate: 55.00 },
      framing: { name: 'Framing', unit: 'hour', rate: 45.00 },
    },
    general: {
      laborer:    { name: 'General Laborer', unit: 'hour', rate: 25.00 },
      demolition: { name: 'Demolition / Removal', unit: 'hour', rate: 35.00 },
      cleanup:    { name: 'Site Cleanup', unit: 'hour', rate: 25.00 },
      delivery:   { name: 'Material Delivery & Handling', unit: 'hour', rate: 30.00 },
    },
  },

  updatedAt: '2026-01-01T00:00:00.000Z',
};

// ============================================================================
// Assembly Totals Utility — computes Good/Better/Best from referenced data
// ============================================================================

export function computeAssemblyTotals(
  assembly: Assembly,
  materials: CostCatalog['materials'],
  labour: CostCatalog['labour'],
): { good: number; better: number; best: number } {
  let good = 0, better = 0, best = 0;

  for (const comp of assembly.components) {
    if (comp.type === 'material') {
      const mat = materials[comp.sourceCategory]?.[comp.sourceKey];
      if (mat) {
        good += mat.good * comp.coverageRate;
        better += mat.better * comp.coverageRate;
        best += mat.best * comp.coverageRate;
      }
    } else {
      const lab = labour[comp.sourceCategory]?.[comp.sourceKey];
      if (lab) {
        // Labour has a single rate (no tiers) — same across G/B/B
        good += lab.rate * comp.coverageRate;
        better += lab.rate * comp.coverageRate;
        best += lab.rate * comp.coverageRate;
      }
    }
  }

  return { good, better, best };
}

// ============================================================================
// Rate → Assembly Mapping — tells estimate engine which assembly per rate key
// ============================================================================

export const RATE_ASSEMBLY_MAP: {
  floorRates: Record<string, string>;
  paintRates: Record<string, { wall: string; ceiling: string | null }>;
  trimRates: Record<string, string>;
  tileRates: Record<string, string>;
  drywallRates: Record<string, string>;
  doorTrimRates: Record<string, string>;
  windowTrimRates: Record<string, string>;
  hardwareRates: Record<string, string>;
} = {
  floorRates: {
    lvp: 'lvp_floor_complete',
    hardwood: 'hardwood_floor_complete',
    laminate: 'laminate_floor_complete',
    carpet: 'carpet_floor_complete',
    tile: 'tile_as_flooring',
    not_sure: 'lvp_floor_complete',
  },
  paintRates: {
    walls:         { wall: 'paint_walls', ceiling: null },
    walls_ceiling: { wall: 'paint_walls', ceiling: 'paint_ceiling' },
    full:          { wall: 'paint_full_prep', ceiling: 'paint_ceiling' },
  },
  trimRates: {
    baseboard: 'baseboard_install',
    casing: 'casing_install',
    crown: 'crown_install',
    other: 'baseboard_install',
  },
  tileRates: {
    floor: 'tile_floor_complete',
    backsplash: 'tile_backsplash',
    shower: 'tile_shower',
    not_sure: 'tile_floor_complete',
  },
  drywallRates: {
    patches: 'drywall_patches',
    accent: 'drywall_accent_wall',
    full_room: 'drywall_full_room',
  },
  doorTrimRates: {
    exterior: 'door_trim_exterior',
    interior: 'door_trim_interior',
    closet: 'door_trim_closet',
    patio: 'door_trim_patio',
  },
  windowTrimRates: {
    small: 'window_trim_small',
    medium: 'window_trim_medium',
    large: 'window_trim_large',
  },
  hardwareRates: {
    hardware: 'door_hardware_full',
    knobs: 'door_knobs_only',
  },
};

// ============================================================================
// Material labels for description building
// ============================================================================

export const MATERIAL_LABELS: Record<string, Record<string, string>> = {
  floors:  { lvp: 'LVP', hardwood: 'Hardwood', laminate: 'Laminate', carpet: 'Carpet', tile: 'Tile', not_sure: 'Flooring' },
  paint:   { walls: 'Walls', walls_ceiling: 'Walls+Ceil', full: 'Full Paint' },
  trim:    { baseboard: 'Baseboard', casing: 'Casing', crown: 'Crown', other: 'Other Trim' },
  tile:    { floor: 'Floor Tile', backsplash: 'Backsplash', shower: 'Shower', not_sure: 'Tile' },
  drywall: { patches: 'Patches', accent: 'Accent Wall', full_room: 'Full Drywall' },
};

// ============================================================================
// Sqft-based calculator (preferred)
// ============================================================================

export function calculateSqftEstimate(input: SqftEstimateInput, catalog?: CostCatalog): InstantEstimateResult {
  const cat = catalog ?? DEFAULT_COST_CATALOG;
  const { rooms, materials, scopeTags } = input;

  const totalSqft = rooms.reduce((sum, r) => sum + r.sqft, 0);
  const roomCount = rooms.length;

  if (totalSqft === 0 || roomCount === 0) {
    return calculateInstantEstimate({ scopeTags, roomCount: roomCount || 3 }, catalog);
  }

  const resolvedTrades = resolveTrades(scopeTags, cat.tradeRanges);

  // Accumulate three totals: Good (low), Better (mid), Best (high)
  let totalGood = 0;
  let totalBetter = 0;
  let totalBest = 0;
  const tradeLabels: string[] = [];

  for (const trade of resolvedTrades) {
    switch (trade) {
      case 'floors': {
        const mat = materials.floors ?? 'not_sure';
        const assemblyKey = RATE_ASSEMBLY_MAP.floorRates[mat];
        const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
        if (assembly) {
          const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
          totalGood += totalSqft * t.good;
          totalBetter += totalSqft * t.better;
          totalBest += totalSqft * t.best;
        } else {
          const entry = cat.floorRates[mat] ?? cat.floorRates['not_sure'] ?? { rate: 7 };
          const cost = totalSqft * entry.rate;
          totalGood += cost; totalBetter += cost; totalBest += cost;
        }
        tradeLabels.push(cat.floorRates[mat]?.label ?? 'flooring');
        break;
      }
      case 'paint': {
        const mat = materials.paint ?? 'walls_ceiling';
        const mapping = RATE_ASSEMBLY_MAP.paintRates[mat];
        if (mapping) {
          const perimeter = rooms.reduce((sum, r) => sum + 2 * (r.lengthFt + r.widthFt), 0);
          const wallArea = perimeter * WALL_HEIGHT_FT;
          const wallAssembly = cat.assemblies[mapping.wall];
          if (wallAssembly) {
            const t = computeAssemblyTotals(wallAssembly, cat.materials, cat.labour);
            totalGood += wallArea * t.good;
            totalBetter += wallArea * t.better;
            totalBest += wallArea * t.best;
          }
          if (mapping.ceiling) {
            const ceilAssembly = cat.assemblies[mapping.ceiling];
            if (ceilAssembly) {
              const t = computeAssemblyTotals(ceilAssembly, cat.materials, cat.labour);
              totalGood += totalSqft * t.good;
              totalBetter += totalSqft * t.better;
              totalBest += totalSqft * t.best;
            }
          }
        } else {
          const entry = cat.paintRates[mat] ?? cat.paintRates['walls_ceiling'] ?? { ratePerWallSqft: 1.50, ceilingAdder: 1.25 };
          const perimeter = rooms.reduce((sum, r) => sum + 2 * (r.lengthFt + r.widthFt), 0);
          const wallArea = perimeter * WALL_HEIGHT_FT;
          const cost = wallArea * entry.ratePerWallSqft + (entry.ceilingAdder > 0 ? totalSqft * entry.ceilingAdder : 0);
          totalGood += cost; totalBetter += cost; totalBest += cost;
        }
        tradeLabels.push(cat.paintRates[mat]?.label ?? 'paint');
        break;
      }
      case 'trim': {
        // Trim supports multi-select (comma-separated, e.g. "baseboard,casing")
        const trimStr = (materials.trim as string) ?? 'baseboard';
        const trimTypes = trimStr.split(',').filter(Boolean) as TrimScopePref[];
        if (trimTypes.length === 0) trimTypes.push('baseboard');
        const totalPerimeter = rooms.reduce((sum, r) => sum + 2 * (r.lengthFt + r.widthFt), 0);
        for (const mat of trimTypes) {
          const assemblyKey = RATE_ASSEMBLY_MAP.trimRates[mat];
          const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
          if (assembly) {
            const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
            totalGood += totalPerimeter * t.good;
            totalBetter += totalPerimeter * t.better;
            totalBest += totalPerimeter * t.best;
          } else {
            const entry = cat.trimRates[mat] ?? cat.trimRates['baseboard'] ?? { ratePerLft: 5 };
            const cost = totalPerimeter * entry.ratePerLft;
            totalGood += cost; totalBetter += cost; totalBest += cost;
          }
          tradeLabels.push(cat.trimRates[mat]?.label ?? mat);
        }
        break;
      }
      case 'tile': {
        const mat = materials.tile ?? 'not_sure';
        const assemblyKey = RATE_ASSEMBLY_MAP.tileRates[mat];
        const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
        if (assembly) {
          const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
          totalGood += totalSqft * t.good;
          totalBetter += totalSqft * t.better;
          totalBest += totalSqft * t.best;
        } else {
          const entry = cat.tileRates[mat] ?? cat.tileRates['not_sure'] ?? { rate: 16 };
          const cost = totalSqft * entry.rate;
          totalGood += cost; totalBetter += cost; totalBest += cost;
        }
        tradeLabels.push(cat.tileRates[mat]?.label ?? 'tile');
        break;
      }
      case 'drywall': {
        const mat = materials.drywall ?? 'patches';
        const assemblyKey = RATE_ASSEMBLY_MAP.drywallRates[mat];
        const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
        if (assembly) {
          const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
          const qty = assembly.unit === 'room' ? roomCount : totalSqft;
          totalGood += qty * t.good;
          totalBetter += qty * t.better;
          totalBest += qty * t.best;
        } else {
          const entry = cat.drywallRates[mat] ?? cat.drywallRates['patches'] ?? { rate: 200, perRoom: true };
          const cost = entry.perRoom ? roomCount * entry.rate : totalSqft * entry.rate;
          totalGood += cost; totalBetter += cost; totalBest += cost;
        }
        tradeLabels.push(cat.drywallRates[mat]?.label ?? 'drywall patches');
        break;
      }
    }
  }

  // Door/window trim + hardware — assembly-driven
  if (input.doorWindows) {
    const dw = input.doorWindows;
    const totalDoors = dw.exteriorDoors + dw.interiorDoors + dw.closetDoors + dw.patioDoors;
    const totalWindows = dw.windowsSmall + dw.windowsMedium + dw.windowsLarge;
    const trimInScope = resolvedTrades.includes('trim');

    if (trimInScope && (totalDoors > 0 || totalWindows > 0)) {
      const doorEntries: [number, string, string][] = [
        [dw.exteriorDoors, 'exterior', 'door_trim_exterior'],
        [dw.interiorDoors, 'interior', 'door_trim_interior'],
        [dw.closetDoors, 'closet', 'door_trim_closet'],
        [dw.patioDoors, 'patio', 'door_trim_patio'],
      ];
      for (const [qty, rateKey, asmKey] of doorEntries) {
        if (qty > 0) {
          const asm = cat.assemblies[asmKey];
          if (asm) {
            const t = computeAssemblyTotals(asm, cat.materials, cat.labour);
            totalGood += qty * t.good; totalBetter += qty * t.better; totalBest += qty * t.best;
          } else {
            const rate = cat.doorTrimRates[rateKey]?.rate ?? 120;
            totalGood += qty * rate; totalBetter += qty * rate; totalBest += qty * rate;
          }
        }
      }
      if (totalDoors > 0) tradeLabels.push('door trim');

      const windowEntries: [number, string, string][] = [
        [dw.windowsSmall, 'small', 'window_trim_small'],
        [dw.windowsMedium, 'medium', 'window_trim_medium'],
        [dw.windowsLarge, 'large', 'window_trim_large'],
      ];
      for (const [qty, rateKey, asmKey] of windowEntries) {
        if (qty > 0) {
          const asm = cat.assemblies[asmKey];
          if (asm) {
            const t = computeAssemblyTotals(asm, cat.materials, cat.labour);
            totalGood += qty * t.good; totalBetter += qty * t.better; totalBest += qty * t.best;
          } else {
            const rate = cat.windowTrimRates[rateKey]?.rate ?? 95;
            totalGood += qty * rate; totalBetter += qty * rate; totalBest += qty * rate;
          }
        }
      }
      if (totalWindows > 0) tradeLabels.push('window trim');
    }

    if (dw.replaceHardware && totalDoors > 0) {
      const asm = cat.assemblies['door_hardware_full'];
      if (asm) {
        const t = computeAssemblyTotals(asm, cat.materials, cat.labour);
        totalGood += totalDoors * t.good; totalBetter += totalDoors * t.better; totalBest += totalDoors * t.best;
      } else {
        const rate = cat.hardwareRates['hardware']?.rate ?? 45;
        totalGood += totalDoors * rate; totalBetter += totalDoors * rate; totalBest += totalDoors * rate;
      }
      tradeLabels.push('door hardware');
    }
    if (dw.replaceKnobs && totalDoors > 0) {
      const asm = cat.assemblies['door_knobs_only'];
      if (asm) {
        const t = computeAssemblyTotals(asm, cat.materials, cat.labour);
        totalGood += totalDoors * t.good; totalBetter += totalDoors * t.better; totalBest += totalDoors * t.best;
      } else {
        const rate = cat.hardwareRates['knobs']?.rate ?? 25;
        totalGood += totalDoors * rate; totalBetter += totalDoors * rate; totalBest += totalDoors * rate;
      }
      tradeLabels.push('door knobs');
    }
  }

  // Fallback
  if (totalBetter === 0) {
    const mat = materials.floors ?? 'not_sure';
    const assemblyKey = RATE_ASSEMBLY_MAP.floorRates[mat];
    const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
    if (assembly) {
      const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
      totalGood = totalSqft * t.good; totalBetter = totalSqft * t.better; totalBest = totalSqft * t.best;
    } else {
      const entry = cat.floorRates[mat] ?? cat.floorRates['not_sure'] ?? { rate: 7 };
      const cost = totalSqft * entry.rate;
      totalGood = cost; totalBetter = cost; totalBest = cost;
    }
    tradeLabels.push('flooring');
  }

  // Good=low, Better=mid, Best=high — no ±variance, range from G/B/B tiers
  const low = roundToNearest500(totalGood);
  const mid = roundToNearest500(totalBetter);
  const high = roundToNearest500(totalBest);

  const tradeList = tradeLabels.length > 1
    ? tradeLabels.slice(0, -1).join(', ') + ' + ' + tradeLabels[tradeLabels.length - 1]
    : tradeLabels[0] || 'renovation';
  const description = `${capitalize(tradeList)} across ${roomCount} room${roomCount !== 1 ? 's' : ''} (${totalSqft.toLocaleString()} sqft)`;

  return { low, mid, high, description };
}

// ============================================================================
// Room-count fallback calculator (backward compat)
// ============================================================================

export function calculateInstantEstimate(input: InstantEstimateInput, catalog?: CostCatalog): InstantEstimateResult {
  const cat = catalog ?? DEFAULT_COST_CATALOG;
  const { scopeTags, roomCount: rawRoomCount } = input;

  // Whole floor = default 6 rooms
  const roomCount = rawRoomCount === 0 ? WHOLE_FLOOR_DEFAULT_ROOMS : rawRoomCount;

  // Resolve trades from scope tags
  const resolvedTrades = resolveTrades(scopeTags, cat.tradeRanges);

  // Sum per-room costs across selected trades
  let totalLow = 0;
  let totalMid = 0;
  let totalHigh = 0;
  const tradeLabels: string[] = [];

  for (const trade of resolvedTrades) {
    const range = cat.tradeRanges[trade];
    if (range) {
      totalLow += range.low * roomCount;
      totalMid += range.mid * roomCount;
      totalHigh += range.high * roomCount;
      tradeLabels.push(range.label);
    }
  }

  // Fallback if nothing resolved
  if (totalMid === 0) {
    const range = cat.tradeRanges['floors'] ?? { low: 800, mid: 1200, high: 1800, label: 'flooring' };
    totalLow = range.low * roomCount;
    totalMid = range.mid * roomCount;
    totalHigh = range.high * roomCount;
    tradeLabels.push(range.label);
  }

  // Round to nearest $500
  const low = roundToNearest500(totalLow);
  const mid = roundToNearest500(totalMid);
  const high = roundToNearest500(totalHigh);

  // Build description
  const roomLabel = rawRoomCount === 0
    ? 'whole floor'
    : `${roomCount} room${roomCount !== 1 ? 's' : ''}`;
  const tradeList = tradeLabels.length > 1
    ? tradeLabels.slice(0, -1).join(', ') + ' + ' + tradeLabels[tradeLabels.length - 1]
    : tradeLabels[0] || 'renovation';
  const description = `${capitalize(tradeList)} across ${roomLabel}`;

  return { low, mid, high, description };
}

// ============================================================================
// Estimate Breakdown — per-trade line items for display
// ============================================================================

/**
 * Reconstruct a per-trade line-item breakdown from lead data.
 * Used in the pipeline expanded view to show what the estimate is based on.
 *
 * Line items show "better" tier rate/total for display.
 * Overall low/high come from sum of good/best totals (assembly G/B/B tiers).
 */
export function calculateEstimateBreakdown(input: {
  scopeTags: string[];
  roomCount: number;
  totalSqft: number | null;
  materialPrefs: Record<string, string>;
  doorWindows?: DoorWindowInput | null;
}, catalog?: CostCatalog): EstimateBreakdown {
  const cat = catalog ?? DEFAULT_COST_CATALOG;
  const { scopeTags, roomCount: rawRoomCount, totalSqft, materialPrefs } = input;
  const roomCount = rawRoomCount === 0 ? WHOLE_FLOOR_DEFAULT_ROOMS : rawRoomCount;
  const resolvedTrades = resolveTrades(scopeTags, cat.tradeRanges);
  const lines: EstimateLineItem[] = [];

  const hasSqft = totalSqft !== null && totalSqft > 0;
  const floorSqft = hasSqft ? totalSqft : roomCount * 150;

  const avgRoomSqft = floorSqft / Math.max(roomCount, 1);
  const avgRoomSide = Math.sqrt(avgRoomSqft);
  const totalPerimeter = Math.round(4 * avgRoomSide * Math.max(roomCount, 1));
  const totalWallArea = totalPerimeter * WALL_HEIGHT_FT;

  // Track good/best sums separately for overall low/high
  let sumGood = 0;
  let sumBest = 0;

  for (const trade of resolvedTrades) {
    switch (trade) {
      case 'floors': {
        const mat = (materialPrefs.floors as FlooringMaterialPref) ?? 'not_sure';
        const assemblyKey = RATE_ASSEMBLY_MAP.floorRates[mat];
        const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
        if (assembly) {
          const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
          lines.push({ trade: 'Floors', material: capitalize(cat.floorRates[mat]?.label ?? 'flooring'), quantity: floorSqft, unit: 'sqft', rate: t.better, total: floorSqft * t.better });
          sumGood += floorSqft * t.good;
          sumBest += floorSqft * t.best;
        } else {
          const entry = cat.floorRates[mat] ?? cat.floorRates['not_sure'] ?? { rate: 7, label: 'flooring' };
          lines.push({ trade: 'Floors', material: capitalize(entry.label), quantity: floorSqft, unit: 'sqft', rate: entry.rate, total: floorSqft * entry.rate });
          sumGood += floorSqft * entry.rate;
          sumBest += floorSqft * entry.rate;
        }
        break;
      }
      case 'paint': {
        const mat = (materialPrefs.paint as PaintScopePref) ?? 'walls_ceiling';
        const mapping = RATE_ASSEMBLY_MAP.paintRates[mat];
        if (mapping) {
          let lineBetter = 0, lineGood = 0, lineBest = 0;
          const wallAssembly = cat.assemblies[mapping.wall];
          if (wallAssembly) {
            const t = computeAssemblyTotals(wallAssembly, cat.materials, cat.labour);
            lineBetter += totalWallArea * t.better;
            lineGood += totalWallArea * t.good;
            lineBest += totalWallArea * t.best;
          }
          if (mapping.ceiling) {
            const ceilAssembly = cat.assemblies[mapping.ceiling];
            if (ceilAssembly) {
              const t = computeAssemblyTotals(ceilAssembly, cat.materials, cat.labour);
              lineBetter += floorSqft * t.better;
              lineGood += floorSqft * t.good;
              lineBest += floorSqft * t.best;
            }
          }
          lines.push({ trade: 'Paint', material: capitalize(cat.paintRates[mat]?.label ?? 'paint'), quantity: totalWallArea, unit: 'wall sqft', rate: totalWallArea > 0 ? lineBetter / totalWallArea : 0, total: Math.round(lineBetter) });
          sumGood += lineGood;
          sumBest += lineBest;
        } else {
          const entry = cat.paintRates[mat] ?? cat.paintRates['walls_ceiling'] ?? { ratePerWallSqft: 1.50, ceilingAdder: 1.25, label: 'paint' };
          const wallCost = totalWallArea * entry.ratePerWallSqft;
          const ceilingCost = entry.ceilingAdder > 0 ? floorSqft * entry.ceilingAdder : 0;
          const paintTotal = Math.round(wallCost + ceilingCost);
          lines.push({ trade: 'Paint', material: capitalize(entry.label), quantity: totalWallArea, unit: 'wall sqft', rate: entry.ratePerWallSqft, total: paintTotal });
          sumGood += paintTotal;
          sumBest += paintTotal;
        }
        break;
      }
      case 'trim': {
        // Trim supports multi-select (comma-separated, e.g. "baseboard,casing")
        const trimBreakdownStr = (materialPrefs.trim as string) ?? 'baseboard';
        const trimBreakdownTypes = trimBreakdownStr.split(',').filter(Boolean) as TrimScopePref[];
        if (trimBreakdownTypes.length === 0) trimBreakdownTypes.push('baseboard');
        for (const mat of trimBreakdownTypes) {
          const assemblyKey = RATE_ASSEMBLY_MAP.trimRates[mat];
          const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
          if (assembly) {
            const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
            lines.push({ trade: 'Trim', material: capitalize(cat.trimRates[mat]?.label ?? mat), quantity: totalPerimeter, unit: 'lft', rate: t.better, total: totalPerimeter * t.better });
            sumGood += totalPerimeter * t.good;
            sumBest += totalPerimeter * t.best;
          } else {
            const entry = cat.trimRates[mat] ?? cat.trimRates['baseboard'] ?? { ratePerLft: 5, label: mat };
            lines.push({ trade: 'Trim', material: capitalize(entry.label), quantity: totalPerimeter, unit: 'lft', rate: entry.ratePerLft, total: totalPerimeter * entry.ratePerLft });
            sumGood += totalPerimeter * entry.ratePerLft;
            sumBest += totalPerimeter * entry.ratePerLft;
          }
        }
        break;
      }
      case 'tile': {
        const mat = (materialPrefs.tile as TileScopePref) ?? 'not_sure';
        const assemblyKey = RATE_ASSEMBLY_MAP.tileRates[mat];
        const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
        if (assembly) {
          const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
          lines.push({ trade: 'Tile', material: capitalize(cat.tileRates[mat]?.label ?? 'tile'), quantity: floorSqft, unit: 'sqft', rate: t.better, total: floorSqft * t.better });
          sumGood += floorSqft * t.good;
          sumBest += floorSqft * t.best;
        } else {
          const entry = cat.tileRates[mat] ?? cat.tileRates['not_sure'] ?? { rate: 16, label: 'tile' };
          lines.push({ trade: 'Tile', material: capitalize(entry.label), quantity: floorSqft, unit: 'sqft', rate: entry.rate, total: floorSqft * entry.rate });
          sumGood += floorSqft * entry.rate;
          sumBest += floorSqft * entry.rate;
        }
        break;
      }
      case 'drywall': {
        const mat = (materialPrefs.drywall as DrywallScopePref) ?? 'patches';
        const assemblyKey = RATE_ASSEMBLY_MAP.drywallRates[mat];
        const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
        if (assembly) {
          const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
          const qty = assembly.unit === 'room' ? roomCount : floorSqft;
          const unitLabel = assembly.unit === 'room' ? 'rooms' : 'sqft';
          lines.push({ trade: 'Drywall', material: capitalize(cat.drywallRates[mat]?.label ?? 'drywall'), quantity: qty, unit: unitLabel, rate: t.better, total: qty * t.better });
          sumGood += qty * t.good;
          sumBest += qty * t.best;
        } else {
          const entry = cat.drywallRates[mat] ?? cat.drywallRates['patches'] ?? { rate: 200, perRoom: true, label: 'drywall patches' };
          if (entry.perRoom) {
            lines.push({ trade: 'Drywall', material: capitalize(entry.label), quantity: roomCount, unit: 'rooms', rate: entry.rate, total: roomCount * entry.rate });
            sumGood += roomCount * entry.rate; sumBest += roomCount * entry.rate;
          } else {
            lines.push({ trade: 'Drywall', material: capitalize(entry.label), quantity: floorSqft, unit: 'sqft', rate: entry.rate, total: floorSqft * entry.rate });
            sumGood += floorSqft * entry.rate; sumBest += floorSqft * entry.rate;
          }
        }
        break;
      }
    }
  }

  // Door/window trim + hardware line items — assembly-driven
  if (input.doorWindows) {
    const dw = input.doorWindows;
    const trimInScope = resolvedTrades.includes('trim');
    const totalDoors = dw.exteriorDoors + dw.interiorDoors + dw.closetDoors + dw.patioDoors;

    if (trimInScope) {
      const doorEntries: [number, string, string, string][] = [
        [dw.exteriorDoors, 'exterior', 'door_trim_exterior', 'Exterior door casing'],
        [dw.interiorDoors, 'interior', 'door_trim_interior', 'Interior door casing'],
        [dw.closetDoors, 'closet', 'door_trim_closet', 'Closet door casing'],
        [dw.patioDoors, 'patio', 'door_trim_patio', 'Patio door casing'],
      ];
      for (const [qty, rateKey, asmKey, label] of doorEntries) {
        if (qty > 0) {
          const asm = cat.assemblies[asmKey];
          if (asm) {
            const t = computeAssemblyTotals(asm, cat.materials, cat.labour);
            lines.push({ trade: 'Doors', material: label, quantity: qty, unit: 'doors', rate: t.better, total: qty * t.better });
            sumGood += qty * t.good; sumBest += qty * t.best;
          } else {
            const rate = cat.doorTrimRates[rateKey]?.rate ?? 120;
            lines.push({ trade: 'Doors', material: label, quantity: qty, unit: 'doors', rate, total: qty * rate });
            sumGood += qty * rate; sumBest += qty * rate;
          }
        }
      }

      const windowEntries: [number, string, string, string][] = [
        [dw.windowsSmall, 'small', 'window_trim_small', 'Small window trim'],
        [dw.windowsMedium, 'medium', 'window_trim_medium', 'Medium window trim'],
        [dw.windowsLarge, 'large', 'window_trim_large', 'Large window trim'],
      ];
      for (const [qty, rateKey, asmKey, label] of windowEntries) {
        if (qty > 0) {
          const asm = cat.assemblies[asmKey];
          if (asm) {
            const t = computeAssemblyTotals(asm, cat.materials, cat.labour);
            lines.push({ trade: 'Windows', material: label, quantity: qty, unit: 'windows', rate: t.better, total: qty * t.better });
            sumGood += qty * t.good; sumBest += qty * t.best;
          } else {
            const rate = cat.windowTrimRates[rateKey]?.rate ?? 95;
            lines.push({ trade: 'Windows', material: label, quantity: qty, unit: 'windows', rate, total: qty * rate });
            sumGood += qty * rate; sumBest += qty * rate;
          }
        }
      }
    }

    if (dw.replaceHardware && totalDoors > 0) {
      const asm = cat.assemblies['door_hardware_full'];
      if (asm) {
        const t = computeAssemblyTotals(asm, cat.materials, cat.labour);
        lines.push({ trade: 'Hardware', material: 'Door hardware', quantity: totalDoors, unit: 'doors', rate: t.better, total: totalDoors * t.better });
        sumGood += totalDoors * t.good; sumBest += totalDoors * t.best;
      } else {
        const rate = cat.hardwareRates['hardware']?.rate ?? 45;
        lines.push({ trade: 'Hardware', material: 'Door hardware', quantity: totalDoors, unit: 'doors', rate, total: totalDoors * rate });
        sumGood += totalDoors * rate; sumBest += totalDoors * rate;
      }
    }
    if (dw.replaceKnobs && totalDoors > 0) {
      const asm = cat.assemblies['door_knobs_only'];
      if (asm) {
        const t = computeAssemblyTotals(asm, cat.materials, cat.labour);
        lines.push({ trade: 'Hardware', material: 'Door knobs', quantity: totalDoors, unit: 'doors', rate: t.better, total: totalDoors * t.better });
        sumGood += totalDoors * t.good; sumBest += totalDoors * t.best;
      } else {
        const rate = cat.hardwareRates['knobs']?.rate ?? 25;
        lines.push({ trade: 'Hardware', material: 'Door knobs', quantity: totalDoors, unit: 'doors', rate, total: totalDoors * rate });
        sumGood += totalDoors * rate; sumBest += totalDoors * rate;
      }
    }
  }

  // Fallback
  if (lines.length === 0) {
    const mat = (materialPrefs.floors as FlooringMaterialPref) ?? 'not_sure';
    const assemblyKey = RATE_ASSEMBLY_MAP.floorRates[mat];
    const assembly = assemblyKey ? cat.assemblies[assemblyKey] : undefined;
    if (assembly) {
      const t = computeAssemblyTotals(assembly, cat.materials, cat.labour);
      lines.push({ trade: 'Floors', material: capitalize(cat.floorRates[mat]?.label ?? 'flooring'), quantity: floorSqft, unit: 'sqft', rate: t.better, total: floorSqft * t.better });
      sumGood = floorSqft * t.good;
      sumBest = floorSqft * t.best;
    } else {
      const entry = cat.floorRates[mat] ?? cat.floorRates['not_sure'] ?? { rate: 7, label: 'flooring' };
      lines.push({ trade: 'Floors', material: capitalize(entry.label), quantity: floorSqft, unit: 'sqft', rate: entry.rate, total: floorSqft * entry.rate });
      sumGood = floorSqft * entry.rate;
      sumBest = floorSqft * entry.rate;
    }
  }

  const totalMid = lines.reduce((sum, l) => sum + l.total, 0);

  return {
    lines,
    totalMid: roundToNearest500(totalMid),
    low: roundToNearest500(sumGood),
    high: roundToNearest500(sumBest),
    totalSqft: floorSqft,
    roomCount,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function resolveTrades(scopeTags: string[], tradeRanges: Record<string, unknown> = DEFAULT_COST_CATALOG.tradeRanges): string[] {
  if (scopeTags.includes('full_refresh')) return [...FULL_REFRESH_TRADES];
  if (scopeTags.includes('not_sure') || scopeTags.length === 0) return [...NOT_SURE_TRADES];
  return scopeTags.filter((tag) => tag in tradeRanges);
}

function roundToNearest500(value: number): number {
  return Math.round(value / 500) * 500;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
