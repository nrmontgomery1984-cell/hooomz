/**
 * Auth Middleware
 * Validates JWT tokens via Supabase and attaches user to request
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user: User;
  supabase: SupabaseClient;
}

export function createAuthMiddleware(supabaseAdmin: SupabaseClient): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      // Attach user and supabase client to request
      (req as AuthenticatedRequest).user = user;
      (req as AuthenticatedRequest).supabase = supabaseAdmin;

      next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

// Optional auth - doesn't fail if no token, but attaches user if present
export function createOptionalAuthMiddleware(supabaseAdmin: SupabaseClient): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);

        if (user) {
          (req as AuthenticatedRequest).user = user;
          (req as AuthenticatedRequest).supabase = supabaseAdmin;
        }
      } catch {
        // Ignore errors for optional auth
      }
    }

    next();
  };
}
