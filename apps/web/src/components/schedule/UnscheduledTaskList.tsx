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
    <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface)] transition-colors"
        style={{ minHeight: '44px' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--charcoal)]">Unscheduled</span>
          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
            {tasks.length}
          </span>
        </div>
        <span className="text-[var(--muted)] text-sm">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="border-t border-[var(--border)]">
          {Object.entries(byProject).map(([projectId, projectTasks]) => (
            <div key={projectId}>
              <div className="px-4 py-1.5 bg-[var(--surface)]">
                <span className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
                  {projectId}
                </span>
              </div>
              {projectTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--surface)] transition-colors border-t border-[var(--surface)]"
                  style={{ minHeight: '44px' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--charcoal)] truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-[10px] text-[var(--muted)]">Due: {task.dueDate}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium ml-2 flex-shrink-0" style={{ color: 'var(--accent)' }}>+ Schedule</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
