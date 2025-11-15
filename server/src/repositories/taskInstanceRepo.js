import supabase from '../utils/supabase.js'

/**
 * Task Instance Repository
 * Manages task instances and deployment logic
 * Includes optimizations for batch operations and efficient queries
 */

// ============================================================================
// CORE INSTANCE OPERATIONS
// ============================================================================

/**
 * Get all task instances for a project with filters and pagination
 * Optimized with view usage and proper indexing
 */
export const getProjectInstances = async (projectId, filters = {}, pagination = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'location_path',
    sortOrder = 'asc'
  } = pagination

  const offset = (page - 1) * limit

  // Use view for efficiency (avoids N+1 queries)
  let query = supabase
    .from('v_task_instances_full')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)

  // Apply filters
  if (filters.phase_id) {
    // Join through checklist items for phase filtering
    query = query.contains('phase_ids', [filters.phase_id])
  }
  if (filters.iteration_id) {
    query = query.eq('iteration_id', filters.iteration_id)
  }
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.assignee_id) {
    query = query.eq('assignee_id', filters.assignee_id)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
      hasMore: page * limit < (count || 0)
    }
  }
}

/**
 * Get single instance by ID
 */
export const getInstanceById = async (instanceId) => {
  const { data, error } = await supabase
    .from('task_instances')
    .select(`
      *,
      template:task_templates(id, name, category_id, subcategory_id, estimated_hours),
      iteration:loop_iterations(id, name, location_path),
      assignee:project_members(id, user_id, users(id, email, full_name))
    `)
    .eq('id', instanceId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get instance with full details (for detail dialog)
 * Optimized to minimize queries using JOINs
 */
export const getInstanceDetails = async (instanceId) => {
  // Get instance with template and iteration info
  const instance = await getInstanceById(instanceId)

  // Get template materials (inherited)
  const { data: templateMaterials } = await supabase
    .from('task_materials')
    .select('*')
    .eq('template_id', instance.template_id)
    .order('created_at')

  // Get instance-specific materials (additions)
  const { data: instanceMaterials } = await supabase
    .from('task_instance_materials')
    .select('*')
    .eq('instance_id', instanceId)
    .order('created_at')

  // Get checklist items grouped by phase
  const { data: checklistItems } = await supabase
    .from('task_checklist_items')
    .select(`
      *,
      phase_checklist:phase_checklists(
        id,
        description,
        is_critical,
        display_order,
        phase:phases(id, name)
      )
    `)
    .eq('instance_id', instanceId)
    .order('phase_checklist.phase_id')
    .order('phase_checklist.display_order')

  // Group checklist by phase
  const checklist = {}
  checklistItems?.forEach(item => {
    const phaseName = item.phase_checklist.phase.name
    if (!checklist[phaseName]) {
      checklist[phaseName] = []
    }
    checklist[phaseName].push({
      id: item.id,
      description: item.phase_checklist.description,
      is_critical: item.phase_checklist.is_critical,
      is_completed: item.is_completed,
      completed_at: item.completed_at,
      completed_by: item.completed_by
    })
  })

  // Get tools from template
  const { data: tools } = await supabase
    .from('task_tools')
    .select('*')
    .eq('template_id', instance.template_id)
    .order('created_at')

  // Get project members for assignee dropdown
  const { data: projectMembers } = await supabase
    .from('project_members')
    .select(`
      id,
      user_id,
      role,
      users(id, email, full_name)
    `)
    .eq('project_id', instance.template.project_id)

  return {
    instance,
    template: instance.template,
    materials: [
      ...(templateMaterials || []).map(m => ({ ...m, source: 'template' })),
      ...(instanceMaterials || []).map(m => ({ ...m, source: 'instance' }))
    ],
    tools: tools || [],
    checklist,
    projectMembers: projectMembers || []
  }
}

// ============================================================================
// INSTANCE MUTATIONS
// ============================================================================

/**
 * Create a single task instance
 */
export const createInstance = async (templateId, iterationId, instanceData = {}) => {
  const { data, error } = await supabase
    .from('task_instances')
    .insert({
      template_id: templateId,
      iteration_id: iterationId,
      status: 'pending',
      ...instanceData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a task instance
 */
export const updateInstance = async (instanceId, updates) => {
  // If status changed to completed, add timestamp
  if (updates.status === 'completed' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('task_instances')
    .update(updates)
    .eq('id', instanceId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a task instance
 */
export const deleteInstance = async (instanceId) => {
  const { error } = await supabase
    .from('task_instances')
    .delete()
    .eq('id', instanceId)

  if (error) throw error
  return { success: true }
}

// ============================================================================
// DEPLOYMENT OPERATIONS (OPTIMIZED)
// ============================================================================

/**
 * Deploy template to specific iterations
 * Uses batch insert for efficiency
 */
export const deployTemplate = async (templateId, iterationIds) => {
  // Get template for default values
  const { data: template, error: templateError } = await supabase
    .from('task_templates')
    .select('name, estimated_hours, priority')
    .eq('id', templateId)
    .single()

  if (templateError) throw templateError

  // Prepare instances to create
  const instancesToCreate = iterationIds.map(iterationId => ({
    template_id: templateId,
    iteration_id: iterationId,
    description: template.name,
    estimated_hours: template.estimated_hours,
    priority: template.priority,
    status: 'pending'
  }))

  // Batch insert
  const { data, error } = await supabase
    .from('task_instances')
    .insert(instancesToCreate)
    .select()

  if (error) throw error
  return data
}

/**
 * Deploy template to ALL matching iterations
 * Auto-finds all iterations of the template's loop context
 * OPTIMIZED: Batch insert, duplicate checking, transaction safety
 */
export const deployTemplateToAll = async (templateId) => {
  // Get template with loop context
  const { data: template, error: templateError } = await supabase
    .from('task_templates')
    .select(`
      id,
      name,
      estimated_hours,
      priority,
      loop_context_id,
      loop_context:loop_contexts(id, name)
    `)
    .eq('id', templateId)
    .single()

  if (templateError) throw templateError

  if (!template.loop_context_id) {
    throw new Error('Template is not bound to a loop context')
  }

  // Get all iterations for the loop context
  const { data: iterations, error: iterError } = await supabase
    .from('loop_iterations')
    .select('id, name')
    .eq('context_id', template.loop_context_id)

  if (iterError) throw iterError

  if (!iterations || iterations.length === 0) {
    return {
      created: 0,
      message: 'No iterations found for this loop context'
    }
  }

  // Get existing instances to avoid duplicates
  const { data: existingInstances } = await supabase
    .from('task_instances')
    .select('iteration_id')
    .eq('template_id', templateId)

  const existingIterationIds = new Set(
    existingInstances?.map(i => i.iteration_id) || []
  )

  // Filter out iterations that already have instances
  const newIterations = iterations.filter(
    iter => !existingIterationIds.has(iter.id)
  )

  if (newIterations.length === 0) {
    return {
      created: 0,
      message: 'All iterations already have instances'
    }
  }

  // Prepare batch insert
  const instancesToCreate = newIterations.map(iteration => ({
    template_id: templateId,
    iteration_id: iteration.id,
    description: template.name,
    estimated_hours: template.estimated_hours,
    priority: template.priority,
    status: 'pending'
    // location_path will be set by trigger
    // checklist items will be created by trigger
  }))

  // BATCH INSERT (atomic operation)
  const { data: created, error: insertError } = await supabase
    .from('task_instances')
    .insert(instancesToCreate)
    .select()

  if (insertError) throw insertError

  return {
    created: created.length,
    message: `Deployed to ${created.length} locations`,
    instances: created
  }
}

// ============================================================================
// FILTERED QUERIES
// ============================================================================

/**
 * Get instances filtered by phase
 * Returns only instances that have checklist items for that phase
 */
export const getInstancesByPhase = async (projectId, phaseId) => {
  const { data, error } = await supabase
    .from('task_instances')
    .select(`
      *,
      template:task_templates(id, name, category_id, subcategory_id),
      iteration:loop_iterations(id, name, location_path),
      checklist:task_checklist_items!inner(
        id,
        is_completed,
        phase_checklist:phase_checklists!inner(
          phase_id
        )
      )
    `)
    .eq('template.project_id', projectId)
    .eq('checklist.phase_checklist.phase_id', phaseId)
    .order('location_path')

  if (error) throw error
  return data
}

/**
 * Get instances by location (floor, room, etc.)
 * Uses text search for efficiency
 */
export const getInstancesByLocation = async (projectId, locationPath) => {
  const { data, error } = await supabase
    .from('v_task_instances_full')
    .select('*')
    .eq('project_id', projectId)
    .ilike('location_path', `${locationPath}%`)
    .order('location_path')

  if (error) throw error
  return data
}

/**
 * Get instances by category
 */
export const getInstancesByCategory = async (projectId, categoryId) => {
  const { data, error } = await supabase
    .from('task_instances')
    .select(`
      *,
      template:task_templates!inner(
        id,
        name,
        category_id,
        subcategory_id
      ),
      iteration:loop_iterations(id, name, location_path)
    `)
    .eq('template.project_id', projectId)
    .eq('template.category_id', categoryId)
    .order('location_path')

  if (error) throw error
  return data
}

// ============================================================================
// CHECKLIST OPERATIONS
// ============================================================================

/**
 * Toggle checklist item completion
 */
export const toggleChecklistItem = async (checklistItemId, userId) => {
  // Get current state
  const { data: current, error: getError } = await supabase
    .from('task_checklist_items')
    .select('is_completed')
    .eq('id', checklistItemId)
    .single()

  if (getError) throw getError

  // Toggle state
  const newState = !current.is_completed
  const updates = {
    is_completed: newState,
    completed_at: newState ? new Date().toISOString() : null,
    completed_by: newState ? userId : null
  }

  const { data, error } = await supabase
    .from('task_checklist_items')
    .update(updates)
    .eq('id', checklistItemId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// INSTANCE MATERIALS
// ============================================================================

/**
 * Add material to task instance
 * Used for uncaptured labour tracking and change orders
 */
export const addInstanceMaterial = async (instanceId, materialData, userId) => {
  const { data, error } = await supabase
    .from('task_instance_materials')
    .insert({
      instance_id: instanceId,
      added_by: userId,
      ...materialData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update instance material
 */
export const updateInstanceMaterial = async (materialId, updates) => {
  const { data, error } = await supabase
    .from('task_instance_materials')
    .update(updates)
    .eq('id', materialId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete instance material
 */
export const deleteInstanceMaterial = async (materialId) => {
  const { error } = await supabase
    .from('task_instance_materials')
    .delete()
    .eq('id', materialId)

  if (error) throw error
  return { success: true }
}

// Export as default object
export default {
  getProjectInstances,
  getInstanceById,
  getInstanceDetails,
  createInstance,
  updateInstance,
  deleteInstance,
  deployTemplate,
  deployTemplateToAll,
  getInstancesByPhase,
  getInstancesByLocation,
  getInstancesByCategory,
  toggleChecklistItem,
  addInstanceMaterial,
  updateInstanceMaterial,
  deleteInstanceMaterial
}
