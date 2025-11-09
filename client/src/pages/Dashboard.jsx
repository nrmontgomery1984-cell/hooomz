import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { HomeForm } from '../components/Homes/HomeForm'
import { PageHeader } from '../components/UI/PageHeader'
import {
  Home,
  Plus,
  Package,
  DoorOpen,
  FileText,
  Wrench,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FolderKanban
} from 'lucide-react'
import { api } from '../services/api'

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()

  // State
  const [homes, setHomes] = useState([])
  const [selectedHome, setSelectedHome] = useState(null)
  const [maintenance, setMaintenance] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isHomeFormOpen, setIsHomeFormOpen] = useState(false)
  const [editingHome, setEditingHome] = useState(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Fetch dashboard data
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch homes
      const { data: homesResponse } = await api.get('/homes')
      // API returns { success, data, count }
      const homesData = homesResponse?.data || homesResponse || []
      setHomes(homesData)

      // If user has homes, fetch data for first home
      if (homesData && homesData.length > 0) {
        const firstHome = homesData[0]
        setSelectedHome(firstHome)

        // Fetch maintenance tasks
        try {
          const { data: maintenanceData } = await api.get(`/homes/${firstHome.id}/maintenance`)
          // Maintenance returns raw array
          setMaintenance(maintenanceData || [])
        } catch (err) {
          console.error('Error fetching maintenance:', err)
        }

        // Fetch recent materials
        try {
          const { data: materialsResponse } = await api.get(`/homes/${firstHome.id}/materials`)
          // Materials returns { success, data, count }
          const materialsArray = materialsResponse?.data || materialsResponse || []
          setMaterials(Array.isArray(materialsArray) ? materialsArray.slice(0, 5) : [])
        } catch (err) {
          console.error('Error fetching materials:', err)
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate profile completion
  const calculateCompletion = () => {
    if (!selectedHome) return 0

    let score = 0
    const checks = [
      selectedHome.address,
      selectedHome.year_built,
      selectedHome.sqft,
      materials.length > 0,
      maintenance.length > 0
    ]

    checks.forEach(check => {
      if (check) score += 20
    })

    return score
  }

  // Get upcoming maintenance (next 3)
  const getUpcomingMaintenance = () => {
    return maintenance
      .filter(task => new Date(task.next_due) > new Date())
      .sort((a, b) => new Date(a.next_due) - new Date(b.next_due))
      .slice(0, 3)
  }

  // Handle logout
  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Handle home form submit
  const handleHomeSubmit = async (homeData) => {
    if (editingHome) {
      // Update existing home
      const { data: response } = await api.put(`/homes/${editingHome.id}`, homeData)
      const updatedHome = response?.data || response
      setHomes(homes.map(h => h.id === editingHome.id ? updatedHome : h))
      if (selectedHome?.id === editingHome.id) {
        setSelectedHome(updatedHome)
      }
      setEditingHome(null)
    } else {
      // Create new home
      const { data: response } = await api.post('/homes', homeData)
      const newHome = response?.data || response
      setHomes([...homes, newHome])
      setSelectedHome(newHome)
    }
    setIsHomeFormOpen(false)
    fetchDashboardData() // Refresh data
  }

  // Close home form
  const handleCloseHomeForm = () => {
    setIsHomeFormOpen(false)
    setEditingHome(null)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const completion = calculateCompletion()
  const upcomingTasks = getUpcomingMaintenance()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PageHeader
        title="Hooomz Profile™"
        subtitle={`Welcome back, ${user?.email}`}
        showBackButton={false}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {homes.length === 0 ? (
          // Empty State
          <Card className="text-center py-16">
            <Home size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Hooomz Profile™
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started by adding your first property. Track materials, systems,
              maintenance, and documents all in one place.
            </p>
            <Button size="lg" onClick={() => setIsHomeFormOpen(true)}>
              <Plus size={20} className="mr-2" />
              Add Your First Home
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Home Selector */}
            {homes.length > 1 && (
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Select Home</h2>
                  <select
                    value={selectedHome?.id || ''}
                    onChange={(e) => {
                      const home = homes.find(h => h.id === e.target.value)
                      setSelectedHome(home)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {homes.map(home => (
                      <option key={home.id} value={home.id}>
                        {home.address}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            )}

            {/* Home Summary & Profile Completion */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Home Info Card */}
              <Card className="md:col-span-2">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedHome?.address}
                    </h2>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      {selectedHome?.year_built && (
                        <span>Built: {selectedHome.year_built}</span>
                      )}
                      {selectedHome?.sqft && (
                        <span>{selectedHome.sqft.toLocaleString()} sqft</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/home/${selectedHome?.id}`)}
                  >
                    View Full Profile
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Package size={24} className="mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-900">
                      {materials.length}
                    </div>
                    <div className="text-sm text-blue-700">Materials</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Wrench size={24} className="mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-900">
                      {maintenance.length}
                    </div>
                    <div className="text-sm text-green-700">Tasks</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <TrendingUp size={24} className="mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-purple-900">
                      {completion}%
                    </div>
                    <div className="text-sm text-purple-700">Complete</div>
                  </div>
                </div>
              </Card>

              {/* Profile Completion Card */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">Profile Completion</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-primary-600">{completion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <CheckCircle size={16} className="mr-2 text-green-500" />
                    Basic info added
                  </div>
                  {materials.length === 0 && (
                    <div className="flex items-center text-gray-400">
                      <AlertCircle size={16} className="mr-2" />
                      Add materials
                    </div>
                  )}
                  {maintenance.length === 0 && (
                    <div className="flex items-center text-gray-400">
                      <AlertCircle size={16} className="mr-2" />
                      Schedule maintenance
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/home/${selectedHome?.id}/materials`)}
                  className="flex flex-col items-center py-6 h-auto"
                >
                  <Package size={32} className="mb-2" />
                  <span>Add Material</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/home/${selectedHome?.id}/rooms`)}
                  className="flex flex-col items-center py-6 h-auto"
                >
                  <DoorOpen size={32} className="mb-2" />
                  <span>Add Room</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/home/${selectedHome?.id}/documents`)}
                  className="flex flex-col items-center py-6 h-auto"
                >
                  <FileText size={32} className="mb-2" />
                  <span>Upload Document</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/home/${selectedHome?.id}/maintenance`)}
                  className="flex flex-col items-center py-6 h-auto"
                >
                  <Wrench size={32} className="mb-2" />
                  <span>Add Task</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/projects')}
                  className="flex flex-col items-center py-6 h-auto"
                >
                  <FolderKanban size={32} className="mb-2" />
                  <span>Projects</span>
                </Button>
              </div>
            </Card>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Maintenance */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Upcoming Maintenance</h3>
                  <Link
                    to={`/home/${selectedHome?.id}/maintenance`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View All
                  </Link>
                </div>
                {upcomingTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No upcoming maintenance tasks</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{task.name}</div>
                          <div className="text-sm text-gray-600">
                            Due: {new Date(task.next_due).toLocaleDateString()}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <CheckCircle size={18} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recently Added Materials */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Materials</h3>
                  <Link
                    to={`/home/${selectedHome?.id}/materials`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View All
                  </Link>
                </div>
                {materials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No materials added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/home/${selectedHome?.id}/materials`)}
                      >
                        <Package size={20} className="text-primary-600 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {material.category}
                          </div>
                          <div className="text-sm text-gray-600">
                            {material.brand} {material.model && `- ${material.model}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* All Homes Grid (if multiple homes) */}
            {homes.length > 1 && (
              <Card>
                <h3 className="text-lg font-semibold mb-4">All Properties</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {homes.map((home) => (
                    <div
                      key={home.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/home/${home.id}`)}
                    >
                      <Home size={24} className="text-primary-600 mb-2" />
                      <h4 className="font-semibold text-gray-900">{home.address}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {home.year_built && `Built: ${home.year_built}`}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate('/homes/new')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all flex flex-col items-center justify-center text-gray-500 hover:text-primary-600"
                  >
                    <Plus size={32} className="mb-2" />
                    <span className="font-medium">Add New Home</span>
                  </button>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Home Form Modal */}
      <HomeForm
        isOpen={isHomeFormOpen}
        onClose={handleCloseHomeForm}
        onSubmit={handleHomeSubmit}
        home={editingHome}
      />
    </div>
  )
}
