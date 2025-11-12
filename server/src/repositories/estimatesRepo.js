import supabase from '../utils/supabase.js'

/**
 * Estimates Repository
 * Handles all database operations for project estimates and line items
 */

// ==================== ESTIMATES ====================

/**
 * Get all estimates for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of estimates with line items
 */
export const getEstimatesByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('estimates')
    .select(`
      *,
      line_items:estimate_line_items(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get a single estimate by ID with line items
 * @param {string} estimateId - Estimate ID
 * @returns {Promise<Object>} Estimate object with line items
 */
export const getEstimateById = async (estimateId) => {
  const { data, error } = await supabase
    .from('estimates')
    .select(`
      *,
      line_items:estimate_line_items(*)
    `)
    .eq('id', estimateId)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new estimate
 * @param {Object} estimateData - Estimate data to insert
 * @returns {Promise<Object>} Created estimate
 */
export const createEstimate = async (estimateData) => {
  const { data, error } = await supabase
    .from('estimates')
    .insert(estimateData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an estimate
 * @param {string} estimateId - Estimate ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated estimate
 */
export const updateEstimate = async (estimateId, updates) => {
  const { data, error} = await supabase
    .from('estimates')
    .update(updates)
    .eq('id', estimateId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete an estimate
 * @param {string} estimateId - Estimate ID
 * @returns {Promise<void>}
 */
export const deleteEstimate = async (estimateId) => {
  const { error } = await supabase
    .from('estimates')
    .delete()
    .eq('id', estimateId)

  if (error) throw error
}

// ==================== LINE ITEMS ====================

/**
 * Get all line items for an estimate
 * @param {string} estimateId - Estimate ID
 * @returns {Promise<Array>} Array of line items
 */
export const getLineItemsByEstimate = async (estimateId) => {
  const { data, error } = await supabase
    .from('estimate_line_items')
    .select('*')
    .eq('estimate_id', estimateId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Create a new line item
 * @param {Object} lineItemData - Line item data to insert
 * @returns {Promise<Object>} Created line item
 */
export const createLineItem = async (lineItemData) => {
  const { data, error } = await supabase
    .from('estimate_line_items')
    .insert(lineItemData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Create multiple line items at once
 * @param {Array} lineItems - Array of line item data to insert
 * @returns {Promise<Array>} Created line items
 */
export const createLineItems = async (lineItems) => {
  const { data, error } = await supabase
    .from('estimate_line_items')
    .insert(lineItems)
    .select()

  if (error) throw error
  return data
}

/**
 * Update a line item
 * @param {string} lineItemId - Line item ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated line item
 */
export const updateLineItem = async (lineItemId, updates) => {
  const { data, error } = await supabase
    .from('estimate_line_items')
    .update(updates)
    .eq('id', lineItemId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a line item
 * @param {string} lineItemId - Line item ID
 * @returns {Promise<void>}
 */
export const deleteLineItem = async (lineItemId) => {
  const { error } = await supabase
    .from('estimate_line_items')
    .delete()
    .eq('id', lineItemId)

  if (error) throw error
}

/**
 * Reorder line items
 * @param {Array} lineItemOrders - Array of {id, sort_order} objects
 * @returns {Promise<void>}
 */
export const reorderLineItems = async (lineItemOrders) => {
  const updates = lineItemOrders.map(item =>
    supabase
      .from('estimate_line_items')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
  )

  await Promise.all(updates)
}
