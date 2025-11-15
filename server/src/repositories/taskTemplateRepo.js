import supabase from '../utils/supabase.js'

/**
 * Task Template Repository
 * Manages task templates (quantum state) - templates that exist before deployment
 */

// ============================================================================
// CORE TEMPLATE OPERATIONS
// ============================================================================

/**
 * Get all task templates for a project
 */
export const getProjectTemplates = async (projectId) => {
  const { data, error } = await supabase
    .from('task_templates')
    .select(`
      *,
      category:scope_categories(id, name),
      subcategory:scope_subcategories(id, name),
      loop_context:loop_contexts(id, name)
    `)
    .eq('project_id', projectId)
    .order('category_id')
    .order('subcategory_id')

  if (error) throw error
  return data
}

/**
 * Get single template by ID with all details
 */
export const getTemplateById = async (templateId) => {
  const { data, error } = await supabase
    .from('task_templates')
    .select(`
      *,
      category:scope_categories(id, name),
      subcategory:scope_subcategories(id, name),
      loop_context:loop_contexts(id, name)
    `)
    .eq('id', templateId)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a task template
 * Used during estimate conversion
 */
export const createTemplate = async (projectId, templateData) => {
  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      project_id: projectId,
      ...templateData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a task template
 */
export const updateTemplate = async (templateId, updates) => {
  const { data, error } = await supabase
    .from('task_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a task template
 * WARNING: Will cascade delete all task_instances
 */
export const deleteTemplate = async (templateId) => {
  const { error } = await supabase
    .from('task_templates')
    .delete()
    .eq('id', templateId)

  if (error) throw error
  return { success: true }
}

// ============================================================================
// QUANTUM STATE QUERIES
// ============================================================================

/**
 * Get templates not fully deployed (quantum state)
 * For "Awaiting Deployment" dashboard
 */
export const getQuantumTasks = async (projectId) => {
  const { data, error } = await supabase
    .from('task_templates')
    .select(`
      *,
      category:scope_categories(id, name),
      subcategory:scope_subcategories(id, name),
      loop_context:loop_contexts(id, name)
    `)
    .eq('project_id', projectId)

  if (error) throw error

  // Filter for templates that are not fully deployed and calculate pending instances
  return (data || [])
    .filter(template => template.instances_deployed < template.total_quantity)
    .map(template => ({
      ...template,
      pending_instances: template.total_quantity - template.instances_deployed
    }))
}

// ============================================================================
// TEMPLATE RELATIONSHIPS
// ============================================================================

/**
 * Get template with materials
 */
export const getTemplateWithMaterials = async (templateId) => {
  const template = await getTemplateById(templateId)

  const { data: materials, error: matError } = await supabase
    .from('task_materials')
    .select('*')
    .eq('template_id', templateId)
    .order('created_at')

  if (matError) throw matError

  return {
    ...template,
    materials: materials || []
  }
}

/**
 * Get template with tools
 */
export const getTemplateWithTools = async (templateId) => {
  const template = await getTemplateById(templateId)

  const { data: tools, error: toolsError } = await supabase
    .from('task_tools')
    .select('*')
    .eq('template_id', templateId)
    .order('created_at')

  if (toolsError) throw toolsError

  return {
    ...template,
    tools: tools || []
  }
}

/**
 * Get template with phase checklists
 */
export const getTemplateWithChecklists = async (templateId) => {
  const template = await getTemplateById(templateId)

  const { data: checklistItems, error: checklistError } = await supabase
    .from('phase_checklists')
    .select(`
      *,
      phase:phases(id, name)
    `)
    .eq('template_id', templateId)
    .order('phase_id')
    .order('display_order')

  if (checklistError) throw checklistError

  // Group by phase
  const checklists = {}
  checklistItems.forEach(item => {
    const phaseName = item.phase.name
    if (!checklists[phaseName]) {
      checklists[phaseName] = []
    }
    checklists[phaseName].push({
      id: item.id,
      description: item.description,
      is_critical: item.is_critical,
      display_order: item.display_order
    })
  })

  return {
    ...template,
    checklists
  }
}

// ============================================================================
// MATERIALS & TOOLS MANAGEMENT
// ============================================================================

/**
 * Add materials to template
 */
export const addMaterials = async (templateId, materials) => {
  const materialsToInsert = materials.map(m => ({
    template_id: templateId,
    ...m
  }))

  const { data, error } = await supabase
    .from('task_materials')
    .insert(materialsToInsert)
    .select()

  if (error) throw error
  return data
}

/**
 * Add tools to template
 */
export const addTools = async (templateId, tools) => {
  const toolsToInsert = tools.map(t => ({
    template_id: templateId,
    ...t
  }))

  const { data, error } = await supabase
    .from('task_tools')
    .insert(toolsToInsert)
    .select()

  if (error) throw error
  return data
}

/**
 * Update a material
 */
export const updateMaterial = async (materialId, updates) => {
  // Check if material is locked
  const { data: material, error: checkError } = await supabase
    .from('task_materials')
    .select('is_locked')
    .eq('id', materialId)
    .single()

  if (checkError) throw checkError

  if (material.is_locked) {
    throw new Error('Material is locked from Material Selection and cannot be modified')
  }

  const { data, error } = await supabase
    .from('task_materials')
    .update(updates)
    .eq('id', materialId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a material
 */
export const deleteMaterial = async (materialId) => {
  // Check if material is locked
  const { data: material, error: checkError } = await supabase
    .from('task_materials')
    .select('is_locked')
    .eq('id', materialId)
    .single()

  if (checkError) throw checkError

  if (material.is_locked) {
    throw new Error('Material is locked from Material Selection and cannot be deleted')
  }

  const { error } = await supabase
    .from('task_materials')
    .delete()
    .eq('id', materialId)

  if (error) throw error
  return { success: true }
}

/**
 * Delete a tool
 */
export const deleteTool = async (toolId) => {
  const { error } = await supabase
    .from('task_tools')
    .delete()
    .eq('id', toolId)

  if (error) throw error
  return { success: true }
}

// Export as default object
export default {
  getProjectTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getQuantumTasks,
  getTemplateWithMaterials,
  getTemplateWithTools,
  getTemplateWithChecklists,
  addMaterials,
  addTools,
  updateMaterial,
  deleteMaterial,
  deleteTool
}
