import { useState, useEffect } from 'react'
import { X, Wrench, Package, CheckSquare, Camera, Plus, Trash2, Info, Flag, User, Calendar, Tag, MapPin, Clock, FolderTree, Layers } from 'lucide-react'
import { Button } from '../UI/Button'
import { colors } from '../../styles/design-tokens'
import { api } from '../../services/api'
import { supabase } from '../../services/auth'
import { useAuth } from '../../context/AuthContext'

/**
 * Task Detail Dialog - Enhanced Todoist-style view
 * Hierarchy: Subtasks → Task → Subcategory → Category → Project
 * Based on Atul Gawande's Checklist Manifesto + Todoist UX
 */
const TaskDetailDialog = ({ item, isOpen, onClose, onUpdate }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('details')
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState({
    tools: [],
    materials: [],
    checklist: [],
    photos: [],
    subtasks: [],
    comments: [],
    projectMembers: [],
    allCategories: [],
    allSubcategories: []
  })
  const [taskData, setTaskData] = useState({
    priority: 4,
    assignee_id: null,
    labels: [],
    due_date: null,
    location: '',
    duration_minutes: null,
    reminder_date: null,
    subcategory_id: null
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
      const detailsData = response.data.data
      setDetails(detailsData)

      // Smart location detection - auto-fill if we can detect a room
      const autoDetectedLocation = item.location || detectLocationFromContext(
        item.description,
        detailsData.subcategory,
        detailsData.category
      )

      // Load Todoist-style fields from item
      // Format dates to YYYY-MM-DD to avoid timezone issues
      const formatDateForInput = (dateString) => {
        if (!dateString) return ''
        // Extract just the date part (YYYY-MM-DD) to avoid timezone conversion
        return dateString.split('T')[0]
      }

      setTaskData({
        priority: item.priority || 4,
        assignee_id: item.assignee_id || null,
        labels: item.labels || [],
        due_date: formatDateForInput(item.due_date),
        location: autoDetectedLocation,
        duration_minutes: item.duration_minutes || null,
        reminder_date: formatDateForInput(item.reminder_date)
      })
    } catch (error) {
      console.error('Error fetching task details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Smart location detection helper
  const detectLocationFromContext = (description, subcategory, category) => {
    if (!description && !subcategory) return ''

    // Common room keywords to search for
    const roomKeywords = [
      'master bedroom', 'master bath', 'master bathroom',
      'bedroom', 'bathroom', 'kitchen', 'living room', 'dining room',
      'hallway', 'basement', 'attic', 'garage', 'laundry',
      'office', 'den', 'family room', 'entry', 'foyer',
      'closet', 'pantry', 'mudroom', 'utility room',
      'powder room', 'guest room', 'storage'
    ]

    const textToSearch = `${description || ''} ${subcategory || ''}`.toLowerCase()

    // Try to find a room keyword in the description or subcategory
    for (const room of roomKeywords) {
      if (textToSearch.includes(room)) {
        // Capitalize first letter of each word
        return room.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }
    }

    // If subcategory looks like a room name (common in punch lists), use it
    // Only if it's not a work type (plumbing, electrical, etc.)
    const workTypes = ['plumbing', 'electrical', 'hvac', 'framing', 'drywall',
                       'flooring', 'roofing', 'siding', 'trim', 'paint']
    const subLower = (subcategory || '').toLowerCase()

    if (subcategory && !workTypes.some(type => subLower.includes(type))) {
      // Subcategory might be a room name
      return subcategory
    }

    // No clear location detected
    return ''
  }

  const updateTaskField = async (field, value) => {
    try {
      // For date fields, ensure we send and store just the date part (YYYY-MM-DD)
      let valueToSend = value
      if (field === 'due_date' || field === 'reminder_date') {
        // If value is empty, send null
        if (!value) {
          valueToSend = null
        } else {
          // Extract just the date part to avoid timezone issues
          valueToSend = value.split('T')[0]
        }
      }

      await api.patch(`/projects/items/${item.id}`, { [field]: valueToSend })

      // Update local state with the clean value
      setTaskData(prev => ({ ...prev, [field]: valueToSend }))

      // Refresh the full task details to ensure we have the latest data
      await fetchTaskDetails()
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      alert(`Failed to update ${field}`)
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
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const fileName = `${item.id}/${timestamp}-${file.name}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-photos')
        .getPublicUrl(fileName)

      // Save photo metadata to database
      const photoData = {
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        photo_type: photoType,
        caption: ''
      }

      await api.post(`/projects/items/${item.id}/photos`, photoData)
      await fetchTaskDetails()
      alert('Photo uploaded successfully!')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo: ' + (error.message || 'Please try again.'))
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
    { id: 'details', label: 'Details', icon: Info },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, count: details.checklist.length },
    { id: 'materials', label: 'Materials', icon: Package, count: details.materials.length },
    { id: 'tools', label: 'Tools', icon: Wrench, count: details.tools.length },
    { id: 'photos', label: 'Photos', icon: Camera, count: details.photos.length },
  ]

  // Priority color mapping (Todoist style)
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Urgent' }
      case 2: return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'High' }
      case 3: return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: 'Medium' }
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: 'Normal' }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{item.description}</h2>
            {details.category && details.subcategory && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                  {details.category}
                </span>
                <span className="text-gray-400">→</span>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-medium">
                  {details.subcategory}
                </span>
              </div>
            )}
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
              {/* Details Tab - Todoist-style fields */}
              {activeTab === 'details' && (
                <DetailsTab
                  taskData={taskData}
                  item={item}
                  details={details}
                  onUpdateField={updateTaskField}
                  getPriorityColor={getPriorityColor}
                />
              )}

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

// Details Tab Component (Todoist-style fields)
const DetailsTab = ({ taskData, item, details, onUpdateField, getPriorityColor }) => {
  const priorityColors = getPriorityColor(taskData.priority)

  return (
    <div className="space-y-6">
      {/* Hierarchy Breadcrumb */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Task Hierarchy</h3>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md font-medium">
            Project
          </span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
            {details.category || 'Category'}
          </span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md font-medium">
            {details.subcategory || 'Subcategory'}
          </span>
          <span className="text-gray-400">→</span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md font-medium">
            This Task
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tasks can have subtasks (checklist items), and roll up to subcategories and categories
        </p>
      </div>

      {/* Priority */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Flag size={16} />
          Priority
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(priority => {
            const colors = getPriorityColor(priority)
            const isSelected = taskData.priority === priority
            return (
              <button
                key={priority}
                onClick={() => onUpdateField('priority', priority)}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `${colors.bg} ${colors.border} ${colors.text} font-semibold`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Flag size={16} className={`mx-auto mb-1 ${isSelected ? colors.text : ''}`} />
                <span className="text-xs block">{colors.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category & Subcategory */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
          <Layers size={16} />
          Move Task to Different Category/Subcategory
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Category Dropdown */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Category
            </label>
            <select
              value={details.categoryId || ''}
              onChange={(e) => {
                // When category changes, we need to update the task's subcategory
                // For now, just show a message - we'll need to select a subcategory first
                const newCategoryId = e.target.value
                if (!newCategoryId) return

                // Find subcategories for this category
                const availableSubcategories = details.allSubcategories?.filter(
                  sub => sub.category_id === newCategoryId
                ) || []

                if (availableSubcategories.length > 0) {
                  // Auto-select first subcategory
                  onUpdateField('subcategory_id', availableSubcategories[0].id)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select Category...</option>
              {details.allCategories?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Dropdown */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Subcategory
            </label>
            <select
              value={details.subcategoryId || ''}
              onChange={(e) => onUpdateField('subcategory_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select Subcategory...</option>
              {details.allSubcategories
                ?.filter(sub => sub.category_id === details.categoryId)
                .map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-purple-700 mt-2">
          Moving a task will reorganize it under a different category and subcategory
        </p>
      </div>

      {/* Due Date */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Calendar size={16} />
          Due Date
        </label>
        <input
          type="date"
          value={taskData.due_date || ''}
          onChange={(e) => onUpdateField('due_date', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Assignee */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <User size={16} />
          Assigned To
        </label>
        <select
          value={taskData.assignee_id || ''}
          onChange={(e) => onUpdateField('assignee_id', e.target.value || null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Unassigned</option>
          {details.projectMembers?.map(member => (
            <option key={member.user_id} value={member.user_id}>
              {member.name || member.email || 'Team Member'}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <MapPin size={16} />
          Location / Room
        </label>
        <input
          type="text"
          value={taskData.location || ''}
          onChange={(e) => onUpdateField('location', e.target.value)}
          placeholder="e.g., Kitchen, Master Bedroom, Garage"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Duration Estimate */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Clock size={16} />
          Estimated Duration (minutes)
        </label>
        <input
          type="number"
          value={taskData.duration_minutes || ''}
          onChange={(e) => onUpdateField('duration_minutes', parseInt(e.target.value) || null)}
          placeholder="e.g., 120"
          min="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Labels/Tags */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Tag size={16} />
          Labels
        </label>
        <input
          type="text"
          value={(taskData.labels || []).join(', ')}
          onChange={(e) => {
            const labels = e.target.value.split(',').map(l => l.trim()).filter(Boolean)
            onUpdateField('labels', labels)
          }}
          placeholder="e.g., electrical, urgent, inspection-required"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Separate multiple labels with commas</p>
        {taskData.labels && taskData.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {taskData.labels.map((label, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Time Logged */}
      {item.actual_hours > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 font-semibold mb-1">
            <Clock size={18} />
            Time Logged
          </div>
          <p className="text-2xl font-bold text-green-900">
            {item.actual_hours.toFixed(1)} hours
          </p>
          <p className="text-xs text-green-700 mt-1">
            Tracked across all time entries for this task
          </p>
        </div>
      )}
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
