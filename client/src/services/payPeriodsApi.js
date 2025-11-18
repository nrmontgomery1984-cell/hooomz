import { api } from './api'

/**
 * Get all pay periods
 * @returns {Promise<Array>} Array of pay periods with summaries
 */
export const getAllPayPeriods = async () => {
  const response = await api.get('/pay-periods')
  return response.data.data
}

/**
 * Get current active pay period
 * @returns {Promise<Object|null>} Current pay period or null
 */
export const getCurrentPayPeriod = async () => {
  const response = await api.get('/pay-periods/current')
  return response.data.data
}

/**
 * Get a single pay period by ID
 * @param {string} periodId - Pay period ID
 * @returns {Promise<Object>} Pay period details
 */
export const getPayPeriodById = async (periodId) => {
  const response = await api.get(`/pay-periods/${periodId}`)
  return response.data.data
}

/**
 * Get time entries for a specific pay period
 * @param {string} periodId - Pay period ID
 * @returns {Promise<Array>} Array of time entries
 */
export const getTimeEntriesForPayPeriod = async (periodId) => {
  const response = await api.get(`/pay-periods/${periodId}/entries`)
  return response.data.data
}

/**
 * Create a new pay period
 * @param {Object} periodData - Pay period data
 * @returns {Promise<Object>} Created pay period
 */
export const createPayPeriod = async (periodData) => {
  const response = await api.post('/pay-periods', periodData)
  return response.data.data
}

/**
 * Update a pay period
 * @param {string} periodId - Pay period ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated pay period
 */
export const updatePayPeriod = async (periodId, updates) => {
  const response = await api.put(`/pay-periods/${periodId}`, updates)
  return response.data.data
}

/**
 * Close a pay period
 * @param {string} periodId - Pay period ID
 * @returns {Promise<Object>} Updated pay period
 */
export const closePayPeriod = async (periodId) => {
  const response = await api.post(`/pay-periods/${periodId}/close`)
  return response.data.data
}

/**
 * Reopen a closed pay period
 * @param {string} periodId - Pay period ID
 * @returns {Promise<Object>} Updated pay period
 */
export const reopenPayPeriod = async (periodId) => {
  const response = await api.post(`/pay-periods/${periodId}/reopen`)
  return response.data.data
}

/**
 * Delete a pay period
 * @param {string} periodId - Pay period ID
 * @returns {Promise<void>}
 */
export const deletePayPeriod = async (periodId) => {
  await api.delete(`/pay-periods/${periodId}`)
}
