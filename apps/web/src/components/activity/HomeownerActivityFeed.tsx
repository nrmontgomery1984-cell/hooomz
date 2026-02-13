'use client';

/**
 * HomeownerActivityFeed
 *
 * Activity feed for the homeowner/client portal.
 * Only shows events marked as homeowner_visible.
 *
 * Key differences from contractor feed:
 * - Uses simplified filter pills (All, Progress, Photos, Payments)
 * - No Three-Axis filters (homeowners don't think in categories/stages)
 * - Simpler event rows with inline photos
 * - Celebration animations for milestones
 * - No voice input FAB
 *
 * Follows Hooomz UI spec:
 * - Light, warm aesthetic
 * - 44px minimum touch targets
 * - Progressive disclosure
 *
 * Decision Filter Check:
 * - #8 Post-Project Value: Events persist after project closes
 * - #10 Homeowner Education: Simplified, jargon-free language
 * - #11 Data Persistence: Data stays with the home
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { groupEventsByDayArray } from '@hooomz/shared';
import { apiClient } from '@/lib/api/client';
import type { ActivityEvent } from '@/lib/api/hooks/useActivity';
import {
  HomeownerActivityEventRow,
  HomeownerActivityEventRowSkeleton,
} from './HomeownerActivityEventRow';
import { ActivityDayGroup } from './ActivityDayHeader';
import {
  HomeownerFilterPills,
  type HomeownerFilterOption,
  filterHomeownerEvents,
} from './HomeownerFilterPills';

// Polling interval for updates (60 seconds - less frequent for homeowners)
const POLLING_INTERVAL = 60 * 1000;

// Number of events per page
const PAGE_SIZE = 20;

interface HomeownerActivityFeedProps {
  /** Property ID to fetch activity for */
  propertyId: string;
  /** Enable auto-refresh polling */
  enablePolling?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when a photo is clicked */
  onPhotoClick?: (photoId: string) => void;
  /** External filter control (if provided, hides internal filter pills) */
  filter?: HomeownerFilterOption;
  /** Whether to show filter pills (default: true if no external filter) */
  showFilterPills?: boolean;
}

export function HomeownerActivityFeed({
  propertyId,
  enablePolling = true,
  className = '',
  onPhotoClick,
  filter: externalFilter,
  showFilterPills: showPillsProp,
}: HomeownerActivityFeedProps) {
  const queryClient = useQueryClient();
  const [internalFilter, setInternalFilter] = useState<HomeownerFilterOption>('all');

  // Use external filter if provided, otherwise use internal state
  const activeFilter = externalFilter ?? internalFilter;
  const showFilterPills = showPillsProp ?? !externalFilter;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Query key for property activity
  const queryKey = useMemo(() => ['activity', 'property', propertyId, 'homeowner'], [propertyId]);

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
      params.set('homeowner', 'true'); // Only homeowner-visible events

      const url = `/api/properties/${propertyId}/activity?${params}`;

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
    staleTime: 30 * 1000, // 30 seconds - homeowners don't need real-time
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
  const filteredEvents = filterHomeownerEvents(allEvents, activeFilter);

  // Group by day
  const groupedEvents = groupEventsByDayArray(filteredEvents as any);

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-1 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <HomeownerActivityEventRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <p className="text-slate-500 mb-3">Unable to load updates</p>
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
      {/* Filter Pills (only if using internal state) */}
      {showFilterPills && (
        <HomeownerFilterPills
          activeFilter={activeFilter}
          onFilterChange={setInternalFilter}
          className="mb-4"
        />
      )}

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="text-center py-2 text-sm text-slate-400">
          Refreshing...
        </div>
      )}

      {/* Events grouped by day */}
      <div className="space-y-6">
        {groupedEvents.length === 0 ? (
          <HomeownerEmptyState filter={activeFilter} />
        ) : (
          groupedEvents.map(([label, events]) => (
            <ActivityDayGroup key={label} label={label}>
              {events.map((event) => (
                <HomeownerActivityEventRow
                  key={event.id}
                  event={event as ActivityEvent}
                  onPhotoClick={onPhotoClick}
                />
              ))}
            </ActivityDayGroup>
          ))
        )}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="pt-6 pb-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="
              w-full py-3 text-sm font-medium text-teal
              min-h-[44px] rounded-xl
              bg-teal/5 hover:bg-teal/10 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isFetchingNextPage ? 'Loading...' : 'Load earlier updates'}
          </button>
        </div>
      )}

      {/* Pull to refresh button */}
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
            {isRefreshing ? 'Refreshing...' : 'Tap to refresh'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state for homeowner view
 */
function HomeownerEmptyState({ filter }: { filter: HomeownerFilterOption }) {
  const messages: Record<HomeownerFilterOption, { title: string; subtitle: string }> = {
    all: {
      title: 'No updates yet',
      subtitle: 'Updates from your project will appear here',
    },
    progress: {
      title: 'No progress updates',
      subtitle: 'Work completions and milestones will appear here',
    },
    photos: {
      title: 'No photos yet',
      subtitle: 'Photos shared by your contractor will appear here',
    },
    payments: {
      title: 'No payment activity',
      subtitle: 'Estimates, invoices, and payments will appear here',
    },
  };

  const { title, subtitle } = messages[filter];

  return (
    <div className="py-16 text-center">
      <div className="text-4xl mb-4">
        {filter === 'all' && '📋'}
        {filter === 'progress' && '🔨'}
        {filter === 'photos' && '📷'}
        {filter === 'payments' && '💳'}
      </div>
      <p className="text-slate-600 font-medium mb-1">{title}</p>
      <p className="text-slate-400 text-sm">{subtitle}</p>
    </div>
  );
}

/**
 * Simple version for embedding in other views
 */
interface SimpleHomeownerActivityFeedProps {
  events: ActivityEvent[];
  maxItems?: number;
  onPhotoClick?: (photoId: string) => void;
}

export function SimpleHomeownerActivityFeed({
  events,
  maxItems = 10,
  onPhotoClick,
}: SimpleHomeownerActivityFeedProps) {
  const displayEvents = events.slice(0, maxItems);
  const groupedEvents = groupEventsByDayArray(displayEvents as any);

  if (displayEvents.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-4">
        No updates yet
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groupedEvents.map(([label, dayEvents]) => (
        <ActivityDayGroup key={label} label={label} isSticky={false}>
          {dayEvents.map((event) => (
            <HomeownerActivityEventRow
              key={event.id}
              event={event as ActivityEvent}
              onPhotoClick={onPhotoClick}
            />
          ))}
        </ActivityDayGroup>
      ))}
    </div>
  );
}

export default HomeownerActivityFeed;
