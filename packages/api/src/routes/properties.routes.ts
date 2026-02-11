/**
 * Properties Routes
 * CRUD operations for properties
 */

import { Router } from 'express';
import { z } from 'zod';
import type { OrgContextRequest } from '../middleware';
import { asyncHandler, NotFoundError } from '../middleware';
import type { ServiceContainer } from '../factories/service-factory';

const createPropertySchema = z.object({
  customer_id: z.string().uuid(),
  address_line1: z.string(),
  address_line2: z.string().optional(),
  city: z.string(),
  province: z.string(),
  postal_code: z.string(),
  property_type: z.string().optional(),
  year_built: z.number().int().positive().optional(),
  square_footage: z.number().positive().optional(),
});

const updatePropertySchema = z.object({
  address_line1: z.string().optional(),
  address_line2: z.string().nullable().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  property_type: z.string().nullable().optional(),
  year_built: z.number().int().positive().nullable().optional(),
  square_footage: z.number().positive().nullable().optional(),
});

export function createPropertiesRouter(services: ServiceContainer): Router {
  const router = Router();
  const { supabase } = services;

  // List properties
  router.get(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { customer_id, search } = req.query;

      let query = supabase
        .from('properties')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .order('created_at', { ascending: false });

      if (customer_id) query = query.eq('customer_id', customer_id);
      if (search) query = query.ilike('address_line1', `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ data });
    })
  );

  // Get single property
  router.get(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Property', req.params.id);

      res.json({ data });
    })
  );

  // Get property with projects history
  router.get(
    '/:id/with-projects',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, projects(*)')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Property', req.params.id);

      res.json({ data });
    })
  );

  // Get property locations (rooms/areas)
  router.get(
    '/:id/locations',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('property_locations')
        .select('*')
        .eq('property_id', req.params.id)
        .order('name');

      if (error) throw error;
      res.json({ data });
    })
  );

  // Get homeowner manuals for property
  router.get(
    '/:id/manuals',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const manuals = await services.completionService.getManualsForProperty(req.params.id);
      res.json({ data: manuals });
    })
  );

  // Create property
  router.post(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = createPropertySchema.parse(req.body);

      const { data, error } = await supabase
        .from('properties')
        .insert({
          ...input,
          organization_id: req.organization.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ data });
    })
  );

  // Update property
  router.patch(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = updatePropertySchema.parse(req.body);

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!existing) throw new NotFoundError('Property', req.params.id);

      const { data, error } = await supabase
        .from('properties')
        .update(input)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data });
    })
  );

  // Delete property
  router.delete(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id);

      if (error) throw error;
      res.status(204).send();
    })
  );

  // === Location management ===

  // Create location
  router.post(
    '/:id/locations',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { name, location_type, floor, parent_id } = req.body;

      const { data, error } = await supabase
        .from('property_locations')
        .insert({
          property_id: req.params.id,
          name,
          location_type,
          floor,
          parent_id,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ data });
    })
  );

  return router;
}
