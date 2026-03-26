/**
 * Floor Plan API Service
 * CRUD operations for floor plans and floor plan elements
 */

import { supabase } from '../supabase';
import type {
  FloorPlan,
  FloorPlanElement,
  Loop,
  NewFloorPlan,
  NewFloorPlanElement,
} from '../../types/database';

// ============================================================================
// FLOOR PLANS
// ============================================================================

/**
 * Get all floor plans for a project
 */
export async function getFloorPlans(projectId: string): Promise<FloorPlan[]> {
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch floor plans: ${error.message}`);
  }

  return (data || []) as FloorPlan[];
}

/**
 * Create a new floor plan
 */
export async function createFloorPlan(
  floorPlan: NewFloorPlan
): Promise<FloorPlan> {
  const { data, error } = await supabase
    .from('floor_plans')
    .insert(floorPlan as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create floor plan: ${error.message}`);
  }

  return data as FloorPlan;
}

// ============================================================================
// FLOOR PLAN ELEMENTS
// ============================================================================

/**
 * Get all elements for a floor plan
 */
export async function getFloorPlanElements(
  floorPlanId: string
): Promise<FloorPlanElement[]> {
  const { data, error } = await supabase
    .from('floor_plan_elements')
    .select('*')
    .eq('floor_plan_id', floorPlanId);

  if (error) {
    throw new Error(`Failed to fetch floor plan elements: ${error.message}`);
  }

  return (data || []) as FloorPlanElement[];
}

/**
 * Create a floor plan element
 */
export async function createFloorPlanElement(
  element: NewFloorPlanElement
): Promise<FloorPlanElement> {
  const { data, error } = await supabase
    .from('floor_plan_elements')
    .insert(element as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create floor plan element: ${error.message}`);
  }

  return data as FloorPlanElement;
}

/**
 * Create multiple floor plan elements in batch
 */
export async function createFloorPlanElementsBatch(
  elements: NewFloorPlanElement[]
): Promise<FloorPlanElement[]> {
  if (elements.length === 0) return [];

  const { data, error } = await supabase
    .from('floor_plan_elements')
    .insert(elements as never[])
    .select();

  if (error) {
    throw new Error(`Failed to create floor plan elements: ${error.message}`);
  }

  return (data || []) as FloorPlanElement[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find a loop by its revit_id in metadata
 */
export async function findLoopByRevitId(
  projectId: string,
  revitId: string | number
): Promise<Loop | null> {
  const { data, error } = await supabase
    .from('loops')
    .select('*')
    .eq('project_id', projectId)
    .filter('metadata->>revit_id', 'eq', String(revitId));

  if (error) {
    return null;
  }

  return data && data.length > 0 ? (data[0] as Loop) : null;
}
