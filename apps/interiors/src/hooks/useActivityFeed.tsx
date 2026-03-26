import { useState, useEffect, useCallback } from 'react';
import {
  getRecentActivity,
  getProjectActivity,
  subscribeToProjectActivity,
} from '../services/api/activity';
import type { ActivityEvent } from '../types/database';

const COMPANY_POLL_INTERVAL_MS = 30_000;

interface UseActivityFeedReturn {
  events: ActivityEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseActivityFeedOptions {
  /** Company ID for company-wide activity */
  companyId?: string | null;
  /** Project ID for project-specific activity */
  projectId?: string | null;
  /** Maximum number of events to fetch */
  limit?: number;
  /** Enable realtime updates */
  realtime?: boolean;
}

/**
 * Hook to get activity feed events
 */
export function useActivityFeed(options: UseActivityFeedOptions): UseActivityFeedReturn {
  const { companyId, projectId, limit = 20, realtime = true } = options;

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    // Need either companyId or projectId
    if (!companyId && !projectId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let data: ActivityEvent[];
      if (projectId) {
        data = await getProjectActivity(projectId, limit);
      } else if (companyId) {
        data = await getRecentActivity(companyId, limit);
      } else {
        data = [];
      }

      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch activity'));
    } finally {
      setIsLoading(false);
    }
  }, [companyId, projectId, limit]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!realtime || !projectId) return;

    const unsubscribe = subscribeToProjectActivity(projectId, (newEvent) => {
      setEvents((prev) => [newEvent, ...prev.slice(0, limit - 1)]);
    });

    return unsubscribe;
  }, [projectId, realtime, limit]);

  // For company-wide activity, we need to subscribe to all projects
  // This is more complex - for now, just refetch periodically
  useEffect(() => {
    if (!realtime || !companyId || projectId) return;

    const interval = setInterval(fetchEvents, COMPANY_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [companyId, projectId, realtime, fetchEvents]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
  };
}

export default useActivityFeed;
