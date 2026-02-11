'use client';

/**
 * Activity Page — The Spine
 *
 * Clean list with status dots, colored left borders, grouped by date.
 * Filter pills by event type. Expandable entries.
 * Per spec Section 5C: Inbox/notifications style.
 */

import { useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { useLocalRecentActivity } from '@/lib/hooks/useLocalData';
import { SimpleActivityFeed } from '@/components/activity';

type EventFilter = 'all' | 'tasks' | 'estimates' | 'system';

const FILTERS: { key: EventFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'estimates', label: 'Estimates' },
  { key: 'system', label: 'System' },
];

function filterEvents(
  events: Array<{ event_type: string; [k: string]: unknown }>,
  filter: EventFilter
) {
  if (filter === 'all') return events;
  if (filter === 'tasks')
    return events.filter((e) =>
      e.event_type.startsWith('task.') ||
      e.event_type.includes('checklist') ||
      e.event_type.includes('time_clock')
    );
  if (filter === 'estimates')
    return events.filter((e) =>
      e.event_type.includes('estimate') ||
      e.event_type.includes('line_item') ||
      e.event_type.includes('budget') ||
      e.event_type.includes('change_order')
    );
  // system
  return events.filter((e) =>
    e.event_type.startsWith('project.') ||
    e.event_type.startsWith('customer.') ||
    e.event_type.includes('seed') ||
    e.event_type.includes('system')
  );
}

export default function ActivityPage() {
  const { data: activityData, isLoading } = useLocalRecentActivity(100);
  const recentEvents = activityData?.events || [];
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');

  const filteredEvents = filterEvents(recentEvents as Array<{ event_type: string }>, activeFilter);

  return (
    <PageErrorBoundary>
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: '#111827' }}>Activity</h1>
              <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                {recentEvents.length} event{recentEvents.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={14} style={{ color: '#9CA3AF' }} />
              <span className="text-[11px]" style={{ color: '#9CA3AF' }}>
                {activeFilter !== 'all' ? `Showing: ${activeFilter}` : 'All types'}
              </span>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {FILTERS.map(({ key, label }) => {
              const count =
                key === 'all'
                  ? recentEvents.length
                  : filterEvents(recentEvents as Array<{ event_type: string }>, key).length;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className="min-h-[32px] px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: activeFilter === key ? '#374151' : '#F3F4F6',
                    color: activeFilter === key ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  {label}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 mt-4">
        <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading activity...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-10">
              <Activity size={28} className="mx-auto mb-2" style={{ color: '#D1D5DB' }} />
              <p className="text-sm font-medium mb-0.5" style={{ color: '#111827' }}>
                {activeFilter === 'all' ? 'No activity yet' : `No ${activeFilter} activity`}
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                {activeFilter === 'all'
                  ? 'Create a project to see activity here'
                  : 'Try selecting "All" to see all activity'}
              </p>
            </div>
          ) : (
            <SimpleActivityFeed events={filteredEvents as any} maxItems={100} showProjectName />
          )}
        </div>
      </div>
    </div>
    </PageErrorBoundary>
  );
}
