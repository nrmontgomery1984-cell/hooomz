import type { SupabaseClient } from '@supabase/supabase-js';
import type { Project, ProjectStatus } from '@hooomz/shared';
import type { CreateProjectInput, UpdateProjectInput, ProjectFilters, ProjectWithRelations } from '../types';

export class ProjectRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .insert({
        organization_id: input.organization_id,
        property_id: input.property_id,
        customer_id: input.customer_id,
        name: input.name,
        status: input.status || 'lead',
        start_date: input.start_date,
        target_end_date: input.target_end_date,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByIdWithRelations(id: string): Promise<ProjectWithRelations | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        property:properties(address_line1, city, province),
        customer:customers(first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findMany(filters: ProjectFilters): Promise<Project[]> {
    let query = this.supabase
      .from('projects')
      .select('*')
      .eq('organization_id', filters.organization_id);

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.health) {
      query = query.eq('health', filters.health);
    }

    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    if (filters.property_id) {
      query = query.eq('property_id', filters.property_id);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
