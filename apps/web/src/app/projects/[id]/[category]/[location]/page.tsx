'use client';

/**
 * Location/Task Detail Page
 *
 * Deepest level of drill-down - shows actual tasks.
 * Portfolio -> Project -> Category -> Location -> Tasks
 *
 * At this level, we show a smaller sphere at top and task list below.
 * This is where work actually gets done.
 */

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sphere } from '@/components/visualization/Sphere';
import { BreadcrumbSpheres } from '@/components/navigation/BreadcrumbSpheres';
import { ConfidenceBadge } from '@/components/visualization/ConfidenceBadge';
import { useProject } from '@/lib/api/hooks';
import { useBusinessHealth } from '@/lib/api/hooks/useBusinessHealth';

type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'complete';

interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  estimated_hours?: number;
  assignee?: string;
  confidence?: 'verified' | 'limited' | 'estimate';
}

function TaskItem({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const statusStyles: Record<TaskStatus, string> = {
    not_started: 'bg-slate-50 border-slate-200',
    in_progress: 'bg-progress/5 border-progress/30',
    blocked: 'bg-blocked/5 border-blocked/30',
    complete: 'bg-healthy/5 border-healthy/30',
  };

  return (
    <div className={`p-4 rounded-xl border shadow-card ${statusStyles[task.status]}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 min-h-[48px] min-w-[48px]"
          style={{
            borderColor: task.status === 'complete' ? 'var(--theme-status-green, #10b981)' : '#cbd5e1',
            backgroundColor:
              task.status === 'complete' ? 'var(--theme-status-green, #10b981)' : 'transparent',
          }}
        >
          {task.status === 'complete' && (
            <span className="text-white text-sm">✓</span>
          )}
        </button>
        <div className="flex-1">
          <span
            className={
              task.status === 'complete'
                ? 'line-through text-slate-400'
                : 'text-slate-700'
            }
          >
            {task.name}
          </span>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            {task.estimated_hours && (
              <span className="flex items-center gap-1">
                {task.estimated_hours}h
                {task.confidence && (
                  <ConfidenceBadge level={task.confidence} showTooltip={false} />
                )}
              </span>
            )}
            {task.assignee && <span>· {task.assignee}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LocationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const categorySlug = params.category as string;
  const locationSlug = params.location as string;

  const { data: project, isLoading } = useProject(projectId);
  const { healthScore: portfolioHealth } = useBusinessHealth();

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Rough-in wiring',
      status: 'complete',
      estimated_hours: 4,
      assignee: 'Nathan',
      confidence: 'verified',
    },
    {
      id: '2',
      name: 'Install outlet boxes',
      status: 'in_progress',
      estimated_hours: 2,
      assignee: 'Nishant',
      confidence: 'limited',
    },
    {
      id: '3',
      name: 'Run circuits to panel',
      status: 'not_started',
      estimated_hours: 3,
      confidence: 'estimate',
    },
    {
      id: '4',
      name: 'Install fixtures',
      status: 'blocked',
      estimated_hours: 2,
    },
  ]);

  const categoryName = categorySlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const locationName = locationSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const completedCount = tasks.filter((t) => t.status === 'complete').length;
  const healthScore = Math.round((completedCount / tasks.length) * 100);

  const handleToggle = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'complete' ? 'not_started' : 'complete' }
          : t
      )
    );
  }, []);

  // Navigate back to category
  const handleBackToCategory = useCallback(() => {
    router.push(`/projects/${projectId}/${categorySlug}`);
  }, [router, projectId, categorySlug]);

  const breadcrumbs = [
    { id: 'home', label: 'Portfolio', href: '/', score: portfolioHealth },
    {
      id: projectId,
      label: project?.name || 'Project',
      href: `/projects/${projectId}`,
      score: 75,
    },
    {
      id: categorySlug,
      label: categoryName,
      href: `/projects/${projectId}/${categorySlug}`,
      score: 72,
    },
    {
      id: locationSlug,
      label: locationName,
      href: `/projects/${projectId}/${categorySlug}/${locationSlug}`,
      score: healthScore,
    },
  ];

  const statusOrder: TaskStatus[] = ['blocked', 'in_progress', 'not_started', 'complete'];
  const statusLabels: Record<TaskStatus, string> = {
    blocked: 'Blocked',
    in_progress: 'In Progress',
    not_started: 'To Do',
    complete: 'Complete',
  };
  const statusColors: Record<TaskStatus, string> = {
    blocked: 'text-blocked',
    in_progress: 'text-progress',
    not_started: 'text-slate-400',
    complete: 'text-healthy',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-2 border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Breadcrumb */}
      <div className="px-4 pt-4">
        <BreadcrumbSpheres items={breadcrumbs} />
      </div>

      {/* Location Sphere - smaller at task level */}
      <div className="flex flex-col items-center py-6">
        <button onClick={handleBackToCategory}>
          <Sphere score={healthScore} size="md" label={locationName} />
        </button>
        <p className="text-sm text-slate-500 mt-2">
          {completedCount} of {tasks.length} tasks complete
        </p>
      </div>

      {/* Task List */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-slate-500 uppercase">Tasks</h2>
          <button className="text-sm text-coral font-medium min-h-[48px] px-4">
            + Add Task
          </button>
        </div>

        <div className="space-y-4">
          {statusOrder.map((status) => {
            const statusTasks = tasks.filter((t) => t.status === status);
            if (statusTasks.length === 0) return null;

            return (
              <div key={status} className="space-y-2">
                <h3
                  className={`text-xs font-medium uppercase ${statusColors[status]}`}
                >
                  {statusLabels[status]}
                </h3>
                {statusTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggle(task.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
