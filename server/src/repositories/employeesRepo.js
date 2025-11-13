import supabase from '../utils/supabase.js'

/**
 * Employees Repository
 * Handles all database operations for employees and time off requests
 */

// ==================== EMPLOYEES ====================

/**
 * Get all employees
 * @param {boolean} activeOnly - Filter for active employees only
 * @returns {Promise<Array>} Array of employees
 */
export const getEmployees = async (activeOnly = false) => {
  let query = supabase
    .from('employees')
    .select('*')
    .is('deleted_at', null)
    .order('last_name')
    .order('first_name')

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get a single employee by ID
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object>} Employee object
 */
export const getEmployeeById = async (employeeId) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

/**
 * Get employee by email
 * @param {string} email - Employee email
 * @returns {Promise<Object|null>} Employee object or null
 */
export const getEmployeeByEmail = async (email) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Create a new employee
 * @param {Object} employeeData - Employee data to insert
 * @returns {Promise<Object>} Created employee
 */
export const createEmployee = async (employeeData) => {
  const { data, error } = await supabase
    .from('employees')
    .insert(employeeData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an employee
 * @param {string} employeeId - Employee ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated employee
 */
export const updateEmployee = async (employeeId, updates) => {
  const { data, error } = await supabase
    .from('employees')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', employeeId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Soft delete an employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object>} Deleted employee
 */
export const softDeleteEmployee = async (employeeId) => {
  const { data, error } = await supabase
    .from('employees')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false
    })
    .eq('id', employeeId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Permanently delete an employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<void>}
 */
export const deleteEmployee = async (employeeId) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', employeeId)

  if (error) throw error
}

// ==================== TIME OFF REQUESTS ====================

/**
 * Get all time off requests
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of time off requests with employee info
 */
export const getTimeOffRequests = async (filters = {}) => {
  let query = supabase
    .from('time_off_requests')
    .select(`
      *,
      employee:employees(id, first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })

  if (filters.employeeId) {
    query = query.eq('employee_id', filters.employeeId)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.startDate) {
    query = query.gte('start_date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('end_date', filters.endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get time off requests for a specific employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Array>} Array of time off requests
 */
export const getTimeOffRequestsByEmployee = async (employeeId) => {
  const { data, error } = await supabase
    .from('time_off_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get a single time off request by ID
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Time off request object
 */
export const getTimeOffRequestById = async (requestId) => {
  const { data, error } = await supabase
    .from('time_off_requests')
    .select(`
      *,
      employee:employees(id, first_name, last_name, email)
    `)
    .eq('id', requestId)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new time off request
 * @param {Object} requestData - Request data to insert
 * @returns {Promise<Object>} Created time off request
 */
export const createTimeOffRequest = async (requestData) => {
  const { data, error } = await supabase
    .from('time_off_requests')
    .insert(requestData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a time off request
 * @param {string} requestId - Request ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated time off request
 */
export const updateTimeOffRequest = async (requestId, updates) => {
  const { data, error } = await supabase
    .from('time_off_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Approve a time off request
 * @param {string} requestId - Request ID
 * @param {string} approvedBy - User ID of approver
 * @returns {Promise<Object>} Updated time off request
 */
export const approveTimeOffRequest = async (requestId, approvedBy) => {
  const { data, error } = await supabase
    .from('time_off_requests')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Deny a time off request
 * @param {string} requestId - Request ID
 * @param {string} denialReason - Reason for denial
 * @returns {Promise<Object>} Updated time off request
 */
export const denyTimeOffRequest = async (requestId, denialReason) => {
  const { data, error } = await supabase
    .from('time_off_requests')
    .update({
      status: 'denied',
      denial_reason: denialReason,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Cancel a time off request
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Updated time off request
 */
export const cancelTimeOffRequest = async (requestId) => {
  const { data, error } = await supabase
    .from('time_off_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a time off request
 * @param {string} requestId - Request ID
 * @returns {Promise<void>}
 */
export const deleteTimeOffRequest = async (requestId) => {
  const { error } = await supabase
    .from('time_off_requests')
    .delete()
    .eq('id', requestId)

  if (error) throw error
}

/**
 * Get upcoming time off for an employee
 * @param {string} employeeId - Employee ID
 * @param {number} days - Number of days to look ahead (default 90)
 * @returns {Promise<Array>} Array of upcoming time off requests
 */
export const getUpcomingTimeOff = async (employeeId, days = 90) => {
  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)
  const futureDateStr = futureDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('time_off_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .in('status', ['pending', 'approved'])
    .gte('start_date', today)
    .lte('start_date', futureDateStr)
    .order('start_date')

  if (error) throw error
  return data
}
