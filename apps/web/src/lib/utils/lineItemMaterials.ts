/**
 * Line Item → Assembly → Materials + Tools resolution
 *
 * Maps estimate line items / tasks back to their assembly to extract
 * a materials list (name + quantity) and a tools checklist.
 */

import type { CostCatalog, Assembly, MaterialItem } from '../types/costCatalog.types';
import { RATE_ASSEMBLY_MAP } from '../instantEstimate';
import { CostCategory } from '@hooomz/shared-contracts';

// ============================================================================
// Types
// ============================================================================

export interface ResolvedMaterialLine {
  name: string;
  quantityNeeded: number;
  unit: string;
}

export interface ResolvedAssemblyBreakdown {
  assemblyName: string;
  assemblyUnit: string;
  materials: ResolvedMaterialLine[];
  tools: string[];
}

// ============================================================================
// Tools per assembly key — what you need on-site
// ============================================================================

const ASSEMBLY_TOOLS: Record<string, string[]> = {
  // Flooring — LVP / Laminate
  lvp_floor_complete: [
    'Tape measure', 'Utility knife', 'Tapping block', 'Pull bar',
    'Spacers', 'Rubber mallet', 'Speed square', 'Pencil', 'T-square',
  ],
  laminate_floor_complete: [
    'Tape measure', 'Utility knife', 'Tapping block', 'Pull bar',
    'Spacers', 'Rubber mallet', 'Speed square', 'Pencil',
  ],
  // Flooring — Hardwood
  hardwood_floor_complete: [
    'Pneumatic nailer', 'Compressor', 'Tape measure', 'Chalk line',
    'Pry bar', 'Rubber mallet', 'Pull bar', 'Pencil',
  ],
  // Flooring — Tile
  tile_floor_complete: [
    'Tile cutter', 'Notched trowel', 'Grout float', 'Tile spacers',
    'Mixing bucket', 'Sponge', 'Level', 'Tape measure', 'Pencil',
  ],
  tile_backsplash: [
    'Tile cutter', 'Notched trowel', 'Grout float', 'Tile spacers',
    'Mixing bucket', 'Sponge', 'Level', 'Tape measure', 'Pencil',
  ],
  tile_shower: [
    'Tile cutter', 'Notched trowel', 'Grout float', 'Tile spacers',
    'Mixing bucket', 'Sponge', 'Level', 'Tape measure', 'Pencil',
    'Waterproofing trowel',
  ],
  // Flooring — Carpet
  carpet_floor_complete: [
    'Knee kicker', 'Carpet stretcher', 'Seam roller', 'Utility knife',
    'Stapler', 'Tape measure', 'Chalk line',
  ],
  // Paint
  paint_walls: [
    'Roller (9")', 'Roller tray', 'Brush (2")', 'Brush (4")',
    'Painter\'s tape', 'Drop cloths', 'Extension pole', 'Ladder',
    '5-in-1 tool', 'Edger',
  ],
  paint_ceiling: [
    'Roller (9")', 'Roller tray', 'Brush (2")',
    'Painter\'s tape', 'Drop cloths', 'Extension pole', 'Ladder',
  ],
  paint_full_prep: [
    'Roller (9")', 'Roller tray', 'Brush (2")', 'Brush (4")',
    'Painter\'s tape', 'Drop cloths', 'Extension pole', 'Ladder',
    '5-in-1 tool', 'Edger', 'Sanding block', 'Putty knife',
  ],
  // Trim — Baseboard / Crown
  baseboard_install: [
    'Mitre saw', 'Compressor', 'Brad nailer', 'Tape measure',
    'Pencil', 'Caulk gun', 'Nail set', 'Level',
  ],
  baseboard_crown_install: [
    'Mitre saw', 'Compressor', 'Brad nailer', 'Tape measure',
    'Pencil', 'Caulk gun', 'Nail set', 'Spring clamps',
  ],
  // Trim — Doors
  door_trim_interior: [
    'Mitre saw', 'Compressor', 'Brad nailer', 'Level',
    'Tape measure', 'Shims', 'Drill/driver', 'Pencil',
  ],
  door_trim_exterior: [
    'Mitre saw', 'Compressor', 'Brad nailer', 'Level',
    'Tape measure', 'Shims', 'Drill/driver', 'Pencil', 'Caulk gun',
  ],
  // Trim — Windows
  window_trim_medium: [
    'Mitre saw', 'Compressor', 'Brad nailer', 'Level',
    'Tape measure', 'Pencil',
  ],
  // Hardware
  door_hardware_full: [
    'Drill/driver', 'Tape measure', 'Pencil', 'Chisel',
    'Door hardware template',
  ],
  // Drywall
  drywall_full_room: [
    'Drywall saw', 'Utility knife', 'Taping knife (4")',
    'Taping knife (6")', 'Taping knife (10")', 'Mud pan',
    'Sanding block', 'T-square', 'Drill/driver',
  ],
  drywall_patches: [
    'Utility knife', 'Taping knife (4")', 'Taping knife (6")',
    'Mud pan', 'Sanding block', 'Drill/driver',
  ],
};

// ============================================================================
// Reverse mapping: CostCategory → catalog material category
// ============================================================================

const COST_CATEGORY_TO_CATALOG: Partial<Record<string, string>> = {
  [CostCategory.FLOORING]: 'flooring',
  [CostCategory.PAINTING]: 'paint',
  [CostCategory.INTERIOR_TRIM]: 'trim',
  [CostCategory.DRYWALL]: 'drywall',
  [CostCategory.WINDOWS_DOORS]: 'doors',
  [CostCategory.MATERIALS]: 'general',
  [CostCategory.LABOR]: 'carpentry',
};

// ============================================================================
// Match line item description → material key in catalog
// ============================================================================

function findMaterialKey(
  description: string,
  catalogCategory: string,
  catalog: CostCatalog,
): string | null {
  const materials = catalog.materials[catalogCategory];
  if (!materials) return null;

  const desc = description.toLowerCase();

  // Exact name match first
  for (const [key, mat] of Object.entries(materials)) {
    if (mat.name.toLowerCase() === desc) return key;
  }

  // Partial match: description contains material name or vice versa
  for (const [key, mat] of Object.entries(materials)) {
    const matName = mat.name.toLowerCase();
    if (desc.includes(matName) || matName.includes(desc)) return key;
  }

  // Fuzzy: check if description contains the key (e.g., "lvp" in "Install LVP flooring")
  for (const key of Object.keys(materials)) {
    const keyWords = key.replace(/_/g, ' ');
    if (desc.includes(keyWords) || desc.includes(key)) return key;
  }

  return null;
}

// ============================================================================
// Find assembly key for a material key via RATE_ASSEMBLY_MAP
// ============================================================================

function findAssemblyKey(materialKey: string): string | null {
  const sections = RATE_ASSEMBLY_MAP as Record<string, Record<string, unknown>>;
  for (const sectionEntries of Object.values(sections)) {
    const entry = sectionEntries[materialKey];
    if (entry) {
      // Paint rates return { wall, ceiling } instead of a string
      if (typeof entry === 'string') return entry;
      if (typeof entry === 'object' && entry !== null && 'wall' in entry) {
        return (entry as { wall: string }).wall;
      }
    }
  }
  return null;
}

// ============================================================================
// Find the assembly key string (not the Assembly object) for tools lookup
// ============================================================================

function findAssemblyKeyForTask(
  taskName: string,
  sopCode: string | undefined,
  catalog: CostCatalog,
): string | null {
  // 1. Direct SOP code mapping
  if (sopCode) {
    const key = SOP_TO_ASSEMBLY[sopCode];
    if (key && catalog.assemblies[key]) return key;
  }

  // 2. Fuzzy match task name against assembly names
  const name = taskName.toLowerCase();
  for (const [key, assembly] of Object.entries(catalog.assemblies)) {
    const asmName = assembly.name.toLowerCase();
    if (name.includes(asmName) || asmName.includes(name)) return key;
  }

  // 3. Keyword matching
  for (const [terms, assemblyKey] of KEYWORDS) {
    if (terms.some((t) => name.includes(t))) {
      if (catalog.assemblies[assemblyKey]) return assemblyKey;
    }
  }

  return null;
}

function findAssemblyKeyForLineItem(
  description: string,
  category: string,
  catalog: CostCatalog,
): string | null {
  const catalogCategory = COST_CATEGORY_TO_CATALOG[category];
  if (!catalogCategory) return null;

  const materialKey = findMaterialKey(description, catalogCategory, catalog);
  if (!materialKey) {
    if (catalogCategory === 'flooring') {
      const tileKey = findMaterialKey(description, 'tile', catalog);
      if (tileKey) return findAssemblyKey(tileKey);
    }
    return null;
  }

  return findAssemblyKey(materialKey);
}

// ============================================================================
// SOP code → assembly key mapping
// ============================================================================

const SOP_TO_ASSEMBLY: Record<string, string> = {
  'HI-SOP-FL-001': 'lvp_floor_complete',
  'HI-SOP-FL-002': 'tile_floor_complete',
  'HI-SOP-FL-003': 'hardwood_floor_complete',
  'HI-SOP-FL-004': 'lvp_floor_complete',
  'HI-SOP-FL-005': 'laminate_floor_complete',
  'HI-SOP-FL-006': 'carpet_floor_complete',
  'HI-SOP-FL-007': 'tile_floor_complete',
  'HI-SOP-PT-001': 'paint_walls',
  'HI-SOP-PT-002': 'paint_ceiling',
  'HI-SOP-PT-003': 'paint_full_prep',
  'HI-SOP-FC-001': 'baseboard_install',
  'HI-SOP-FC-002': 'baseboard_crown_install',
  'HI-SOP-FC-003': 'door_trim_interior',
  'HI-SOP-FC-004': 'door_trim_exterior',
  'HI-SOP-FC-005': 'door_trim_interior',
  'HI-SOP-FC-007': 'window_trim_medium',
  'HI-SOP-FC-008': 'door_hardware_full',
  'HI-SOP-DW-001': 'drywall_full_room',
  'HI-SOP-DW-002': 'drywall_full_room',
  'HI-SOP-DW-003': 'drywall_patches',
};

// ============================================================================
// Keyword matching table (shared)
// ============================================================================

const KEYWORDS: [string[], string][] = [
  [['lvp', 'lvt', 'vinyl plank'], 'lvp_floor_complete'],
  [['hardwood'], 'hardwood_floor_complete'],
  [['laminate'], 'laminate_floor_complete'],
  [['carpet'], 'carpet_floor_complete'],
  [['tile floor', 'floor tile'], 'tile_floor_complete'],
  [['backsplash'], 'tile_backsplash'],
  [['shower tile'], 'tile_shower'],
  [['paint wall', 'prime wall'], 'paint_walls'],
  [['paint ceil', 'prime ceil'], 'paint_ceiling'],
  [['baseboard', 'base board'], 'baseboard_install'],
  [['crown'], 'baseboard_crown_install'],
  [['door trim', 'door casing'], 'door_trim_interior'],
  [['window trim', 'window casing'], 'window_trim_medium'],
  [['drywall patch'], 'drywall_patches'],
  [['drywall'], 'drywall_full_room'],
  [['hardware', 'knob', 'hinge'], 'door_hardware_full'],
];

// ============================================================================
// Public API
// ============================================================================

/**
 * Resolve an assembly for a task by SOP code or task name.
 */
export function resolveTaskAssembly(
  taskName: string,
  sopCode: string | undefined,
  catalog: CostCatalog,
): Assembly | null {
  const key = findAssemblyKeyForTask(taskName, sopCode, catalog);
  return key ? catalog.assemblies[key] ?? null : null;
}

/**
 * Resolve a line item to its assembly by matching description + category.
 */
export function resolveLineItemAssembly(
  description: string,
  category: string,
  catalog: CostCatalog,
): Assembly | null {
  const key = findAssemblyKeyForLineItem(description, category, catalog);
  return key ? catalog.assemblies[key] ?? null : null;
}

/**
 * Walk an assembly's material components and return name + quantity.
 * Also returns the tools list for that assembly.
 */
export function resolveAssemblyBreakdown(
  assembly: Assembly,
  assemblyKey: string,
  quantity: number,
  catalog: CostCatalog,
): ResolvedAssemblyBreakdown {
  const materials: ResolvedMaterialLine[] = [];

  for (const comp of assembly.components) {
    if (comp.type === 'material') {
      const mat: MaterialItem | undefined =
        catalog.materials[comp.sourceCategory]?.[comp.sourceKey];
      if (mat) {
        materials.push({
          name: mat.name,
          quantityNeeded: Math.ceil(comp.coverageRate * quantity * 100) / 100,
          unit: mat.unit,
        });
      }
    }
  }

  const tools = ASSEMBLY_TOOLS[assemblyKey] ?? [];

  return {
    assemblyName: assembly.name,
    assemblyUnit: assembly.unit,
    materials,
    tools,
  };
}

/**
 * Convenience: resolve a task directly to its breakdown.
 */
export function resolveTaskBreakdown(
  taskName: string,
  sopCode: string | undefined,
  catalog: CostCatalog,
): ResolvedAssemblyBreakdown | null {
  const key = findAssemblyKeyForTask(taskName, sopCode, catalog);
  if (!key) return null;
  const assembly = catalog.assemblies[key];
  if (!assembly) return null;
  return resolveAssemblyBreakdown(assembly, key, 1, catalog);
}

/**
 * Convenience: resolve a line item directly to its breakdown.
 */
export function resolveLineItemBreakdown(
  description: string,
  category: string,
  quantity: number,
  catalog: CostCatalog,
): ResolvedAssemblyBreakdown | null {
  const key = findAssemblyKeyForLineItem(description, category, catalog);
  if (!key) return null;
  const assembly = catalog.assemblies[key];
  if (!assembly) return null;
  return resolveAssemblyBreakdown(assembly, key, quantity, catalog);
}
