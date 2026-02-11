/**
 * Inspections Routes
 * CRUD and workflow operations for inspections
 */

import { Router } from 'express';
import { z } from 'zod';
import type { OrgContextRequest } from '../middleware';
import { asyncHandler, NotFoundError } from '../middleware';
import type { ServiceContainer } from '../factories/service-factory';

const createInspectionSchema = z.object({
  project_id: z.string().uuid(),
  property_id: z.string().uuid(),
  inspection_type: z.string(),
  scheduled_date: z.string(),
  inspector_name: z.string().optional(),
  inspector_phone: z.string().optional(),
  location_id: z.string().uuid().optional(),
  work_category_code: z.string().optional(),
  notes: z.string().optional(),
});

const updateInspectionSchema = z.object({
  inspection_type: z.string().optional(),
  scheduled_date: z.string().optional(),
  inspector_name: z.string().nullable().optional(),
  inspector_phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export function createInspectionsRouter(services: ServiceContainer): Router {
  const router = Router();
  const { supabase } = services;

  // List inspections with filters
  router.get(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { project_id, property_id, status, result } = req.query;

      let query = supabase
        .from('inspections')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .order('scheduled_date', { ascending: true });

      if (project_id) query = query.eq('project_id', project_id);
      if (property_id) query = query.eq('property_id', property_id);
      if (status) query = query.eq('status', status);
      if (result) query = query.eq('result', result);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ data });
    })
  );

  // Get upcoming inspections
  router.get(
    '/upcoming',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const days = parseInt(req.query.days as string) || 7;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .eq('status', 'scheduled')
        .lte('scheduled_date', futureDate.toISOString())
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      res.json({ data });
    })
  );

  // Get single inspection
  router.get(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Inspection', req.params.id);

      res.json({ data });
    })
  );

  // Create inspection
  router.post(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = createInspectionSchema.parse(req.body);

      const { data, error } = await supabase
        .from('inspections')
        .insert({
          ...input,
          organization_id: req.organization.organization_id,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ data });
    })
  );

  // Update inspection
  router.patch(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = updateInspectionSchema.parse(req.body);

      const { data: existing, error: fetchError } = await supabase
        .from('inspections')
        .select('id')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!existing) throw new NotFoundError('Inspection', req.params.id);

      const { data, error } = await supabase
        .from('inspections')
        .update(input)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data });
    })
  );

  // Delete inspection
  router.delete(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id);

      if (error) throw error;
      res.status(204).send();
    })
  );

  // Record inspection result
  router.post(
    '/:id/result',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { result, result_notes, corrections_required, reinspection_date } = req.body;

      const { data, error } = await supabase
        .from('inspections')
        .update({
          status: 'completed',
          result,
          result_notes,
          corrections_required,
          reinspection_date,
          completed_at: new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data });
    })
  );

  // Cancel inspection
  router.post(
    '/:id/cancel',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { reason } = req.body;

      const { data, error } = await supabase
        .from('inspections')
        .update({
          status: 'cancelled',
          result: 'cancelled',
          result_notes: reason,
        })
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data });
    })
  );

  return router;
}
