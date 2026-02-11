/**
 * Activity Log Types
 *
 * The Activity Log is THE SPINE of Hooomz:
 * - IMMUTABLE: Events are NEVER edited or deleted
 * - APPEND-ONLY: Only INSERT operations allowed
 * - SOURCE OF TRUTH: All dashboards and reports derive from events
 */

// ============================================================================
// Core Types
// ============================================================================

export type ActorType = 'team_member' | 'system' | 'customer';

/**
 * How the event was created by the user.
 * For system-generated events, input_method should be null/undefined.
 */
export type InputMethod =
  | 'manual_entry'    // User typed/selected in app
  | 'voice'           // Voice input
  | 'quick_action'    // One-tap quick action
  | 'photo_trigger'   // Triggered by photo upload
  | 'geofence'        // GPS-based automatic trigger
  | 'integration'     // External system (QuickBooks, etc.)
  | 'bulk_import';    // CSV/bulk data import
// Note: 'system' removed - use null for system-generated events

/**
 * Activity Event - The immutable spine of Hooomz
 *
 * Every action in the system writes an event here.
 * Events are NEVER edited or deleted (append-only).
 * All dashboards and reports derive from this event stream.
 */
export interface ActivityEvent {
  id: string;
  organization_id: string;
  project_id: string | null;      // Nullable for org-level events
  property_id: string | null;     // Nullable for non-property events
  event_type: ActivityEventType;
  timestamp: string;              // ISO 8601

  // Human-readable summary (REQUIRED)
  // Must be specific, scannable on mobile: "Updated task status: Framing → Complete"
  summary: string;

  // Actor
  actor_id: string;
  actor_type: ActorType;
  actor_name: string;             // Denormalized for display

  // Entity Reference
  entity_type: string;            // e.g., "task_instance", "change_order"
  entity_id: string;

  // Three-Axis Metadata (for filtering)
  work_category_code: string | null;  // What: Flooring, Electrical, Plumbing, etc.
  trade: string | null;               // Who: which trade or person doing the work
  stage_code: string | null;          // When: Estimate, Scope, Active, Inspection, Complete
  location_id: string | null;         // Where: room or area reference

  // Loop Context
  loop_iteration_id: string | null;

  // Visibility
  homeowner_visible: boolean;     // Show in customer portal?

  // Event-Specific Payload (always includes _version)
  event_data: Record<string, unknown> & { _version: number };

  // Input Tracking
  input_method: InputMethod | null;

  // Batch Support
  batch_id: string | null;

  // Denormalized for display (from joins/views)
  project_name?: string;
}

// ============================================================================
// System User Constant
// ============================================================================

/**
 * System user for automated/system-generated events
 * This is a well-known UUID that should exist in all environments
 */
export const SYSTEM_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'System',
  type: 'system' as const,
};

// ============================================================================
// Query and Pagination Types
// ============================================================================

/**
 * Options for querying activity events
 */
export interface ActivityQueryOptions {
  /** Maximum number of events to return (default: 20, max: 100) */
  limit?: number;
  /** Event ID to use as cursor for pagination */
  cursor?: string;
  /** Filter by event type prefix (e.g., 'task.*' matches all task events) */
  eventType?: string;
  /** Filter events after this date */
  from?: Date;
  /** Filter events before this date */
  to?: Date;
}

/**
 * Paginated result for activity queries
 */
export interface PaginatedActivityResult {
  events: ActivityEvent[];
  /** ID of the last event, use as cursor for next page */
  nextCursor: string | null;
  /** Whether there are more results available */
  hasMore: boolean;
}

// ============================================================================
// Input Types for Creating Events
// ============================================================================

/**
 * Input for creating a new activity event
 * All required context plus event-specific data
 */
export interface CreateActivityEventInput {
  // Required context
  organization_id: string;
  event_type: ActivityEventType;
  entity_type: string;
  entity_id: string;

  // Human-readable summary (REQUIRED)
  // Must be specific: "Created estimate line item: LVP Flooring — Living Room — 450 sqft"
  summary: string;

  // Actor (required)
  actor_id: string;
  actor_type: ActorType;
  actor_name?: string;  // Auto-populated if not provided

  // Optional context
  project_id?: string | null;
  property_id?: string | null;
  loop_iteration_id?: string | null;

  // Three-Axis Metadata
  work_category_code?: string | null;
  trade?: string | null;           // Who: which trade or person doing the work
  stage_code?: string | null;
  location_id?: string | null;

  // Visibility (defaults to EVENT_VISIBILITY_DEFAULTS[event_type])
  homeowner_visible?: boolean;

  // Event payload (service adds _version: 1)
  event_data?: Record<string, unknown>;

  // Input tracking
  input_method?: InputMethod;

  // Batch grouping
  batch_id?: string;

  // Timestamp (defaults to now)
  timestamp?: Date | string;
}

// ============================================================================
// Event Types
// ============================================================================

// All event types with default visibility
export type ActivityEventType =
  // Core - visible
  | 'project.created'
  | 'project.status_changed'
  | 'project.completed'
  // Core - hidden
  | 'project.health_changed'
  // Loops - conditional (location loops visible, others hidden)
  | 'loop.created'
  | 'loop.renamed'
  | 'loop.status_changed'
  | 'loop.health_updated'
  | 'loop.deleted'
  // Intake - hidden (internal)
  | 'intake.started'
  | 'intake.step_completed'
  | 'intake.submitted'
  | 'intake.abandoned'
  // Estimating - visible
  | 'estimate.sent'
  | 'estimate.approved'
  | 'estimate.rejected'
  | 'tier.selected'
  // Estimating - hidden
  | 'estimate.created'
  | 'estimate.viewed'
  | 'estimate.revised'
  | 'estimate.line_item_added'
  | 'estimate.line_item_updated'
  | 'estimate.line_item_deleted'
  // Scheduling - visible
  | 'task.completed'
  | 'task.blocked_shared'
  | 'milestone.reached'
  // Scheduling - hidden
  | 'task.created'
  | 'task.template_created'
  | 'task.instance_created'
  | 'task.assigned'
  | 'task.started'
  | 'task.blocked'
  | 'task.unblocked'
  | 'task.status_changed'
  | 'task.deleted'
  // Dependencies - hidden
  | 'dependency.added'
  | 'dependency.removed'
  // Team - hidden
  | 'time.clock_in'
  | 'time.clock_out'
  | 'time.entry_logged'
  | 'time.entry_approved'
  // Field Docs - visible
  | 'photo.shared'
  | 'inspection.scheduled'
  | 'inspection.passed'
  | 'inspection.failed'
  | 'document.shared'
  // Field Docs - hidden
  | 'photo.uploaded'
  | 'document.uploaded'
  | 'document.version_created'
  | 'field_note.created'
  | 'field_note.flagged_for_co'
  // Site Events - visible (common daily logging for field workers)
  | 'site.meeting'
  | 'site.issue'
  | 'site.sub_arrived'
  | 'site.sub_departed'
  | 'site.visit_logged'
  | 'site.weather_delay'
  | 'site.safety_incident'
  | 'material.delivered'
  | 'material.shortage'
  // Client
  | 'client.request'
  // Receipts
  | 'receipt.uploaded'
  // Work
  | 'work.rescheduled'
  // Customers - visible
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'portal.invite_sent'
  | 'selection.made'
  | 'selection.approved'
  // Customers - hidden
  | 'portal.accessed'
  // Properties - hidden
  | 'property.created'
  | 'property.updated'
  | 'property.deleted'
  | 'property.transferred'
  // Catalog - hidden (org-level)
  | 'catalog.item_added'
  | 'catalog.item_updated'
  | 'catalog.item_deleted'
  | 'catalog.price_updated'
  // Change Orders - visible
  | 'change_order.created'
  | 'change_order.sent'
  | 'change_order.approved'
  | 'change_order.rejected'
  // Payments - visible
  | 'invoice.sent'
  | 'payment.received'
  // Payments - hidden
  | 'invoice.created';

// Default visibility map
export const EVENT_VISIBILITY_DEFAULTS: Record<ActivityEventType, boolean> = {
  // Project
  'project.created': true,
  'project.status_changed': true,
  'project.completed': true,
  'project.health_changed': false,
  // Loops
  'loop.created': false, // Set to true at runtime for location/floor/zone
  'loop.renamed': false,
  'loop.status_changed': false,
  'loop.health_updated': false,
  'loop.deleted': false,
  // Intake (internal)
  'intake.started': false,
  'intake.step_completed': false,
  'intake.submitted': false,
  'intake.abandoned': false,
  // Estimating
  'estimate.created': false,
  'estimate.sent': true,
  'estimate.viewed': false,
  'estimate.approved': true,
  'estimate.rejected': true,
  'estimate.revised': false,
  'estimate.line_item_added': false,
  'estimate.line_item_updated': false,
  'estimate.line_item_deleted': false,
  'tier.selected': true,
  // Tasks
  'task.created': false,
  'task.template_created': false,
  'task.instance_created': false,
  'task.assigned': false,
  'task.started': false,
  'task.completed': true,
  'task.blocked': false,
  'task.unblocked': false,
  'task.status_changed': false,
  'task.deleted': false,
  'task.blocked_shared': true,
  'milestone.reached': true,
  // Dependencies
  'dependency.added': false,
  'dependency.removed': false,
  // Time
  'time.clock_in': false,
  'time.clock_out': false,
  'time.entry_logged': false,
  'time.entry_approved': false,
  // Field Docs
  'photo.uploaded': false,
  'photo.shared': true,
  'inspection.scheduled': true,
  'inspection.passed': true,
  'inspection.failed': true,
  'document.uploaded': false,
  'document.shared': true,
  'document.version_created': false,
  'field_note.created': false,
  'field_note.flagged_for_co': false,
  // Customers
  'customer.created': false,
  'customer.updated': false,
  'customer.deleted': false,
  'portal.invite_sent': true,
  'portal.accessed': false,
  'selection.made': true,
  'selection.approved': true,
  // Properties
  'property.created': false,
  'property.updated': false,
  'property.deleted': false,
  'property.transferred': true,
  // Catalog
  'catalog.item_added': false,
  'catalog.item_updated': false,
  'catalog.item_deleted': false,
  'catalog.price_updated': false,
  // Change Orders
  'change_order.created': true,
  'change_order.sent': true,
  'change_order.approved': true,
  'change_order.rejected': true,
  // Payments
  'invoice.created': false,
  'invoice.sent': true,
  'payment.received': true,
  // Site Events
  'site.meeting': true,
  'site.issue': true,
  'site.sub_arrived': false,
  'site.sub_departed': false,
  'site.visit_logged': true,
  'site.weather_delay': true,
  'site.safety_incident': true,
  'material.delivered': true,
  'material.shortage': true,
  'work.rescheduled': true,
  // Client
  'client.request': true,
  // Receipts
  'receipt.uploaded': false,
};

// ============================================================================
// Event Categories (for UI filtering)
// ============================================================================

export const EVENT_CATEGORIES = {
  project: ['project.created', 'project.status_changed', 'project.completed', 'project.health_changed'],
  loop: ['loop.created', 'loop.renamed', 'loop.status_changed', 'loop.health_updated', 'loop.deleted'],
  intake: ['intake.started', 'intake.step_completed', 'intake.submitted', 'intake.abandoned'],
  estimate: ['estimate.created', 'estimate.sent', 'estimate.viewed', 'estimate.approved', 'estimate.rejected', 'estimate.revised', 'estimate.line_item_added', 'estimate.line_item_updated', 'estimate.line_item_deleted', 'tier.selected'],
  task: ['task.created', 'task.template_created', 'task.instance_created', 'task.assigned', 'task.started', 'task.completed', 'task.blocked', 'task.unblocked', 'task.status_changed', 'task.deleted', 'task.blocked_shared', 'milestone.reached', 'dependency.added', 'dependency.removed'],
  time: ['time.clock_in', 'time.clock_out', 'time.entry_logged', 'time.entry_approved'],
  field: ['photo.uploaded', 'photo.shared', 'inspection.scheduled', 'inspection.passed', 'inspection.failed', 'document.uploaded', 'document.shared', 'document.version_created', 'field_note.created', 'field_note.flagged_for_co'],
  site: ['site.meeting', 'site.issue', 'site.sub_arrived', 'site.sub_departed', 'site.visit_logged', 'site.weather_delay', 'site.safety_incident', 'material.delivered', 'material.shortage', 'work.rescheduled'],
  client: ['client.request'],
  receipt: ['receipt.uploaded'],
  customer: ['customer.created', 'customer.updated', 'customer.deleted', 'portal.invite_sent', 'portal.accessed', 'selection.made', 'selection.approved'],
  property: ['property.created', 'property.updated', 'property.deleted', 'property.transferred'],
  catalog: ['catalog.item_added', 'catalog.item_updated', 'catalog.item_deleted', 'catalog.price_updated'],
  change_order: ['change_order.created', 'change_order.sent', 'change_order.approved', 'change_order.rejected'],
  payment: ['invoice.created', 'invoice.sent', 'payment.received'],
} as const;

// ============================================================================
// Event Icons (for UI display)
// ============================================================================

export const EVENT_ICONS: Record<ActivityEventType, string> = {
  // Project
  'project.created': '🏗️',
  'project.status_changed': '📊',
  'project.completed': '🎉',
  'project.health_changed': '💚',
  // Loops
  'loop.created': '🔁',
  'loop.renamed': '✏️',
  'loop.status_changed': '📊',
  'loop.health_updated': '💚',
  'loop.deleted': '🗑️',
  // Intake
  'intake.started': '📋',
  'intake.step_completed': '✓',
  'intake.submitted': '✅',
  'intake.abandoned': '❌',
  // Estimating
  'estimate.created': '📋',
  'estimate.sent': '📤',
  'estimate.viewed': '👁️',
  'estimate.approved': '✅',
  'estimate.rejected': '❌',
  'estimate.revised': '📝',
  'estimate.line_item_added': '➕',
  'estimate.line_item_updated': '✏️',
  'estimate.line_item_deleted': '🗑️',
  'tier.selected': '⭐',
  // Tasks
  'task.created': '➕',
  'task.template_created': '📋',
  'task.instance_created': '➕',
  'task.assigned': '👤',
  'task.started': '▶️',
  'task.completed': '☑️',
  'task.blocked': '🚫',
  'task.unblocked': '✅',
  'task.status_changed': '📊',
  'task.deleted': '🗑️',
  'task.blocked_shared': '⚠️',
  'milestone.reached': '🏆',
  // Dependencies
  'dependency.added': '🔗',
  'dependency.removed': '🔓',
  // Time
  'time.clock_in': '⏱️',
  'time.clock_out': '⏱️',
  'time.entry_logged': '✅',
  'time.entry_approved': '✓',
  // Field Docs
  'photo.uploaded': '📷',
  'photo.shared': '🖼️',
  'inspection.scheduled': '📅',
  'inspection.passed': '✓',
  'inspection.failed': '✗',
  'document.uploaded': '📄',
  'document.shared': '📤',
  'document.version_created': '📄',
  'field_note.created': '📝',
  'field_note.flagged_for_co': '🚩',
  // Customers
  'customer.created': '👤',
  'customer.updated': '✏️',
  'customer.deleted': '🗑️',
  'portal.invite_sent': '✉️',
  'portal.accessed': '🔑',
  'selection.made': '🎯',
  'selection.approved': '✅',
  // Properties
  'property.created': '🏠',
  'property.updated': '✏️',
  'property.deleted': '🗑️',
  'property.transferred': '🔄',
  // Catalog
  'catalog.item_added': '➕',
  'catalog.item_updated': '✏️',
  'catalog.item_deleted': '🗑️',
  'catalog.price_updated': '💲',
  // Change Orders
  'change_order.created': '📝',
  'change_order.sent': '📤',
  'change_order.approved': '✅',
  'change_order.rejected': '❌',
  // Payments
  'invoice.created': '🧾',
  'invoice.sent': '📤',
  'payment.received': '💰',
  // Site Events
  'site.meeting': '🤝',
  'site.issue': '⚠️',
  'site.sub_arrived': '🚗',
  'site.sub_departed': '👋',
  'site.visit_logged': '📍',
  'site.weather_delay': '🌧️',
  'site.safety_incident': '🦺',
  'material.delivered': '📦',
  'material.shortage': '❗',
  'work.rescheduled': '📅',
  // Client
  'client.request': '💬',
  // Receipts
  'receipt.uploaded': '🧾',
};

/** Default icon for unknown event types */
export const DEFAULT_EVENT_ICON = '📌';

/**
 * Get the icon for an event type with fallback to default
 */
export function getEventIcon(eventType: string): string {
  return EVENT_ICONS[eventType as ActivityEventType] ?? DEFAULT_EVENT_ICON;
}
