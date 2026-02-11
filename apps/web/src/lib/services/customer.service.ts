/**
 * Customer Service - Wraps CustomerRepository with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all customer operations are logged.
 */

import type { Customer, CreateCustomer, UpdateCustomer } from '@hooomz/shared-contracts';
import type { Services } from './index';

/**
 * CustomerService - Handles customer operations with activity logging
 */
export class CustomerService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Create a new customer
   */
  async create(
    data: CreateCustomer,
    projectId?: string
  ): Promise<Customer> {
    const customer = await this.services.customers.create(data);
    const customerName = `${data.firstName} ${data.lastName}`;

    // Log to activity (non-blocking)
    this.services.activity.logCustomerEvent('customer.created', customer.id, {
      customer_name: customerName,
      project_id: projectId,
    }).catch((err) => console.error('Failed to log customer.created:', err));

    return customer;
  }

  /**
   * Update a customer
   */
  async update(
    customerId: string,
    data: UpdateCustomer,
    projectId?: string
  ): Promise<Customer | null> {
    const existing = await this.services.customers.findById(customerId);
    if (!existing) return null;

    const updated = await this.services.customers.update(customerId, data);

    if (updated) {
      // Build a description of what changed
      const changes: string[] = [];
      if (data.firstName || data.lastName) changes.push('name');
      if (data.email) changes.push('email');
      if (data.phone) changes.push('phone');
      if (data.address) changes.push('address');
      if (data.tags) changes.push('tags');

      const customerName = `${updated.firstName} ${updated.lastName}`;

      // Log update (non-blocking)
      this.services.activity.logCustomerEvent('customer.updated', customerId, {
        customer_name: customerName,
        project_id: projectId,
        changes: changes.join(', '),
      }).catch((err) => console.error('Failed to log customer.updated:', err));
    }

    return updated;
  }

  /**
   * Delete a customer
   */
  async delete(customerId: string): Promise<boolean> {
    const existing = await this.services.customers.findById(customerId);
    if (!existing) return false;

    const deleted = await this.services.customers.delete(customerId);

    if (deleted) {
      const customerName = `${existing.firstName} ${existing.lastName}`;

      // Log deletion (non-blocking)
      this.services.activity.logCustomerEvent('customer.deleted', customerId, {
        customer_name: customerName,
      }).catch((err) => console.error('Failed to log customer.deleted:', err));
    }

    return deleted;
  }

  /**
   * Add a tag to a customer (via update)
   */
  async addTag(customerId: string, tag: string): Promise<Customer | null> {
    const existing = await this.services.customers.findById(customerId);
    if (!existing) return null;

    const currentTags = existing.tags || [];
    if (currentTags.includes(tag)) return existing; // Already has tag

    const updated = await this.services.customers.update(customerId, {
      tags: [...currentTags, tag],
    });

    if (updated) {
      const customerName = `${updated.firstName} ${updated.lastName}`;

      // Log tag addition (non-blocking)
      this.services.activity.logCustomerEvent('customer.updated', customerId, {
        customer_name: customerName,
        changes: `added tag: ${tag}`,
      }).catch((err) => console.error('Failed to log customer tag add:', err));
    }

    return updated;
  }

  /**
   * Remove a tag from a customer (via update)
   */
  async removeTag(customerId: string, tag: string): Promise<Customer | null> {
    const existing = await this.services.customers.findById(customerId);
    if (!existing) return null;

    const currentTags = existing.tags || [];
    if (!currentTags.includes(tag)) return existing; // Doesn't have tag

    const updated = await this.services.customers.update(customerId, {
      tags: currentTags.filter(t => t !== tag),
    });

    if (updated) {
      const customerName = `${updated.firstName} ${updated.lastName}`;

      // Log tag removal (non-blocking)
      this.services.activity.logCustomerEvent('customer.updated', customerId, {
        customer_name: customerName,
        changes: `removed tag: ${tag}`,
      }).catch((err) => console.error('Failed to log customer tag remove:', err));
    }

    return updated;
  }

  // Passthrough methods for read operations (no logging needed)
  async findById(id: string) {
    return this.services.customers.findById(id);
  }

  async findAll(params?: { filters?: { search?: string } }) {
    return this.services.customers.findAll(params);
  }

  async search(query: string) {
    return this.services.customers.search(query);
  }
}

/**
 * Create a CustomerService instance
 */
export function createCustomerService(services: Services): CustomerService {
  return new CustomerService(services);
}
