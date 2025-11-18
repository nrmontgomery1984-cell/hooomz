import supabase from '../utils/supabase.js'

/**
 * Get all expenses for a project
 * @param {string} projectId - Project UUID
 * @returns {Promise<Array>} Array of expenses
 */
export const getExpensesByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      creator:created_by (
        id,
        email
      ),
      approver:approved_by (
        id,
        email
      )
    `)
    .eq('project_id', projectId)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get all expenses across all projects
 * @returns {Promise<Array>} Array of all expenses with project details
 */
export const getAllExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      project:projects (
        id,
        name,
        client_name
      ),
      creator:created_by (
        id,
        email
      ),
      approver:approved_by (
        id,
        email
      )
    `)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single expense by ID
 * @param {string} expenseId - Expense UUID
 * @returns {Promise<Object>} Expense object
 */
export const getExpenseById = async (expenseId) => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      project:projects (
        id,
        name,
        client_name,
        address
      ),
      creator:created_by (
        id,
        email
      ),
      approver:approved_by (
        id,
        email
      )
    `)
    .eq('id', expenseId)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new expense
 * @param {Object} expenseData - Expense data
 * @returns {Promise<Object>} Created expense
 */
export const createExpense = async (expenseData) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expenseData])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an expense
 * @param {string} expenseId - Expense UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated expense
 */
export const updateExpense = async (expenseId, updates) => {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete an expense
 * @param {string} expenseId - Expense UUID
 * @returns {Promise<void>}
 */
export const deleteExpense = async (expenseId) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) throw error
}

/**
 * Get expense categories
 * @returns {Promise<Array>} Array of expense categories
 */
export const getExpenseCategories = async () => {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * Get expenses by date range
 * @param {string} projectId - Project UUID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of expenses
 */
export const getExpensesByDateRange = async (projectId, startDate, endDate) => {
  let query = supabase
    .from('expenses')
    .select(`
      *,
      creator:created_by (
        id,
        email
      ),
      approver:approved_by (
        id,
        email
      )
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (projectId && projectId !== 'all') {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get expenses by category
 * @param {string} projectId - Project UUID
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of expenses
 */
export const getExpensesByCategory = async (projectId, category) => {
  let query = supabase
    .from('expenses')
    .select(`
      *,
      creator:created_by (
        id,
        email
      )
    `)
    .eq('category', category)
    .order('date', { ascending: false })

  if (projectId && projectId !== 'all') {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get expense statistics for a project
 * @param {string} projectId - Project UUID or 'all'
 * @returns {Promise<Object>} Expense statistics
 */
export const getExpenseStats = async (projectId) => {
  let query = supabase
    .from('expenses')
    .select('amount, category, status, date')

  if (projectId && projectId !== 'all') {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) throw error

  // Calculate statistics
  const stats = {
    total: data.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
    count: data.length,
    byCategory: {},
    byStatus: {
      pending: 0,
      approved: 0,
      rejected: 0
    },
    byMonth: {}
  }

  data.forEach(expense => {
    // By category
    const cat = expense.category || 'Uncategorized'
    if (!stats.byCategory[cat]) {
      stats.byCategory[cat] = { count: 0, total: 0 }
    }
    stats.byCategory[cat].count++
    stats.byCategory[cat].total += parseFloat(expense.amount || 0)

    // By status
    stats.byStatus[expense.status] = (stats.byStatus[expense.status] || 0) + 1

    // By month
    const month = expense.date.substring(0, 7) // YYYY-MM
    if (!stats.byMonth[month]) {
      stats.byMonth[month] = 0
    }
    stats.byMonth[month] += parseFloat(expense.amount || 0)
  })

  return stats
}

/**
 * Approve an expense
 * @param {string} expenseId - Expense UUID
 * @param {string} userId - Approver user ID
 * @returns {Promise<Object>} Updated expense
 */
export const approveExpense = async (expenseId, userId) => {
  return updateExpense(expenseId, {
    status: 'approved',
    approved_by: userId,
    approved_at: new Date().toISOString()
  })
}

/**
 * Reject an expense
 * @param {string} expenseId - Expense UUID
 * @param {string} userId - Rejector user ID
 * @param {string} notes - Rejection notes
 * @returns {Promise<Object>} Updated expense
 */
export const rejectExpense = async (expenseId, userId, notes) => {
  return updateExpense(expenseId, {
    status: 'rejected',
    approved_by: userId,
    approved_at: new Date().toISOString(),
    notes: notes
  })
}

/**
 * Update OCR data for an expense
 * @param {string} expenseId - Expense UUID
 * @param {Object} ocrData - OCR extracted data
 * @param {number} confidence - OCR confidence score
 * @returns {Promise<Object>} Updated expense
 */
export const updateExpenseOCR = async (expenseId, ocrData, confidence) => {
  return updateExpense(expenseId, {
    ocr_data: ocrData,
    ocr_confidence: confidence,
    ocr_processed: true
  })
}
