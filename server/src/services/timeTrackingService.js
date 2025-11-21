import supabase from '../utils/supabase.js'
import { roundToNearest15Minutes, calculatePayPeriod } from '../utils/timeUtils.js'

/**
 * Clock in to start tracking time
 */
export const clockIn = async ({ employee_id, project_id, category_id, sub_category_id }) => {
  // Check if employee already has an active entry
  const { data: existingActive } = await supabase
    .from('time_entries')
    .select('*')
    .eq('employee_id', employee_id)
    .is('end_time', null)
    .single()

  if (existingActive) {
    throw new Error('Employee already has an active time entry. Please clock out first.')
  }

  // Get employee details
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('first_name, last_name, hourly_rate, charged_rate')
    .eq('id', employee_id)
    .single()

  if (empError || !employee) {
    throw new Error('Employee not found')
  }

  // Get category details to get phase_id
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*, phase:phases(id, name), project:projects(id, name)')
    .eq('id', category_id)
    .single()

  if (catError || !category) {
    throw new Error('Category not found')
  }

  // Get sub-category name if provided
  let subCategoryName = null
  if (sub_category_id) {
    const { data: subCat } = await supabase
      .from('sub_categories')
      .select('name')
      .eq('id', sub_category_id)
      .single()

    subCategoryName = subCat?.name
  }

  // Get current pay period
  const payPeriod = await getCurrentPayPeriod()

  const now = new Date().toISOString()
  const roundedTime = roundToNearest15Minutes(new Date())

  // Create time entry
  const workerName = `${employee.first_name} ${employee.last_name}`

  const { data: timeEntry, error } = await supabase
    .from('time_entries')
    .insert({
      employee_id,
      worker_name: workerName,
      project_id,
      phase_id: category.phase_id,
      category_id,
      sub_category_id,
      start_time: now,
      clock_in_time_rounded: roundedTime.toISOString(),
      break_duration: 0,
      on_break: false,
      pay_period_start: payPeriod.start,
      pay_period_end: payPeriod.end,
      approval_status: 'draft'
    })
    .select()
    .single()

  if (error) throw error

  return {
    time_entry_id: timeEntry.id,
    clock_in_time: timeEntry.start_time,
    clock_in_time_rounded: timeEntry.clock_in_time_rounded,
    project_name: category.project.name,
    category_name: category.name,
    sub_category_name: subCategoryName,
    phase_name: category.phase.name
  }
}

/**
 * Clock out to stop tracking time
 */
export const clockOut = async (timeEntryId, notes = null) => {
  // Get the time entry
  const { data: entry, error: fetchError } = await supabase
    .from('time_entries')
    .select(`
      *,
      category:categories(name, project:projects(name)),
      sub_category:sub_categories(name)
    `)
    .eq('id', timeEntryId)
    .single()

  if (fetchError || !entry) {
    throw new Error('Time entry not found')
  }

  if (entry.end_time) {
    throw new Error('Time entry is already clocked out')
  }

  const now = new Date().toISOString()
  const roundedEndTime = roundToNearest15Minutes(new Date())

  const startTime = new Date(entry.start_time)
  const endTime = new Date(now)

  // Calculate duration in hours
  const durationMinutes = Math.round((endTime - startTime) / 60000)
  const totalHours = (durationMinutes - entry.break_duration) / 60

  // Update the time entry
  const { data: updatedEntry, error: updateError } = await supabase
    .from('time_entries')
    .update({
      end_time: now,
      clock_out_time_rounded: roundedEndTime.toISOString(),
      duration_minutes: durationMinutes,
      total_hours: totalHours,
      notes,
      on_break: false,
      break_start_time: null
    })
    .eq('id', timeEntryId)
    .select()
    .single()

  if (updateError) throw updateError

  return {
    time_entry_id: updatedEntry.id,
    clock_out_time: updatedEntry.end_time,
    clock_out_time_rounded: updatedEntry.clock_out_time_rounded,
    total_hours: updatedEntry.total_hours,
    break_duration: updatedEntry.break_duration,
    summary: {
      project: entry.category.project.name,
      category: entry.category.name,
      sub_category: entry.sub_category?.name,
      hours: updatedEntry.total_hours
    }
  }
}

/**
 * Pause for an unpaid break
 */
export const pauseBreak = async (timeEntryId) => {
  const { data: entry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', timeEntryId)
    .single()

  if (!entry) {
    throw new Error('Time entry not found')
  }

  if (entry.on_break) {
    throw new Error('Already on break')
  }

  if (entry.end_time) {
    throw new Error('Cannot start break on completed time entry')
  }

  const now = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('time_entries')
    .update({
      on_break: true,
      break_start_time: now
    })
    .eq('id', timeEntryId)
    .select()
    .single()

  if (error) throw error

  return {
    time_entry_id: updated.id,
    break_started_at: updated.break_start_time,
    status: 'on_break'
  }
}

/**
 * Resume work after a break
 */
export const resumeFromBreak = async (timeEntryId) => {
  const { data: entry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', timeEntryId)
    .single()

  if (!entry) {
    throw new Error('Time entry not found')
  }

  if (!entry.on_break) {
    throw new Error('Not currently on break')
  }

  const now = new Date()
  const breakStart = new Date(entry.break_start_time)
  const breakMinutes = Math.round((now - breakStart) / 60000)

  const totalBreakDuration = entry.break_duration + breakMinutes

  const { data: updated, error } = await supabase
    .from('time_entries')
    .update({
      on_break: false,
      break_start_time: null,
      break_duration: totalBreakDuration
    })
    .eq('id', timeEntryId)
    .select()
    .single()

  if (error) throw error

  return {
    time_entry_id: updated.id,
    break_duration: totalBreakDuration,
    resumed_at: now.toISOString(),
    status: 'active'
  }
}

/**
 * Switch to a different category (auto clock-out old, clock-in new)
 */
export const switchCategory = async (currentTimeEntryId, { new_category_id, new_sub_category_id }) => {
  // Get current entry
  const { data: currentEntry } = await supabase
    .from('time_entries')
    .select('*, category:categories(name), employee:employees(id)')
    .eq('id', currentTimeEntryId)
    .single()

  if (!currentEntry) {
    throw new Error('Time entry not found')
  }

  // Clock out current entry
  const completedEntry = await clockOut(currentTimeEntryId, 'Auto-clocked out for category switch')

  // Clock in to new category
  const newEntry = await clockIn({
    employee_id: currentEntry.employee.id,
    project_id: currentEntry.project_id,
    category_id: new_category_id,
    sub_category_id: new_sub_category_id
  })

  return {
    completed_entry: {
      time_entry_id: completedEntry.time_entry_id,
      category: currentEntry.category.name,
      hours: completedEntry.total_hours,
      auto_clocked_out: completedEntry.clock_out_time
    },
    new_entry: {
      time_entry_id: newEntry.time_entry_id,
      category: newEntry.category_name,
      clocked_in: newEntry.clock_in_time
    }
  }
}

/**
 * Get all active (running) time entries
 */
export const getActiveTimeEntries = async () => {
  const { data: entries, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      employee:employees(id, first_name, last_name),
      project:projects(id, name),
      phase:phases(name),
      category:categories(name),
      sub_category:sub_categories(name)
    `)
    .is('end_time', null)
    .order('start_time', { ascending: true })

  if (error) throw error

  // Calculate hours elapsed for each entry
  const now = new Date()
  return entries.map(entry => {
    const startTime = new Date(entry.start_time)
    const elapsedMs = now - startTime
    const elapsedHours = elapsedMs / (1000 * 60 * 60)

    return {
      time_entry_id: entry.id,
      user: {
        id: entry.employee.id,
        name: `${entry.employee.first_name} ${entry.employee.last_name}`
      },
      project: {
        id: entry.project.id,
        name: entry.project.name
      },
      phase: entry.phase.name,
      category: entry.category.name,
      sub_category: entry.sub_category?.name,
      clock_in_time: entry.clock_in_time_rounded || entry.start_time,
      hours_elapsed: parseFloat(elapsedHours.toFixed(2)),
      on_break: entry.on_break
    }
  })
}

/**
 * Get active time entry for a specific employee
 */
export const getActiveTimeEntryForEmployee = async (employeeId) => {
  const { data: entry, error } = await supabase
    .from('time_entries')
    .select(`
      *,
      project:projects(id, name),
      phase:phases(name),
      category:categories(name),
      sub_category:sub_categories(name)
    `)
    .eq('employee_id', employeeId)
    .is('end_time', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  const now = new Date()
  const startTime = new Date(entry.start_time)
  const elapsedMs = now - startTime
  const elapsedHours = elapsedMs / (1000 * 60 * 60)

  return {
    time_entry_id: entry.id,
    project: {
      id: entry.project.id,
      name: entry.project.name
    },
    phase: entry.phase.name,
    category: entry.category.name,
    sub_category: entry.sub_category?.name,
    clock_in_time: entry.clock_in_time_rounded || entry.start_time,
    hours_elapsed: parseFloat(elapsedHours.toFixed(2)),
    on_break: entry.on_break
  }
}

/**
 * Edit a time entry (manager only)
 */
export const editTimeEntry = async (timeEntryId, updates) => {
  const { data: entry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', timeEntryId)
    .single()

  if (!entry) {
    throw new Error('Time entry not found')
  }

  const changes = []
  const updateData = {
    edited_by: updates.edited_by,
    edited_at: new Date().toISOString(),
    edit_notes: updates.edit_notes
  }

  if (updates.clock_in_time) {
    const oldTime = new Date(entry.start_time).toLocaleTimeString()
    const newTime = new Date(updates.clock_in_time).toLocaleTimeString()
    changes.push(`clock_in_time: ${oldTime} → ${newTime}`)
    updateData.start_time = updates.clock_in_time
    updateData.clock_in_time_rounded = roundToNearest15Minutes(new Date(updates.clock_in_time)).toISOString()
  }

  if (updates.clock_out_time) {
    const oldTime = entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : 'null'
    const newTime = new Date(updates.clock_out_time).toLocaleTimeString()
    changes.push(`clock_out_time: ${oldTime} → ${newTime}`)
    updateData.end_time = updates.clock_out_time
    updateData.clock_out_time_rounded = roundToNearest15Minutes(new Date(updates.clock_out_time)).toISOString()
  }

  if (updates.project_id) {
    updateData.project_id = updates.project_id
  }

  if (updates.category_id) {
    // Get phase from category
    const { data: category } = await supabase
      .from('categories')
      .select('phase_id')
      .eq('id', updates.category_id)
      .single()

    updateData.category_id = updates.category_id
    updateData.phase_id = category.phase_id
  }

  if (updates.sub_category_id) {
    updateData.sub_category_id = updates.sub_category_id
  }

  // Recalculate total_hours if times changed
  if (updateData.start_time || updateData.end_time) {
    const startTime = new Date(updateData.start_time || entry.start_time)
    const endTime = new Date(updateData.end_time || entry.end_time)
    const durationMinutes = Math.round((endTime - startTime) / 60000)
    updateData.duration_minutes = durationMinutes
    updateData.total_hours = (durationMinutes - entry.break_duration) / 60
  }

  const { data: updated, error } = await supabase
    .from('time_entries')
    .update(updateData)
    .eq('id', timeEntryId)
    .select()
    .single()

  if (error) throw error

  // Get editor name
  const { data: editor } = await supabase
    .from('auth.users')
    .select('email')
    .eq('id', updates.edited_by)
    .single()

  return {
    time_entry: updated,
    audit: {
      edited_by: editor?.email || 'Unknown',
      edited_at: updated.edited_at,
      changes
    }
  }
}

/**
 * Get dashboard view of active projects
 */
export const getActiveDashboard = async () => {
  // Get all active projects
  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('status', 'active')
    .order('name')

  if (projError) throw projError

  const dashboardProjects = []

  for (const project of projects) {
    // Get active crew for this project
    const activeCrew = await getActiveTimeEntries()
    const projectCrew = activeCrew.filter(entry => entry.project.id === project.id)

    // Get budget status for this project
    const budgetStatus = await getProjectBudgetSummary(project.id)

    dashboardProjects.push({
      project_id: project.id,
      project_name: project.name,
      active_crew: projectCrew,
      budget_status: budgetStatus
    })
  }

  return {
    projects: dashboardProjects,
    last_updated: new Date().toISOString()
  }
}

/**
 * Get budget summary for a project
 */
const getProjectBudgetSummary = async (projectId) => {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('project_id', projectId)

  if (error) throw error

  const budgetSummary = []

  for (const category of categories) {
    const budgetStatus = await calculateCategoryBudget(category.id)
    budgetSummary.push(budgetStatus)
  }

  return budgetSummary
}

/**
 * Calculate budget status for a category
 */
const calculateCategoryBudget = async (categoryId) => {
  const { data: category } = await supabase
    .from('categories')
    .select('*, assigned_crew')
    .eq('id', categoryId)
    .single()

  if (!category) {
    throw new Error('Category not found')
  }

  // Get all time entries for this category
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('*, employee:employees(charged_rate)')
    .eq('category_id', categoryId)
    .not('end_time', 'is', null)

  const hoursSpent = timeEntries?.reduce((sum, entry) => sum + (entry.total_hours || 0), 0) || 0

  // Calculate hours budgeted from labor budget and crew charged rates
  let hoursBudgeted = 0
  if (category.assigned_crew && category.assigned_crew.length > 0) {
    const { data: crew } = await supabase
      .from('employees')
      .select('charged_rate')
      .in('id', category.assigned_crew)

    const avgChargedRate = crew.reduce((sum, emp) => sum + (emp.charged_rate || 0), 0) / crew.length
    if (avgChargedRate > 0) {
      hoursBudgeted = category.labor_budget_dollars / avgChargedRate
    }
  }

  const percentUsed = hoursBudgeted > 0 ? (hoursSpent / hoursBudgeted) * 100 : 0

  let status = 'on_track'
  if (percentUsed >= 100) {
    status = 'over_budget'
  } else if (percentUsed >= 75) {
    status = 'monitor'
  }

  return {
    category_id: category.id,
    category_name: category.name,
    hours_budgeted: parseFloat(hoursBudgeted.toFixed(2)),
    hours_spent: parseFloat(hoursSpent.toFixed(2)),
    percent_used: parseFloat(percentUsed.toFixed(1)),
    status
  }
}

/**
 * Get detailed budget breakdown for a project
 */
export const getBudgetDetail = async (projectId) => {
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) {
    throw new Error('Project not found')
  }

  const { data: phases } = await supabase
    .from('phases')
    .select('*')
    .order('order_index')

  const phaseDetails = []

  for (const phase of phases) {
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('project_id', projectId)
      .eq('phase_id', phase.id)

    if (categories && categories.length > 0) {
      const categoryDetails = []

      for (const category of categories) {
        const budgetStatus = await calculateDetailedCategoryBudget(category.id)
        categoryDetails.push(budgetStatus)
      }

      phaseDetails.push({
        phase_id: phase.id,
        phase_name: phase.name,
        categories: categoryDetails
      })
    }
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      total_budget: project.budget
    },
    phases: phaseDetails
  }
}

/**
 * Calculate detailed budget for a category (including sub-categories and crew breakdown)
 */
const calculateDetailedCategoryBudget = async (categoryId) => {
  // ... This would include full budget calculations with sub-categories and crew breakdown
  // Similar to calculateCategoryBudget but with more details
  return await calculateCategoryBudget(categoryId)
}

/**
 * Get current pay period from settings
 */
const getCurrentPayPeriod = async () => {
  const { data } = await supabase
    .rpc('get_current_pay_period')

  if (data && data.length > 0) {
    return {
      start: data[0].period_start,
      end: data[0].period_end
    }
  }

  // Fallback if function doesn't work
  return calculatePayPeriod(new Date())
}

/**
 * Get payroll settings
 */
export const getPayrollSettings = async () => {
  const { data: settings } = await supabase
    .from('payroll_settings')
    .select('*')
    .single()

  const currentPeriod = await getCurrentPayPeriod()
  const previousPeriod = calculatePreviousPeriod(currentPeriod, settings.pay_period_frequency)
  const nextPeriod = calculateNextPeriod(currentPeriod, settings.pay_period_frequency)

  return {
    pay_period_start_date: settings.pay_period_start_date,
    pay_period_frequency: settings.pay_period_frequency,
    current_period: currentPeriod,
    previous_period: previousPeriod,
    next_period: nextPeriod
  }
}

/**
 * Update payroll settings
 */
export const updatePayrollSettings = async ({ pay_period_start_date, pay_period_frequency }) => {
  const { data, error } = await supabase
    .from('payroll_settings')
    .update({
      pay_period_start_date,
      pay_period_frequency
    })
    .select()
    .single()

  if (error) throw error

  return {
    message: 'Payroll settings updated',
    settings: data
  }
}

/**
 * Get payroll report for a specific pay period
 */
export const getPayrollReport = async (periodStart, periodEnd) => {
  // Get all employees who worked during this period
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select(`
      *,
      employee:employees(id, first_name, last_name, hourly_rate),
      project:projects(name),
      category:categories(name),
      sub_category:sub_categories(name)
    `)
    .gte('start_time', periodStart)
    .lte('start_time', periodEnd)
    .not('end_time', 'is', null)
    .order('start_time')

  // Group by employee
  const employeeMap = new Map()

  for (const entry of timeEntries || []) {
    const empId = entry.employee.id
    if (!employeeMap.has(empId)) {
      employeeMap.set(empId, {
        user_id: empId,
        name: `${entry.employee.first_name} ${entry.employee.last_name}`,
        hourly_wage: entry.employee.hourly_rate,
        entries: [],
        approval_status: entry.approval_status
      })
    }

    employeeMap.get(empId).entries.push(entry)
  }

  // Format for payroll report
  const employees = Array.from(employeeMap.values()).map(emp => {
    // Group entries by week
    const weeks = groupEntriesByWeek(emp.entries, periodStart, periodEnd)

    const totalHours = emp.entries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
    const grossPay = totalHours * emp.hourly_wage

    return {
      ...emp,
      weeks,
      period_totals: {
        total_hours: parseFloat(totalHours.toFixed(2)),
        regular_hours: parseFloat(totalHours.toFixed(2)),
        overtime_hours: 0,
        gross_pay: parseFloat(grossPay.toFixed(2))
      }
    }
  })

  const grandTotals = employees.reduce((totals, emp) => ({
    total_hours: totals.total_hours + emp.period_totals.total_hours,
    total_payroll: totals.total_payroll + emp.period_totals.gross_pay
  }), { total_hours: 0, total_payroll: 0 })

  return {
    period: {
      start: periodStart,
      end: periodEnd
    },
    employees,
    grand_totals: {
      total_hours: parseFloat(grandTotals.total_hours.toFixed(2)),
      total_payroll: parseFloat(grandTotals.total_payroll.toFixed(2))
    }
  }
}

/**
 * Group time entries by week
 */
const groupEntriesByWeek = (entries, periodStart, periodEnd) => {
  // Implementation for grouping entries by week
  // Returns array of weeks with days
  return []
}

/**
 * Approve payroll for a period
 */
export const approvePayroll = async ({ period_start, period_end, employee_ids, approved_by }) => {
  let query = supabase
    .from('time_entries')
    .update({
      approval_status: 'approved',
      approved_by,
      approved_at: new Date().toISOString()
    })
    .gte('start_time', period_start)
    .lte('start_time', period_end)

  if (employee_ids !== 'all') {
    query = query.in('employee_id', employee_ids)
  }

  const { data, error } = await query.select()

  if (error) throw error

  const { data: approver } = await supabase
    .from('auth.users')
    .select('email')
    .eq('id', approved_by)
    .single()

  return {
    message: `Payroll approved for ${employee_ids === 'all' ? 'all' : employee_ids.length} employees`,
    approved_entries: data.length,
    approved_at: new Date().toISOString(),
    approved_by: approver?.email || 'Unknown'
  }
}

/**
 * Log an activity
 */
export const logActivity = async (activityData) => {
  const { data, error } = await supabase
    .from('activity_log')
    .insert(activityData)
    .select()
    .single()

  if (error) throw error

  return {
    activity_log_id: data.id,
    message: 'Activity logged successfully'
  }
}

/**
 * Get activity log for a project
 */
export const getActivityLog = async (projectId) => {
  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      *,
      created_by_user:auth.users!created_by(email)
    `)
    .eq('project_id', projectId)
    .order('activity_date', { ascending: false })

  if (error) throw error

  return data.map(activity => ({
    id: activity.id,
    activity_type: activity.activity_type,
    trade_partner_name: activity.trade_partner_name,
    activity_date: activity.activity_date,
    description: activity.description,
    created_by: activity.created_by_user?.email || 'Unknown',
    created_at: activity.created_at
  }))
}

/**
 * Get all categories for a project
 */
export const getProjectCategories = async (projectId) => {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      phase:phases(id, name),
      sub_categories(*)
    `)
    .eq('project_id', projectId)
    .order('phase_id')

  if (error) throw error

  return data
}

/**
 * Create a new category
 */
export const createCategory = async (categoryData) => {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Create a new sub-category
 */
export const createSubCategory = async (subCategoryData) => {
  const { data, error } = await supabase
    .from('sub_categories')
    .insert(subCategoryData)
    .select()
    .single()

  if (error) throw error

  return data
}

// Helper functions
const calculatePreviousPeriod = (currentPeriod, frequency) => {
  // Calculate previous period based on frequency
  return { start: null, end: null }
}

const calculateNextPeriod = (currentPeriod, frequency) => {
  // Calculate next period based on frequency
  return { start: null, end: null }
}
