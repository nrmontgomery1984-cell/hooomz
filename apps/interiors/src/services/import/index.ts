/**
 * Import Services
 * Export all import-related functions
 */

import type { RevitExport, ImportResult } from '../../types/revit';
import type { Loop } from '../../types/database';
import { importRevitProject } from './revitImport';
import { importFloorPlanSVG, parseSvgFile, validateSvgContent } from './svgImport';
import { parseJsonFile, isValidRevitExport } from './helpers';

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { importRevitProject } from './revitImport';
export {
  validateRevitExport,
  isValidRevitExport,
  generateImportPreview,
  cleanTypeName,
  formatLevelName,
  parseJsonFile,
  isJsonFile,
  isSvgFile,
} from './helpers';
export type { ValidationResult } from './helpers';

export {
  importFloorPlanSVG,
  parseSvgFile,
  validateSvgContent,
} from './svgImport';
export type { SVGMetadata, SVGImportResult } from './svgImport';

// ============================================================================
// BUNDLE IMPORT
// ============================================================================

export interface BundleImportResult extends ImportResult {
  floorPlanId?: string;
  floorPlanElementsCreated?: number;
  floorPlanElementsSkipped?: number;
}

/**
 * Import a Revit bundle (JSON + optional SVG)
 * This is the main entry point for full project imports
 */
export async function importRevitBundle(
  companyId: string,
  userId: string,
  jsonFile: File,
  svgFile?: File
): Promise<BundleImportResult> {
  // 1. Parse and validate JSON
  const json = await parseJsonFile(jsonFile);
  if (!isValidRevitExport(json)) {
    throw new Error('Invalid Revit JSON export');
  }

  const jsonExport = json as RevitExport;

  // 2. Parse SVG if provided
  let svgContent: string | undefined;
  if (svgFile) {
    svgContent = await parseSvgFile(svgFile);
    const validation = validateSvgContent(svgContent);
    if (!validation.isValid) {
      throw new Error(`Invalid SVG: ${validation.error}`);
    }
  }

  // 3. Import the JSON (creates project, floors, walls)
  const result = await importRevitProject(companyId, userId, jsonExport);

  // 4. If SVG provided, import floor plan
  let floorPlanResult: BundleImportResult = { ...result };

  if (svgContent) {
    // Build floor loops map from the created floors
    // We need to fetch the floor loops that were just created
    const { getChildLoops } = await import('../api/loops');
    const childLoops = await getChildLoops(result.projectId);
    const floorLoops = new Map<string, Loop>();

    for (const loop of childLoops) {
      if (loop.type === 'floor') {
        // Use the revit_level from metadata if available, otherwise use name
        const levelKey = (loop.metadata as Record<string, unknown>)?.revit_level as string || loop.name;
        floorLoops.set(levelKey, loop);
        // Also add by name for flexibility
        floorLoops.set(loop.name, loop);
      }
    }

    try {
      const svgResult = await importFloorPlanSVG(result.projectId, floorLoops, svgContent);
      floorPlanResult = {
        ...result,
        floorPlanId: svgResult.floorPlanId,
        floorPlanElementsCreated: svgResult.elementsCreated,
        floorPlanElementsSkipped: svgResult.elementsSkipped,
      };
    } catch (error) {
      // Log but don't fail the whole import if SVG fails
      console.error('SVG import failed:', error);
      // Still return the JSON import result
    }
  }

  return floorPlanResult;
}
