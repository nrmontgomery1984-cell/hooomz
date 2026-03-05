/**
 * Sample Material Selections Seed — confirmed selections for 2 demo rooms.
 *
 * Living Room (SEED-ROOM-001): "better" tier products
 * Primary Bedroom (SEED-ROOM-002): "good" tier products
 *
 * Uses real SEED-PROD-* IDs from catalog-products.seed.ts.
 * Guard: skips if SEED-SEL-001 already exists.
 */

import { getStorage } from '../../storage/initialize';
import { StoreNames } from '../../storage/StorageAdapter';
import type { ProjectMaterialSelection } from '../../types/materialSelection.types';

const SENTINEL_ID = 'SEED-SEL-001';
const CONFIRMED_AT = '2026-03-01T14:00:00.000Z';
const SEED_TS = '2026-03-01T12:00:00.000Z';

// sqmm → sqft conversion: 1 sqft = 92_903 sqmm
const SQMM_TO_SQFT = 92_903;
// mm → lf: 1 lf = 304.8 mm
const MM_TO_LF = 304.8;

// Living Room: 5486×4267mm ≈ 252 sqft, perimeter ≈ 64 lf
const LR_AREA_SQFT = Math.round((5486 * 4267) / SQMM_TO_SQFT);      // 252
const LR_PERIMETER_LF = Math.round((2 * (5486 + 4267)) / MM_TO_LF);  // 64

// Primary Bedroom: 4267×3657mm ≈ 168 sqft, perimeter ≈ 52 lf
const BR_AREA_SQFT = Math.round((4267 * 3657) / SQMM_TO_SQFT);      // 168
const BR_PERIMETER_LF = Math.round((2 * (4267 + 3657)) / MM_TO_LF);  // 52

// Paint: wall area = perimeter × ceiling height (8ft) × 0.85 (openings)
// Coverage at ~400 sqft/gal, 2 coats
const LR_PAINT_GAL = Math.ceil((LR_PERIMETER_LF * 8 * 0.85 * 2) / 400); // ~3
const BR_PAINT_GAL = Math.ceil((BR_PERIMETER_LF * 8 * 0.85 * 2) / 400); // ~2

function buildSelections(projectId: string): ProjectMaterialSelection[] {
  const jobId = projectId; // jobId === projectId per codebase convention

  return [
    // ─── Living Room — "better" tier ────────────────────────────────────
    {
      id: 'SEED-SEL-001',
      projectId,
      jobId,
      roomId: 'SEED-ROOM-001',
      trade: 'flooring',
      productId: 'SEED-PROD-FLR-B-001',
      productName: 'Premium LVP — Hickory Spice',
      productSku: 'FLR-LVP-BETTER-001',
      tier: 'better',
      quantity: LR_AREA_SQFT,
      unit: 'sqft',
      unitPrice: 4.99,
      wasteFactor: 0.10,
      quantityWithWaste: Math.round(LR_AREA_SQFT * 1.10),
      totalPrice: Math.round(LR_AREA_SQFT * 1.10) * 4.99,
      status: 'confirmed',
      confirmedAt: CONFIRMED_AT,
      confirmedBy: 'Demo',
      notes: '',
      createdAt: SEED_TS,
      updatedAt: CONFIRMED_AT,
    },
    {
      id: 'SEED-SEL-002',
      projectId,
      jobId,
      roomId: 'SEED-ROOM-001',
      trade: 'paint',
      productId: 'SEED-PROD-PNT-B-001',
      productName: 'Premium Interior Latex',
      productSku: 'PNT-INT-BETTER-001',
      tier: 'better',
      quantity: LR_PAINT_GAL,
      unit: 'gallon',
      unitPrice: 54.99,
      wasteFactor: 0.10,
      quantityWithWaste: Math.ceil(LR_PAINT_GAL * 1.10),
      totalPrice: Math.ceil(LR_PAINT_GAL * 1.10) * 54.99,
      status: 'confirmed',
      confirmedAt: CONFIRMED_AT,
      confirmedBy: 'Demo',
      notes: '',
      createdAt: SEED_TS,
      updatedAt: CONFIRMED_AT,
    },
    {
      id: 'SEED-SEL-003',
      projectId,
      jobId,
      roomId: 'SEED-ROOM-001',
      trade: 'trim',
      productId: 'SEED-PROD-TRM-B-001',
      productName: 'Poplar Casing — Craftsman',
      productSku: 'TRM-CASE-BETTER-001',
      tier: 'better',
      quantity: LR_PERIMETER_LF,
      unit: 'lf',
      unitPrice: 1.79,
      wasteFactor: 0.15,
      quantityWithWaste: Math.round(LR_PERIMETER_LF * 1.15),
      totalPrice: Math.round(LR_PERIMETER_LF * 1.15) * 1.79,
      status: 'confirmed',
      confirmedAt: CONFIRMED_AT,
      confirmedBy: 'Demo',
      notes: '',
      createdAt: SEED_TS,
      updatedAt: CONFIRMED_AT,
    },

    // ─── Primary Bedroom — "good" tier ──────────────────────────────────
    {
      id: 'SEED-SEL-004',
      projectId,
      jobId,
      roomId: 'SEED-ROOM-002',
      trade: 'flooring',
      productId: 'SEED-PROD-FLR-G-001',
      productName: 'Standard LVP — Oak Natural',
      productSku: 'FLR-LVP-GOOD-001',
      tier: 'good',
      quantity: BR_AREA_SQFT,
      unit: 'sqft',
      unitPrice: 3.49,
      wasteFactor: 0.10,
      quantityWithWaste: Math.round(BR_AREA_SQFT * 1.10),
      totalPrice: Math.round(BR_AREA_SQFT * 1.10) * 3.49,
      status: 'confirmed',
      confirmedAt: CONFIRMED_AT,
      confirmedBy: 'Demo',
      notes: '',
      createdAt: SEED_TS,
      updatedAt: CONFIRMED_AT,
    },
    {
      id: 'SEED-SEL-005',
      projectId,
      jobId,
      roomId: 'SEED-ROOM-002',
      trade: 'paint',
      productId: 'SEED-PROD-PNT-G-001',
      productName: 'Standard Interior Latex',
      productSku: 'PNT-INT-GOOD-001',
      tier: 'good',
      quantity: BR_PAINT_GAL,
      unit: 'gallon',
      unitPrice: 32.99,
      wasteFactor: 0.10,
      quantityWithWaste: Math.ceil(BR_PAINT_GAL * 1.10),
      totalPrice: Math.ceil(BR_PAINT_GAL * 1.10) * 32.99,
      status: 'confirmed',
      confirmedAt: CONFIRMED_AT,
      confirmedBy: 'Demo',
      notes: '',
      createdAt: SEED_TS,
      updatedAt: CONFIRMED_AT,
    },
    {
      id: 'SEED-SEL-006',
      projectId,
      jobId,
      roomId: 'SEED-ROOM-002',
      trade: 'trim',
      productId: 'SEED-PROD-TRM-G-001',
      productName: 'MDF Casing — Colonial',
      productSku: 'TRM-CASE-GOOD-001',
      tier: 'good',
      quantity: BR_PERIMETER_LF,
      unit: 'lf',
      unitPrice: 0.89,
      wasteFactor: 0.15,
      quantityWithWaste: Math.round(BR_PERIMETER_LF * 1.15),
      totalPrice: Math.round(BR_PERIMETER_LF * 1.15) * 0.89,
      status: 'confirmed',
      confirmedAt: CONFIRMED_AT,
      confirmedBy: 'Demo',
      notes: '',
      createdAt: SEED_TS,
      updatedAt: CONFIRMED_AT,
    },
  ];
}

export async function seedSampleSelections(projectId: string): Promise<boolean> {
  const storage = getStorage();

  // Sentinel guard
  const existing = await storage.get<ProjectMaterialSelection>(
    StoreNames.PROJECT_MATERIAL_SELECTIONS,
    SENTINEL_ID,
  );
  if (existing) return false;

  const selections = buildSelections(projectId);
  await storage.setMany(
    StoreNames.PROJECT_MATERIAL_SELECTIONS,
    selections.map((s) => ({ key: s.id, value: s })),
  );

  return true;
}
