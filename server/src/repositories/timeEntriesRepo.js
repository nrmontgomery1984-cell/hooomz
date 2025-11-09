import supabase from '../utils/supabase.js'

/**
 * Time Entries Repository
 * Handles database operations for time tracking
 */

/**
 * Create a new time entry
 * @param {Object} timeEntryData - Time entry data
 * @returns {Promise<Object>} Created time entry
 */
export const createTimeEntry = async (timeEntryData) => {
  const { data, error } = await supabase
    .from('time_entries')
    .insert(timeEntryData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all time entries for a scope item
 * @param {string} scopeItemId - Scope item ID
 * @returns {Promise<Array>} Array of time entries
 */
export const getTimeEntriesByScopeItem = async (scopeItemId) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('scope_item_id', scopeItemId)
    .order('start_time', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get all time entries for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of time entries with scope item details
 */
export const getTimeEntriesByProject = async (projectId) => {
  // First, get categories for this project
  const { data: categories, error: catError } = await supabase
    .from('scope_categories')
    .select('id')
    .eq('project_id', projectId)

  if (catError) throw catError

  if (!categories || categories.length === 0) {
    return []
  }

  const categoryIds = categories.map(c => c.id)

  // Then get subcategories
  const { data: subcategories, error: subError } = await supabase
    .from('scope_subcategories')
    .select('id')
    .in('category_id', categoryIds)

  if (subError) throw subError

  if (!subcategories || subcategories.length === 0) {
    return []
  }

  const subcategoryIds = subcategories.map(s => s.id)

  // Finally get scope items
  const { data: scopeItems, error: scopeError } = await supabase
    .from('scope_items')
    .select('id')
    .in('subcategory_id', subcategoryIds)

  if (scopeError) throw scopeError

  if (!scopeItems || scopeItems.length === 0) {
    return []
  }

  const scopeItemIds = scopeItems.map(item => item.id)

  // Then get time entries for those scope items
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      scope_item:scope_items (
        id,
        description,
        subcategory:scope_subcategories (
          id,
          name,
          category:scope_categories (
            id,
            name,
            project_id
          )
        )
      )
    `)
    .in('scope_item_id', scopeItemIds)
    .order('start_time', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get time entries filtered by date range
 * @param {string} projectId - Project ID
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @returns {Promise<Array>} Array of time entries
 */
export const getTimeEntriesByDateRange = async (projectId, startDate, endDate) => {
  // First, get categories for this project
  const { data: categories, error: catError } = await supabase
    .from('scope_categories')
    .select('id')
    .eq('project_id', projectId)

  if (catError) throw catError

  if (!categories || categories.length === 0) {
    return []
  }

  const categoryIds = categories.map(c => c.id)

  // Then get subcategories
  const { data: subcategories, error: subError } = await supabase
    .from('scope_subcategories')
    .select('id')
    .in('category_id', categoryIds)

  if (subError) throw subError

  if (!subcategories || subcategories.length === 0) {
    return []
  }

  const subcategoryIds = subcategories.map(s => s.id)

  // Finally get scope items
  const { data: scopeItems, error: scopeError } = await supabase
    .from('scope_items')
    .select('id')
    .in('subcategory_id', subcategoryIds)

  if (scopeError) throw scopeError

  if (!scopeItems || scopeItems.length === 0) {
    return []
  }

  const scopeItemIds = scopeItems.map(item => item.id)

  // Then get time entries for those scope items
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      scope_item:scope_items (
        id,
        description,
        subcategory:scope_subcategories (
          id,
          name,
          category:scope_categories (
            id,
            name,
            project_id
          )
        )
      )
    `)
    .in('scope_item_id', scopeItemIds)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get time entries by worker
 * @param {string} workerName - Worker name
 * @param {string} projectId - Project ID (optional)
 * @returns {Promise<Array>} Array of time entries
 */
export const getTimeEntriesByWorker = async (workerName, projectId = null) => {
  let scopeItemIds = null

  // If filtering by project, get scope items first
  if (projectId) {
    // Get categories for this project
    const { data: categories, error: catError } = await supabase
      .from('scope_categories')
      .select('id')
      .eq('project_id', projectId)

    if (catError) throw catError

    if (!categories || categories.length === 0) {
      return []
    }

    const categoryIds = categories.map(c => c.id)

    // Then get subcategories
    const { data: subcategories, error: subError } = await supabase
      .from('scope_subcategories')
      .select('id')
      .in('category_id', categoryIds)

    if (subError) throw subError

    if (!subcategories || subcategories.length === 0) {
      return []
    }

    const subcategoryIds = subcategories.map(s => s.id)

    // Finally get scope items
    const { data: scopeItems, error: scopeError } = await supabase
      .from('scope_items')
      .select('id')
      .in('subcategory_id', subcategoryIds)

    if (scopeError) throw scopeError

    if (!scopeItems || scopeItems.length === 0) {
      return []
    }

    scopeItemIds = scopeItems.map(item => item.id)
  }

  let query = supabase
    .from('time_entries')
    .select(`
      *,
      scope_item:scope_items (
        id,
        description,
        subcategory:scope_subcategories (
          id,
          name,
          category:scope_categories (
            id,
            name,
            project_id
          )
        )
      )
    `)
    .eq('worker_name', workerName)
    .order('start_time', { ascending: false })

  if (scopeItemIds) {
    query = query.in('scope_item_id', scopeItemIds)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get a single time entry by ID
 * @param {string} timeEntryId - Time entry ID
 * @returns {Promise<Object>} Time entry object
 */
export const getTimeEntryById = async (timeEntryId) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', timeEntryId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update a time entry
 * @param {string} timeEntryId - Time entry ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated time entry
 */
export const updateTimeEntry = async (timeEntryId, updates) => {
  // Calculate duration if start_time and end_time are provided
  if (updates.start_time && updates.end_time) {
    const start = new Date(updates.start_time)
    const end = new Date(updates.end_time)
    updates.duration_minutes = Math.round((end - start) / 60000)
  }

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', timeEntryId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Stop/complete a running time entry
 * @param {string} timeEntryId - Time entry ID
 * @returns {Promise<Object>} Updated time entry
 */
export const stopTimeEntry = async (timeEntryId) => {
  const endTime = new Date().toISOString()

  // Get the entry to calculate duration
  const entry = await getTimeEntryById(timeEntryId)
  const start = new Date(entry.start_time)
  const end = new Date(endTime)
  const durationMinutes = Math.round((end - start) / 60000)

  return updateTimeEntry(timeEntryId, {
    end_time: endTime,
    duration_minutes: durationMinutes
  })
}

/**
 * Delete a time entry
 * @param {string} timeEntryId - Time entry ID
 * @returns {Promise<void>}
 */
export const deleteTimeEntry = async (timeEntryId) => {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', timeEntryId)

  if (error) throw error
}

/**
 * Get active (running) time entry for a worker
 * @param {string} workerName - Worker name
 * @returns {Promise<Object|null>} Active time entry or null
 */
export const getActiveTimeEntry = async (workerName) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      scope_item:scope_items (
        id,
        description,
        subcategory:scope_subcategories (
          id,
          name,
          category:scope_categories (
            id,
            name
          )
        )
      )
    `)
    .eq('worker_name', workerName)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No active entry found
      return null
    }
    throw error
  }

  return data
}
