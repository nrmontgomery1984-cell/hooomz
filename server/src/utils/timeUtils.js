/**
 * Time utility functions for Hooomz Buildz time tracking
 */

/**
 * Round a timestamp to the nearest 15 minutes
 * @param {Date} datetime - The datetime to round
 * @returns {Date} - Rounded datetime
 *
 * Examples:
 * - 8:03 AM → 8:00 AM
 * - 8:08 AM → 8:15 AM
 * - 3:47 PM → 3:45 PM
 * - 3:53 PM → 4:00 PM
 */
export function roundToNearest15Minutes(datetime) {
  const date = new Date(datetime)
  const minutes = date.getMinutes()
  const roundedMinutes = Math.round(minutes / 15) * 15

  date.setSeconds(0)
  date.setMilliseconds(0)

  // Handle hour overflow (e.g., :53 rounds to :00 of next hour)
  if (roundedMinutes === 60) {
    date.setHours(date.getHours() + 1)
    date.setMinutes(0)
  } else {
    date.setMinutes(roundedMinutes)
  }

  return date
}

/**
 * Calculate the current pay period based on settings
 * @param {Date} today - Current date
 * @param {Object} settings - Payroll settings
 * @returns {Object} - { start: Date, end: Date }
 */
export function calculatePayPeriod(today, settings = null) {
  // Default settings if not provided
  const startDate = settings?.pay_period_start_date ? new Date(settings.pay_period_start_date) : new Date()
  const frequency = settings?.pay_period_frequency || 'bi_weekly'

  let daysInPeriod

  switch (frequency) {
    case 'weekly':
      daysInPeriod = 7
      break
    case 'bi_weekly':
      daysInPeriod = 14
      break
    case 'semi_monthly':
      return calculateSemiMonthlyPeriod(today)
    case 'monthly':
      return calculateMonthlyPeriod(today)
    default:
      daysInPeriod = 14
  }

  // Calculate how many periods have passed since start date
  const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
  const periodsPassed = Math.floor(daysSinceStart / daysInPeriod)

  // Calculate current period start
  const periodStart = new Date(startDate)
  periodStart.setDate(startDate.getDate() + (periodsPassed * daysInPeriod))

  // Calculate current period end
  const periodEnd = new Date(periodStart)
  periodEnd.setDate(periodStart.getDate() + daysInPeriod - 1)
  periodEnd.setHours(23, 59, 59, 999)

  return {
    start: periodStart.toISOString().split('T')[0], // Return as YYYY-MM-DD
    end: periodEnd.toISOString().split('T')[0]
  }
}

/**
 * Calculate semi-monthly pay period (1st-15th, 16th-end of month)
 * @param {Date} today - Current date
 * @returns {Object} - { start: Date, end: Date }
 */
function calculateSemiMonthlyPeriod(today) {
  const day = today.getDate()

  if (day <= 15) {
    // First half of month (1st-15th)
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth(), 15, 23, 59, 59, 999)

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  } else {
    // Second half of month (16th-end)
    const start = new Date(today.getFullYear(), today.getMonth(), 16)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999) // Last day of month

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }
}

/**
 * Calculate monthly pay period (1st to last day of month)
 * @param {Date} today - Current date
 * @returns {Object} - { start: Date, end: Date }
 */
function calculateMonthlyPeriod(today) {
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

/**
 * Format hours as HH:MM
 * @param {number} hours - Hours as decimal (e.g., 7.5)
 * @returns {string} - Formatted as "7:30"
 */
export function formatHours(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)

  return `${h}:${m.toString().padStart(2, '0')}`
}

/**
 * Calculate total hours between two timestamps, accounting for breaks
 * @param {string} startTime - ISO timestamp
 * @param {string} endTime - ISO timestamp
 * @param {number} breakMinutes - Break duration in minutes
 * @returns {number} - Total billable hours
 */
export function calculateTotalHours(startTime, endTime, breakMinutes = 0) {
  const start = new Date(startTime)
  const end = new Date(endTime)

  const durationMinutes = Math.round((end - start) / 60000)
  const billableMinutes = durationMinutes - breakMinutes

  return billableMinutes / 60
}

/**
 * Get week number for a date
 * @param {Date} date - The date
 * @returns {number} - Week number (1-52)
 */
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Group dates by week within a pay period
 * @param {string} periodStart - Start date YYYY-MM-DD
 * @param {string} periodEnd - End date YYYY-MM-DD
 * @returns {Array} - Array of week objects with start/end dates
 */
export function getWeeksInPeriod(periodStart, periodEnd) {
  const start = new Date(periodStart)
  const end = new Date(periodEnd)
  const weeks = []

  let currentWeekStart = new Date(start)

  while (currentWeekStart <= end) {
    // Calculate week end (6 days after start or period end, whichever is earlier)
    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)

    if (currentWeekEnd > end) {
      currentWeekEnd.setTime(end.getTime())
    }

    weeks.push({
      start: currentWeekStart.toISOString().split('T')[0],
      end: currentWeekEnd.toISOString().split('T')[0],
      label: `Week ${weeks.length + 1}`
    })

    // Move to next week
    currentWeekStart = new Date(currentWeekEnd)
    currentWeekStart.setDate(currentWeekStart.getDate() + 1)
  }

  return weeks
}

/**
 * Format date as "Mon 1/6"
 * @param {string} dateStr - Date string YYYY-MM-DD
 * @returns {string} - Formatted date
 */
export function formatShortDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00') // Force local timezone
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayName = days[date.getDay()]
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${dayName} ${month}/${day}`
}

/**
 * Check if a date is within a pay period
 * @param {Date} date - Date to check
 * @param {string} periodStart - Period start YYYY-MM-DD
 * @param {string} periodEnd - Period end YYYY-MM-DD
 * @returns {boolean} - True if date is in period
 */
export function isDateInPeriod(date, periodStart, periodEnd) {
  const d = new Date(date)
  const start = new Date(periodStart)
  const end = new Date(periodEnd)

  return d >= start && d <= end
}
