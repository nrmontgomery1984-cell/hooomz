import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMaintenance } from '../hooks/useMaintenance'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { PageHeader } from '../components/UI/PageHeader'
import { MaintenanceDetailsModal } from '../components/Maintenance/MaintenanceDetailsModal'
import { Plus, Wrench, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function Maintenance() {
  const { homeId } = useParams()
  const { maintenanceTasks, loading, error } = useMaintenance(homeId)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsDetailsOpen(true)
  }

  if (loading) return <div className="p-8">Loading...</div>

  const upcomingTasks = maintenanceTasks.filter(task =>
    new Date(task.next_due) > new Date()
  )
  const overdueTasks = maintenanceTasks.filter(task =>
    new Date(task.next_due) <= new Date()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Maintenance"
        subtitle="Schedule and track regular upkeep tasks"
        showBackButton={true}
        backTo={`/home/${homeId}`}
        actions={
          <Button>
            <Plus size={20} className="mr-2" />
            Add Task
          </Button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

        {maintenanceTasks.length === 0 ? (
          <Card className="text-center py-12">
            <Wrench size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No maintenance tasks yet</h3>
            <p className="text-gray-600 mb-6">Schedule regular upkeep for your home</p>
            <Button>Add Your First Task</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {overdueTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-red-600 mb-4">Overdue Tasks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overdueTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-shadow hover:border-red-600"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{task.name}</h3>
                          <p className="text-sm text-gray-600">
                            Due: {format(new Date(task.next_due), 'MMM d, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Frequency: {task.frequency}
                          </p>
                          <p className="text-xs text-primary-600 mt-2">Click for maintenance guide →</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Mark task as complete
                          }}
                        >
                          <CheckCircle size={20} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {upcomingTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary-500"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{task.name}</h3>
                          <p className="text-sm text-gray-600">
                            Due: {format(new Date(task.next_due), 'MMM d, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Frequency: {task.frequency}
                          </p>
                          <p className="text-xs text-primary-600 mt-2">Click for maintenance guide →</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Mark task as complete
                          }}
                        >
                          <CheckCircle size={20} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Maintenance Details Modal */}
      <MaintenanceDetailsModal
        task={selectedTask}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedTask(null)
        }}
      />
    </div>
  )
}
