/**
 * Trim Cut Calculator
 *
 * Produces a per-opening cut list grouped by category:
 *   Doors  → Jambs → Doorstop → Casing
 *   Windows → Jambs → Sill (optional) → Casing → Apron (optional)
 *   Room   → Baseboard (perimeter minus door deductions)
 *
 * All inputs and outputs in mm. Display conversion handled by UI.
 *
 * CASING formulas (joint-dependent):
 *   Miter — Side Casing: opening_height + reveal + casing_width (long-point of 45°)
 *            Head Casing: opening_width  + reveal×2 + casing_width×2
 *   Butt  — Side Casing: opening_height + reveal
 *            Head Casing: opening_width  + reveal×2 + casing_width×2
 *
 * JAMB pieces: cut to rough opening dimensions (width-ripped to wall thickness separately)
 *   Side Jambs (2): opening_height
 *   Head Jamb  (1): opening_width
 *
 * DOORSTOP (doors only):
 *   Side Stops (2): opening_height − floor_clearance_mm
 *   Head Stop  (1): opening_width
 *
 * SILL / stool board (windows only, when has_stool):
 *   Sill (1): opening_width + reveal×2 + casing_width×2 + stool_nose_mm×2
 *
 * APRON (windows only, when has_apron):
 *   Apron (1): opening_width + reveal×2 + casing_width×2
 *
 * BASEBOARD:
 *   perimeter_mm − sum(door_width_mm per door)
 */

import type {
  TrimCalculationInput,
  TrimCalculationResult,
  CutPiece,
  TrimOpening,
} from '../types/trim.types';

const MM_PER_LF = 304.8;

// ─── Piece builders ────────────────────────────────────────────────────────────

function jambPieces(opening: TrimOpening): CutPiece[] {
  return [
    {
      category: 'jamb',
      label: 'Side Jamb',
      length_mm: opening.height_mm,
      qty: 2,
      opening_label: opening.label,
      note: 'rip to wall thickness',
    },
    {
      category: 'jamb',
      label: 'Head Jamb',
      length_mm: opening.width_mm,
      qty: 1,
      opening_label: opening.label,
      note: 'rip to wall thickness',
    },
  ];
}

function doorStopPieces(
  opening: TrimOpening,
  floor_clearance_mm: number,
  joint: 'miter' | 'butt',
): CutPiece[] {
  return [
    {
      category: 'stop',
      label: 'Side Stop',
      length_mm: opening.height_mm - floor_clearance_mm,
      qty: 2,
      opening_label: opening.label,
      note: `${floor_clearance_mm.toFixed(0)} mm clearance at floor`,
    },
    {
      category: 'stop',
      label: 'Head Stop',
      length_mm: opening.width_mm,
      qty: 1,
      opening_label: opening.label,
      note: joint === 'miter' ? '45° miter both ends' : 'square both ends',
    },
  ];
}

function casingPieces(
  opening: TrimOpening,
  cw: number,
  rev: number,
  joint: 'miter' | 'butt',
): CutPiece[] {
  const sideLength =
    joint === 'miter'
      ? opening.height_mm + rev + cw   // long-point of 45° miter
      : opening.height_mm + rev;

  const headLength = opening.width_mm + rev * 2 + cw * 2;

  const sideNote =
    opening.kind === 'window' && opening.has_stool
      ? joint === 'miter'
        ? '45° miter top · square bottom on sill'
        : 'square bottom on sill'
      : joint === 'miter'
      ? '45° miter top · square bottom'
      : 'square both ends';

  return [
    {
      category: 'casing',
      label: 'Side Casing',
      length_mm: sideLength,
      qty: 2,
      opening_label: opening.label,
      note: sideNote,
    },
    {
      category: 'casing',
      label: 'Head Casing',
      length_mm: headLength,
      qty: 1,
      opening_label: opening.label,
      note: joint === 'miter' ? '45° miter both ends' : 'square both ends',
    },
  ];
}

function sillPiece(
  opening: TrimOpening,
  cw: number,
  rev: number,
  stool_nose_mm: number,
): CutPiece {
  return {
    category: 'sill',
    label: 'Sill',
    length_mm: opening.width_mm + rev * 2 + cw * 2 + stool_nose_mm * 2,
    qty: 1,
    opening_label: opening.label,
    note: `notch ends · ${stool_nose_mm.toFixed(0)} mm nose past casing`,
  };
}

function apronPiece(
  opening: TrimOpening,
  cw: number,
  rev: number,
): CutPiece {
  return {
    category: 'apron',
    label: 'Apron',
    length_mm: opening.width_mm + rev * 2 + cw * 2,
    qty: 1,
    opening_label: opening.label,
    note: 'back-bevel ends to match casing profile',
  };
}

// ─── Main function ────────────────────────────────────────────────────────────

export function calculateTrimCutList(input: TrimCalculationInput): TrimCalculationResult {
  const { casing_width_mm: cw, reveal_mm: rev, openings, config } = input;
  const { casing_joint: joint, stool_nose_mm, trim_waste_factor } = config;

  const perimeter_mm = input.perimeter_override_mm ?? 0;
  const floor_clearance_mm = 13; // ½" standard clearance at floor for door stop

  const pieces: CutPiece[] = [];

  for (const opening of openings) {
    // Jambs — both doors and windows
    pieces.push(...jambPieces(opening));

    if (opening.kind === 'door') {
      // Doorstop — doors only
      pieces.push(...doorStopPieces(opening, floor_clearance_mm, joint));
    }

    if (opening.kind === 'window' && opening.has_stool) {
      // Sill — windows only
      pieces.push(sillPiece(opening, cw, rev, stool_nose_mm));
    }

    // Casing — both doors and windows
    pieces.push(...casingPieces(opening, cw, rev, joint));

    if (opening.kind === 'window' && opening.has_stool && opening.has_apron) {
      // Apron — windows with sill only
      pieces.push(apronPiece(opening, cw, rev));
    }
  }

  // Casing linear footage (jamb + stop + casing + sill + apron; not baseboard)
  const casing_lf = pieces.reduce((s, p) => s + (p.length_mm / MM_PER_LF) * p.qty, 0);

  // Baseboard
  const doorDeduction = openings
    .filter((o) => o.kind === 'door')
    .reduce((s, o) => s + o.width_mm, 0);
  const bb_mm  = Math.max(0, perimeter_mm - doorDeduction);
  const bb_lf  = bb_mm / MM_PER_LF;

  if (bb_mm > 0) {
    pieces.push({
      category: 'baseboard',
      label: 'Baseboard',
      length_mm: bb_mm,
      qty: 1,
      opening_label: 'Perimeter',
      note: `${bb_lf.toFixed(1)} lf net · cope or miter inside corners`,
    });
  }

  const total_lf = casing_lf + bb_lf;
  const stock_lf = Math.ceil(total_lf * (1 + trim_waste_factor) * 10) / 10;

  return { pieces, casing_lf, baseboard_lf: bb_lf, total_lf, stock_lf };
}
