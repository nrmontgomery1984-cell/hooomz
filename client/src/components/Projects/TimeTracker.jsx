import { useState, useEffect } from 'react'
import { Card } from '../UI/Card'
import { Button } from '../UI/Button'
import { Play, Square, Clock } from 'lucide-react'
import { useTimeTracking } from '../../hooks/useProjects'
import * as projectsApi from '../../services/projectsApi'

/**
 * TimeTracker Component
 * Timer widget with dropdown restricted to project scope items
 */
const TimeTracker = ({ projectId }) => {
  const [workerName, setWorkerName] = useState(localStorage.getItem('workerName') || '')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [scopeItems, setScopeItems] = useState([])
  const [notes, setNotes] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [newWorkerName, setNewWorkerName] = useState('')
  const [workersList, setWorkersList] = useState(() => {
    const saved = localStorage.getItem('workersList')
    return saved ? JSON.parse(saved) : ['Nathan', 'Nishant']
  })

  const { activeEntry, startTimer, stopTimer, checkActiveEntry } = useTimeTracking(projectId)

  // Load scope items for dropdown
  useEffect(() => {
    const loadScopeItems = async () => {
      try {
        const items = await projectsApi.getAllScopeItems(projectId)
        setScopeItems(items)
      } catch (err) {
        console.error('Error loading scope items:', err)
      }
    }

    if (projectId) {
      loadScopeItems()
    }
  }, [projectId])

  // Check for active entry on mount
  useEffect(() => {
    if (workerName) {
      checkActiveEntry(workerName)
    }
  }, [workerName, checkActiveEntry])

  // Update elapsed time for active entry
  useEffect(() => {
    if (!activeEntry) {
      setElapsedTime(0)
      return
    }

    const startTime = new Date(activeEntry.start_time)

    const updateElapsed = () => {
      const now = new Date()
      const diff = Math.floor((now - startTime) / 1000) // seconds
      setElapsedTime(diff)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [activeEntry])

  const handleStartTimer = async () => {
    if (!workerName.trim()) {
      alert('Please enter your name')
      return
    }

    if (!selectedItemId) {
      alert('Please select a task from the scope of work')
      return
    }

    try {
      localStorage.setItem('workerName', workerName)
      await startTimer(selectedItemId, workerName, notes)
      setNotes('')
      setSelectedItemId('')
    } catch (err) {
      console.error('Error starting timer:', err)
      alert('Failed to start timer')
    }
  }

  const handleStopTimer = async () => {
    if (!activeEntry) return

    try {
      await stopTimer(activeEntry.id)
      setElapsedTime(0)
    } catch (err) {
      console.error('Error stopping timer:', err)
      alert('Failed to stop timer')
    }
  }

  const handleAddWorker = () => {
    if (!newWorkerName.trim()) {
      alert('Please enter a worker name')
      return
    }

    if (workersList.includes(newWorkerName.trim())) {
      alert('This worker already exists')
      return
    }

    const updatedList = [...workersList, newWorkerName.trim()]
    setWorkersList(updatedList)
    localStorage.setItem('workersList', JSON.stringify(updatedList))
    setWorkerName(newWorkerName.trim())
    setNewWorkerName('')
    setShowAddWorker(false)
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatItemLabel = (item) => {
    // Format: Category > Subcategory > Task
    const category = item.subcategory?.category?.name || 'Unknown'
    const subcategory = item.subcategory?.name || 'Unknown'
    return `${category} > ${subcategory} > ${item.description}`
  }

  return (
    <Card className="bg-gradient-to-r from-primary-50 to-blue-50">
      <div className="flex items-center space-x-2 mb-4">
        <Clock size={24} className="text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Time Tracker</h3>
      </div>

      {activeEntry ? (
        /* Active Timer Display */
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border-2 border-primary-300">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-primary-600 mb-2">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-sm text-gray-600 mb-1">
                <strong>{activeEntry.worker_name}</strong> working on:
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {activeEntry.scope_item?.description || 'Task'}
              </p>
              {activeEntry.notes && (
                <p className="text-xs text-gray-500 mt-2">{activeEntry.notes}</p>
              )}
            </div>
          </div>

          <Button
            variant="danger"
            className="w-full"
            onClick={handleStopTimer}
          >
            <Square size={20} className="mr-2" />
            Stop Timer
          </Button>
        </div>
      ) : (
        /* Start Timer Form */
        <div className="space-y-4">
          {/* Worker Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            {!showAddWorker ? (
              <div className="space-y-2">
                <select
                  value={workerName}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowAddWorker(true)
                    } else {
                      setWorkerName(e.target.value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select your name --</option>
                  {workersList.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="__add_new__">+ Add New Worker</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Enter new worker name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleAddWorker}
                    className="flex-1"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddWorker(false)
                      setNewWorkerName('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Task Selection - ONLY SCOPE ITEMS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Task <span className="text-xs text-gray-500">(Scope items only)</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Select a task from scope --</option>
              {scopeItems
                .filter(item => item.status !== 'completed' && item.status !== 'cancelled')
                .map(item => (
                  <option key={item.id} value={item.id}>
                    {formatItemLabel(item)}
                  </option>
                ))
              }
            </select>
            {scopeItems.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No scope items available. Add tasks to the project scope first.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this work session..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Start Button */}
          <Button
            className="w-full"
            onClick={handleStartTimer}
            disabled={!workerName || !selectedItemId}
          >
            <Play size={20} className="mr-2" />
            Start Timer
          </Button>
        </div>
      )}
    </Card>
  )
}

export default TimeTracker
