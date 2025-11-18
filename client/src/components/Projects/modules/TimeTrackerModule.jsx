import { useState, useEffect, useMemo } from 'react'
import { Clock, Users, Calendar, TrendingUp } from 'lucide-react'
import TimeTracker from '../TimeTracker'
import TimeEntriesList from '../TimeEntriesList'
import { Card } from '../../UI/Card'
import { api } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'

/**
 * Time Tracker Module
 * Enhanced with statistics for members and admin filtering
 */
const TimeTrackerModule = ({ projectId, payPeriodId }) => {
  const { user } = useAuth()
  const [timeEntries, setTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('member')
  const [filters, setFilters] = useState({
    employee: 'all',
    category: 'all',
    period: 'week' // day, week, month, total
  })

  // Fetch time entries
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch user's role in this project
        const membersResponse = await api.get(`/projects/${projectId}/members`)
        const currentMember = membersResponse.data.data?.find(m => m.user_id === user?.id)
        if (currentMember) {
          setUserRole(currentMember.role)
        }

        // Fetch time entries for the project (optionally filtered by pay period)
        let url = `/projects/${projectId}/time-entries`
        if (payPeriodId) {
          url = `/pay-periods/${payPeriodId}/entries`
        }
        const entriesResponse = await api.get(url)
        setTimeEntries(entriesResponse.data.data || [])
      } catch (err) {
        console.error('Error fetching time data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (projectId && user) {
      fetchData()
    }
  }, [projectId, user, payPeriodId])

  // Calculate time ranges
  const getDateRanges = () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    return { todayStart, weekStart, monthStart }
  }

  // Filter and calculate hours
  const calculateHours = (entries, startDate = null, workerFilter = null, categoryFilter = null) => {
    let filtered = entries.filter(entry => {
      if (!entry.end_time) return false // Skip active entries

      const entryDate = new Date(entry.start_time)

      // Get category name from nested structure
      const categoryName = entry.scope_item?.subcategory?.category?.name

      if (startDate && entryDate < startDate) return false
      if (workerFilter && workerFilter !== 'all' && entry.worker_name !== workerFilter) return false
      if (categoryFilter && categoryFilter !== 'all' && categoryName !== categoryFilter) return false

      return true
    })

    // Convert duration_minutes to hours
    return filtered.reduce((sum, entry) => sum + ((entry.duration_minutes || 0) / 60), 0)
  }

  // Get unique workers and categories
  const uniqueWorkers = useMemo(() => {
    const workers = new Set(timeEntries.map(e => e.worker_name).filter(Boolean))
    return Array.from(workers).sort()
  }, [timeEntries])

  const uniqueCategories = useMemo(() => {
    const categories = new Set(
      timeEntries
        .map(e => e.scope_item?.subcategory?.category?.name)
        .filter(Boolean)
    )
    return Array.from(categories).sort()
  }, [timeEntries])

  // Calculate stats based on role
  const stats = useMemo(() => {
    const { todayStart, weekStart, monthStart } = getDateRanges()
    const workerName = localStorage.getItem('workerName') || user?.email?.split('@')[0]

    if (userRole === 'member' || userRole === 'viewer') {
      // Members see their own stats
      const myEntries = timeEntries.filter(e => e.worker_name === workerName)

      return {
        today: calculateHours(myEntries, todayStart),
        week: calculateHours(myEntries, weekStart),
      }
    } else {
      // Managers/Admins see filtered stats
      const workerFilter = filters.employee
      const categoryFilter = filters.category

      let startDate = null
      if (filters.period === 'day') startDate = todayStart
      else if (filters.period === 'week') startDate = weekStart
      else if (filters.period === 'month') startDate = monthStart

      const hours = calculateHours(timeEntries, startDate, workerFilter, categoryFilter)

      return {
        filtered: hours,
        period: filters.period
      }
    }
  }, [timeEntries, userRole, filters, user])

  const isAdmin = userRole === 'admin' || userRole === 'owner'

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Module Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Time Tracker</h2>
        <p className="text-sm text-gray-600 mt-0.5">Track labor hours and manage time entries</p>
      </div>

      {/* Time Statistics */}
      {!loading && (
        <>
          {/* Member Stats */}
          {(userRole === 'member' || userRole === 'viewer') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Clock size={20} className="sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Today</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.today.toFixed(1)}h</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                    <Calendar size={20} className="sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">This Week</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.week.toFixed(1)}h</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Admin/Manager Stats with Filters */}
          {isAdmin && (
            <Card className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Time Analytics</h3>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TrendingUp size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.filtered.toFixed(1)}h</span>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  {/* Employee Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users size={16} className="inline mr-1" />
                      Employee
                    </label>
                    <select
                      value={filters.employee}
                      onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Employees</option>
                      {uniqueWorkers.map(worker => (
                        <option key={worker} value={worker}>{worker}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {uniqueCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Period Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Period
                    </label>
                    <select
                      value={filters.period}
                      onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="day">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="total">All Time</option>
                    </select>
                  </div>
                </div>

                {/* Summary Text */}
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  Showing{' '}
                  <span className="font-semibold">
                    {filters.period === 'day' ? "today's" :
                     filters.period === 'week' ? "this week's" :
                     filters.period === 'month' ? "this month's" : 'all'}
                  </span>
                  {' '}hours
                  {filters.employee !== 'all' && (
                    <> for <span className="font-semibold">{filters.employee}</span></>
                  )}
                  {filters.category !== 'all' && (
                    <> in <span className="font-semibold">{filters.category}</span></>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Time Tracker Component */}
      <TimeTracker projectId={projectId} />

      {/* Time Entries List with Manual Upload */}
      <div className="mt-6">
        <TimeEntriesList projectId={projectId} />
      </div>
    </div>
  )
}

export default TimeTrackerModule
