/**
 * Flooring API Service
 * Handles flooring-specific operations: materials, moisture readings, task templates
 */

import { supabase } from '../supabase';
import type {
  FlooringType,
  Material,
  MoistureReading,
  MoistureThreshold,
  TaskTemplate,
  NewMaterial,
  NewMoistureReading,
  SubstrateType,
  TestMethod,
} from '../../types/database';

// ============================================================================
// FLOORING TYPES
// ============================================================================

/**
 * Get all flooring types
 */
export async function getFlooringTypes(): Promise<FlooringType[]> {
  const { data, error } = await supabase
    .from('flooring_types')
    .select('*')
    .order('display_order');

  if (error) {
    throw new Error(`Failed to get flooring types: ${error.message}`);
  }

  return (data || []) as FlooringType[];
}

// ============================================================================
// MATERIALS
// ============================================================================

/**
 * Get materials for a project
 */
export async function getProjectMaterials(projectId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get materials: ${error.message}`);
  }

  return (data || []) as Material[];
}

/**
 * Create a new material record
 */
export async function createMaterial(material: NewMaterial): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .insert(material as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create material: ${error.message}`);
  }

  return data as Material;
}

/**
 * Delete a material
 */
export async function deleteMaterial(materialId: string): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId);

  if (error) {
    throw new Error(`Failed to delete material: ${error.message}`);
  }
}

/**
 * Start acclimation for a material
 */
export async function startAcclimation(
  materialId: string,
  requiredHours?: number
): Promise<Material> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('materials')
    .update({
      acclimation_start: now,
      acclimation_required_hours: requiredHours,
    } as never)
    .eq('id', materialId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start acclimation: ${error.message}`);
  }

  return data as Material;
}

// ============================================================================
// MOISTURE READINGS
// ============================================================================

/**
 * Get moisture thresholds
 */
export async function getMoistureThresholds(): Promise<MoistureThreshold[]> {
  const { data, error } = await supabase
    .from('moisture_thresholds')
    .select('*');

  if (error) {
    throw new Error(`Failed to get moisture thresholds: ${error.message}`);
  }

  return (data || []) as MoistureThreshold[];
}

/**
 * Get moisture threshold for a specific substrate and test method (internal)
 */
async function getMoistureThreshold(
  substrateType: SubstrateType,
  testMethod: TestMethod
): Promise<MoistureThreshold | null> {
  const { data, error } = await supabase
    .from('moisture_thresholds')
    .select('*')
    .eq('substrate_type', substrateType)
    .eq('test_method', testMethod)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get moisture threshold: ${error.message}`);
  }

  return data as MoistureThreshold;
}

/**
 * Get moisture readings for a project
 */
export async function getProjectMoistureReadings(projectId: string): Promise<MoistureReading[]> {
  const { data, error } = await supabase
    .from('moisture_readings')
    .select('*')
    .eq('project_id', projectId)
    .order('taken_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get moisture readings: ${error.message}`);
  }

  return (data || []) as MoistureReading[];
}

/**
 * Create a new moisture reading
 * Automatically evaluates against thresholds
 */
export async function createMoistureReading(
  reading: NewMoistureReading
): Promise<MoistureReading> {
  const threshold = await getMoistureThreshold(
    reading.substrate_type,
    reading.test_method
  );

  let passed = false;
  let thresholdValue: number | null = null;

  if (threshold) {
    thresholdValue = threshold.pass_max;
    passed = reading.reading_value <= threshold.pass_max;
  }

  const { data, error } = await supabase
    .from('moisture_readings')
    .insert({
      ...reading,
      passed,
      threshold_value: thresholdValue,
    } as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create moisture reading: ${error.message}`);
  }

  return data as MoistureReading;
}

/**
 * Delete a moisture reading
 */
export async function deleteMoistureReading(readingId: string): Promise<void> {
  const { error } = await supabase
    .from('moisture_readings')
    .delete()
    .eq('id', readingId);

  if (error) {
    throw new Error(`Failed to delete moisture reading: ${error.message}`);
  }
}

// ============================================================================
// TASK TEMPLATES
// ============================================================================

/**
 * Get all task templates
 */
export async function getTaskTemplates(): Promise<TaskTemplate[]> {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('is_active', true)
    .order('sequence_order');

  if (error) {
    throw new Error(`Failed to get task templates: ${error.message}`);
  }

  return (data || []) as TaskTemplate[];
}

/**
 * Get task templates for a specific flooring type
 * Returns both universal templates (null flooring_type_id) and type-specific ones
 */
export async function getTaskTemplatesForFlooringType(
  flooringTypeId: string | null
): Promise<TaskTemplate[]> {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('is_active', true)
    .or(`flooring_type_id.is.null,flooring_type_id.eq.${flooringTypeId}`)
    .order('sequence_order');

  if (error) {
    throw new Error(`Failed to get task templates: ${error.message}`);
  }

  return (data || []) as TaskTemplate[];
}
