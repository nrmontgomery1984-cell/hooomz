import { useState, useEffect } from 'react'
import { List, Filter, CheckCircle2, Circle, Clock, AlertCircle, MapPin, User, Calendar, Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '../../UI/Button'
import ModernCard from '../../UI/ModernCard'
import * as projectsApi from '../../../services/projectsApi'
import { colors } from '../../../styles/design-tokens'
import TaskDetailDialog from '../TaskDetailDialog'
import AddTaskDialog from '../AddTaskDialog'

/**
 * TaskInstancesModule
 * Displays deployed task instances with filtering by phase, location, status, etc.
 */
const TaskInstancesModule = ({ projectId }) => {
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [teamMembers, setTeamMembers] = useState([])

  const [hideCompleted, setHideCompleted] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('taskInstances_hideCompleted')
    return saved === 'true'
  })

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    location: '',
    category: '',
    assignee: '',
    dueDate: ''
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false
  })

  useEffect(() => {
    loadInstances()
  }, [projectId, filters, hideCompleted])

  // Save hideCompleted preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('taskInstances_hideCompleted', hideCompleted.toString())
  }, [hideCompleted])

  const loadInstances = async () => {
    try {
      console.log('🔄 [loadInstances] Starting to load items for project:', projectId)
      setLoading(true)
      // Get all scope items for the project
      const items = await projectsApi.getAllScopeItems(projectId)
      console.log('📦 [loadInstances] Received items:', items.length, 'first item:', items[0])

      // Extract unique categories, locations, and assignees for filter dropdowns
      const uniqueCategories = [...new Set(items.map(item => item.category_name).filter(Boolean))]
      const uniqueLocations = [...new Set(items.map(item => item.location).filter(Boolean))].sort()

      // Extract unique assignees with their names
      const assigneeMap = new Map()
      items.forEach(item => {
        if (item.assignee_id && item.assignee_name) {
          assigneeMap.set(item.assignee_id, item.assignee_name)
        }
      })
      const uniqueAssignees = Array.from(assigneeMap.entries()).map(([id, name]) => ({ id, name }))

      // Debug: Alert to show what we extracted
      if (uniqueAssignees.length > 0) {
        console.log('✅ Found assignees:', uniqueAssignees)
      } else {
        console.log('⚠️ No assignees found. First item:', items[0])
      }

      setCategories(uniqueCategories.sort())
      setLocations(uniqueLocations)
      setTeamMembers(uniqueAssignees.sort((a, b) => a.name.localeCompare(b.name)))

      // Apply filters
      let filteredItems = items || []

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredItems = filteredItems.filter(item =>
          item.description?.toLowerCase().includes(searchLower) ||
          item.location?.toLowerCase().includes(searchLower) ||
          item.category_name?.toLowerCase().includes(searchLower) ||
          item.subcategory_name?.toLowerCase().includes(searchLower)
        )
      }

      // Status filter
      if (filters.status) {
        filteredItems = filteredItems.filter(item => item.status === filters.status)
      }

      // Priority filter
      if (filters.priority) {
        filteredItems = filteredItems.filter(item => item.priority === filters.priority)
      }

      // Location filter
      if (filters.location) {
        filteredItems = filteredItems.filter(item => item.location === filters.location)
      }

      // Category filter
      if (filters.category) {
        filteredItems = filteredItems.filter(item => item.category_name === filters.category)
      }

      // Assignee filter
      if (filters.assignee) {
        if (filters.assignee === 'unassigned') {
          filteredItems = filteredItems.filter(item => !item.assignee_id)
        } else {
          filteredItems = filteredItems.filter(item => item.assignee_id === filters.assignee)
        }
      }

      // Due date filter
      if (filters.dueDate) {
        filteredItems = filteredItems.filter(item => {
          if (!item.due_date) return false
          const itemDate = item.due_date.split('T')[0]
          return itemDate === filters.dueDate
        })
      }

      // Hide completed filter
      if (hideCompleted) {
        filteredItems = filteredItems.filter(item => item.status !== 'completed')
      }

      setInstances(filteredItems)
      setPagination(prev => ({
        ...prev,
        total: filteredItems.length,
        hasMore: false
      }))
      setError(null)
    } catch (err) {
      console.error('Error loading tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleInstanceClick = async (instance) => {
    try {
      // Scope items don't need additional loading, just open dialog
      setSelectedInstance(instance)
      setIsDialogOpen(true)
    } catch (err) {
      alert(`Error loading task details: ${err.message}`)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} color={colors.status.success} />
      case 'in_progress': return <Clock size={16} color={colors.status.warning} />
      case 'pending': return <Circle size={16} color={colors.text.tertiary} />
      case 'blocked': return <AlertCircle size={16} color={colors.status.error} />
      default: return <Circle size={16} color={colors.text.tertiary} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return colors.status.success
      case 'in_progress': return colors.status.warning
      case 'pending': return colors.text.secondary
      case 'blocked': return colors.status.error
      default: return colors.text.secondary
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return colors.status.error
      case 'medium': return colors.status.warning
      case 'low': return colors.status.success
      default: return colors.text.secondary
    }
  }

  if (loading && instances.length === 0) {
    return (
      <ModernCard>
        <div style={{ padding: '24px', textAlign: 'center', color: colors.text.secondary }}>
          Loading task instances...
        </div>
      </ModernCard>
    )
  }

  if (error) {
    return (
      <ModernCard>
        <div style={{ padding: '24px' }}>
          <div style={{ color: colors.status.error, marginBottom: '12px' }}>
            Error loading instances: {error}
          </div>
          <Button onClick={loadInstances}>Retry</Button>
        </div>
      </ModernCard>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Filters */}
      <ModernCard>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <List size={24} color={colors.primary.main} />
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Tasks</h2>
                <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>
                  {pagination.total} tasks
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                onClick={() => setHideCompleted(!hideCompleted)}
                variant="outline"
                size="sm"
              >
                {hideCompleted ? <Eye size={16} style={{ marginRight: '6px' }} /> : <EyeOff size={16} style={{ marginRight: '6px' }} />}
                {hideCompleted ? 'Show' : 'Hide'} Completed
              </Button>
              <Button onClick={() => setIsAddTaskDialogOpen(true)} variant="primary" size="sm">
                <Plus size={16} style={{ marginRight: '6px' }} />
                Add Task
              </Button>
              <Button onClick={loadInstances} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border.light}`,
                fontSize: '14px'
              }}
            />

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border.light}`,
                fontSize: '14px'
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border.light}`,
                fontSize: '14px'
              }}
            >
              <option value="">All Priorities</option>
              <option value="1">Urgent</option>
              <option value="2">High</option>
              <option value="3">Medium</option>
              <option value="4">Normal</option>
            </select>

            {/* Location Filter */}
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border.light}`,
                fontSize: '14px'
              }}
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border.light}`,
                fontSize: '14px'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={filters.assignee}
              onChange={(e) => handleFilterChange('assignee', e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border.light}`,
                fontSize: '14px'
              }}
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {Array.isArray(teamMembers) && teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>

            {/* Due Date Filter */}
            <input
              type="date"
              value={filters.dueDate}
              onChange={(e) => handleFilterChange('dueDate', e.target.value)}
              placeholder="Due date..."
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border.light}`,
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </ModernCard>

      {/* Task Instances List */}
      {instances.length === 0 ? (
        <ModernCard>
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <List size={48} color={colors.text.tertiary} style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Tasks</h3>
            <p style={{ color: colors.text.secondary, marginBottom: '24px' }}>
              Click "Add Task" above to create your first task
            </p>
          </div>
        </ModernCard>
      ) : (
        <>
          {instances.map(instance => (
            <div
              key={instance.id}
              onClick={() => handleInstanceClick(instance)}
              style={{
                cursor: 'pointer',
                padding: '14px',
                marginBottom: '8px',
                border: `1px solid ${colors.border.light}`,
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.borderColor = colors.primary.main
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)'
                e.currentTarget.style.borderColor = colors.border.light
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {/* Task Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    {getStatusIcon(instance.status)}
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: colors.text.primary }}>
                      {instance.description || instance.template?.name}
                    </h3>
                  </div>

                  {/* Metadata - Compact display */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: colors.text.secondary, marginLeft: '26px' }}>
                    {instance.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} />
                        <span>{instance.location}</span>
                      </div>
                    )}
                    {instance.category_name && (
                      <span>{instance.category_name}</span>
                    )}
                    {instance.assignee_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={13} />
                        <span>{instance.assignee_name}</span>
                      </div>
                    )}
                    {instance.due_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} />
                        <span>{new Date(instance.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Priority Badge */}
                  {instance.priority && (
                    <div
                      style={{
                        padding: '3px 10px',
                        borderRadius: '10px',
                        backgroundColor: getPriorityColor(instance.priority) + '15',
                        color: getPriorityColor(instance.priority),
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      P{instance.priority}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <ModernCard>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: colors.text.secondary }}>
                  Page {pagination.page} - Showing {instances.length} of {pagination.total}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    size="sm"
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasMore}
                    size="sm"
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </ModernCard>
          )}
        </>
      )}

      {/* Task Detail Dialog */}
      {selectedInstance && (
        <TaskDetailDialog
          item={selectedInstance}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedInstance(null)
          }}
          onUpdate={loadInstances}
        />
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={isAddTaskDialogOpen}
        onClose={() => setIsAddTaskDialogOpen(false)}
        projectId={projectId}
        onTaskCreated={loadInstances}
      />
    </div>
  )
}

export default TaskInstancesModule
