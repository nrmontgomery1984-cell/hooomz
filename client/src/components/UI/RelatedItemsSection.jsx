import { useNavigate } from 'react-router-dom'
import { Button } from './Button'
import {
  Package,
  Settings,
  Wrench,
  FileText,
  DoorOpen,
  ArrowRight
} from 'lucide-react'

export const RelatedItemsSection = ({
  homeId,
  materials = [],
  systems = [],
  maintenance = [],
  rooms = [],
  documents = [],
  onNavigate
}) => {
  const navigate = useNavigate()

  const handleNavigation = (path) => {
    if (onNavigate) onNavigate()
    navigate(path)
  }

  const hasRelatedItems = materials.length > 0 || systems.length > 0 || maintenance.length > 0 || rooms.length > 0 || documents.length > 0

  if (!hasRelatedItems) {
    return (
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(`/home/${homeId}/materials`)}
          >
            <Package size={16} className="mr-1" />
            Materials
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(`/home/${homeId}/systems`)}
          >
            <Settings size={16} className="mr-1" />
            Systems
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(`/home/${homeId}/maintenance`)}
          >
            <Wrench size={16} className="mr-1" />
            Maintenance
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Related Materials */}
      {materials.length > 0 && (
        <div className="border-t pt-4 bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package size={20} className="text-purple-600" />
            <h3 className="font-semibold">Related Materials</h3>
          </div>
          <div className="space-y-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-purple-200"
                onClick={() => handleNavigation(`/home/${homeId}/materials`)}
              >
                <div>
                  <p className="font-medium text-gray-900">{material.category}</p>
                  <p className="text-sm text-gray-600">
                    {material.brand} {material.model && `- ${material.model}`}
                  </p>
                </div>
                <ArrowRight size={20} className="text-purple-600" />
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={() => handleNavigation(`/home/${homeId}/materials`)}
          >
            View All Materials
          </Button>
        </div>
      )}

      {/* Related Systems */}
      {systems.length > 0 && (
        <div className="border-t pt-4 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings size={20} className="text-blue-600" />
            <h3 className="font-semibold">Related Systems</h3>
          </div>
          <div className="space-y-2">
            {systems.map((system) => (
              <div
                key={system.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-blue-200"
                onClick={() => handleNavigation(`/home/${homeId}/systems`)}
              >
                <div>
                  <p className="font-medium text-gray-900">{system.type}</p>
                  <p className="text-sm text-gray-600">
                    {system.brand} {system.model && `- ${system.model}`}
                  </p>
                </div>
                <ArrowRight size={20} className="text-blue-600" />
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={() => handleNavigation(`/home/${homeId}/systems`)}
          >
            View All Systems
          </Button>
        </div>
      )}

      {/* Related Maintenance */}
      {maintenance.length > 0 && (
        <div className="border-t pt-4 bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={20} className="text-green-600" />
            <h3 className="font-semibold">Related Maintenance Tasks</h3>
          </div>
          <div className="space-y-2">
            {maintenance.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-green-200"
                onClick={() => handleNavigation(`/home/${homeId}/maintenance`)}
              >
                <div>
                  <p className="font-medium text-gray-900">{task.name}</p>
                  <p className="text-sm text-gray-600">
                    Due: {task.next_due ? new Date(task.next_due).toLocaleDateString() : 'Not scheduled'}
                  </p>
                </div>
                <ArrowRight size={20} className="text-green-600" />
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={() => handleNavigation(`/home/${homeId}/maintenance`)}
          >
            View All Maintenance
          </Button>
        </div>
      )}

      {/* Related Rooms */}
      {rooms.length > 0 && (
        <div className="border-t pt-4 bg-amber-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <DoorOpen size={20} className="text-amber-600" />
            <h3 className="font-semibold">Related Rooms</h3>
          </div>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-amber-200"
                onClick={() => handleNavigation(`/home/${homeId}/rooms`)}
              >
                <div>
                  <p className="font-medium text-gray-900">{room.name}</p>
                  <p className="text-sm text-gray-600">Floor: {room.floor || 'N/A'}</p>
                </div>
                <ArrowRight size={20} className="text-amber-600" />
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={() => handleNavigation(`/home/${homeId}/rooms`)}
          >
            View All Rooms
          </Button>
        </div>
      )}

      {/* Related Documents */}
      {documents.length > 0 && (
        <div className="border-t pt-4 bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={20} className="text-yellow-600" />
            <h3 className="font-semibold">Related Documents</h3>
          </div>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-yellow-200"
                onClick={() => handleNavigation(`/home/${homeId}/documents`)}
              >
                <div>
                  <p className="font-medium text-gray-900">{doc.category}</p>
                  <p className="text-sm text-gray-600">{doc.file_name}</p>
                </div>
                <ArrowRight size={20} className="text-yellow-600" />
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={() => handleNavigation(`/home/${homeId}/documents`)}
          >
            View All Documents
          </Button>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(`/home/${homeId}/materials`)}
          >
            <Package size={16} className="mr-1" />
            Materials
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(`/home/${homeId}/systems`)}
          >
            <Settings size={16} className="mr-1" />
            Systems
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(`/home/${homeId}/maintenance`)}
          >
            <Wrench size={16} className="mr-1" />
            Maintenance
          </Button>
        </div>
      </div>
    </>
  )
}
