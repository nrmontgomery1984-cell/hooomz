import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react'
import { Card } from '../../UI/Card'

const AnalyticsModule = ({ projectId }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        <p className="text-gray-600 mt-1">Project insights, dashboards, and performance metrics</p>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">On Budget</p>
              <p className="text-2xl font-bold text-gray-900">$0</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Activity size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <PieChart size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-12">
        <div className="text-center text-gray-500">
          <BarChart3 size={64} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">Analytics Module</h3>
          <p className="mb-4">Coming soon: Comprehensive project analytics and reporting</p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full">Budget vs Actual</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Timeline Analysis</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Labor Reports</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Cost Breakdown</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Performance Metrics</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default AnalyticsModule
