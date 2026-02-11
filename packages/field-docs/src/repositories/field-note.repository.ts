/**
 * Field Note Repository
 * Data access layer for field_notes table
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FieldNote,
  CreateFieldNote,
  UpdateFieldNote,
  FieldNoteFilters,
} from '../types';

export interface IFieldNoteRepository {
  findById(id: string): Promise<FieldNote | null>;
  findByProject(projectId: string): Promise<FieldNote[]>;
  findByProperty(propertyId: string): Promise<FieldNote[]>;
  findByFilters(filters: FieldNoteFilters): Promise<FieldNote[]>;
  findFlaggedForCO(projectId: string): Promise<FieldNote[]>;
  create(data: CreateFieldNote): Promise<FieldNote>;
  update(id: string, data: UpdateFieldNote): Promise<FieldNote>;
  delete(id: string): Promise<void>;
  flagForCO(id: string): Promise<FieldNote>;
  unflagFromCO(id: string): Promise<FieldNote>;
  linkPhotos(id: string, photoIds: string[]): Promise<FieldNote>;
}

export class FieldNoteRepository implements IFieldNoteRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<FieldNote | null> {
    const { data, error } = await this.supabase
      .from('field_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async findByProject(projectId: string): Promise<FieldNote[]> {
    const { data, error } = await this.supabase
      .from('field_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByProperty(propertyId: string): Promise<FieldNote[]> {
    const { data, error } = await this.supabase
      .from('field_notes')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByFilters(filters: FieldNoteFilters): Promise<FieldNote[]> {
    let query = this.supabase.from('field_notes').select('*');

    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
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
    if (filters.note_type) {
      query = query.eq('note_type', filters.note_type);
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    if (filters.flagged_for_co !== undefined) {
      query = query.eq('flagged_for_co', filters.flagged_for_co);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findFlaggedForCO(projectId: string): Promise<FieldNote[]> {
    const { data, error } = await this.supabase
      .from('field_notes')
      .select('*')
      .eq('project_id', projectId)
      .eq('flagged_for_co', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(data: CreateFieldNote): Promise<FieldNote> {
    const { data: fieldNote, error } = await this.supabase
      .from('field_notes')
      .insert({
        organization_id: data.organization_id,
        project_id: data.project_id,
        property_id: data.property_id,
        location_id: data.location_id || null,
        work_category_code: data.work_category_code || null,
        task_instance_id: data.task_instance_id || null,
        note_type: data.note_type || 'general',
        content: data.content,
        input_method: data.input_method || 'typed',
        voice_transcript: data.voice_transcript || null,
        photo_ids: data.photo_ids || [],
        created_by: data.created_by,
      })
      .select()
      .single();

    if (error) throw error;
    return fieldNote;
  }

  async update(id: string, data: UpdateFieldNote): Promise<FieldNote> {
    const updateData: Record<string, unknown> = {};

    if (data.location_id !== undefined) updateData.location_id = data.location_id;
    if (data.work_category_code !== undefined) updateData.work_category_code = data.work_category_code;
    if (data.task_instance_id !== undefined) updateData.task_instance_id = data.task_instance_id;
    if (data.note_type !== undefined) updateData.note_type = data.note_type;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.photo_ids !== undefined) updateData.photo_ids = data.photo_ids;
    if (data.flagged_for_co !== undefined) updateData.flagged_for_co = data.flagged_for_co;

    const { data: fieldNote, error } = await this.supabase
      .from('field_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fieldNote;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('field_notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async flagForCO(id: string): Promise<FieldNote> {
    return this.update(id, { flagged_for_co: true });
  }

  async unflagFromCO(id: string): Promise<FieldNote> {
    return this.update(id, { flagged_for_co: false });
  }

  async linkPhotos(id: string, photoIds: string[]): Promise<FieldNote> {
    return this.update(id, { photo_ids: photoIds });
  }
}
