/**
 * Express Application Setup
 * Configures middleware and routes
 */

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createAuthMiddleware,
  createOrgContextMiddleware,
  errorHandler,
  notFoundHandler,
} from './middleware';

import {
  createProjectsRouter,
  createCustomersRouter,
  createPropertiesRouter,
  createPhotosRouter,
  createDocumentsRouter,
  createInspectionsRouter,
  createFieldNotesRouter,
  createActivityRouter,
} from './routes';

import { createServiceContainer } from './factories';

export function createApp(supabase: SupabaseClient): Express {
  const app = express();

  // Create service container
  const services = createServiceContainer(supabase);

  // Global middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('combined'));

  // Health check (no auth required)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth middleware for all /api routes
  const authMiddleware = createAuthMiddleware(supabase);
  const orgContextMiddleware = createOrgContextMiddleware();

  // API routes (auth + org context required)
  const apiRouter = express.Router();
  apiRouter.use(authMiddleware);
  apiRouter.use(orgContextMiddleware);

  // Mount route handlers
  apiRouter.use('/projects', createProjectsRouter(services));
  apiRouter.use('/customers', createCustomersRouter(services));
  apiRouter.use('/properties', createPropertiesRouter(services));
  apiRouter.use('/photos', createPhotosRouter(services));
  apiRouter.use('/documents', createDocumentsRouter(services));
  apiRouter.use('/inspections', createInspectionsRouter(services));
  apiRouter.use('/field-notes', createFieldNotesRouter(services));
  apiRouter.use('/activity', createActivityRouter(services));

  app.use('/api', apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
