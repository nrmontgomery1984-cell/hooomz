import supabase from '../utils/supabase.js'

/**
 * Home Repository
 * Handles all database operations for homes
 */

/**
 * Create a new home
 * @param {Object} homeData - Home data to insert
 * @returns {Promise<Object>} Created home
 */
export const createHome = async (homeData) => {
  const { data, error } = await supabase
    .from('homes')
    .insert(homeData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all homes for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of homes
 */
export const getHomesByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('homes')
    .select('*')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get a single home by ID
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<Object>} Home object
 */
export const getHomeById = async (homeId, userId) => {
  const { data, error } = await supabase
    .from('homes')
    .select('*')
    .eq('id', homeId)
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

/**
 * Update a home
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID (for ownership verification)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated home
 */
export const updateHome = async (homeId, userId, updates) => {
  const { data, error } = await supabase
    .from('homes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', homeId)
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Soft delete a home
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<Object>} Deleted home
 */
export const softDeleteHome = async (homeId, userId) => {
  const { data, error } = await supabase
    .from('homes')
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq('id', homeId)
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Hard delete a home (use with caution)
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<void>}
 */
export const hardDeleteHome = async (homeId, userId) => {
  const { error } = await supabase
    .from('homes')
    .delete()
    .eq('id', homeId)
    .eq('owner_id', userId)

  if (error) throw error
}
