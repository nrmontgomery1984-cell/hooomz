import supabase from '../utils/supabase.js'

/**
 * Materials Repository
 * Handles all database operations for materials
 */

/**
 * Create a new material
 * @param {Object} materialData - Material data to insert
 * @returns {Promise<Object>} Created material
 */
export const createMaterial = async (materialData) => {
  const { data, error } = await supabase
    .from('materials')
    .insert(materialData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all materials for a home
 * @param {string} homeId - Home ID
 * @returns {Promise<Array>} Array of materials
 */
export const getMaterialsByHomeId = async (homeId) => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('home_id', homeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get materials for a specific room
 * @param {string} homeId - Home ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Array>} Array of materials
 */
export const getMaterialsByRoomId = async (homeId, roomId) => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('home_id', homeId)
    .eq('room_id', roomId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get a single material by ID
 * @param {string} materialId - Material ID
 * @returns {Promise<Object>} Material object
 */
export const getMaterialById = async (materialId) => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', materialId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

/**
 * Update a material
 * @param {string} materialId - Material ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated material
 */
export const updateMaterial = async (materialId, updates) => {
  const { data, error } = await supabase
    .from('materials')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', materialId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Soft delete a material
 * @param {string} materialId - Material ID
 * @returns {Promise<Object>} Deleted material
 */
export const softDeleteMaterial = async (materialId) => {
  const { data, error } = await supabase
    .from('materials')
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq('id', materialId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get materials by category
 * @param {string} homeId - Home ID
 * @param {string} category - Material category
 * @returns {Promise<Array>} Array of materials
 */
export const getMaterialsByCategory = async (homeId, category) => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('home_id', homeId)
    .eq('category', category)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
