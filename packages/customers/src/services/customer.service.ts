import type { Customer } from '@hooomz/shared';
import type { CustomerRepository } from '../repositories';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilters,
  CustomerWithRelations,
} from '../types';

export class CustomerService {
  constructor(private customerRepo: CustomerRepository) {}

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    // Check for existing customer with same email
    if (input.email) {
      const existing = await this.customerRepo.findByEmail(input.organization_id, input.email);
      if (existing) {
        throw new Error('Customer with this email already exists');
      }
    }

    return this.customerRepo.create(input);
  }

  async getCustomer(id: string): Promise<Customer | null> {
    return this.customerRepo.findById(id);
  }

  async getCustomerWithRelations(id: string): Promise<CustomerWithRelations | null> {
    const customer = await this.customerRepo.findByIdWithRelations(id);
    if (!customer) return null;

    // Add lifetime value
    const lifetimeValue = await this.customerRepo.getLifetimeValue(id);
    return { ...customer, lifetime_value: lifetimeValue };
  }

  async listCustomers(filters: CustomerFilters): Promise<Customer[]> {
    return this.customerRepo.findMany(filters);
  }

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    return this.customerRepo.update(id, input);
  }

  async addTag(id: string, tag: string): Promise<Customer> {
    return this.customerRepo.addTag(id, tag);
  }

  async removeTag(id: string, tag: string): Promise<Customer> {
    return this.customerRepo.removeTag(id, tag);
  }

  async deleteCustomer(id: string): Promise<void> {
    // Check if customer has any active projects
    const customer = await this.customerRepo.findByIdWithRelations(id);
    if (customer?.projects?.some((p) => !['complete', 'cancelled'].includes(p.status))) {
      throw new Error('Cannot delete customer with active projects');
    }

    return this.customerRepo.delete(id);
  }

  async searchCustomers(organizationId: string, query: string): Promise<Customer[]> {
    return this.customerRepo.findMany({
      organization_id: organizationId,
      search: query,
    });
  }

  async getCustomersByTag(organizationId: string, tag: string): Promise<Customer[]> {
    return this.customerRepo.findMany({
      organization_id: organizationId,
      tags: [tag],
    });
  }

  // Get all unique tags used in an organization
  async getOrganizationTags(organizationId: string): Promise<string[]> {
    const customers = await this.customerRepo.findMany({
      organization_id: organizationId,
    });

    const tagSet = new Set<string>();
    customers.forEach((c) => c.tags.forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }
}
