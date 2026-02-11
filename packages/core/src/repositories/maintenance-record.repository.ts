import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MaintenanceRecord,
  CreateMaintenanceRecordInput,
  MaintenanceType,
} from '../types';

export class MaintenanceRecordRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateMaintenanceRecordInput): Promise<MaintenanceRecord> {
    const { data, error } = await this.supabase
      .from('maintenance_records')
      .insert({
        property_id: input.property_id,
        product_id: input.product_id,
        organization_id: input.organization_id,
        maintenance_type: input.maintenance_type,
        description: input.description,
        performed_date: input.performed_date,
        performed_by: input.performed_by,
        cost: input.cost,
        invoice_id: input.invoice_id,
        outcome: input.outcome,
        next_recommended: input.next_recommended,
        photo_ids: input.photo_ids,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<MaintenanceRecord | null> {
    const { data, error } = await this.supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByProperty(propertyId: string): Promise<MaintenanceRecord[]> {
    const { data, error } = await this.supabase
      .from('maintenance_records')
      .select('*')
      .eq('property_id', propertyId)
      .order('performed_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByProduct(productId: string): Promise<MaintenanceRecord[]> {
    const { data, error } = await this.supabase
      .from('maintenance_records')
      .select('*')
      .eq('product_id', productId)
      .order('performed_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByType(
    propertyId: string,
    maintenanceType: MaintenanceType
  ): Promise<MaintenanceRecord[]> {
    const { data, error } = await this.supabase
      .from('maintenance_records')
      .select('*')
      .eq('property_id', propertyId)
      .eq('maintenance_type', maintenanceType)
      .order('performed_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findRecent(propertyId: string, limit: number = 10): Promise<MaintenanceRecord[]> {
    const { data, error } = await this.supabase
      .from('maintenance_records')
      .select('*')
      .eq('property_id', propertyId)
      .order('performed_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async findByDateRange(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<MaintenanceRecord[]> {
    const { data, error } = await this.supabase
      .from('maintenance_records')
      .select('*')
      .eq('property_id', propertyId)
      .gte('performed_date', startDate)
      .lte('performed_date', endDate)
      .order('performed_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get total maintenance cost for a property
   */
  async getTotalCost(propertyId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('maintenance_records')
      .select('cost')
      .eq('property_id', propertyId)
      .not('cost', 'is', null);

    if (error) throw error;

    return (data || []).reduce((sum, record) => sum + (record.cost || 0), 0);
  }

  /**
   * Get maintenance cost by year
   */
  async getCostByYear(propertyId: string): Promise<Record<number, number>> {
    const { data, error } = await this.supabase
      .from('maintenance_records')
      .select('performed_date, cost')
      .eq('property_id', propertyId)
      .not('cost', 'is', null);

    if (error) throw error;

    const costByYear: Record<number, number> = {};
    for (const record of data || []) {
      const year = new Date(record.performed_date).getFullYear();
      costByYear[year] = (costByYear[year] || 0) + (record.cost || 0);
    }

    return costByYear;
  }
}
