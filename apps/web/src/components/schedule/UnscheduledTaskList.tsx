'use client';

/**
 * UnscheduledTaskList — Collapsible list of tasks needing scheduling, grouped by project
 */

import { useState } from 'react';
import type { Task } from '@hooomz/shared-contracts';

interface UnscheduledTaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function UnscheduledTaskList({ tasks, onTaskClick }: UnscheduledTaskListProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (tasks.length === 0) return null;

  // Group by project
  const byProject = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.projectId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        style={{ minHeight: '44px' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Unscheduled</span>
          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
            {tasks.length}
          </span>
        </div>
        <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100">
          {Object.entries(byProject).map(([projectId, projectTasks]) => (
            <div key={projectId}>
              <div className="px-4 py-1.5 bg-gray-50">
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  {projectId}
                </span>
              </div>
              {projectTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-t border-gray-50"
                  style={{ minHeight: '44px' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-[10px] text-gray-400">Due: {task.dueDate}</p>
                    )}
                  </div>
                  <span className="text-xs text-teal-600 font-medium ml-2 flex-shrink-0">+ Schedule</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
