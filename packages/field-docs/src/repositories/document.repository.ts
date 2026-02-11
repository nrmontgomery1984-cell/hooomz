/**
 * Document Repository
 * Data access layer for documents table
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Document,
  CreateDocument,
  UpdateDocument,
  DocumentFilters,
  DocumentVersion,
} from '../types';

export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  findByProject(projectId: string): Promise<Document[]>;
  findByProperty(propertyId: string): Promise<Document[]>;
  findByOrganization(organizationId: string): Promise<Document[]>;
  findByFilters(filters: DocumentFilters): Promise<Document[]>;
  create(data: CreateDocument): Promise<Document>;
  update(id: string, data: UpdateDocument): Promise<Document>;
  delete(id: string): Promise<void>;
  shareToPortal(id: string): Promise<Document>;
  unshareFromPortal(id: string): Promise<Document>;
  findSharedByProperty(propertyId: string): Promise<Document[]>;
  findVersionHistory(documentId: string): Promise<DocumentVersion[]>;
  createNewVersion(originalId: string, data: CreateDocument): Promise<Document>;
}

export class DocumentRepository implements IDocumentRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Document | null> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async findByProject(projectId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByProperty(propertyId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByOrganization(organizationId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByFilters(filters: DocumentFilters): Promise<Document[]> {
    let query = this.supabase.from('documents').select('*');

    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters.property_id) {
      query = query.eq('property_id', filters.property_id);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.uploaded_by) {
      query = query.eq('uploaded_by', filters.uploaded_by);
    }
    if (filters.shared_to_portal !== undefined) {
      query = query.eq('shared_to_portal', filters.shared_to_portal);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(data: CreateDocument): Promise<Document> {
    const { data: document, error } = await this.supabase
      .from('documents')
      .insert({
        organization_id: data.organization_id,
        project_id: data.project_id || null,
        property_id: data.property_id || null,
        name: data.name,
        category: data.category,
        storage_path: data.storage_path,
        file_type: data.file_type,
        file_size: data.file_size,
        description: data.description || null,
        tags: data.tags || [],
        uploaded_by: data.uploaded_by,
      })
      .select()
      .single();

    if (error) throw error;
    return document;
  }

  async update(id: string, data: UpdateDocument): Promise<Document> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.shared_to_portal !== undefined) {
      updateData.shared_to_portal = data.shared_to_portal;
      if (data.shared_to_portal) {
        updateData.shared_at = new Date().toISOString();
      }
    }

    const { data: document, error } = await this.supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return document;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async shareToPortal(id: string): Promise<Document> {
    return this.update(id, { shared_to_portal: true });
  }

  async unshareFromPortal(id: string): Promise<Document> {
    const { data: document, error } = await this.supabase
      .from('documents')
      .update({
        shared_to_portal: false,
        shared_at: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return document;
  }

  async findSharedByProperty(propertyId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('property_id', propertyId)
      .eq('shared_to_portal', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findVersionHistory(documentId: string): Promise<DocumentVersion[]> {
    // Get current document first
    const current = await this.findById(documentId);
    if (!current) return [];

    const versions: DocumentVersion[] = [];
    let currentDoc: Document | null = current;

    // Walk the version chain
    while (currentDoc) {
      versions.push({
        id: currentDoc.id,
        version: currentDoc.version,
        created_at: currentDoc.created_at,
        uploaded_by: currentDoc.uploaded_by,
      });

      if (currentDoc.previous_version_id) {
        currentDoc = await this.findById(currentDoc.previous_version_id);
      } else {
        currentDoc = null;
      }
    }

    return versions;
  }

  async createNewVersion(originalId: string, data: CreateDocument): Promise<Document> {
    // Get the original document
    const original = await this.findById(originalId);
    if (!original) {
      throw new Error(`Document ${originalId} not found`);
    }

    // Create new version with incremented version number
    const { data: document, error } = await this.supabase
      .from('documents')
      .insert({
        organization_id: data.organization_id,
        project_id: data.project_id || original.project_id,
        property_id: data.property_id || original.property_id,
        name: data.name,
        category: data.category,
        storage_path: data.storage_path,
        file_type: data.file_type,
        file_size: data.file_size,
        description: data.description || original.description,
        tags: data.tags || original.tags,
        uploaded_by: data.uploaded_by,
        version: original.version + 1,
        previous_version_id: original.id,
      })
      .select()
      .single();

    if (error) throw error;
    return document;
  }
}
