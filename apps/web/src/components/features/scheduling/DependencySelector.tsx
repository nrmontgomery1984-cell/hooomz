'use client';

/**
 * DependencySelector Component
 *
 * Add and remove task dependencies with visualization.
 */

import React, { useState, useEffect } from 'react';
import type { Task } from '@hooomz/shared-contracts';
import { useSchedulingService } from '@/lib/services/ServicesContext';
import { Card, Badge, Button, LoadingSpinner } from '@/components/ui';

interface DependencySelectorProps {
  task: Task;
  onUpdate: (dependencies: string[]) => void;
}

export function DependencySelector({ task, onUpdate }: DependencySelectorProps) {
  const schedulingService = useSchedulingService();
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(
    task.dependencies || []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProjectTasks();
  }, [task.projectId]);

  const loadProjectTasks = async () => {
    setIsLoading(true);
    try {
      const response = await schedulingService.getProjectTasks(task.projectId);
      if (response.success && response.data) {
        // Filter out the current task
        const tasks = response.data.filter((t) => t.id !== task.id);
        setAvailableTasks(tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDependency = (taskId: string) => {
    if (!selectedDependencies.includes(taskId)) {
      const newDependencies = [...selectedDependencies, taskId];
      setSelectedDependencies(newDependencies);
      onUpdate(newDependencies);
    }
  };

  const handleRemoveDependency = (taskId: string) => {
    const newDependencies = selectedDependencies.filter((id) => id !== taskId);
    setSelectedDependencies(newDependencies);
    onUpdate(newDependencies);
  };

  const getTaskById = (taskId: string): Task | undefined => {
    return availableTasks.find((t) => t.id === taskId);
  };

  const getFilteredTasks = (): Task[] => {
    let filtered = availableTasks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    // Exclude already selected dependencies
    filtered = filtered.filter((t) => !selectedDependencies.includes(t.id));

    return filtered;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'neutral' as const;
      case 'in-progress':
        return 'warning' as const;
      case 'completed':
        return 'success' as const;
      case 'blocked':
        return 'error' as const;
      default:
        return 'neutral' as const;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="py-8">
          <LoadingSpinner size="md" text="Loading tasks..." />
        </div>
      </Card>
    );
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-4">
      {/* Current Dependencies */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Current Dependencies</h3>
        {selectedDependencies.length === 0 ? (
          <p className="text-gray-500 text-sm">No dependencies yet</p>
        ) : (
          <div className="space-y-2">
            {selectedDependencies.map((depId) => {
              const depTask = getTaskById(depId);
              if (!depTask) return null;

              return (
                <div
                  key={depId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getStatusVariant(depTask.status)} size="sm">
                        {depTask.status}
                      </Badge>
                      <span className="font-semibold text-gray-900">{depTask.title}</span>
                    </div>
                    {depTask.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {depTask.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveDependency(depId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Dependencies */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Add Dependency</h3>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Available Tasks */}
        {filteredTasks.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            {searchQuery ? 'No tasks found' : 'No more tasks available'}
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getStatusVariant(t.status)} size="sm">
                      {t.status}
                    </Badge>
                    <span className="font-semibold text-gray-900">{t.title}</span>
                  </div>
                  {t.description && (
                    <p className="text-sm text-gray-600 line-clamp-1">{t.description}</p>
                  )}
                  {t.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(t.dueDate).toLocaleDateString('en-CA')}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAddDependency(t.id)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Dependency Info */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <svg
            className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <p className="font-medium mb-1">About Dependencies</p>
            <p>
              This task depends on the selected tasks being completed first. Dependencies
              help organize work order and prevent scheduling conflicts.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
