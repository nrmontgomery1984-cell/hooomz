/**
 * useRealtimeProject Hook
 * Supabase real-time subscriptions for project data
 * Per spec: Part 8.2 Realtime Subscriptions
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import type { Loop, ActivityEvent } from '../types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeProjectOptions {
  /** The project ID to subscribe to */
  projectId: string | undefined;
  /** Callback when a loop is updated */
  onLoopUpdate?: (loop: Loop) => void;
  /** Callback when a loop is inserted */
  onLoopInsert?: (loop: Loop) => void;
  /** Callback when an activity event is inserted */
  onActivityInsert?: (event: ActivityEvent) => void;
  /** Whether to enable subscriptions */
  enabled?: boolean;
}

/**
 * Hook that subscribes to real-time updates for a project
 * Returns cleanup automatically on unmount
 */
export function useRealtimeProject({
  projectId,
  onLoopUpdate,
  onLoopInsert,
  onActivityInsert,
  enabled = true,
}: UseRealtimeProjectOptions): void {
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    // Don't subscribe if disabled or no project ID
    if (!enabled || !projectId) {
      return;
    }

    // Clean up any existing subscriptions
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Subscribe to loop changes (UPDATE events)
    const loopUpdateChannel = supabase
      .channel(`project-loops-update-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loops',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (onLoopUpdate && payload.new) {
            onLoopUpdate(payload.new as Loop);
          }
        }
      )
      .subscribe();

    channelsRef.current.push(loopUpdateChannel);

    // Subscribe to loop inserts
    const loopInsertChannel = supabase
      .channel(`project-loops-insert-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loops',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (onLoopInsert && payload.new) {
            onLoopInsert(payload.new as Loop);
          }
        }
      )
      .subscribe();

    channelsRef.current.push(loopInsertChannel);

    // Subscribe to activity event inserts
    const activityChannel = supabase
      .channel(`project-activity-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_events',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (onActivityInsert && payload.new) {
            onActivityInsert(payload.new as ActivityEvent);
          }
        }
      )
      .subscribe();

    channelsRef.current.push(activityChannel);

    // Cleanup function
    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [projectId, enabled, onLoopUpdate, onLoopInsert, onActivityInsert]);
}

export default useRealtimeProject;
