/**
 * ActivityFeed Component
 * Displays activity events grouped by day
 * Per spec: Part 4.4 Activity Feed Component
 */

import { useMemo } from 'react';
import { ActivityCard } from './ActivityCard';
import type { ActivityEvent } from '../../types/database';

// ============================================================================
// DAY GROUPING
// ============================================================================

interface DayGroup {
  label: string;
  date: string;
  events: ActivityEvent[];
}

/**
 * Get day label for a date (Today, Yesterday, or date string)
 */
function getDayLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (eventDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (eventDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  // Within this week: show day name
  const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / 86400000);
  if (daysDiff < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Older: show full date
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Group events by day
 */
function groupEventsByDay(events: ActivityEvent[]): DayGroup[] {
  const groups = new Map<string, ActivityEvent[]>();

  for (const event of events) {
    const date = new Date(event.timestamp);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(event);
  }

  // Convert to array and sort by date descending
  const result: DayGroup[] = [];
  for (const [dateKey, dayEvents] of groups) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month, day);

    result.push({
      label: getDayLabel(date),
      date: dateKey,
      events: dayEvents,
    });
  }

  // Sort groups by first event timestamp (descending)
  result.sort((a, b) => {
    const aTime = new Date(a.events[0].timestamp).getTime();
    const bTime = new Date(b.events[0].timestamp).getTime();
    return bTime - aTime;
  });

  return result;
}

// ============================================================================
// COMPONENT
// ============================================================================

export interface ActivityFeedProps {
  /** Activity events to display */
  events: ActivityEvent[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Show project name on cards (for portfolio view) */
  showProject?: boolean;
  /** Map of project IDs to names */
  projectNames?: Map<string, string>;
  /** Map of actor IDs to names */
  actorNames?: Map<string, string>;
  /** Map of event IDs to photo URLs */
  photoUrls?: Map<string, string>;
  /** Click handler for cards */
  onEventClick?: (event: ActivityEvent) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Max events to show per day (for truncation) */
  maxPerDay?: number;
  /** Compact mode for embedding */
  compact?: boolean;
}

export function ActivityFeed({
  events,
  isLoading = false,
  error,
  showProject = false,
  projectNames,
  actorNames,
  photoUrls,
  onEventClick,
  emptyMessage = 'No activity yet',
  maxPerDay,
  compact = false,
}: ActivityFeedProps) {
  // Group events by day
  const dayGroups = useMemo(() => groupEventsByDay(events), [events]);

  // Loading state
  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Failed to load activity</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <span className="text-4xl mb-3">📋</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dayGroups.map((group) => {
        const displayEvents = maxPerDay
          ? group.events.slice(0, maxPerDay)
          : group.events;
        const hiddenCount = maxPerDay
          ? group.events.length - maxPerDay
          : 0;

        return (
          <div key={group.date}>
            {/* Day header */}
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {group.label}
            </h3>

            {/* Events for this day */}
            <div className={compact ? 'divide-y divide-gray-100' : 'space-y-3'}>
              {displayEvents.map((event) => {
                const projectName = projectNames?.get(event.project_id || '');
                const actorName = actorNames?.get(event.actor_id || '');
                const photoUrl = photoUrls?.get(event.id);
                const hasPhoto = event.event_type === 'task.photo_added' || !!photoUrl;

                return (
                  <ActivityCard
                    key={event.id}
                    event={event}
                    showProject={showProject}
                    projectName={projectName}
                    actorName={actorName}
                    hasPhoto={hasPhoto}
                    photoUrl={photoUrl}
                    onClick={onEventClick ? () => onEventClick(event) : undefined}
                    compact={compact}
                  />
                );
              })}

              {/* Show hidden count if truncated */}
              {hiddenCount > 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  +{hiddenCount} more events
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Loading indicator for infinite scroll */}
      {isLoading && events.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full" />
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
