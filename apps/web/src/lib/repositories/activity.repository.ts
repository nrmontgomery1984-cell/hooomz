/**
 * Activity Repository - IndexedDB implementation for offline-first operation
 *
 * The Activity Log is THE SPINE of Hooomz:
 * - Every action writes an immutable event
 * - Events are never edited or deleted
 * - All dashboards and reports derive from events
 */

import { generateId } from '@hooomz/shared-contracts';
import { EVENT_VISIBILITY_DEFAULTS, SYSTEM_USER } from '@hooomz/shared';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

/**
 * Activity event structure (immutable once created)
 */
export interface ActivityEvent {
  id: string;
  event_type: string;
  timestamp: string;

  // Human-readable summary (REQUIRED)
  // Must be specific, scannable on mobile: "Completed: Install LVP — Living Room"
  summary: string;

  // Actor
  actor_id: string;
  actor_type: 'team_member' | 'system' | 'customer';
  actor_name?: string;

  // Context
  organization_id: string;
  project_id: string;
  project_name?: string;

  // Three-Axis Metadata (for filtering)
  work_category_code: string | null;  // What: FL, PT, FC, TL, DW, OH
  trade: string | null;               // Who: which trade or person doing the work
  stage_code: string | null;          // When: ST-DM, ST-PR, ST-FN, ST-PL, ST-CL
  location_id: string | null;         // Where: room or area reference

  // Entity Reference
  entity_type: string;
  entity_id: string;

  // Visibility
  homeowner_visible: boolean;

  // Event-Specific Payload
  event_data: Record<string, unknown>;
}

/**
 * Create activity event input
 */
export interface CreateActivityEvent {
  event_type: string;
  project_id: string;
  entity_type: string;
  entity_id: string;

  // Human-readable summary (REQUIRED)
  // Must be specific: "Created estimate line item: LVP Flooring — Living Room — 450 sqft"
  summary: string;

  event_data?: Record<string, unknown>;

  // Optional overrides
  actor_id?: string;
  actor_type?: 'team_member' | 'system' | 'customer';
  actor_name?: string;
  organization_id?: string;
  project_name?: string;
  homeowner_visible?: boolean;
  work_category_code?: string | null;
  trade?: string | null;
  stage_code?: string | null;
  location_id?: string | null;
}

/**
 * Activity query filters
 * Supports three-axis filtering: Work Category × Trade × Stage
 */
export interface ActivityFilters {
  project_id?: string;
  event_type?: string | string[];
  entity_type?: string;
  entity_id?: string;
  // Three-axis filtering
  work_category_code?: string;  // What: FL, PT, FC, TL, DW, OH
  trade?: string;               // Who: which trade or person
  stage_code?: string;          // When: Estimate, Scope, Active, etc.
  location_id?: string;         // Where: room or area
  homeowner_visible?: boolean;
  after?: string;
  before?: string;
}

/**
 * Paginated activity response
 */
export interface ActivityResponse {
  events: ActivityEvent[];
  total: number;
  nextCursor?: number;
}

/**
 * IndexedDB-backed Activity Repository
 * Events are immutable - no update or delete operations
 */
export class ActivityRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.ACTIVITY_EVENTS;
  private syncQueue: SyncQueue;

  // Default organization ID (to be replaced with actual auth context)
  private defaultOrganizationId = 'org_default';

  // Default actor (to be replaced with actual auth context)
  private defaultActor = SYSTEM_USER;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  /**
   * Create an activity event (immutable)
   * This is the core method - every action in the system should call this
   */
  async create(data: CreateActivityEvent): Promise<ActivityEvent> {
    const timestamp = new Date().toISOString();
    const id = generateId('event');

    // Determine homeowner visibility based on event type defaults
    const visibilityDefaults = EVENT_VISIBILITY_DEFAULTS as Record<string, boolean>;
    const defaultVisibility = visibilityDefaults[data.event_type] ?? false;

    const event: ActivityEvent = {
      id,
      event_type: data.event_type,
      timestamp,

      // Human-readable summary (REQUIRED)
      summary: data.summary,

      // Actor (defaults to system if not provided)
      actor_id: data.actor_id ?? this.defaultActor.id,
      actor_type: data.actor_type ?? this.defaultActor.type,
      actor_name: data.actor_name ?? this.defaultActor.name,

      // Context
      organization_id: data.organization_id ?? this.defaultOrganizationId,
      project_id: data.project_id,
      project_name: data.project_name,

      // Three-Axis Metadata
      work_category_code: data.work_category_code ?? null,
      trade: data.trade ?? null,
      stage_code: data.stage_code ?? null,
      location_id: data.location_id ?? null,

      // Entity Reference
      entity_type: data.entity_type,
      entity_id: data.entity_id,

      // Visibility (use explicit value or default based on event type)
      homeowner_visible: data.homeowner_visible ?? defaultVisibility,

      // Event-Specific Payload
      event_data: data.event_data ?? {},
    };

    await this.storage.set(this.storeName, event.id, event);
    await this.syncQueue.queueCreate(this.storeName, event.id, event);

    return event;
  }

  /**
   * Find events by project with pagination
   */
  async findByProject(
    projectId: string,
    options: {
      cursor?: number;
      limit?: number;
      filters?: Omit<ActivityFilters, 'project_id'>;
    } = {}
  ): Promise<ActivityResponse> {
    const { cursor = 0, limit = 20, filters = {} } = options;

    let events = await this.storage.getAll<ActivityEvent>(this.storeName);

    // Filter by project
    events = events.filter((e) => e.project_id === projectId);

    // Apply additional filters
    events = this.applyFilters(events, filters);

    // Sort by timestamp (newest first)
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const total = events.length;

    // Apply pagination
    const paginated = events.slice(cursor, cursor + limit);
    const nextCursor =
      cursor + limit < total ? cursor + limit : undefined;

    return {
      events: paginated,
      total,
      nextCursor,
    };
  }

  /**
   * Find recent events across all projects
   */
  async findRecent(
    options: {
      cursor?: number;
      limit?: number;
      filters?: ActivityFilters;
    } = {}
  ): Promise<ActivityResponse> {
    const { cursor = 0, limit = 20, filters = {} } = options;

    let events = await this.storage.getAll<ActivityEvent>(this.storeName);

    // Apply filters
    events = this.applyFilters(events, filters);

    // Sort by timestamp (newest first)
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const total = events.length;

    // Apply pagination
    const paginated = events.slice(cursor, cursor + limit);
    const nextCursor =
      cursor + limit < total ? cursor + limit : undefined;

    return {
      events: paginated,
      total,
      nextCursor,
    };
  }

  /**
   * Find events by entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    options: { limit?: number } = {}
  ): Promise<ActivityEvent[]> {
    const { limit = 50 } = options;

    let events = await this.storage.getAll<ActivityEvent>(this.storeName);

    events = events.filter(
      (e) => e.entity_type === entityType && e.entity_id === entityId
    );

    // Sort by timestamp (newest first)
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return events.slice(0, limit);
  }

  /**
   * Find a single event by ID
   */
  async findById(id: string): Promise<ActivityEvent | null> {
    return await this.storage.get<ActivityEvent>(this.storeName, id);
  }

  /**
   * Get event counts by type for a project
   */
  async getEventCounts(projectId: string): Promise<Record<string, number>> {
    const events = await this.storage.getAll<ActivityEvent>(this.storeName);
    const projectEvents = events.filter((e) => e.project_id === projectId);

    const counts: Record<string, number> = {};
    for (const event of projectEvents) {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    }

    return counts;
  }

  /**
   * Get events for homeowner view (filtered by visibility)
   */
  async findHomeownerVisible(
    projectId: string,
    options: { cursor?: number; limit?: number } = {}
  ): Promise<ActivityResponse> {
    return this.findByProject(projectId, {
      ...options,
      filters: { homeowner_visible: true },
    });
  }

  /**
   * Apply filters to events array
   */
  private applyFilters(
    events: ActivityEvent[],
    filters: ActivityFilters
  ): ActivityEvent[] {
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

    if (filters.entity_id) {
      filtered = filtered.filter((e) => e.entity_id === filters.entity_id);
    }

    if (filters.work_category_code) {
      filtered = filtered.filter(
        (e) => e.work_category_code === filters.work_category_code
      );
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
      filtered = filtered.filter(
        (e) => e.homeowner_visible === filters.homeowner_visible
      );
    }

    if (filters.after) {
      const afterDate = new Date(filters.after);
      filtered = filtered.filter((e) => new Date(e.timestamp) >= afterDate);
    }

    if (filters.before) {
      const beforeDate = new Date(filters.before);
      filtered = filtered.filter((e) => new Date(e.timestamp) <= beforeDate);
    }

    return filtered;
  }
}

/**
 * ActivityService - Higher-level service that wraps the repository
 * with convenience methods for common event logging patterns
 *
 * Every method generates a human-readable summary string automatically.
 * Summaries must be scannable on a phone at a job site.
 */
export class ActivityService {
  private repository: ActivityRepository;

  constructor(repository: ActivityRepository) {
    this.repository = repository;
  }

  /**
   * Generic event creation — used by Quick Add and other generic logging.
   * Delegates directly to the repository.
   */
  async create(data: CreateActivityEvent): Promise<ActivityEvent> {
    return this.repository.create(data);
  }

  /**
   * Log a project event
   */
  async logProjectEvent(
    eventType: 'project.created' | 'project.status_changed' | 'project.completed',
    projectId: string,
    data: {
      project_name?: string;
      old_status?: string;
      new_status?: string;
      details?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    let summary: string;
    const projectName = data.project_name || 'Project';
    switch (eventType) {
      case 'project.created':
        summary = `Created project: ${projectName}`;
        if (data.details) summary += ` — ${data.details}`;
        break;
      case 'project.status_changed':
        summary = `Project status: ${data.old_status || 'unknown'} → ${data.new_status || 'unknown'}`;
        break;
      case 'project.completed':
        summary = `Project completed: ${projectName}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'project',
      entity_id: projectId,
      summary,
      project_name: data.project_name,
      event_data: data,
    });
  }

  /**
   * Log a task event
   */
  async logTaskEvent(
    eventType:
      | 'task.template_created'
      | 'task.instance_created'
      | 'task.created'
      | 'task.status_changed'
      | 'task.completed'
      | 'task.blocked'
      | 'task.started'
      | 'task.deleted'
      | 'task.assigned',
    projectId: string,
    taskId: string,
    data: {
      task_title?: string;
      old_status?: string;
      new_status?: string;
      reason?: string;
      assigned_to?: string;
      work_category_code?: string;
      trade?: string;
      stage_code?: string;
      location_id?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const taskTitle = data.task_title || 'Task';
    let summary: string;
    switch (eventType) {
      case 'task.template_created':
        summary = `Created task template: ${taskTitle}`;
        break;
      case 'task.instance_created':
      case 'task.created':
        summary = `Created task: ${taskTitle}`;
        break;
      case 'task.status_changed':
        summary = `Task status: ${taskTitle} — ${data.old_status || 'unknown'} → ${data.new_status || 'unknown'}`;
        break;
      case 'task.started':
        summary = `Started task: ${taskTitle}`;
        break;
      case 'task.completed':
        summary = `Completed task: ${taskTitle}`;
        break;
      case 'task.blocked':
        summary = `Blocked: ${taskTitle}${data.reason ? ` — ${data.reason}` : ''}`;
        break;
      case 'task.deleted':
        summary = `Deleted task: ${taskTitle}`;
        break;
      case 'task.assigned':
        summary = `Assigned task: ${taskTitle}${data.assigned_to ? ` → ${data.assigned_to}` : ''}`;
        break;
      default:
        summary = `Task event: ${taskTitle}`;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'task',
      entity_id: taskId,
      summary,
      work_category_code: data.work_category_code ?? null,
      trade: data.trade ?? null,
      stage_code: data.stage_code ?? null,
      location_id: data.location_id ?? null,
      event_data: data,
    });
  }

  /**
   * Log a time entry event
   */
  async logTimeEvent(
    eventType: 'time.clock_in' | 'time.clock_out' | 'time.entry_logged' | 'time.entry_approved',
    projectId: string,
    timeEntryId: string,
    data: {
      duration_minutes?: number;
      task_id?: string;
      task_name?: string;
      worker_name?: string;
      work_category_code?: string;
      trade?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const worker = data.worker_name || 'Worker';
    let summary: string;
    switch (eventType) {
      case 'time.clock_in':
        summary = `Clocked in: ${worker}`;
        break;
      case 'time.clock_out':
        const hours = data.duration_minutes ? (data.duration_minutes / 60).toFixed(1) : '?';
        summary = `Clocked out: ${worker} — ${hours} hours`;
        break;
      case 'time.entry_logged': {
        const taskHours = data.duration_minutes ? (data.duration_minutes / 60).toFixed(1) : '?';
        summary = `Task time logged: ${worker} — ${taskHours}h on ${data.task_name || 'task'}`;
        break;
      }
      case 'time.entry_approved':
        summary = `Time entry approved: ${worker}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'time_entry',
      entity_id: timeEntryId,
      summary,
      work_category_code: data.work_category_code ?? null,
      trade: data.trade ?? null,
      event_data: data,
    });
  }

  /**
   * Log a photo event
   */
  async logPhotoEvent(
    eventType: 'photo.uploaded' | 'photo.shared',
    projectId: string,
    photoId: string,
    data: {
      caption?: string;
      tags?: string[];
      location_name?: string;
      work_category_code?: string;
      trade?: string;
      location_id?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    let summary: string;
    const location = data.location_name || data.location_id || '';
    if (eventType === 'photo.uploaded') {
      summary = `Photo uploaded${location ? `: ${location}` : ''}${data.caption ? ` — ${data.caption}` : ''}`;
    } else {
      summary = `Photo shared${location ? `: ${location}` : ''}`;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'photo',
      entity_id: photoId,
      summary,
      work_category_code: data.work_category_code ?? null,
      trade: data.trade ?? null,
      location_id: data.location_id ?? null,
      event_data: data,
      homeowner_visible: eventType === 'photo.shared',
    });
  }

  /**
   * Log an inspection event
   */
  async logInspectionEvent(
    eventType: 'inspection.scheduled' | 'inspection.passed' | 'inspection.failed',
    projectId: string,
    inspectionId: string,
    data: {
      inspection_type?: string;
      inspector?: string;
      notes?: string;
      reason?: string;
      scheduled_date?: string;
      photos?: string[];
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const inspType = data.inspection_type || 'Inspection';
    let summary: string;
    switch (eventType) {
      case 'inspection.scheduled':
        summary = `Scheduled inspection: ${inspType}${data.scheduled_date ? ` — ${data.scheduled_date}` : ''}`;
        break;
      case 'inspection.passed':
        summary = `Inspection passed: ${inspType}`;
        break;
      case 'inspection.failed':
        summary = `Inspection failed: ${inspType}${data.reason ? ` — ${data.reason}` : ''}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'inspection',
      entity_id: inspectionId,
      summary,
      event_data: data,
    });
  }

  /**
   * Log a financial event (estimate, invoice, payment)
   */
  async logFinancialEvent(
    eventType:
      | 'estimate.created'
      | 'estimate.sent'
      | 'estimate.approved'
      | 'change_order.created'
      | 'invoice.created'
      | 'payment.received',
    projectId: string,
    entityType: 'estimate' | 'change_order' | 'invoice' | 'payment',
    entityId: string,
    data: {
      amount?: number;
      description?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const amountStr = data.amount ? `$${data.amount.toLocaleString()}` : '';
    let summary: string;
    switch (eventType) {
      case 'estimate.created':
        summary = `Created estimate${amountStr ? `: ${amountStr}` : ''}`;
        break;
      case 'estimate.sent':
        summary = `Sent estimate${amountStr ? `: ${amountStr}` : ''}`;
        break;
      case 'estimate.approved':
        summary = `Estimate approved${amountStr ? `: ${amountStr}` : ''}`;
        break;
      case 'change_order.created':
        summary = `Change order created${amountStr ? `: ${amountStr}` : ''}${data.description ? ` — ${data.description}` : ''}`;
        break;
      case 'invoice.created':
        summary = `Invoice created${amountStr ? `: ${amountStr}` : ''}`;
        break;
      case 'payment.received':
        summary = `Payment received${amountStr ? `: ${amountStr}` : ''}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: entityType,
      entity_id: entityId,
      summary,
      event_data: data,
    });
  }

  /**
   * Log an estimate line item event
   */
  async logEstimateLineItemEvent(
    eventType: 'estimate.line_item_added' | 'estimate.line_item_updated' | 'estimate.line_item_deleted',
    projectId: string,
    lineItemId: string,
    data: {
      description?: string;
      quantity?: number;
      unit?: string;
      total?: number;
      category?: string;
      work_category_code?: string;
      trade?: string;
      location_id?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const desc = data.description || 'Line item';
    const qty = data.quantity && data.unit ? `${data.quantity} ${data.unit}` : '';
    let summary: string;
    switch (eventType) {
      case 'estimate.line_item_added':
        summary = `Added line item: ${desc}${qty ? ` — ${qty}` : ''}`;
        break;
      case 'estimate.line_item_updated':
        summary = `Updated line item: ${desc}`;
        break;
      case 'estimate.line_item_deleted':
        summary = `Deleted line item: ${desc}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'line_item',
      entity_id: lineItemId,
      summary,
      work_category_code: data.work_category_code ?? null,
      trade: data.trade ?? null,
      location_id: data.location_id ?? null,
      event_data: data,
    });
  }

  /**
   * Log a field note event
   */
  async logFieldNoteEvent(
    projectId: string,
    fieldNoteId: string,
    data: {
      content?: string;
      location_name?: string;
      work_category_code?: string;
      trade?: string;
      stage_code?: string;
      location_id?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const location = data.location_name || data.location_id || '';
    const preview = data.content ? data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '') : '';
    const summary = `Field note${location ? ` — ${location}` : ''}${preview ? `: ${preview}` : ''}`;

    return this.repository.create({
      event_type: 'field_note.created',
      project_id: projectId,
      entity_type: 'field_note',
      entity_id: fieldNoteId,
      summary,
      work_category_code: data.work_category_code ?? null,
      trade: data.trade ?? null,
      stage_code: data.stage_code ?? null,
      location_id: data.location_id ?? null,
      event_data: data,
    });
  }

  /**
   * Log a customer event
   */
  async logCustomerEvent(
    eventType: 'customer.created' | 'customer.updated' | 'customer.deleted',
    customerId: string,
    data: {
      customer_name?: string;
      project_id?: string;
      changes?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const name = data.customer_name || 'Customer';
    let summary: string;
    switch (eventType) {
      case 'customer.created':
        summary = `Customer created: ${name}`;
        break;
      case 'customer.updated':
        summary = `Customer updated: ${name}${data.changes ? ` — ${data.changes}` : ''}`;
        break;
      case 'customer.deleted':
        summary = `Customer deleted: ${name}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: data.project_id ?? 'org_level',
      entity_type: 'customer',
      entity_id: customerId,
      summary,
      event_data: data,
    });
  }

  /**
   * Log a property event
   */
  async logPropertyEvent(
    eventType: 'property.created' | 'property.updated' | 'property.deleted' | 'property.transferred',
    propertyId: string,
    data: {
      address?: string;
      project_id?: string;
      old_owner?: string;
      new_owner?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const addr = data.address || 'Property';
    let summary: string;
    switch (eventType) {
      case 'property.created':
        summary = `Property created: ${addr}`;
        break;
      case 'property.updated':
        summary = `Property updated: ${addr}`;
        break;
      case 'property.deleted':
        summary = `Property deleted: ${addr}`;
        break;
      case 'property.transferred':
        summary = `Property transferred: ${addr}${data.new_owner ? ` → ${data.new_owner}` : ''}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: data.project_id ?? 'org_level',
      entity_type: 'property',
      entity_id: propertyId,
      summary,
      event_data: data,
    });
  }

  /**
   * Log an intake event (project creation from intake wizard)
   */
  async logIntakeEvent(
    eventType:
      | 'intake.started'
      | 'intake.step_completed'
      | 'intake.submitted'
      | 'intake.abandoned',
    intakeId: string,
    data: {
      intake_type?: 'homeowner' | 'contractor';
      step_id?: string;
      step_name?: string;
      project_name?: string;
      rooms_selected?: string[];
      trades_selected?: string[];
      scope_tiers?: Record<string, string>;  // { room_id: 'refresh' | 'full' }
      quality_tiers?: Record<string, string>; // { category: 'good' | 'better' | 'best' }
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const type = data.intake_type === 'contractor' ? 'Contractor' : 'Homeowner';
    const projectName = data.project_name || 'New project';
    let summary: string;
    switch (eventType) {
      case 'intake.started':
        summary = `${type} intake started: ${projectName}`;
        break;
      case 'intake.step_completed':
        summary = `Intake step completed: ${data.step_name || data.step_id || 'Step'}`;
        break;
      case 'intake.submitted':
        summary = `Intake submitted: ${projectName}`;
        break;
      case 'intake.abandoned':
        summary = `Intake abandoned: ${projectName}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: intakeId, // Use intake ID as project ID until real project is created
      entity_type: 'intake',
      entity_id: intakeId,
      summary,
      event_data: data,
      homeowner_visible: false, // Intake events are internal
    });
  }

  /**
   * Log a loop event (loop created from scope)
   */
  async logLoopEvent(
    eventType:
      | 'loop.created'
      | 'loop.status_changed'
      | 'loop.health_updated'
      | 'loop.deleted'
      | 'loop.context_created'
      | 'loop.iteration_created'
      | 'loop.iteration_updated'
      | 'loop.tasks_bound'
      | 'loop.structure_templated',
    projectId: string,
    loopId: string,
    data: {
      loop_name?: string;
      loop_type?: string;
      parent_loop_id?: string | null;
      old_status?: string;
      new_status?: string;
      health_score?: number;
      work_category_code?: string;
      trade?: string;
      stage_code?: string;
      location_id?: string;
      context_id?: string;
      template_floors?: number;
      template_rooms?: number;
      tasks_bound?: number;
      [key: string]: unknown;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const loopName = data.loop_name || 'Loop';
    let summary: string;
    switch (eventType) {
      case 'loop.created':
        summary = `Created ${data.loop_type || 'loop'}: ${loopName}`;
        break;
      case 'loop.context_created':
        summary = `Created loop context: ${loopName} (${data.loop_type || 'custom'})`;
        break;
      case 'loop.iteration_created':
        summary = `Created iteration: ${loopName}`;
        break;
      case 'loop.iteration_updated':
        summary = `Updated iteration: ${loopName}`;
        break;
      case 'loop.tasks_bound':
        summary = `Bound ${data.tasks_bound || 0} tasks to ${loopName}`;
        break;
      case 'loop.structure_templated':
        summary = `Applied template: ${loopName} — ${data.template_floors || 0} floors, ${data.template_rooms || 0} rooms`;
        break;
      case 'loop.status_changed':
        summary = `Loop status: ${loopName} — ${data.old_status || 'unknown'} → ${data.new_status || 'unknown'}`;
        break;
      case 'loop.health_updated':
        summary = `Loop health: ${loopName} — ${data.health_score ?? 0}%`;
        break;
      case 'loop.deleted':
        summary = `Deleted loop: ${loopName}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'loop',
      entity_id: loopId,
      summary,
      work_category_code: data.work_category_code ?? null,
      trade: data.trade ?? null,
      stage_code: data.stage_code ?? null,
      location_id: data.location_id ?? null,
      event_data: data,
    });
  }

  /**
   * Log a catalog event (material or labor rate changes)
   */
  async logCatalogEvent(
    eventType: 'catalog.item_added' | 'catalog.item_updated' | 'catalog.item_deleted' | 'catalog.price_updated',
    itemId: string,
    data: {
      item_name?: string;
      category?: string;
      old_price?: number;
      new_price?: number;
      project_id?: string;
    } = {}
  ): Promise<ActivityEvent> {
    // Generate human-readable summary
    const itemName = data.item_name || 'Catalog item';
    let summary: string;
    switch (eventType) {
      case 'catalog.item_added':
        summary = `Catalog item added: ${itemName}`;
        break;
      case 'catalog.item_updated':
        summary = `Catalog item updated: ${itemName}`;
        break;
      case 'catalog.item_deleted':
        summary = `Catalog item deleted: ${itemName}`;
        break;
      case 'catalog.price_updated':
        const oldP = data.old_price ? `$${data.old_price}` : '?';
        const newP = data.new_price ? `$${data.new_price}` : '?';
        summary = `Price updated: ${itemName} — ${oldP} → ${newP}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: data.project_id ?? 'org_level',
      entity_type: 'catalog_item',
      entity_id: itemId,
      summary,
      event_data: data,
    });
  }

  /**
   * Log a dependency event (task dependencies)
   */
  async logDependencyEvent(
    eventType: 'dependency.added' | 'dependency.removed',
    projectId: string,
    taskId: string,
    data: {
      task_title?: string;
      depends_on_task_title?: string;
      depends_on_task_id?: string;
    } = {}
  ): Promise<ActivityEvent> {
    const taskTitle = data.task_title || 'Task';
    const depTitle = data.depends_on_task_title || 'another task';
    const summary = eventType === 'dependency.added'
      ? `Dependency added: ${taskTitle} now depends on ${depTitle}`
      : `Dependency removed: ${taskTitle} no longer depends on ${depTitle}`;

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'task_dependency',
      entity_id: taskId,
      summary,
      event_data: data,
    });
  }

  /**
   * Log a Labs event (observations, submissions, experiments, knowledge)
   */
  async logLabsEvent(
    eventType: string,
    entityId: string,
    data: {
      entity_name?: string;
      project_id?: string;
      knowledge_type?: string;
      [key: string]: unknown;
    } = {}
  ): Promise<ActivityEvent> {
    const entityName = data.entity_name || 'Labs item';
    let summary: string;
    switch (eventType) {
      case 'labs.observation_captured':
        summary = `Field observation captured: ${entityName}`;
        break;
      case 'labs.crew_rating_submitted':
        summary = `Crew rating submitted: ${entityName}`;
        break;
      case 'labs.catalog_item_added':
        summary = `Labs catalog item added: ${entityName}`;
        break;
      case 'labs.submission_created':
        summary = `Field submission created: ${entityName}`;
        break;
      case 'labs.submission_resolved':
        summary = `Field submission resolved: ${entityName}`;
        break;
      case 'labs.experiment_created':
        summary = `Experiment created: ${entityName}`;
        break;
      case 'labs.participation_accepted':
        summary = `Experiment participation accepted: ${entityName}`;
        break;
      case 'labs.checkpoint_completed':
        summary = `Checkpoint completed: ${entityName}`;
        break;
      case 'labs.knowledge_item_published':
        summary = `Knowledge item published: ${entityName}`;
        break;
      case 'labs.confidence_updated':
        summary = `Confidence score updated: ${entityName}`;
        break;
      case 'labs.challenge_filed':
        summary = `Knowledge challenge filed: ${entityName}`;
        break;
      // Build 2: Observation Trigger System
      case 'labs.observation_confirmed':
        summary = `Observation confirmed: ${entityName}`;
        break;
      case 'labs.observation_deviated':
        summary = `Observation deviated: ${entityName}`;
        break;
      case 'labs.batch_processed':
        summary = `Batch processed: ${entityName}`;
        break;
      // Tool Research P1-P2
      case 'labs.tool.purchased':
        summary = `Tool purchased: ${entityName}`;
        break;
      case 'labs.tool.used':
        summary = `Tool use logged: ${entityName}`;
        break;
      case 'labs.tool.retired':
        summary = `Tool retired: ${entityName}`;
        break;
      case 'labs.content.status':
        summary = `Content status updated: ${entityName}`;
        break;
      default:
        summary = `Labs event: ${entityName}`;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: data.project_id ?? 'org_level',
      entity_type: 'labs',
      entity_id: entityId,
      summary,
      event_data: data,
    });
  }

  /**
   * Log a training event (Build 3c)
   */
  async logTrainingEvent(
    eventType:
      | 'training.supervised_completion'
      | 'training.review_ready'
      | 'training.review_completed'
      | 'training.certified'
      | 'training.gate_warning',
    crewMemberId: string,
    data: {
      sop_code?: string;
      sop_id?: string;
      task_id?: string;
      supervisor_name?: string;
      completion_number?: number;
      completions?: number;
      required?: number;
      attempt_number?: number;
      score?: number;
      passed?: boolean;
      certified_by?: string;
      crew_name?: string;
      [key: string]: unknown;
    } = {}
  ): Promise<ActivityEvent> {
    const sopCode = data.sop_code || 'SOP';
    const crewName = data.crew_name || crewMemberId;
    let summary: string;
    switch (eventType) {
      case 'training.supervised_completion':
        summary = `Supervised completion #${data.completion_number || '?'}: ${crewName} — ${sopCode}`;
        break;
      case 'training.review_ready':
        summary = `Review ready: ${crewName} — ${sopCode} (${data.completions}/${data.required} completions)`;
        break;
      case 'training.review_completed':
        summary = `Review ${data.passed ? 'passed' : 'failed'}: ${crewName} — ${sopCode} (${data.score}%)`;
        break;
      case 'training.certified':
        summary = `Certified: ${crewName} — ${sopCode} (by ${data.certified_by || 'unknown'})`;
        break;
      case 'training.gate_warning':
        summary = `Training gate warning: ${crewName} not certified for ${sopCode}`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: data.task_id ? 'task_context' : 'org_level',
      entity_type: 'training_record',
      entity_id: crewMemberId,
      summary,
      event_data: data,
    });
  }

  /**
   * Log a budget event (Build 3c)
   */
  async logBudgetEvent(
    eventType:
      | 'budget.created'
      | 'budget.updated'
      | 'budget.over_budget'
      | 'budget.completed',
    projectId: string,
    budgetId: string,
    data: {
      task_id?: string;
      sop_code?: string;
      budgeted_hours?: number;
      actual_hours?: number;
      efficiency?: number | null;
      wage_rate?: number;
      charged_rate?: number;
      [key: string]: unknown;
    } = {}
  ): Promise<ActivityEvent> {
    const sopCode = data.sop_code || 'Task';
    let summary: string;
    switch (eventType) {
      case 'budget.created':
        summary = `Budget created: ${sopCode} — ${data.budgeted_hours || 0}h budgeted`;
        break;
      case 'budget.updated':
        summary = `Budget updated: ${sopCode} — ${data.actual_hours || 0}h actual / ${data.budgeted_hours || 0}h budgeted`;
        break;
      case 'budget.over_budget':
        summary = `Over budget: ${sopCode} — ${data.actual_hours || 0}h actual / ${data.budgeted_hours || 0}h budgeted (${data.efficiency || 0}%)`;
        break;
      case 'budget.completed':
        summary = `Budget complete: ${sopCode} — ${data.efficiency || 0}% efficiency`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'task_budget',
      entity_id: budgetId,
      summary,
      event_data: data,
    });
  }

  /**
   * Log labour estimation events
   */
  async logLabourEvent(
    eventType:
      | 'labour.estimate_applied'
      | 'labour.crew_assigned'
      | 'labour.hours_recorded'
      | 'labour.variance_recorded'
      | 'labour.variance_warning'
      | 'labour.config_updated'
      | 'labour.estimates_recalculated',
    projectId: string,
    entityId: string,
    data: {
      sell_budget?: number;
      cost_budget?: number;
      budgeted_hours?: number;
      actual_hours?: number;
      actual_cost?: number;
      scheduling_variance?: number;
      variance_pct?: number;
      skill_level?: number;
      margin?: number;
      crew_member_id?: string;
      crew_name?: string;
      cost_rate?: number;
      tasks_updated?: number;
      [key: string]: unknown;
    } = {}
  ): Promise<ActivityEvent> {
    let summary: string;
    switch (eventType) {
      case 'labour.estimate_applied':
        summary = `Labour estimate applied — $${data.sell_budget?.toFixed(2) || '?'} sell, ${data.budgeted_hours?.toFixed(1) || '?'}h budgeted`;
        break;
      case 'labour.crew_assigned':
        summary = `Crew assigned: ${data.crew_name || 'Crew'} at $${data.cost_rate || '?'}/hr`;
        break;
      case 'labour.hours_recorded':
        summary = `Actual hours recorded: ${data.actual_hours?.toFixed(1) || '?'}h`;
        break;
      case 'labour.variance_recorded':
        summary = `Variance recorded — $${data.scheduling_variance?.toFixed(2) || '?'}`;
        break;
      case 'labour.variance_warning':
        summary = `Variance warning: ${data.variance_pct?.toFixed(0) || '?'}% over cost budget`;
        break;
      case 'labour.config_updated':
        summary = 'Skill rate config updated';
        break;
      case 'labour.estimates_recalculated':
        summary = `Labour estimates recalculated — ${data.tasks_updated || 0} tasks updated`;
        break;
    }

    return this.repository.create({
      event_type: eventType,
      project_id: projectId,
      entity_type: 'labour_estimate',
      entity_id: entityId,
      summary,
      event_data: data,
    });
  }

  /**
   * Get repository for direct access to query methods
   */
  getRepository(): ActivityRepository {
    return this.repository;
  }
}
