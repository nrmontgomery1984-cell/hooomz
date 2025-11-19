import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../context/AuthContext'
import ModernCard from '../components/UI/ModernCard'
import { Button } from '../components/UI/Button'
import { DollarSign, ChevronDown, Plus, Download } from 'lucide-react'
import ExpenseForm from '../components/Expenses/ExpenseForm'
import ExpensesTable from '../components/Expenses/ExpensesTable'
import * as expensesApi from '../services/expensesApi'
import { format } from 'date-fns'
import { api } from '../services/api'

/**
 * Global Expenses Page
 * Expense tracking and management view across all projects
 */
const GlobalExpenses = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { projects, loading: projectsLoading } = useProjects()
  const { user } = useAuth()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [userRole, setUserRole] = useState(null)

  // Get project from URL params or localStorage, default to 'all'
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const urlProject = searchParams.get('project')
    if (urlProject) return urlProject

    const lastActiveProject = localStorage.getItem('lastActiveProject')
    return lastActiveProject || 'all'
  })

  // Update URL when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setSearchParams({ project: selectedProjectId })
      if (selectedProjectId !== 'all') {
        localStorage.setItem('lastActiveProject', selectedProjectId)
      }
    }
  }, [selectedProjectId, setSearchParams])

  // Fetch user role and expenses when project changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProjectId || selectedProjectId === 'all') {
        setExpenses([])
        setUserRole('admin') // Assume admin for 'all projects' view
        return
      }

      try {
        setLoading(true)

        // Fetch user role
        try {
          const membersResponse = await api.get(`/projects/${selectedProjectId}/members`)
          const currentMember = membersResponse.data.data?.find(m => m.user_id === user?.id)
          if (currentMember) {
            setUserRole(currentMember.role)
          }
        } catch (err) {
          console.error('Error fetching user role:', err)
        }

        // Fetch expenses
        const data = await expensesApi.getExpensesByProject(selectedProjectId)
        setExpenses(data)
      } catch (err) {
        console.error('Error fetching expenses:', err)
        alert('Failed to load expenses')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedProjectId, user])

  const handleProjectChange = (e) => {
    const newProjectId = e.target.value
    setSelectedProjectId(newProjectId)
  }

  const handleGoToProject = () => {
    if (selectedProjectId && selectedProjectId !== 'all') {
      navigate(`/projects/${selectedProjectId}`)
    }
  }

  const handleAddExpense = async (expenseData) => {
    try {
      const newExpense = await expensesApi.createExpense(expenseData)
      setExpenses(prev => [newExpense, ...prev])
      setShowExpenseForm(false)
    } catch (err) {
      console.error('Error creating expense:', err)
      throw err
    }
  }

  const handleEditExpense = async (expenseData) => {
    try {
      const updated = await expensesApi.updateExpense(editingExpense.id, expenseData)
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? updated : e))
      setEditingExpense(null)
    } catch (err) {
      console.error('Error updating expense:', err)
      throw err
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    try {
      await expensesApi.deleteExpense(expenseId)
      setExpenses(prev => prev.filter(e => e.id !== expenseId))
    } catch (err) {
      console.error('Error deleting expense:', err)
      alert('Failed to delete expense')
    }
  }

  const handleApproveExpense = async (expenseId) => {
    try {
      const updated = await expensesApi.approveExpense(expenseId)
      setExpenses(prev => prev.map(e => e.id === expenseId ? updated : e))
    } catch (err) {
      console.error('Error approving expense:', err)
      alert('Failed to approve expense')
    }
  }

  const handleRejectExpense = async (expenseId) => {
    const notes = prompt('Rejection reason (optional):')
    try {
      const updated = await expensesApi.rejectExpense(expenseId, notes)
      setExpenses(prev => prev.map(e => e.id === expenseId ? updated : e))
    } catch (err) {
      console.error('Error rejecting expense:', err)
      alert('Failed to reject expense')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Date', 'Vendor', 'Category', 'Description', 'Amount', 'Status', 'Notes']
    const rows = expenses.map(expense => [
      expense.date,
      expense.vendor || '',
      expense.category || '',
      expense.description || '',
      expense.amount,
      expense.status,
      expense.notes || ''
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${selectedProject?.name || 'all'}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <DollarSign size={32} className="text-blue-600" />
              Expenses
            </h1>
            <p className="text-gray-600 mt-2">Track and manage project expenses</p>
          </div>

          <ModernCard className="p-12">
            <div className="text-center text-gray-500">
              <p className="mb-4">No projects found</p>
              <Button onClick={() => navigate('/projects')}>
                Go to Projects
              </Button>
            </div>
          </ModernCard>
        </div>
      </div>
    )
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-4">
            <DollarSign size={32} className="text-blue-600" />
            Expenses
          </h1>

          {/* Project Selector & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project
              </label>
              <div className="relative">
                <select
                  value={selectedProjectId || 'all'}
                  onChange={handleProjectChange}
                  className="w-full sm:w-96 px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-base font-medium"
                >
                  <option value="all">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} {project.status === 'completed' ? '(Archived)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              {selectedProjectId && selectedProjectId !== 'all' && selectedProject && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleGoToProject}
                    className="whitespace-nowrap"
                  >
                    View Project Details
                  </Button>
                  {expenses.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleExportCSV}
                      className="whitespace-nowrap"
                    >
                      <Download size={18} className="mr-2" />
                      Export CSV
                    </Button>
                  )}
                </>
              )}
              <Button
                onClick={() => setShowExpenseForm(true)}
                className="whitespace-nowrap"
                disabled={!selectedProjectId || selectedProjectId === 'all'}
              >
                <Plus size={18} className="mr-2" />
                Add Expense
              </Button>
            </div>
          </div>

          {/* Project Info */}
          {selectedProject && selectedProjectId !== 'all' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedProject.name}</h3>
                  {selectedProject.address && (
                    <p className="text-sm text-gray-600 mt-1">{selectedProject.address}</p>
                  )}
                  {selectedProject.client_name && (
                    <p className="text-sm text-gray-500 mt-0.5">Client: {selectedProject.client_name}</p>
                  )}
                </div>
                <span
                  className="px-3 py-1 rounded-lg text-sm font-semibold"
                  style={{
                    backgroundColor: selectedProject.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: selectedProject.status === 'active' ? '#166534' : '#374151'
                  }}
                >
                  {selectedProject.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Expense Table */}
        {selectedProjectId === 'all' ? (
          <ModernCard className="p-6">
            <div className="text-center text-gray-500 py-12">
              <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Expense Tracker</p>
              <p className="text-sm">Select a specific project to view and manage expenses</p>
            </div>
          </ModernCard>
        ) : loading ? (
          <ModernCard className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading expenses...</p>
            </div>
          </ModernCard>
        ) : (
          <ExpensesTable
            expenses={expenses}
            onEdit={setEditingExpense}
            onDelete={handleDeleteExpense}
            onApprove={handleApproveExpense}
            onReject={handleRejectExpense}
            isAdmin={userRole === 'admin' || userRole === 'owner' || userRole === 'manager'}
          />
        )}
      </div>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <ExpenseForm
          projectId={selectedProjectId}
          onSubmit={handleAddExpense}
          onCancel={() => setShowExpenseForm(false)}
        />
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <ExpenseForm
          projectId={selectedProjectId}
          expense={editingExpense}
          onSubmit={handleEditExpense}
          onCancel={() => setEditingExpense(null)}
        />
      )}
    </div>
  )
}

export default GlobalExpenses
