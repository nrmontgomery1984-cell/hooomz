/**
 * Customer Repository - IndexedDB implementation for offline-first operation
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
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

/**
 * IndexedDB-backed Customer Repository
 */
export class CustomerRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CUSTOMERS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async findAll(
    params?: QueryParams<CustomerSortField, CustomerFilters>
  ): Promise<{ customers: Customer[]; total: number }> {
    let customers = await this.storage.getAll<Customer>(this.storeName);

    // Apply filters
    if (params?.filters) {
      const { filters } = params;

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

      if (filters.preferredContactMethod) {
        customers = customers.filter(
          (c) => c.preferredContactMethod === filters.preferredContactMethod
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
          case 'firstName':
            aVal = a.firstName.toLowerCase();
            bVal = b.firstName.toLowerCase();
            break;
          case 'lastName':
            aVal = a.lastName.toLowerCase();
            bVal = b.lastName.toLowerCase();
            break;
          case 'email':
            aVal = a.email.toLowerCase();
            bVal = b.email.toLowerCase();
            break;
          case 'createdAt':
            aVal = new Date(a.metadata.createdAt).getTime();
            bVal = new Date(b.metadata.createdAt).getTime();
            break;
          case 'updatedAt':
            aVal = new Date(a.metadata.updatedAt).getTime();
            bVal = new Date(b.metadata.updatedAt).getTime();
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
    return await this.storage.get<Customer>(this.storeName, id);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customers = await this.storage.getAll<Customer>(this.storeName);
    return (
      customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) ||
      null
    );
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const customers = await this.storage.getAll<Customer>(this.storeName);
    const normalizePhone = (p: string) => p.replace(/[\s\-\(\)]/g, '');
    const normalizedSearch = normalizePhone(phone);
    return (
      customers.find((c) => normalizePhone(c.phone) === normalizedSearch) ||
      null
    );
  }

  async search(query: string): Promise<Customer[]> {
    const queryLower = query.toLowerCase();
    const customers = await this.storage.getAll<Customer>(this.storeName);

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
    const customers = await this.storage.getAll<Customer>(this.storeName);
    const similar: Customer[] = [];

    for (const customer of customers) {
      // Check for exact email match
      if (
        data.email &&
        customer.email.toLowerCase() === data.email.toLowerCase()
      ) {
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
          customer.address?.street?.toLowerCase() ===
            data.address.street?.toLowerCase() &&
          customer.address?.city?.toLowerCase() ===
            data.address.city?.toLowerCase();

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

    await this.storage.set(this.storeName, customer.id, customer);
    await this.syncQueue.queueCreate(this.storeName, customer.id, customer);

    return customer;
  }

  async update(
    id: string,
    data: Partial<Omit<Customer, 'id' | 'metadata'>>
  ): Promise<Customer | null> {
    const existing = await this.storage.get<Customer>(this.storeName, id);
    if (!existing) return null;

    const updated: Customer = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: updateMetadata(existing.metadata),
    };

    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<Customer>(this.storeName, id);
    if (!existing) return false;

    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);

    return true;
  }

  async exists(id: string): Promise<boolean> {
    const customer = await this.storage.get<Customer>(this.storeName, id);
    return customer !== null;
  }
}
