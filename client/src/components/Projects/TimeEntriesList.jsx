import { useState, useEffect } from 'react'
import { Card } from '../UI/Card'
import { Button } from '../UI/Button'
import { Upload, Check, X, Coffee, CheckCircle2 } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ManualTimeEntryDialog from './ManualTimeEntryDialog'

/**
 * Time Entries List Component
 * Shows all time entries with lunch toggle and manager approval
 */
const TimeEntriesList = ({ projectId }) => {
  const { user } = useAuth()
  const [timeEntries, setTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('member')
  const [showManualDialog, setShowManualDialog] = useState(false)

  const fetchEntries = async () => {
    try {
      setLoading(true)

      // Fetch user role
      const membersResponse = await api.get(`/projects/${projectId}/members`)
      const currentMember = membersResponse.data.data?.find(m => m.user_id === user?.id)
      if (currentMember) {
        setUserRole(currentMember.role)
      }

      // Fetch time entries
      const entriesResponse = await api.get(`/projects/${projectId}/time-entries`)
      setTimeEntries(entriesResponse.data.data || [])
    } catch (err) {
      console.error('Error fetching time entries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && user) {
      fetchEntries()
    }
  }, [projectId, user])

  const handleToggleLunch = async (entryId, currentlyDeducted) => {
    try {
      await api.post(`/time-entries/${entryId}/toggle-lunch`, {
        deduct_lunch: !currentlyDeducted
      })
      fetchEntries()
    } catch (err) {
      console.error('Error toggling lunch:', err)
      alert('Failed to toggle lunch deduction')
    }
  }

  const handleToggleApproval = async (entryId, currentlyApproved) => {
    try {
      if (currentlyApproved) {
        await api.post(`/time-entries/${entryId}/unapprove`)
      } else {
        await api.post(`/time-entries/${entryId}/approve`, {
          approver_id: user.id
        })
      }
      fetchEntries()
    } catch (err) {
      console.error('Error toggling approval:', err)
      alert('Failed to toggle approval')
    }
  }

  const handleManualEntryCreated = () => {
    setShowManualDialog(false)
    fetchEntries()
  }

  const isAdmin = userRole === 'admin' || userRole === 'owner'

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">Loading entries...</p>
      </Card>
    )
  }

  // Group entries by date
  const entriesByDate = timeEntries.reduce((acc, entry) => {
    const date = new Date(entry.start_time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {})

  return (
    <>
      <div className="space-y-4">
        {/* Header with Manual Entry Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Time Entries</h3>
          <Button
            variant="secondary"
            onClick={() => setShowManualDialog(true)}
          >
            <Upload size={18} className="mr-2" />
            Manual Entry
          </Button>
        </div>

        {/* Entries List */}
        {Object.keys(entriesByDate).length === 0 ? (
          <Card className="p-8">
            <p className="text-gray-500 text-center">No time entries yet</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(entriesByDate)
              .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
              .map(([date, entries]) => (
                <Card key={date} className="p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{date}</h4>
                  <div className="space-y-2">
                    {entries.map((entry) => {
                      const hours = ((entry.duration_minutes || 0) / 60).toFixed(2)
                      const startTime = new Date(entry.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      const endTime = entry.end_time
                        ? new Date(entry.end_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Running...'

                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {entry.worker_name}
                              </span>
                              {entry.is_manual_entry && (
                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                  Manual
                                </span>
                              )}
                              {entry.approved_by_manager && (
                                <CheckCircle2 size={16} className="text-green-600" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {entry.scope_item?.description || 'No task'} •{' '}
                              {startTime} - {endTime} • {hours}h
                              {entry.lunch_deducted && ' (lunch deducted)'}
                            </div>
                            {entry.notes && (
                              <div className="text-xs text-gray-500 mt-1">{entry.notes}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {/* Lunch Toggle */}
                            <button
                              onClick={() => handleToggleLunch(entry.id, entry.lunch_deducted)}
                              className={`p-2 rounded-lg transition-colors ${
                                entry.lunch_deducted
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                              }`}
                              title={entry.lunch_deducted ? 'Lunch deducted' : 'Add lunch deduction'}
                            >
                              <Coffee size={18} />
                            </button>

                            {/* Approval Toggle (Admin Only) */}
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  handleToggleApproval(entry.id, entry.approved_by_manager)
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  entry.approved_by_manager
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                }`}
                                title={
                                  entry.approved_by_manager
                                    ? 'Approved by manager'
                                    : 'Approve entry'
                                }
                              >
                                {entry.approved_by_manager ? (
                                  <Check size={18} />
                                ) : (
                                  <X size={18} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Manual Entry Dialog */}
      <ManualTimeEntryDialog
        projectId={projectId}
        isOpen={showManualDialog}
        onClose={() => setShowManualDialog(false)}
        onSuccess={handleManualEntryCreated}
      />
    </>
  )
}

export default TimeEntriesList
