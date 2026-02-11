/**
 * Projects Routes
 * CRUD operations for projects with lifecycle management
 */

import { Router } from 'express';
import { z } from 'zod';
import type { OrgContextRequest } from '../middleware';
import { asyncHandler, NotFoundError } from '../middleware';
import type { ServiceContainer } from '../factories/service-factory';

// Validation schemas
const createProjectSchema = z.object({
  property_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  project_type: z.string().optional(),
  start_date: z.string().optional(),
  target_end_date: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['lead', 'quoted', 'approved', 'in_progress', 'on_hold', 'complete', 'cancelled']).optional(),
  start_date: z.string().optional(),
  target_end_date: z.string().optional(),
  actual_end_date: z.string().optional(),
});

export function createProjectsRouter(services: ServiceContainer): Router {
  const router = Router();
  const { supabase } = services;

  // List projects for organization
  router.get(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { status, customer_id, property_id } = req.query;

      let query = supabase
        .from('projects')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (customer_id) query = query.eq('customer_id', customer_id);
      if (property_id) query = query.eq('property_id', property_id);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ data });
    })
  );

  // Get single project
  router.get(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Project', req.params.id);

      res.json({ data });
    })
  );

  // Get project with relations
  router.get(
    '/:id/details',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          property:properties(id, address_line1, city, province),
          customer:customers(id, first_name, last_name, email)
        `)
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Project', req.params.id);

      res.json({ data });
    })
  );

  // Create project
  router.post(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = createProjectSchema.parse(req.body);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...input,
          organization_id: req.organization.organization_id,
          status: 'lead',
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ data });
    })
  );

  // Update project
  router.patch(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = updateProjectSchema.parse(req.body);

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!existing) throw new NotFoundError('Project', req.params.id);

      const { data, error } = await supabase
        .from('projects')
        .update(input)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data });
    })
  );

  // Delete project
  router.delete(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id);

      if (error) throw error;
      res.status(204).send();
    })
  );

  // === Lifecycle endpoints ===

  // Get project summary
  router.get(
    '/:id/summary',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const summary = await services.lifecycleService.getProjectSummary(req.params.id);
      res.json({ data: summary });
    })
  );

  // Check if project can be completed
  router.get(
    '/:id/can-complete',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const result = await services.completionService.canComplete(req.params.id);
      res.json({ data: result });
    })
  );

  // Get completion checklist
  router.get(
    '/:id/completion-checklist',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const checklist = await services.completionService.getChecklist(req.params.id);
      res.json({ data: checklist });
    })
  );

  // Update completion checklist item
  router.patch(
    '/:id/completion-checklist',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { item, value } = req.body;
      const checklist = await services.completionService.updateChecklistItem(
        req.params.id,
        item,
        value
      );
      res.json({ data: checklist });
    })
  );

  // Complete final walkthrough
  router.post(
    '/:id/final-walkthrough',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { date } = req.body;
      const checklist = await services.completionService.completeFinalWalkthrough(
        req.params.id,
        date
      );
      res.json({ data: checklist });
    })
  );

  // Complete project (full handoff flow)
  router.post(
    '/:id/complete',
    asyncHandler(async (req: OrgContextRequest, res) => {
      await services.completionService.completeProject(
        req.params.id,
        req.user.id,
        services.activityLogger
      );
      res.json({ message: 'Project completed successfully' });
    })
  );

  // Get homeowner manual
  router.get(
    '/:id/manual',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const manual = await services.completionService.getManual(req.params.id);
      res.json({ data: manual });
    })
  );

  // === Loop endpoints ===

  // List loops for project
  router.get(
    '/:id/loops',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('loop_contexts')
        .select('*')
        .eq('project_id', req.params.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ data });
    })
  );

  return router;
}
