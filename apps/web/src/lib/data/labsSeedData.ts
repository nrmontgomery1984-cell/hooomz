/**
 * Labs Seed Data
 * Initial catalog items for products, techniques, and tool methods
 * Derived from Hooomz Interiors trades: flooring, paint, finish carpentry, tile, drywall
 */

import type { LabsProduct, LabsTechnique, LabsToolMethod } from '@hooomz/shared-contracts';

type SeedProduct = Omit<LabsProduct, 'id' | 'metadata'>;
type SeedTechnique = Omit<LabsTechnique, 'id' | 'metadata'>;
type SeedToolMethod = Omit<LabsToolMethod, 'id' | 'metadata'>;

// ============================================================================
// Products
// ============================================================================

export const SEED_PRODUCTS: SeedProduct[] = [
  // Flooring
  { name: 'LVP (Luxury Vinyl Plank)', brand: undefined, category: 'Flooring', subcategory: 'Vinyl', tags: ['lvp', 'vinyl', 'click-lock'], addedBy: 'system', isActive: true },
  { name: 'Engineered Hardwood', brand: undefined, category: 'Flooring', subcategory: 'Hardwood', tags: ['hardwood', 'engineered'], addedBy: 'system', isActive: true },
  { name: 'Laminate Flooring', brand: undefined, category: 'Flooring', subcategory: 'Laminate', tags: ['laminate', 'click-lock'], addedBy: 'system', isActive: true },
  { name: 'Carpet', brand: undefined, category: 'Flooring', subcategory: 'Carpet', tags: ['carpet', 'soft'], addedBy: 'system', isActive: true },
  { name: 'Floor Underlayment', brand: undefined, category: 'Flooring', subcategory: 'Underlayment', tags: ['underlayment', 'subfloor'], addedBy: 'system', isActive: true },
  { name: 'Transition Strips', brand: undefined, category: 'Flooring', subcategory: 'Accessories', tags: ['transition', 'molding'], addedBy: 'system', isActive: true },

  // Paint
  { name: 'Interior Latex Paint', brand: undefined, category: 'Paint', subcategory: 'Wall Paint', tags: ['latex', 'interior', 'wall'], addedBy: 'system', isActive: true },
  { name: 'Primer', brand: undefined, category: 'Paint', subcategory: 'Primer', tags: ['primer', 'prep'], addedBy: 'system', isActive: true },
  { name: 'Trim Paint (Semi-Gloss)', brand: undefined, category: 'Paint', subcategory: 'Trim Paint', tags: ['trim', 'semi-gloss', 'enamel'], addedBy: 'system', isActive: true },
  { name: 'Ceiling Paint (Flat)', brand: undefined, category: 'Paint', subcategory: 'Ceiling Paint', tags: ['ceiling', 'flat', 'white'], addedBy: 'system', isActive: true },
  { name: 'Caulking', brand: undefined, category: 'Paint', subcategory: 'Sealant', tags: ['caulk', 'sealant', 'gap-fill'], addedBy: 'system', isActive: true },
  { name: 'Painter\'s Tape', brand: undefined, category: 'Paint', subcategory: 'Supplies', tags: ['tape', 'masking'], addedBy: 'system', isActive: true },

  // Finish Carpentry
  { name: 'Baseboard Molding', brand: undefined, category: 'Trim', subcategory: 'Baseboard', tags: ['baseboard', 'molding', 'mdf'], addedBy: 'system', isActive: true },
  { name: 'Crown Molding', brand: undefined, category: 'Trim', subcategory: 'Crown', tags: ['crown', 'molding', 'ceiling'], addedBy: 'system', isActive: true },
  { name: 'Casing (Door/Window)', brand: undefined, category: 'Trim', subcategory: 'Casing', tags: ['casing', 'door', 'window'], addedBy: 'system', isActive: true },
  { name: 'Quarter Round', brand: undefined, category: 'Trim', subcategory: 'Molding', tags: ['quarter-round', 'shoe', 'molding'], addedBy: 'system', isActive: true },
  { name: 'Brad Nails (18ga)', brand: undefined, category: 'Trim', subcategory: 'Fasteners', tags: ['nails', 'brad', '18-gauge'], addedBy: 'system', isActive: true },
  { name: 'Wood Filler', brand: undefined, category: 'Trim', subcategory: 'Filler', tags: ['filler', 'putty', 'nail-holes'], addedBy: 'system', isActive: true },

  // Drywall
  { name: 'Drywall Sheets (1/2")', brand: undefined, category: 'Drywall', subcategory: 'Board', tags: ['drywall', 'gypsum', 'sheetrock'], addedBy: 'system', isActive: true },
  { name: 'Drywall Compound', brand: undefined, category: 'Drywall', subcategory: 'Compound', tags: ['mud', 'compound', 'joint'], addedBy: 'system', isActive: true },
  { name: 'Drywall Tape', brand: undefined, category: 'Drywall', subcategory: 'Tape', tags: ['tape', 'paper', 'mesh'], addedBy: 'system', isActive: true },
  { name: 'Drywall Screws', brand: undefined, category: 'Drywall', subcategory: 'Fasteners', tags: ['screws', 'drywall', 'coarse-thread'], addedBy: 'system', isActive: true },

  // Tile
  { name: 'Ceramic Tile', brand: undefined, category: 'Tile', subcategory: 'Ceramic', tags: ['ceramic', 'tile', 'wall'], addedBy: 'system', isActive: true },
  { name: 'Porcelain Tile', brand: undefined, category: 'Tile', subcategory: 'Porcelain', tags: ['porcelain', 'tile', 'floor'], addedBy: 'system', isActive: true },
  { name: 'Thinset Mortar', brand: undefined, category: 'Tile', subcategory: 'Adhesive', tags: ['thinset', 'mortar', 'adhesive'], addedBy: 'system', isActive: true },
  { name: 'Tile Grout', brand: undefined, category: 'Tile', subcategory: 'Grout', tags: ['grout', 'sanded', 'unsanded'], addedBy: 'system', isActive: true },
  { name: 'Tile Spacers', brand: undefined, category: 'Tile', subcategory: 'Accessories', tags: ['spacers', 'alignment'], addedBy: 'system', isActive: true },
];

// ============================================================================
// Techniques
// ============================================================================

export const SEED_TECHNIQUES: SeedTechnique[] = [
  // Flooring
  { name: 'Click-Lock Installation', category: 'Flooring', description: 'Standard floating floor installation with click-lock planks', sopIds: ['HI-SOP-FL-001'], isDefault: true, addedBy: 'system', isActive: true },
  { name: 'Glue-Down Installation', category: 'Flooring', description: 'Adhesive-applied flooring directly to subfloor', sopIds: ['HI-SOP-FL-001'], addedBy: 'system', isActive: true },
  { name: 'Stagger Pattern (1/3 offset)', category: 'Flooring', description: 'Standard 1/3 board offset for visual pattern and structural integrity', addedBy: 'system', isActive: true },
  { name: 'Transition Installation', category: 'Flooring', description: 'Installing transition strips between different flooring types', sopIds: ['HI-SOP-FL-003'], addedBy: 'system', isActive: true },

  // Paint
  { name: 'Cut-In (Brush)', category: 'Paint', description: 'Cutting in edges with angled brush before rolling', sopIds: ['HI-SOP-PT-001'], isDefault: true, addedBy: 'system', isActive: true },
  { name: 'W-Pattern Roll', category: 'Paint', description: 'Rolling paint in W pattern for even coverage', sopIds: ['HI-SOP-PT-001'], addedBy: 'system', isActive: true },
  { name: 'Back-Roll', category: 'Paint', description: 'Immediately back-rolling after spraying for even finish', addedBy: 'system', isActive: true },
  { name: 'Two-Coat System', category: 'Paint', description: 'Primer + topcoat for proper coverage and adhesion', sopIds: ['HI-SOP-PT-001'], isDefault: true, addedBy: 'system', isActive: true },

  // Finish Carpentry
  { name: 'Cope Joint', category: 'Trim', description: 'Coping inside corners for tight fit on crown and base molding', sopIds: ['HI-SOP-FC-001'], addedBy: 'system', isActive: true },
  { name: 'Miter Joint', category: 'Trim', description: '45-degree miter cut for outside corners', sopIds: ['HI-SOP-FC-001'], isDefault: true, addedBy: 'system', isActive: true },
  { name: 'Scarf Joint', category: 'Trim', description: 'Joining two pieces of trim on a long wall run', addedBy: 'system', isActive: true },
  { name: 'Nail & Fill', category: 'Trim', description: 'Brad nail followed by wood filler and sanding', sopIds: ['HI-SOP-FC-002'], isDefault: true, addedBy: 'system', isActive: true },

  // Drywall
  { name: 'Butt Joint Taping', category: 'Drywall', description: 'Taping non-tapered butt joints with feathered compound', sopIds: ['HI-SOP-DW-002'], addedBy: 'system', isActive: true },
  { name: 'Three-Coat Mud', category: 'Drywall', description: 'Tape coat, block coat, skim coat — sand between each', sopIds: ['HI-SOP-DW-002'], isDefault: true, addedBy: 'system', isActive: true },
  { name: 'Horizontal Hanging', category: 'Drywall', description: 'Hanging drywall sheets horizontally on walls for fewer joints', sopIds: ['HI-SOP-DW-001'], isDefault: true, addedBy: 'system', isActive: true },

  // Tile
  { name: 'Thinset Application (Notched Trowel)', category: 'Tile', description: 'Spreading thinset with notched trowel at 45-degree angle', sopIds: ['HI-SOP-TL-001'], isDefault: true, addedBy: 'system', isActive: true },
  { name: 'Back-Butter', category: 'Tile', description: 'Applying thinset to back of tile for full coverage', sopIds: ['HI-SOP-TL-001'], addedBy: 'system', isActive: true },
  { name: 'Dry Layout', category: 'Tile', description: 'Planning tile layout dry before adhesive to minimize cuts', sopIds: ['HI-SOP-TL-001'], addedBy: 'system', isActive: true },
];

// ============================================================================
// Tool Methods
// ============================================================================

export const SEED_TOOL_METHODS: SeedToolMethod[] = [
  // Cutting
  { toolType: 'Saw', name: 'Miter Saw (10" Compound)', specification: '10" blade, compound slide', addedBy: 'system', isActive: true },
  { toolType: 'Saw', name: 'Table Saw', specification: 'Portable jobsite table saw', addedBy: 'system', isActive: true },
  { toolType: 'Saw', name: 'Tile Wet Saw', specification: 'Wet tile saw with diamond blade', addedBy: 'system', isActive: true },
  { toolType: 'Saw', name: 'Oscillating Multi-Tool', specification: 'For flush cuts and detail work', addedBy: 'system', isActive: true },

  // Fastening
  { toolType: 'Nailer', name: 'Brad Nailer (18ga)', specification: '18-gauge pneumatic or cordless', addedBy: 'system', isActive: true },
  { toolType: 'Nailer', name: 'Finish Nailer (16ga)', specification: '16-gauge for heavier trim', addedBy: 'system', isActive: true },
  { toolType: 'Driver', name: 'Impact Driver', specification: 'Cordless 1/4" hex', addedBy: 'system', isActive: true },
  { toolType: 'Driver', name: 'Drywall Screw Gun', specification: 'Depth-set clutch for consistent depth', addedBy: 'system', isActive: true },

  // Surface Prep
  { toolType: 'Sander', name: 'Random Orbit Sander', specification: '5" pad, 120-220 grit progression', addedBy: 'system', isActive: true },
  { toolType: 'Sander', name: 'Drywall Sander (Pole)', specification: 'Pole sander with vacuum attachment', addedBy: 'system', isActive: true },

  // Paint
  { toolType: 'Roller', name: 'Paint Roller (3/8" Nap)', specification: '9" frame, 3/8" microfiber nap for smooth walls', addedBy: 'system', isActive: true },
  { toolType: 'Roller', name: 'Paint Roller (1/2" Nap)', specification: '9" frame, 1/2" nap for textured walls', addedBy: 'system', isActive: true },
  { toolType: 'Brush', name: 'Angled Sash Brush (2.5")', specification: '2.5" angled for cutting in', addedBy: 'system', isActive: true },
  { toolType: 'Sprayer', name: 'Airless Paint Sprayer', specification: 'For large areas and trim spraying', addedBy: 'system', isActive: true },

  // Measuring
  { toolType: 'Level', name: 'Laser Level', specification: 'Self-leveling cross-line laser', addedBy: 'system', isActive: true },
  { toolType: 'Trowel', name: 'Notched Trowel (1/4" x 3/8")', specification: 'For thinset application', addedBy: 'system', isActive: true },
];

/**
 * Seed the Labs catalogs with initial data
 * Call this once during initialization or when catalogs are empty
 */
export async function seedLabsCatalogs(labsServices: {
  catalog: {
    createProduct: (data: SeedProduct) => Promise<any>;
    createTechnique: (data: SeedTechnique) => Promise<any>;
    createToolMethod: (data: SeedToolMethod) => Promise<any>;
    findAllProducts: () => Promise<any[]>;
    findAllTechniques: () => Promise<any[]>;
    findAllToolMethods: () => Promise<any[]>;
  };
}): Promise<{ products: number; techniques: number; toolMethods: number }> {
  const existing = {
    products: await labsServices.catalog.findAllProducts(),
    techniques: await labsServices.catalog.findAllTechniques(),
    toolMethods: await labsServices.catalog.findAllToolMethods(),
  };

  // Only seed if catalogs are empty
  let seededProducts = 0;
  let seededTechniques = 0;
  let seededToolMethods = 0;

  if (existing.products.length === 0) {
    for (const product of SEED_PRODUCTS) {
      await labsServices.catalog.createProduct(product);
      seededProducts++;
    }
  }

  if (existing.techniques.length === 0) {
    for (const technique of SEED_TECHNIQUES) {
      await labsServices.catalog.createTechnique(technique);
      seededTechniques++;
    }
  }

  if (existing.toolMethods.length === 0) {
    for (const toolMethod of SEED_TOOL_METHODS) {
      await labsServices.catalog.createToolMethod(toolMethod);
      seededToolMethods++;
    }
  }

  return { products: seededProducts, techniques: seededTechniques, toolMethods: seededToolMethods };
}
