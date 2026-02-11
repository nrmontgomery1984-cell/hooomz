/**
 * Activity Service
 *
 * The core service for the Activity Log - THE SPINE of Hooomz.
 *
 * Every action in the system must write an event through this service.
 * Events are IMMUTABLE - never edited or deleted.
 *
 * This service is used by all other services to log their events.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ActivityEvent,
  ActivityEventType,
  ActorType,
  ActivityQueryOptions,
  PaginatedActivityResult,
  CreateActivityEventInput,
  InputMethod,
} from '@hooomz/shared';
import {
  EVENT_VISIBILITY_DEFAULTS,
  SYSTEM_USER,
} from '@hooomz/shared';

// Re-export SYSTEM_USER for convenience
export { SYSTEM_USER } from '@hooomz/shared';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const EVENT_DATA_VERSION = 1;

// ============================================================================
// ActivityService
// ============================================================================

export class ActivityService {
  constructor(private supabase: SupabaseClient) {}

  // ==========================================================================
  // CREATE EVENT
  // ==========================================================================

  /**
   * Create a new activity event
   *
   * This is the primary method for logging events to the activity log.
   * All other services should call this method to log their events.
   *
   * @param data - The event data
   * @returns The created event
   * @throws Error if required fields are missing or insert fails
   */
  async createEvent(data: CreateActivityEventInput): Promise<ActivityEvent> {
    // Validate required fields
    this.validateCreateInput(data);

    // Determine visibility (use default if not explicitly set)
    const homeownerVisible =
      data.homeowner_visible ??
      EVENT_VISIBILITY_DEFAULTS[data.event_type] ??
      false;

    // Determine input method
    // For system-generated events, input_method should be null (not 'system')
    const inputMethod: InputMethod | null = data.input_method ?? null;

    // Build event data with version
    const eventData = {
      ...(data.event_data || {}),
      _version: EVENT_DATA_VERSION,
    };

    // Build the event record
    const eventRecord = {
      organization_id: data.organization_id,
      project_id: data.project_id ?? null,
      property_id: data.property_id ?? null,
      event_type: data.event_type,
      timestamp: data.timestamp
        ? new Date(data.timestamp).toISOString()
        : new Date().toISOString(),
      summary: data.summary,
      actor_id: data.actor_id,
      actor_type: data.actor_type,
      actor_name: data.actor_name ?? null, // Will be auto-populated by DB trigger
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      work_category_code: data.work_category_code ?? null,
      trade: data.trade ?? null,
      stage_code: data.stage_code ?? null,
      location_id: data.location_id ?? null,
      loop_iteration_id: data.loop_iteration_id ?? null,
      homeowner_visible: homeownerVisible,
      event_data: eventData,
      input_method: inputMethod,
      batch_id: data.batch_id ?? null,
    };

    const { data: result, error } = await this.supabase
      .from('activity_events')
      .insert(eventRecord)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create activity event: ${error.message}`);
    }

    return this.mapToActivityEvent(result);
  }

  /**
   * Create multiple events in a batch
   *
   * All events in a batch share the same batch_id for grouping.
   *
   * @param events - Array of event inputs
   * @returns Array of created events
   */
  async createBatch(events: CreateActivityEventInput[]): Promise<ActivityEvent[]> {
    if (events.length === 0) {
      return [];
    }

    // Generate a batch ID
    const batchId = crypto.randomUUID();

    // Create all events with the batch ID
    const results = await Promise.all(
      events.map(event =>
        this.createEvent({
          ...event,
          batch_id: batchId,
        })
      )
    );

    return results;
  }

  // ==========================================================================
  // QUERY METHODS
  // ==========================================================================

  /**
   * Get activity for a specific project
   *
   * @param projectId - The project ID
   * @param options - Query options (limit, cursor, filters)
   * @returns Paginated activity events
   */
  async getProjectActivity(
    projectId: string,
    options: ActivityQueryOptions = {}
  ): Promise<PaginatedActivityResult> {
    const { limit, cursor, eventType, from, to } = this.normalizeOptions(options);

    let query = this.supabase
      .from('activity_events')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check hasMore

    // Apply cursor pagination
    if (cursor) {
      query = query.lt('id', cursor);
    }

    // Apply event type filter (supports prefix matching like 'task.*')
    if (eventType) {
      if (eventType.endsWith('.*')) {
        const prefix = eventType.slice(0, -2);
        query = query.like('event_type', `${prefix}.%`);
      } else {
        query = query.eq('event_type', eventType);
      }
    }

    // Apply date range filters
    if (from) {
      query = query.gte('timestamp', from.toISOString());
    }
    if (to) {
      query = query.lte('timestamp', to.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch project activity: ${error.message}`);
    }

    return this.buildPaginatedResult(data || [], limit);
  }

  /**
   * Get recent activity across all projects for an organization
   *
   * @param orgId - The organization ID
   * @param options - Query options (limit, cursor, filters)
   * @returns Paginated activity events
   */
  async getRecentActivity(
    orgId: string,
    options: ActivityQueryOptions = {}
  ): Promise<PaginatedActivityResult> {
    const { limit, cursor, eventType, from, to } = this.normalizeOptions(options);

    let query = this.supabase
      .from('v_recent_activity') // Use view for project_name
      .select('*')
      .eq('organization_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('id', cursor);
    }

    if (eventType) {
      if (eventType.endsWith('.*')) {
        const prefix = eventType.slice(0, -2);
        query = query.like('event_type', `${prefix}.%`);
      } else {
        query = query.eq('event_type', eventType);
      }
    }

    if (from) {
      query = query.gte('timestamp', from.toISOString());
    }
    if (to) {
      query = query.lte('timestamp', to.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch recent activity: ${error.message}`);
    }

    return this.buildPaginatedResult(data || [], limit);
  }

  /**
   * Get activity for a specific property
   *
   * Used for both contractor and homeowner portal views.
   *
   * @param propertyId - The property ID
   * @param homeownerOnly - If true, only return homeowner-visible events
   * @param options - Query options (limit, cursor, filters)
   * @returns Paginated activity events
   */
  async getPropertyActivity(
    propertyId: string,
    homeownerOnly: boolean,
    options: ActivityQueryOptions = {}
  ): Promise<PaginatedActivityResult> {
    const { limit, cursor, eventType, from, to } = this.normalizeOptions(options);

    // Use filtered view for homeowner-only queries
    const table = homeownerOnly ? 'v_homeowner_activity' : 'activity_events';

    let query = this.supabase
      .from(table)
      .select('*')
      .eq('property_id', propertyId)
      .order('timestamp', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('id', cursor);
    }

    if (eventType) {
      if (eventType.endsWith('.*')) {
        const prefix = eventType.slice(0, -2);
        query = query.like('event_type', `${prefix}.%`);
      } else {
        query = query.eq('event_type', eventType);
      }
    }

    if (from) {
      query = query.gte('timestamp', from.toISOString());
    }
    if (to) {
      query = query.lte('timestamp', to.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch property activity: ${error.message}`);
    }

    return this.buildPaginatedResult(data || [], limit);
  }

  // ==========================================================================
  // AGGREGATION METHODS
  // ==========================================================================

  /**
   * Get event counts by type for a project
   *
   * Useful for dashboards and reporting.
   *
   * @param projectId - The project ID
   * @param since - Count events after this date
   * @returns Map of event type to count
   */
  async getEventCountByType(
    projectId: string,
    since: Date
  ): Promise<Map<string, number>> {
    const { data, error } = await this.supabase
      .from('activity_events')
      .select('event_type')
      .eq('project_id', projectId)
      .gte('timestamp', since.toISOString());

    if (error) {
      throw new Error(`Failed to fetch event counts: ${error.message}`);
    }

    const counts = new Map<string, number>();
    for (const row of data || []) {
      const current = counts.get(row.event_type) || 0;
      counts.set(row.event_type, current + 1);
    }

    return counts;
  }

  /**
   * Get event counts by category (grouped event types)
   *
   * @param projectId - The project ID
   * @param since - Count events after this date
   * @returns Map of category to count
   */
  async getEventCountByCategory(
    projectId: string,
    since: Date
  ): Promise<Map<string, number>> {
    const eventCounts = await this.getEventCountByType(projectId, since);
    const categoryCounts = new Map<string, number>();

    // Map event types to categories
    for (const [eventType, count] of eventCounts) {
      const category = eventType.split('.')[0];
      const current = categoryCounts.get(category) || 0;
      categoryCounts.set(category, current + count);
    }

    return categoryCounts;
  }

  // ==========================================================================
  // CONVENIENCE METHODS FOR COMMON EVENTS
  // ==========================================================================

  /**
   * Log a system event (uses SYSTEM_USER as actor)
   */
  async logSystemEvent(
    data: Omit<CreateActivityEventInput, 'actor_id' | 'actor_type' | 'actor_name'>
  ): Promise<ActivityEvent> {
    return this.createEvent({
      ...data,
      actor_id: SYSTEM_USER.id,
      actor_type: SYSTEM_USER.type,
      actor_name: SYSTEM_USER.name,
      // System events have null input_method (not 'system')
      input_method: undefined,
    });
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Validate required fields for creating an event
   */
  private validateCreateInput(data: CreateActivityEventInput): void {
    const required: (keyof CreateActivityEventInput)[] = [
      'organization_id',
      'event_type',
      'actor_id',
      'actor_type',
      'entity_type',
      'entity_id',
    ];

    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure we have organizational context
    if (!data.project_id && !data.organization_id) {
      throw new Error('Event must have either project_id or organization_id');
    }
  }

  /**
   * Normalize query options with defaults and bounds
   */
  private normalizeOptions(options: ActivityQueryOptions): {
    limit: number;
    cursor: string | undefined;
    eventType: string | undefined;
    from: Date | undefined;
    to: Date | undefined;
  } {
    return {
      limit: Math.min(Math.max(options.limit || DEFAULT_LIMIT, 1), MAX_LIMIT),
      cursor: options.cursor,
      eventType: options.eventType,
      from: options.from,
      to: options.to,
    };
  }

  /**
   * Build paginated result from query data
   */
  private buildPaginatedResult(
    data: unknown[],
    limit: number
  ): PaginatedActivityResult {
    const hasMore = data.length > limit;
    const events = data.slice(0, limit).map(row => this.mapToActivityEvent(row));
    const nextCursor = hasMore && events.length > 0
      ? events[events.length - 1].id
      : null;

    return {
      events,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Map database row to ActivityEvent type
   */
  private mapToActivityEvent(row: unknown): ActivityEvent {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      organization_id: r.organization_id as string,
      project_id: r.project_id as string | null,
      property_id: r.property_id as string | null,
      event_type: r.event_type as ActivityEventType,
      timestamp: r.timestamp as string,
      summary: r.summary as string,
      actor_id: r.actor_id as string,
      actor_type: r.actor_type as ActorType,
      actor_name: r.actor_name as string,
      entity_type: r.entity_type as string,
      entity_id: r.entity_id as string,
      work_category_code: r.work_category_code as string | null,
      trade: r.trade as string | null,
      stage_code: r.stage_code as string | null,
      location_id: r.location_id as string | null,
      loop_iteration_id: r.loop_iteration_id as string | null,
      homeowner_visible: r.homeowner_visible as boolean,
      event_data: r.event_data as Record<string, unknown> & { _version: number },
      input_method: r.input_method as InputMethod | null,
      batch_id: r.batch_id as string | null,
      project_name: r.project_name as string | undefined,
    };
  }
}

// ============================================================================
// Legacy Interface (for backward compatibility)
// ============================================================================

/**
 * Simple log method interface for services that just need basic logging
 */
export interface ActivityLogger {
  log(event: {
    organization_id: string;
    project_id?: string;  // Optional - some events (home profile) don't have a project
    property_id: string;
    event_type: ActivityEventType;
    summary?: string;     // Human-readable description (auto-generated if not provided)
    actor_id: string;
    actor_type: ActorType;
    entity_type: string;
    entity_id: string;
    homeowner_visible?: boolean;
    work_category_code?: string | null;
    trade?: string | null;
    stage_code?: string | null;
    location_id?: string | null;
    event_data: Record<string, unknown>;
  }): Promise<void>;
}

/**
 * Create a simple logger interface from ActivityService
 * For backward compatibility with existing services
 */
export function createActivityLogger(service: ActivityService): ActivityLogger {
  return {
    async log(event) {
      const summary: string = event.summary || `${event.event_type} on ${event.entity_type} ${event.entity_id}`;
      await service.createEvent({
        organization_id: event.organization_id,
        project_id: event.project_id,
        property_id: event.property_id,
        event_type: event.event_type,
        summary,
        actor_id: event.actor_id,
        actor_type: event.actor_type,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        homeowner_visible: event.homeowner_visible,
        work_category_code: event.work_category_code,
        trade: event.trade,
        stage_code: event.stage_code,
        location_id: event.location_id,
        event_data: event.event_data,
      });
    },
  };
}
