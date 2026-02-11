'use client';

/**
 * Task Picker (Build 3a)
 *
 * Bottom sheet showing project tasks for switching.
 * Filters out completed tasks. 48px touch targets.
 */

import { useLocalTasks } from '@/lib/hooks/useLocalData';

interface TaskPickerProps {
  projectId: string;
  currentTaskId?: string | null;
  onSelect: (taskId: string, taskTitle: string) => void;
  onClose: () => void;
}

export function TaskPicker({ projectId, currentTaskId, onSelect, onClose }: TaskPickerProps) {
  const { data: tasksData } = useLocalTasks(projectId);
  const tasks = tasksData?.tasks ?? [];

  // Filter out completed tasks and the current task
  const availableTasks = tasks.filter(
    t => t.status !== 'complete' && t.id !== currentTaskId
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md bg-white rounded-t-2xl max-h-[60vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D1D5DB' }} />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
            Switch Task
          </h3>
        </div>

        {/* Task list */}
        <div className="overflow-y-auto flex-1 px-4 py-2">
          {availableTasks.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: '#9CA3AF' }}>
              No available tasks
            </div>
          ) : (
            availableTasks.map(task => (
              <button
                key={task.id}
                onClick={() => onSelect(task.id, task.title)}
                className="w-full flex items-center gap-3 py-3 min-h-[48px] text-left"
                style={{ borderBottom: '1px solid #F3F4F6' }}
              >
                {/* Status dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: task.status === 'in-progress' ? '#3B82F6'
                      : task.status === 'blocked' ? '#EF4444'
                      : '#9CA3AF',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: '#111827' }}>
                    {task.title}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Cancel */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#E5E7EB' }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-medium min-h-[48px]"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
