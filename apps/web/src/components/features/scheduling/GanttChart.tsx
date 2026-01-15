'use client';

/**
 * GanttChart Component
 *
 * Simple Gantt chart view for task timeline visualization.
 * Shows tasks with start/end dates and dependencies.
 */

import React from 'react';
import type { Task } from '@hooomz/shared-contracts';
import { Card, Badge } from '@/components/ui';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  // Filter tasks with dates
  const tasksWithDates = tasks.filter((t) => t.startDate && t.dueDate);

  if (tasksWithDates.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No tasks with scheduled dates</p>
          <p className="text-sm text-gray-400">
            Tasks need both start and due dates to appear in the Gantt chart
          </p>
        </div>
      </Card>
    );
  }

  // Calculate date range
  const allDates = tasksWithDates.flatMap((t) => [
    new Date(t.startDate!),
    new Date(t.dueDate!),
  ]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // Add padding
  minDate.setDate(minDate.getDate() - 1);
  maxDate.setDate(maxDate.getDate() + 1);

  const totalDays = Math.ceil(
    (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-gray-400';
      case 'in-progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getTaskPosition = (task: Task) => {
    const start = new Date(task.startDate!);
    const end = new Date(task.dueDate!);

    const startOffset = Math.ceil(
      (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate month markers
  const getMonthMarkers = () => {
    const markers: { date: Date; label: string; position: number }[] = [];
    const current = new Date(minDate);

    while (current <= maxDate) {
      const offset = Math.ceil(
        (current.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const position = (offset / totalDays) * 100;

      markers.push({
        date: new Date(current),
        label: current.toLocaleDateString('en-CA', {
          month: 'short',
          year: current.getMonth() === 0 ? 'numeric' : undefined,
        }),
        position,
      });

      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }

    return markers;
  };

  const monthMarkers = getMonthMarkers();

  return (
    <Card>
      <div className="space-y-4">
        {/* Timeline Header */}
        <div className="relative h-8 border-b border-gray-200">
          {monthMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 text-xs text-gray-600 font-medium"
              style={{ left: `${marker.position}%` }}
            >
              {marker.label}
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {tasksWithDates.map((task) => {
            const position = getTaskPosition(task);

            return (
              <div key={task.id} className="relative">
                {/* Task Label */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-48 truncate">
                    <button
                      onClick={() => onTaskClick?.(task)}
                      className="text-left text-sm font-medium text-gray-900 hover:text-primary-600 truncate"
                    >
                      {task.title}
                    </button>
                  </div>
                </div>

                {/* Timeline Bar */}
                <div className="relative h-8 bg-gray-100 rounded">
                  <button
                    onClick={() => onTaskClick?.(task)}
                    className={`absolute top-0 h-full rounded ${getStatusColor(
                      task.status
                    )} hover:opacity-80 transition-opacity flex items-center px-2`}
                    style={position}
                    title={`${task.title}\n${formatDate(task.startDate!)} - ${formatDate(
                      task.dueDate!
                    )}`}
                  >
                    <span className="text-xs text-white font-medium truncate">
                      {task.title}
                    </span>
                  </button>

                  {/* Today marker */}
                  {(() => {
                    const today = new Date();
                    if (today >= minDate && today <= maxDate) {
                      const todayOffset = Math.ceil(
                        (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const todayPosition = (todayOffset / totalDays) * 100;

                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                          style={{ left: `${todayPosition}%` }}
                          title="Today"
                        />
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Task Details */}
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>
                    {formatDate(task.startDate!)} → {formatDate(task.dueDate!)}
                  </span>
                  {task.assignedTo && <span>• {task.assignedTo}</span>}
                  {task.dependencies && task.dependencies.length > 0 && (
                    <span>• {task.dependencies.length} dependencies</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-sm text-gray-600">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-500" />
            <span className="text-sm text-gray-600">Today</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
