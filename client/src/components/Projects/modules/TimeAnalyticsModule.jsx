import { useState, useEffect, useMemo } from 'react'
import { Calendar, BarChart3, Download, Filter, Clock, Users, Briefcase, TrendingUp, Grid, List, X } from 'lucide-react'
import { Card } from '../../UI/Card'
import { Button } from '../../UI/Button'
import { api } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  addMonths,
  subMonths
} from 'date-fns'

/**
 * Time Analytics Module
 * Comprehensive reporting with charts, calendar view, and export functionality
 */
const TimeAnalyticsModule = ({ projectId }) => {
  const { user } = useAuth()
  const [timeEntries, setTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('charts') // 'charts' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedDayEntries, setSelectedDayEntries] = useState(null)
  const [showDayModal, setShowDayModal] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    employee: 'all',
    category: 'all',
    dateRange: 'month', // week, month, custom
    startDate: null,
    endDate: null
  })

  // Fetch time entries
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // If projectId is null or 'all', fetch all time entries
        const endpoint = (!projectId || projectId === 'all')
          ? '/time-entries/all'
          : `/projects/${projectId}/time-entries`
        const response = await api.get(endpoint)
        setTimeEntries(response.data.data || [])
      } catch (err) {
        console.error('Error fetching time data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId])

  // Get unique employees and categories
  const employees = useMemo(() => {
    const workers = new Set(timeEntries.map(e => e.worker_name).filter(Boolean))
    return Array.from(workers).sort()
  }, [timeEntries])

  const categories = useMemo(() => {
    const cats = new Set(
      timeEntries
        .map(e => e.scope_item?.subcategory?.category?.name)
        .filter(Boolean)
    )
    return Array.from(cats).sort()
  }, [timeEntries])

  // Filter entries based on current filters
  const filteredEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      if (!entry.end_time) return false // Skip active entries

      const entryDate = parseISO(entry.start_time)
      const categoryName = entry.scope_item?.subcategory?.category?.name

      // Employee filter
      if (filters.employee !== 'all' && entry.worker_name !== filters.employee) {
        return false
      }

      // Category filter
      if (filters.category !== 'all' && categoryName !== filters.category) {
        return false
      }

      // Date range filter
      if (filters.dateRange === 'week') {
        const weekStart = startOfWeek(selectedDate)
        const weekEnd = endOfWeek(selectedDate)
        if (entryDate < weekStart || entryDate > weekEnd) return false
      } else if (filters.dateRange === 'month') {
        const monthStart = startOfMonth(selectedDate)
        const monthEnd = endOfMonth(selectedDate)
        if (entryDate < monthStart || entryDate > monthEnd) return false
      } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
        if (entryDate < filters.startDate || entryDate > filters.endDate) return false
      }

      return true
    })
  }, [timeEntries, filters, selectedDate])

  // Calculate hours by employee
  const hoursByEmployee = useMemo(() => {
    const byEmployee = {}
    filteredEntries.forEach(entry => {
      const name = entry.worker_name || 'Unknown'
      if (!byEmployee[name]) byEmployee[name] = 0
      byEmployee[name] += (entry.duration_minutes || 0) / 60
    })
    return Object.entries(byEmployee)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
  }, [filteredEntries])

  // Calculate hours by category
  const hoursByCategory = useMemo(() => {
    const byCategory = {}
    filteredEntries.forEach(entry => {
      const cat = entry.scope_item?.subcategory?.category?.name || 'Uncategorized'
      if (!byCategory[cat]) byCategory[cat] = 0
      byCategory[cat] += (entry.duration_minutes || 0) / 60
    })
    return Object.entries(byCategory)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
  }, [filteredEntries])

  // Calculate hours by day for calendar view - use ALL entries, not just filtered
  const hoursByDay = useMemo(() => {
    const byDay = {}
    // Use timeEntries directly to show all calendar data
    timeEntries.forEach(entry => {
      if (!entry.end_time) return // Skip active entries

      const day = format(parseISO(entry.start_time), 'yyyy-MM-dd')
      if (!byDay[day]) byDay[day] = { hours: 0, entries: [] }
      byDay[day].hours += (entry.duration_minutes || 0) / 60
      byDay[day].entries.push(entry)
    })
    return byDay
  }, [timeEntries])

  // Total hours
  const totalHours = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => {
      return sum + ((entry.duration_minutes || 0) / 60)
    }, 0)
  }, [filteredEntries])

  // Get unique projects (for all-projects mode)
  const projects = useMemo(() => {
    const projs = new Set(
      timeEntries
        .map(e => e.scope_item?.subcategory?.category?.project?.name)
        .filter(Boolean)
    )
    return Array.from(projs).sort()
  }, [timeEntries])

  // Export to CSV
  const exportToCSV = () => {
    const headers = projectId === 'all' || !projectId
      ? ['Date', 'Project', 'Employee', 'Category', 'Task', 'Hours', 'Notes']
      : ['Date', 'Employee', 'Category', 'Task', 'Hours', 'Notes']

    const rows = filteredEntries.map(entry => {
      const baseRow = [
        format(parseISO(entry.start_time), 'yyyy-MM-dd HH:mm'),
        entry.worker_name || '',
        entry.scope_item?.subcategory?.category?.name || '',
        entry.scope_item?.description || '',
        ((entry.duration_minutes || 0) / 60).toFixed(2),
        entry.notes || ''
      ]

      if (projectId === 'all' || !projectId) {
        // Insert project name as second column
        baseRow.splice(1, 0, entry.scope_item?.subcategory?.category?.project?.name || '')
      }

      return baseRow
    })

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  // Calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  const maxHours = Math.max(...hoursByEmployee.map(e => e.hours), 1)
  const maxCategoryHours = Math.max(...hoursByCategory.map(c => c.hours), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Time Analytics & Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive time tracking insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'charts' ? 'primary' : 'outline'}
            onClick={() => setViewMode('charts')}
          >
            <BarChart3 size={20} className="mr-2" />
            Charts
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar size={20} className="mr-2" />
            Calendar
          </Button>
          <Button variant="secondary" onClick={exportToCSV}>
            <Download size={20} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Employee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users size={16} className="inline mr-1" />
              Employee
            </label>
            <select
              value={filters.employee}
              onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Briefcase size={16} className="inline mr-1" />
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Period
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Month Navigation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Navigate
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
                className="flex-1"
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
                className="flex-1"
              >
                Next →
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="text-2xl font-bold text-gray-900">{hoursByEmployee.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Briefcase size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{hoursByCategory.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Entries</p>
              <p className="text-2xl font-bold text-gray-900">{filteredEntries.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts View */}
      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hours by Employee */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Hours by Employee
            </h3>
            <div className="space-y-3">
              {hoursByEmployee.map(({ name, hours }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                    <span className="text-sm font-semibold text-gray-900">{hours.toFixed(1)}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${(hours / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {hoursByEmployee.length === 0 && (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </Card>

          {/* Hours by Category */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-purple-600" />
              Hours by Category
            </h3>
            <div className="space-y-3">
              {hoursByCategory.map(({ name, hours }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                    <span className="text-sm font-semibold text-gray-900">{hours.toFixed(1)}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${(hours / maxCategoryHours) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {hoursByCategory.length === 0 && (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              {format(selectedDate, 'MMMM yyyy')}
            </h3>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayData = hoursByDay[dayKey]
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={dayKey}
                  onClick={() => {
                    if (dayData && dayData.entries.length > 0) {
                      setSelectedDayEntries({ date: day, ...dayData })
                      setShowDayModal(true)
                    }
                  }}
                  className={`
                    min-h-24 p-2 border rounded-lg transition-all
                    ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${dayData ? 'bg-green-50 cursor-pointer hover:bg-green-100 hover:shadow-md' : 'bg-white'}
                  `}
                >
                  <div className="text-sm font-medium text-gray-700">
                    {format(day, 'd')}
                  </div>
                  {dayData && (
                    <div className="mt-1">
                      <div className="text-xs font-semibold text-green-700">
                        {dayData.hours.toFixed(1)}h
                      </div>
                      <div className="text-xs text-gray-600">
                        {dayData.entries.length} {dayData.entries.length === 1 ? 'entry' : 'entries'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Day Entries Modal */}
      {showDayModal && selectedDayEntries && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {format(selectedDayEntries.date, 'MMMM d, yyyy')}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {selectedDayEntries.hours.toFixed(2)} hours • {selectedDayEntries.entries.length} {selectedDayEntries.entries.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
              <button
                onClick={() => setShowDayModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Entries List */}
            <div className="p-6 space-y-4">
              {selectedDayEntries.entries.map((entry, index) => (
                <Card key={entry.id || index} className="p-4">
                  <div className="space-y-2">
                    {/* Time and Employee */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-600" />
                        <span className="font-semibold text-gray-900">
                          {format(parseISO(entry.start_time), 'h:mm a')} - {format(parseISO(entry.end_time), 'h:mm a')}
                        </span>
                        <span className="text-sm text-gray-600">
                          ({((entry.duration_minutes || 0) / 60).toFixed(2)}h)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.lunch_deducted && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            Lunch -30min
                          </span>
                        )}
                        {entry.approved_by_manager && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Approved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Employee Name */}
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-700">{entry.worker_name || 'Unknown'}</span>
                    </div>

                    {/* Project (if in all-projects mode) */}
                    {(!projectId || projectId === 'all') && entry.scope_item?.subcategory?.category?.project && (
                      <div className="text-sm">
                        <span className="text-gray-600">Project: </span>
                        <span className="font-medium text-gray-900">
                          {entry.scope_item.subcategory.category.project.name}
                        </span>
                      </div>
                    )}

                    {/* Category and Task */}
                    <div className="text-sm">
                      <span className="text-gray-600">Category: </span>
                      <span className="font-medium text-gray-900">
                        {entry.scope_item?.subcategory?.category?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Task: </span>
                      <span className="text-gray-900">
                        {entry.scope_item?.description || 'N/A'}
                      </span>
                    </div>

                    {/* Notes */}
                    {entry.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <span className="font-medium">Notes: </span>
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeAnalyticsModule
