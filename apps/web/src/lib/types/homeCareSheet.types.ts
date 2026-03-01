/**
 * Home Care Sheet Types — derived deliverable at Turnover.
 *
 * The care sheet is assembled at read-time from existing project data
 * (tasks, line items, customer record) merged with config-based care
 * instructions per trade. No dedicated IndexedDB store.
 */

import type { WorkCategory } from '@hooomz/shared-contracts';

// ============================================================================
// Trade Section — one per trade found in the project
// ============================================================================

export interface CareTradeSection {
  tradeCode: WorkCategory;
  tradeName: string;
  locationsWorked: string[];
  materialsInstalled: MaterialEntry[];
  careInstructions: string[];
  thingsToAvoid: string[];
  warrantyNotes: string;
}

export interface MaterialEntry {
  description: string;
  location?: string;
  quantity?: number;
  unit?: string;
}

// ============================================================================
// Full Care Sheet Data
// ============================================================================

export interface HomeCareSheetData {
  projectId: string;
  projectName: string;
  propertyAddress: string;

  customerName: string;
  customerPhone: string;
  customerEmail: string;

  completionDate: string;       // ISO date
  warrantyExpiryDate: string;   // completionDate + 1 year

  tradeSections: CareTradeSection[];

  totalMaterialsCost: number;
  totalLabourCost: number;

  businessName: string;
  businessPhone: string;
  businessEmail: string;
}
