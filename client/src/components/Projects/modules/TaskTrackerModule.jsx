import { useMemo, useState, useEffect } from 'react'
import { CheckSquare, Plus, Filter, X, Eye, EyeOff, Search, Edit2, Check, X as XIcon } from 'lucide-react'
import ModernCard from '../../UI/ModernCard'
import FilterBar from '../../UI/FilterBar'
import TaskDetailDialog from '../TaskDetailDialog'
import AddTaskDialog from '../AddTaskDialog'
import { Button } from '../../UI/Button'

/**
 * Task Tracker Module
 * Wrapper for the existing task management functionality with advanced filtering
 */
const TaskTrackerModule = ({ projectId, filteredProject, updateScopeItem }) => {
  const [selectedTask, setSelectedTask] = useState(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false)
  const [hideCompleted, setHideCompleted] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('taskTracker_hideCompleted')
    return saved === 'true'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    assignee: '',
    dueDate: '',
    duration: '',
    location: '',
    search: ''
  })
  const [editingTask, setEditingTask] = useState(null)
  const [editedDescription, setEditedDescription] = useState('')
  const [editedSubcategoryId, setEditedSubcategoryId] = useState('')

  // Save hideCompleted preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('taskTracker_hideCompleted', hideCompleted.toString())
  }, [hideCompleted])

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await updateScopeItem(itemId, { status: newStatus })
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const startEditing = (item) => {
    setEditingTask(item.id)
    setEditedDescription(item.description)
    setEditedSubcategoryId(item.subcategory_id)
  }

  const cancelEditing = () => {
    setEditingTask(null)
    setEditedDescription('')
    setEditedSubcategoryId('')
  }

  const saveEditing = async (itemId) => {
    try {
      if (!editedDescription.trim()) {
        alert('Task description cannot be empty')
        return
      }
      const updates = {
        description: editedDescription.trim(),
        subcategory_id: editedSubcategoryId
      }
      await updateScopeItem(itemId, updates)
      cancelEditing()
      // The real-time subscription will automatically update the UI
    } catch (err) {
      console.error('Error updating task:', err)
      alert('Failed to update task: ' + (err.message || 'Unknown error'))
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckSquare size={20} className="text-green-600" />
      case 'in_progress':
        return <CheckSquare size={20} className="text-blue-600" />
      default:
        return <CheckSquare size={20} className="text-gray-400" />
    }
  }

  // Get all subcategories for editing dropdown
  const allSubcategories = useMemo(() => {
    if (!filteredProject?.categories) return []
    return filteredProject.categories.flatMap(cat =>
      cat.subcategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        categoryName: cat.name,
        label: `${cat.name} › ${sub.name}`
      }))
    )
  }, [filteredProject])

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!filteredProject?.categories) return { categories: [], locations: [], assignees: [], durations: [] }

    const categories = filteredProject.categories.map(c => ({ value: c.id, label: c.name }))
    const locationSet = new Set()
    const assigneeSet = new Set()
    const durationSet = new Set()

    filteredProject.categories.forEach(cat => {
      cat.subcategories.forEach(sub => {
        sub.items.forEach(item => {
          if (item.location) locationSet.add(item.location)
          if (item.assignee_id) assigneeSet.add(item.assignee_id)
          if (item.duration_minutes) {
            if (item.duration_minutes <= 30) durationSet.add('0-30')
            else if (item.duration_minutes <= 60) durationSet.add('31-60')
            else if (item.duration_minutes <= 120) durationSet.add('61-120')
            else durationSet.add('120+')
          }
        })
      })
    })

    return {
      categories,
      locations: Array.from(locationSet).map(l => ({ value: l, label: l })),
      assignees: Array.from(assigneeSet).map(a => ({ value: a, label: 'Team Member' })), // TODO: Fetch actual names
      durations: Array.from(durationSet).map(d => ({ value: d, label: `${d} minutes` }))
    }
  }, [filteredProject])

  // Apply all filters
  const displayedProject = useMemo(() => {
    if (!filteredProject?.categories) return filteredProject

    const hasActiveFilters = filters.search || filters.category || filters.assignee ||
                            filters.dueDate || filters.duration || filters.location || hideCompleted

    if (!hasActiveFilters) return filteredProject

    const filtered = {
      ...filteredProject,
      categories: filteredProject.categories.map(category => {
        // Category filter
        if (filters.category && category.id !== filters.category) return null

        const filteredSubcategories = category.subcategories.map(subcategory => {
          const filteredItems = subcategory.items.filter(item => {
            // Hide completed filter
            if (hideCompleted && item.status === 'completed') return false

            // Search filter
            if (filters.search && !item.description.toLowerCase().includes(filters.search.toLowerCase())) {
              return false
            }

            // Location filter
            if (filters.location && item.location !== filters.location) return false

            // Assignee filter
            if (filters.assignee && item.assignee_id !== filters.assignee) return false

            // Due date filter (tasks due before selected date)
            if (filters.dueDate && item.due_date) {
              if (new Date(item.due_date) > new Date(filters.dueDate)) return false
            }

            // Duration filter
            if (filters.duration && item.duration_minutes) {
              const mins = item.duration_minutes
              if (filters.duration === '0-30' && mins > 30) return false
              if (filters.duration === '31-60' && (mins <= 30 || mins > 60)) return false
              if (filters.duration === '61-120' && (mins <= 60 || mins > 120)) return false
              if (filters.duration === '120+' && mins <= 120) return false
            }

            return true
          })

          if (filteredItems.length === 0) return null

          return {
            ...subcategory,
            items: filteredItems
          }
        }).filter(Boolean)

        if (filteredSubcategories.length === 0) return null

        return {
          ...category,
          subcategories: filteredSubcategories
        }
      }).filter(Boolean)
    }

    return filtered
  }, [filteredProject, filters, hideCompleted])

  const clearFilters = () => {
    setFilters({
      category: '',
      assignee: '',
      dueDate: '',
      duration: '',
      location: '',
      search: ''
    })
    setHideCompleted(false)
  }

  const activeFilterCount = Object.values(filters).filter(v => v).length + (hideCompleted ? 1 : 0)

  if (!filteredProject?.categories || filteredProject.categories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Tracker</h2>
          <p className="text-gray-600 mt-1">Scope of work, checklists, materials, and tools</p>
        </div>
        <ModernCard className="p-12">
          <div className="text-center text-gray-500">
            <p>No tasks found for this project</p>
          </div>
        </ModernCard>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Task Tracker</h2>
          <p className="text-sm text-gray-600 mt-0.5">Scope of work, checklists, materials, and tools</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-1.5 text-sm"
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            onClick={() => setHideCompleted(!hideCompleted)}
            variant="outline"
            className="flex items-center gap-1.5 text-sm"
          >
            {hideCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="hidden sm:inline">{hideCompleted ? 'Show' : 'Hide'} Completed</span>
          </Button>
          <Button
            onClick={() => setIsAddTaskDialogOpen(true)}
            className="flex items-center gap-1.5 text-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add New Task</span>
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <ModernCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Tasks
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Locations</option>
                {filterOptions.locations.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Before
              </label>
              <input
                type="date"
                value={filters.dueDate}
                onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={filters.duration}
                onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Duration</option>
                <option value="0-30">0-30 minutes</option>
                <option value="31-60">31-60 minutes</option>
                <option value="61-120">1-2 hours</option>
                <option value="120+">2+ hours</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <X size={18} />
                Clear All Filters
              </Button>
            </div>
          </div>
        </ModernCard>
      )}

      {/* Task List */}
      <div className="space-y-6">
        {displayedProject.categories.length === 0 ? (
          <ModernCard className="p-12">
            <div className="text-center text-gray-500">
              <p>No tasks match your filters</p>
              <Button onClick={clearFilters} variant="ghost" className="mt-4">
                Clear Filters
              </Button>
            </div>
          </ModernCard>
        ) : (
          displayedProject.categories.map((category) => (
            <ModernCard key={category.id} className="mb-6">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-t-lg border-b border-blue-200 -m-4 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{category.name}</h2>
              </div>

              {/* Subcategories */}
              <div className="space-y-4">
                {category.subcategories.map((subcategory) => {
                  if (subcategory.items.length === 0) return null

                  return (
                    <div key={subcategory.id}>
                      <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-700">
                        {subcategory.name}
                      </h3>

                      <div className="space-y-2 pl-4">
                        {subcategory.items.map((item) => (
                        <div key={item.id} className="space-y-2">
                          {/* Parent Task */}
                          <div
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-2"
                          >
                          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1">
                            {getStatusIcon(item.status)}
                            <div className="flex-1 min-w-0">
                              {editingTask === item.id ? (
                                // Edit Mode
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                  />
                                  <select
                                    value={editedSubcategoryId}
                                    onChange={(e) => setEditedSubcategoryId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    {allSubcategories.map(sub => (
                                      <option key={sub.id} value={sub.id}>
                                        {sub.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                // View Mode
                                <div
                                  onClick={() => {
                                    setSelectedTask(item)
                                    setIsTaskDialogOpen(true)
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{item.description}</p>
                                    {item.subtasks && item.subtasks.length > 0 && (
                                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold">
                                        {item.subtasks.filter(s => s.status === 'completed').length}/{item.subtasks.length} subtasks
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-xs">
                                    {item.location && (
                                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                        📍 {item.location}
                                      </span>
                                    )}
                                    {item.due_date && (
                                      <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">
                                        📅 {new Date(item.due_date).toLocaleDateString()}
                                      </span>
                                    )}
                                    {item.duration_minutes && (
                                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                                        ⏱️ {item.duration_minutes}min
                                      </span>
                                    )}
                                  </div>
                                  {item.notes && (
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{item.notes}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            {editingTask === item.id ? (
                              // Edit Mode Buttons
                              <>
                                <button
                                  onClick={() => saveEditing(item.id)}
                                  className="p-1.5 sm:p-2 rounded-lg text-green-700 hover:bg-green-100 border border-green-300 transition-all"
                                  title="Save changes"
                                >
                                  <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-1.5 sm:p-2 rounded-lg text-gray-700 hover:bg-gray-100 border border-gray-300 transition-all"
                                  title="Cancel"
                                >
                                  <XIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                              </>
                            ) : (
                              // View Mode Buttons
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditing(item)
                                  }}
                                  className="p-1.5 sm:p-2 rounded-lg text-blue-700 hover:bg-blue-100 border border-blue-300 transition-all"
                                  title="Edit task"
                                >
                                  <Edit2 size={14} className="sm:w-4 sm:h-4" />
                                </button>
                                {item.status !== 'completed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStatusChange(item.id, 'completed')
                                    }}
                                    className="px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 transition-all shadow-sm whitespace-nowrap"
                                  >
                                    ✓ <span className="hidden sm:inline">Done</span>
                                  </button>
                                )}
                                {item.status === 'completed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStatusChange(item.id, 'pending')
                                    }}
                                    className="px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-all shadow-sm whitespace-nowrap"
                                  >
                                    ↺ <span className="hidden sm:inline">Reopen</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Subtasks */}
                        {item.subtasks && item.subtasks.length > 0 && (
                          <div className="ml-8 sm:ml-12 space-y-2 border-l-2 border-blue-200 pl-4">
                            {item.subtasks.map(subtask => (
                              <div
                                key={subtask.id}
                                className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                              >
                                {getStatusIcon(subtask.status)}
                                <span className={subtask.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700'}>
                                  {subtask.description}
                                </span>
                                {subtask.status !== 'completed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStatusChange(subtask.id, 'completed')
                                    }}
                                    className="ml-auto px-2 py-1 rounded text-xs bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                                  >
                                    ✓
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ModernCard>
          ))
        )}
      </div>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        item={selectedTask}
        isOpen={isTaskDialogOpen}
        onClose={() => {
          setIsTaskDialogOpen(false)
          setSelectedTask(null)
        }}
        onUpdate={() => {
          window.location.reload()
        }}
      />

      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={isAddTaskDialogOpen}
        onClose={() => setIsAddTaskDialogOpen(false)}
        projectId={projectId}
        onTaskCreated={() => {
          window.location.reload()
        }}
      />
    </div>
  )
}

export default TaskTrackerModule
