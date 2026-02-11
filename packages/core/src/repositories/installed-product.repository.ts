import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  InstalledProduct,
  CreateInstalledProductInput,
  UpdateInstalledProductInput,
  InstalledProductFilters,
  ExpiringWarranty,
  MaintenanceDue,
} from '../types';

export class InstalledProductRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateInstalledProductInput): Promise<InstalledProduct> {
    // Calculate next_service_due if maintenance_interval_months provided
    let next_service_due: string | undefined;
    if (input.maintenance_interval_months && input.install_date) {
      const installDate = new Date(input.install_date);
      installDate.setMonth(installDate.getMonth() + input.maintenance_interval_months);
      next_service_due = installDate.toISOString().split('T')[0];
    }

    const { data, error } = await this.supabase
      .from('installed_products')
      .insert({
        property_id: input.property_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        category: input.category,
        product_type: input.product_type,
        manufacturer: input.manufacturer,
        model: input.model,
        serial_number: input.serial_number,
        install_date: input.install_date,
        location: input.location,
        location_id: input.location_id,
        warranty_years: input.warranty_years,
        warranty_expires: input.warranty_expires,
        warranty_document_id: input.warranty_document_id,
        maintenance_interval_months: input.maintenance_interval_months,
        next_service_due,
        notes: input.notes,
        specifications: input.specifications,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<InstalledProduct | null> {
    const { data, error } = await this.supabase
      .from('installed_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByProperty(propertyId: string): Promise<InstalledProduct[]> {
    const { data, error } = await this.supabase
      .from('installed_products')
      .select('*')
      .eq('property_id', propertyId)
      .order('category', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findMany(filters: InstalledProductFilters): Promise<InstalledProduct[]> {
    let query = this.supabase
      .from('installed_products')
      .select('*')
      .eq('property_id', filters.property_id);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.has_warranty === true) {
      query = query.not('warranty_expires', 'is', null);
    }

    if (filters.warranty_expiring_within_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.warranty_expiring_within_days);
      query = query
        .gte('warranty_expires', new Date().toISOString().split('T')[0])
        .lte('warranty_expires', futureDate.toISOString().split('T')[0]);
    }

    if (filters.maintenance_due_within_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.maintenance_due_within_days);
      query = query.lte('next_service_due', futureDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('category').order('product_type');

    if (error) throw error;
    return data || [];
  }

  async update(id: string, input: UpdateInstalledProductInput): Promise<InstalledProduct> {
    const { data, error } = await this.supabase
      .from('installed_products')
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

  async recordMaintenance(
    id: string,
    servicedDate: string,
    intervalMonths?: number
  ): Promise<InstalledProduct> {
    // Get current product to check interval
    const product = await this.findById(id);
    if (!product) throw new Error('Product not found');

    const interval = intervalMonths || product.maintenance_interval_months;

    // Calculate next service due
    let next_service_due: string | undefined;
    if (interval) {
      const nextDate = new Date(servicedDate);
      nextDate.setMonth(nextDate.getMonth() + interval);
      next_service_due = nextDate.toISOString().split('T')[0];
    }

    return this.update(id, {
      last_serviced: servicedDate,
      next_service_due,
    });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('installed_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get products with warranties expiring within N days
   * Uses the database function for efficiency
   */
  async getExpiringWarranties(
    propertyId: string,
    daysAhead: number = 90
  ): Promise<ExpiringWarranty[]> {
    const { data, error } = await this.supabase.rpc('get_expiring_warranties', {
      p_property_id: propertyId,
      p_days_ahead: daysAhead,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get products due for maintenance within N days
   * Uses the database function for efficiency
   */
  async getMaintenanceDue(
    propertyId: string,
    daysAhead: number = 30
  ): Promise<MaintenanceDue[]> {
    const { data, error } = await this.supabase.rpc('get_maintenance_due', {
      p_property_id: propertyId,
      p_days_ahead: daysAhead,
    });

    if (error) throw error;
    return data || [];
  }
}
