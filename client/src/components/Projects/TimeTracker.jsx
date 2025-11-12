import { useState, useEffect } from 'react'
import { Card } from '../UI/Card'
import { Button } from '../UI/Button'
import { Play, Square, Clock, Plus, Briefcase } from 'lucide-react'
import { useTimeTracking } from '../../hooks/useProjects'
import * as projectsApi from '../../services/projectsApi'
import { api } from '../../services/api'

/**
 * TimeTracker Component
 * Hierarchical category/subcategory/task selection with quick task creation
 */
const TimeTracker = ({ projectId: initialProjectId }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '')
  const [projects, setProjects] = useState([])
  const [workerName, setWorkerName] = useState(localStorage.getItem('workerName') || '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [projectScope, setProjectScope] = useState(null)
  const [notes, setNotes] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [newWorkerName, setNewWorkerName] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [workersList, setWorkersList] = useState(() => {
    const saved = localStorage.getItem('workersList')
    return saved ? JSON.parse(saved) : ['Nathan', 'Nishant']
  })

  // Use the selected project ID for time tracking
  const { activeEntry, startTimer, stopTimer, checkActiveEntry } = useTimeTracking(selectedProjectId)

  // Load all projects for the dropdown
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await api.get('/projects')
        setProjects(response.data.data || [])
      } catch (err) {
        console.error('Error loading projects:', err)
      }
    }
    loadProjects()
  }, [])

  // Update selected project when initialProjectId changes
  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId)
    }
  }, [initialProjectId])

  // Load project scope with hierarchy
  useEffect(() => {
    const loadProjectScope = async () => {
      try {
        const response = await api.get(`/projects/${selectedProjectId}/scope`)
        setProjectScope(response.data.data)
        // Reset selections when project changes
        setSelectedCategory('')
        setSelectedSubcategory('')
        setSelectedItemId('')
      } catch (err) {
        console.error('Error loading project scope:', err)
        setProjectScope(null)
      }
    }

    if (selectedProjectId) {
      loadProjectScope()
    } else {
      // Clear project scope when no project is selected
      setProjectScope(null)
      setSelectedCategory('')
      setSelectedSubcategory('')
      setSelectedItemId('')
    }
  }, [selectedProjectId])

  // Check for active entry on mount
  useEffect(() => {
    if (workerName) {
      checkActiveEntry(workerName)
    }
  }, [workerName, checkActiveEntry])

  // Update elapsed time for active entry
  useEffect(() => {
    if (!activeEntry) {
      setElapsedTime(0)
      return
    }

    const startTime = new Date(activeEntry.start_time)

    const updateElapsed = () => {
      const now = new Date()
      const diff = Math.floor((now - startTime) / 1000) // seconds
      setElapsedTime(diff)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [activeEntry])

  const handleStartTimer = async () => {
    if (!selectedProjectId) {
      alert('Please select a project')
      return
    }

    if (!workerName.trim()) {
      alert('Please enter your name')
      return
    }

    if (!selectedCategory) {
      alert('Please select at least a category')
      return
    }

    try {
      localStorage.setItem('workerName', workerName)

      let itemId = selectedItemId

      // If no specific task selected, create a generic one
      if (!itemId) {
        // Determine the description based on what's selected
        const category = categories.find(c => c.id === selectedCategory)
        const subcategory = selectedSubcategory
          ? subcategories.find(s => s.id === selectedSubcategory)
          : null

        let description = category?.name || 'General work'
        if (subcategory) {
          description = `${category.name} - ${subcategory.name}`
        }

        // Need a subcategory to create a task, so use the first one if not selected
        const targetSubcategoryId = selectedSubcategory || subcategories[0]?.id

        if (!targetSubcategoryId) {
          alert('This category has no subcategories. Please add a subcategory first.')
          return
        }

        // Create a generic task
        const newTask = await projectsApi.createScopeItem(targetSubcategoryId, {
          description: `${description} - ${workerName}`,
          status: 'in_progress'
        })

        itemId = newTask.id

        // Reload project scope
        const response = await api.get(`/projects/${projectId}/scope`)
        setProjectScope(response.data.data)
      }

      await startTimer(itemId, workerName, notes)
      setNotes('')
      setSelectedCategory('')
      setSelectedSubcategory('')
      setSelectedItemId('')
    } catch (err) {
      console.error('Error starting timer:', err)
      alert('Failed to start timer')
    }
  }

  const handleStopTimer = async () => {
    if (!activeEntry) return

    try {
      await stopTimer(activeEntry.id)
      setElapsedTime(0)
      // Reload project scope to get updated hours
      const response = await api.get(`/projects/${projectId}/scope`)
      setProjectScope(response.data.data)
    } catch (err) {
      console.error('Error stopping timer:', err)
      alert('Failed to stop timer')
    }
  }

  const handleAddWorker = () => {
    if (!newWorkerName.trim()) {
      alert('Please enter a worker name')
      return
    }

    if (workersList.includes(newWorkerName.trim())) {
      alert('This worker already exists')
      return
    }

    const updatedList = [...workersList, newWorkerName.trim()]
    setWorkersList(updatedList)
    localStorage.setItem('workersList', JSON.stringify(updatedList))
    setWorkerName(newWorkerName.trim())
    setNewWorkerName('')
    setShowAddWorker(false)
  }

  const handleAddTask = async () => {
    if (!selectedSubcategory) {
      alert('Please select a category and subcategory first')
      return
    }

    if (!newTaskDescription.trim()) {
      alert('Please enter a task description')
      return
    }

    try {
      await projectsApi.createScopeItem(selectedSubcategory, {
        description: newTaskDescription.trim(),
        status: 'pending'
      })

      // Reload project scope
      const response = await api.get(`/projects/${projectId}/scope`)
      setProjectScope(response.data.data)

      setNewTaskDescription('')
      setShowAddTask(false)
      alert('Task created successfully!')
    } catch (err) {
      console.error('Error creating task:', err)
      alert('Failed to create task')
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get available categories - only show categories that have tasks
  const categories = (projectScope?.categories || []).filter(cat => {
    // Check if this category has any subcategories with tasks
    return cat.subcategories?.some(sub => sub.items && sub.items.length > 0)
  })

  // Get subcategories for selected category - only show subcategories that have tasks
  const subcategories = selectedCategory
    ? (categories.find(c => c.id === selectedCategory)?.subcategories || []).filter(sub => sub.items && sub.items.length > 0)
    : []

  // Get tasks for selected subcategory
  const tasks = selectedSubcategory
    ? subcategories.find(s => s.id === selectedSubcategory)?.items || []
    : []

  return (
    <Card className="bg-gradient-to-r from-primary-50 to-blue-50">
      <div className="flex items-center space-x-2 mb-4">
        <Clock size={24} className="text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Time Tracker</h3>
      </div>

      {activeEntry ? (
        /* Active Timer Display */
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border-2 border-primary-300">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-primary-600 mb-2">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-sm text-gray-600 mb-1">
                <strong>{activeEntry.worker_name}</strong> working on:
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {activeEntry.scope_item?.description || 'Task'}
              </p>
              {activeEntry.notes && (
                <p className="text-xs text-gray-500 mt-2">{activeEntry.notes}</p>
              )}
            </div>
          </div>

          <Button
            variant="danger"
            className="w-full"
            onClick={handleStopTimer}
          >
            <Square size={20} className="mr-2" />
            Stop Timer
          </Button>
        </div>
      ) : (
        /* Start Timer Form */
        <div className="space-y-4">
          {/* Project Selection - Only show if not already in a project context */}
          {!initialProjectId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Briefcase size={16} className="inline mr-1" />
                Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Select project --</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Worker Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            {!showAddWorker ? (
              <div className="space-y-2">
                <select
                  value={workerName}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowAddWorker(true)
                    } else {
                      setWorkerName(e.target.value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select your name --</option>
                  {workersList.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="__add_new__">+ Add New Worker</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Enter new worker name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleAddWorker}
                    className="flex-1"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddWorker(false)
                      setNewWorkerName('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Category Selection */}
          {selectedProjectId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSelectedSubcategory('')
                  setSelectedItemId('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!projectScope}
              >
                <option value="">-- Select category --</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {!projectScope && (
                <p className="text-xs text-gray-500 mt-1">Loading categories...</p>
              )}
            </div>
          )}

          {/* Subcategory Selection */}
          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => {
                  setSelectedSubcategory(e.target.value)
                  setSelectedItemId('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Select subcategory --</option>
                {subcategories.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Task Selection */}
          {selectedSubcategory && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Task
                </label>
                <button
                  onClick={() => setShowAddTask(!showAddTask)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add New Task
                </button>
              </div>

              {showAddTask && (
                <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="text"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Enter task description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleAddTask}
                      className="flex-1 text-sm"
                    >
                      Create Task
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddTask(false)
                        setNewTaskDescription('')
                      }}
                      className="flex-1 text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Select task --</option>
                {tasks
                  .filter(item => item.status !== 'completed' && item.status !== 'cancelled')
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.description}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this work session..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
            />
          </div>

          {/* Start Button */}
          <Button
            variant="primary"
            className="w-full"
            onClick={handleStartTimer}
            disabled={!selectedCategory || !workerName}
          >
            <Play size={20} className="mr-2" />
            Start Timer
          </Button>
        </div>
      )}
    </Card>
  )
}

export default TimeTracker
