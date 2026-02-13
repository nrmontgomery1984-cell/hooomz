'use client';

/**
 * ProjectActivityFeed
 *
 * Activity feed scoped to a specific project with Three-Axis filtering.
 *
 * Features:
 * - All features of ActivityFeed (pagination, polling, day grouping)
 * - Two rows of filters:
 *   - Row 1: Event type (All, Tasks, Photos, etc.)
 *   - Row 2: Three-Axis filters (Category, Stage, Location)
 * - Project-specific data fetching
 *
 * Follows Hooomz UI spec:
 * - Light, warm aesthetic (Pixar + Google + Disney)
 * - 44px minimum touch targets
 * - Progressive disclosure
 *
 * Three-Axis Model:
 * - Work Category: Flooring, Paint, Finish Carpentry, Tile, Drywall, Overhead
 * - Stage: Demo, Prime & Prep, Finish, Punch List, Closeout
 * - Location: Kitchen, Master Bath, Living Room, etc.
 *
 * Same task appears in all three views - orthogonal filtering.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupEventsByDayArray } from '@hooomz/shared';
import { apiClient } from '@/lib/api/client';
import type { ActivityEvent } from '@/lib/api/hooks/useActivity';
import { ActivityEventRow, ActivityEventRowSkeleton } from './ActivityEventRow';
import { ActivityDayGroup } from './ActivityDayHeader';
import { ActivityFilterPills, type FilterOption, filterEventsByCategory } from './ActivityFilterPills';
import { ThreeAxisFilters, type ThreeAxisFilterValues, type ThreeAxisOption } from './ThreeAxisFilters';

// Polling interval for updates (30 seconds)
const POLLING_INTERVAL = 30 * 1000;

// Number of events per page
const PAGE_SIZE = 20;

interface ProjectActivityFeedProps {
  /** Required project ID */
  projectId: string;
  /** Enable auto-refresh polling */
  enablePolling?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when a photo is clicked */
  onPhotoClick?: (photoId: string) => void;
  /** Callback when an entity is clicked */
  onEntityClick?: (entityType: string, entityId: string) => void;
}

/**
 * Response type for project metadata (Three-Axis options)
 */
interface ProjectMetadata {
  workCategories: ThreeAxisOption[];
  stages: ThreeAxisOption[];
  locations: ThreeAxisOption[];
}

export function ProjectActivityFeed({
  projectId,
  enablePolling = true,
  className = '',
  onPhotoClick,
  onEntityClick,
}: ProjectActivityFeedProps) {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [threeAxisFilters, setThreeAxisFilters] = useState<ThreeAxisFilterValues>({
    workCategory: null,
    stage: null,
    location: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch project metadata for Three-Axis filter options
  const { data: metadata, isLoading: isLoadingMetadata } = useQuery({
    queryKey: ['project', projectId, 'metadata'],
    queryFn: async () => {
      // This would be a real API call to get project's work categories, stages, and locations
      // For now, return mock data structure
      try {
        const response = await apiClient.get<ProjectMetadata>(
          `/api/projects/${projectId}/metadata`
        );
        return response;
      } catch {
        // Return empty arrays if metadata endpoint doesn't exist yet
        return {
          workCategories: [],
          stages: [],
          locations: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - metadata changes rarely
  });

  // Build query key including Three-Axis filters
  const queryKey = useMemo(() => [
    'activity',
    'project',
    projectId,
    threeAxisFilters.workCategory,
    threeAxisFilters.stage,
    threeAxisFilters.location,
  ], [projectId, threeAxisFilters.workCategory, threeAxisFilters.stage, threeAxisFilters.location]);

  // Infinite query for paginated events with Three-Axis filters
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

      // Add Three-Axis filters to query
      if (threeAxisFilters.workCategory) {
        params.set('work_category_code', threeAxisFilters.workCategory);
      }
      if (threeAxisFilters.stage) {
        params.set('stage_code', threeAxisFilters.stage);
      }
      if (threeAxisFilters.location) {
        params.set('location_id', threeAxisFilters.location);
      }

      const url = `/api/activity/project/${projectId}?${params}`;

      const response = await apiClient.get<{
        data: ActivityEvent[];
        pagination: { nextCursor: string | null; hasMore: boolean };
      }>(url);

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

  // Handle Three-Axis filter changes
  const handleThreeAxisChange = useCallback((values: ThreeAxisFilterValues) => {
    setThreeAxisFilters(values);
  }, []);

  // Handle breadcrumb click to filter by axis
  const handleBreadcrumbFilter = useCallback(
    (axis: keyof ThreeAxisFilterValues, code: string) => {
      setThreeAxisFilters((prev) => ({
        ...prev,
        [axis]: code,
      }));
    },
    []
  );

  // Flatten all pages into single array
  const allEvents = data?.pages.flatMap((page) => page.events) || [];

  // Apply event type filter (client-side)
  const filteredEvents = filterEventsByCategory(allEvents, activeFilter) as ActivityEvent[];

  // Group by day
  const groupedEvents = groupEventsByDayArray(filteredEvents as any);

  // Check if any Three-Axis filters are active
  const hasThreeAxisFilters =
    threeAxisFilters.workCategory !== null ||
    threeAxisFilters.stage !== null ||
    threeAxisFilters.location !== null;

  // Loading state
  if (isLoading || isLoadingMetadata) {
    return (
      <div className={`space-y-1 ${className}`}>
        {/* Skeleton filter pills */}
        <div className="flex gap-2 mb-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[44px] w-20 bg-slate-200 rounded-full" />
          ))}
        </div>
        {/* Skeleton events */}
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
      {/* Row 1: Event Type Filter Pills */}
      <ActivityFilterPills
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        className="mb-3"
      />

      {/* Row 2: Three-Axis Filters */}
      <ThreeAxisFilters
        workCategories={metadata?.workCategories || []}
        stages={metadata?.stages || []}
        locations={metadata?.locations || []}
        values={threeAxisFilters}
        onChange={handleThreeAxisChange}
        className="mb-4"
      />

      {/* Active filter summary */}
      {hasThreeAxisFilters && (
        <div className="mb-4 text-xs text-slate-500">
          Showing events matching selected filters
        </div>
      )}

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="text-center py-2 text-sm text-slate-400">
          Refreshing...
        </div>
      )}

      {/* Events grouped by day */}
      <div id="activity-feed" role="tabpanel" className="space-y-4">
        {groupedEvents.length === 0 ? (
          <EmptyState
            filter={activeFilter}
            hasThreeAxisFilters={hasThreeAxisFilters}
            onClearFilters={() => {
              setActiveFilter('all');
              setThreeAxisFilters({
                workCategory: null,
                stage: null,
                location: null,
              });
            }}
          />
        ) : (
          groupedEvents.map(([label, events]) => (
            <ActivityDayGroup key={label} label={label}>
              {events.map((event) => (
                <ActivityEventRow
                  key={event.id}
                  event={event as ActivityEvent}
                  showProjectName={false}
                  onPhotoClick={onPhotoClick}
                  onEntityClick={onEntityClick}
                  onBreadcrumbFilter={handleBreadcrumbFilter}
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
 * Empty state component with filter context
 */
interface EmptyStateProps {
  filter: FilterOption;
  hasThreeAxisFilters: boolean;
  onClearFilters: () => void;
}

function EmptyState({ filter, hasThreeAxisFilters, onClearFilters }: EmptyStateProps) {
  const messages: Record<FilterOption, string> = {
    all: 'No activity yet',
    tasks: 'No task activity',
    photos: 'No photos yet',
    estimates: 'No estimate activity',
    payments: 'No payment activity',
    time: 'No time entries',
  };

  const hasAnyFilter = filter !== 'all' || hasThreeAxisFilters;

  return (
    <div className="py-12 text-center">
      <p className="text-slate-400 text-sm">{messages[filter]}</p>
      {hasAnyFilter && (
        <button
          onClick={onClearFilters}
          className="mt-3 text-teal text-sm font-medium min-h-[44px] px-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
