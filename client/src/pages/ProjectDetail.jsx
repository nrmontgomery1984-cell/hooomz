import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectScope } from '../hooks/useProjects'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { ArrowLeft, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import TimeTracker from '../components/Projects/TimeTracker'

/**
 * Project Detail Page
 * Shows full scope breakdown and time tracking
 */
const ProjectDetail = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project, loading, error, updateScopeItem } = useProjectScope(projectId)
  const [expandedCategories, setExpandedCategories] = useState({})

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={20} className="text-green-600" />
      case 'in_progress':
        return <Clock size={20} className="text-blue-600" />
      case 'cancelled':
        return <AlertCircle size={20} className="text-red-600" />
      default:
        return <Circle size={20} className="text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'in_progress':
        return 'bg-blue-50 border-blue-200'
      case 'cancelled':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const calculateProgress = (items) => {
    if (!items || items.length === 0) return 0
    const completed = items.filter(i => i.status === 'completed').length
    return Math.round((completed / items.length) * 100)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft size={20} className="mr-2" />
          Back to Projects
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <p className="text-red-800">Error loading project: {error || 'Project not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4">
          <ArrowLeft size={20} className="mr-2" />
          Back to Projects
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.address && (
              <p className="text-gray-600 mt-1">{project.address}</p>
            )}
            {project.client_name && (
              <p className="text-sm text-gray-500 mt-1">Client: {project.client_name}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.status === 'active' ? 'bg-green-100 text-green-800' :
            project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Time Tracker */}
      <TimeTracker projectId={projectId} />

      {/* Scope of Work */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Scope of Work</h2>

        {project.categories && project.categories.length > 0 ? (
          <div className="space-y-6">
            {project.categories.map(category => {
              const isExpanded = expandedCategories[category.id] !== false // Default to expanded
              const totalItems = category.subcategories.reduce((sum, sub) => sum + sub.items.length, 0)
              const completedItems = category.subcategories.reduce(
                (sum, sub) => sum + sub.items.filter(i => i.status === 'completed').length,
                0
              )
              const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

              return (
                <Card key={category.id} className="overflow-hidden">
                  {/* Category Header */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-4 -m-4 mb-0"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {completedItems} of {totalItems} tasks completed
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Progress Bar */}
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {isExpanded ? '▼' : '▶'}
                      </Button>
                    </div>
                  </div>

                  {/* Subcategories and Items */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      {category.subcategories.map(subcategory => (
                        <div key={subcategory.id} className="pl-4 border-l-2 border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            {subcategory.name}
                          </h4>

                          <div className="space-y-2">
                            {subcategory.items.map(item => (
                              <div
                                key={item.id}
                                className={`flex items-start justify-between p-3 rounded-lg border transition-all ${getStatusColor(item.status)}`}
                              >
                                <div className="flex items-start space-x-3 flex-1">
                                  {getStatusIcon(item.status)}
                                  <div className="flex-1">
                                    <p className={`text-sm ${
                                      item.status === 'completed' ? 'line-through text-gray-600' : 'text-gray-900'
                                    }`}>
                                      {item.description}
                                    </p>
                                    {item.notes && (
                                      <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                                    )}
                                    {item.actual_hours > 0 && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        <Clock size={12} className="inline mr-1" />
                                        {item.actual_hours.toFixed(1)} hours logged
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Status Buttons */}
                                <div className="flex items-center space-x-1 ml-4">
                                  {item.status !== 'completed' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStatusChange(item.id, 'completed')}
                                      title="Mark as completed"
                                    >
                                      ✓
                                    </Button>
                                  )}
                                  {item.status === 'completed' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStatusChange(item.id, 'pending')}
                                      title="Mark as pending"
                                    >
                                      ↺
                                    </Button>
                                  )}
                                  {item.status === 'pending' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStatusChange(item.id, 'in_progress')}
                                      title="Mark as in progress"
                                    >
                                      →
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <p className="text-gray-600">No scope items yet</p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ProjectDetail
