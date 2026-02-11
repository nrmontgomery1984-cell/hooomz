/**
 * Mock Routes for Local Development
 *
 * Provides mock API endpoints that work without a database.
 * Supports adding new activity events for testing.
 */

import { Router } from 'express';
import { mockActivityStore, MOCK_PROJECT } from './mockData';

export function createMockActivityRouter(): Router {
  const router = Router();

  // ==========================================================================
  // GET /api/activity/recent
  // ==========================================================================
  router.get('/recent', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const eventType = req.query.event_type as string | undefined;

    const result = mockActivityStore.getRecent({ limit, cursor, eventType });

    res.json({
      data: result.events,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  });

  // ==========================================================================
  // GET /api/activity/project/:projectId
  // ==========================================================================
  router.get('/project/:projectId', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const result = mockActivityStore.getByProject(req.params.projectId, { limit, cursor });

    res.json({
      data: result.events,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  });

  // ==========================================================================
  // GET /api/activity/property/:propertyId
  // ==========================================================================
  router.get('/property/:propertyId', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const homeownerOnly = req.query.homeowner === 'true';

    const result = mockActivityStore.getRecent({ limit, cursor, homeownerOnly });

    res.json({
      data: result.events,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  });

  // ==========================================================================
  // GET /api/activity/portal/:propertyId (homeowner only)
  // ==========================================================================
  router.get('/portal/:propertyId', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const result = mockActivityStore.getRecent({ limit, cursor, homeownerOnly: true });

    res.json({
      data: result.events,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  });

  // ==========================================================================
  // GET /api/activity/counts/:projectId
  // ==========================================================================
  router.get('/counts/:projectId', (_req, res) => {
    const counts = mockActivityStore.getCountsByType();
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

    res.json({
      data: {
        total,
        by_type: counts,
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  });

  // ==========================================================================
  // POST /api/activity
  // Create a new activity event
  // ==========================================================================
  router.post('/', (req, res): void => {
    const body = req.body;

    // Basic validation
    if (!body.event_type) {
      res.status(400).json({ error: 'event_type is required' });
      return;
    }
    if (!body.entity_type) {
      res.status(400).json({ error: 'entity_type is required' });
      return;
    }
    if (!body.entity_id) {
      res.status(400).json({ error: 'entity_id is required' });
      return;
    }

    const event = mockActivityStore.create({
      ...body,
      project_id: body.project_id || MOCK_PROJECT.id,
      actor_name: body.actor_name || 'Test User',
    });

    res.status(201).json({ data: event });
  });

  // ==========================================================================
  // POST /api/activity/batch
  // Create multiple events
  // ==========================================================================
  router.post('/batch', (req, res): void => {
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      res.status(400).json({ error: 'events array is required' });
      return;
    }

    const batchId = `batch-${Date.now()}`;
    const created = events.map(e => mockActivityStore.create({ ...e, batch_id: batchId }));

    res.status(201).json({
      data: created,
      batch_id: batchId,
    });
  });

  // ==========================================================================
  // Legacy routes
  // ==========================================================================
  router.get('/by-project/:projectId', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const result = mockActivityStore.getByProject(req.params.projectId, { limit, cursor });
    res.json({ data: result.events, pagination: { nextCursor: result.nextCursor, hasMore: result.hasMore } });
  });

  router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const result = mockActivityStore.getRecent({ limit, cursor });
    res.json({ data: result.events, pagination: { nextCursor: result.nextCursor, hasMore: result.hasMore } });
  });

  return router;
}

/**
 * Create mock projects router
 */
export function createMockProjectsRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({
      data: [MOCK_PROJECT],
    });
  });

  router.get('/:id', (req, res) => {
    if (req.params.id === MOCK_PROJECT.id) {
      res.json({ data: MOCK_PROJECT });
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  });

  return router;
}
