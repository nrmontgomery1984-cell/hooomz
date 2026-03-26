import { supabase } from '../supabase';
import type { Loop, LoopStatus, NewLoop } from '../../types/database';

/**
 * Get all projects for a company
 */
export async function getProjects(companyId: string): Promise<Loop[]> {
  const { data, error } = await supabase
    .from('loops')
    .select('*')
    .eq('company_id', companyId)
    .eq('type', 'project')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return (data || []) as Loop[];
}

/**
 * Get a single project with all its child loops
 */
export async function getProjectWithLoops(
  projectId: string
): Promise<{ project: Loop; loops: Loop[] }> {
  // Fetch the project itself
  const { data: project, error: projectError } = await supabase
    .from('loops')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) {
    throw new Error(`Failed to fetch project: ${projectError.message}`);
  }

  // Fetch all loops belonging to this project
  const { data: loops, error: loopsError } = await supabase
    .from('loops')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (loopsError) {
    throw new Error(`Failed to fetch project loops: ${loopsError.message}`);
  }

  return { project: project as Loop, loops: (loops || []) as Loop[] };
}

/**
 * Get a single loop by ID
 */
export async function getLoop(loopId: string): Promise<Loop> {
  const { data, error } = await supabase
    .from('loops')
    .select('*')
    .eq('id', loopId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch loop: ${error.message}`);
  }

  return data as Loop;
}

/**
 * Get child loops of a parent loop
 */
export async function getChildLoops(parentId: string): Promise<Loop[]> {
  const { data, error } = await supabase
    .from('loops')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch child loops: ${error.message}`);
  }

  return (data || []) as Loop[];
}

/**
 * Update loop status
 */
export async function updateLoopStatus(
  loopId: string,
  status: LoopStatus
): Promise<Loop> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  // Auto-set actual_start when moving to in_progress
  if (status === 'in_progress') {
    updateData.actual_start = new Date().toISOString();
  }
  // Auto-set actual_end when completing
  if (status === 'complete') {
    updateData.actual_end = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('loops')
    .update(updateData as never)
    .eq('id', loopId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update loop status: ${error.message}`);
  }

  return data as Loop;
}

/**
 * Create a new loop
 */
export async function createLoop(loop: NewLoop): Promise<Loop> {
  const { data, error } = await supabase
    .from('loops')
    .insert(loop as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create loop: ${error.message}`);
  }

  return data as Loop;
}

