import express from 'express'
import * as payPeriodsRepo from '../repositories/payPeriodsRepo.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Get all pay periods
router.get('/', async (req, res) => {
  try {
    const payPeriods = await payPeriodsRepo.getAllPayPeriods()
    res.json({ data: payPeriods })
  } catch (error) {
    console.error('Error fetching pay periods:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get current active pay period
router.get('/current', async (req, res) => {
  try {
    const currentPeriod = await payPeriodsRepo.getCurrentPayPeriod()
    res.json({ data: currentPeriod })
  } catch (error) {
    console.error('Error fetching current pay period:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get a single pay period by ID
router.get('/:periodId', async (req, res) => {
  try {
    const { periodId } = req.params
    const payPeriod = await payPeriodsRepo.getPayPeriodById(periodId)
    res.json({ data: payPeriod })
  } catch (error) {
    console.error('Error fetching pay period:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get time entries for a pay period
router.get('/:periodId/entries', async (req, res) => {
  try {
    const { periodId } = req.params
    const entries = await payPeriodsRepo.getTimeEntriesForPayPeriod(periodId)
    res.json({ data: entries })
  } catch (error) {
    console.error('Error fetching time entries for pay period:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new pay period
router.post('/', async (req, res) => {
  try {
    const periodData = {
      ...req.body,
      created_by: req.user.id
    }

    const payPeriod = await payPeriodsRepo.createPayPeriod(periodData)
    res.status(201).json({ data: payPeriod })
  } catch (error) {
    console.error('Error creating pay period:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update a pay period
router.put('/:periodId', async (req, res) => {
  try {
    const { periodId } = req.params
    const payPeriod = await payPeriodsRepo.updatePayPeriod(periodId, req.body)
    res.json({ data: payPeriod })
  } catch (error) {
    console.error('Error updating pay period:', error)
    res.status(500).json({ error: error.message })
  }
})

// Close a pay period
router.post('/:periodId/close', async (req, res) => {
  try {
    const { periodId } = req.params
    const payPeriod = await payPeriodsRepo.closePayPeriod(periodId)
    res.json({ data: payPeriod })
  } catch (error) {
    console.error('Error closing pay period:', error)
    res.status(500).json({ error: error.message })
  }
})

// Reopen a pay period
router.post('/:periodId/reopen', async (req, res) => {
  try {
    const { periodId } = req.params
    const payPeriod = await payPeriodsRepo.reopenPayPeriod(periodId)
    res.json({ data: payPeriod })
  } catch (error) {
    console.error('Error reopening pay period:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete a pay period
router.delete('/:periodId', async (req, res) => {
  try {
    const { periodId } = req.params
    await payPeriodsRepo.deletePayPeriod(periodId)
    res.json({ message: 'Pay period deleted successfully' })
  } catch (error) {
    console.error('Error deleting pay period:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
