/**
 * Activity Page
 * Full activity feed with filtering
 * Per spec: Part 4.4 Activity Feed Component
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ActivityFeed } from '../../components/activity';
import { useActivityFeed } from '../../hooks';
import { useCompany } from '../../hooks';
import type { EventType } from '../../types/database';

// ============================================================================
// FILTER OPTIONS
// ============================================================================

type FilterCategory = 'all' | 'status' | 'field' | 'time' | 'communication' | 'project';

const filterCategories: { value: FilterCategory; label: string; types: EventType[] }[] = [
  { value: 'all', label: 'All Activity', types: [] },
  {
    value: 'status',
    label: 'Status Changes',
    types: ['loop.created', 'loop.status_changed', 'loop.completed', 'loop.blocked', 'loop.unblocked'],
  },
  {
    value: 'field',
    label: 'Field Work',
    types: ['task.started', 'task.progress_logged', 'task.completed', 'task.blocked', 'task.note_added', 'task.photo_added'],
  },
  {
    value: 'time',
    label: 'Time Tracking',
    types: ['time.clock_in', 'time.clock_out', 'time.entry_logged'],
  },
  {
    value: 'communication',
    label: 'Communication',
    types: ['comment.added', 'comment.reply', 'notification.sent'],
  },
  {
    value: 'project',
    label: 'Project Lifecycle',
    types: ['project.imported', 'project.estimate_generated', 'project.scope_approved', 'change_order.created'],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityPage() {
  const { company, isLoading: companyLoading } = useCompany();
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [projectNames, setProjectNames] = useState<Map<string, string>>(new Map());
  const [actorNames, setActorNames] = useState<Map<string, string>>(new Map());

  // Fetch activity for company
  const { events, isLoading, error, refetch } = useActivityFeed({
    companyId: company?.id,
    limit: 50,
    realtime: true,
  });

  // Filter events by category
  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;

    const category = filterCategories.find(c => c.value === filter);
    if (!category || category.types.length === 0) return events;

    return events.filter(e => category.types.includes(e.event_type));
  }, [events, filter]);

  // Extract unique project and actor IDs for lookup
  const projectIds = useMemo(() => {
    const ids = new Set<string>();
    events.forEach(e => {
      if (e.project_id) ids.add(e.project_id);
    });
    return Array.from(ids);
  }, [events]);

  const actorIds = useMemo(() => {
    const ids = new Set<string>();
    events.forEach(e => {
      if (e.actor_id) ids.add(e.actor_id);
    });
    return Array.from(ids);
  }, [events]);

  // Fetch project names
  const fetchProjectNames = useCallback(async () => {
    if (projectIds.length === 0) return;

    // In a real app, fetch from Supabase
    // For now, use placeholder names based on payload
    const names = new Map<string, string>();
    events.forEach(e => {
      if (e.project_id && !names.has(e.project_id)) {
        const payload = e.payload as Record<string, unknown>;
        names.set(e.project_id, (payload.project_name as string) || 'Unknown Project');
      }
    });
    setProjectNames(names);
  }, [projectIds, events]);

  // Fetch actor names
  const fetchActorNames = useCallback(async () => {
    if (actorIds.length === 0) return;

    // In a real app, fetch profiles from Supabase
    // For now, use placeholder names based on payload
    const names = new Map<string, string>();
    events.forEach(e => {
      if (e.actor_id && !names.has(e.actor_id)) {
        const payload = e.payload as Record<string, unknown>;
        names.set(e.actor_id, (payload.actor_name as string) || 'Team Member');
      }
    });
    setActorNames(names);
  }, [actorIds, events]);

  useEffect(() => {
    fetchProjectNames();
    fetchActorNames();
  }, [fetchProjectNames, fetchActorNames]);

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Back to dashboard"
              >
                <span className="text-xl">&larr;</span>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Activity</h1>
            </div>
            <button
              onClick={() => refetch()}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Refresh"
            >
              <span className="text-xl">&#x21bb;</span>
            </button>
          </div>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto py-2 -mx-4 px-4">
            {filterCategories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  min-h-[44px]
                  ${filter === cat.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Activity feed */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <ActivityFeed
          events={filteredEvents}
          isLoading={isLoading}
          error={error}
          showProject={true}
          projectNames={projectNames}
          actorNames={actorNames}
          emptyMessage={
            filter === 'all'
              ? 'No activity yet. Activity will appear here as your team works.'
              : `No ${filterCategories.find(c => c.value === filter)?.label.toLowerCase()} activity`
          }
        />
      </main>
    </div>
  );
}

export default ActivityPage;
