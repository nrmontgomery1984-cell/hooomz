/**
 * Revit JSON Import Service
 * Follows docs/HOOOMZ_HOMESHOW_BUILD_PLAN.md Part 7.1 exactly
 *
 * Flow:
 * 1. Validate JSON structure
 * 2. Create project loop
 * 3. Extract unique levels → create floor loops
 * 4. For each wall → create task loop
 * 5. If SVG provided → import floor plan (future)
 * 6. Create activity event: 'project.imported'
 * 7. Return project.id
 */

import type { RevitExport, ImportResult } from '../../types/revit';
import type { Loop, NewLoop } from '../../types/database';
import { createLoop } from '../api/loops';
import { createActivityEvent } from '../api/activity';
import {
  validateRevitExport,
  cleanTypeName,
  formatLevelName,
} from './helpers';

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

/**
 * Import a Revit JSON export into Hooomz
 * Creates project loop, floor loops, and task loops for each wall
 */
export async function importRevitProject(
  companyId: string,
  userId: string,
  jsonExport: RevitExport
): Promise<ImportResult> {
  // 1. Validate JSON structure
  const validation = validateRevitExport(jsonExport);
  if (!validation.isValid) {
    throw new Error(`Invalid Revit export: ${validation.errors.join(', ')}`);
  }

  // 2. Create project loop
  const projectName = jsonExport.project_info.name || 'Imported Project';
  const project = await createProjectLoop(companyId, userId, jsonExport);

  // 3. Extract unique levels and create floor loops
  const levels = [...new Set(jsonExport.walls.map(w => w.level))];
  const floorLoops = new Map<string, Loop>();

  for (const level of levels) {
    const floor = await createFloorLoop(project.id, companyId, userId, level);
    floorLoops.set(level, floor);
  }

  // 4. Create task loops for each wall
  let wallsCreated = 0;
  for (const wall of jsonExport.walls) {
    const floorLoop = floorLoops.get(wall.level);
    if (floorLoop) {
      await createWallTaskLoop(project.id, floorLoop.id, companyId, userId, wall);
      wallsCreated++;
    }
  }

  // 5. SVG import is handled by importRevitBundle in index.ts
  // This function focuses on JSON import only

  // 6. Create activity event
  await createActivityEvent({
    event_type: 'project.imported',
    loop_id: project.id,
    project_id: project.id,
    actor_id: userId || null,
    actor_type: 'user',
    payload: {
      source: 'revit',
      export_version: jsonExport.export_version,
      walls_count: jsonExport.walls.length,
      floors_count: levels.length,
      wall_types: [...new Set(jsonExport.walls.map(w => w.hooomz_cost_code))],
    },
    client_visible: true,
  });

  // 7. Return result
  return {
    projectId: project.id,
    projectName,
    floorsCreated: floorLoops.size,
    wallsCreated,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create the project loop
 */
async function createProjectLoop(
  companyId: string,
  userId: string,
  jsonExport: RevitExport
): Promise<Loop> {
  const projectInfo = jsonExport.project_info;

  // Clean up address (remove carriage returns)
  const address = projectInfo.address?.replace(/\r\n/g, ', ').replace(/\r/g, ', ') || '';

  const newLoop: NewLoop = {
    company_id: companyId,
    parent_id: null,
    project_id: null, // Will be set to self after creation
    name: projectInfo.name || 'Imported Project',
    type: 'project',
    status: 'not_started',
    cost_code: null,
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    metadata: {
      project_number: projectInfo.number,
      address: address,
      client_name: projectInfo.client,
      import_date: new Date().toISOString(),
      export_version: jsonExport.export_version,
      export_date: jsonExport.export_date,
      source: jsonExport.source,
    },
    created_by: userId || null,
  };

  const project = await createLoop(newLoop);

  // Update project_id to self (convention for project loops)
  // This is handled by setting it during creation or via update
  // For now, we'll handle this in the database or accept null

  return project;
}

/**
 * Create a floor loop
 */
async function createFloorLoop(
  projectId: string,
  companyId: string,
  userId: string,
  level: string
): Promise<Loop> {
  const newLoop: NewLoop = {
    company_id: companyId,
    parent_id: projectId,
    project_id: projectId,
    name: formatLevelName(level),
    type: 'floor',
    status: 'not_started',
    cost_code: null,
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    metadata: {
      revit_level: level,
    },
    created_by: userId || null,
  };

  return createLoop(newLoop);
}

/**
 * Create a wall task loop
 */
async function createWallTaskLoop(
  projectId: string,
  floorId: string,
  companyId: string,
  userId: string,
  wall: RevitExport['walls'][0]
): Promise<Loop> {
  // Generate a readable name for the wall
  const cleanName = cleanTypeName(wall.type_name);
  const wallName = `${cleanName} (${wall.quantities.length_lf.toFixed(1)} LF)`;

  const newLoop: NewLoop = {
    company_id: companyId,
    parent_id: floorId,
    project_id: projectId,
    name: wallName,
    type: 'task',
    status: 'not_started',
    cost_code: wall.hooomz_cost_code,
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    metadata: {
      revit_id: wall.revit_id,
      revit_type_name: wall.type_name,
      quantities: wall.quantities,
      openings: wall.openings,
    },
    created_by: userId || null,
  };

  return createLoop(newLoop);
}

// ============================================================================
// BATCH IMPORT (FUTURE OPTIMIZATION)
// ============================================================================

/**
 * Import multiple walls in a batch for better performance
 * TODO: Implement batch insert via Supabase
 */
// export async function importWallsBatch(
//   projectId: string,
//   floorLoops: Map<string, Loop>,
//   companyId: string,
//   userId: string,
//   walls: RevitExport['walls']
// ): Promise<number> {
//   // Batch insert implementation
// }

// ============================================================================
// EXPORTS
// ============================================================================

export { validateRevitExport, cleanTypeName, formatLevelName };
