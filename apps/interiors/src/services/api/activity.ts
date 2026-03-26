import { supabase } from '../supabase';
import type { ActivityEvent, NewActivityEvent } from '../../types/database';

/**
 * Get recent activity for a company (across all projects)
 */
export async function getRecentActivity(
  companyId: string,
  limit: number = 20
): Promise<ActivityEvent[]> {
  const { data: projects, error: projectsError } = await supabase
    .from('loops')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'project');

  if (projectsError) {
    throw new Error(`Failed to fetch projects: ${projectsError.message}`);
  }

  if (!projects || projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((p: { id: string }) => p.id);

  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .in('project_id', projectIds)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch activity: ${error.message}`);
  }

  return (data || []) as ActivityEvent[];
}

/**
 * Get activity for a specific project
 */
export async function getProjectActivity(
  projectId: string,
  limit: number = 50
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('project_id', projectId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch project activity: ${error.message}`);
  }

  return (data || []) as ActivityEvent[];
}

/**
 * Get activity for a specific loop
 */
export async function getLoopActivity(
  loopId: string,
  limit: number = 20
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('loop_id', loopId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch loop activity: ${error.message}`);
  }

  return (data || []) as ActivityEvent[];
}

/**
 * Create a new activity event
 */
export async function createActivityEvent(
  event: NewActivityEvent
): Promise<ActivityEvent> {
  const { data, error } = await supabase
    .from('activity_events')
    .insert(event as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create activity event: ${error.message}`);
  }

  return data as ActivityEvent;
}

/**
 * Get client-visible activity for a project (client portal use)
 */
export async function getClientVisibleActivity(
  projectId: string,
  limit: number = 20
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('project_id', projectId)
    .eq('client_visible', true)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch client activity: ${error.message}`);
  }

  return (data || []) as ActivityEvent[];
}

/**
 * Create a client comment event
 */
export async function createClientCommentEvent(
  projectId: string,
  content: string
): Promise<ActivityEvent> {
  return createActivityEvent({
    event_type: 'comment.added',
    loop_id: null,
    project_id: projectId,
    actor_id: null, // Anonymous for client portal demo
    actor_type: 'user',
    payload: {
      content,
      source: 'client_portal',
    },
    client_visible: true,
  });
}

/**
 * Subscribe to activity events for a project (realtime)
 */
export function subscribeToProjectActivity(
  projectId: string,
  onEvent: (event: ActivityEvent) => void
) {
  const channel = supabase
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
        onEvent(payload.new as ActivityEvent);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
