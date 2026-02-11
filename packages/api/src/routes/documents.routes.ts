/**
 * Documents Routes
 * CRUD operations for documents with portal sharing
 */

import { Router } from 'express';
import { z } from 'zod';
import type { OrgContextRequest } from '../middleware';
import { asyncHandler, NotFoundError } from '../middleware';
import type { ServiceContainer } from '../factories/service-factory';

const createDocumentSchema = z.object({
  project_id: z.string().uuid().optional(),
  property_id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  category: z.string(),
  storage_path: z.string(),
  file_type: z.string(),
  file_size: z.number().positive(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export function createDocumentsRouter(services: ServiceContainer): Router {
  const router = Router();
  const { supabase } = services;

  // List documents with filters
  router.get(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { project_id, property_id, category, shared_to_portal } = req.query;

      let query = supabase
        .from('documents')
        .select('*')
        .eq('organization_id', req.organization.organization_id)
        .order('created_at', { ascending: false });

      if (project_id) query = query.eq('project_id', project_id);
      if (property_id) query = query.eq('property_id', property_id);
      if (category) query = query.eq('category', category);
      if (shared_to_portal === 'true') query = query.eq('shared_to_portal', true);
      if (shared_to_portal === 'false') query = query.eq('shared_to_portal', false);

      const { data, error } = await query;
      if (error) throw error;

      res.json({ data });
    })
  );

  // Get single document
  router.get(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) throw new NotFoundError('Document', req.params.id);

      res.json({ data });
    })
  );

  // Create document record
  router.post(
    '/',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = createDocumentSchema.parse(req.body);

      const { data, error } = await supabase
        .from('documents')
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

  // Update document
  router.patch(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const input = updateDocumentSchema.parse(req.body);

      const { data: existing, error: fetchError } = await supabase
        .from('documents')
        .select('id')
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!existing) throw new NotFoundError('Document', req.params.id);

      const { data, error } = await supabase
        .from('documents')
        .update(input)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json({ data });
    })
  );

  // Delete document
  router.delete(
    '/:id',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', req.params.id)
        .eq('organization_id', req.organization.organization_id);

      if (error) throw error;
      res.status(204).send();
    })
  );

  // Share document to portal
  router.post(
    '/:id/share',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const document = await services.documentService.shareToPortal(
        req.params.id,
        req.user.id,
        services.propertyBridgeService
      );
      res.json({ data: document, message: 'Document shared to portal' });
    })
  );

  // Unshare document from portal
  router.post(
    '/:id/unshare',
    asyncHandler(async (req: OrgContextRequest, res) => {
      const document = await services.documentService.unshareFromPortal(req.params.id);
      res.json({ data: document, message: 'Document removed from portal' });
    })
  );

  return router;
}
