/**
 * Demo Helper Functions
 * For testing and Home Show demonstrations
 */

import { supabase } from '../supabase';
import { createLoop, updateLoopStatus, getProjectWithLoops } from '../api/loops';
import { createActivityEvent } from '../api/activity';
import type { Loop, LoopStatus } from '../../types/database';

// ============================================================================
// TEST DATA CREATION
// ============================================================================

/**
 * Create a minimal test project for automated tests
 */
export async function createTestProject(companyId: string): Promise<{
  projectId: string;
  loops: Loop[];
}> {
  // Create project loop
  const project = await createLoop({
    company_id: companyId,
    name: `Test Project ${Date.now()}`,
    type: 'project',
    status: 'not_started',
    parent_id: null,
    project_id: null,
    cost_code: 'TEST-PROJECT',
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    created_by: null,
    metadata: { isTest: true },
  });

  // Create a floor loop
  const floor = await createLoop({
    company_id: companyId,
    parent_id: project.id,
    project_id: project.id,
    name: 'Test Floor',
    type: 'floor',
    status: 'not_started',
    cost_code: null,
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    created_by: null,
    metadata: {},
  });

  // Create a few task loops
  const tasks: Loop[] = [];
  for (let i = 1; i <= 3; i++) {
    const task = await createLoop({
      company_id: companyId,
      parent_id: floor.id,
      project_id: project.id,
      name: `Test Task ${i}`,
      type: 'task',
      status: 'not_started',
      cost_code: `TASK-${i}`,
      planned_start: null,
      planned_end: null,
      actual_start: null,
      actual_end: null,
      created_by: null,
      metadata: {},
    });
    tasks.push(task);
  }

  // Create project.imported activity event
  await createActivityEvent({
    event_type: 'project.imported',
    loop_id: project.id,
    project_id: project.id,
    actor_id: null,
    actor_type: 'system',
    payload: { source: 'test', task_count: 3 },
    client_visible: false,
  });

  return {
    projectId: project.id,
    loops: [project, floor, ...tasks],
  };
}

/**
 * Create a full demo project with realistic data
 */
export async function createDemoProject(companyId: string): Promise<{
  projectId: string;
  loops: Loop[];
}> {
  // Create project loop
  const project = await createLoop({
    company_id: companyId,
    name: '123 Main Street Kitchen Renovation',
    type: 'project',
    status: 'in_progress',
    parent_id: null,
    project_id: null,
    cost_code: '2026-001',
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    created_by: null,
    metadata: {
      address: '123 Main Street',
      client: 'Smith Family',
      isDemo: true,
    },
  });

  const loops: Loop[] = [project];

  // Create Main Floor
  const mainFloor = await createLoop({
    company_id: companyId,
    parent_id: project.id,
    project_id: project.id,
    name: 'Main Floor',
    type: 'floor',
    status: 'in_progress',
    cost_code: null,
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    created_by: null,
    metadata: {},
  });
  loops.push(mainFloor);

  // Create basement
  const basement = await createLoop({
    company_id: companyId,
    parent_id: project.id,
    project_id: project.id,
    name: 'Basement',
    type: 'floor',
    status: 'not_started',
    cost_code: null,
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    created_by: null,
    metadata: {},
  });
  loops.push(basement);

  // Main floor walls with varied statuses
  const mainFloorWalls = [
    { name: 'North Exterior Wall', code: 'WALL-EXT-2X6-R24', status: 'complete' as LoopStatus },
    { name: 'East Exterior Wall', code: 'WALL-EXT-2X6-R24', status: 'complete' as LoopStatus },
    { name: 'South Exterior Wall', code: 'WALL-EXT-2X6-R24', status: 'in_progress' as LoopStatus },
    { name: 'West Exterior Wall', code: 'WALL-EXT-2X6-R24', status: 'in_progress' as LoopStatus },
    { name: 'Kitchen Partition', code: 'WALL-INT-2X4', status: 'complete' as LoopStatus },
    { name: 'Living Room Partition', code: 'WALL-INT-2X4', status: 'blocked' as LoopStatus },
    { name: 'Bathroom Wall', code: 'WALL-INT-2X4', status: 'not_started' as LoopStatus },
    { name: 'Bedroom Wall', code: 'WALL-INT-2X4', status: 'not_started' as LoopStatus },
  ];

  for (const wall of mainFloorWalls) {
    const task = await createLoop({
      company_id: companyId,
      parent_id: mainFloor.id,
      project_id: project.id,
      name: wall.name,
      type: 'task',
      status: wall.status,
      cost_code: wall.code,
      planned_start: null,
      planned_end: null,
      actual_start: null,
      actual_end: null,
      created_by: null,
      metadata: { revit_id: Math.floor(Math.random() * 100000) },
    });
    loops.push(task);
  }

  // Basement walls
  const basementWalls = [
    { name: 'Foundation North', code: 'WALL-FOUND-8', status: 'not_started' as LoopStatus },
    { name: 'Foundation South', code: 'WALL-FOUND-8', status: 'not_started' as LoopStatus },
  ];

  for (const wall of basementWalls) {
    const task = await createLoop({
      company_id: companyId,
      parent_id: basement.id,
      project_id: project.id,
      name: wall.name,
      type: 'task',
      status: wall.status,
      cost_code: wall.code,
      planned_start: null,
      planned_end: null,
      actual_start: null,
      actual_end: null,
      created_by: null,
      metadata: {},
    });
    loops.push(task);
  }

  // Create some activity events
  await createActivityEvent({
    event_type: 'project.imported',
    loop_id: project.id,
    project_id: project.id,
    actor_id: null,
    actor_type: 'system',
    payload: {
      source: 'revit',
      walls_count: mainFloorWalls.length + basementWalls.length,
      floors_count: 2,
    },
    client_visible: false,
  });

  // Add some realistic activity
  const completedWalls = loops.filter(l => l.status === 'complete' && l.type === 'task');
  for (const wall of completedWalls) {
    await createActivityEvent({
      event_type: 'task.completed',
      loop_id: wall.id,
      project_id: project.id,
      actor_id: null,
      actor_type: 'user',
      payload: { name: wall.name, actor_name: 'Mike' },
      client_visible: true,
    });
  }

  // Add blocked event
  const blockedWall = loops.find(l => l.status === 'blocked');
  if (blockedWall) {
    await createActivityEvent({
      event_type: 'task.blocked',
      loop_id: blockedWall.id,
      project_id: project.id,
      actor_id: null,
      actor_type: 'user',
      payload: {
        name: blockedWall.name,
        reason: 'Waiting for engineering approval',
        actor_name: 'Mike',
      },
      client_visible: true,
    });
  }

  return { projectId: project.id, loops };
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Delete a test project and all related data
 */
export async function cleanupTestData(projectId: string): Promise<void> {
  // Delete activity events
  await supabase
    .from('activity_events')
    .delete()
    .eq('project_id', projectId);

  // Delete floor plan elements (if any)
  const { data: floorPlans } = await supabase
    .from('floor_plans')
    .select('id')
    .eq('project_id', projectId);

  const floorPlanData = floorPlans as { id: string }[] | null;
  if (floorPlanData && floorPlanData.length > 0) {
    for (const fp of floorPlanData) {
      await supabase
        .from('floor_plan_elements')
        .delete()
        .eq('floor_plan_id', fp.id);
    }
  }

  // Delete floor plans
  await supabase
    .from('floor_plans')
    .delete()
    .eq('project_id', projectId);

  // Delete photos
  await supabase
    .from('photos')
    .delete()
    .eq('loop_id', projectId);

  // Delete loops (children first, then parent)
  // First get all loops to delete in correct order
  const { data: allLoops } = await supabase
    .from('loops')
    .select('id, parent_id')
    .eq('project_id', projectId);

  const loopsData = allLoops as { id: string; parent_id: string | null }[] | null;
  if (loopsData) {
    // Sort by depth (deepest first) - simple approach
    const loopIds = loopsData.map(l => l.id);

    // Delete in batches, handling foreign key constraints
    for (let i = 0; i < 5; i++) {
      // Try up to 5 times to handle hierarchy
      await supabase
        .from('loops')
        .delete()
        .in('id', loopIds);
    }
  }

  // Finally delete the project itself
  await supabase
    .from('loops')
    .delete()
    .eq('id', projectId);
}

/**
 * Clean up all demo/test projects for a company
 */
export async function cleanupAllTestData(companyId: string): Promise<number> {
  // Find all test/demo projects
  const { data: testProjects } = await supabase
    .from('loops')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'project')
    .or('metadata->>isTest.eq.true,metadata->>isDemo.eq.true');

  const projectsData = testProjects as { id: string }[] | null;
  if (!projectsData || projectsData.length === 0) {
    return 0;
  }

  for (const project of projectsData) {
    await cleanupTestData(project.id);
  }

  return projectsData.length;
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  output?: string;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<TestResult> {
  const start = Date.now();
  try {
    const { error } = await supabase.from('loops').select('count').limit(1);
    if (error) throw error;
    return {
      name: 'Database Connection',
      passed: true,
      duration: Date.now() - start,
      output: 'Successfully connected to Supabase',
    };
  } catch (err) {
    return {
      name: 'Database Connection',
      passed: false,
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Test project creation
 */
export async function testCreateProject(companyId: string): Promise<TestResult & { projectId?: string }> {
  const start = Date.now();
  try {
    const { projectId, loops } = await createTestProject(companyId);
    return {
      name: 'Create Test Project',
      passed: true,
      duration: Date.now() - start,
      output: `Created project ${projectId} with ${loops.length} loops`,
      projectId,
    };
  } catch (err) {
    return {
      name: 'Create Test Project',
      passed: false,
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Test project retrieval
 */
export async function testGetProject(projectId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const { project, loops } = await getProjectWithLoops(projectId);
    return {
      name: 'Get Project',
      passed: true,
      duration: Date.now() - start,
      output: `Retrieved "${project.name}" with ${loops.length} child loops`,
    };
  } catch (err) {
    return {
      name: 'Get Project',
      passed: false,
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Test status update
 */
export async function testStatusUpdate(loopId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const updated = await updateLoopStatus(loopId, 'in_progress');
    return {
      name: 'Status Update',
      passed: updated.status === 'in_progress',
      duration: Date.now() - start,
      output: `Updated loop status to: ${updated.status}`,
    };
  } catch (err) {
    return {
      name: 'Status Update',
      passed: false,
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Test activity event creation
 */
export async function testCreateActivity(projectId: string, loopId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const event = await createActivityEvent({
      event_type: 'task.note_added',
      loop_id: loopId,
      project_id: projectId,
      actor_id: null,
      actor_type: 'system',
      payload: { note: 'Test note from demo runner' },
      client_visible: false,
    });
    return {
      name: 'Create Activity Event',
      passed: !!event.id,
      duration: Date.now() - start,
      output: `Created event ${event.id} of type ${event.event_type}`,
    };
  } catch (err) {
    return {
      name: 'Create Activity Event',
      passed: false,
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Test cleanup
 */
export async function testCleanup(projectId: string): Promise<TestResult> {
  const start = Date.now();
  try {
    await cleanupTestData(projectId);
    return {
      name: 'Cleanup Test Data',
      passed: true,
      duration: Date.now() - start,
      output: `Deleted project ${projectId} and related data`,
    };
  } catch (err) {
    return {
      name: 'Cleanup Test Data',
      passed: false,
      duration: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
