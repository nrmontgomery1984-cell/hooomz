import supabase from '../utils/supabase.js'

/**
 * Projects Repository
 * Handles all database operations for contractor projects
 */

/**
 * Create a new project
 * @param {Object} projectData - Project data to insert
 * @returns {Promise<Object>} Created project
 */
export const createProject = async (projectData) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all projects
 * @param {string} userId - User ID (optional filter)
 * @returns {Promise<Array>} Array of projects
 */
export const getProjects = async (userId = null) => {
  let query = supabase
    .from('projects')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('created_by', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get a single project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project object
 */
export const getProjectById = async (projectId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

/**
 * Update a project
 * @param {string} projectId - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated project
 */
export const updateProject = async (projectId, updates) => {
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Soft delete a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Deleted project
 */
export const softDeleteProject = async (projectId) => {
  const { data, error} = await supabase
    .from('projects')
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get project with full scope breakdown
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project with categories, subcategories, and items
 */
export const getProjectWithScope = async (projectId) => {
  // Get project
  const project = await getProjectById(projectId)

  // Get categories
  const { data: categories, error: catError } = await supabase
    .from('scope_categories')
    .select('*')
    .eq('project_id', projectId)
    .order('display_order')

  if (catError) throw catError

  // Get subcategories for all categories
  const categoryIds = categories.map(c => c.id)

  const { data: subcategories, error: subError } = await supabase
    .from('scope_subcategories')
    .select('*')
    .in('category_id', categoryIds)
    .order('display_order')

  if (subError) throw subError

  // Get items for all subcategories
  const subcategoryIds = subcategories.map(s => s.id)

  const { data: items, error: itemsError } = await supabase
    .from('scope_items')
    .select('*')
    .in('subcategory_id', subcategoryIds)
    .order('display_order')

  if (itemsError) throw itemsError

  // Organize the data hierarchically
  const organizedCategories = categories.map(category => ({
    ...category,
    subcategories: subcategories
      .filter(sub => sub.category_id === category.id)
      .map(sub => ({
        ...sub,
        items: items.filter(item => item.subcategory_id === sub.id)
      }))
  }))

  return {
    ...project,
    categories: organizedCategories
  }
}

/**
 * Get all active workers
 * @returns {Promise<Array>} Array of active workers
 */
export const getWorkers = async () => {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}
