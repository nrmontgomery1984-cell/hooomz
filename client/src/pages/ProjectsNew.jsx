import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import ModernCard from '../components/UI/ModernCard'
import FilterBar from '../components/UI/FilterBar'
import { Button } from '../components/UI/Button'
import { Plus, FolderOpen, Calendar, DollarSign, Clock, MapPin, TrendingUp } from 'lucide-react'
import { colors } from '../styles/design-tokens'

/**
 * Projects Page - Redesigned
 * Modern UI for Hooomz Buildz project management
 */
const ProjectsNew = () => {
  const navigate = useNavigate()
  const { projects, loading, error } = useProjects()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active') // Default to active projects only

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!projects) return []

    return projects.filter(project => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          project.name?.toLowerCase().includes(query) ||
          project.address?.toLowerCase().includes(query) ||
          project.client_name?.toLowerCase().includes(query)

        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [projects, searchQuery, statusFilter])

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Projects' },
        { value: 'active', label: 'Active' },
        { value: 'planning', label: 'Planning' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'completed', label: 'Archived (Completed)' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ]

  const handleFilterChange = (key, value) => {
    if (key === 'status') {
      setStatusFilter(value)
    }
  }

  const getStatusStyles = (status) => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: colors.success[100],
          color: colors.success[800],
        }
      case 'planning':
        return {
          backgroundColor: colors.primary[100],
          color: colors.primary[800],
        }
      case 'on_hold':
        return {
          backgroundColor: colors.warning[100],
          color: colors.warning[600],
        }
      case 'completed':
        return {
          backgroundColor: colors.gray[100],
          color: colors.gray[800],
        }
      case 'cancelled':
        return {
          backgroundColor: colors.error[100],
          color: colors.error[800],
        }
      default:
        return {
          backgroundColor: colors.gray[100],
          color: colors.gray[800],
        }
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Stats
  const stats = useMemo(() => {
    if (!projects) return { total: 0, active: 0, completed: 0, totalBudget: 0 }

    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    }
  }, [projects])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto"
                style={{ borderColor: colors.secondary[600] }}
              ></div>
              <p className="mt-4 text-gray-600 font-medium">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <ModernCard padding="xl">
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Projects</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </ModernCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Projects</h1>
              <p className="text-gray-600">Manage construction projects and track progress</p>
            </div>
            <Button
              onClick={() => navigate('/projects/new')}
              style={{ backgroundColor: colors.secondary[600] }}
            >
              <Plus size={20} className="mr-2" />
              New Project
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <ModernCard padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Projects</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.secondary[100], color: colors.secondary[600] }}
                >
                  <FolderOpen size={24} />
                </div>
              </div>
            </ModernCard>

            <ModernCard padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Active</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.success[100], color: colors.success[600] }}
                >
                  <TrendingUp size={24} />
                </div>
              </div>
            </ModernCard>

            <ModernCard padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.gray[100], color: colors.gray[600] }}
                >
                  <Clock size={24} />
                </div>
              </div>
            </ModernCard>

            <ModernCard padding="md" hover>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Budget</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalBudget)}
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.primary[100], color: colors.primary[600] }}
                >
                  <DollarSign size={24} />
                </div>
              </div>
            </ModernCard>
          </div>

          {/* Filters */}
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filterOptions}
            activeFilters={{ status: statusFilter }}
            onFilterChange={handleFilterChange}
            placeholder="Search projects by name, address, or client..."
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <ModernCard padding="xl">
            <div className="text-center py-12">
              <FolderOpen size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {projects.length === 0
                  ? 'Create your first contractor project to get started'
                  : 'Try adjusting your search or filters'}
              </p>
              {projects.length === 0 && (
                <Button
                  onClick={() => navigate('/projects/new')}
                  style={{ backgroundColor: colors.secondary[600] }}
                >
                  <Plus size={20} className="mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          </ModernCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ModernCard
                key={project.id}
                padding="lg"
                hover
                onClick={() => navigate(`/projects/${project.id}`)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                      {project.name}
                    </h3>
                    {project.address && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin size={14} className="mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">{project.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <span
                    className="inline-block px-3 py-1 rounded-lg text-xs font-semibold"
                    style={getStatusStyles(project.status)}
                  >
                    {project.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Project Details */}
                <div className="space-y-2.5 text-sm mb-4">
                  {project.client_name && (
                    <div className="flex items-center text-gray-700">
                      <span className="font-semibold mr-2 min-w-[60px]">Client:</span>
                      <span className="line-clamp-1">{project.client_name}</span>
                    </div>
                  )}

                  {project.start_date && (
                    <div className="flex items-center text-gray-700">
                      <Calendar size={14} className="mr-2 flex-shrink-0" style={{ color: colors.gray[500] }} />
                      <span className="font-semibold mr-2">Started:</span>
                      <span>{formatDate(project.start_date)}</span>
                    </div>
                  )}

                  {project.target_completion_date && (
                    <div className="flex items-center text-gray-700">
                      <Clock size={14} className="mr-2 flex-shrink-0" style={{ color: colors.gray[500] }} />
                      <span className="font-semibold mr-2">Target:</span>
                      <span>{formatDate(project.target_completion_date)}</span>
                    </div>
                  )}

                  {project.budget && (
                    <div className="flex items-center text-gray-700">
                      <DollarSign size={14} className="mr-2 flex-shrink-0" style={{ color: colors.gray[500] }} />
                      <span className="font-semibold mr-2">Budget:</span>
                      <span>{formatCurrency(project.budget)}</span>
                    </div>
                  )}
                </div>

                {/* Project Notes Preview */}
                {project.notes && (
                  <div className="pt-4 border-t" style={{ borderColor: colors.border.light }}>
                    <p className="text-sm text-gray-600 line-clamp-2 italic">{project.notes}</p>
                  </div>
                )}

                {/* View Button */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border.light }}>
                  <button
                    className="w-full text-center text-sm font-semibold py-2 rounded-lg transition-all"
                    style={{
                      color: colors.secondary[600],
                      backgroundColor: colors.secondary[50],
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/projects/${project.id}`)
                    }}
                  >
                    View Details →
                  </button>
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectsNew
