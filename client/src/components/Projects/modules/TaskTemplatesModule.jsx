import { Card } from '../../UI/Card'
import { FileText } from 'lucide-react'

/**
 * Task Templates Module
 * Manage reusable task templates for projects
 */
const TaskTemplatesModule = ({ projectId }) => {
  return (
    <div className="p-6">
      <Card className="text-center py-12">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-medium mb-2">Task Templates</h3>
        <p className="text-gray-600 mb-6">
          Manage reusable task templates for your projects
        </p>
        <p className="text-sm text-gray-500">
          This module is coming soon
        </p>
      </Card>
    </div>
  )
}

export default TaskTemplatesModule
