import supabase from '../utils/supabase.js'

/**
 * Phase Repository
 * Manages construction phases and phase-specific checklists
 */

// ============================================================================
// PHASE MANAGEMENT
// ============================================================================

/**
 * Get global phase templates (available to all projects)
 */
export const getGlobalPhases = async () => {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('is_global_template', true)
    .order('display_order')

  if (error) throw error
  return data
}

/**
 * Get phases for a project (global templates + custom phases)
 */
export const getProjectPhases = async (projectId) => {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .or(`is_global_template.eq.true,project_id.eq.${projectId}`)
    .order('display_order')

  if (error) throw error
  return data
}

/**
 * Create a custom phase for a project
 */
export const createProjectPhase = async (projectId, phaseData) => {
  const { data, error } = await supabase
    .from('phases')
    .insert({
      project_id: projectId,
      is_global_template: false,
      ...phaseData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a phase
 * Note: Global phases should not be modified by individual projects
 */
export const updatePhase = async (phaseId, updates) => {
  // Check if it's a global template
  const { data: phase, error: getError } = await supabase
    .from('phases')
    .select('is_global_template')
    .eq('id', phaseId)
    .single()

  if (getError) throw getError

  if (phase.is_global_template) {
    throw new Error('Cannot modify global phase templates')
  }

  const { data, error } = await supabase
    .from('phases')
    .update(updates)
    .eq('id', phaseId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a custom phase
 */
export const deletePhase = async (phaseId) => {
  // Check if it's a global template
  const { data: phase, error: getError } = await supabase
    .from('phases')
    .select('is_global_template')
    .eq('id', phaseId)
    .single()

  if (getError) throw getError

  if (phase.is_global_template) {
    throw new Error('Cannot delete global phase templates')
  }

  const { error } = await supabase
    .from('phases')
    .delete()
    .eq('id', phaseId)

  if (error) throw error
  return { success: true }
}

// ============================================================================
// PHASE CHECKLIST MANAGEMENT
// ============================================================================

/**
 * Get phase checklist items for a specific phase
 * Returns checklist template that will be copied to task instances
 */
export const getPhaseChecklist = async (phaseId) => {
  const { data, error } = await supabase
    .from('phase_checklists')
    .select(`
      *,
      phase:phases(id, name, display_order)
    `)
    .eq('phase_id', phaseId)
    .order('display_order')

  if (error) throw error
  return data
}

/**
 * Get all checklist items for a task template grouped by phase
 */
export const getTemplateChecklists = async (templateId) => {
  const { data, error } = await supabase
    .from('phase_checklists')
    .select(`
      *,
      phase:phases(id, name, display_order)
    `)
    .eq('template_id', templateId)
    .order('phase.display_order')
    .order('display_order')

  if (error) throw error

  // Group by phase
  const checklist = {}
  data?.forEach(item => {
    const phaseName = item.phase.name
    if (!checklist[phaseName]) {
      checklist[phaseName] = []
    }
    checklist[phaseName].push(item)
  })

  return checklist
}

/**
 * Create a checklist item for a phase
 * This creates a template that will be copied to task instances
 */
export const createPhaseChecklist = async (phaseId, templateId, checklistData) => {
  const { data, error } = await supabase
    .from('phase_checklists')
    .insert({
      phase_id: phaseId,
      template_id: templateId,
      ...checklistData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a phase checklist item
 */
export const updatePhaseChecklistItem = async (checklistId, updates) => {
  const { data, error } = await supabase
    .from('phase_checklists')
    .update(updates)
    .eq('id', checklistId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a phase checklist item
 */
export const deletePhaseChecklistItem = async (checklistId) => {
  const { error } = await supabase
    .from('phase_checklists')
    .delete()
    .eq('id', checklistId)

  if (error) throw error
  return { success: true }
}

/**
 * Bulk create default checklists for a template
 * Used when converting estimate to template or creating new template
 */
export const createDefaultChecklists = async (templateId, categoryId, projectId) => {
  // Get project phases (global + custom)
  const phases = await getProjectPhases(projectId)

  // Get category-specific default checklists
  // This would typically come from a configuration or previous templates
  // For now, we'll create basic checklists based on common patterns

  const defaultChecklistsByPhase = getDefaultChecklistsForCategory(categoryId)

  const checklistsToCreate = []

  phases.forEach(phase => {
    const phaseDefaults = defaultChecklistsByPhase[phase.name] || []
    phaseDefaults.forEach((item, index) => {
      checklistsToCreate.push({
        phase_id: phase.id,
        template_id: templateId,
        description: item.description,
        is_critical: item.is_critical || false,
        display_order: index
      })
    })
  })

  if (checklistsToCreate.length === 0) {
    return []
  }

  // Batch insert
  const { data, error } = await supabase
    .from('phase_checklists')
    .insert(checklistsToCreate)
    .select()

  if (error) throw error
  return data
}

/**
 * Helper function to get default checklists based on category
 * This is a placeholder - in production, this would be configurable
 */
function getDefaultChecklistsForCategory(categoryId) {
  // Basic defaults for common categories
  // In production, this would come from a configuration system
  return {
    'Rough-In': [
      { description: 'Material on site', is_critical: true },
      { description: 'Site prep complete', is_critical: true },
      { description: 'Inspections passed', is_critical: true }
    ],
    'Installation': [
      { description: 'Material verified', is_critical: true },
      { description: 'Installation complete', is_critical: true },
      { description: 'Quality check passed', is_critical: false }
    ],
    'Finish': [
      { description: 'Touch-ups complete', is_critical: false },
      { description: 'Final inspection passed', is_critical: true },
      { description: 'Client walkthrough complete', is_critical: true }
    ]
  }
}

// ============================================================================
// PHASE STATISTICS
// ============================================================================

/**
 * Get phase completion statistics for a project
 * Shows how many tasks are in each phase and their completion rates
 */
export const getPhaseStats = async (projectId) => {
  // Get all phases for project
  const phases = await getProjectPhases(projectId)

  // For each phase, count task instances and their completion
  const statsPromises = phases.map(async (phase) => {
    const { data, error } = await supabase
      .from('task_checklist_items')
      .select(`
        id,
        is_completed,
        instance:task_instances!inner(
          id,
          template:task_templates!inner(
            project_id
          )
        ),
        phase_checklist:phase_checklists!inner(
          phase_id
        )
      `)
      .eq('instance.template.project_id', projectId)
      .eq('phase_checklist.phase_id', phase.id)

    if (error) throw error

    const total = data.length
    const completed = data.filter(item => item.is_completed).length

    return {
      phase_id: phase.id,
      phase_name: phase.name,
      total_checklist_items: total,
      completed_checklist_items: completed,
      completion_percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  const stats = await Promise.all(statsPromises)
  return stats
}

// Export as default object
export default {
  getGlobalPhases,
  getProjectPhases,
  createProjectPhase,
  updatePhase,
  deletePhase,
  getPhaseChecklist,
  getTemplateChecklists,
  createPhaseChecklist,
  updatePhaseChecklistItem,
  deletePhaseChecklistItem,
  createDefaultChecklists,
  getPhaseStats
}
