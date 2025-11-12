import { ClipboardList, Plus } from 'lucide-react'
import { Card } from '../../UI/Card'
import { Button } from '../../UI/Button'

const ActivityLogModule = ({ projectId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
          <p className="text-gray-600 mt-1">Quick logging for site visits, inspections, and events</p>
        </div>
        <Button variant="primary">
          <Plus size={18} className="mr-2" />
          Log Activity
        </Button>
      </div>

      <Card className="p-12">
        <div className="text-center text-gray-500">
          <ClipboardList size={64} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">Activity Log Module</h3>
          <p className="mb-4">Coming soon: Quick activity logging with templates</p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full">Site Visit</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Inspection</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Change Order</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Issue/Risk</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Delivery</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Meeting</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ActivityLogModule
