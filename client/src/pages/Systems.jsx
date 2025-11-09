import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSystems } from '../hooks/useSystems'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { PageHeader } from '../components/UI/PageHeader'
import { SystemDetailsModal } from '../components/Systems/SystemDetailsModal'
import { SystemForm } from '../components/Systems/SystemForm'
import { Plus, Settings as SettingsIcon, AlertCircle } from 'lucide-react'

export default function Systems() {
  const { homeId } = useParams()
  const { systems, categories, loading, error, createSystem, updateSystem, deleteSystem } = useSystems(homeId)
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSystem, setEditingSystem] = useState(null)

  const handleSystemClick = (system) => {
    setSelectedSystem(system)
    setIsDetailsOpen(true)
  }

  const handleAddSystem = () => {
    setEditingSystem(null)
    setIsFormOpen(true)
  }

  const handleEdit = (system) => {
    setEditingSystem(system)
    setIsFormOpen(true)
  }

  const handleDelete = async (systemId) => {
    await deleteSystem(systemId)
  }

  const handleSubmit = async (systemData) => {
    if (editingSystem) {
      const { error } = await updateSystem(editingSystem.id, systemData)
      if (!error) {
        setEditingSystem(null)
      }
    } else {
      const { error } = await createSystem(systemData)
      if (error) {
        throw new Error(error)
      }
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingSystem(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading systems...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Systems"
        subtitle="Manage HVAC, electrical, plumbing, and more"
        showBackButton={true}
        backTo={`/home/${homeId}`}
        actions={
          <Button onClick={handleAddSystem}>
            <Plus size={20} className="mr-2" />
            Add System
          </Button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {systems.length === 0 ? (
          <Card className="text-center py-12">
            <SettingsIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No systems yet</h3>
            <p className="text-gray-600 mb-6">Track HVAC, electrical, plumbing, and more</p>
            <Button onClick={handleAddSystem}>
              <Plus size={20} className="mr-2" />
              Add Your First System
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systems.map((system) => (
              <Card
                key={system.id}
                className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary-500"
                onClick={() => handleSystemClick(system)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold">{system.type}</h3>
                  {system.category && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {system.category}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Brand: {system.brand || 'N/A'}</p>
                  <p>Model: {system.model || 'N/A'}</p>
                  <p>Serial: {system.serial || 'N/A'}</p>
                  <p>Installed: {system.install_date ? new Date(system.install_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <p className="text-xs text-primary-600 mt-3">Click for details →</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* System Form Modal */}
      <SystemForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        system={editingSystem}
        categories={categories || []}
      />

      {/* System Details Modal */}
      <SystemDetailsModal
        system={selectedSystem}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedSystem(null)
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
