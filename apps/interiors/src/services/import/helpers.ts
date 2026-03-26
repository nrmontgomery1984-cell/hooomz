/**
 * Import Helper Functions
 * Validation and transformation utilities for Revit imports
 */

import type { RevitExport, ImportPreview } from '../../types/revit';

// ============================================================================
// NAME CLEANUP
// ============================================================================

/**
 * Type name mappings for human-readable display
 */
const TYPE_NAME_MAP: Record<string, string> = {
  // Wall types
  'EXT': 'Exterior',
  'INT': 'Interior',
  'GAR': 'Garage',
  'BSMT': 'Basement',
  'PART': 'Partition',
  'BEAR': 'Bearing',
  'WET': 'Wet Wall',
  'SOUND': 'Sound',
  'FIRE': 'Fire-Rated',
  'FROST': 'Frost Wall',
  'PLUMB': 'Plumbing',
  'SPRAY': 'Spray Foam',
  'RIGID': 'Rigid Insulation',
  'DOUBLE': 'Double Wall',
  // Insulation values
  'R24': 'R-24',
  'R40': 'R-40',
  // Framing
  '2X4': '2x4',
  '2X6': '2x6',
  '2X10': '2x10',
  '2X12': '2x12',
  // Floor types
  'TJI': 'TJI',
  'SUB': 'Subfloor',
  // Roof types
  'TRUSS': 'Truss',
  'RAFT': 'Rafter',
  'CATH': 'Cathedral',
  'FLAT': 'Flat',
  'ASPH': 'Asphalt Shingle',
  'METAL': 'Metal',
  'MOD': 'Modified Bitumen',
};

/**
 * Clean up Revit type name for display
 * "HZ_EXT_2X6_R24" → "Exterior 2x6 R-24"
 * "HZ_INT_2X4_WET" → "Interior 2x4 Wet Wall"
 */
export function cleanTypeName(revitName: string): string {
  // Remove HZ_ prefix
  let name = revitName.replace(/^HZ_/, '');

  // Split by underscore
  const parts = name.split('_');

  // Map each part to readable name
  const cleanParts = parts.map(part => {
    // Check for exact match first
    if (TYPE_NAME_MAP[part]) {
      return TYPE_NAME_MAP[part];
    }
    // Check for partial match (e.g., "12" in "TJI-12")
    return part;
  });

  return cleanParts.join(' ');
}

/**
 * Get a short description for a wall based on its type
 */
export function getWallDescription(typeName: string, costCode: string): string {
  const clean = cleanTypeName(typeName);

  // Add context based on cost code
  if (costCode.includes('EXT')) {
    return `${clean} (Exterior Wall)`;
  }
  if (costCode.includes('INT')) {
    return `${clean} (Interior Wall)`;
  }
  if (costCode.includes('BSMT')) {
    return `${clean} (Basement Wall)`;
  }
  if (costCode.includes('GAR')) {
    return `${clean} (Garage Wall)`;
  }

  return clean;
}

/**
 * Format level name for display
 * "L1" → "Level 1"
 * "L2" → "Level 2"
 */
export function formatLevelName(level: string): string {
  // Match patterns like L1, L2, Level 1, etc.
  const match = level.match(/^L(\d+)$/i);
  if (match) {
    return `Level ${match[1]}`;
  }

  // Already formatted or custom name
  return level;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a Revit export JSON structure
 */
export function validateRevitExport(json: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if it's an object
  if (!json || typeof json !== 'object') {
    errors.push('Invalid JSON: expected an object');
    return { isValid: false, errors, warnings };
  }

  const data = json as Record<string, unknown>;

  // Check required top-level fields
  if (!data.project_info) {
    errors.push('Missing required field: project_info');
  } else {
    const projectInfo = data.project_info as Record<string, unknown>;
    if (!projectInfo.name || typeof projectInfo.name !== 'string') {
      errors.push('Missing or invalid project_info.name');
    }
  }

  // Check walls array
  if (!data.walls) {
    errors.push('Missing required field: walls');
  } else if (!Array.isArray(data.walls)) {
    errors.push('Invalid walls field: expected an array');
  } else if (data.walls.length === 0) {
    warnings.push('No walls found in export');
  } else {
    // Validate wall structure
    const walls = data.walls as Record<string, unknown>[];
    walls.forEach((wall, index) => {
      if (!wall.revit_id) {
        errors.push(`Wall ${index}: missing revit_id`);
      }
      if (!wall.type_name) {
        errors.push(`Wall ${index}: missing type_name`);
      }
      if (!wall.level) {
        errors.push(`Wall ${index}: missing level`);
      }
      if (!wall.quantities) {
        errors.push(`Wall ${index}: missing quantities`);
      }
    });
  }

  // Check export metadata
  if (!data.export_version) {
    warnings.push('Missing export_version, assuming 1.0');
  }
  if (!data.export_date) {
    warnings.push('Missing export_date');
  }

  // Optional arrays - just check structure if present
  if (data.floors && !Array.isArray(data.floors)) {
    errors.push('Invalid floors field: expected an array');
  }
  if (data.roofs && !Array.isArray(data.roofs)) {
    errors.push('Invalid roofs field: expected an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Type guard for RevitExport
 */
export function isValidRevitExport(json: unknown): json is RevitExport {
  const result = validateRevitExport(json);
  return result.isValid;
}

// ============================================================================
// PREVIEW GENERATION
// ============================================================================

/**
 * Generate a preview of what will be imported
 */
export function generateImportPreview(json: unknown): ImportPreview {
  const validation = validateRevitExport(json);

  if (!validation.isValid) {
    return {
      projectName: 'Unknown',
      projectNumber: '',
      address: '',
      clientName: '',
      wallCount: 0,
      floorCount: 0,
      roofCount: 0,
      levels: [],
      wallTypes: [],
      isValid: false,
      validationErrors: validation.errors,
    };
  }

  const data = json as RevitExport;

  // Extract unique levels
  const levels = [...new Set(data.walls.map(w => w.level))].sort();

  // Extract unique wall types
  const wallTypes = [...new Set(data.walls.map(w => w.type_name))];

  // Clean up address (remove carriage returns)
  const address = data.project_info.address?.replace(/\r\n/g, ', ').replace(/\r/g, ', ') || '';

  return {
    projectName: data.project_info.name || 'Unnamed Project',
    projectNumber: data.project_info.number || '',
    address,
    clientName: data.project_info.client || '',
    wallCount: data.walls.length,
    floorCount: data.floors?.length || 0,
    roofCount: data.roofs?.length || 0,
    levels,
    wallTypes: wallTypes.map(t => cleanTypeName(t)),
    isValid: true,
    validationErrors: [],
  };
}

// ============================================================================
// FILE HANDLING
// ============================================================================

/**
 * Parse JSON file content
 */
export async function parseJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        resolve(json);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Check if a file is a valid JSON file
 */
export function isJsonFile(file: File): boolean {
  return file.type === 'application/json' || file.name.endsWith('.json');
}

/**
 * Check if a file is a valid SVG file
 */
export function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.endsWith('.svg');
}
