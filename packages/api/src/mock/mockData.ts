/**
 * Mock Data for Local Development
 *
 * Provides in-memory storage and sample data for testing
 * the Activity Log UI without a real database.
 *
 * All mock data uses Hooomz Interiors trades and stages:
 *   Work Categories: FL (Flooring), PT (Paint), FC (Finish Carpentry), TL (Tile), DW (Drywall), OH (Overhead)
 *   Stages: ST-DM (Demo), ST-PR (Prime & Prep), ST-FN (Finish), ST-PL (Punch List), ST-CL (Closeout)
 */

import type { ActivityEvent } from '@hooomz/shared';

// Sample project for mock data
export const MOCK_PROJECT = {
  id: 'proj-001',
  name: 'Mitchell Main Floor — Room Refresh',
  organization_id: 'org-001',
  property_id: 'prop-001',
};

// Sample actors
const ACTORS = {
  nathan: { id: 'user-001', name: 'Nathan Montgomery', type: 'team_member' as const },
  nishant: { id: 'user-002', name: 'Nishant', type: 'team_member' as const },
  system: { id: '00000000-0000-0000-0000-000000000000', name: 'System', type: 'system' as const },
};

// Generate timestamps for the past few days
function daysAgo(days: number, hours = 12): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, Math.floor(Math.random() * 60), 0, 0);
  return date.toISOString();
}

// Initial mock events
const initialEvents: ActivityEvent[] = [
  // Today
  {
    id: 'evt-001',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'task.completed',
    timestamp: daysAgo(0, 14),
    summary: 'Completed: Install LVP — Living Room',
    actor_id: ACTORS.nishant.id,
    actor_type: ACTORS.nishant.type,
    actor_name: ACTORS.nishant.name,
    entity_type: 'task_instance',
    entity_id: 'task-001',
    work_category_code: 'FL',
    trade: 'Nishant',
    stage_code: 'ST-FN',
    location_id: 'loc-living-room',
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, task_name: 'Install LVP — Living Room' },
    input_method: 'manual_entry',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  {
    id: 'evt-002',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'photo.uploaded',
    timestamp: daysAgo(0, 11),
    summary: 'Photo uploaded: LVP installation progress — Living Room',
    actor_id: ACTORS.nishant.id,
    actor_type: ACTORS.nishant.type,
    actor_name: ACTORS.nishant.name,
    entity_type: 'photo',
    entity_id: 'photo-001',
    work_category_code: 'FL',
    trade: 'Nishant',
    stage_code: 'ST-FN',
    location_id: 'loc-living-room',
    loop_iteration_id: null,
    homeowner_visible: false,
    event_data: { _version: 1, location: 'Living Room', filename: 'lvp_install_progress.jpg' },
    input_method: 'photo_trigger',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  {
    id: 'evt-003',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'photo.shared',
    timestamp: daysAgo(0, 11),
    summary: 'Photo shared with homeowner: LVP installation — Living Room',
    actor_id: ACTORS.nishant.id,
    actor_type: ACTORS.nishant.type,
    actor_name: ACTORS.nishant.name,
    entity_type: 'photo',
    entity_id: 'photo-001',
    work_category_code: 'FL',
    trade: 'Nishant',
    stage_code: 'ST-FN',
    location_id: 'loc-living-room',
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1 },
    input_method: 'manual_entry',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  // Yesterday
  {
    id: 'evt-004',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'inspection.passed',
    timestamp: daysAgo(1, 10),
    summary: 'Inspection passed: Floor flatness check — Living Room',
    actor_id: ACTORS.system.id,
    actor_type: ACTORS.system.type,
    actor_name: ACTORS.system.name,
    entity_type: 'inspection',
    entity_id: 'insp-001',
    work_category_code: 'FL',
    trade: 'Nathan',
    stage_code: 'ST-PR',
    location_id: 'loc-living-room',
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, inspection_type: 'Floor flatness check' },
    input_method: null,
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  {
    id: 'evt-005',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'task.blocked',
    timestamp: daysAgo(1, 15),
    summary: 'Blocked: Baseboard installation — waiting on trim delivery',
    actor_id: ACTORS.nishant.id,
    actor_type: ACTORS.nishant.type,
    actor_name: ACTORS.nishant.name,
    entity_type: 'task_instance',
    entity_id: 'task-002',
    work_category_code: 'FC',
    trade: 'Nishant',
    stage_code: 'ST-FN',
    location_id: 'loc-living-room',
    loop_iteration_id: null,
    homeowner_visible: false,
    event_data: { _version: 1, task_name: 'Baseboard installation', reason: 'Waiting for MDF baseboard delivery from Ritchies' },
    input_method: 'voice',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  // 2 days ago
  {
    id: 'evt-006',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'estimate.approved',
    timestamp: daysAgo(2, 9),
    summary: 'Estimate approved by Sarah Mitchell — Room Refresh package',
    actor_id: ACTORS.system.id,
    actor_type: ACTORS.system.type,
    actor_name: 'Sarah Mitchell',
    entity_type: 'estimate',
    entity_id: 'est-001',
    work_category_code: null,
    trade: null,
    stage_code: null,
    location_id: null,
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, approved_by: 'Sarah Mitchell', estimate_name: 'Mitchell Main Floor — Room Refresh' },
    input_method: null,
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  {
    id: 'evt-007',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'time.clock_in',
    timestamp: daysAgo(2, 7),
    summary: 'Nishant clocked in',
    actor_id: ACTORS.nishant.id,
    actor_type: ACTORS.nishant.type,
    actor_name: ACTORS.nishant.name,
    entity_type: 'time_entry',
    entity_id: 'time-001',
    work_category_code: null,
    trade: 'Nishant',
    stage_code: null,
    location_id: null,
    loop_iteration_id: null,
    homeowner_visible: false,
    event_data: { _version: 1 },
    input_method: 'geofence',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  // 3 days ago
  {
    id: 'evt-008',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'project.status_changed',
    timestamp: daysAgo(3, 14),
    summary: 'Project status changed: planning → in_progress',
    actor_id: ACTORS.nathan.id,
    actor_type: ACTORS.nathan.type,
    actor_name: ACTORS.nathan.name,
    entity_type: 'project',
    entity_id: MOCK_PROJECT.id,
    work_category_code: null,
    trade: null,
    stage_code: null,
    location_id: null,
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, old_status: 'planning', new_status: 'in_progress' },
    input_method: 'manual_entry',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  // 5 days ago
  {
    id: 'evt-009',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'payment.received',
    timestamp: daysAgo(5, 11),
    summary: 'Payment received: $2,700 deposit',
    actor_id: ACTORS.system.id,
    actor_type: ACTORS.system.type,
    actor_name: ACTORS.system.name,
    entity_type: 'payment',
    entity_id: 'pay-001',
    work_category_code: null,
    trade: null,
    stage_code: null,
    location_id: null,
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, amount: 2700 },
    input_method: null,
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  // Site events
  {
    id: 'evt-010',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'site.meeting',
    timestamp: daysAgo(1, 8),
    summary: 'Site meeting: Pre-start walkthrough with homeowner',
    actor_id: ACTORS.nathan.id,
    actor_type: ACTORS.nathan.type,
    actor_name: ACTORS.nathan.name,
    entity_type: 'meeting',
    entity_id: 'meeting-001',
    work_category_code: null,
    trade: 'Nathan',
    stage_code: null,
    location_id: null,
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, subject: 'Pre-start walkthrough', attendees: ['Nathan', 'Sarah Mitchell'] },
    input_method: 'manual_entry',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  {
    id: 'evt-011',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'material.delivered',
    timestamp: daysAgo(2, 10),
    summary: 'Material delivered: LVP flooring — 450 sqft from Ritchies',
    actor_id: ACTORS.nishant.id,
    actor_type: ACTORS.nishant.type,
    actor_name: ACTORS.nishant.name,
    entity_type: 'delivery',
    entity_id: 'delivery-001',
    work_category_code: 'FL',
    trade: 'Nishant',
    stage_code: 'ST-PR',
    location_id: 'loc-living-room',
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, vendor: 'Ritchies', item: 'LVP flooring — 450 sqft' },
    input_method: 'quick_action',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  {
    id: 'evt-012',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'site.issue',
    timestamp: daysAgo(3, 11),
    summary: 'Issue reported: Subfloor squeaks near hallway transition — needs screwing',
    actor_id: ACTORS.nishant.id,
    actor_type: ACTORS.nishant.type,
    actor_name: ACTORS.nishant.name,
    entity_type: 'issue',
    entity_id: 'issue-001',
    work_category_code: 'FL',
    trade: 'Nishant',
    stage_code: 'ST-PR',
    location_id: 'loc-hallway',
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, issue_type: 'Subfloor', description: 'Subfloor squeaks near hallway transition — needs screwing down before LVP install' },
    input_method: 'voice',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  {
    id: 'evt-013',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'material.shortage',
    timestamp: daysAgo(4, 9),
    summary: 'Material shortage: MDF baseboard — 24 lft short',
    actor_id: ACTORS.nishant.id,
    actor_type: ACTORS.nishant.type,
    actor_name: ACTORS.nishant.name,
    entity_type: 'shortage',
    entity_id: 'shortage-001',
    work_category_code: 'FC',
    trade: 'Nishant',
    stage_code: 'ST-FN',
    location_id: null,
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, item: 'MDF baseboard 3-1/4" (24 lft)' },
    input_method: 'manual_entry',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  {
    id: 'evt-014',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'work.rescheduled',
    timestamp: daysAgo(4, 14),
    summary: 'Rescheduled: Paint — walls/ceilings moved to Feb 3 (waiting on floor completion)',
    actor_id: ACTORS.nathan.id,
    actor_type: ACTORS.nathan.type,
    actor_name: ACTORS.nathan.name,
    entity_type: 'schedule',
    entity_id: 'sched-001',
    work_category_code: 'PT',
    trade: 'Nishant',
    stage_code: 'ST-FN',
    location_id: 'loc-living-room',
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1, original_date: '2026-01-29', new_date: '2026-02-03', reason: 'Waiting on flooring completion before paint' },
    input_method: 'manual_entry',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
  // Week ago
  {
    id: 'evt-015',
    organization_id: 'org-001',
    project_id: MOCK_PROJECT.id,
    property_id: MOCK_PROJECT.property_id,
    event_type: 'project.created',
    timestamp: daysAgo(7, 10),
    summary: 'Project created: Mitchell Main Floor — Room Refresh',
    actor_id: ACTORS.nathan.id,
    actor_type: ACTORS.nathan.type,
    actor_name: ACTORS.nathan.name,
    entity_type: 'project',
    entity_id: MOCK_PROJECT.id,
    work_category_code: null,
    trade: null,
    stage_code: null,
    location_id: null,
    loop_iteration_id: null,
    homeowner_visible: true,
    event_data: { _version: 1 },
    input_method: 'manual_entry',
    batch_id: null,
    project_name: MOCK_PROJECT.name,
  },
];

/**
 * In-memory activity store
 */
class MockActivityStore {
  private events: ActivityEvent[] = [...initialEvents];
  private nextId = 16;

  /**
   * Get all events sorted by timestamp descending
   */
  getAll(): ActivityEvent[] {
    return [...this.events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get events with pagination
   */
  getRecent(options: {
    limit?: number;
    cursor?: string;
    eventType?: string;
    homeownerOnly?: boolean;
  } = {}): { events: ActivityEvent[]; nextCursor: string | null; hasMore: boolean } {
    const { limit = 20, cursor, eventType, homeownerOnly } = options;

    let filtered = this.getAll();

    // Filter by homeowner visibility
    if (homeownerOnly) {
      filtered = filtered.filter(e => e.homeowner_visible);
    }

    // Filter by event type prefix
    if (eventType) {
      if (eventType.endsWith('.*')) {
        const prefix = eventType.slice(0, -2);
        filtered = filtered.filter(e => e.event_type.startsWith(prefix + '.'));
      } else {
        filtered = filtered.filter(e => e.event_type === eventType);
      }
    }

    // Apply cursor
    if (cursor) {
      const cursorIndex = filtered.findIndex(e => e.id === cursor);
      if (cursorIndex !== -1) {
        filtered = filtered.slice(cursorIndex + 1);
      }
    }

    // Get page
    const page = filtered.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const events = page.slice(0, limit);
    const nextCursor = hasMore && events.length > 0 ? events[events.length - 1].id : null;

    return { events, nextCursor, hasMore };
  }

  /**
   * Get events for a project
   */
  getByProject(projectId: string, options: { limit?: number; cursor?: string } = {}) {
    const allForProject = this.getAll().filter(e => e.project_id === projectId);

    const { limit = 20, cursor } = options;
    let filtered = allForProject;

    if (cursor) {
      const cursorIndex = filtered.findIndex(e => e.id === cursor);
      if (cursorIndex !== -1) {
        filtered = filtered.slice(cursorIndex + 1);
      }
    }

    const page = filtered.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const events = page.slice(0, limit);
    const nextCursor = hasMore && events.length > 0 ? events[events.length - 1].id : null;

    return { events, nextCursor, hasMore };
  }

  /**
   * Add a new event
   */
  create(data: Partial<ActivityEvent>): ActivityEvent {
    const event: ActivityEvent = {
      id: `evt-${String(this.nextId++).padStart(3, '0')}`,
      organization_id: data.organization_id || 'org-001',
      project_id: data.project_id || MOCK_PROJECT.id,
      property_id: data.property_id || MOCK_PROJECT.property_id,
      event_type: data.event_type as any || 'field_note.created',
      timestamp: data.timestamp || new Date().toISOString(),
      summary: data.summary || `${data.event_type || 'event'} on ${data.entity_type || 'entity'}`,
      actor_id: data.actor_id || ACTORS.nathan.id,
      actor_type: data.actor_type || 'team_member',
      actor_name: data.actor_name || ACTORS.nathan.name,
      entity_type: data.entity_type || 'unknown',
      entity_id: data.entity_id || `entity-${Date.now()}`,
      work_category_code: data.work_category_code || null,
      trade: data.trade || null,
      stage_code: data.stage_code || null,
      location_id: data.location_id || null,
      loop_iteration_id: data.loop_iteration_id || null,
      homeowner_visible: data.homeowner_visible ?? false,
      event_data: { _version: 1, ...data.event_data },
      input_method: data.input_method || 'manual_entry',
      batch_id: data.batch_id || null,
      project_name: MOCK_PROJECT.name,
    };

    this.events.unshift(event);
    console.log(`📝 New activity event created: ${event.event_type} (${event.id})`);

    return event;
  }

  /**
   * Get event counts by type
   */
  getCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of this.events) {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    }
    return counts;
  }
}

// Singleton instance
export const mockActivityStore = new MockActivityStore();
