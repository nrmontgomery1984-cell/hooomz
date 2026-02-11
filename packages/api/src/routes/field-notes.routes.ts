/**
 * Field Notes Routes
 * CRUD operations for field notes with change order flagging
 */

import { Router } from 'express';
import { z } from 'zod';
import type { OrgContextRequest } from '../middleware';
import { asyncHandler, NotFoundError } from '../middleware';
import type { ServiceContainer } from '../factories/service-factory';

const createFieldNoteSchema = z.object({
  project_id: z.string().uuid(),
  property_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  work_category_code: z.string().optional(),
  note_type: z.enum(['observation', 'issue', 'client_request', 'material_delivery', 'weather', 'safety', 'general']),
  content: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

const updateFieldNoteSchema = z.object({
  content: z.string().min(1).optional(),
  note_type: z.enum(['observation', 'issue', 'client_request', 'material_delivery', 'weather', 'safety', 'general']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  resolved: z.boolean().optional(),
  resolved_at: z.string().optional(),
  resolved_by: z.string().uuid().optional(),
});

export function createFieldNotesRouter(services: ServiceContainer): Router {
  const router = Router();
  const { supabase, fieldNoteService } = services;

  // List field notes with filters
  router.get(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const {
        project_id,
        property_id,
        task_id,
        location_id,
        work_category_code,
        note_type,
        flagged_for_change_order,
        resolved,
      } = req.query;

      let query = supabase
        .from('field_notes')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .order('created_at', { ascending: false });

      if (project_id) query = query.eq('project_id', project_id);
      if (property_id) query = query.eq('property_id', property_id);
      if (task_id) query = query.eq('task_id', task_id);
      if (location_id) query = query.eq('location_id', location_id);
      if (work_category_code) query = query.eq('work_category_code', work_category_code);
      if (note_type) query = query.eq('note_type', note_type);
      if (flagged_for_change_order === 'true') query = query.eq('flagged_for_change_order', true);
      if (flagged_for_change_order === 'false') query = query.eq('flagged_for_change_order', false);
      if (resolved === 'true') query = query.eq('resolved', true);
      if (resolved === 'false') query = query.eq('resolved', false);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ data });
    })
  );

  // Get notes by project
  router.get(
    '/by-project/:projectId',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const notes = await fieldNoteService.listByProject(req.params.projectId);
      res.json({ data: notes });
    })
  );

  // Get notes flagged for change order
  router.get(
    '/change-order-flagged',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { project_id } = req.query;

      let query = supabase
        .from('field_notes')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .eq('flagged_for_change_order', true)
        .order('created_at', { ascending: false });

      if (project_id) query = query.eq('project_id', project_id);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ data });
    })
  );

  // Get unresolved issues
  router.get(
    '/unresolved',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { project_id } = req.query;

      let query = supabase
        .from('field_notes')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (project_id) query = query.eq('project_id', project_id);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ data });
    })
  );

  // Get single field note
  router.get(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('field_notes')
        .select('*')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Field note', req.params.id);

      res.json({ data });
    })
  );

  // Create field note
  router.post(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = createFieldNoteSchema.parse(req.body);

      const note = await fieldNoteService.createNote(
        {
          ...input,
          organization_id: req.organization.organization_id,
          created_by: req.user.id,
        },
        req.user.id
      );

      res.status(201).json({ data: note });
    })
  );

  // Update field note
  router.patch(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = updateFieldNoteSchema.parse(req.body);

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('field_notes')
        .select('id')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!existing) throw new NotFoundError('Field note', req.params.id);

      const note = await fieldNoteService.updateNote(req.params.id, input);
      res.json({ data: note });
    })
  );

  // Delete field note
  router.delete(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('field_notes')
        .select('id')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!existing) throw new NotFoundError('Field note', req.params.id);

      await fieldNoteService.deleteNote(req.params.id);
      res.status(204).send();
    })
  );

  // === Workflow endpoints ===

  // Flag for change order
  router.post(
    '/:id/flag-change-order',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const note = await fieldNoteService.flagForChangeOrder(req.params.id, req.user.id);
      res.json({ data: note, message: 'Flagged for change order' });
    })
  );

  // Unflag from change order
  router.post(
    '/:id/unflag-change-order',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const note = await fieldNoteService.unflagFromChangeOrder(req.params.id);
      res.json({ data: note, message: 'Removed change order flag' });
    })
  );

  // Mark as resolved
  router.post(
    '/:id/resolve',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('field_notes')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: req.user.id,
        })
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data, message: 'Field note resolved' });
    })
  );

  // Reopen resolved note
  router.post(
    '/:id/reopen',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('field_notes')
        .update({
          resolved: false,
          resolved_at: null,
          resolved_by: null,
        })
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data, message: 'Field note reopened' });
    })
  );

  return router;
}
