import { DollarSign, FileText, Receipt, TrendingUp } from 'lucide-react'
import { Card } from '../../UI/Card'

/**
 * Financials Module
 * Manage invoices, quotes, estimates, contracts, and expenses
 */
const FinancialsModule = ({ projectId }) => {
  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financials</h2>
          <p className="text-gray-600 mt-1">Manage project finances, invoices, and expenses</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$0</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Invoices</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Receipt size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-gray-900">$0</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Coming Soon */}
      <Card className="p-12">
        <div className="text-center text-gray-500">
          <DollarSign size={64} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">Financials Module</h3>
          <p className="mb-4">Coming soon: Invoices, Quotes, Estimates, Expenses, and more</p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full">Invoices</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Quotes</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Estimates</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Contracts</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Expenses</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Payment Tracking</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FinancialsModule
