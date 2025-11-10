import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectScope } from '../hooks/useProjects'
import ModernCard from '../components/UI/ModernCard'
import FilterBar from '../components/UI/FilterBar'
import Breadcrumbs from '../components/Layout/Breadcrumbs'
import { Button } from '../components/UI/Button'
import { ArrowLeft, CheckCircle2, Circle, Clock, AlertCircle, MapPin, Archive, Trash2, MoreVertical } from 'lucide-react'
import TimeTracker from '../components/Projects/TimeTracker'
import TaskDetailDialog from '../components/Projects/TaskDetailDialog'
import { colors } from '../styles/design-tokens'
import { api } from '../services/api'

/**
 * Project Detail Page - Redesigned
 * Modern UI with filtering by location, category, and subcategory
 */
const ProjectDetailNew = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project, loading, error, updateScopeItem } = useProjectScope(projectId)

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    location: 'all',
    category: 'all',
    subcategory: 'all',
    status: 'all',
  })
  const [expandedCategories, setExpandedCategories] = useState({})
  const [selectedTask, setSelectedTask] = useState(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)

  // Extract unique locations from scope items
  const locations = useMemo(() => {
    if (!project?.categories) return []
    const locationSet = new Set()
    project.categories.forEach(cat => {
      cat.subcategories.forEach(sub => {
        sub.items.forEach(item => {
          if (item.location) locationSet.add(item.location)
        })
      })
    })
    return Array.from(locationSet).sort()
  }, [project])

  // Build filter options
  const filterOptions = useMemo(() => {
    if (!project?.categories) return []

    return [
      {
        key: 'location',
        label: 'Location',
        options: locations.map(loc => ({ value: loc, label: loc })),
      },
      {
        key: 'category',
        label: 'Category',
        options: project.categories.map(cat => ({ value: cat.id, label: cat.name })),
      },
      {
        key: 'subcategory',
        label: 'Subcategory',
        options: project.categories.flatMap(cat =>
          cat.subcategories.map(sub => ({ value: sub.id, label: `${cat.name} > ${sub.name}` }))
        ),
      },
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      },
    ]
  }, [project, locations])

  // Filter scope items based on search and filters
  const filteredProject = useMemo(() => {
    if (!project?.categories) return null

    const filtered = {
      ...project,
      categories: project.categories.map(category => {
        // Skip category if filtered out
        if (filters.category !== 'all' && category.id !== filters.category) {
          return null
        }

        const filteredSubcategories = category.subcategories.map(subcategory => {
          // Skip subcategory if filtered out
          if (filters.subcategory !== 'all' && subcategory.id !== filters.subcategory) {
            return null
          }

          const filteredItems = subcategory.items.filter(item => {
            // Search filter
            if (searchQuery && !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
              return false
            }

            // Location filter
            if (filters.location !== 'all' && item.location !== filters.location) {
              return false
            }

            // Status filter
            if (filters.status !== 'all' && item.status !== filters.status) {
              return false
            }

            return true
          })

          if (filteredItems.length === 0) return null

          return {
            ...subcategory,
            items: filteredItems,
          }
        }).filter(Boolean)

        if (filteredSubcategories.length === 0) return null

        return {
          ...category,
          subcategories: filteredSubcategories,
        }
      }).filter(Boolean),
    }

    return filtered
  }, [project, searchQuery, filters])

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await updateScopeItem(itemId, { status: newStatus })
    } catch (err) {
      console.error('Error updating scope item:', err)
      alert('Failed to update task status')
    }
  }

  const handleArchiveProject = async () => {
    if (!confirm('Archive this project? It will be marked as completed and moved to archived projects.')) {
      return
    }
    try {
      const response = await api.put(`/projects/${projectId}`, { status: 'completed' })
      if (response.data) {
        navigate('/projects')
      }
    } catch (err) {
      console.error('Error archiving project:', err)
      alert('Failed to archive project')
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project? This action cannot be undone.')) {
      return
    }
    try {
      await api.delete(`/projects/${projectId}`)
      navigate('/projects')
    } catch (err) {
      console.error('Error deleting project:', err)
      alert('Failed to delete project')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={18} style={{ color: colors.success[600] }} />
      case 'in_progress':
        return <Clock size={18} style={{ color: colors.primary[600] }} />
      case 'cancelled':
        return <AlertCircle size={18} style={{ color: colors.error[600] }} />
      default:
        return <Circle size={18} style={{ color: colors.gray[400] }} />
    }
  }

  const getStatusStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: colors.success[50],
          borderColor: colors.success[200],
        }
      case 'in_progress':
        return {
          backgroundColor: colors.primary[50],
          borderColor: colors.primary[200],
        }
      case 'cancelled':
        return {
          backgroundColor: colors.error[50],
          borderColor: colors.error[200],
        }
      default:
        return {
          backgroundColor: colors.background.primary,
          borderColor: colors.border.light,
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: colors.primary[600] }}></div>
              <p className="mt-4 text-gray-600 font-medium">Loading project...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ArrowLeft size={20} className="mr-2" />
            Back to Projects
          </Button>
          <ModernCard className="mt-6" padding="xl">
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4" style={{ color: colors.error[500] }} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Project</h3>
              <p className="text-gray-600">{error || 'Project not found'}</p>
            </div>
          </ModernCard>
        </div>
      </div>
    )
  }

  const totalTasks = filteredProject.categories.reduce(
    (sum, cat) => sum + cat.subcategories.reduce((s, sub) => s + sub.items.length, 0),
    0
  )

  const completedTasks = filteredProject.categories.reduce(
    (sum, cat) => sum + cat.subcategories.reduce(
      (s, sub) => s + sub.items.filter(i => i.status === 'completed').length, 0
    ),
    0
  )

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Projects', path: '/projects' },
            { label: project.name, path: `/projects/${projectId}` },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.name}</h1>
              {project.address && (
                <div className="flex items-center text-gray-600 mb-1">
                  <MapPin size={16} className="mr-2" />
                  <span>{project.address}</span>
                </div>
              )}
              {project.client_name && (
                <p className="text-sm text-gray-500">Client: {project.client_name}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color: colors.primary[600] }}>
                  {overallProgress}%
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Complete</div>
              </div>
              <span
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: project.status === 'active' ? colors.success[100] :
                                  project.status === 'completed' ? colors.gray[100] :
                                  colors.primary[100],
                  color: project.status === 'active' ? colors.success[800] :
                        project.status === 'completed' ? colors.gray[800] :
                        colors.primary[800],
                }}
              >
                {project.status.replace('_', ' ').toUpperCase()}
              </span>

              {/* Project Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProjectMenu(!showProjectMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Project actions"
                >
                  <MoreVertical size={20} className="text-gray-600" />
                </button>

                {showProjectMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      {project.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setShowProjectMenu(false)
                            handleArchiveProject()
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                        >
                          <Archive size={16} />
                          Archive Project
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowProjectMenu(false)
                          handleDeleteProject()
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <Trash2 size={16} />
                        Delete Project
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${overallProgress}%`,
                backgroundColor: colors.primary[600],
              }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {completedTasks} of {totalTasks} tasks completed
          </div>
        </div>

        {/* Time Tracker */}
        <div className="mb-8">
          <TimeTracker projectId={projectId} />
        </div>

        {/* Scope of Work Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Scope of Work</h2>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <FilterBar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filterOptions}
              activeFilters={filters}
              onFilterChange={handleFilterChange}
              placeholder="Search tasks..."
            />
          </div>

          {/* Scope Items */}
          {filteredProject.categories && filteredProject.categories.length > 0 ? (
            <div className="space-y-4">
              {filteredProject.categories.map(category => {
                const isExpanded = expandedCategories[category.id] !== false
                const totalItems = category.subcategories.reduce((sum, sub) => sum + sub.items.length, 0)
                const completedItems = category.subcategories.reduce(
                  (sum, sub) => sum + sub.items.filter(i => i.status === 'completed').length,
                  0
                )
                const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

                return (
                  <ModernCard key={category.id} padding="none" hover>
                    {/* Category Header */}
                    <div
                      className="flex items-center justify-between cursor-pointer p-6 hover:bg-gray-50 transition-colors"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {completedItems} of {totalItems} tasks completed
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* Progress Circle */}
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all duration-300"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: colors.primary[600],
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                            {progress}%
                          </span>
                        </div>
                        <div className="text-gray-400 text-lg">
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                        <div className="space-y-6">
                          {category.subcategories.map(subcategory => (
                            <div key={subcategory.id}>
                              <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                                {subcategory.name}
                              </h4>

                              <div className="space-y-2">
                                {subcategory.items.map(item => (
                                  <div
                                    key={item.id}
                                    className="flex items-start justify-between p-4 rounded-xl border transition-all hover:shadow-sm"
                                    style={getStatusStyles(item.status)}
                                  >
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="mt-0.5">
                                        {getStatusIcon(item.status)}
                                      </div>
                                      <div className="flex-1">
                                        <p
                                          onClick={() => {
                                            setSelectedTask(item)
                                            setIsTaskDialogOpen(true)
                                          }}
                                          className={`text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors ${
                                            item.status === 'completed' ? 'line-through text-gray-600' : 'text-gray-900'
                                          }`}
                                        >
                                          {item.description}
                                        </p>
                                        {item.location && (
                                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                            <MapPin size={12} />
                                            {item.location}
                                          </div>
                                        )}
                                        {item.notes && (
                                          <p className="text-xs text-gray-500 mt-1 italic">{item.notes}</p>
                                        )}
                                        {item.actual_hours > 0 && (
                                          <div className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                                            <Clock size={12} />
                                            {item.actual_hours.toFixed(1)} hours logged
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-1 ml-4">
                                      {item.status !== 'completed' && (
                                        <button
                                          onClick={() => handleStatusChange(item.id, 'completed')}
                                          className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white transition-colors"
                                          style={{ color: colors.success[700] }}
                                          title="Mark as completed"
                                        >
                                          ✓ Done
                                        </button>
                                      )}
                                      {item.status === 'completed' && (
                                        <button
                                          onClick={() => handleStatusChange(item.id, 'pending')}
                                          className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white transition-colors"
                                          style={{ color: colors.gray[700] }}
                                          title="Reopen"
                                        >
                                          ↺ Reopen
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </ModernCard>
                )
              })}
            </div>
          ) : (
            <ModernCard padding="xl">
              <div className="text-center py-12">
                <p className="text-gray-500">No tasks match your filters</p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilters({ location: 'all', category: 'all', subcategory: 'all', status: 'all' })
                    setSearchQuery('')
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            </ModernCard>
          )}
        </div>
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
          // Refresh project data after updates
          window.location.reload()
        }}
      />
    </div>
  )
}

export default ProjectDetailNew
