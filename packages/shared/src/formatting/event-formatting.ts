/**
 * Event Formatting Utilities
 *
 * Utilities for formatting activity events for display in the UI.
 * Includes message formatting, relative time, and day grouping.
 *
 * These utilities support the Activity Log - THE SPINE of Hooomz.
 */

import type { ActivityEvent } from '../types/activity';

// ============================================================================
// Event Message Formatting
// ============================================================================

/**
 * Event data types for type-safe access to event_data fields
 */
interface TaskEventData {
  task_name?: string;
  reason?: string;
  new_assignee?: string;
  old_status?: string;
  new_status?: string;
}

interface PhotoEventData {
  location?: string;
  filename?: string;
}

interface DocumentEventData {
  filename?: string;
  document_name?: string;
}

interface PaymentEventData {
  amount?: number;
}

interface EstimateEventData {
  approved_by?: string;
  sent_to?: string;
  estimate_name?: string;
}

interface InspectionEventData {
  inspection_type?: string;
  reason?: string;
}

interface MaterialEventData {
  vendor?: string;
  item?: string;
  items?: string[];
}

interface SiteEventData {
  attendees?: string[];
  subject?: string;
  issue_type?: string;
  description?: string;
  original_date?: string;
  new_date?: string;
  sub_name?: string;
  trade?: string;
  notes?: string;
  purpose?: string;
  delay_reason?: string;
  expected_duration?: string;
  severity?: string;
  request_type?: string;
  request_details?: string;
}

type EventData = TaskEventData &
  PhotoEventData &
  DocumentEventData &
  PaymentEventData &
  EstimateEventData &
  InspectionEventData &
  MaterialEventData &
  SiteEventData &
  Record<string, unknown>;

/**
 * Format an activity event into a human-readable message for display.
 *
 * @param event - The activity event to format
 * @returns A human-readable message describing the event
 */
export function formatEventMessage(event: ActivityEvent): string {
  // Prefer the service-generated summary when available — it's specific and scannable
  if (event.summary) {
    return event.summary;
  }

  const { event_type, event_data, actor_name } = event;
  const data = event_data as EventData;

  const formatters: Record<string, () => string> = {
    // Project events
    'project.created': () => `${actor_name} created this project`,
    'project.status_changed': () =>
      `${actor_name} changed project status${data.new_status ? ` to ${data.new_status}` : ''}`,
    'project.completed': () => `${actor_name} completed the project`,
    'project.health_changed': () => `Project health updated`,

    // Loop events
    'loop.created': () => `${actor_name} created a new section`,
    'loop.renamed': () => `${actor_name} renamed a section`,

    // Task events
    'task.created': () =>
      `${actor_name} created task "${data.task_name || 'Untitled'}"`,
    'task.completed': () =>
      `${actor_name} completed "${data.task_name || 'a task'}"`,
    'task.blocked': () =>
      `"${data.task_name || 'A task'}" blocked${data.reason ? `: ${data.reason}` : ''}`,
    'task.blocked_shared': () =>
      `"${data.task_name || 'A task'}" blocked${data.reason ? `: ${data.reason}` : ''}`,
    'task.assigned': () =>
      `${actor_name} assigned "${data.task_name || 'a task'}" to ${data.new_assignee || 'someone'}`,
    'task.started': () =>
      `${actor_name} started "${data.task_name || 'a task'}"`,
    'milestone.reached': () =>
      `Milestone reached: ${data.task_name || 'Project milestone'}`,

    // Time events
    'time.clock_in': () => `${actor_name} clocked in`,
    'time.clock_out': () => `${actor_name} clocked out`,
    'time.entry_logged': () => `${actor_name} logged time`,

    // Photo events
    'photo.uploaded': () =>
      `${actor_name} added a photo${data.location ? ` in ${data.location}` : ''}`,
    'photo.shared': () => `${actor_name} shared a photo with homeowner`,

    // Document events
    'document.uploaded': () =>
      `${actor_name} uploaded "${data.filename || data.document_name || 'a document'}"`,
    'document.shared': () => `${actor_name} shared a document with homeowner`,
    'document.version_created': () =>
      `${actor_name} created a new version of "${data.filename || data.document_name || 'a document'}"`,

    // Field note events
    'field_note.created': () => `${actor_name} added a note`,
    'field_note.flagged_for_co': () =>
      `${actor_name} flagged a note for change order`,

    // Inspection events
    'inspection.scheduled': () =>
      `${data.inspection_type || 'Inspection'} inspection scheduled`,
    'inspection.passed': () =>
      `${data.inspection_type || 'Inspection'} inspection passed`,
    'inspection.failed': () =>
      `${data.inspection_type || 'Inspection'} inspection failed${data.reason ? `: ${data.reason}` : ''}`,

    // Estimate events
    'estimate.created': () => `${actor_name} created an estimate`,
    'estimate.sent': () =>
      `Estimate sent${data.sent_to ? ` to ${data.sent_to}` : ''}`,
    'estimate.viewed': () => `Estimate was viewed`,
    'estimate.approved': () =>
      `Estimate approved${data.approved_by ? ` by ${data.approved_by}` : ''}`,
    'estimate.rejected': () =>
      `Estimate rejected${data.approved_by ? ` by ${data.approved_by}` : ''}`,
    'estimate.revised': () => `${actor_name} revised the estimate`,
    'tier.selected': () => `${actor_name} selected a tier`,

    // Change order events
    'change_order.created': () => `${actor_name} created a change order`,
    'change_order.sent': () => `Change order sent for approval`,
    'change_order.approved': () => `Change order approved`,
    'change_order.rejected': () => `Change order rejected`,

    // Payment events
    'invoice.created': () => `${actor_name} created an invoice`,
    'invoice.sent': () => `Invoice sent`,
    'payment.received': () =>
      `Payment received${data.amount ? `: $${data.amount.toLocaleString()}` : ''}`,

    // Portal events
    'portal.invite_sent': () => `${actor_name} sent a portal invite`,
    'portal.accessed': () => `Homeowner accessed the portal`,

    // Selection events
    'selection.made': () => `${actor_name} made a selection`,
    'selection.approved': () => `Selection approved`,

    // Site events
    'site.meeting': () =>
      `${actor_name} logged a site meeting${data.subject ? `: ${data.subject}` : ''}`,
    'site.issue': () =>
      `${actor_name} reported an issue${data.issue_type ? ` (${data.issue_type})` : ''}${data.description ? `: ${data.description}` : ''}`,
    'site.sub_arrived': () =>
      `${data.sub_name || 'Subcontractor'} arrived${data.trade ? ` (${data.trade})` : ''}`,
    'site.sub_departed': () =>
      `${data.sub_name || 'Subcontractor'} departed${data.notes ? `: ${data.notes}` : ''}`,
    'site.visit_logged': () =>
      `${actor_name} logged a site visit${data.purpose ? `: ${data.purpose}` : ''}`,
    'site.weather_delay': () =>
      `Weather delay${data.delay_reason ? `: ${data.delay_reason}` : ''}${data.expected_duration ? ` (${data.expected_duration})` : ''}`,
    'site.safety_incident': () =>
      `Safety incident reported${data.severity ? ` (${data.severity})` : ''}${data.description ? `: ${data.description}` : ''}`,
    'material.delivered': () =>
      `Materials delivered${data.vendor ? ` from ${data.vendor}` : ''}${data.item ? `: ${data.item}` : ''}`,
    'material.shortage': () =>
      `Material shortage reported${data.item ? `: ${data.item}` : ''}`,
    'work.rescheduled': () =>
      `${actor_name} rescheduled work${data.new_date ? ` to ${data.new_date}` : ''}`,

    // Task additional
    'task.unblocked': () =>
      `"${data.task_name || 'A task'}" is now unblocked`,

    // Client events
    'client.request': () =>
      `Client request${data.request_type ? ` (${data.request_type})` : ''}${data.request_details ? `: ${data.request_details}` : ''}`,

    // Receipt events
    'receipt.uploaded': () =>
      `${actor_name} uploaded a receipt${data.vendor ? ` from ${data.vendor}` : ''}${(data.amount as number) ? `: $${(data.amount as number).toLocaleString()}` : ''}`,
  };

  const formatter = formatters[event_type];
  if (formatter) {
    return formatter();
  }

  // Default fallback for unknown event types
  return `${actor_name} performed ${event_type.replace(/\./g, ' ').replace(/_/g, ' ')}`;
}

// ============================================================================
// Homeowner Message Formatting
// ============================================================================

/**
 * Format an activity event for homeowner display.
 * Uses simplified language without internal jargon.
 * Only call this for events where homeowner_visible is true.
 *
 * @param event - The activity event to format
 * @returns A homeowner-friendly message
 */
export function formatHomeownerMessage(event: ActivityEvent): string {
  const { event_type, event_data } = event;
  const data = event_data as EventData;

  const homeownerFormatters: Record<string, () => string> = {
    // Project updates
    'project.created': () => `Your project has been created`,
    'project.status_changed': () => `Project status updated`,
    'project.completed': () => `Your project is complete!`,

    // Task updates (simplified)
    'task.completed': () =>
      `Work completed: ${data.task_name || 'A task'}`,
    'task.blocked_shared': () =>
      `Work paused: ${data.reason || 'Waiting on materials or conditions'}`,
    'milestone.reached': () =>
      `Milestone reached: ${data.task_name || 'Project milestone'}`,

    // Photos
    'photo.shared': () => `New photo added to your project`,

    // Documents
    'document.shared': () => `A document has been shared with you`,

    // Inspections
    'inspection.scheduled': () =>
      `${data.inspection_type || 'An inspection'} has been scheduled`,
    'inspection.passed': () =>
      `${data.inspection_type || 'Inspection'} passed`,
    'inspection.failed': () =>
      `${data.inspection_type || 'Inspection'} needs attention`,

    // Estimates
    'estimate.sent': () => `An estimate is ready for your review`,
    'estimate.approved': () => `Estimate approved`,
    'estimate.rejected': () => `Estimate declined`,
    'tier.selected': () => `Option selected`,

    // Change orders
    'change_order.created': () => `A change has been proposed`,
    'change_order.sent': () => `A change request is ready for your review`,
    'change_order.approved': () => `Change approved`,
    'change_order.rejected': () => `Change declined`,

    // Payments
    'invoice.sent': () => `An invoice is ready`,
    'payment.received': () =>
      `Payment received${data.amount ? `: $${data.amount.toLocaleString()}` : ''} - Thank you!`,

    // Portal
    'portal.invite_sent': () => `You've been invited to view your project`,

    // Selections
    'selection.made': () => `A selection has been made`,
    'selection.approved': () => `Selection confirmed`,

    // Site events (homeowner-friendly)
    'site.meeting': () =>
      `A site meeting was held${data.subject ? `: ${data.subject}` : ''}`,
    'site.issue': () =>
      `An issue was identified and is being addressed`,
    'site.visit_logged': () =>
      `Your contractor visited the property${data.purpose ? `: ${data.purpose}` : ''}`,
    'site.weather_delay': () =>
      `Work delayed due to weather${data.expected_duration ? ` - expected ${data.expected_duration}` : ''}`,
    'site.safety_incident': () =>
      `A safety incident has been reported and is being addressed`,
    'material.delivered': () =>
      `Materials were delivered to your property`,
    'material.shortage': () =>
      `Waiting on materials - we'll update you when they arrive`,
    'work.rescheduled': () =>
      `Work has been rescheduled${data.new_date ? ` to ${data.new_date}` : ''}`,

    // Client events (homeowner-friendly)
    'client.request': () =>
      `Your request has been logged`,
  };

  const formatter = homeownerFormatters[event_type];
  if (formatter) {
    return formatter();
  }

  // Fallback to regular message for events without homeowner-specific formatting
  return formatEventMessage(event);
}

// ============================================================================
// Relative Time Formatting
// ============================================================================

/**
 * Format a timestamp into a relative time string.
 *
 * Rules:
 * - Today: "2:34 PM"
 * - Yesterday: "Yesterday"
 * - This week (within 7 days): Weekday name (e.g., "Monday")
 * - This year: "Jan 15"
 * - Previous years: "Jan 15, 2024"
 *
 * @param timestamp - The date to format (Date object or ISO string)
 * @returns A human-readable relative time string
 */
export function formatRelativeTime(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();

  // Reset times for day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const daysDiff = Math.floor(
    (today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Today - show time
  if (daysDiff === 0) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Yesterday
  if (daysDiff === 1) {
    return 'Yesterday';
  }

  // This week (2-6 days ago)
  if (daysDiff >= 2 && daysDiff <= 6) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // This year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Previous years
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// Day Grouping
// ============================================================================

/**
 * Get a label for grouping events by day.
 *
 * Rules:
 * - Today: "Today"
 * - Yesterday: "Yesterday"
 * - This week: Weekday name (e.g., "Monday")
 * - Older: "Jan 15" or "Jan 15, 2024" for previous years
 *
 * @param timestamp - The date to get a group label for
 * @returns A group label string
 */
export function getDateGroupLabel(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();

  // Reset times for day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const daysDiff = Math.floor(
    (today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Today
  if (daysDiff === 0) {
    return 'Today';
  }

  // Yesterday
  if (daysDiff === 1) {
    return 'Yesterday';
  }

  // This week (2-6 days ago)
  if (daysDiff >= 2 && daysDiff <= 6) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // This year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Previous years
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Group activity events by day.
 *
 * Returns a Map with date labels as keys and arrays of events as values.
 * Events are assumed to already be sorted by timestamp descending.
 *
 * @param events - Array of activity events (should be sorted by timestamp desc)
 * @returns A Map of date labels to event arrays
 */
export function groupEventsByDay(
  events: ActivityEvent[]
): Map<string, ActivityEvent[]> {
  const groups = new Map<string, ActivityEvent[]>();

  for (const event of events) {
    const label = getDateGroupLabel(event.timestamp);

    const existing = groups.get(label);
    if (existing) {
      existing.push(event);
    } else {
      groups.set(label, [event]);
    }
  }

  return groups;
}

/**
 * Group events by day and return as an array of [label, events] tuples.
 * Preserves the order of first occurrence of each day group.
 *
 * @param events - Array of activity events (should be sorted by timestamp desc)
 * @returns Array of [label, events] tuples
 */
export function groupEventsByDayArray(
  events: ActivityEvent[]
): Array<[string, ActivityEvent[]]> {
  return Array.from(groupEventsByDay(events).entries());
}
