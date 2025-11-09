import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Plus, FolderOpen, Calendar, DollarSign, Clock } from 'lucide-react'

/**
 * Projects Page
 * Lists all contractor projects
 */
const Projects = () => {
  const navigate = useNavigate()
  const { projects, loading, error } = useProjects()

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading projects: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage contractor projects and track work</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus size={20} className="mr-2" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">Create your first contractor project to get started</p>
          <Button onClick={() => navigate('/projects/new')}>
            <Plus size={20} className="mr-2" />
            Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {project.name}
                  </h3>
                  {project.address && (
                    <p className="text-sm text-gray-600">{project.address}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Project Details */}
              <div className="space-y-2 text-sm">
                {project.client_name && (
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium mr-2">Client:</span>
                    {project.client_name}
                  </div>
                )}

                {project.start_date && (
                  <div className="flex items-center text-gray-700">
                    <Calendar size={14} className="mr-2" />
                    <span className="font-medium mr-2">Started:</span>
                    {formatDate(project.start_date)}
                  </div>
                )}

                {project.target_completion_date && (
                  <div className="flex items-center text-gray-700">
                    <Clock size={14} className="mr-2" />
                    <span className="font-medium mr-2">Target:</span>
                    {formatDate(project.target_completion_date)}
                  </div>
                )}

                {project.budget && (
                  <div className="flex items-center text-gray-700">
                    <DollarSign size={14} className="mr-2" />
                    <span className="font-medium mr-2">Budget:</span>
                    {formatCurrency(project.budget)}
                  </div>
                )}
              </div>

              {/* Project Notes Preview */}
              {project.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 line-clamp-2">{project.notes}</p>
                </div>
              )}

              {/* View Button */}
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/projects/${project.id}`)
                  }}
                >
                  View Details →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Projects
