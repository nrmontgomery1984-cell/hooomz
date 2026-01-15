'use client';

/**
 * Schedule Page
 *
 * Calendar view of all tasks across projects.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@hooomz/shared-contracts';
import { useSchedulingService } from '@/lib/services/ServicesContext';
import { Button, Card, Tabs, TabsList, TabsTrigger, TabsContent, LoadingSpinner } from '@/components/ui';
import { Calendar, TaskList, GanttChart } from '@/components/features/scheduling';
import { useToast } from '@/components/ui/Toast';

export default function SchedulePage() {
  const router = useRouter();
  const schedulingService = useSchedulingService();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    loadAllTasks();
  }, []);

  const loadAllTasks = async () => {
    setIsLoading(true);
    try {
      const response = await schedulingService.list();
      if (response.success && response.data) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      showToast({ message: 'Failed to load tasks', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    router.push(`/projects/${task.projectId}/tasks/${task.id}`);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await schedulingService.update(taskId, { status: newStatus });
      if (response.success && response.data) {
        setTasks(tasks.map((t) => (t.id === taskId ? response.data! : t)));
        showToast({ message: 'Status updated', variant: 'success' });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast({ message: 'Failed to update status', variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading schedule..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-1">
            View and manage tasks across all projects
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push('/my-tasks')}
          >
            My Tasks
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push('/projects')}
          >
            View Projects
          </Button>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {tasks.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Tasks</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {tasks.filter((t) => t.status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {tasks.filter((t) => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {
                tasks.filter(
                  (t) =>
                    t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    t.status !== 'completed'
                ).length
              }
            </div>
            <div className="text-sm text-gray-600 mt-1">Overdue</div>
          </div>
        </Card>
      </div>

      {/* View Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Calendar
            tasks={tasks}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        <TabsContent value="list">
          <TaskList
            tasks={tasks}
            onStatusChange={handleStatusChange}
            showProject={true}
          />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttChart
            tasks={tasks}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
