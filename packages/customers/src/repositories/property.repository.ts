import type { SupabaseClient } from '@supabase/supabase-js';
import type { Property } from '@hooomz/shared';
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
  PropertyWithHistory,
} from '../types';

export class PropertyRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreatePropertyInput): Promise<Property> {
    const { data, error } = await this.supabase
      .from('properties')
      .insert({
        address_line1: input.address_line1,
        address_line2: input.address_line2 || null,
        city: input.city,
        province: input.province,
        postal_code: input.postal_code,
        country: input.country || 'CA',
        current_owner_id: input.current_owner_id || null,
        created_by_org_id: input.created_by_org_id,
        year_built: input.year_built || null,
        property_type: input.property_type || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<Property | null> {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByIdWithHistory(id: string): Promise<PropertyWithHistory | null> {
    const { data, error } = await this.supabase
      .from('properties')
      .select(
        `
        *,
        ownership_history:property_ownership_history(
          owner_id,
          started_at,
          ended_at,
          transfer_type
        ),
        projects:projects(
          id,
          name,
          status,
          actual_end_date
        )
      `
      )
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findMany(filters: PropertyFilters): Promise<Property[]> {
    let query = this.supabase.from('properties').select('*');

    if (filters.organization_id) {
      query = query.eq('created_by_org_id', filters.organization_id);
    }

    if (filters.current_owner_id) {
      query = query.eq('current_owner_id', filters.current_owner_id);
    }

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters.province) {
      query = query.eq('province', filters.province);
    }

    if (filters.search) {
      query = query.or(
        `address_line1.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('address_line1');

    if (error) throw error;
    return data || [];
  }

  async findByAddress(
    addressLine1: string,
    city: string,
    province: string
  ): Promise<Property | null> {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .ilike('address_line1', addressLine1)
      .ilike('city', city)
      .eq('province', province)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .eq('current_owner_id', ownerId)
      .order('address_line1');

    if (error) throw error;
    return data || [];
  }

  async update(id: string, input: UpdatePropertyInput): Promise<Property> {
    const { data, error } = await this.supabase
      .from('properties')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOwner(id: string, newOwnerId: string | null): Promise<Property> {
    const { data, error } = await this.supabase
      .from('properties')
      .update({
        current_owner_id: newOwnerId,
        ownership_transferred_at: newOwnerId ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('properties').delete().eq('id', id);

    if (error) throw error;
  }
}
