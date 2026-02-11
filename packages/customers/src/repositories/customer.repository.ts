import type { SupabaseClient } from '@supabase/supabase-js';
import type { Customer } from '@hooomz/shared';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilters,
  CustomerWithRelations,
} from '../types';

export class CustomerRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateCustomerInput): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .insert({
        organization_id: input.organization_id,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email || null,
        phone: input.phone || null,
        source: input.source || null,
        tags: input.tags || [],
        portal_access: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByIdWithRelations(id: string): Promise<CustomerWithRelations | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select(
        `
        *,
        properties:properties!current_owner_id(id, address_line1, city, province),
        projects:projects(id, name, status)
      `
      )
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findMany(filters: CustomerFilters): Promise<Customer[]> {
    let query = this.supabase
      .from('customers')
      .select('*')
      .eq('organization_id', filters.organization_id);

    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.has_portal_access !== undefined) {
      query = query.eq('portal_access', filters.has_portal_access);
    }

    const { data, error } = await query.order('last_name').order('first_name');

    if (error) throw error;
    return data || [];
  }

  async findByEmail(organizationId: string, email: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
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

  async updatePortalAccess(
    id: string,
    hasAccess: boolean,
    portalUserId?: string
  ): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .update({
        portal_access: hasAccess,
        portal_user_id: portalUserId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addTag(id: string, tag: string): Promise<Customer> {
    const customer = await this.findById(id);
    if (!customer) throw new Error('Customer not found');

    const tags = [...new Set([...customer.tags, tag])];
    return this.update(id, { tags });
  }

  async removeTag(id: string, tag: string): Promise<Customer> {
    const customer = await this.findById(id);
    if (!customer) throw new Error('Customer not found');

    const tags = customer.tags.filter((t: string) => t !== tag);
    return this.update(id, { tags });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('customers').delete().eq('id', id);

    if (error) throw error;
  }

  async getLifetimeValue(id: string): Promise<number> {
    // Sum of all completed project values for this customer
    const { data, error } = await this.supabase
      .from('estimates')
      .select('estimate_line_items(total_price)')
      .eq('customer_id', id)
      .eq('status', 'converted');

    if (error) throw error;

    let total = 0;
    for (const estimate of data || []) {
      const lineItems = estimate.estimate_line_items as { total_price: number }[] | null;
      for (const item of lineItems || []) {
        total += item.total_price || 0;
      }
    }
    return total;
  }
}
