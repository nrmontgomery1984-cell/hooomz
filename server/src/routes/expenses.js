import express from 'express'
import * as expensesRepo from '../repositories/expensesRepo.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Debug middleware
router.use((req, res, next) => {
  console.log(`[EXPENSES ROUTER] ${req.method} ${req.originalUrl}`, 'params:', req.params)
  next()
})

// ==================== EXPENSE CATEGORIES ====================

// Get all expense categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await expensesRepo.getExpenseCategories()
    res.json({ data: categories })
  } catch (error) {
    console.error('Error fetching expense categories:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== EXPENSES (Must come BEFORE /:expenseId) ====================

// Get all expenses across all projects
router.get('/all', async (req, res) => {
  try {
    const expenses = await expensesRepo.getAllExpenses()
    res.json({ data: expenses })
  } catch (error) {
    console.error('Error fetching all expenses:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get expense statistics
router.get('/stats', async (req, res) => {
  try {
    const { projectId } = req.query
    const stats = await expensesRepo.getExpenseStats(projectId || 'all')
    res.json({ data: stats })
  } catch (error) {
    console.error('Error fetching expense stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get expenses by project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const expenses = await expensesRepo.getExpensesByProject(projectId)
    res.json({ data: expenses })
  } catch (error) {
    console.error('Error fetching project expenses:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get expenses by date range
router.get('/date-range', async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }

    const expenses = await expensesRepo.getExpensesByDateRange(
      projectId || 'all',
      startDate,
      endDate
    )
    res.json({ data: expenses })
  } catch (error) {
    console.error('Error fetching expenses by date range:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get expenses by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params
    const { projectId } = req.query
    const expenses = await expensesRepo.getExpensesByCategory(
      projectId || 'all',
      category
    )
    res.json({ data: expenses })
  } catch (error) {
    console.error('Error fetching expenses by category:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new expense
router.post('/', async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      created_by: req.user.id
    }

    const expense = await expensesRepo.createExpense(expenseData)
    res.status(201).json({ data: expense })
  } catch (error) {
    console.error('Error creating expense:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get a single expense by ID
router.get('/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params
    const expense = await expensesRepo.getExpenseById(expenseId)
    res.json({ data: expense })
  } catch (error) {
    console.error('Error fetching expense:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update an expense
router.put('/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params
    const expense = await expensesRepo.updateExpense(expenseId, req.body)
    res.json({ data: expense })
  } catch (error) {
    console.error('Error updating expense:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete an expense
router.delete('/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params
    await expensesRepo.deleteExpense(expenseId)
    res.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    res.status(500).json({ error: error.message })
  }
})

// Approve an expense
router.post('/:expenseId/approve', async (req, res) => {
  try {
    const { expenseId } = req.params
    const expense = await expensesRepo.approveExpense(expenseId, req.user.id)
    res.json({ data: expense })
  } catch (error) {
    console.error('Error approving expense:', error)
    res.status(500).json({ error: error.message })
  }
})

// Reject an expense
router.post('/:expenseId/reject', async (req, res) => {
  try {
    const { expenseId } = req.params
    const { notes } = req.body
    const expense = await expensesRepo.rejectExpense(expenseId, req.user.id, notes)
    res.json({ data: expense })
  } catch (error) {
    console.error('Error rejecting expense:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update OCR data for an expense
router.post('/:expenseId/ocr', async (req, res) => {
  try {
    const { expenseId } = req.params
    const { ocrData, confidence } = req.body
    const expense = await expensesRepo.updateExpenseOCR(expenseId, ocrData, confidence)
    res.json({ data: expense })
  } catch (error) {
    console.error('Error updating OCR data:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
