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
 * Round minutes to nearest 15-minute increment
 * @param {number} minutes - Minutes to round
 * @returns {number} Rounded minutes
 */
const roundToNearest15 = (minutes) => {
  return Math.ceil(minutes / 15) * 15
}

/**
 * Check if there's a consecutive task (no gap between end and next start)
 * @param {string} workerName - Worker name
 * @param {Date} endTime - End time of current entry
 * @returns {Promise<boolean>} True if there's a consecutive task
 */
const hasConsecutiveTask = async (workerName, endTime) => {
  // Look for any time entry that starts within 2 minutes of this end time
  const endTimestamp = new Date(endTime).getTime()
  const twoMinutesLater = new Date(endTimestamp + 2 * 60000).toISOString()
  const twoMinutesBefore = new Date(endTimestamp - 2 * 60000).toISOString()

  const { data, error } = await supabase
    .from('time_entries')
    .select('id')
    .eq('worker_name', workerName)
    .gte('start_time', twoMinutesBefore)
    .lte('start_time', twoMinutesLater)
    .limit(1)

  if (error) return false
  return data && data.length > 0
}

/**
 * Stop/complete a running time entry with smart rounding and lunch deduction
 * @param {string} timeEntryId - Time entry ID
 * @returns {Promise<Object>} Updated time entry
 */
export const stopTimeEntry = async (timeEntryId) => {
  const endTime = new Date().toISOString()

  // Get the entry to calculate duration
  const entry = await getTimeEntryById(timeEntryId)
  const start = new Date(entry.start_time)
  const end = new Date(endTime)
  let durationMinutes = Math.round((end - start) / 60000)

  // Check if there's a consecutive task to avoid double-rounding
  const hasConsecutive = await hasConsecutiveTask(entry.worker_name, endTime)

  // Apply 15-minute rounding only if no consecutive task
  if (!hasConsecutive) {
    durationMinutes = roundToNearest15(durationMinutes)
  }

  // Check if we need to deduct lunch (6+ hours = 360+ minutes)
  let lunchDeducted = false
  if (durationMinutes >= 360) {
    durationMinutes -= 30
    lunchDeducted = true
  }

  return updateTimeEntry(timeEntryId, {
    end_time: endTime,
    duration_minutes: durationMinutes,
    lunch_deducted: lunchDeducted
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
 * Get all time entries across all projects
 * @returns {Promise<Array>} Array of all time entries with scope item details
 */
export const getAllTimeEntries = async () => {
  const { data, error} = await supabase
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
            project_id,
            project:projects (
              id,
              name,
              client_name
            )
          )
        )
      )
    `)
    .order('start_time', { ascending: false })

  if (error) throw error
  return data || []
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

/**
 * Create a manual time entry (not from timer)
 * @param {Object} entryData - Manual entry data (scope_item_id, worker_name, start_time, end_time, notes, created_by)
 * @returns {Promise<Object>} Created time entry
 */
export const createManualTimeEntry = async (entryData) => {
  const start = new Date(entryData.start_time)
  const end = new Date(entryData.end_time)
  let durationMinutes = Math.round((end - start) / 60000)

  // Apply 15-minute rounding for manual entries
  durationMinutes = roundToNearest15(durationMinutes)

  // Check if we need to deduct lunch (6+ hours = 360+ minutes)
  let lunchDeducted = false
  if (durationMinutes >= 360) {
    durationMinutes -= 30
    lunchDeducted = true
  }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      ...entryData,
      duration_minutes: durationMinutes,
      lunch_deducted: lunchDeducted,
      is_manual_entry: true
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Toggle lunch deduction for a time entry
 * @param {string} timeEntryId - Time entry ID
 * @param {boolean} deductLunch - Whether to deduct lunch
 * @returns {Promise<Object>} Updated time entry
 */
export const toggleLunchDeduction = async (timeEntryId, deductLunch) => {
  const entry = await getTimeEntryById(timeEntryId)
  let durationMinutes = entry.duration_minutes

  if (deductLunch && !entry.lunch_deducted) {
    // Add lunch deduction
    durationMinutes -= 30
  } else if (!deductLunch && entry.lunch_deducted) {
    // Remove lunch deduction
    durationMinutes += 30
  }

  return updateTimeEntry(timeEntryId, {
    duration_minutes: durationMinutes,
    lunch_deducted: deductLunch
  })
}

/**
 * Approve a time entry (manager only)
 * @param {string} timeEntryId - Time entry ID
 * @param {string} approverId - User ID of the approver
 * @returns {Promise<Object>} Updated time entry
 */
export const approveTimeEntry = async (timeEntryId, approverId) => {
  return updateTimeEntry(timeEntryId, {
    approved_by_manager: true,
    approved_at: new Date().toISOString(),
    approved_by: approverId
  })
}

/**
 * Unapprove a time entry
 * @param {string} timeEntryId - Time entry ID
 * @returns {Promise<Object>} Updated time entry
 */
export const unapproveTimeEntry = async (timeEntryId) => {
  return updateTimeEntry(timeEntryId, {
    approved_by_manager: false,
    approved_at: null,
    approved_by: null
  })
}
