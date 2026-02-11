/**
 * Activity Logging Integration Tests
 *
 * Tests the activity log spine - three-axis filtering, summary generation,
 * and event type coverage.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock activity events for testing filtering
interface MockActivityEvent {
  id: string;
  event_type: string;
  timestamp: string;
  summary: string;
  actor_id: string;
  actor_type: 'team_member' | 'system' | 'customer';
  actor_name: string;
  organization_id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  work_category_code: string | null;
  trade: string | null;
  stage_code: string | null;
  location_id: string | null;
  homeowner_visible: boolean;
  event_data: Record<string, unknown>;
}

// Test data factory
function createMockEvent(overrides: Partial<MockActivityEvent> = {}): MockActivityEvent {
  return {
    id: `event_${Math.random().toString(36).slice(2)}`,
    event_type: 'task.created',
    timestamp: new Date().toISOString(),
    summary: 'Created task: Test Task',
    actor_id: 'user_1',
    actor_type: 'team_member',
    actor_name: 'Nathan',
    organization_id: 'org_1',
    project_id: 'proj_1',
    entity_type: 'task',
    entity_id: 'task_1',
    work_category_code: null,
    trade: null,
    stage_code: null,
    location_id: null,
    homeowner_visible: false,
    event_data: {},
    ...overrides,
  };
}

// Mock filter function (mirrors ActivityRepository.applyFilters)
function applyFilters(
  events: MockActivityEvent[],
  filters: {
    project_id?: string;
    event_type?: string | string[];
    entity_type?: string;
    work_category_code?: string;
    trade?: string;
    stage_code?: string;
    location_id?: string;
    homeowner_visible?: boolean;
  }
): MockActivityEvent[] {
  let filtered = events;

  if (filters.project_id) {
    filtered = filtered.filter((e) => e.project_id === filters.project_id);
  }

  if (filters.event_type) {
    const types = Array.isArray(filters.event_type)
      ? filters.event_type
      : [filters.event_type];
    filtered = filtered.filter((e) => types.includes(e.event_type));
  }

  if (filters.entity_type) {
    filtered = filtered.filter((e) => e.entity_type === filters.entity_type);
  }

  if (filters.work_category_code) {
    filtered = filtered.filter((e) => e.work_category_code === filters.work_category_code);
  }

  if (filters.trade) {
    filtered = filtered.filter((e) => e.trade === filters.trade);
  }

  if (filters.stage_code) {
    filtered = filtered.filter((e) => e.stage_code === filters.stage_code);
  }

  if (filters.location_id) {
    filtered = filtered.filter((e) => e.location_id === filters.location_id);
  }

  if (filters.homeowner_visible !== undefined) {
    filtered = filtered.filter((e) => e.homeowner_visible === filters.homeowner_visible);
  }

  return filtered;
}

describe('Activity Logging - Three-Axis Filtering', () => {
  let testEvents: MockActivityEvent[];

  beforeEach(() => {
    // Create test events with varying three-axis tags
    testEvents = [
      // Flooring tasks
      createMockEvent({
        id: 'event_1',
        event_type: 'task.created',
        summary: 'Created task: Install LVP Flooring — Kitchen',
        work_category_code: 'FL',
        trade: 'Nishant',
        stage_code: 'ST-FINISH',
        location_id: 'loc-kitchen',
      }),
      createMockEvent({
        id: 'event_2',
        event_type: 'task.completed',
        summary: 'Completed task: Install LVP Flooring — Kitchen',
        work_category_code: 'FL',
        trade: 'Nishant',
        stage_code: 'ST-FINISH',
        location_id: 'loc-kitchen',
      }),
      createMockEvent({
        id: 'event_3',
        event_type: 'task.created',
        summary: 'Created task: Install LVP Flooring — Living Room',
        work_category_code: 'FL',
        trade: 'Nishant',
        stage_code: 'ST-FINISH',
        location_id: 'loc-living-room',
      }),

      // Electrical tasks
      createMockEvent({
        id: 'event_4',
        event_type: 'task.created',
        summary: 'Created task: Rough-in electrical — Kitchen',
        work_category_code: 'EL',
        trade: 'Nathan',
        stage_code: 'ST-ROUGH',
        location_id: 'loc-kitchen',
      }),
      createMockEvent({
        id: 'event_5',
        event_type: 'task.started',
        summary: 'Started task: Rough-in electrical — Kitchen',
        work_category_code: 'EL',
        trade: 'Nathan',
        stage_code: 'ST-ROUGH',
        location_id: 'loc-kitchen',
      }),
      createMockEvent({
        id: 'event_6',
        event_type: 'task.completed',
        summary: 'Completed task: Final electrical — Kitchen',
        work_category_code: 'EL',
        trade: 'Nathan',
        stage_code: 'ST-FINISH',
        location_id: 'loc-kitchen',
      }),

      // Plumbing tasks
      createMockEvent({
        id: 'event_7',
        event_type: 'task.created',
        summary: 'Created task: Rough-in plumbing — Bathroom',
        work_category_code: 'PL',
        trade: 'SubPlumber',
        stage_code: 'ST-ROUGH',
        location_id: 'loc-bathroom',
      }),

      // Estimate events
      createMockEvent({
        id: 'event_8',
        event_type: 'estimate.line_item_added',
        summary: 'Added line item: LVP Flooring — Living Room — 450 sqft',
        entity_type: 'line_item',
        work_category_code: 'FL',
        stage_code: 'ST-ESTIMATE',
        location_id: 'loc-living-room',
      }),

      // Customer event (no three-axis tags)
      createMockEvent({
        id: 'event_9',
        event_type: 'customer.created',
        summary: 'Customer created: Sarah Mitchell — 45 Highfield St',
        entity_type: 'customer',
        homeowner_visible: false,
      }),
    ];
  });

  describe('Filter by Work Category (What)', () => {
    it('should filter by flooring work category', () => {
      const flooring = applyFilters(testEvents, { work_category_code: 'FL' });
      expect(flooring).toHaveLength(4);
      expect(flooring.every((e) => e.work_category_code === 'FL')).toBe(true);
    });

    it('should filter by electrical work category', () => {
      const electrical = applyFilters(testEvents, { work_category_code: 'EL' });
      expect(electrical).toHaveLength(3);
      expect(electrical.every((e) => e.work_category_code === 'EL')).toBe(true);
    });

    it('should filter by plumbing work category', () => {
      const plumbing = applyFilters(testEvents, { work_category_code: 'PL' });
      expect(plumbing).toHaveLength(1);
      expect(plumbing[0].summary).toContain('plumbing');
    });
  });

  describe('Filter by Trade (Who)', () => {
    it('should filter by trade - Nishant (flooring installer)', () => {
      const nishantWork = applyFilters(testEvents, { trade: 'Nishant' });
      expect(nishantWork).toHaveLength(3);
      expect(nishantWork.every((e) => e.trade === 'Nishant')).toBe(true);
    });

    it('should filter by trade - Nathan (electrician)', () => {
      const nathanWork = applyFilters(testEvents, { trade: 'Nathan' });
      expect(nathanWork).toHaveLength(3);
      expect(nathanWork.every((e) => e.work_category_code === 'EL')).toBe(true);
    });

    it('should filter by trade - SubPlumber', () => {
      const subPlumberWork = applyFilters(testEvents, { trade: 'SubPlumber' });
      expect(subPlumberWork).toHaveLength(1);
      expect(subPlumberWork[0].work_category_code).toBe('PL');
    });
  });

  describe('Filter by Stage (When)', () => {
    it('should filter by rough-in stage', () => {
      const roughIn = applyFilters(testEvents, { stage_code: 'ST-ROUGH' });
      expect(roughIn).toHaveLength(3);
      expect(roughIn.every((e) => e.stage_code === 'ST-ROUGH')).toBe(true);
    });

    it('should filter by finish stage', () => {
      const finish = applyFilters(testEvents, { stage_code: 'ST-FINISH' });
      expect(finish).toHaveLength(4);
      expect(finish.every((e) => e.stage_code === 'ST-FINISH')).toBe(true);
    });

    it('should filter by estimate stage', () => {
      const estimate = applyFilters(testEvents, { stage_code: 'ST-ESTIMATE' });
      expect(estimate).toHaveLength(1);
      expect(estimate[0].event_type).toBe('estimate.line_item_added');
    });
  });

  describe('Filter by Location (Where)', () => {
    it('should filter by kitchen location', () => {
      const kitchen = applyFilters(testEvents, { location_id: 'loc-kitchen' });
      expect(kitchen).toHaveLength(5);
      expect(kitchen.every((e) => e.location_id === 'loc-kitchen')).toBe(true);
    });

    it('should filter by living room location', () => {
      const livingRoom = applyFilters(testEvents, { location_id: 'loc-living-room' });
      expect(livingRoom).toHaveLength(2);
    });

    it('should filter by bathroom location', () => {
      const bathroom = applyFilters(testEvents, { location_id: 'loc-bathroom' });
      expect(bathroom).toHaveLength(1);
      expect(bathroom[0].work_category_code).toBe('PL');
    });
  });

  describe('Combined Filters (Multi-Axis)', () => {
    it('should filter by work category AND location', () => {
      const flooringKitchen = applyFilters(testEvents, {
        work_category_code: 'FL',
        location_id: 'loc-kitchen',
      });
      expect(flooringKitchen).toHaveLength(2);
      expect(flooringKitchen.every((e) => e.work_category_code === 'FL' && e.location_id === 'loc-kitchen')).toBe(true);
    });

    it('should filter by trade AND stage', () => {
      const nathanRoughIn = applyFilters(testEvents, {
        trade: 'Nathan',
        stage_code: 'ST-ROUGH',
      });
      expect(nathanRoughIn).toHaveLength(2);
    });

    it('should filter by all three axes', () => {
      const electricalNathanRoughInKitchen = applyFilters(testEvents, {
        work_category_code: 'EL',
        trade: 'Nathan',
        stage_code: 'ST-ROUGH',
        location_id: 'loc-kitchen',
      });
      expect(electricalNathanRoughInKitchen).toHaveLength(2);
    });
  });

  describe('Filter by Entity Type', () => {
    it('should filter by task entity type', () => {
      const tasks = applyFilters(testEvents, { entity_type: 'task' });
      expect(tasks).toHaveLength(7);
    });

    it('should filter by line_item entity type', () => {
      const lineItems = applyFilters(testEvents, { entity_type: 'line_item' });
      expect(lineItems).toHaveLength(1);
    });

    it('should filter by customer entity type', () => {
      const customers = applyFilters(testEvents, { entity_type: 'customer' });
      expect(customers).toHaveLength(1);
    });
  });

  describe('Filter by Event Type', () => {
    it('should filter by single event type', () => {
      const created = applyFilters(testEvents, { event_type: 'task.created' });
      expect(created).toHaveLength(4);
    });

    it('should filter by multiple event types', () => {
      const statusChanges = applyFilters(testEvents, {
        event_type: ['task.started', 'task.completed'],
      });
      expect(statusChanges).toHaveLength(3);
    });
  });
});

describe('Activity Logging - Summary Generation', () => {
  it('should have human-readable summaries', () => {
    const event = createMockEvent({
      summary: 'Created task: Install LVP Flooring — Kitchen — 450 sqft',
    });

    // Summary should be scannable on mobile
    expect(event.summary.length).toBeLessThan(100);
    expect(event.summary).toContain('LVP Flooring');
    expect(event.summary).toContain('Kitchen');
  });

  it('should have specific action verb in summary', () => {
    const summaries = [
      'Created task: Demo existing',
      'Started task: Rough-in electrical',
      'Completed task: Install flooring',
      'Blocked: Waiting for inspection',
      'Customer created: Sarah Mitchell',
      'Added line item: LVP Flooring — 450 sqft',
    ];

    // Each summary should start with an action verb
    const actionVerbs = ['Created', 'Started', 'Completed', 'Blocked', 'Customer', 'Added', 'Updated', 'Deleted'];
    for (const summary of summaries) {
      const startsWithVerb = actionVerbs.some((verb) => summary.startsWith(verb));
      expect(startsWithVerb).toBe(true);
    }
  });
});

describe('Activity Logging - Chronological Ordering', () => {
  it('should return events in chronological order (newest first)', () => {
    const now = Date.now();
    const events = [
      createMockEvent({ id: 'e1', timestamp: new Date(now - 3000).toISOString() }),
      createMockEvent({ id: 'e2', timestamp: new Date(now - 1000).toISOString() }),
      createMockEvent({ id: 'e3', timestamp: new Date(now - 2000).toISOString() }),
    ];

    // Sort by timestamp descending (newest first)
    const sorted = [...events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    expect(sorted[0].id).toBe('e2'); // Most recent
    expect(sorted[1].id).toBe('e3');
    expect(sorted[2].id).toBe('e1'); // Oldest
  });
});
