// Main exports for the API package
export { createApp } from './app';
export { createServiceContainer } from './factories';
export type { ServiceContainer } from './factories';

// Middleware exports
export {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
  createOrgContextMiddleware,
  requirePermission,
  requireRole,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from './middleware';

export type {
  AuthenticatedRequest,
  OrganizationMembership,
  OrgContextRequest,
} from './middleware';

// Service exports
export {
  ActivityService,
  SYSTEM_USER,
  createActivityLogger,
} from './services';
export type { ActivityLogger } from './services';
