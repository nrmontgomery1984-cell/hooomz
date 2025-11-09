import * as homesRepo from '../repositories/homesRepo.js'

/**
 * Homes Service
 * Business logic layer for home operations
 */

/**
 * Create a new home
 * @param {string} userId - User ID from auth
 * @param {Object} homeData - Home data
 * @returns {Promise<Object>} Created home
 */
export const createHome = async (userId, homeData) => {
  // Validate required fields
  if (!homeData.address) {
    throw new Error('Address is required')
  }

  // Prepare home data
  const home = {
    owner_id: userId,
    address: homeData.address,
    year_built: homeData.year_built || null,
    sqft: homeData.sqft || null,
    meta: homeData.meta || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return await homesRepo.createHome(home)
}

/**
 * Get all homes for a user
 * @param {string} userId - User ID from auth
 * @returns {Promise<Array>} Array of homes
 */
export const getUserHomes = async (userId) => {
  return await homesRepo.getHomesByUserId(userId)
}

/**
 * Get a single home by ID
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID from auth
 * @returns {Promise<Object>} Home object
 */
export const getHomeById = async (homeId, userId) => {
  const home = await homesRepo.getHomeById(homeId, userId)

  if (!home) {
    throw new Error('Home not found')
  }

  return home
}

/**
 * Update a home
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID from auth
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated home
 */
export const updateHome = async (homeId, userId, updates) => {
  // Remove fields that shouldn't be updated
  const { id, owner_id, created_at, deleted_at, ...allowedUpdates } = updates

  if (Object.keys(allowedUpdates).length === 0) {
    throw new Error('No valid fields to update')
  }

  const home = await homesRepo.updateHome(homeId, userId, allowedUpdates)

  if (!home) {
    throw new Error('Home not found or update failed')
  }

  return home
}

/**
 * Delete a home (soft delete)
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID from auth
 * @returns {Promise<Object>} Deleted home
 */
export const deleteHome = async (homeId, userId) => {
  const home = await homesRepo.softDeleteHome(homeId, userId)

  if (!home) {
    throw new Error('Home not found or already deleted')
  }

  return home
}

/**
 * Validate home ownership
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID from auth
 * @returns {Promise<boolean>} True if user owns home
 */
export const validateOwnership = async (homeId, userId) => {
  try {
    await homesRepo.getHomeById(homeId, userId)
    return true
  } catch (error) {
    return false
  }
}
