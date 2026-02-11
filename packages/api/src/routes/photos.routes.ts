/**
 * Photos Routes
 * CRUD operations for photos with portal sharing
 */

import { Router } from 'express';
import { z } from 'zod';
import type { OrgContextRequest } from '../middleware';
import { asyncHandler, NotFoundError } from '../middleware';
import type { ServiceContainer } from '../factories/service-factory';

const createPhotoSchema = z.object({
  project_id: z.string().uuid(),
  property_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  inspection_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  work_category_code: z.string().optional(),
  storage_path: z.string(),
  caption: z.string().optional(),
  photo_type: z.enum(['progress', 'before', 'after', 'issue', 'inspection', 'completion', 'general']).optional(),
  taken_at: z.string().optional(),
});

const updatePhotoSchema = z.object({
  caption: z.string().nullable().optional(),
  photo_type: z.enum(['progress', 'before', 'after', 'issue', 'inspection', 'completion', 'general']).optional(),
  location_id: z.string().uuid().nullable().optional(),
  work_category_code: z.string().nullable().optional(),
});

export function createPhotosRouter(services: ServiceContainer): Router {
  const router = Router();
  const { supabase } = services;

  // List photos with filters
  router.get(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const {
        project_id,
        property_id,
        task_id,
        inspection_id,
        location_id,
        photo_type,
        shared_to_portal,
      } = req.query;

      let query = supabase
        .from('photos')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .order('created_at', { ascending: false });

      if (project_id) query = query.eq('project_id', project_id);
      if (property_id) query = query.eq('property_id', property_id);
      if (task_id) query = query.eq('task_id', task_id);
      if (inspection_id) query = query.eq('inspection_id', inspection_id);
      if (location_id) query = query.eq('location_id', location_id);
      if (photo_type) query = query.eq('photo_type', photo_type);
      if (shared_to_portal === 'true') query = query.eq('shared_to_portal', true);
      if (shared_to_portal === 'false') query = query.eq('shared_to_portal', false);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ data });
    })
  );

  // Get single photo
  router.get(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Photo', req.params.id);

      res.json({ data });
    })
  );

  // Create photo record
  router.post(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = createPhotoSchema.parse(req.body);

      const { data, error } = await supabase
        .from('photos')
        .insert({
          ...input,
          organization_id: req.organization.organization_id,
          uploaded_by: req.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ data });
    })
  );

  // Update photo
  router.patch(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = updatePhotoSchema.parse(req.body);

      const { data: existing, error: fetchError } = await supabase
        .from('photos')
        .select('id')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!existing) throw new NotFoundError('Photo', req.params.id);

      const { data, error } = await supabase
        .from('photos')
        .update(input)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data });
    })
  );

  // Delete photo
  router.delete(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id);

      if (error) throw error;
      res.status(204).send();
    })
  );

  // Share photo to portal
  router.post(
    '/:id/share',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('photos')
        .update({ shared_to_portal: true })
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data, message: 'Photo shared to portal' });
    })
  );

  // Unshare photo from portal
  router.post(
    '/:id/unshare',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('photos')
        .update({ shared_to_portal: false })
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data, message: 'Photo removed from portal' });
    })
  );

  return router;
}
