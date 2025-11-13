import { useState, useEffect } from 'react'
import { Users, Plus, Search, Phone, Mail, Calendar, AlertCircle, Check, X as XIcon } from 'lucide-react'
import { ModernCard } from '../../UI/ModernCard'
import { Button } from '../../UI/Button'
import EmployeeDetailDialog from '../EmployeeDetailDialog'
import { api } from '../../../services/api'

const EmployeesModule = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [showActiveOnly])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/employees?activeOnly=${showActiveOnly}`)
      setEmployees(response.data.data)
    } catch (error) {
      console.error('Error fetching employees:', error)
      alert('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee)
    setIsDetailDialogOpen(true)
  }

  const handleAddEmployee = () => {
    setSelectedEmployee(null)
    setIsAddDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDetailDialogOpen(false)
    setIsAddDialogOpen(false)
    setSelectedEmployee(null)
    fetchEmployees() // Refresh list
  }

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      employee.first_name?.toLowerCase().includes(searchLower) ||
      employee.last_name?.toLowerCase().includes(searchLower) ||
      employee.email?.toLowerCase().includes(searchLower) ||
      employee.phone?.includes(searchTerm) ||
      employee.position?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadge = (employee) => {
    if (!employee.is_active) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
          Inactive
        </span>
      )
    }
    return (
      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
        <Check size={12} />
        Active
      </span>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="text-gray-600 mt-1">Manage your team members</p>
        </div>
        <ModernCard className="p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </ModernCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="text-gray-600 mt-1">Manage your team members and time off requests</p>
        </div>
        <Button
          onClick={handleAddEmployee}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Add Employee
        </Button>
      </div>

      {/* Search and Filters */}
      <ModernCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or position..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activeOnly"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="activeOnly" className="text-sm text-gray-700">
              Active only
            </label>
          </div>
        </div>
      </ModernCard>

      {/* Employee List */}
      {filteredEmployees.length === 0 ? (
        <ModernCard className="p-12">
          <div className="text-center text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p>{searchTerm ? 'No employees match your search' : 'No employees yet'}</p>
            {searchTerm && (
              <Button variant="ghost" onClick={() => setSearchTerm('')} className="mt-4">
                Clear search
              </Button>
            )}
          </div>
        </ModernCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <ModernCard
              key={employee.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleEmployeeClick(employee)}
            >
              {/* Employee Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {employee.first_name?.[0]}{employee.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{employee.position || 'No position'}</p>
                  </div>
                </div>
                {getStatusBadge(employee)}
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                {employee.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Hired: {new Date(employee.hire_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Emergency Contact Indicator */}
              {employee.emergency_contact_name && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <AlertCircle size={12} />
                    <span>Emergency contact on file</span>
                  </div>
                </div>
              )}
            </ModernCard>
          ))}
        </div>
      )}

      {/* Employee Detail Dialog */}
      {(isDetailDialogOpen || isAddDialogOpen) && (
        <EmployeeDetailDialog
          employee={selectedEmployee}
          isOpen={isDetailDialogOpen || isAddDialogOpen}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  )
}

export default EmployeesModule
