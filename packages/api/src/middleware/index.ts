export { createAuthMiddleware, createOptionalAuthMiddleware } from './auth.middleware';
export type { AuthenticatedRequest } from './auth.middleware';

export {
  createOrgContextMiddleware,
  requirePermission,
  requireRole,
} from './org-context.middleware';
export type { OrganizationMembership, OrgContextRequest } from './org-context.middleware';

export {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from './error-handler.middleware';
