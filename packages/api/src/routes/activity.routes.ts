/**
 * Activity Routes
 *
 * REST API endpoints for the Activity Log - THE SPINE of Hooomz.
 *
 * All routes use cursor-based pagination for efficient infinite scroll.
 * Events are immutable - only GET and POST operations are allowed.
 */

import { Router } from 'express';
import type { OrgContextRequest } from '../middleware';
import { asyncHandler, ValidationError } from '../middleware';
import type { ServiceContainer } from '../factories/service-factory';
import type { ActivityQueryOptions, CreateActivityEventInput } from '@hooomz/shared';

export function createActivityRouter(services: ServiceContainer): Router {
  const router = Router();
  const { activityService } = services;

  // ==========================================================================
  // GET /api/activity/recent
  // Get recent activity across all projects for the organization
  // ==========================================================================
  router.get(
    '/recent',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const options = parseQueryOptions(req.query);

      const result = await activityService.getRecentActivity(
        req.organization.organization_id,
        options
      );

      res.json({
        data: result.events,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    })
  );

  // ==========================================================================
  // GET /api/activity/project/:projectId
  // Get activity for a specific project
  // ==========================================================================
  router.get(
    '/project/:projectId',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const options = parseQueryOptions(req.query);

      const result = await activityService.getProjectActivity(
        req.params.projectId,
        options
      );

      res.json({
        data: result.events,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    })
  );

  // ==========================================================================
  // GET /api/activity/property/:propertyId
  // Get activity for a specific property
  // Additional param: homeowner (boolean)
  //   - If homeowner=true, only return homeowner_visible events
  //   - Used for client portal
  // ==========================================================================
  router.get(
    '/property/:propertyId',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const options = parseQueryOptions(req.query);

      // Parse homeowner filter - if true, only return homeowner_visible events
      const homeownerOnly = req.query.homeowner === 'true';

      const result = await activityService.getPropertyActivity(
        req.params.propertyId,
        homeownerOnly,
        options
      );

      res.json({
        data: result.events,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    })
  );

  // ==========================================================================
  // GET /api/activity/portal/:propertyId
  // Get homeowner-visible activity for customer portal
  // Only returns events where homeowner_visible = true
  // ==========================================================================
  router.get(
    '/portal/:propertyId',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const options = parseQueryOptions(req.query);

      const result = await activityService.getPropertyActivity(
        req.params.propertyId,
        true, // Only homeowner-visible events
        options
      );

      res.json({
        data: result.events,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    })
  );

  // ==========================================================================
  // GET /api/activity/counts/:projectId
  // Get event counts by type for a project
  // Used for dashboards and reporting
  // ==========================================================================
  router.get(
    '/counts/:projectId',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { since } = req.query;

      // Default to last 30 days if not specified
      const sinceDate = since
        ? new Date(since as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const counts = await activityService.getEventCountByType(
        req.params.projectId,
        sinceDate
      );

      // Convert Map to object for JSON response
      const byType: Record<string, number> = {};
      for (const [eventType, count] of counts) {
        byType[eventType] = count;
      }

      // Calculate total
      const total = Array.from(counts.values()).reduce((sum, c) => sum + c, 0);

      res.json({
        data: {
          total,
          by_type: byType,
          since: sinceDate.toISOString(),
        },
      });
    })
  );

  // ==========================================================================
  // GET /api/activity/counts/:projectId/categories
  // Get event counts grouped by category (task, photo, etc.)
  // ==========================================================================
  router.get(
    '/counts/:projectId/categories',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { since } = req.query;

      const sinceDate = since
        ? new Date(since as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const counts = await activityService.getEventCountByCategory(
        req.params.projectId,
        sinceDate
      );

      const byCategory: Record<string, number> = {};
      for (const [category, count] of counts) {
        byCategory[category] = count;
      }

      const total = Array.from(counts.values()).reduce((sum, c) => sum + c, 0);

      res.json({
        data: {
          total,
          by_category: byCategory,
          since: sinceDate.toISOString(),
        },
      });
    })
  );

  // ==========================================================================
  // POST /api/activity
  // Create a new activity event
  // Note: Most events are created by other services, but this endpoint
  // allows direct event creation for edge cases
  // ==========================================================================
  router.post(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const body = req.body as Partial<CreateActivityEventInput>;

      // Validate required fields
      if (!body.event_type) {
        throw new ValidationError('event_type is required');
      }
      if (!body.entity_type) {
        throw new ValidationError('entity_type is required');
      }
      if (!body.entity_id) {
        throw new ValidationError('entity_id is required');
      }

      // Build the event input
      // Auto-populate actor info from auth context if not provided
      const actorName = body.actor_name ||
        req.user.user_metadata?.full_name ||
        req.user.email ||
        'Unknown';

      const input: CreateActivityEventInput = {
        organization_id: req.organization.organization_id,
        event_type: body.event_type,
        summary: body.summary || `${body.event_type} on ${body.entity_type} ${body.entity_id}`,
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        actor_id: body.actor_id || req.user.id,
        actor_type: body.actor_type || 'team_member',
        actor_name: actorName,
        project_id: body.project_id,
        property_id: body.property_id,
        loop_iteration_id: body.loop_iteration_id,
        work_category_code: body.work_category_code,
        trade: body.trade,
        stage_code: body.stage_code,
        location_id: body.location_id,
        homeowner_visible: body.homeowner_visible,
        event_data: body.event_data,
        input_method: body.input_method || 'manual_entry',
        batch_id: body.batch_id,
      };

      const event = await activityService.createEvent(input);

      res.status(201).json({ data: event });
    })
  );

  // ==========================================================================
  // POST /api/activity/batch
  // Create multiple activity events in a batch
  // All events will share the same batch_id
  // ==========================================================================
  router.post(
    '/batch',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { events } = req.body as { events: Partial<CreateActivityEventInput>[] };

      if (!events || !Array.isArray(events) || events.length === 0) {
        throw new ValidationError('events array is required and must not be empty');
      }

      if (events.length > 100) {
        throw new ValidationError('Maximum 100 events per batch');
      }

      // Default actor name from auth context
      const defaultActorName =
        req.user.user_metadata?.full_name ||
        req.user.email ||
        'Unknown';

      // Build all event inputs
      const inputs: CreateActivityEventInput[] = events.map((body) => {
        if (!body.event_type || !body.entity_type || !body.entity_id) {
          throw new ValidationError(
            'Each event must have event_type, entity_type, and entity_id'
          );
        }

        return {
          organization_id: req.organization.organization_id,
          event_type: body.event_type,
          summary: body.summary || `${body.event_type} on ${body.entity_type} ${body.entity_id}`,
          entity_type: body.entity_type,
          entity_id: body.entity_id,
          actor_id: body.actor_id || req.user.id,
          actor_type: body.actor_type || 'team_member',
          actor_name: body.actor_name || defaultActorName,
          project_id: body.project_id,
          property_id: body.property_id,
          loop_iteration_id: body.loop_iteration_id,
          work_category_code: body.work_category_code,
          trade: body.trade,
          stage_code: body.stage_code,
          location_id: body.location_id,
          homeowner_visible: body.homeowner_visible,
          event_data: body.event_data,
          input_method: body.input_method || 'manual_entry',
        };
      });

      const createdEvents = await activityService.createBatch(inputs);

      res.status(201).json({
        data: createdEvents,
        batch_id: createdEvents[0]?.batch_id,
      });
    })
  );

  // ==========================================================================
  // Legacy routes for backward compatibility
  // These map to the new endpoints but maintain old URL structure
  // ==========================================================================

  // Legacy: GET /api/activity/by-project/:projectId
  router.get(
    '/by-project/:projectId',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const options = parseQueryOptions(req.query);

      const result = await activityService.getProjectActivity(
        req.params.projectId,
        options
      );

      res.json({
        data: result.events,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    })
  );

  // Legacy: GET /api/activity/by-property/:propertyId
  router.get(
    '/by-property/:propertyId',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const options = parseQueryOptions(req.query);

      const result = await activityService.getPropertyActivity(
        req.params.propertyId,
        false,
        options
      );

      res.json({
        data: result.events,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    })
  );

  // Legacy: GET /api/activity/summary/:projectId
  router.get(
    '/summary/:projectId',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const counts = await activityService.getEventCountByType(
        req.params.projectId,
        sinceDate
      );

      const byType: Record<string, number> = {};
      for (const [eventType, count] of counts) {
        byType[eventType] = count;
      }

      const total = Array.from(counts.values()).reduce((sum, c) => sum + c, 0);

      res.json({ data: { total, by_type: byType } });
    })
  );

  // Legacy: GET /api/activity (list all with filters)
  // This is the original endpoint with offset pagination
  // Kept for backward compatibility but will use cursor if provided
  router.get(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const options = parseQueryOptions(req.query);

      // Use getRecentActivity for org-wide queries
      const result = await activityService.getRecentActivity(
        req.organization.organization_id,
        options
      );

      res.json({
        data: result.events,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    })
  );

  return router;
}

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Parse query string parameters into ActivityQueryOptions
 */
function parseQueryOptions(query: Record<string, unknown>): ActivityQueryOptions {
  const options: ActivityQueryOptions = {};

  // Limit (default 20, max 100)
  if (query.limit) {
    const limit = parseInt(query.limit as string, 10);
    if (!isNaN(limit) && limit > 0) {
      options.limit = Math.min(limit, 100);
    }
  }

  // Cursor for pagination
  if (query.cursor && typeof query.cursor === 'string') {
    options.cursor = query.cursor;
  }

  // Event type filter (supports prefix like 'task.*')
  if (query.event_type && typeof query.event_type === 'string') {
    options.eventType = query.event_type;
  }
  // Also support 'eventType' casing
  if (query.eventType && typeof query.eventType === 'string') {
    options.eventType = query.eventType;
  }

  // Date range filters
  if (query.from) {
    const fromDate = new Date(query.from as string);
    if (!isNaN(fromDate.getTime())) {
      options.from = fromDate;
    }
  }

  if (query.to) {
    const toDate = new Date(query.to as string);
    if (!isNaN(toDate.getTime())) {
      options.to = toDate;
    }
  }

  return options;
}
