/**
 * Photo Repository
 * Data access layer for photos table
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Photo,
  CreatePhoto,
  UpdatePhoto,
  PhotoFilters,
} from '../types';

export interface IPhotoRepository {
  findById(id: string): Promise<Photo | null>;
  findByProject(projectId: string): Promise<Photo[]>;
  findByProperty(propertyId: string): Promise<Photo[]>;
  findByFilters(filters: PhotoFilters): Promise<Photo[]>;
  create(data: CreatePhoto): Promise<Photo>;
  update(id: string, data: UpdatePhoto): Promise<Photo>;
  delete(id: string): Promise<void>;
  shareToPortal(id: string): Promise<Photo>;
  unshareFromPortal(id: string): Promise<Photo>;
  findSharedByProperty(propertyId: string): Promise<Photo[]>;
}

export class PhotoRepository implements IPhotoRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Photo | null> {
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async findByProject(projectId: string): Promise<Photo[]> {
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .eq('project_id', projectId)
      .order('taken_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByProperty(propertyId: string): Promise<Photo[]> {
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .eq('property_id', propertyId)
      .order('taken_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByFilters(filters: PhotoFilters): Promise<Photo[]> {
    let query = this.supabase.from('photos').select('*');

    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters.property_id) {
      query = query.eq('property_id', filters.property_id);
    }
    if (filters.location_id) {
      query = query.eq('location_id', filters.location_id);
    }
    if (filters.work_category_code) {
      query = query.eq('work_category_code', filters.work_category_code);
    }
    if (filters.task_instance_id) {
      query = query.eq('task_instance_id', filters.task_instance_id);
    }
    if (filters.shared_to_portal !== undefined) {
      query = query.eq('shared_to_portal', filters.shared_to_portal);
    }
    if (filters.uploaded_by) {
      query = query.eq('uploaded_by', filters.uploaded_by);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.date_from) {
      query = query.gte('taken_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('taken_at', filters.date_to);
    }

    const { data, error } = await query.order('taken_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(data: CreatePhoto): Promise<Photo> {
    const { data: photo, error } = await this.supabase
      .from('photos')
      .insert({
        organization_id: data.organization_id,
        project_id: data.project_id,
        property_id: data.property_id,
        location_id: data.location_id || null,
        work_category_code: data.work_category_code || null,
        task_instance_id: data.task_instance_id || null,
        storage_path: data.storage_path,
        thumbnail_path: data.thumbnail_path || null,
        caption: data.caption || null,
        tags: data.tags || [],
        taken_at: data.taken_at || new Date().toISOString(),
        uploaded_by: data.uploaded_by,
      })
      .select()
      .single();

    if (error) throw error;
    return photo;
  }

  async update(id: string, data: UpdatePhoto): Promise<Photo> {
    const updateData: Record<string, unknown> = {};

    if (data.location_id !== undefined) updateData.location_id = data.location_id;
    if (data.work_category_code !== undefined) updateData.work_category_code = data.work_category_code;
    if (data.task_instance_id !== undefined) updateData.task_instance_id = data.task_instance_id;
    if (data.caption !== undefined) updateData.caption = data.caption;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.shared_to_portal !== undefined) {
      updateData.shared_to_portal = data.shared_to_portal;
      if (data.shared_to_portal) {
        updateData.shared_at = new Date().toISOString();
      }
    }

    const { data: photo, error } = await this.supabase
      .from('photos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return photo;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async shareToPortal(id: string): Promise<Photo> {
    return this.update(id, { shared_to_portal: true });
  }

  async unshareFromPortal(id: string): Promise<Photo> {
    const { data: photo, error } = await this.supabase
      .from('photos')
      .update({
        shared_to_portal: false,
        shared_at: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return photo;
  }

  async findSharedByProperty(propertyId: string): Promise<Photo[]> {
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .eq('property_id', propertyId)
      .eq('shared_to_portal', true)
      .order('taken_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
