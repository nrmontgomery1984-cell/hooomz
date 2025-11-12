import { Calendar, Plus } from 'lucide-react'
import { Card } from '../../UI/Card'
import { Button } from '../../UI/Button'

const ScheduleModule = ({ projectId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
          <p className="text-gray-600 mt-1">Project timeline, milestones, and deadlines</p>
        </div>
        <Button variant="primary">
          <Plus size={18} className="mr-2" />
          Add Event
        </Button>
      </div>

      <Card className="p-12">
        <div className="text-center text-gray-500">
          <Calendar size={64} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">Schedule Module</h3>
          <p className="mb-4">Coming soon: Project timeline and calendar management</p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full">Gantt Chart</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Milestones</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Deadlines</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Calendar View</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Appointments</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ScheduleModule
