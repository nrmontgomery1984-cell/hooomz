import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '../UI/Button'
import { api } from '../../services/api'
import { LOCATION_OPTIONS, LOCATION_KEYWORDS } from '../../utils/locationOptions'

/**
 * Add New Task Dialog
 * Allows users to create a new task in a category/subcategory
 */
const AddTaskDialog = ({ isOpen, onClose, projectId, onTaskCreated }) => {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    category_id: '',
    subcategory_id: '',
    description: '',
    notes: '',
    estimated_hours: '',
    status: 'pending',
    location: '' // Room/location field (e.g., Kitchen, Master Bedroom, Exterior)
  })

  // Fetch categories and subcategories when dialog opens
  useEffect(() => {
    if (isOpen && projectId) {
      fetchCategories()
    }
  }, [isOpen, projectId])

  const fetchCategories = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/scope`)
      console.log('[AddTaskDialog] Full API response:', response.data)

      // The response is { data: { project_data, categories: [...] } }
      const projectData = response.data.data
      console.log('[AddTaskDialog] Project data:', projectData)
      console.log('[AddTaskDialog] Categories:', projectData?.categories)

      setCategories(projectData?.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Predictive category/subcategory/location suggestion based on task description
  const suggestCategoryAndSubcategory = (description) => {
    if (!description || !Array.isArray(categories) || categories.length === 0) return

    const lowerDesc = description.toLowerCase()
    let bestMatch = null
    let bestScore = 0

    // Extract location from description (using shared location keywords)
    let detectedLocation = ''
    for (const loc of LOCATION_KEYWORDS) {
      if (lowerDesc.includes(loc.toLowerCase())) {
        detectedLocation = loc
        break // Take first (longest) match since keywords are pre-sorted by length
      }
    }

    // Enhanced keyword matching with weighted scoring
    categories.forEach(category => {
      category.subcategories?.forEach(subcategory => {
        let score = 0

        // Get words from category and subcategory (filter out very short words)
        const categoryWords = category.name.toLowerCase().split(/[\s,&\-/]+/).filter(w => w.length > 2)
        const subcategoryWords = subcategory.name.toLowerCase().split(/[\s,&\-/]+/).filter(w => w.length > 2)

        // Exact phrase match in subcategory (highest weight)
        if (lowerDesc.includes(subcategory.name.toLowerCase())) {
          score += 100
        }

        // Exact phrase match in category (high weight)
        if (lowerDesc.includes(category.name.toLowerCase())) {
          score += 50
        }

        // Match individual subcategory words (medium-high weight)
        subcategoryWords.forEach(word => {
          if (lowerDesc.includes(word)) {
            score += 10
          }
        })

        // Match individual category words (medium weight)
        categoryWords.forEach(word => {
          if (lowerDesc.includes(word)) {
            score += 5
          }
        })

        // Specific action keywords mapping
        const actionKeywords = {
          'install': ['electrical', 'hvac', 'plumbing', 'finish carpentry'],
          'excavate': ['excavation'],
          'pour': ['foundation', 'concrete'],
          'frame': ['framing'],
          'drywall': ['drywall'],
          'paint': ['paint', 'drywall'],
          'tile': ['tile'],
          'floor': ['flooring'],
          'roof': ['roofing'],
          'siding': ['siding', 'building envelope'],
          'trim': ['finish carpentry'],
          'casing': ['finish carpentry'],
          'baseboard': ['finish carpentry'],
          'door': ['finish carpentry', 'framing'],
          'window': ['framing'],
          'electrical': ['electrical'],
          'plumbing': ['plumbing'],
          'hvac': ['hvac'],
          'duct': ['hvac'],
          'wire': ['electrical'],
          'pipe': ['plumbing'],
          'fixture': ['plumbing', 'electrical'],
          'outlet': ['electrical'],
          'receptacle': ['electrical'],
          'switch': ['electrical'],
          'light': ['electrical'],
          'pot light': ['electrical'],
          'pendant': ['electrical'],
          'sconce': ['electrical'],
          'fan': ['electrical', 'hvac'],
          'toilet': ['plumbing'],
          'sink': ['plumbing'],
          'shower': ['plumbing', 'tile'],
          'bathtub': ['plumbing'],
          'tub': ['plumbing'],
          'faucet': ['plumbing'],
          'landscape': ['landscaping'],
          'grade': ['excavation', 'landscaping'],
          'grading': ['landscaping'],
          'sod': ['landscaping'],
          'deck': ['hardscaping'],
          'patio': ['hardscaping'],
          'paving': ['hardscaping'],
          'stairs': ['stairs'],
          'stair': ['stairs'],
          'railing': ['stairs'],
          'millwork': ['millwork'],
          'cabinet': ['millwork'],
          'countertop': ['millwork'],
          'vanity': ['millwork'],
          'shelving': ['millwork'],
          'excavation': ['excavation'],
          'foundation': ['foundation'],
          'concrete': ['foundation'],
          'insulation': ['drywall', 'building envelope'],
          'membrane': ['building envelope'],
          'wrb': ['building envelope'],
          'dishwasher': ['plumbing'],
          'hose bib': ['plumbing'],
          'sump pump': ['plumbing'],
          'wash box': ['plumbing'],
          'exhaust': ['electrical'],
          'doorbell': ['electrical'],
          'undercabinet': ['electrical'],
          '220v': ['electrical'],
          'panel': ['electrical'],
          'gfci': ['electrical'],
          'mini split': ['hvac'],
          'air exchanger': ['hvac'],
          'fireplace': ['hvac'],
          'laminate': ['flooring'],
          'hardwood': ['flooring'],
          'carpet': ['flooring'],
          'lvt': ['flooring'],
          'ditra': ['flooring'],
          'pocket': ['finish carpentry'],
          'closet': ['finish carpentry'],
          'parging': ['masonry'],
          'stone': ['masonry'],
          'gutters': ['roofing'],
          'gutter': ['roofing'],
          'asphalt': ['roofing'],
          'metal': ['roofing'],
          'sheathing': ['framing'],
          'beam': ['framing'],
          'lvl': ['framing'],
          'steel': ['framing'],
          'formwork': ['foundation'],
          'technopost': ['foundation'],
          'permit': ['design and planning'],
          'design': ['design and planning'],
          'schedule': ['design and planning'],
          'budget': ['design and planning'],
          'engineering': ['design and planning'],
          'soffit': ['building envelope'],
          'fascia': ['building envelope'],
          'rainscreen': ['building envelope'],
          'vinyl': ['siding'],
          'hardie': ['siding'],
          'fence': ['hardscaping'],
          'shed': ['hardscaping'],
          'barn': ['hardscaping'],
          'pantry': ['millwork'],
          'bar': ['millwork'],
          'laundry': ['millwork'],
          'backsplash': ['tile'],
          'shower doors': ['tile'],
          'tread': ['stairs'],
          'riser': ['stairs'],
          'landing': ['stairs'],
          'nosing': ['stairs'],
          'stringer': ['stairs']
        }

        // Boost score based on action keywords
        Object.entries(actionKeywords).forEach(([keyword, relatedCategories]) => {
          if (lowerDesc.includes(keyword)) {
            relatedCategories.forEach(cat => {
              if (category.name.toLowerCase().includes(cat) || subcategory.name.toLowerCase().includes(cat)) {
                score += 15
              }
            })
          }
        })

        // Update best match if this score is better
        if (score > bestScore) {
          bestScore = score
          bestMatch = {
            category_id: category.id,
            subcategory_id: subcategory.id
          }
        }
      })
    })

    // Apply suggestions if we found matches (require minimum score threshold)
    if (bestMatch && bestScore >= 5) {
      setFormData(prev => ({
        ...prev,
        category_id: bestMatch.category_id,
        subcategory_id: bestMatch.subcategory_id,
        location: detectedLocation || prev.location
      }))
    } else if (detectedLocation) {
      // Even if no category match, still apply location
      setFormData(prev => ({
        ...prev,
        location: detectedLocation
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.description || !formData.subcategory_id) {
      alert('Please fill in task description and select a subcategory')
      return
    }

    try {
      setLoading(true)

      const taskData = {
        description: formData.description,
        notes: formData.notes || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        status: formData.status,
        location: formData.location || null,
        display_order: 999 // Will be added at the end
      }

      await api.post(`/projects/subcategories/${formData.subcategory_id}/items`, taskData)

      // Reset form
      setFormData({
        category_id: '',
        subcategory_id: '',
        description: '',
        notes: '',
        estimated_hours: '',
        status: 'pending',
        location: ''
      })

      // Notify parent and close
      onTaskCreated()
      onClose()
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get subcategories for selected category
  const selectedCategory = Array.isArray(categories) ? categories.find(c => c.id === formData.category_id) : null
  const subcategories = selectedCategory?.subcategories || []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  category_id: e.target.value,
                  subcategory_id: '' // Reset subcategory when category changes
                })
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a category</option>
              {Array.isArray(categories) && categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory *
            </label>
            <select
              value={formData.subcategory_id}
              onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!formData.category_id}
              required
            >
              <option value="">Select a subcategory</option>
              {Array.isArray(subcategories) && subcategories.map(subcategory => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            {!formData.category_id && (
              <p className="text-xs text-gray-500 mt-1">Please select a category first</p>
            )}
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => {
                const newDescription = e.target.value
                setFormData({ ...formData, description: newDescription })

                // Auto-suggest category/subcategory after user stops typing (debounced)
                if (newDescription.length >= 3) {
                  suggestCategoryAndSubcategory(newDescription)
                }
              }}
              placeholder="e.g., Install ceiling fan in master bedroom"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Category, subcategory, and location will be suggested automatically based on your description
            </p>
          </div>

          {/* Location / Room */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location / Room (Optional)
            </label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a location...</option>
              {Object.entries(LOCATION_OPTIONS).map(([group, locations]) => (
                <optgroup key={group} label={group}>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This will be auto-populated when detected in your description
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details about the task..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Hours (Optional)
            </label>
            <input
              type="number"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
              placeholder="e.g., 2.5"
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTaskDialog
