'use client';

/**
 * TaskCard Component
 *
 * Summary card for a task with quick status change.
 * Highlights overdue tasks.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@hooomz/shared-contracts';
import { Card, Badge } from '@/components/ui';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  showProject?: boolean;
}

export function TaskCard({ task, onStatusChange, showProject = false }: TaskCardProps) {
  const router = useRouter();

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
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on status badge
    if ((e.target as HTMLElement).closest('.status-badge')) {
      return;
    }
    router.push(`/projects/${task.projectId}/tasks/${task.id}`);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      const statuses = ['pending', 'in-progress', 'completed', 'blocked'];
      const currentIndex = statuses.indexOf(task.status);
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      onStatusChange(task.id, nextStatus);
    }
  };

  return (
    <Card
      interactive
      onClick={handleCardClick}
      className={`hover:border-primary-300 transition-colors ${
        isOverdue() ? 'border-l-4 border-l-red-500 bg-red-50' : ''
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={handleStatusClick}
              className="status-badge"
              title="Click to change status"
            >
              <Badge variant={getStatusVariant(task.status)}>
                {task.status}
              </Badge>
            </button>
            {task.priority && (
              <Badge variant={getPriorityVariant(task.priority)} size="sm">
                {task.priority}
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue() ? 'text-red-600 font-semibold' : ''}`}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{formatDate(task.dueDate)}</span>
              {isOverdue() && <span className="ml-1">(Overdue)</span>}
            </div>
          )}

          {task.assignedTo && (
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{task.assignedTo}</span>
            </div>
          )}

          {task.estimatedHours && (
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{task.estimatedHours}h</span>
            </div>
          )}

          {task.dependencies && task.dependencies.length > 0 && (
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{task.dependencies.length} dependencies</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="neutral" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
