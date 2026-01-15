'use client';

/**
 * TaskDetail Component
 *
 * Full task view with dependencies and detailed information.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@hooomz/shared-contracts';
import { useSchedulingService } from '@/lib/services/ServicesContext';
import { Button, Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { DependencySelector } from './DependencySelector';
import { useToast } from '@/components/ui/Toast';

interface TaskDetailProps {
  task: Task;
  onUpdate?: (task: Task) => void;
}

export function TaskDetail({ task, onUpdate }: TaskDetailProps) {
  const router = useRouter();
  const schedulingService = useSchedulingService();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details');

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

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error' as const;
      case 'medium':
        return 'warning' as const;
      case 'low':
        return 'info' as const;
      default:
        return 'neutral' as const;
    }
  };

  const isOverdue = (): boolean => {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleUpdateDependencies = async (dependencies: string[]) => {
    try {
      const response = await schedulingService.updateTask(task.id, { dependencies });
      if (response.success && response.data) {
        showToast('Dependencies updated', 'success');
        if (onUpdate) {
          onUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to update dependencies:', error);
      showToast('Failed to update dependencies', 'error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await schedulingService.updateTask(task.id, { status: newStatus });
      if (response.success && response.data) {
        showToast('Status updated', 'success');
        if (onUpdate) {
          onUpdate(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <Badge variant={getStatusVariant(task.status)}>
                {task.status}
              </Badge>
              {task.priority && (
                <Badge variant={getPriorityVariant(task.priority)}>
                  {task.priority}
                </Badge>
              )}
            </div>
            {isOverdue() && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Overdue
              </div>
            )}
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/projects/${task.projectId}/tasks/${task.id}/edit`)}
          >
            Edit Task
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="dependencies">
            Dependencies {task.dependencies && task.dependencies.length > 0 && `(${task.dependencies.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Description */}
            {task.description && (
              <Card className="lg:col-span-2">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </Card>
            )}

            {/* Schedule */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule</h2>
              <div className="space-y-3">
                {task.startDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Start Date:</span>
                    <div className="text-gray-900 mt-1">{formatDate(task.startDate)}</div>
                  </div>
                )}
                {task.dueDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Due Date:</span>
                    <div className={`mt-1 ${isOverdue() ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                )}
                {task.estimatedHours && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Estimated Hours:</span>
                    <div className="text-gray-900 mt-1">{task.estimatedHours} hours</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Assignment */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assignment</h2>
              <div className="space-y-3">
                {task.assignedTo ? (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned To:</span>
                    <div className="text-gray-900 mt-1">{task.assignedTo}</div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Not assigned yet</p>
                )}
              </div>
            </Card>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <Card className="lg:col-span-2">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Status Change */}
            <Card className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                {task.status !== 'pending' && (
                  <Button
                    variant="secondary"
                    onClick={() => handleStatusChange('pending')}
                  >
                    Mark as Pending
                  </Button>
                )}
                {task.status !== 'in-progress' && (
                  <Button
                    variant="secondary"
                    onClick={() => handleStatusChange('in-progress')}
                  >
                    Start Task
                  </Button>
                )}
                {task.status !== 'completed' && (
                  <Button
                    variant="primary"
                    onClick={() => handleStatusChange('completed')}
                  >
                    Mark as Complete
                  </Button>
                )}
                {task.status !== 'blocked' && (
                  <Button
                    variant="secondary"
                    onClick={() => handleStatusChange('blocked')}
                  >
                    Mark as Blocked
                  </Button>
                )}
              </div>
            </Card>

            {/* Metadata */}
            <Card className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Task ID:</span>
                  <div className="text-gray-900 font-mono text-xs mt-1">{task.id}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Created:</span>
                  <div className="text-gray-900 mt-1">{formatDate(task.createdAt)}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Last Updated:</span>
                  <div className="text-gray-900 mt-1">{formatDate(task.updatedAt)}</div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dependencies">
          <DependencySelector task={task} onUpdate={handleUpdateDependencies} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
