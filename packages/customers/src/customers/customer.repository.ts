/**
 * Customer Repository
 *
 * Data access layer for customer management.
 * Defines the interface for customer storage and provides an in-memory implementation.
 */

import type {
  Customer,
  CreateCustomer,
  QueryParams,
  CustomerFilters,
  CustomerSortField,
} from '@hooomz/shared-contracts';

import {
  generateCustomerId,
  createMetadata,
  updateMetadata,
} from '@hooomz/shared-contracts';

/**
 * Customer Repository Interface
 */
export interface ICustomerRepository {
  findAll(params?: QueryParams<CustomerSortField, CustomerFilters>): Promise<{
    customers: Customer[];
    total: number;
  }>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findByPhone(phone: string): Promise<Customer | null>;
  search(query: string): Promise<Customer[]>;
  findSimilar(data: Partial<CreateCustomer>): Promise<Customer[]>;
  create(data: CreateCustomer): Promise<Customer>;
  update(
    id: string,
    data: Partial<Omit<Customer, 'id' | 'metadata'>>
  ): Promise<Customer | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

/**
 * In-Memory Customer Repository
 * For testing and development
 */
export class InMemoryCustomerRepository implements ICustomerRepository {
  private customers: Map<string, Customer> = new Map();

  async findAll(
    params?: QueryParams<CustomerSortField, CustomerFilters>
  ): Promise<{ customers: Customer[]; total: number }> {
    let customers = Array.from(this.customers.values());

    // Apply filters
    if (params?.filters) {
      const { filters } = params;

      if (filters.type) {
        customers = customers.filter((c) => c.type === filters.type);
      }

      if (filters.tags && filters.tags.length > 0) {
        customers = customers.filter((c) =>
          filters.tags!.some((tag) => c.tags?.includes(tag))
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        customers = customers.filter(
          (c) =>
            c.firstName.toLowerCase().includes(searchLower) ||
            c.lastName.toLowerCase().includes(searchLower) ||
            c.email.toLowerCase().includes(searchLower) ||
            c.phone.toLowerCase().includes(searchLower) ||
            c.address?.street?.toLowerCase().includes(searchLower) ||
            c.address?.city?.toLowerCase().includes(searchLower)
        );
      }
    }

    const total = customers.length;

    // Apply sorting
    if (params?.sortBy) {
      const { sortBy, sortOrder = 'asc' } = params;
      customers.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortBy) {
          case 'name':
            aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
            bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
            break;
          case 'email':
            aVal = a.email.toLowerCase();
            bVal = b.email.toLowerCase();
            break;
          case 'createdAt':
            aVal = new Date(a.metadata.createdAt).getTime();
            bVal = new Date(b.metadata.createdAt).getTime();
            break;
          default:
            aVal = a.metadata.createdAt;
            bVal = b.metadata.createdAt;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (params?.page && params?.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      customers = customers.slice(start, end);
    }

    return { customers, total };
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.get(id) || null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customers = Array.from(this.customers.values());
    return customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const customers = Array.from(this.customers.values());
    // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
    const normalizePhone = (p: string) => p.replace(/[\s\-\(\)]/g, '');
    const normalizedSearch = normalizePhone(phone);
    return customers.find((c) => normalizePhone(c.phone) === normalizedSearch) || null;
  }

  async search(query: string): Promise<Customer[]> {
    const queryLower = query.toLowerCase();
    const customers = Array.from(this.customers.values());

    return customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(queryLower) ||
        c.lastName.toLowerCase().includes(queryLower) ||
        c.email.toLowerCase().includes(queryLower) ||
        c.phone.includes(query) ||
        c.company?.toLowerCase().includes(queryLower) ||
        c.address?.street?.toLowerCase().includes(queryLower) ||
        c.address?.city?.toLowerCase().includes(queryLower) ||
        c.address?.postalCode?.toLowerCase().includes(queryLower)
    );
  }

  async findSimilar(data: Partial<CreateCustomer>): Promise<Customer[]> {
    const customers = Array.from(this.customers.values());
    const similar: Customer[] = [];

    for (const customer of customers) {
      // Check for exact email match
      if (data.email && customer.email.toLowerCase() === data.email.toLowerCase()) {
        similar.push(customer);
        continue;
      }

      // Check for exact phone match (normalized)
      if (data.phone) {
        const normalizePhone = (p: string) => p.replace(/[\s\-\(\)]/g, '');
        if (normalizePhone(customer.phone) === normalizePhone(data.phone)) {
          similar.push(customer);
          continue;
        }
      }

      // Check for similar name and address
      if (data.firstName && data.lastName && data.address) {
        const nameMatch =
          customer.firstName.toLowerCase() === data.firstName.toLowerCase() &&
          customer.lastName.toLowerCase() === data.lastName.toLowerCase();

        const addressMatch =
          customer.address?.street?.toLowerCase() === data.address.street?.toLowerCase() &&
          customer.address?.city?.toLowerCase() === data.address.city?.toLowerCase();

        if (nameMatch && addressMatch) {
          similar.push(customer);
        }
      }
    }

    return similar;
  }

  async create(data: CreateCustomer): Promise<Customer> {
    const customer: Customer = {
      ...data,
      id: generateCustomerId(),
      metadata: createMetadata(),
    };

    this.customers.set(customer.id, customer);
    return customer;
  }

  async update(
    id: string,
    data: Partial<Omit<Customer, 'id' | 'metadata'>>
  ): Promise<Customer | null> {
    const existing = this.customers.get(id);
    if (!existing) return null;

    const updated: Customer = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: updateMetadata(existing.metadata),
    };

    this.customers.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.customers.has(id);
  }
}
