import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '../UI/Button'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * Manual Time Entry Dialog
 * Allows creating time entries manually with date/time pickers
 */
const ManualTimeEntryDialog = ({ projectId, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth()
  const [workerName, setWorkerName] = useState(localStorage.getItem('workerName') || '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [projectScope, setProjectScope] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [workersList, setWorkersList] = useState(() => {
    const saved = localStorage.getItem('workersList')
    return saved ? JSON.parse(saved) : ['Nathan', 'Nishant']
  })

  useEffect(() => {
    const loadProjectScope = async () => {
      try {
        const response = await api.get(`/projects/${projectId}/scope`)
        setProjectScope(response.data.data)
      } catch (err) {
        console.error('Error loading project scope:', err)
      }
    }

    if (projectId && isOpen) {
      loadProjectScope()
      // Set default to today
      const today = new Date().toISOString().split('T')[0]
      setStartDate(today)
      setEndDate(today)
    }
  }, [projectId, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!workerName.trim()) {
      alert('Please select a worker')
      return
    }

    if (!selectedItemId) {
      alert('Please select a task')
      return
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      alert('Please fill in all date/time fields')
      return
    }

    const startDateTime = new Date(`${startDate}T${startTime}`)
    const endDateTime = new Date(`${endDate}T${endTime}`)

    if (endDateTime <= startDateTime) {
      alert('End time must be after start time')
      return
    }

    try {
      setSubmitting(true)
      await api.post('/time-entries/manual', {
        scope_item_id: selectedItemId,
        worker_name: workerName,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes,
        created_by: user.id
      })

      localStorage.setItem('workerName', workerName)
      onSuccess()
      // Reset form
      setSelectedCategory('')
      setSelectedSubcategory('')
      setSelectedItemId('')
      setNotes('')
    } catch (err) {
      console.error('Error creating manual entry:', err)
      alert('Failed to create manual entry')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const categories = projectScope?.categories || []
  const subcategories = selectedCategory
    ? categories.find(c => c.id === selectedCategory)?.subcategories || []
    : []
  const tasks = selectedSubcategory
    ? subcategories.find(s => s.id === selectedSubcategory)?.items || []
    : []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Manual Time Entry</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Worker Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker *
            </label>
            <select
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select worker...</option>
              {workersList.map(worker => (
                <option key={worker} value={worker}>{worker}</option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedSubcategory('')
                setSelectedItemId('')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Subcategory Selection */}
          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory *
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => {
                  setSelectedSubcategory(e.target.value)
                  setSelectedItemId('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select subcategory...</option>
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Task Selection */}
          {selectedSubcategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select task...</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.description}</option>
                ))}
              </select>
            </div>
          )}

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional notes..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium">Automatic Processing:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Time will be rounded up to the nearest 15 minutes</li>
              <li>Days over 6 hours will have 30 minutes deducted for lunch</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ManualTimeEntryDialog
