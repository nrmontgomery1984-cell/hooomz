import { useState, useEffect } from 'react'
import { List, Filter, CheckCircle2, Circle, Clock, AlertCircle, MapPin, User, Calendar, Plus } from 'lucide-react'
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

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false
  })

  useEffect(() => {
    loadInstances()
  }, [projectId, filters])

  const loadInstances = async () => {
    try {
      setLoading(true)
      // Get all scope items for the project
      const items = await projectsApi.getAllScopeItems(projectId)

      // Apply filters
      let filteredItems = items || []

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredItems = filteredItems.filter(item =>
          item.description?.toLowerCase().includes(searchLower) ||
          item.location?.toLowerCase().includes(searchLower)
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
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
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
            <ModernCard key={instance.id} onClick={() => handleInstanceClick(instance)} style={{ cursor: 'pointer' }}>
              <div
                style={{
                  padding: '16px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.secondary}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {/* Task Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {getStatusIcon(instance.status)}
                      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                        {instance.description || instance.template?.name}
                      </h3>
                    </div>

                    {/* Location */}
                    {instance.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <MapPin size={14} color={colors.text.secondary} />
                        <span style={{ fontSize: '14px', color: colors.text.secondary }}>
                          {instance.location}
                        </span>
                      </div>
                    )}

                    {/* Metadata */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: colors.text.secondary }}>
                      {instance.estimated_hours && (
                        <span>{instance.estimated_hours}h estimated</span>
                      )}
                      {instance.actual_hours && (
                        <span>{instance.actual_hours}h actual</span>
                      )}
                      {instance.category_name && (
                        <span>{instance.category_name}</span>
                      )}
                      {instance.subcategory_name && (
                        <span> &gt; {instance.subcategory_name}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {/* Priority Badge */}
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: getPriorityColor(instance.priority) + '20',
                        color: getPriorityColor(instance.priority),
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    >
                      {instance.priority || 'medium'}
                    </div>

                    {/* Status Badge */}
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: getStatusColor(instance.status) + '20',
                        color: getStatusColor(instance.status),
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    >
                      {instance.status?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>
            </ModernCard>
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
