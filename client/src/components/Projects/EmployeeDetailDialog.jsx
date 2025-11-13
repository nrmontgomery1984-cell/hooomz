import { useState, useEffect } from 'react'
import { X, Save, Calendar, Phone, Mail, User, Briefcase, DollarSign, AlertCircle, Clock, Check, XCircle } from 'lucide-react'
import { Button } from '../UI/Button'
import { api } from '../../services/api'

const EmployeeDetailDialog = ({ employee, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('details')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    hire_date: '',
    position: '',
    department: '',
    hourly_rate: '',
    is_active: true,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: ''
  })
  const [timeOffRequests, setTimeOffRequests] = useState([])
  const [showTimeOffForm, setShowTimeOffForm] = useState(false)
  const [newTimeOffRequest, setNewTimeOffRequest] = useState({
    request_type: 'vacation',
    start_date: '',
    end_date: '',
    total_days: 1,
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [loadingTimeOff, setLoadingTimeOff] = useState(false)

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        hire_date: employee.hire_date || '',
        position: employee.position || '',
        department: employee.department || '',
        hourly_rate: employee.hourly_rate || '',
        is_active: employee.is_active ?? true,
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        emergency_contact_relationship: employee.emergency_contact_relationship || '',
        street_address: employee.street_address || '',
        city: employee.city || '',
        state: employee.state || '',
        zip_code: employee.zip_code || '',
        notes: employee.notes || ''
      })
      fetchTimeOffRequests()
    }
  }, [employee])

  const fetchTimeOffRequests = async () => {
    if (!employee?.id) return

    try {
      setLoadingTimeOff(true)
      const response = await api.get(`/employees/${employee.id}/time-off`)
      setTimeOffRequests(response.data.data || [])
    } catch (error) {
      console.error('Error fetching time off requests:', error)
    } finally {
      setLoadingTimeOff(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      if (employee) {
        // Update existing employee
        await api.put(`/employees/${employee.id}`, formData)
      } else {
        // Create new employee
        await api.post('/employees', formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Failed to save employee')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTimeOffRequest = async () => {
    if (!employee?.id) return

    if (!newTimeOffRequest.start_date || !newTimeOffRequest.end_date) {
      alert('Please select start and end dates')
      return
    }

    try {
      await api.post(`/employees/${employee.id}/time-off`, {
        ...newTimeOffRequest,
        status: 'pending'
      })
      setShowTimeOffForm(false)
      setNewTimeOffRequest({
        request_type: 'vacation',
        start_date: '',
        end_date: '',
        total_days: 1,
        notes: ''
      })
      fetchTimeOffRequests()
    } catch (error) {
      console.error('Error creating time off request:', error)
      alert('Failed to create time off request')
    }
  }

  const handleApproveTimeOff = async (requestId) => {
    if (!confirm('Approve this time off request?')) return

    try {
      await api.post(`/employees/${employee.id}/time-off/${requestId}/approve`)
      fetchTimeOffRequests()
    } catch (error) {
      console.error('Error approving time off:', error)
      alert('Failed to approve time off request')
    }
  }

  const handleDenyTimeOff = async (requestId) => {
    const reason = prompt('Please provide a reason for denial:')
    if (!reason) return

    try {
      await api.post(`/employees/${employee.id}/time-off/${requestId}/deny`, { reason })
      fetchTimeOffRequests()
    } catch (error) {
      console.error('Error denying time off:', error)
      alert('Failed to deny time off request')
    }
  }

  const handleCancelTimeOff = async (requestId) => {
    if (!confirm('Cancel this time off request?')) return

    try {
      await api.post(`/employees/${employee.id}/time-off/${requestId}/cancel`)
      fetchTimeOffRequests()
    } catch (error) {
      console.error('Error cancelling time off:', error)
      alert('Failed to cancel time off request')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: Check },
      denied: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle }
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} rounded text-xs font-medium flex items-center gap-1 w-fit`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getRequestTypeLabel = (type) => {
    const labels = {
      vacation: 'Vacation',
      sick: 'Sick Leave',
      personal: 'Personal',
      unpaid: 'Unpaid',
      other: 'Other'
    }
    return labels[type] || type
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              {employee ? (
                <span className="text-blue-600 font-bold text-lg">
                  {formData.first_name?.[0]}{formData.last_name?.[0]}
                </span>
              ) : (
                <User size={24} className="text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {employee ? `${formData.first_name} ${formData.last_name}` : 'New Employee'}
              </h2>
              <p className="text-sm text-gray-500">{formData.position || 'Employee details'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Details
            </button>
            {employee && (
              <button
                onClick={() => setActiveTab('timeoff')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'timeoff'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Time Off
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hire Date
                    </label>
                    <input
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Active Employee
                    </label>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                      placeholder="e.g., Spouse, Parent"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.street_address}
                      onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about this employee..."
                />
              </div>
            </div>
          )}

          {activeTab === 'timeoff' && (
            <div className="space-y-6">
              {/* Add Time Off Request Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Time Off Requests</h3>
                <Button
                  onClick={() => setShowTimeOffForm(!showTimeOffForm)}
                  variant="outline"
                  size="sm"
                >
                  {showTimeOffForm ? 'Cancel' : 'Request Time Off'}
                </Button>
              </div>

              {/* Time Off Request Form */}
              {showTimeOffForm && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-4">New Time Off Request</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={newTimeOffRequest.request_type}
                        onChange={(e) => setNewTimeOffRequest({ ...newTimeOffRequest, request_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="vacation">Vacation</option>
                        <option value="sick">Sick Leave</option>
                        <option value="personal">Personal</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Days *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={newTimeOffRequest.total_days}
                        onChange={(e) => setNewTimeOffRequest({ ...newTimeOffRequest, total_days: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={newTimeOffRequest.start_date}
                        onChange={(e) => setNewTimeOffRequest({ ...newTimeOffRequest, start_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={newTimeOffRequest.end_date}
                        onChange={(e) => setNewTimeOffRequest({ ...newTimeOffRequest, end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={newTimeOffRequest.notes}
                        onChange={(e) => setNewTimeOffRequest({ ...newTimeOffRequest, notes: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any additional notes..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowTimeOffForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTimeOffRequest}>
                      Submit Request
                    </Button>
                  </div>
                </div>
              )}

              {/* Time Off Requests List */}
              {loadingTimeOff ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : timeOffRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No time off requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeOffRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">
                              {getRequestTypeLabel(request.request_type)}
                            </span>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <strong>Dates:</strong> {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                            </p>
                            <p>
                              <strong>Duration:</strong> {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                            </p>
                            {request.notes && (
                              <p>
                                <strong>Notes:</strong> {request.notes}
                              </p>
                            )}
                            {request.denial_reason && (
                              <p className="text-red-600">
                                <strong>Denial Reason:</strong> {request.denial_reason}
                              </p>
                            )}
                          </div>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveTimeOff(request.id)}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDenyTimeOff(request.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Deny
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelTimeOff(request.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'details' && (
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Employee'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeeDetailDialog
