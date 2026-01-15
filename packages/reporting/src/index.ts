/**
 * @hooomz/reporting - Dashboards and reporting module
 *
 * This module provides:
 * - Dashboard views (owner, project, crew, financial)
 * - Report generation (project, estimate, inspection, variance)
 * - Export functionality (PDF, CSV, Email)
 * - Business metrics calculations
 */

// Export dashboard services
export * from './dashboards';

// Export report services
export * from './reports';

// Export export services
export * from './exports';

// Export metrics calculations
export * from './metrics';

// Export all types
export * from './types';
