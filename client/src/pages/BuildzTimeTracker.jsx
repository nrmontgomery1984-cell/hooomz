import { useState, useEffect } from 'react'
import { Clock, Play, Square, Coffee, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '../components/UI/Button'
import ModernCard from '../components/UI/ModernCard'

/**
 * Buildz Time Tracker - Site Team Clock In/Out Screen
 * Simple, mobile-friendly interface for construction workers
 */
const BuildzTimeTracker = () => {
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [activeEntry, setActiveEntry] = useState(null)
  const [onBreak, setOnBreak] = useState(false)

  // Load employees and projects on mount
  useEffect(() => {
    loadEmployees()
    loadProjects()
  }, [])

  // Load categories when project changes
  useEffect(() => {
    if (selectedProject) {
      loadCategories(selectedProject)
    }
  }, [selectedProject])

  const loadEmployees = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/employees')
      const data = await response.json()
      setEmployees(data.data || [])
    } catch (error) {
      console.error('Failed to load employees:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/projects')
      const data = await response.json()
      const activeProjects = (data.data || []).filter(p => p.status === 'active')
      setProjects(activeProjects)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load projects:', error)
      setLoading(false)
    }
  }

  const loadCategories = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/time-tracking/projects/${projectId}/categories`)
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleClockIn = async () => {
    if (!selectedEmployee || !selectedProject || !selectedCategory) {
      alert('Please select employee, project, and category')
      return
    }

    try {
      const response = await fetch('http://localhost:8080/api/time-tracking/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmployee,
          project_id: selectedProject,
          category_id: selectedCategory
        })
      })

      const data = await response.json()
      setActiveEntry({
        ...data,
        employee: employees.find(e => e.id === selectedEmployee)
      })
      alert(`Clocked in successfully at ${new Date(data.clock_in_time_rounded).toLocaleTimeString()}`)
    } catch (error) {
      console.error('Clock in failed:', error)
      alert('Failed to clock in. Please try again.')
    }
  }

  const handleClockOut = async () => {
    if (!activeEntry) return

    try {
      const response = await fetch(`http://localhost:8080/api/time-tracking/${activeEntry.time_entry_id}/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()
      alert(`Clocked out successfully!\nHours worked: ${data.time_entry.hours_worked}`)
      setActiveEntry(null)
      setOnBreak(false)
    } catch (error) {
      console.error('Clock out failed:', error)
      alert('Failed to clock out. Please try again.')
    }
  }

  const handleStartBreak = async () => {
    if (!activeEntry) return

    try {
      await fetch(`http://localhost:8080/api/time-tracking/${activeEntry.time_entry_id}/break/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      setOnBreak(true)
      alert('Break started')
    } catch (error) {
      console.error('Start break failed:', error)
      alert('Failed to start break')
    }
  }

  const handleEndBreak = async () => {
    if (!activeEntry) return

    try {
      await fetch(`http://localhost:8080/api/time-tracking/${activeEntry.time_entry_id}/break/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      setOnBreak(false)
      alert('Break ended')
    } catch (error) {
      console.error('End break failed:', error)
      alert('Failed to end break')
    }
  }

  const handleSwitchCategory = async (newCategoryId) => {
    if (!activeEntry) return

    try {
      const response = await fetch(`http://localhost:8080/api/time-tracking/${activeEntry.time_entry_id}/switch-category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_category_id: newCategoryId })
      })

      const data = await response.json()
      setActiveEntry({
        ...data.new_entry,
        employee: activeEntry.employee
      })
      setSelectedCategory(newCategoryId)
      alert(`Switched to new category`)
    } catch (error) {
      console.error('Switch category failed:', error)
      alert('Failed to switch category')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full shadow-lg mb-4">
            <Clock className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Buildz Time Tracker</h1>
          <p className="text-gray-600 text-lg">Quick clock in/out for site teams</p>
        </div>

        {/* Active Status Card */}
        {activeEntry && (
          <ModernCard className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-bold text-gray-900">Currently Clocked In</span>
                </div>
                {onBreak && (
                  <span className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded-lg text-sm font-semibold">
                    On Break
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-gray-700"><strong>Employee:</strong> {activeEntry.employee?.first_name} {activeEntry.employee?.last_name}</p>
                <p className="text-gray-700"><strong>Project:</strong> {activeEntry.project_name}</p>
                <p className="text-gray-700"><strong>Category:</strong> {activeEntry.category_name}</p>
                <p className="text-gray-700"><strong>Phase:</strong> {activeEntry.phase_name}</p>
                <p className="text-gray-700"><strong>Started:</strong> {new Date(activeEntry.clock_in_time).toLocaleString()}</p>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Clock In Form */}
        {!activeEntry && (
          <ModernCard className="mb-6">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Clock In</h2>

              <div className="space-y-4">
                {/* Employee Select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Employee
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  >
                    <option value="">Choose employee...</option>
                    {employees.filter(e => e.is_active).map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Project
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  >
                    <option value="">Choose project...</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Select */}
                {selectedProject && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Task Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    >
                      <option value="">Choose category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.phase.name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  onClick={handleClockIn}
                  className="w-full py-4 text-xl font-bold bg-green-600 hover:bg-green-700 flex items-center justify-center gap-3"
                  disabled={!selectedEmployee || !selectedProject || !selectedCategory}
                >
                  <Play size={24} />
                  Clock In
                </Button>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Actions when clocked in */}
        {activeEntry && (
          <div className="space-y-4">
            {/* Switch Category */}
            <ModernCard className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Switch Task</h3>
              <select
                value={selectedCategory}
                onChange={(e) => handleSwitchCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.phase.name})
                  </option>
                ))}
              </select>
            </ModernCard>

            {/* Break Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {!onBreak ? (
                <Button
                  onClick={handleStartBreak}
                  variant="outline"
                  className="py-4 text-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Coffee size={20} />
                  Start Break
                </Button>
              ) : (
                <Button
                  onClick={handleEndBreak}
                  className="py-4 text-lg font-semibold bg-yellow-600 hover:bg-yellow-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  End Break
                </Button>
              )}

              <Button
                onClick={handleClockOut}
                className="py-4 text-lg font-semibold bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Square size={20} />
                Clock Out
              </Button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Time is automatically rounded to the nearest 15 minutes</p>
          <p className="mt-2">For issues, contact your project manager</p>
        </div>
      </div>
    </div>
  )
}

export default BuildzTimeTracker
