import express from 'express'
import * as timeTrackingService from '../services/timeTrackingService.js'

const router = express.Router()

// =====================================================
// TIME ENTRY ENDPOINTS
// =====================================================

/**
 * POST /api/time-tracking/clock-in
 * Clock in to start tracking time
 */
router.post('/clock-in', async (req, res) => {
  try {
    const { employee_id, project_id, category_id, sub_category_id } = req.body

    if (!employee_id || !project_id || !category_id) {
      return res.status(400).json({
        error: 'employee_id, project_id, and category_id are required'
      })
    }

    const result = await timeTrackingService.clockIn({
      employee_id,
      project_id,
      category_id,
      sub_category_id
    })

    res.status(201).json(result)
  } catch (error) {
    console.error('Clock in error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/time-tracking/:id/clock-out
 * Clock out to stop tracking time
 */
router.post('/:id/clock-out', async (req, res) => {
  try {
    const { id } = req.params
    const { notes } = req.body

    const result = await timeTrackingService.clockOut(id, notes)

    res.json(result)
  } catch (error) {
    console.error('Clock out error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/time-tracking/:id/pause-break
 * Pause for an unpaid break
 */
router.post('/:id/pause-break', async (req, res) => {
  try {
    const { id } = req.params

    const result = await timeTrackingService.pauseBreak(id)

    res.json(result)
  } catch (error) {
    console.error('Pause break error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/time-tracking/:id/resume-from-break
 * Resume work after a break
 */
router.post('/:id/resume-from-break', async (req, res) => {
  try {
    const { id } = req.params

    const result = await timeTrackingService.resumeFromBreak(id)

    res.json(result)
  } catch (error) {
    console.error('Resume from break error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/time-tracking/:id/switch-category
 * Switch to a different category (auto clock-out old, clock-in new)
 */
router.post('/:id/switch-category', async (req, res) => {
  try {
    const { id } = req.params
    const { new_category_id, new_sub_category_id } = req.body

    if (!new_category_id) {
      return res.status(400).json({ error: 'new_category_id is required' })
    }

    const result = await timeTrackingService.switchCategory(id, {
      new_category_id,
      new_sub_category_id
    })

    res.json(result)
  } catch (error) {
    console.error('Switch category error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/time-tracking/active
 * Get all active (running) time entries
 */
router.get('/active', async (req, res) => {
  try {
    const activeEntries = await timeTrackingService.getActiveTimeEntries()

    res.json({ active_entries: activeEntries })
  } catch (error) {
    console.error('Get active entries error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/time-tracking/active/:employeeId
 * Get active time entry for a specific employee
 */
router.get('/active/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params

    const activeEntry = await timeTrackingService.getActiveTimeEntryForEmployee(employeeId)

    res.json(activeEntry)
  } catch (error) {
    console.error('Get active entry error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/time-tracking/:id
 * Edit a time entry (manager only)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      clock_in_time,
      clock_out_time,
      project_id,
      category_id,
      sub_category_id,
      edit_notes,
      edited_by
    } = req.body

    if (!edited_by) {
      return res.status(400).json({ error: 'edited_by is required' })
    }

    const result = await timeTrackingService.editTimeEntry(id, {
      clock_in_time,
      clock_out_time,
      project_id,
      category_id,
      sub_category_id,
      edit_notes,
      edited_by
    })

    res.json(result)
  } catch (error) {
    console.error('Edit time entry error:', error)
    res.status(500).json({ error: error.message })
  }
})

// =====================================================
// DASHBOARD ENDPOINTS
// =====================================================

/**
 * GET /api/time-tracking/dashboard/active-projects
 * Get dashboard view of active projects with crew and budget status
 */
router.get('/dashboard/active-projects', async (req, res) => {
  try {
    const dashboard = await timeTrackingService.getActiveDashboard()

    res.json(dashboard)
  } catch (error) {
    console.error('Get dashboard error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/time-tracking/dashboard/budget-detail/:projectId
 * Get detailed budget breakdown for a project
 */
router.get('/dashboard/budget-detail/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params

    const budgetDetail = await timeTrackingService.getBudgetDetail(projectId)

    res.json(budgetDetail)
  } catch (error) {
    console.error('Get budget detail error:', error)
    res.status(500).json({ error: error.message })
  }
})

// =====================================================
// PAYROLL ENDPOINTS
// =====================================================

/**
 * GET /api/time-tracking/payroll/settings
 * Get payroll settings and current pay period
 */
router.get('/payroll/settings', async (req, res) => {
  try {
    const settings = await timeTrackingService.getPayrollSettings()

    res.json(settings)
  } catch (error) {
    console.error('Get payroll settings error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/time-tracking/payroll/settings
 * Update payroll settings
 */
router.put('/payroll/settings', async (req, res) => {
  try {
    const { pay_period_start_date, pay_period_frequency } = req.body

    if (!pay_period_start_date || !pay_period_frequency) {
      return res.status(400).json({
        error: 'pay_period_start_date and pay_period_frequency are required'
      })
    }

    const result = await timeTrackingService.updatePayrollSettings({
      pay_period_start_date,
      pay_period_frequency
    })

    res.json(result)
  } catch (error) {
    console.error('Update payroll settings error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/time-tracking/payroll/report
 * Get payroll report for a specific pay period
 */
router.get('/payroll/report', async (req, res) => {
  try {
    const { period_start, period_end } = req.query

    if (!period_start || !period_end) {
      return res.status(400).json({
        error: 'period_start and period_end query parameters are required'
      })
    }

    const report = await timeTrackingService.getPayrollReport(period_start, period_end)

    res.json(report)
  } catch (error) {
    console.error('Get payroll report error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/time-tracking/payroll/approve
 * Approve payroll for a specific pay period
 */
router.post('/payroll/approve', async (req, res) => {
  try {
    const { period_start, period_end, employee_ids, approved_by } = req.body

    if (!period_start || !period_end || !approved_by) {
      return res.status(400).json({
        error: 'period_start, period_end, and approved_by are required'
      })
    }

    const result = await timeTrackingService.approvePayroll({
      period_start,
      period_end,
      employee_ids,
      approved_by
    })

    res.json(result)
  } catch (error) {
    console.error('Approve payroll error:', error)
    res.status(500).json({ error: error.message })
  }
})

// =====================================================
// ACTIVITY LOG ENDPOINTS
// =====================================================

/**
 * POST /api/time-tracking/activity-log
 * Log an activity (e.g., trade partner on site)
 */
router.post('/activity-log', async (req, res) => {
  try {
    const {
      project_id,
      activity_type,
      trade_partner_id,
      trade_partner_name,
      activity_date,
      description,
      created_by
    } = req.body

    if (!project_id || !activity_type || !created_by) {
      return res.status(400).json({
        error: 'project_id, activity_type, and created_by are required'
      })
    }

    const result = await timeTrackingService.logActivity({
      project_id,
      activity_type,
      trade_partner_id,
      trade_partner_name,
      activity_date,
      description,
      created_by
    })

    res.status(201).json(result)
  } catch (error) {
    console.error('Log activity error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/time-tracking/activity-log/:projectId
 * Get activity log for a project
 */
router.get('/activity-log/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params

    const activities = await timeTrackingService.getActivityLog(projectId)

    res.json({ activities })
  } catch (error) {
    console.error('Get activity log error:', error)
    res.status(500).json({ error: error.message })
  }
})

// =====================================================
// CATEGORIES ENDPOINTS
// =====================================================

/**
 * GET /api/time-tracking/projects/:projectId/categories
 * Get all categories for a project
 */
router.get('/projects/:projectId/categories', async (req, res) => {
  try {
    const { projectId } = req.params

    const categories = await timeTrackingService.getProjectCategories(projectId)

    res.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/time-tracking/categories
 * Create a new category
 */
router.post('/categories', async (req, res) => {
  try {
    const categoryData = req.body

    const category = await timeTrackingService.createCategory(categoryData)

    res.status(201).json(category)
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/time-tracking/sub-categories
 * Create a new sub-category
 */
router.post('/sub-categories', async (req, res) => {
  try {
    const subCategoryData = req.body

    const subCategory = await timeTrackingService.createSubCategory(subCategoryData)

    res.status(201).json(subCategory)
  } catch (error) {
    console.error('Create sub-category error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
