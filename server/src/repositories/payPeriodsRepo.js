import supabase from '../utils/supabase.js'

/**
 * Get all pay periods
 * @returns {Promise<Array>} Array of pay periods with summaries
 */
export const getAllPayPeriods = async () => {
  const { data, error } = await supabase
    .from('pay_period_summaries')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single pay period by ID
 * @param {string} periodId - Pay period UUID
 * @returns {Promise<Object>} Pay period details
 */
export const getPayPeriodById = async (periodId) => {
  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('id', periodId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get current active pay period
 * @returns {Promise<Object|null>} Current pay period or null
 */
export const getCurrentPayPeriod = async () => {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('pay_periods')
    .select('*')
    .lte('start_date', today)
    .gte('end_date', today)
    .eq('status', 'open')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Create a new pay period
 * @param {Object} periodData - Pay period data
 * @returns {Promise<Object>} Created pay period
 */
export const createPayPeriod = async (periodData) => {
  const { data, error } = await supabase
    .from('pay_periods')
    .insert([periodData])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a pay period
 * @param {string} periodId - Pay period UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated pay period
 */
export const updatePayPeriod = async (periodId, updates) => {
  const { data, error } = await supabase
    .from('pay_periods')
    .update(updates)
    .eq('id', periodId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Close a pay period (prevents further time entries)
 * @param {string} periodId - Pay period UUID
 * @returns {Promise<Object>} Updated pay period
 */
export const closePayPeriod = async (periodId) => {
  const { data, error} = await supabase
    .from('pay_periods')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString()
    })
    .eq('id', periodId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Reopen a closed pay period
 * @param {string} periodId - Pay period UUID
 * @returns {Promise<Object>} Updated pay period
 */
export const reopenPayPeriod = async (periodId) => {
  const { data, error } = await supabase
    .from('pay_periods')
    .update({
      status: 'open',
      closed_at: null
    })
    .eq('id', periodId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a pay period
 * @param {string} periodId - Pay period UUID
 * @returns {Promise<void>}
 */
export const deletePayPeriod = async (periodId) => {
  const { error } = await supabase
    .from('pay_periods')
    .delete()
    .eq('id', periodId)

  if (error) throw error
}

/**
 * Get time entries for a specific pay period
 * @param {string} periodId - Pay period UUID
 * @returns {Promise<Array>} Array of time entries
 */
export const getTimeEntriesForPayPeriod = async (periodId) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('pay_period_id', periodId)
    .order('start_time', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Generate next pay period based on frequency
 * @param {string} frequency - Pay period frequency ('weekly', 'biweekly', 'semimonthly', 'monthly')
 * @param {Date} lastEndDate - End date of the last pay period
 * @returns {Object} New pay period data
 */
export const generateNextPayPeriod = (frequency, lastEndDate) => {
  const startDate = new Date(lastEndDate)
  startDate.setDate(startDate.getDate() + 1) // Day after last period ended

  let endDate = new Date(startDate)

  switch (frequency) {
    case 'weekly':
      endDate.setDate(endDate.getDate() + 6)
      break
    case 'biweekly':
      endDate.setDate(endDate.getDate() + 13)
      break
    case 'semimonthly':
      // 15th and last day of month
      if (startDate.getDate() === 1) {
        endDate.setDate(15)
      } else {
        endDate.setMonth(endDate.getMonth() + 1, 0) // Last day of month
      }
      break
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(endDate.getDate() - 1)
      break
    default:
      endDate.setDate(endDate.getDate() + 13) // Default to biweekly
  }

  return {
    name: `Pay Period ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    frequency,
    status: 'open'
  }
}
