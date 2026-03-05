/**
 * Trim Cut Calculator types.
 * MillworkAssemblyConfig — per-company assembly defaults.
 * TrimCalculation — stored per-room cut list result.
 * All internal measurements in mm; display in inches.
 */

// ─── Assembly configuration ───────────────────────────────────────────────────

export interface MillworkAssemblyConfig {
  id: string;                               // 'default' for company default
  label: string;
  window_jamb_style: 'sill_under_legs' | 'legs_on_sill';
  horn_length_mm: number;                   // Structural jamb sill horn (legs_on_sill only)
  door_jamb_style: 'head_on_legs' | 'legs_under_head';
  casing_joint: 'miter' | 'butt';
  door_stop_joint: 'miter' | 'butt';
  floor_clearance_mm: number;               // Gap at bottom of door stop legs
  stool_nose_mm: number;                    // Decorative stool projection past casing
  include_apron: boolean;
  trim_waste_factor: number;                // 0.10 = 10%
  createdAt: string;
  updatedAt: string;
}

export type CreateMillworkAssemblyConfig = Omit<MillworkAssemblyConfig, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Openings ─────────────────────────────────────────────────────────────────

export type OpeningKind = 'door' | 'window';

export interface TrimOpening {
  id: string;
  kind: OpeningKind;
  label: string;         // e.g. "Front Door", "Kitchen Window"
  width_mm: number;      // rough opening width
  height_mm: number;     // rough opening height (door: floor to top of jamb; window: sill to head)
  has_stool: boolean;    // windows — include stool (sill board)
  has_apron: boolean;    // windows — include apron below stool
}

// ─── Cut pieces ───────────────────────────────────────────────────────────────

export type CutPieceCategory = 'jamb' | 'stop' | 'sill' | 'casing' | 'apron' | 'baseboard';

export interface CutPiece {
  category: CutPieceCategory;
  label: string;          // e.g. "Side Jamb", "Head Stop", "Sill", "Head Casing"
  length_mm: number;      // finished cut length
  qty: number;
  opening_label: string;  // which opening (or "Perimeter" for baseboard)
  note?: string;          // e.g. "45° miter both ends", "rip to wall thickness"
}

// ─── Calculation input ────────────────────────────────────────────────────────

export interface TrimCalculationInput {
  roomId: string;
  projectId: string;
  jobId: string;
  casing_width_mm: number;   // e.g. 63.5 = 2.5", 76 = 3"
  reveal_mm: number;         // e.g. 9.5 = 3/8", 12.7 = 1/2" — reveal from jamb edge
  openings: TrimOpening[];
  perimeter_override_mm?: number;  // if user overrides room-scan perimeter
  config: Pick<MillworkAssemblyConfig, 'casing_joint' | 'stool_nose_mm' | 'trim_waste_factor'>;
}

// ─── Calculation result ───────────────────────────────────────────────────────

export interface TrimCalculationResult {
  pieces: CutPiece[];
  casing_lf: number;       // linear feet of casing material (doors + windows, no baseboard)
  baseboard_lf: number;    // linear feet of baseboard needed
  total_lf: number;        // casing_lf + baseboard_lf
  stock_lf: number;        // total_lf × (1 + waste_factor), rounded up
}

// ─── Stored record ────────────────────────────────────────────────────────────

export interface TrimCalculation {
  id: string;
  roomId: string;
  projectId: string;
  jobId: string;
  casing_width_mm: number;
  reveal_mm: number;
  openings: TrimOpening[];
  perimeter_mm: number;    // the perimeter used (scan or override)
  config: Pick<MillworkAssemblyConfig, 'casing_joint' | 'stool_nose_mm' | 'trim_waste_factor'>;
  result: TrimCalculationResult;
  createdAt: string;
  updatedAt: string;
}
