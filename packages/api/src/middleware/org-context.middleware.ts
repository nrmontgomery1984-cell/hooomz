/**
 * Organization Context Middleware
 * Loads user's organization membership and attaches to request
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from './auth.middleware';

export interface OrganizationMembership {
  organization_id: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
}

export interface OrgContextRequest extends AuthenticatedRequest {
  organization: OrganizationMembership;
}

export function createOrgContextMiddleware(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const orgId = req.headers['x-organization-id'] as string | undefined;

    if (!orgId) {
      res.status(400).json({ error: 'Missing X-Organization-ID header' });
      return;
    }

    try {
      // Query user's membership in this organization
      const { data: membership, error } = await authReq.supabase
        .from('organization_members')
        .select('organization_id, role, permissions')
        .eq('organization_id', orgId)
        .eq('user_id', authReq.user.id)
        .single();

      if (error || !membership) {
        res.status(403).json({ error: 'Not a member of this organization' });
        return;
      }

      (req as OrgContextRequest).organization = {
        organization_id: membership.organization_id,
        role: membership.role,
        permissions: membership.permissions || [],
      };

      next();
    } catch (err) {
      console.error('Org context middleware error:', err);
      res.status(500).json({ error: 'Failed to load organization context' });
    }
  };
}

// Permission check middleware factory
export function requirePermission(permission: string) {
  return (req: OrgContextRequest, res: Response, next: NextFunction): void => {
    const { organization } = req;

    // Owners and admins have all permissions
    if (organization.role === 'owner' || organization.role === 'admin') {
      next();
      return;
    }

    // Check specific permission
    if (organization.permissions.includes(permission)) {
      next();
      return;
    }

    res.status(403).json({ error: `Missing required permission: ${permission}` });
  };
}

// Role check middleware factory
export function requireRole(...roles: Array<'owner' | 'admin' | 'member'>) {
  return (req: OrgContextRequest, res: Response, next: NextFunction): void => {
    if (roles.includes(req.organization.role)) {
      next();
      return;
    }

    res.status(403).json({ error: `Required role: ${roles.join(' or ')}` });
  };
}
