'use client';

/**
 * ActivityFeed
 *
 * The main activity feed container component.
 * THE SPINE of Hooomz - displays the immutable event log.
 *
 * Features:
 * - Cursor-based pagination with "Load more"
 * - 30-second polling for updates (MVP)
 * - Pull-to-refresh
 * - Day grouping with sticky headers
 * - Filter pills
 *
 * Follows Hooomz UI spec:
 * - Light, warm aesthetic (Pixar + Google + Disney)
 * - 44px minimum touch targets
 * - Progressive disclosure
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { groupEventsByDayArray } from '@hooomz/shared';
import { apiClient } from '@/lib/api/client';
import type { ActivityEvent } from '@/lib/api/hooks/useActivity';
import { ActivityEventRow, ActivityEventRowSkeleton } from './ActivityEventRow';
import { ActivityDayGroup } from './ActivityDayHeader';
import { ActivityFilterPills, type FilterOption, filterEventsByCategory } from './ActivityFilterPills';

// Polling interval for updates (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

// Number of events per page
const PAGE_SIZE = 20;

interface ActivityFeedProps {
  /** Optional project ID to filter events */
  projectId?: string;
  /** Show project name in event breadcrumbs */
  showProjectName?: boolean;
  /** Enable auto-refresh polling */
  enablePolling?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when a photo is clicked */
  onPhotoClick?: (photoId: string) => void;
  /** Callback when an entity is clicked */
  onEntityClick?: (entityType: string, entityId: string) => void;
}

export function ActivityFeed({
  projectId,
  showProjectName = !projectId,
  enablePolling = true,
  className = '',
  onPhotoClick,
  onEntityClick,
}: ActivityFeedProps) {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build query key based on project context
  const queryKey = useMemo(() => projectId
    ? ['activity', 'project', projectId]
    : ['activity', 'recent'], [projectId]);

  // Infinite query for paginated events
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', String(PAGE_SIZE));

      const url = projectId
        ? `/api/activity/project/${projectId}?${params}`
        : `/api/activity/recent?${params}`;

      const response = await apiClient.get<{
        data: ActivityEvent[];
        pagination: { nextCursor: string | null; hasMore: boolean };
      }>(url);

      // Transform to expected format
      return {
        events: response.data,
        nextCursor: response.pagination.nextCursor,
        hasMore: response.pagination.hasMore,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 10 * 1000, // 10 seconds
  });

  // Polling for updates
  useEffect(() => {
    if (!enablePolling) return;

    const interval = setInterval(() => {
      // Only refetch if user is at the top of the feed
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        if (scrollTop < 100) {
          queryClient.invalidateQueries({ queryKey });
        }
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [enablePolling, queryClient, queryKey]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Flatten all pages into single array
  const allEvents = data?.pages.flatMap((page) => page.events) || [];

  // Apply filter
  const filteredEvents = filterEventsByCategory(allEvents, activeFilter) as ActivityEvent[];

  // Group by day
  const groupedEvents = groupEventsByDayArray(filteredEvents as any);

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-1 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivityEventRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <p className="text-slate-500 mb-3">Failed to load activity</p>
        <button
          onClick={() => refetch()}
          className="text-teal font-medium min-h-[44px] px-4"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {/* Filter Pills */}
      <ActivityFilterPills
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        className="mb-4"
      />

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="text-center py-2 text-sm text-slate-400">
          Refreshing...
        </div>
      )}

      {/* Events grouped by day */}
      <div id="activity-feed" role="tabpanel" className="space-y-4">
        {groupedEvents.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          groupedEvents.map(([label, events]) => (
            <ActivityDayGroup key={label} label={label}>
              {events.map((event) => (
                <ActivityEventRow
                  key={event.id}
                  event={event as ActivityEvent}
                  showProjectName={showProjectName}
                  onPhotoClick={onPhotoClick}
                  onEntityClick={onEntityClick}
                />
              ))}
            </ActivityDayGroup>
          ))
        )}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="pt-4 pb-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="
              w-full py-3 text-sm font-medium text-teal
              min-h-[44px] rounded-lg
              hover:bg-teal/5 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      {/* Pull to refresh button (mobile alternative) */}
      {!hasNextPage && allEvents.length > 0 && (
        <div className="pt-4 pb-2 text-center">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="
              text-sm text-slate-400
              min-h-[44px] px-4
              hover:text-slate-600 transition-colors
            "
          >
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ filter }: { filter: FilterOption }) {
  const messages: Record<FilterOption, string> = {
    all: 'No activity yet',
    tasks: 'No task activity',
    photos: 'No photos yet',
    estimates: 'No estimate activity',
    payments: 'No payment activity',
    time: 'No time entries',
  };

  return (
    <div className="py-12 text-center">
      <p className="text-slate-400 text-sm">{messages[filter]}</p>
      {filter !== 'all' && (
        <p className="text-slate-300 text-xs mt-1">
          Try selecting &ldquo;All&rdquo; to see all activity
        </p>
      )}
    </div>
  );
}

/**
 * Simple ActivityFeed for embedding in other components
 * (e.g., project detail, dashboard widget)
 */
interface SimpleActivityFeedProps {
  events: ActivityEvent[];
  maxItems?: number;
  showProjectName?: boolean;
}

export function SimpleActivityFeed({
  events,
  maxItems = 10,
  showProjectName = false,
}: SimpleActivityFeedProps) {
  const displayEvents = events.slice(0, maxItems);
  const groupedEvents = groupEventsByDayArray(displayEvents as any);

  if (displayEvents.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
    );
  }

  return (
    <div className="space-y-3">
      {groupedEvents.map(([label, dayEvents]) => (
        <ActivityDayGroup key={label} label={label} isSticky={false}>
          {dayEvents.map((event) => (
            <ActivityEventRow
              key={event.id}
              event={event as ActivityEvent}
              showProjectName={showProjectName}
            />
          ))}
        </ActivityDayGroup>
      ))}
    </div>
  );
}
