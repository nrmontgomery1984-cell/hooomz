/**
 * Event Formatting Utilities - Unit Tests
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ActivityEvent } from '../types/activity';
import {
  EVENT_ICONS,
  getEventIcon,
  DEFAULT_EVENT_ICON,
  ActivityEventType,
} from '../types/activity';
import {
  formatEventMessage,
  formatHomeownerMessage,
  formatRelativeTime,
  getDateGroupLabel,
  groupEventsByDay,
  groupEventsByDayArray,
} from './event-formatting';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockEvent(
  overrides: Partial<ActivityEvent> = {}
): ActivityEvent {
  return {
    id: 'test-event-id',
    organization_id: 'test-org-id',
    project_id: 'test-project-id',
    property_id: 'test-property-id',
    event_type: 'task.completed',
    timestamp: new Date().toISOString(),
    summary: 'Test event summary', // Required field
    actor_id: 'test-actor-id',
    actor_type: 'team_member',
    actor_name: 'John Smith',
    entity_type: 'task_instance',
    entity_id: 'test-entity-id',
    work_category_code: null,
    trade: null, // Required field (nullable)
    stage_code: null,
    location_id: null,
    loop_iteration_id: null,
    homeowner_visible: false,
    event_data: { _version: 1 },
    input_method: null,
    batch_id: null,
    ...overrides,
  };
}

// ============================================================================
// Event Icons Tests
// ============================================================================

describe('Event Icons', () => {
  it('should have icons for all defined event types', () => {
    // Get all event types from the type definition
    const eventTypes: ActivityEventType[] = [
      'project.created',
      'project.status_changed',
      'project.completed',
      'project.health_changed',
      'loop.created',
      'loop.renamed',
      'estimate.created',
      'estimate.sent',
      'estimate.viewed',
      'estimate.approved',
      'estimate.rejected',
      'estimate.revised',
      'tier.selected',
      'task.created',
      'task.assigned',
      'task.started',
      'task.completed',
      'task.blocked',
      'task.blocked_shared',
      'milestone.reached',
      'time.clock_in',
      'time.clock_out',
      'time.entry_logged',
      'photo.uploaded',
      'photo.shared',
      'inspection.scheduled',
      'inspection.passed',
      'inspection.failed',
      'document.uploaded',
      'document.shared',
      'document.version_created',
      'field_note.created',
      'field_note.flagged_for_co',
      'portal.invite_sent',
      'portal.accessed',
      'selection.made',
      'selection.approved',
      'change_order.created',
      'change_order.sent',
      'change_order.approved',
      'change_order.rejected',
      'invoice.created',
      'invoice.sent',
      'payment.received',
    ];

    for (const eventType of eventTypes) {
      expect(EVENT_ICONS[eventType]).toBeDefined();
      expect(typeof EVENT_ICONS[eventType]).toBe('string');
      expect(EVENT_ICONS[eventType].length).toBeGreaterThan(0);
    }
  });

  it('getEventIcon should return correct icon for known types', () => {
    expect(getEventIcon('task.completed')).toBe('☑️');
    expect(getEventIcon('photo.uploaded')).toBe('📷');
    expect(getEventIcon('payment.received')).toBe('💰');
    expect(getEventIcon('project.created')).toBe('🏗️');
  });

  it('getEventIcon should return default icon for unknown types', () => {
    expect(getEventIcon('unknown.event')).toBe(DEFAULT_EVENT_ICON);
    expect(getEventIcon('')).toBe(DEFAULT_EVENT_ICON);
    expect(getEventIcon('some.random.type')).toBe(DEFAULT_EVENT_ICON);
  });
});

// ============================================================================
// Event Message Formatting Tests
// ============================================================================

describe('formatEventMessage', () => {
  it('should format task.completed events', () => {
    const event = createMockEvent({
      event_type: 'task.completed',
      actor_name: 'Mike Johnson',
      event_data: { _version: 1, task_name: 'Install outlets' },
    });

    expect(formatEventMessage(event)).toBe(
      'Mike Johnson completed "Install outlets"'
    );
  });

  it('should format task.completed without task_name', () => {
    const event = createMockEvent({
      event_type: 'task.completed',
      actor_name: 'Mike Johnson',
      event_data: { _version: 1 },
    });

    expect(formatEventMessage(event)).toBe('Mike Johnson completed "a task"');
  });

  it('should format task.blocked events with reason', () => {
    const event = createMockEvent({
      event_type: 'task.blocked',
      event_data: {
        _version: 1,
        task_name: 'Drywall install',
        reason: 'Waiting for inspection',
      },
    });

    expect(formatEventMessage(event)).toBe(
      '"Drywall install" blocked: Waiting for inspection'
    );
  });

  it('should format task.assigned events', () => {
    const event = createMockEvent({
      event_type: 'task.assigned',
      actor_name: 'Sarah',
      event_data: {
        _version: 1,
        task_name: 'Paint trim',
        new_assignee: 'Tom',
      },
    });

    expect(formatEventMessage(event)).toBe(
      'Sarah assigned "Paint trim" to Tom'
    );
  });

  it('should format photo.uploaded events with location', () => {
    const event = createMockEvent({
      event_type: 'photo.uploaded',
      actor_name: 'Alex',
      event_data: { _version: 1, location: 'Kitchen' },
    });

    expect(formatEventMessage(event)).toBe('Alex added a photo in Kitchen');
  });

  it('should format photo.uploaded events without location', () => {
    const event = createMockEvent({
      event_type: 'photo.uploaded',
      actor_name: 'Alex',
      event_data: { _version: 1 },
    });

    expect(formatEventMessage(event)).toBe('Alex added a photo');
  });

  it('should format payment.received events with amount', () => {
    const event = createMockEvent({
      event_type: 'payment.received',
      event_data: { _version: 1, amount: 5000 },
    });

    expect(formatEventMessage(event)).toBe('Payment received: $5,000');
  });

  it('should format estimate.approved events', () => {
    const event = createMockEvent({
      event_type: 'estimate.approved',
      event_data: { _version: 1, approved_by: 'Jane Doe' },
    });

    expect(formatEventMessage(event)).toBe('Estimate approved by Jane Doe');
  });

  it('should format inspection.passed events', () => {
    const event = createMockEvent({
      event_type: 'inspection.passed',
      event_data: { _version: 1, inspection_type: 'Electrical' },
    });

    expect(formatEventMessage(event)).toBe('Electrical inspection passed');
  });

  it('should format inspection.failed events with reason', () => {
    const event = createMockEvent({
      event_type: 'inspection.failed',
      event_data: {
        _version: 1,
        inspection_type: 'Plumbing',
        reason: 'Missing permits',
      },
    });

    expect(formatEventMessage(event)).toBe(
      'Plumbing inspection failed: Missing permits'
    );
  });

  it('should format document.uploaded events', () => {
    const event = createMockEvent({
      event_type: 'document.uploaded',
      actor_name: 'Bob',
      event_data: { _version: 1, filename: 'Contract.pdf' },
    });

    expect(formatEventMessage(event)).toBe('Bob uploaded "Contract.pdf"');
  });

  it('should handle unknown event types gracefully', () => {
    const event = createMockEvent({
      event_type: 'unknown.event_type' as any,
      actor_name: 'Test User',
    });

    expect(formatEventMessage(event)).toBe(
      'Test User performed unknown event type'
    );
  });
});

// ============================================================================
// Homeowner Message Formatting Tests
// ============================================================================

describe('formatHomeownerMessage', () => {
  it('should format task.completed in homeowner-friendly way', () => {
    const event = createMockEvent({
      event_type: 'task.completed',
      event_data: { _version: 1, task_name: 'Install ceiling fan' },
    });

    expect(formatHomeownerMessage(event)).toBe(
      'Work completed: Install ceiling fan'
    );
  });

  it('should format project.completed with celebration', () => {
    const event = createMockEvent({
      event_type: 'project.completed',
    });

    expect(formatHomeownerMessage(event)).toBe('Your project is complete!');
  });

  it('should format estimate.sent for homeowner', () => {
    const event = createMockEvent({
      event_type: 'estimate.sent',
    });

    expect(formatHomeownerMessage(event)).toBe(
      'An estimate is ready for your review'
    );
  });

  it('should format payment.received with thank you', () => {
    const event = createMockEvent({
      event_type: 'payment.received',
      event_data: { _version: 1, amount: 2500 },
    });

    expect(formatHomeownerMessage(event)).toBe(
      'Payment received: $2,500 - Thank you!'
    );
  });

  it('should format inspection.failed without scary language', () => {
    const event = createMockEvent({
      event_type: 'inspection.failed',
      event_data: { _version: 1, inspection_type: 'Framing' },
    });

    expect(formatHomeownerMessage(event)).toBe('Framing needs attention');
  });

  it('should fall back to regular message for unhandled types', () => {
    const event = createMockEvent({
      event_type: 'time.clock_in',
      actor_name: 'Worker',
    });

    // time.clock_in doesn't have a homeowner formatter, so it falls back
    expect(formatHomeownerMessage(event)).toBe('Worker clocked in');
  });
});

// ============================================================================
// Relative Time Formatting Tests
// ============================================================================

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now() to a fixed time: January 15, 2025, 2:30 PM
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format today as time', () => {
    const today = new Date('2025-01-15T09:45:00');
    const result = formatRelativeTime(today);
    expect(result).toMatch(/9:45\s*AM/i);
  });

  it('should format yesterday', () => {
    const yesterday = new Date('2025-01-14T15:00:00');
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });

  it('should format this week as weekday name', () => {
    // January 12, 2025 is a Sunday (3 days ago from Jan 15)
    const thisWeek = new Date('2025-01-12T10:00:00');
    expect(formatRelativeTime(thisWeek)).toBe('Sunday');
  });

  it('should format this year as month and day', () => {
    const thisYear = new Date('2025-01-05T10:00:00');
    expect(formatRelativeTime(thisYear)).toBe('Jan 5');
  });

  it('should format previous year with full date', () => {
    const lastYear = new Date('2024-12-25T10:00:00');
    expect(formatRelativeTime(lastYear)).toBe('Dec 25, 2024');
  });

  it('should handle ISO string input', () => {
    const isoString = '2025-01-15T10:30:00.000Z';
    const result = formatRelativeTime(isoString);
    // Should be formatted as time (today)
    expect(result).toMatch(/AM|PM/i);
  });

  it('should handle midnight boundary correctly', () => {
    // Test at 11:59 PM on Jan 14
    vi.setSystemTime(new Date('2025-01-14T23:59:00'));
    const midnight = new Date('2025-01-15T00:01:00');
    // Jan 15 is "tomorrow" from the perspective of Jan 14
    // For future dates, show as date since daysDiff would be negative
    // The implementation shows future dates as month/day format
    expect(formatRelativeTime(midnight)).toBe('Jan 15');
  });
});

// ============================================================================
// Date Group Label Tests
// ============================================================================

describe('getDateGroupLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Today" for today', () => {
    const today = new Date('2025-01-15T09:00:00');
    expect(getDateGroupLabel(today)).toBe('Today');
  });

  it('should return "Yesterday" for yesterday', () => {
    const yesterday = new Date('2025-01-14T09:00:00');
    expect(getDateGroupLabel(yesterday)).toBe('Yesterday');
  });

  it('should return weekday for this week', () => {
    const monday = new Date('2025-01-13T09:00:00'); // Monday, 2 days ago
    expect(getDateGroupLabel(monday)).toBe('Monday');
  });

  it('should return "Jan 5" for older dates this year', () => {
    const older = new Date('2025-01-05T09:00:00');
    expect(getDateGroupLabel(older)).toBe('Jan 5');
  });

  it('should return "Dec 25, 2024" for previous years', () => {
    const lastYear = new Date('2024-12-25T09:00:00');
    expect(getDateGroupLabel(lastYear)).toBe('Dec 25, 2024');
  });
});

// ============================================================================
// Day Grouping Tests
// ============================================================================

describe('groupEventsByDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should group events by day', () => {
    const events = [
      createMockEvent({ timestamp: '2025-01-15T10:00:00' }),
      createMockEvent({ timestamp: '2025-01-15T09:00:00' }),
      createMockEvent({ timestamp: '2025-01-14T15:00:00' }),
      createMockEvent({ timestamp: '2025-01-13T12:00:00' }),
    ];

    const groups = groupEventsByDay(events);

    expect(groups.size).toBe(3);
    expect(groups.get('Today')?.length).toBe(2);
    expect(groups.get('Yesterday')?.length).toBe(1);
    expect(groups.get('Monday')?.length).toBe(1);
  });

  it('should return empty map for empty events', () => {
    const groups = groupEventsByDay([]);
    expect(groups.size).toBe(0);
  });

  it('should preserve order within groups', () => {
    const events = [
      createMockEvent({ id: 'first', timestamp: '2025-01-15T10:00:00' }),
      createMockEvent({ id: 'second', timestamp: '2025-01-15T09:00:00' }),
    ];

    const groups = groupEventsByDay(events);
    const todayEvents = groups.get('Today');

    expect(todayEvents?.[0].id).toBe('first');
    expect(todayEvents?.[1].id).toBe('second');
  });
});

describe('groupEventsByDayArray', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return array of tuples', () => {
    const events = [
      createMockEvent({ timestamp: '2025-01-15T10:00:00' }),
      createMockEvent({ timestamp: '2025-01-14T15:00:00' }),
    ];

    const result = groupEventsByDayArray(events);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0][0]).toBe('Today');
    expect(result[0][1].length).toBe(1);
    expect(result[1][0]).toBe('Yesterday');
    expect(result[1][1].length).toBe(1);
  });

  it('should preserve order of first occurrence', () => {
    const events = [
      createMockEvent({ timestamp: '2025-01-15T10:00:00' }),
      createMockEvent({ timestamp: '2025-01-14T15:00:00' }),
      createMockEvent({ timestamp: '2025-01-15T09:00:00' }),
    ];

    const result = groupEventsByDayArray(events);

    // Today should come first because it appeared first
    expect(result[0][0]).toBe('Today');
    expect(result[0][1].length).toBe(2);
  });
});
