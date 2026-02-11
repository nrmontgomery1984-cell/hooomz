import type { SupabaseClient } from '@supabase/supabase-js';
import type { PropertyOwnershipHistory, OwnershipTransferType } from '@hooomz/shared';

export interface CreateOwnershipRecordInput {
  property_id: string;
  owner_id: string;
  transfer_type: OwnershipTransferType;
  started_at?: string;
}

export class PropertyOwnershipRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateOwnershipRecordInput): Promise<PropertyOwnershipHistory> {
    const { data, error } = await this.supabase
      .from('property_ownership_history')
      .insert({
        property_id: input.property_id,
        owner_id: input.owner_id,
        transfer_type: input.transfer_type,
        started_at: input.started_at || new Date().toISOString(),
        ended_at: null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findByProperty(propertyId: string): Promise<PropertyOwnershipHistory[]> {
    const { data, error } = await this.supabase
      .from('property_ownership_history')
      .select('*')
      .eq('property_id', propertyId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findCurrentOwnership(propertyId: string): Promise<PropertyOwnershipHistory | null> {
    const { data, error } = await this.supabase
      .from('property_ownership_history')
      .select('*')
      .eq('property_id', propertyId)
      .is('ended_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async endOwnership(propertyId: string, ownerId: string): Promise<void> {
    const { error } = await this.supabase
      .from('property_ownership_history')
      .update({ ended_at: new Date().toISOString() })
      .eq('property_id', propertyId)
      .eq('owner_id', ownerId)
      .is('ended_at', null);

    if (error) throw error;
  }

  async findByOwner(ownerId: string): Promise<PropertyOwnershipHistory[]> {
    const { data, error } = await this.supabase
      .from('property_ownership_history')
      .select('*')
      .eq('owner_id', ownerId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
