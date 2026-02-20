'use client';

/**
 * Projects List — /projects
 *
 * Shows all projects beyond lead stage: discovery → quoted → approved →
 * in-progress → on-hold → complete. Grouped by status with filter pills.
 * Health score and task progress on each card. Links to /projects/[id].
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Hammer,
  Pause,
  CheckCircle2,
  Send,
  MapPin,
  ThumbsUp,
} from 'lucide-react';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';

// ============================================================================
// Constants
// ============================================================================

type ActiveStatus = 'discovery' | 'quoted' | 'approved' | 'in-progress' | 'on-hold' | 'complete';

const STATUS_ORDER: ActiveStatus[] = [
  'in-progress',
  'approved',
  'quoted',
  'discovery',
  'on-hold',
  'complete',
];

const STATUS_LABELS: Record<ActiveStatus, string> = {
  discovery: 'Discovery',
  quoted: 'Quoted',
  approved: 'Approved',
  'in-progress': 'In Progress',
  'on-hold': 'On Hold',
  complete: 'Complete',
};

const STATUS_COLORS: Record<ActiveStatus, string> = {
  discovery: '#3B82F6',
  quoted: '#8B5CF6',
  approved: '#F59E0B',
  'in-progress': '#0F766E',
  'on-hold': '#EF4444',
  complete: '#10B981',
};

const STATUS_BG: Record<ActiveStatus, string> = {
  discovery: '#EFF6FF',
  quoted: '#F5F3FF',
  approved: '#FFFBEB',
  'in-progress': '#F0FDFA',
  'on-hold': '#FEF2F2',
  complete: '#ECFDF5',
};

const STATUS_ICONS: Record<ActiveStatus, typeof Hammer> = {
  discovery: MapPin,
  quoted: Send,
  approved: ThumbsUp,
  'in-progress': Hammer,
  'on-hold': Pause,
  complete: CheckCircle2,
};

interface ProjectWithTasks {
  id: string;
  name: string;
  status: string;
  clientName?: string;
  taskCount: number;
  completedCount: number;
  healthScore: number;
  updatedAt: string;
}

// ============================================================================
// Page
// ============================================================================

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projectsResult, isLoading: projectsLoading } = useLocalProjects();
  const { services, isLoading: servicesLoading } = useServicesContext();
  const [statusFilter, setStatusFilter] = useState<ActiveStatus | 'all'>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<ActiveStatus>>(
    new Set(['complete'])
  );
  const [projectTasks, setProjectTasks] = useState<Map<string, { total: number; completed: number }>>(new Map());
  const [loadingTasks, setLoadingTasks] = useState(true);

  const isLoading = projectsLoading || servicesLoading;

  // Filter out leads — they have their own page
  const activeProjects = useMemo(() => {
    const all = projectsResult?.projects || [];
    return all.filter((p) => p.status !== 'lead' && p.status !== 'cancelled');
  }, [projectsResult]);

  // Load task counts for each project
  useEffect(() => {
    if (isLoading || !services || activeProjects.length === 0) {
      setLoadingTasks(false);
      return;
    }

    let cancelled = false;
    setLoadingTasks(true);

    async function loadTasks() {
      const map = new Map<string, { total: number; completed: number }>();

      for (const project of activeProjects) {
        try {
          const result = await services!.scheduling.tasks.findAll({
            filters: { projectId: project.id },
          });
          const tasks = result.tasks || [];
          const completed = tasks.filter((t) => t.status === 'complete').length;
          map.set(project.id, { total: tasks.length, completed });
        } catch {
          map.set(project.id, { total: 0, completed: 0 });
        }
      }

      if (!cancelled) {
        setProjectTasks(map);
        setLoadingTasks(false);
      }
    }

    loadTasks();
    return () => { cancelled = true; };
  }, [isLoading, services, activeProjects]);

  // Build enriched project list
  const projects: ProjectWithTasks[] = useMemo(() => {
    return activeProjects.map((p) => {
      const tasks = projectTasks.get(p.id) || { total: 0, completed: 0 };
      return {
        id: p.id,
        name: p.name || p.id,
        status: p.status,
        taskCount: tasks.total,
        completedCount: tasks.completed,
        healthScore: tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0,
        updatedAt: p.metadata?.updatedAt || p.metadata?.createdAt || '',
      };
    });
  }, [activeProjects, projectTasks]);

  // Counts per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUS_ORDER) counts[s] = 0;
    for (const p of projects) {
      if (counts[p.status] !== undefined) counts[p.status]++;
    }
    return counts;
  }, [projects]);

  // Filter + group
  const filtered = statusFilter === 'all'
    ? projects
    : projects.filter((p) => p.status === statusFilter);

  const grouped = STATUS_ORDER
    .map((status) => ({
      status,
      projects: filtered.filter((p) => p.status === status),
    }))
    .filter((g) => g.projects.length > 0);

  const toggleCollapse = (status: ActiveStatus) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  // Stats
  const inProgressCount = statusCounts['in-progress'] || 0;
  const approvedCount = statusCounts['approved'] || 0;

  if (isLoading || loadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
          />
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        {/* Header */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
          <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-3 md:py-4">
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: '#111827' }}>
                Projects
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                {projects.length} project{projects.length !== 1 ? 's' : ''}
                {inProgressCount > 0 && (
                  <span>
                    {' '}&middot;{' '}
                    <span style={{ color: STATUS_COLORS['in-progress'] }}>
                      {inProgressCount} active
                    </span>
                  </span>
                )}
                {approvedCount > 0 && (
                  <span>
                    {' '}&middot;{' '}
                    <span style={{ color: STATUS_COLORS['approved'] }}>
                      {approvedCount} ready to start
                    </span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Status filter strip */}
          <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 pb-3">
            <div className="flex gap-2 overflow-x-auto">
              <FilterPill
                label="All"
                count={projects.length}
                active={statusFilter === 'all'}
                color="#374151"
                onClick={() => setStatusFilter('all')}
              />
              {STATUS_ORDER.map((status) => {
                const count = statusCounts[status] || 0;
                if (count === 0) return null;
                return (
                  <FilterPill
                    key={status}
                    label={STATUS_LABELS[status]}
                    count={count}
                    active={statusFilter === status}
                    color={STATUS_COLORS[status]}
                    onClick={() => setStatusFilter(status)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8">
          {/* Empty state */}
          {projects.length === 0 && (
            <div className="mt-8 text-center">
              <div
                className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center"
                style={{ background: '#F0FDFA' }}
              >
                <FolderOpen size={24} style={{ color: '#0F766E' }} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#111827' }}>
                No active projects
              </p>
              <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
                Projects appear here after a lead moves through the estimate process
              </p>
              <button
                onClick={() => router.push('/leads')}
                className="min-h-[44px] px-5 rounded-xl font-medium text-sm text-white"
                style={{ background: '#0F766E' }}
              >
                View Leads
              </button>
            </div>
          )}

          {/* Pipeline bar */}
          {projects.length > 0 && statusFilter === 'all' && (
            <div className="mt-4 mb-2">
              <div className="flex rounded-lg overflow-hidden h-2">
                {STATUS_ORDER.map((status) => {
                  const count = statusCounts[status] || 0;
                  if (count === 0) return null;
                  const pct = (count / projects.length) * 100;
                  return (
                    <div
                      key={status}
                      style={{ width: `${pct}%`, background: STATUS_COLORS[status], minWidth: '4px' }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Status groups */}
          {grouped.map(({ status, projects: groupProjects }) => {
            return (
              <div key={status} className="mt-4">
                <button
                  onClick={() => toggleCollapse(status)}
                  className="flex items-center gap-2 mb-2 min-h-[28px]"
                >
                  {collapsedGroups.has(status) ? (
                    <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
                  ) : (
                    <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
                  )}
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: STATUS_COLORS[status] }}
                  />
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: '#6B7280' }}
                  >
                    {STATUS_LABELS[status]}
                  </h2>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: STATUS_BG[status], color: STATUS_COLORS[status] }}
                  >
                    {groupProjects.length}
                  </span>
                </button>

                {!collapsedGroups.has(status) && (
                  <div className="space-y-2">
                    {groupProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function FilterPill({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="min-h-[32px] px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
      style={{
        background: active ? color : '#F3F4F6',
        color: active ? '#FFFFFF' : '#6B7280',
      }}
    >
      {label} {count > 0 && `(${count})`}
    </button>
  );
}

function ProjectCard({ project }: { project: ProjectWithTasks }) {
  const status = project.status as ActiveStatus;
  const statusColor = STATUS_COLORS[status] || '#9CA3AF';
  const Icon = STATUS_ICONS[status] || FolderOpen;
  const progressPct = project.taskCount > 0
    ? Math.round((project.completedCount / project.taskCount) * 100)
    : 0;

  return (
    <Link href={`/projects/${project.id}`}>
      <div
        className="rounded-xl p-3 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          borderLeft: `3px solid ${statusColor}`,
          opacity: status === 'complete' ? 0.75 : 1,
        }}
      >
        {/* Top row: name + status + chevron */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-[13px] font-semibold truncate" style={{ color: '#111827' }}>
              {project.name}
            </h3>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 flex items-center gap-1"
              style={{ background: `${statusColor}15`, color: statusColor }}
            >
              <Icon size={10} />
              {STATUS_LABELS[status] || status}
            </span>
          </div>
          <ChevronRight size={14} style={{ color: '#D1D5DB' }} />
        </div>

        {/* Task progress */}
        {project.taskCount > 0 ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px]" style={{ color: '#6B7280' }}>
                {project.completedCount}/{project.taskCount} tasks
              </span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: progressPct >= 80 ? '#10B981' : progressPct >= 40 ? '#F59E0B' : '#6B7280' }}
              >
                {progressPct}%
              </span>
            </div>
            <div className="flex rounded-full overflow-hidden h-1.5" style={{ background: '#F3F4F6' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct >= 80 ? '#10B981' : progressPct >= 40 ? '#F59E0B' : '#D1D5DB',
                  minWidth: progressPct > 0 ? '4px' : '0',
                }}
              />
            </div>
          </>
        ) : (
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
            No tasks yet
          </p>
        )}
      </div>
    </Link>
  );
}
