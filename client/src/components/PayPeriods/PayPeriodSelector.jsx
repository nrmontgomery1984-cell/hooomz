import { useState, useEffect } from 'react'
import { Calendar, ChevronDown, Plus, Lock, Unlock } from 'lucide-react'
import { Button } from '../UI/Button'
import * as payPeriodsApi from '../../services/payPeriodsApi'
import PayPeriodDialog from './PayPeriodDialog'
import { format, parseISO } from 'date-fns'

/**
 * Pay Period Selector Component
 * Dropdown to select and manage pay periods for time tracking
 */
const PayPeriodSelector = ({ selectedPeriodId, onPeriodChange }) => {
  const [payPeriods, setPayPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    fetchPayPeriods()
  }, [])

  const fetchPayPeriods = async () => {
    try {
      setLoading(true)
      const data = await payPeriodsApi.getAllPayPeriods()
      setPayPeriods(data)

      // Auto-select current period if none selected
      if (!selectedPeriodId && data.length > 0) {
        const currentPeriod = data.find(p => p.status === 'open')
        if (currentPeriod) {
          onPeriodChange(currentPeriod.id)
        }
      }
    } catch (error) {
      console.error('Error fetching pay periods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePeriod = async (periodData) => {
    try {
      const newPeriod = await payPeriodsApi.createPayPeriod(periodData)
      setPayPeriods(prev => [newPeriod, ...prev])
      onPeriodChange(newPeriod.id)
      setShowDialog(false)
    } catch (error) {
      console.error('Error creating pay period:', error)
      alert('Failed to create pay period')
    }
  }

  const handleClosePeriod = async (periodId) => {
    if (!confirm('Close this pay period? Time entries will be locked.')) return

    try {
      const updated = await payPeriodsApi.closePayPeriod(periodId)
      setPayPeriods(prev => prev.map(p => p.id === periodId ? updated : p))
    } catch (error) {
      console.error('Error closing pay period:', error)
      alert('Failed to close pay period')
    }
  }

  const handleReopenPeriod = async (periodId) => {
    if (!confirm('Reopen this pay period? Time entries can be modified again.')) return

    try {
      const updated = await payPeriodsApi.reopenPayPeriod(periodId)
      setPayPeriods(prev => prev.map(p => p.id === periodId ? updated : p))
    } catch (error) {
      console.error('Error reopening pay period:', error)
      alert('Failed to reopen pay period')
    }
  }

  const selectedPeriod = payPeriods.find(p => p.id === selectedPeriodId)

  const getStatusBadge = (status) => {
    const statusColors = {
      open: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      paid: 'bg-purple-100 text-purple-700'
    }

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading pay periods...</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pay Period
          </label>
          <div className="relative">
            <select
              value={selectedPeriodId || ''}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="w-full sm:w-96 px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-base font-medium"
            >
              <option value="">Select a pay period</option>
              {payPeriods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name} ({period.frequency}) - {period.status}
                </option>
              ))}
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowDialog(true)}
            className="whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" />
            New Period
          </Button>

          {selectedPeriod && selectedPeriod.status === 'open' && (
            <Button
              variant="secondary"
              onClick={() => handleClosePeriod(selectedPeriod.id)}
              className="whitespace-nowrap"
            >
              <Lock size={18} className="mr-2" />
              Close Period
            </Button>
          )}

          {selectedPeriod && selectedPeriod.status === 'closed' && (
            <Button
              variant="secondary"
              onClick={() => handleReopenPeriod(selectedPeriod.id)}
              className="whitespace-nowrap"
            >
              <Unlock size={18} className="mr-2" />
              Reopen
            </Button>
          )}
        </div>
      </div>

      {/* Period Info Card */}
      {selectedPeriod && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">{selectedPeriod.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {format(parseISO(selectedPeriod.start_date), 'MMM d, yyyy')} - {format(parseISO(selectedPeriod.end_date), 'MMM d, yyyy')}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                  <span><strong>{selectedPeriod.total_hours?.toFixed(2) || '0.00'}</strong> hours</span>
                  <span><strong>{selectedPeriod.entry_count || 0}</strong> entries</span>
                  <span><strong>{selectedPeriod.worker_count || 0}</strong> workers</span>
                </div>
              </div>
            </div>
            {getStatusBadge(selectedPeriod.status)}
          </div>
        </div>
      )}

      {/* Create Period Dialog */}
      {showDialog && (
        <PayPeriodDialog
          onSubmit={handleCreatePeriod}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </>
  )
}

export default PayPeriodSelector
