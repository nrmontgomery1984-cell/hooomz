/**
 * Revit Export Type Definitions
 * Matches the JSON structure from pyRevit ExportToHooomz button
 * See: docs/CLAUDE_CONTEXT.md Section 9
 */

// ============================================================================
// WALL TYPES
// ============================================================================

export interface RevitWallQuantities {
  length_lf: number;
  height_ft: number;
  gross_area_sf: number;
  net_area_sf: number;
}

export interface RevitOpeningDetail {
  type: string;        // "Windows" | "Doors"
  width_ft: number;
  height_ft: number;
  area_sf: number;
}

export interface RevitWallOpenings {
  count: number;
  total_width_lf: number;
  total_area_sf: number;
  details: RevitOpeningDetail[];
}

export interface RevitWall {
  revit_id: number;
  type_name: string;           // e.g., "HZ_EXT_2X6_R24_EXT"
  hooomz_cost_code: string;    // e.g., "WALL-EXT-2X6-R24-EXT"
  level: string;               // e.g., "L1"
  quantities: RevitWallQuantities;
  openings: RevitWallOpenings;
}

// ============================================================================
// FLOOR TYPES
// ============================================================================

export interface RevitFloorQuantities {
  area_sf: number;
  perimeter_lf: number;
}

export interface RevitFloor {
  revit_id: number;
  type_name: string;           // e.g., "HZ_FLOOR_TJI_12"
  hooomz_cost_code: string;    // e.g., "FLOOR-TJI-12"
  level: string;
  quantities: RevitFloorQuantities;
}

// ============================================================================
// ROOF TYPES
// ============================================================================

export interface RevitRoofQuantities {
  area_sf: number;
  footprint_area_sf: number;
}

export interface RevitRoof {
  revit_id: number;
  type_name: string;           // e.g., "HZ_ROOF_TRUSS_ASPH"
  hooomz_cost_code: string;    // e.g., "ROOF-TRUSS-ASPH"
  level: string;
  quantities: RevitRoofQuantities;
}

// ============================================================================
// PROJECT INFO
// ============================================================================

export interface RevitProjectInfo {
  name: string;
  number: string;
  address: string;
  client: string;
}

// ============================================================================
// SUMMARY TYPES
// ============================================================================

export interface RevitTypeSummary {
  count: number;
  length_lf?: number;
  area_sf: number;
  cost_code: string;
  openings?: number;
}

export interface RevitSummary {
  total_walls?: number;
  total_length_lf?: number;
  total_area_sf?: number;
  total_openings?: number;
  by_type: Record<string, RevitTypeSummary>;
}

// ============================================================================
// MAIN EXPORT INTERFACE
// ============================================================================

export interface RevitExport {
  export_version: string;      // e.g., "1.0"
  export_date: string;         // ISO date string
  source: string;              // e.g., "Revit via pyRevit"
  project_info: RevitProjectInfo;
  walls: RevitWall[];
  floors?: RevitFloor[];
  roofs?: RevitRoof[];
  summary: {
    walls?: RevitSummary;
    floors?: RevitSummary;
    roofs?: RevitSummary;
    // Legacy format support (flat summary)
    by_type?: Record<string, RevitTypeSummary>;
    total_walls?: number;
    total_length_lf?: number;
    total_area_sf?: number;
    total_openings?: number;
  };
}

// ============================================================================
// IMPORT RESULT
// ============================================================================

export interface ImportResult {
  projectId: string;
  projectName: string;
  floorsCreated: number;
  wallsCreated: number;
  floorsImported?: number;
  roofsImported?: number;
}

export interface ImportPreview {
  projectName: string;
  projectNumber: string;
  address: string;
  clientName: string;
  wallCount: number;
  floorCount: number;
  roofCount: number;
  levels: string[];
  wallTypes: string[];
  isValid: boolean;
  validationErrors: string[];
}
