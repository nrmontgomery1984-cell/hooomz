import supabase from '../utils/supabase.js'

/**
 * Loop Repository
 * Manages loop contexts and iterations for the nested loop architecture
 */

// ============================================================================
// LOOP CONTEXTS
// ============================================================================

/**
 * Get all loop contexts for a project
 * Returns hierarchical structure with parent/child relationships
 */
export const getProjectLoopContexts = async (projectId) => {
  const { data, error } = await supabase
    .from('loop_contexts')
    .select(`
      *,
      parent:parent_context_id(id, name)
    `)
    .eq('project_id', projectId)
    .order('display_order')

  if (error) throw error
  return data
}

/**
 * Create a loop context for a project
 * Used when initializing project structure
 */
export const createLoopContext = async (projectId, contextData) => {
  const { data, error } = await supabase
    .from('loop_contexts')
    .insert({
      project_id: projectId,
      ...contextData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// LOOP ITERATIONS
// ============================================================================

/**
 * Get all iterations for a specific context
 */
export const getLoopIterations = async (contextId) => {
  const { data, error } = await supabase
    .from('loop_iterations')
    .select(`
      *,
      parent:parent_iteration_id(id, name, location_path)
    `)
    .eq('context_id', contextId)
    .order('display_order')

  if (error) throw error
  return data
}

/**
 * Create a loop iteration (e.g., "1st Floor", "Living Room")
 */
export const createLoopIteration = async (contextId, iterationData) => {
  const { data, error } = await supabase
    .from('loop_iterations')
    .insert({
      context_id: contextId,
      ...iterationData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a loop iteration
 */
export const updateLoopIteration = async (iterationId, updates) => {
  const { data, error } = await supabase
    .from('loop_iterations')
    .update(updates)
    .eq('id', iterationId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a loop iteration
 * WARNING: Will cascade delete all task_instances in this location
 */
export const deleteLoopIteration = async (iterationId) => {
  const { error } = await supabase
    .from('loop_iterations')
    .delete()
    .eq('id', iterationId)

  if (error) throw error
  return { success: true }
}

// ============================================================================
// HIERARCHICAL QUERIES
// ============================================================================

/**
 * Get complete building structure for a project
 * Returns nested hierarchy: Buildings → Floors → Rooms → Zones
 */
export const getBuildingStructure = async (projectId) => {
  // Get all contexts for project
  const contexts = await getProjectLoopContexts(projectId)

  if (!contexts || contexts.length === 0) {
    return {}
  }

  // Get all iterations for all contexts
  const contextIds = contexts.map(c => c.id)
  const { data: allIterations, error: iterError } = await supabase
    .from('loop_iterations')
    .select('*')
    .in('context_id', contextIds)
    .order('display_order')

  if (iterError) throw iterError

  // Build nested structure
  const structure = {}

  // Group iterations by context
  const iterationsByContext = {}
  allIterations.forEach(iteration => {
    if (!iterationsByContext[iteration.context_id]) {
      iterationsByContext[iteration.context_id] = []
    }
    iterationsByContext[iteration.context_id].push(iteration)
  })

  // Build hierarchy starting from root contexts (no parent)
  const rootContexts = contexts.filter(c => !c.parent_context_id)

  rootContexts.forEach(context => {
    structure[context.name] = {
      context_id: context.id,
      iterations: buildIterationHierarchy(
        context.id,
        iterationsByContext[context.id] || [],
        contexts,
        iterationsByContext
      )
    }
  })

  return structure
}

/**
 * Helper function to build iteration hierarchy recursively
 */
function buildIterationHierarchy(contextId, iterations, allContexts, iterationsByContext) {
  return iterations.map(iteration => {
    const result = {
      id: iteration.id,
      name: iteration.name,
      location_path: iteration.location_path,
      display_order: iteration.display_order,
      metadata: iteration.metadata
    }

    // Find child contexts
    const childContexts = allContexts.filter(c => c.parent_context_id === contextId)

    if (childContexts.length > 0) {
      result.children = {}
      childContexts.forEach(childContext => {
        // Get iterations for this child context that have this iteration as parent
        const childIterations = (iterationsByContext[childContext.id] || [])
          .filter(i => i.parent_iteration_id === iteration.id)

        result.children[childContext.name] = {
          context_id: childContext.id,
          iterations: buildIterationHierarchy(
            childContext.id,
            childIterations,
            allContexts,
            iterationsByContext
          )
        }
      })
    }

    return result
  })
}

/**
 * Get all rooms (regardless of floor) for easy dropdown population
 */
export const getAllRooms = async (projectId) => {
  // First get the "Rooms" context
  const { data: contexts, error: contextError } = await supabase
    .from('loop_contexts')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', 'Rooms')
    .single()

  if (contextError) throw contextError
  if (!contexts) return []

  // Get all iterations for the Rooms context
  const { data, error } = await supabase
    .from('loop_iterations')
    .select('id, name, location_path')
    .eq('context_id', contexts.id)
    .order('location_path')

  if (error) throw error
  return data
}

// Export as default object
export default {
  getProjectLoopContexts,
  createLoopContext,
  getLoopIterations,
  createLoopIteration,
  updateLoopIteration,
  deleteLoopIteration,
  getBuildingStructure,
  getAllRooms
}
