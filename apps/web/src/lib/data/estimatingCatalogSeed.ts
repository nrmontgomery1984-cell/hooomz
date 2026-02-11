/**
 * Estimating Catalog Seed Data
 *
 * Materials and labor rates for Hooomz Interiors trades:
 * flooring, paint, trim, drywall, tile. Local NB pricing.
 *
 * Idempotent: skips if catalog already has items.
 */

import type { Services } from '../services';
import type { CreateCatalogItem } from '@hooomz/estimating';

// ============================================================================
// Catalog Items
// ============================================================================

const MATERIALS: Omit<CreateCatalogItem, 'isActive'>[] = [
  // Flooring
  { type: 'material', name: 'Laminate Flooring', category: 'flooring', unit: 'sqft', unitCost: 2.49, supplier: 'Kent' },
  { type: 'material', name: 'Vinyl Plank (LVP)', category: 'flooring', unit: 'sqft', unitCost: 3.99, supplier: 'Kent' },
  { type: 'material', name: 'Hardwood Flooring', category: 'flooring', unit: 'sqft', unitCost: 6.99, supplier: 'Kent' },
  { type: 'material', name: 'Flooring Underlayment', category: 'flooring', unit: 'sqft', unitCost: 0.59, supplier: 'Kent' },
  { type: 'material', name: 'T-Molding Transition', category: 'flooring', unit: 'each', unitCost: 12.99, supplier: 'Kent' },

  // Paint
  { type: 'material', name: 'Interior Paint (gal)', category: 'paint', unit: 'gal', unitCost: 42.99, supplier: 'Home Hardware' },
  { type: 'material', name: 'Exterior Paint (gal)', category: 'paint', unit: 'gal', unitCost: 54.99, supplier: 'Home Hardware' },
  { type: 'material', name: 'Primer (gal)', category: 'paint', unit: 'gal', unitCost: 29.99, supplier: 'Home Hardware' },
  { type: 'material', name: "Painter's Tape", category: 'paint', unit: 'each', unitCost: 6.99, supplier: 'Home Hardware' },
  { type: 'material', name: 'Drop Cloth', category: 'paint', unit: 'each', unitCost: 4.99, supplier: 'Home Hardware' },

  // Trim
  { type: 'material', name: 'MDF Baseboard 3.5"', category: 'trim', unit: 'lf', unitCost: 1.29, supplier: 'Kent' },
  { type: 'material', name: 'MDF Baseboard 5.25"', category: 'trim', unit: 'lf', unitCost: 2.49, supplier: 'Kent' },
  { type: 'material', name: 'Door Casing', category: 'trim', unit: 'lf', unitCost: 1.89, supplier: 'Kent' },
  { type: 'material', name: 'Crown Moulding', category: 'trim', unit: 'lf', unitCost: 3.49, supplier: 'Kent' },
  { type: 'material', name: 'Shoe Moulding', category: 'trim', unit: 'lf', unitCost: 0.79, supplier: 'Kent' },
  { type: 'material', name: 'Quarter Round', category: 'trim', unit: 'lf', unitCost: 0.69, supplier: 'Kent' },

  // Doors
  { type: 'material', name: 'Interior Door (prehung)', category: 'doors', unit: 'each', unitCost: 189.99, supplier: 'Kent' },

  // Drywall
  { type: 'material', name: 'Drywall Sheet 4x8', category: 'drywall', unit: 'each', unitCost: 14.99, supplier: 'Kent' },
  { type: 'material', name: 'Joint Compound (box)', category: 'drywall', unit: 'box', unitCost: 24.99, supplier: 'Kent' },
  { type: 'material', name: 'Drywall Tape', category: 'drywall', unit: 'each', unitCost: 4.99, supplier: 'Kent' },
  { type: 'material', name: 'Drywall Screws (1lb)', category: 'drywall', unit: 'bag', unitCost: 8.99, supplier: 'Home Hardware' },

  // Tile
  { type: 'material', name: 'Tile (floor)', category: 'tile', unit: 'sqft', unitCost: 4.99, supplier: 'Kent' },
  { type: 'material', name: 'Tile Adhesive', category: 'tile', unit: 'bag', unitCost: 29.99, supplier: 'Kent' },
  { type: 'material', name: 'Grout', category: 'tile', unit: 'bag', unitCost: 14.99, supplier: 'Kent' },

  // General supplies
  { type: 'material', name: 'Construction Adhesive', category: 'general', unit: 'each', unitCost: 5.99, supplier: 'Home Hardware' },
  { type: 'material', name: 'Wood Filler', category: 'general', unit: 'each', unitCost: 8.99, supplier: 'Home Hardware' },
  { type: 'material', name: 'Brad Nails (1000ct)', category: 'general', unit: 'box', unitCost: 12.99, supplier: 'Home Hardware' },
  { type: 'material', name: 'Finish Nails (1lb)', category: 'general', unit: 'bag', unitCost: 7.99, supplier: 'Home Hardware' },
  { type: 'material', name: 'Caulk (tube)', category: 'general', unit: 'each', unitCost: 4.99, supplier: 'Home Hardware' },
];

const LABOR: Omit<CreateCatalogItem, 'isActive'>[] = [
  { type: 'labor', name: 'General Carpenter', category: 'carpentry', unit: 'hour', unitCost: 45.00 },
  { type: 'labor', name: 'Finish Carpenter', category: 'carpentry', unit: 'hour', unitCost: 55.00 },
  { type: 'labor', name: 'Flooring Installation', category: 'flooring', unit: 'sqft', unitCost: 3.00 },
  { type: 'labor', name: 'Interior Painting', category: 'paint', unit: 'sqft', unitCost: 1.50 },
  { type: 'labor', name: 'Trim Installation', category: 'trim', unit: 'lf', unitCost: 2.50 },
  { type: 'labor', name: 'Drywall Installation', category: 'drywall', unit: 'sqft', unitCost: 1.25 },
  { type: 'labor', name: 'Drywall Finishing', category: 'drywall', unit: 'sqft', unitCost: 1.00 },
  { type: 'labor', name: 'Tile Installation', category: 'tile', unit: 'sqft', unitCost: 6.00 },
  { type: 'labor', name: 'General Laborer', category: 'general', unit: 'hour', unitCost: 25.00 },
  { type: 'labor', name: 'Demolition/Removal', category: 'general', unit: 'hour', unitCost: 35.00 },
];

const ALL_ITEMS: CreateCatalogItem[] = [
  ...MATERIALS.map((m) => ({ ...m, isActive: true })),
  ...LABOR.map((l) => ({ ...l, isActive: true })),
];

// ============================================================================
// Seed Function
// ============================================================================

export async function seedEstimatingCatalog(services: Services): Promise<number> {
  const existing = await services.estimating.catalog.findAll();
  if (existing.total > 0) return 0; // Already seeded

  for (const item of ALL_ITEMS) {
    await services.estimating.catalog.create(item);
  }

  return ALL_ITEMS.length;
}
