import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import ModernCard from '../components/UI/ModernCard'
import TimeAnalyticsModule from '../components/Projects/modules/TimeAnalyticsModule'
import { Button } from '../components/UI/Button'
import { BarChart3, ChevronDown } from 'lucide-react'

/**
 * Global Analytics Page
 * Unified analytics and reporting view across all projects with project selection dropdown
 */
const GlobalAnalytics = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { projects, loading: projectsLoading } = useProjects()

  // Get project from URL params or localStorage, default to 'all'
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const urlProject = searchParams.get('project')
    if (urlProject) return urlProject

    const lastActiveProject = localStorage.getItem('lastActiveProject')
    return lastActiveProject || 'all'
  })

  // Update URL when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setSearchParams({ project: selectedProjectId })
      if (selectedProjectId !== 'all') {
        localStorage.setItem('lastActiveProject', selectedProjectId)
      }
    }
  }, [selectedProjectId, setSearchParams])

  // Don't auto-select - default to 'all' is handled in state initialization

  const handleProjectChange = (e) => {
    const newProjectId = e.target.value
    setSelectedProjectId(newProjectId)
  }

  const handleGoToProject = () => {
    if (selectedProjectId) {
      navigate(`/projects/${selectedProjectId}`)
    }
  }

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 size={32} className="text-blue-600" />
              Analytics & Reports
            </h1>
            <p className="text-gray-600 mt-2">Comprehensive time tracking insights across all projects</p>
          </div>

          <ModernCard className="p-12">
            <div className="text-center text-gray-500">
              <p className="mb-4">No projects found</p>
              <Button onClick={() => navigate('/projects')}>
                Go to Projects
              </Button>
            </div>
          </ModernCard>
        </div>
      </div>
    )
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-4">
            <BarChart3 size={32} className="text-blue-600" />
            Analytics & Reports
          </h1>

          {/* Project Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project
              </label>
              <div className="relative">
                <select
                  value={selectedProjectId || 'all'}
                  onChange={handleProjectChange}
                  className="w-full sm:w-96 px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-base font-medium"
                >
                  <option value="all">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} {project.status === 'completed' ? '(Archived)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {selectedProjectId && selectedProjectId !== 'all' && selectedProject && (
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleGoToProject}
                  className="whitespace-nowrap"
                >
                  View Project Details
                </Button>
              </div>
            )}
          </div>

          {/* Project Info */}
          {selectedProject && selectedProjectId !== 'all' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedProject.name}</h3>
                  {selectedProject.address && (
                    <p className="text-sm text-gray-600 mt-1">{selectedProject.address}</p>
                  )}
                  {selectedProject.client_name && (
                    <p className="text-sm text-gray-500 mt-0.5">Client: {selectedProject.client_name}</p>
                  )}
                </div>
                <span
                  className="px-3 py-1 rounded-lg text-sm font-semibold"
                  style={{
                    backgroundColor: selectedProject.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: selectedProject.status === 'active' ? '#166534' : '#374151'
                  }}
                >
                  {selectedProject.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Analytics Module */}
        <TimeAnalyticsModule projectId={selectedProjectId} />
      </div>
    </div>
  )
}

export default GlobalAnalytics
