/**
 * Server Entry Point
 * Initializes Supabase and starts the Express server
 *
 * MOCK MODE: If SUPABASE_URL contains 'placeholder', the server runs in mock mode
 * with in-memory data storage. Perfect for testing without a database.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createClient } from '@supabase/supabase-js';
import { createApp } from './app';
import { createMockActivityRouter, createMockProjectsRouter } from './mock/mockRoutes';

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const PORT = parseInt(process.env.PORT || '3001', 10);

// Check if we should run in mock mode
const isMockMode = SUPABASE_URL.includes('placeholder') || !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

if (isMockMode) {
  // ==========================================================================
  // MOCK MODE - No database required
  // ==========================================================================
  console.log('⚠️  Running in MOCK MODE (no database connection)');
  console.log('   Activity events are stored in memory only.');
  console.log('   Set real SUPABASE_URL and SUPABASE_SERVICE_KEY to use database.\n');

  const app = express();

  // Global middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('dev')); // Use 'dev' format for cleaner output in mock mode

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode: 'mock', timestamp: new Date().toISOString() });
  });

  // Mock API routes (no auth required in mock mode)
  app.use('/api/activity', createMockActivityRouter());
  app.use('/api/projects', createMockProjectsRouter());

  // Catch-all for other API routes
  app.use('/api/*', (_req, res) => {
    res.status(501).json({
      error: 'Not implemented in mock mode',
      message: 'This endpoint requires a real database connection',
    });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Hooomz API server running on port ${PORT} (MOCK MODE)`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API base: http://localhost:${PORT}/api`);
    console.log(`\n📋 Available mock endpoints:`);
    console.log(`   GET  /api/activity/recent     - List recent activity`);
    console.log(`   GET  /api/activity/project/:id - Project activity`);
    console.log(`   POST /api/activity            - Create new event`);
    console.log(`   GET  /api/projects            - List projects`);
  });

} else {
  // ==========================================================================
  // PRODUCTION MODE - Real database connection
  // ==========================================================================

  // Initialize Supabase admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Create and start app
  const app = createApp(supabase);

  app.listen(PORT, () => {
    console.log(`🚀 Hooomz API server running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API base: http://localhost:${PORT}/api`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
