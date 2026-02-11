/**
 * Customers Routes
 * CRUD operations for customers and portal management
 */

import { Router } from 'express';
import { z } from 'zod';
import type { OrgContextRequest } from '../middleware';
import { asyncHandler, NotFoundError } from '../middleware';
import type { ServiceContainer } from '../factories/service-factory';

const createCustomerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateCustomerSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export function createCustomersRouter(services: ServiceContainer): Router {
  const router = Router();
  const { supabase } = services;

  // List customers
  router.get(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { search, has_portal_access } = req.query;

      let query = supabase
        .from('customers')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .order('last_name', { ascending: true });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (has_portal_access === 'true') query = query.eq('portal_access', true);
      if (has_portal_access === 'false') query = query.eq('portal_access', false);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ data });
    })
  );

  // Get single customer
  router.get(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Customer', req.params.id);

      res.json({ data });
    })
  );

  // Get customer with projects
  router.get(
    '/:id/with-projects',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          projects(id, name, status, created_at),
          properties(id, address_line1, city)
        `)
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Customer', req.params.id);

      res.json({ data });
    })
  );

  // Create customer
  router.post(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = createCustomerSchema.parse(req.body);

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...input,
          organization_id: req.organization.organization_id,
          tags: input.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ data });
    })
  );

  // Update customer
  router.patch(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = updateCustomerSchema.parse(req.body);

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!existing) throw new NotFoundError('Customer', req.params.id);

      const { data, error } = await supabase
        .from('customers')
        .update(input)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data });
    })
  );

  // Delete customer
  router.delete(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id);

      if (error) throw error;
      res.status(204).send();
    })
  );

  // === Portal management ===

  // Invite customer to portal
  router.post(
    '/:id/portal/invite',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { project_id, property_id } = req.body;

      const customer = await services.portalService.inviteToPortal(
        req.params.id,
        req.user.id,
        req.organization.organization_id,
        project_id,
        property_id
      );

      res.json({ data: customer, message: 'Portal invite sent' });
    })
  );

  // Revoke portal access
  router.post(
    '/:id/portal/revoke',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const customer = await services.portalService.revokePortalAccess(req.params.id);
      res.json({ data: customer, message: 'Portal access revoked' });
    })
  );

  // Check portal access
  router.get(
    '/:id/portal/status',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const hasAccess = await services.portalService.checkPortalAccess(req.params.id);
      res.json({ data: { has_access: hasAccess } });
    })
  );

  return router;
}
