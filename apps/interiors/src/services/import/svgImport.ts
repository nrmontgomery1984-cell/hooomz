/**
 * SVG Floor Plan Import Service
 * Follows docs/HOOOMZ_HOMESHOW_BUILD_PLAN.md Part 7 SVG Import section
 *
 * CRITICAL PATTERN: Floor plan elements do NOT store status.
 * They point to loops. Status comes FROM the loop.
 *
 * // CORRECT
 * const status = loops.get(element.loop_id)?.status;
 *
 * // WRONG — NEVER DO THIS
 * element.status = 'complete';
 */

import type { Loop, NewFloorPlanElement, ElementType } from '../../types/database';
import {
  createFloorPlan,
  createFloorPlanElementsBatch,
  findLoopByRevitId,
} from '../api/floorPlans';

// ============================================================================
// TYPES
// ============================================================================

export interface SVGMetadata {
  version: string;
  date: string;
  viewName: string;
  projectName: string;
  projectNumber: string;
}

export interface SVGImportResult {
  floorPlanId: string;
  floorPlanName: string;
  elementsCreated: number;
  elementsSkipped: number;
  skippedRevitIds: string[];
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

/**
 * Import an SVG floor plan and link elements to loops
 *
 * @param projectId - The project loop ID
 * @param floorLoops - Map of level name to floor loop
 * @param svgContent - Raw SVG content string
 * @returns Floor plan ID
 */
export async function importFloorPlanSVG(
  projectId: string,
  floorLoops: Map<string, Loop>,
  svgContent: string
): Promise<SVGImportResult> {
  // 1. Parse SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`Invalid SVG: ${parseError.textContent}`);
  }

  // 2. Extract metadata
  const metadata = extractMetadata(doc);

  // 3. Get viewBox from SVG element
  const svgElement = doc.querySelector('svg');
  const viewBox = svgElement?.getAttribute('viewBox') || '';

  // 4. Determine which floor this is for
  // Try to match view-name to a floor, or use first floor
  let floorId: string | null = null;
  let floorName = metadata.viewName || 'Floor Plan';

  // Try exact match first
  if (metadata.viewName && floorLoops.has(metadata.viewName)) {
    floorId = floorLoops.get(metadata.viewName)!.id;
  } else {
    // Try partial match (e.g., "L1" matches "Level 1")
    for (const [levelName, floor] of floorLoops) {
      if (
        metadata.viewName?.includes(levelName) ||
        levelName.includes(metadata.viewName || '')
      ) {
        floorId = floor.id;
        floorName = floor.name;
        break;
      }
    }

    // Fall back to first floor if no match
    if (!floorId && floorLoops.size > 0) {
      const firstFloor = floorLoops.values().next().value as Loop | undefined;
      if (firstFloor) {
        floorId = firstFloor.id;
        floorName = firstFloor.name;
      }
    }
  }

  // 5. Create floor plan record
  const floorPlan = await createFloorPlan({
    project_id: projectId,
    floor_id: floorId,
    name: floorName,
    svg_content: svgContent,
    viewbox: viewBox,
    background_image_url: null,
  });

  // 6. Find elements with data-revit-id attribute
  const elements = doc.querySelectorAll('[data-revit-id]');

  // 7. Create floor plan elements
  const elementsToCreate: NewFloorPlanElement[] = [];
  const skippedRevitIds: string[] = [];

  for (const el of Array.from(elements)) {
    const revitId = el.getAttribute('data-revit-id');
    const costCode = el.getAttribute('data-cost-code');
    const elementType = el.getAttribute('data-element-type') || 'unknown';
    const svgId = el.getAttribute('id');

    if (!revitId || !svgId) {
      console.warn('SVG element missing revit-id or id, skipping');
      continue;
    }

    // Find matching loop by revit_id in metadata
    const matchingLoop = await findLoopByRevitId(projectId, revitId);

    if (!matchingLoop) {
      console.warn(`No loop found for revit_id ${revitId}, skipping element`);
      skippedRevitIds.push(revitId);
      continue;
    }

    // Extract bounds if available (from rect, path bounds, etc.)
    const bounds = extractElementBounds(el);

    elementsToCreate.push({
      floor_plan_id: floorPlan.id,
      svg_element_id: svgId,
      element_type: elementType as ElementType,
      loop_id: matchingLoop.id,
      label: matchingLoop.name,
      bounds: bounds || null,
      revit_id: revitId,
      cost_code: costCode || null,
    });
  }

  // Batch create elements
  let elementsCreated = 0;
  if (elementsToCreate.length > 0) {
    const created = await createFloorPlanElementsBatch(elementsToCreate);
    elementsCreated = created.length;
  }

  return {
    floorPlanId: floorPlan.id,
    floorPlanName: floorName,
    elementsCreated,
    elementsSkipped: skippedRevitIds.length,
    skippedRevitIds,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract metadata from SVG hooomz:export element
 */
function extractMetadata(doc: Document): SVGMetadata {
  // Try standard namespace approach
  let metadataEl = doc.querySelector('metadata hooomz\\:export');

  // Try without namespace (in case namespace isn't properly handled)
  if (!metadataEl) {
    metadataEl = doc.querySelector('metadata [version]');
  }

  // Try finding any element with hooomz attributes
  if (!metadataEl) {
    metadataEl = doc.querySelector('[data-hooomz-version]');
  }

  return {
    version: metadataEl?.getAttribute('version') ||
             metadataEl?.getAttribute('data-hooomz-version') || '1.0',
    date: metadataEl?.getAttribute('date') ||
          metadataEl?.getAttribute('data-hooomz-date') || '',
    viewName: metadataEl?.getAttribute('view-name') ||
              metadataEl?.getAttribute('data-view-name') || '',
    projectName: metadataEl?.getAttribute('project-name') ||
                 metadataEl?.getAttribute('data-project-name') || '',
    projectNumber: metadataEl?.getAttribute('project-number') ||
                   metadataEl?.getAttribute('data-project-number') || '',
  };
}

/**
 * Extract bounding box from SVG element
 */
function extractElementBounds(
  el: Element
): { x: number; y: number; width: number; height: number } | null {
  // For rect elements, use direct attributes
  if (el.tagName.toLowerCase() === 'rect') {
    const x = parseFloat(el.getAttribute('x') || '0');
    const y = parseFloat(el.getAttribute('y') || '0');
    const width = parseFloat(el.getAttribute('width') || '0');
    const height = parseFloat(el.getAttribute('height') || '0');

    if (!isNaN(x) && !isNaN(y) && !isNaN(width) && !isNaN(height)) {
      return { x, y, width, height };
    }
  }

  // For path elements, try to parse d attribute for bounds
  if (el.tagName.toLowerCase() === 'path') {
    const d = el.getAttribute('d');
    if (d) {
      return parsePathBounds(d);
    }
  }

  // For line elements
  if (el.tagName.toLowerCase() === 'line') {
    const x1 = parseFloat(el.getAttribute('x1') || '0');
    const y1 = parseFloat(el.getAttribute('y1') || '0');
    const x2 = parseFloat(el.getAttribute('x2') || '0');
    const y2 = parseFloat(el.getAttribute('y2') || '0');

    if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
      return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      };
    }
  }

  return null;
}

/**
 * Parse SVG path d attribute to extract approximate bounds
 * This is a simplified parser - handles basic M, L, H, V commands
 */
function parsePathBounds(
  d: string
): { x: number; y: number; width: number; height: number } | null {
  // Extract all numbers from the path
  const numbers = d.match(/-?[\d.]+/g);
  if (!numbers || numbers.length < 2) return null;

  const coords: { x: number; y: number }[] = [];

  // Simple extraction of coordinate pairs
  for (let i = 0; i < numbers.length - 1; i += 2) {
    const x = parseFloat(numbers[i]);
    const y = parseFloat(numbers[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      coords.push({ x, y });
    }
  }

  if (coords.length === 0) return null;

  // Calculate bounds
  const xs = coords.map(c => c.x);
  const ys = coords.map(c => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Parse SVG file content
 */
export async function parseSvgFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read SVG file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate SVG content
 */
export function validateSvgContent(svgContent: string): {
  isValid: boolean;
  error?: string;
  elementCount: number;
} {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');

    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return {
        isValid: false,
        error: 'Invalid SVG format',
        elementCount: 0,
      };
    }

    // Check for svg root element
    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      return {
        isValid: false,
        error: 'No SVG element found',
        elementCount: 0,
      };
    }

    // Count elements with data-revit-id
    const elements = doc.querySelectorAll('[data-revit-id]');

    return {
      isValid: true,
      elementCount: elements.length,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      elementCount: 0,
    };
  }
}
