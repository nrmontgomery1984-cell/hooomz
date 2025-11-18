import { api } from './api'

/**
 * Expense API Service
 * Handles all expense-related API calls
 */

// Get all expenses across all projects
export const getAllExpenses = async () => {
  const response = await api.get('/expenses/all')
  return response.data.data
}

// Get expenses for a specific project
export const getExpensesByProject = async (projectId) => {
  const response = await api.get(`/expenses/project/${projectId}`)
  return response.data.data
}

// Get expense categories
export const getExpenseCategories = async () => {
  const response = await api.get('/expenses/categories')
  return response.data.data
}

// Get expense statistics
export const getExpenseStats = async (projectId = 'all') => {
  const response = await api.get('/expenses/stats', {
    params: { projectId }
  })
  return response.data.data
}

// Get expenses by date range
export const getExpensesByDateRange = async (projectId, startDate, endDate) => {
  const response = await api.get('/expenses/date-range', {
    params: { projectId, startDate, endDate }
  })
  return response.data.data
}

// Get expenses by category
export const getExpensesByCategory = async (category, projectId = 'all') => {
  const response = await api.get(`/expenses/category/${category}`, {
    params: { projectId }
  })
  return response.data.data
}

// Get single expense
export const getExpenseById = async (expenseId) => {
  const response = await api.get(`/expenses/${expenseId}`)
  return response.data.data
}

// Create new expense
export const createExpense = async (expenseData) => {
  const response = await api.post('/expenses', expenseData)
  return response.data.data
}

// Update expense
export const updateExpense = async (expenseId, updates) => {
  const response = await api.put(`/expenses/${expenseId}`, updates)
  return response.data.data
}

// Delete expense
export const deleteExpense = async (expenseId) => {
  const response = await api.delete(`/expenses/${expenseId}`)
  return response.data
}

// Approve expense
export const approveExpense = async (expenseId) => {
  const response = await api.post(`/expenses/${expenseId}/approve`)
  return response.data.data
}

// Reject expense
export const rejectExpense = async (expenseId, notes) => {
  const response = await api.post(`/expenses/${expenseId}/reject`, { notes })
  return response.data.data
}

// Update OCR data
export const updateExpenseOCR = async (expenseId, ocrData, confidence) => {
  const response = await api.post(`/expenses/${expenseId}/ocr`, { ocrData, confidence })
  return response.data.data
}
