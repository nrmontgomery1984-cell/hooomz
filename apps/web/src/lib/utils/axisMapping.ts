/**
 * Three-Axis Mapping Utilities
 *
 * Infers workCategoryCode, stageCode, and locationLabel from existing
 * line item data for backward compatibility. Also provides display helpers.
 */

import { CostCategory } from '@hooomz/shared-contracts';
import { TRADE_CODES, STAGE_CODES, ROOM_LOCATIONS } from '@/lib/types/intake.types';

// ============================================================================
// CostCategory → Trade Code mapping
// ============================================================================

const COST_CATEGORY_TO_TRADE: Record<string, string> = {
  [CostCategory.FLOORING]: 'FL',
  [CostCategory.PAINTING]: 'PT',
  [CostCategory.INTERIOR_TRIM]: 'FC',
  [CostCategory.DRYWALL]: 'DW',
  [CostCategory.WINDOWS_DOORS]: 'FC',
  [CostCategory.CABINETS_COUNTERTOPS]: 'FC',
};

export function inferWorkCategoryCode(category: string): string {
  return COST_CATEGORY_TO_TRADE[category] || 'OH';
}

// ============================================================================
// Description → Stage Code inference
// ============================================================================

export function inferStageCode(description: string): string {
  const d = description.toLowerCase();
  if (/\b(remove|demo|demolit|tear|strip|rip)\b/.test(d)) return 'ST-DM';
  if (/\b(prep|prime|sand|patch|fill|skim|tape|mud|level)\b/.test(d)) return 'ST-PR';
  if (/\b(touch.?up|punch|deficien|snag)\b/.test(d)) return 'ST-PL';
  if (/\b(clean|close|final|inspect|handoff)\b/.test(d)) return 'ST-CL';
  return 'ST-FN';
}

// ============================================================================
// Location label inference
// ============================================================================

export function inferLocationLabel(item: { loopContextLabel?: string }): string {
  if (item.loopContextLabel && item.loopContextLabel !== 'Per Room') {
    return item.loopContextLabel;
  }
  return 'General';
}

// ============================================================================
// Resolve all three axes (explicit values first, inference as fallback)
// ============================================================================

export function resolveThreeAxes(item: {
  workCategoryCode?: string;
  stageCode?: string;
  locationLabel?: string;
  category: string;
  description: string;
  loopContextLabel?: string;
}): { workCategoryCode: string; stageCode: string; locationLabel: string } {
  return {
    workCategoryCode: item.workCategoryCode || inferWorkCategoryCode(item.category),
    stageCode: item.stageCode || inferStageCode(item.description),
    locationLabel: item.locationLabel || inferLocationLabel(item),
  };
}

// ============================================================================
// Display helpers
// ============================================================================

export function getTradeDisplayName(code: string): string {
  return TRADE_CODES[code as keyof typeof TRADE_CODES]?.name || code;
}

// SCRIPT stage names — contractor-friendly terms used in the pipeline
const STAGE_SCRIPT_NAMES: Record<string, string> = {
  'ST-SH': 'Shield',   // Protect the home
  'ST-DM': 'Clear',    // Remove existing
  'ST-PR': 'Ready',    // Prep surfaces
  'ST-FN': 'Install',  // Main work
  'ST-PL': 'Punch',    // Deficiency review
  'ST-CL': 'Turnover', // Closeout & handoff
};

export function getStageDisplayName(code: string): string {
  return STAGE_SCRIPT_NAMES[code] || STAGE_CODES[code as keyof typeof STAGE_CODES]?.name || code;
}

export function getTradeIcon(code: string): string {
  return TRADE_CODES[code as keyof typeof TRADE_CODES]?.icon || '⚙️';
}

export function getStageColor(code: string): string {
  return STAGE_CODES[code as keyof typeof STAGE_CODES]?.color || 'var(--muted)';
}

export function getLocationIcon(label: string): string {
  for (const meta of Object.values(ROOM_LOCATIONS)) {
    if (meta.name === label) return meta.icon;
  }
  return '📍';
}

export function getTradeOrder(code: string): number {
  return TRADE_CODES[code as keyof typeof TRADE_CODES]?.order ?? 99;
}

export function getStageOrder(code: string): number {
  return STAGE_CODES[code as keyof typeof STAGE_CODES]?.order ?? 99;
}
