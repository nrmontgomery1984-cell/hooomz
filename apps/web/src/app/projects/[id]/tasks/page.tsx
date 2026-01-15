'use client';

/**
 * Project Tasks Page
 *
 * View and manage tasks for a specific project.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Task, Project } from '@hooomz/shared-contracts';
import { useSchedulingService, useProjectService } from '@/lib/services/ServicesContext';
import { Button, Card, Tabs, TabsList, TabsTrigger, TabsContent, LoadingSpinner } from '@/components/ui';
import { TaskList, Calendar, GanttChart } from '@/components/features/scheduling';
import { useToast } from '@/components/ui/Toast';

export default function ProjectTasksPage() {
  const params = useParams();
  const router = useRouter();
  const schedulingService = useSchedulingService();
  const projectService = useProjectService();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');

  const projectId = params.id as string;

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load project
      const projectResponse = await projectService.getById(projectId);
      if (projectResponse.success && projectResponse.data) {
        setProject(projectResponse.data);
      }

      // Load tasks
      const tasksResponse = await schedulingService.getProjectTasks(projectId);
      if (tasksResponse.success && tasksResponse.data) {
        setTasks(tasksResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load tasks', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await schedulingService.updateTask(taskId, { status: newStatus });
      if (response.success && response.data) {
        setTasks(tasks.map((t) => (t.id === taskId ? response.data! : t)));
        showToast('Status updated', 'success');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleTaskClick = (task: Task) => {
    router.push(`/projects/${projectId}/tasks/${task.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Project Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The project you're looking for doesn't exist.
            </p>
            <Button variant="primary" onClick={() => router.push('/projects')}>
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/projects/${projectId}`)}
        className="mb-4"
      >
        ← Back to Project
      </Button>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">Project Tasks</p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push(`/projects/${projectId}/tasks/new`)}
        >
          + New Task
        </Button>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
            <div className="text-xs text-gray-600 mt-1">Total</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {tasks.filter((t) => t.status === 'in-progress').length}
            </div>
            <div className="text-xs text-gray-600 mt-1">In Progress</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter((t) => t.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-600 mt-1">Completed</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {
                tasks.filter(
                  (t) =>
                    t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    t.status !== 'completed'
                ).length
              }
            </div>
            <div className="text-xs text-gray-600 mt-1">Overdue</div>
          </div>
        </Card>
      </div>

      {/* View Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {tasks.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No tasks yet</p>
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/projects/${projectId}/tasks/new`)}
                >
                  Create First Task
                </Button>
              </div>
            </Card>
          ) : (
            <TaskList
              tasks={tasks}
              onStatusChange={handleStatusChange}
            />
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Calendar
            tasks={tasks}
            onTaskClick={handleTaskClick}
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
