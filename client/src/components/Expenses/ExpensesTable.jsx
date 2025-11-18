import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Edit2, Trash2, Check, X, FileText, Tag } from 'lucide-react'
import { Button } from '../UI/Button'
import ModernCard from '../UI/ModernCard'

/**
 * Expenses Table Component
 * Spreadsheet-like view of expenses with inline actions
 */
const ExpensesTable = ({ expenses, onEdit, onDelete, onApprove, onReject, isAdmin }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    let aVal = a[sortConfig.key]
    let bVal = b[sortConfig.key]

    // Handle date sorting
    if (sortConfig.key === 'date') {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    }

    // Handle amount sorting
    if (sortConfig.key === 'amount') {
      aVal = parseFloat(aVal) || 0
      bVal = parseFloat(bVal) || 0
    }

    if (aVal < bVal) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (aVal > bVal) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <span className="text-gray-400">⇅</span>
    }
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>
  }

  if (!expenses || expenses.length === 0) {
    return (
      <ModernCard className="p-12">
        <div className="text-center text-gray-500">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">No Expenses Found</p>
          <p className="text-sm">Add your first expense to get started</p>
        </div>
      </ModernCard>
    )
  }

  return (
    <ModernCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date <SortIcon column="date" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('vendor')}
              >
                <div className="flex items-center gap-1">
                  Vendor <SortIcon column="vendor" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Category <SortIcon column="category" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Description
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  Amount <SortIcon column="amount" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center gap-1">
                  Status <SortIcon column="status" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                {/* Date */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {format(parseISO(expense.date), 'MMM d, yyyy')}
                </td>

                {/* Vendor */}
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {expense.vendor || '-'}
                </td>

                {/* Category */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {expense.category}
                  </span>
                </td>

                {/* Description */}
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                  <div className="truncate" title={expense.description}>
                    {expense.description || '-'}
                  </div>
                  {expense.tags && expense.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <Tag size={12} className="text-gray-400" />
                      {expense.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {expense.tags.length > 2 && (
                        <span className="text-xs text-gray-400">+{expense.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </td>

                {/* Amount */}
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                  ${parseFloat(expense.amount).toFixed(2)}
                </td>

                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(expense.status)}`}>
                    {expense.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* Edit */}
                    <button
                      onClick={() => onEdit(expense)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit expense"
                    >
                      <Edit2 size={16} />
                    </button>

                    {/* Approve/Reject (admin only) */}
                    {isAdmin && expense.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(expense.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Approve expense"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => onReject(expense.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Reject expense"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this expense?')) {
                          onDelete(expense.id)
                        }
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total: {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
          </span>
          <span className="font-semibold text-gray-900">
            Total Amount: ${expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toFixed(2)}
          </span>
        </div>
      </div>
    </ModernCard>
  )
}

export default ExpensesTable
