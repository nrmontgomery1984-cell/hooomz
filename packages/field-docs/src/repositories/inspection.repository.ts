/**
 * Inspection Repository
 * Data access layer for inspections table
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Inspection,
  CreateInspection,
  UpdateInspection,
  InspectionFilters,
  InspectionStatus,
} from '../types';

export interface IInspectionRepository {
  findById(id: string): Promise<Inspection | null>;
  findByProject(projectId: string): Promise<Inspection[]>;
  findByProperty(propertyId: string): Promise<Inspection[]>;
  findByFilters(filters: InspectionFilters): Promise<Inspection[]>;
  findUpcoming(organizationId: string, days?: number): Promise<Inspection[]>;
  create(data: CreateInspection): Promise<Inspection>;
  update(id: string, data: UpdateInspection): Promise<Inspection>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: InspectionStatus, notes?: string): Promise<Inspection>;
  linkPhotos(id: string, photoIds: string[]): Promise<Inspection>;
  linkDocument(id: string, documentId: string): Promise<Inspection>;
}

export class InspectionRepository implements IInspectionRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Inspection | null> {
    const { data, error } = await this.supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async findByProject(projectId: string): Promise<Inspection[]> {
    const { data, error } = await this.supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findByProperty(propertyId: string): Promise<Inspection[]> {
    const { data, error } = await this.supabase
      .from('inspections')
      .select('*')
      .eq('property_id', propertyId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findByFilters(filters: InspectionFilters): Promise<Inspection[]> {
    let query = this.supabase.from('inspections').select('*');

    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters.property_id) {
      query = query.eq('property_id', filters.property_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.inspection_type) {
      query = query.eq('inspection_type', filters.inspection_type);
    }
    if (filters.scheduled_from) {
      query = query.gte('scheduled_date', filters.scheduled_from);
    }
    if (filters.scheduled_to) {
      query = query.lte('scheduled_date', filters.scheduled_to);
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findUpcoming(organizationId: string, days: number = 7): Promise<Inspection[]> {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await this.supabase
      .from('inspections')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'scheduled')
      .gte('scheduled_date', today.toISOString().split('T')[0])
      .lte('scheduled_date', endDate.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async create(data: CreateInspection): Promise<Inspection> {
    const { data: inspection, error } = await this.supabase
      .from('inspections')
      .insert({
        organization_id: data.organization_id,
        project_id: data.project_id,
        property_id: data.property_id,
        location_id: data.location_id || null,
        work_category_code: data.work_category_code || null,
        stage_code: data.stage_code || null,
        inspection_type: data.inspection_type,
        inspector_name: data.inspector_name || null,
        inspector_phone: data.inspector_phone || null,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time || null,
        status: 'scheduled',
        created_by: data.created_by,
      })
      .select()
      .single();

    if (error) throw error;
    return inspection;
  }

  async update(id: string, data: UpdateInspection): Promise<Inspection> {
    const updateData: Record<string, unknown> = {};

    if (data.location_id !== undefined) updateData.location_id = data.location_id;
    if (data.work_category_code !== undefined) updateData.work_category_code = data.work_category_code;
    if (data.stage_code !== undefined) updateData.stage_code = data.stage_code;
    if (data.inspection_type !== undefined) updateData.inspection_type = data.inspection_type;
    if (data.inspector_name !== undefined) updateData.inspector_name = data.inspector_name;
    if (data.inspector_phone !== undefined) updateData.inspector_phone = data.inspector_phone;
    if (data.scheduled_date !== undefined) updateData.scheduled_date = data.scheduled_date;
    if (data.scheduled_time !== undefined) updateData.scheduled_time = data.scheduled_time;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.result_notes !== undefined) updateData.result_notes = data.result_notes;
    if (data.completed_at !== undefined) updateData.completed_at = data.completed_at;
    if (data.photo_ids !== undefined) updateData.photo_ids = data.photo_ids;
    if (data.document_id !== undefined) updateData.document_id = data.document_id;

    const { data: inspection, error } = await this.supabase
      .from('inspections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return inspection;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('inspections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateStatus(id: string, status: InspectionStatus, notes?: string): Promise<Inspection> {
    const updateData: Record<string, unknown> = { status };

    if (notes) {
      updateData.result_notes = notes;
    }

    if (status === 'passed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: inspection, error } = await this.supabase
      .from('inspections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return inspection;
  }

  async linkPhotos(id: string, photoIds: string[]): Promise<Inspection> {
    const { data: inspection, error } = await this.supabase
      .from('inspections')
      .update({ photo_ids: photoIds })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return inspection;
  }

  async linkDocument(id: string, documentId: string): Promise<Inspection> {
    const { data: inspection, error } = await this.supabase
      .from('inspections')
      .update({ document_id: documentId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return inspection;
  }
}
