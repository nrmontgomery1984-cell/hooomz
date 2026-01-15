'use client';

/**
 * My Tasks Page
 *
 * View tasks assigned to the current user (for crew members).
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@hooomz/shared-contracts';
import { useSchedulingService } from '@/lib/services/ServicesContext';
import { Button, Card, Select, Badge, LoadingSpinner } from '@/components/ui';
import { TaskList } from '@/components/features/scheduling';
import { useToast } from '@/components/ui/Toast';

export default function MyTasksPage() {
  const router = useRouter();
  const schedulingService = useSchedulingService();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState('Current User'); // TODO: Get from auth context
  const [viewFilter, setViewFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');

  useEffect(() => {
    loadMyTasks();
  }, []);

  const loadMyTasks = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual user context
      const response = await schedulingService.getMyTasks(currentUser);
      if (response.success && response.data) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
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

  const getFilteredTasks = (): Task[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    switch (viewFilter) {
      case 'today':
        return tasks.filter((t) => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      case 'week':
        return tasks.filter((t) => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate >= today && dueDate < weekEnd;
        });
      case 'overdue':
        return tasks.filter(
          (t) =>
            t.dueDate &&
            new Date(t.dueDate) < today &&
            t.status !== 'completed'
        );
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();
  const overdueCount = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== 'completed'
  ).length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading your tasks..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">
            Tasks assigned to {currentUser}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push('/schedule')}
          >
            View Schedule
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push('/projects')}
          >
            View Projects
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
            <div className="text-xs text-gray-600 mt-1">Total</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter((t) => t.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-600 mt-1">Pending</div>
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
        <Card className={overdueCount > 0 ? 'border-red-300 bg-red-50' : ''}>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <div className="text-xs text-gray-600 mt-1">Overdue</div>
          </div>
        </Card>
      </div>

      {/* View Filter */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Show:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setViewFilter('today')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewFilter === 'today'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setViewFilter('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewFilter === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setViewFilter('overdue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewFilter === 'overdue'
                    ? 'bg-red-600 text-white'
                    : overdueCount > 0
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overdue {overdueCount > 0 && `(${overdueCount})`}
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>
      </Card>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              {viewFilter === 'all' ? 'No tasks assigned' : 'No tasks in this view'}
            </div>
            <p className="text-gray-500">
              {viewFilter === 'all'
                ? 'You have no tasks assigned to you'
                : 'Try viewing all tasks'}
            </p>
          </div>
        </Card>
      ) : (
        <TaskList
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          showProject={true}
        />
      )}

      {/* Help Card */}
      {tasks.length > 0 && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Quick Tips</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click on a task card to view full details</li>
                <li>Click the status badge to quickly change task status</li>
                <li>Overdue tasks are highlighted in red</li>
                <li>Use filters to focus on specific timeframes</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
