import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMaterials } from '../hooks/useMaterials'
import { useRooms } from '../hooks/useRooms'
import { useSystems } from '../hooks/useSystems'
import { useMaintenance } from '../hooks/useMaintenance'
import { useDocuments } from '../hooks/useDocuments'
import { MaterialCard } from '../components/Materials/MaterialCard'
import { MaterialForm } from '../components/Materials/MaterialForm'
import { MaterialDetailsModal } from '../components/Materials/MaterialDetailsModal'
import { api } from '../services/api'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Dropdown } from '../components/UI/Dropdown'
import { PageHeader } from '../components/UI/PageHeader'
import {
  Plus,
  Package,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react'

export default function Materials() {
  const { homeId } = useParams()
  const navigate = useNavigate()

  // State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Fetch data with filters
  const {
    materials,
    categories,
    loading,
    error,
    createMaterial,
    updateMaterial,
    deleteMaterial
  } = useMaterials(homeId, {
    category: selectedCategory,
    room_id: selectedRoom
  })

  const { rooms } = useRooms(homeId)
  const { systems } = useSystems(homeId)
  const { maintenanceTasks } = useMaintenance(homeId)
  const { documents } = useDocuments(homeId)

  // Handle add material
  const handleAddMaterial = () => {
    setEditingMaterial(null)
    setIsFormOpen(true)
  }

  // Handle material click
  const handleMaterialClick = (material) => {
    setSelectedMaterial(material)
    setIsDetailsOpen(true)
  }

  // Handle form submit
  const handleSubmit = async (materialData) => {
    if (editingMaterial) {
      const { error } = await updateMaterial(editingMaterial.id, materialData)
      if (!error) {
        setEditingMaterial(null)
      }
    } else {
      const { error } = await createMaterial(materialData)
      if (error) {
        throw new Error(error)
      }
    }
  }

  // Handle edit
  const handleEdit = (material) => {
    setEditingMaterial(material)
    setIsFormOpen(true)
  }

  // Handle delete
  const handleDelete = async (materialId) => {
    await deleteMaterial(materialId)
  }

  // Close form
  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMaterial(null)
  }

  // Filter materials by search query
  const filteredMaterials = materials.filter(material => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      material.category?.toLowerCase().includes(query) ||
      material.brand?.toLowerCase().includes(query) ||
      material.model?.toLowerCase().includes(query) ||
      material.color?.toLowerCase().includes(query)
    )
  })

  // Category options for dropdown
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1)
    }))
  ]

  // Room options for dropdown
  const roomOptions = [
    { value: '', label: 'All Rooms' },
    ...rooms.map(room => ({
      value: room.id,
      label: room.name
    }))
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading materials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PageHeader
        title="Materials"
        subtitle="Track flooring, paint, fixtures, and more"
        showBackButton={true}
        backTo={`/home/${homeId}`}
        actions={
          <Button onClick={handleAddMaterial}>
            <Plus size={20} className="mr-2" />
            Add Material
          </Button>
        }
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {/* Filters Bar */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={20}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-48">
              <Dropdown
                options={categoryOptions}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="Category"
              />
            </div>

            {/* Room Filter */}
            {rooms.length > 0 && (
              <div className="w-full md:w-48">
                <Dropdown
                  options={roomOptions}
                  value={selectedRoom}
                  onChange={setSelectedRoom}
                  placeholder="Room"
                />
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''}
            </div>
          </div>
        </Card>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <Card className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {materials.length === 0 ? 'No materials yet' : 'No materials found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {materials.length === 0
                ? 'Track flooring, paint, countertops, fixtures, and more'
                : 'Try adjusting your filters or search query'}
            </p>
            {materials.length === 0 && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus size={20} className="mr-2" />
                Add Your First Material
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClick={() => handleMaterialClick(material)}
              />
            ))}
          </div>
        )}

        {/* Quick Links */}
        {materials.length > 0 && (
          <div className="mt-8 flex justify-center space-x-4">
            <Link to={`/home/${homeId}/rooms`}>
              <Button variant="ghost">
                Manage Rooms
              </Button>
            </Link>
            <Link to={`/home/${homeId}/documents`}>
              <Button variant="ghost">
                View Documents
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Material Form Modal */}
      <MaterialForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        material={editingMaterial}
        categories={categories}
        rooms={rooms}
      />

      {/* Material Details Modal */}
      <MaterialDetailsModal
        material={selectedMaterial}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedMaterial(null)
        }}
        homeId={homeId}
        relatedSystems={systems}
        relatedMaintenance={maintenanceTasks}
        relatedDocuments={documents}
      />
    </div>
  )
}
