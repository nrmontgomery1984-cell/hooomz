import { useState, useEffect } from 'react'
import { X, Wrench, Package, CheckSquare, Camera, Plus, Trash2 } from 'lucide-react'
import { Button } from '../UI/Button'
import { colors } from '../../styles/design-tokens'
import { api } from '../../services/api'

/**
 * Task Detail Dialog - Enhanced view with tools, materials, checklist, and photos
 * Based on Atul Gawande's Checklist Manifesto principles
 */
const TaskDetailDialog = ({ item, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('checklist')
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState({
    tools: [],
    materials: [],
    checklist: [],
    photos: []
  })

  // Fetch task details when dialog opens
  useEffect(() => {
    if (isOpen && item?.id) {
      fetchTaskDetails()
    }
  }, [isOpen, item?.id])

  const fetchTaskDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/projects/items/${item.id}/details`)
      setDetails(response.data.data)
    } catch (error) {
      console.error('Error fetching task details:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleChecklistItem = async (checklistItemId, isCompleted) => {
    try {
      await api.patch(`/projects/items/checklist/${checklistItemId}`, {
        isCompleted: !isCompleted
      })
      // Refresh details
      await fetchTaskDetails()
    } catch (error) {
      console.error('Error toggling checklist item:', error)
    }
  }

  const handlePhotoUpload = async (file, photoType = 'during') => {
    // For now, we'll use a placeholder URL
    // In production, you would upload to cloud storage (S3, Cloudinary, etc.)
    try {
      const photoData = {
        file_url: URL.createObjectURL(file),
        file_name: file.name,
        file_size: file.size,
        photo_type: photoType,
        caption: ''
      }

      await api.post(`/projects/items/${item.id}/photos`, photoData)
      await fetchTaskDetails()
    } catch (error) {
      console.error('Error uploading photo:', error)
    }
  }

  const deletePhoto = async (photoId) => {
    try {
      await api.delete(`/projects/items/photos/${photoId}`)
      await fetchTaskDetails()
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, count: details.checklist.length },
    { id: 'materials', label: 'Materials', icon: Package, count: details.materials.length },
    { id: 'tools', label: 'Tools', icon: Wrench, count: details.tools.length },
    { id: 'photos', label: 'Photos', icon: Camera, count: details.photos.length },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{item.description}</h2>
            <p className="text-sm text-gray-500 mt-1">Task Details & Checklist</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200">
          <div className="flex gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Checklist Tab */}
              {activeTab === 'checklist' && (
                <ChecklistTab
                  checklist={details.checklist}
                  onToggle={toggleChecklistItem}
                />
              )}

              {/* Materials Tab */}
              {activeTab === 'materials' && (
                <MaterialsTab materials={details.materials} />
              )}

              {/* Tools Tab */}
              {activeTab === 'tools' && (
                <ToolsTab tools={details.tools} />
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <PhotosTab
                  photos={details.photos}
                  onUpload={handlePhotoUpload}
                  onDelete={deletePhoto}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onUpdate()
              onClose()
            }}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

// Checklist Tab Component (Atul Gawande style)
const ChecklistTab = ({ checklist, onToggle }) => {
  const criticalItems = checklist.filter(item => item.is_critical)
  const standardItems = checklist.filter(item => !item.is_critical)
  const completedCount = checklist.filter(item => item.is_completed).length

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-blue-600">
            {completedCount} / {checklist.length}
          </span>
        </div>
        <div className="w-full bg-white rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / checklist.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Critical Items */}
      {criticalItems.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <span className="bg-red-100 px-2 py-1 rounded">CRITICAL</span>
            These steps cannot be skipped
          </h3>
          <div className="space-y-2">
            {criticalItems.map(item => (
              <ChecklistItem key={item.id} item={item} onToggle={onToggle} critical />
            ))}
          </div>
        </div>
      )}

      {/* Standard Items */}
      {standardItems.length > 0 && (
        <div>
          {criticalItems.length > 0 && (
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Checks</h3>
          )}
          <div className="space-y-2">
            {standardItems.map(item => (
              <ChecklistItem key={item.id} item={item} onToggle={onToggle} />
            ))}
          </div>
        </div>
      )}

      {checklist.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <CheckSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p>No checklist items yet</p>
          <p className="text-sm mt-1">Add quality control steps for this task</p>
        </div>
      )}
    </div>
  )
}

const ChecklistItem = ({ item, onToggle, critical }) => {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
        item.is_completed
          ? 'bg-green-50 border-green-200'
          : critical
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <button
        onClick={() => onToggle(item.id, item.is_completed)}
        className="flex-shrink-0 mt-0.5"
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            item.is_completed
              ? 'bg-green-600 border-green-600'
              : critical
              ? 'border-red-400'
              : 'border-gray-400'
          }`}
        >
          {item.is_completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </button>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            item.is_completed ? 'line-through text-gray-600' : 'text-gray-900'
          }`}
        >
          {item.description}
        </p>
        {item.completed_at && (
          <p className="text-xs text-gray-500 mt-1">
            Completed {new Date(item.completed_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

// Materials Tab
const MaterialsTab = ({ materials }) => {
  return (
    <div className="space-y-4">
      {materials.length > 0 ? (
        <div className="space-y-2">
          {materials.map(material => (
            <div key={material.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Package size={20} className="text-gray-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{material.name}</p>
                {material.notes && (
                  <p className="text-sm text-gray-500 mt-1">{material.notes}</p>
                )}
              </div>
              {material.quantity && (
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {material.quantity} {material.unit || ''}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p>No materials listed</p>
          <p className="text-sm mt-1">Add materials needed for this task</p>
        </div>
      )}
    </div>
  )
}

// Tools Tab
const ToolsTab = ({ tools }) => {
  return (
    <div className="space-y-4">
      {tools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map(tool => (
            <div key={tool.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Wrench size={20} className="text-gray-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{tool.name}</p>
                {tool.notes && (
                  <p className="text-xs text-gray-500 mt-1">{tool.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Wrench size={48} className="mx-auto mb-4 opacity-30" />
          <p>No tools listed</p>
          <p className="text-sm mt-1">Add tools required for this task</p>
        </div>
      )}
    </div>
  )
}

// Photos Tab
const PhotosTab = ({ photos, onUpload, onDelete }) => {
  const [photoType, setPhotoType] = useState('during')

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      onUpload(file, photoType)
    }
  }

  const photosByType = {
    before: photos.filter(p => p.photo_type === 'before'),
    during: photos.filter(p => p.photo_type === 'during'),
    after: photos.filter(p => p.photo_type === 'after'),
    issue: photos.filter(p => p.photo_type === 'issue'),
    other: photos.filter(p => p.photo_type === 'other')
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <select
            value={photoType}
            onChange={(e) => setPhotoType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="before">Before</option>
            <option value="during">During Work</option>
            <option value="after">After</option>
            <option value="issue">Issue/Problem</option>
            <option value="other">Other</option>
          </select>
          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
              <Camera size={18} />
              <span className="text-sm font-medium">Take/Upload Photo</span>
            </div>
          </label>
        </div>
      </div>

      {/* Photos Grid */}
      {Object.entries(photosByType).map(([type, typePhotos]) => {
        if (typePhotos.length === 0) return null
        return (
          <div key={type}>
            <h3 className="text-sm font-bold text-gray-700 mb-3 capitalize">{type} Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {typePhotos.map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.file_url}
                    alt={photo.caption || 'Task photo'}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => onDelete(photo.id)}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  {photo.caption && (
                    <p className="text-xs text-gray-600 mt-1">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {photos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Camera size={48} className="mx-auto mb-4 opacity-30" />
          <p>No photos yet</p>
          <p className="text-sm mt-1">Document progress with before/during/after photos</p>
        </div>
      )}
    </div>
  )
}

export default TaskDetailDialog
