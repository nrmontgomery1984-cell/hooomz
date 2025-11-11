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
  if (!userId) {
    // If no userId, return all projects (admin use case)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get projects where user is a member
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_members!inner(role)
    `)
    .eq('project_members.user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Clean up the nested project_members array to just include role
  return data.map(project => ({
    ...project,
    user_role: project.project_members?.[0]?.role || 'member'
  }))
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

/**
 * Get project members
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of project members with user details
 */
export const getProjectMembers = async (projectId) => {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      user:auth.users(id, email, raw_user_meta_data)
    `)
    .eq('project_id', projectId)
    .order('role')
    .order('joined_at')

  if (error) throw error
  return data
}

/**
 * Add member to project
 * @param {string} projectId - Project ID
 * @param {string} userEmail - User email to add
 * @param {string} role - User role (owner, admin, member, viewer)
 * @param {string} invitedBy - User ID of inviter
 * @returns {Promise<Object>} Created project member
 */
export const addProjectMember = async (projectId, userEmail, role = 'member', invitedBy = null) => {
  // First, find the user by email using admin API
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()

  if (userError) throw new Error('Failed to fetch users: ' + userError.message)

  const user = users.find(u => u.email === userEmail)
  if (!user) throw new Error(`User with email ${userEmail} not found`)

  // Add user to project
  const { data, error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: user.id,
      role,
      invited_by: invitedBy
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update project member role
 * @param {string} memberId - Project member ID
 * @param {string} role - New role
 * @returns {Promise<Object>} Updated project member
 */
export const updateProjectMemberRole = async (memberId, role) => {
  const { data, error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Remove member from project
 * @param {string} memberId - Project member ID
 * @returns {Promise<void>}
 */
export const removeProjectMember = async (memberId) => {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId)

  if (error) throw error
}

/**
 * Check if user has access to project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Project member record or null
 */
export const checkProjectAccess = async (projectId, userId) => {
  const { data, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
  return data
}
