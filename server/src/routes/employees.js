import express from 'express'
import * as employeesRepo from '../repositories/employeesRepo.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[EMPLOYEES ROUTER] ${req.method} ${req.originalUrl}`)
  next()
})

// ==================== EMPLOYEES ====================

// Get all employees
router.get('/', async (req, res) => {
  try {
    const { activeOnly } = req.query
    const employees = await employeesRepo.getEmployees(activeOnly === 'true')
    res.json({ data: employees })
  } catch (error) {
    console.error('Error fetching employees:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single employee
router.get('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params
    const employee = await employeesRepo.getEmployeeById(employeeId)
    res.json({ data: employee })
  } catch (error) {
    console.error('Error fetching employee:', error)
    res.status(404).json({ error: error.message })
  }
})

// Create employee
router.post('/', async (req, res) => {
  try {
    const employee = await employeesRepo.createEmployee(req.body)
    res.status(201).json({ data: employee })
  } catch (error) {
    console.error('Error creating employee:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update employee
router.put('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params
    const employee = await employeesRepo.updateEmployee(employeeId, req.body)
    res.json({ data: employee })
  } catch (error) {
    console.error('Error updating employee:', error)
    res.status(500).json({ error: error.message })
  }
})

// Soft delete employee
router.delete('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params
    await employeesRepo.softDeleteEmployee(employeeId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== TIME OFF REQUESTS ====================

// Get all time off requests (with optional filters)
router.get('/:employeeId/time-off', async (req, res) => {
  try {
    const { employeeId } = req.params
    const requests = await employeesRepo.getTimeOffRequestsByEmployee(employeeId)
    res.json({ data: requests })
  } catch (error) {
    console.error('Error fetching time off requests:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get upcoming time off for employee
router.get('/:employeeId/time-off/upcoming', async (req, res) => {
  try {
    const { employeeId } = req.params
    const { days } = req.query
    const requests = await employeesRepo.getUpcomingTimeOff(employeeId, days ? parseInt(days) : 90)
    res.json({ data: requests })
  } catch (error) {
    console.error('Error fetching upcoming time off:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create time off request
router.post('/:employeeId/time-off', async (req, res) => {
  try {
    const { employeeId } = req.params
    const request = await employeesRepo.createTimeOffRequest({
      ...req.body,
      employee_id: employeeId
    })
    res.status(201).json({ data: request })
  } catch (error) {
    console.error('Error creating time off request:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update time off request
router.put('/:employeeId/time-off/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params
    const request = await employeesRepo.updateTimeOffRequest(requestId, req.body)
    res.json({ data: request })
  } catch (error) {
    console.error('Error updating time off request:', error)
    res.status(500).json({ error: error.message })
  }
})

// Approve time off request
router.post('/:employeeId/time-off/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params
    const approvedBy = req.user?.id
    const request = await employeesRepo.approveTimeOffRequest(requestId, approvedBy)
    res.json({ data: request })
  } catch (error) {
    console.error('Error approving time off request:', error)
    res.status(500).json({ error: error.message })
  }
})

// Deny time off request
router.post('/:employeeId/time-off/:requestId/deny', async (req, res) => {
  try {
    const { requestId } = req.params
    const { reason } = req.body
    const request = await employeesRepo.denyTimeOffRequest(requestId, reason)
    res.json({ data: request })
  } catch (error) {
    console.error('Error denying time off request:', error)
    res.status(500).json({ error: error.message })
  }
})

// Cancel time off request
router.post('/:employeeId/time-off/:requestId/cancel', async (req, res) => {
  try {
    const { requestId } = req.params
    const request = await employeesRepo.cancelTimeOffRequest(requestId)
    res.json({ data: request })
  } catch (error) {
    console.error('Error cancelling time off request:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete time off request
router.delete('/:employeeId/time-off/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params
    await employeesRepo.deleteTimeOffRequest(requestId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting time off request:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
