/**
 * Customer Service
 *
 * Business logic layer for customer management.
 * Implements CustomerOperations from the API contract.
 */

import type {
  Customer,
  CreateCustomer,
  UpdateCustomer,
  QueryParams,
  CustomerFilters,
  CustomerSortField,
  ApiResponse,
  PaginatedApiResponse,
  CustomerOperations,
  Project,
  ContactMethod,
} from '@hooomz/shared-contracts';

import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePaginationMeta,
  validateCreateCustomer,
  validateUpdateCustomer,
} from '@hooomz/shared-contracts';

import type { ICustomerRepository } from './customer.repository';

/**
 * Dependencies for fetching related entities
 */
export interface CustomerServiceDependencies {
  customerRepository: ICustomerRepository;
  projectRepository?: {
    findByClientId(clientId: string): Promise<Project[]>;
  };
}

/**
 * Customer history event
 */
export interface CustomerHistoryEvent {
  id: string;
  type: 'customer_created' | 'customer_updated' | 'project_created' | 'project_status_change';
  date: string;
  description: string;
  projectId?: string;
  projectName?: string;
}

/**
 * Customer with projects
 */
export interface CustomerWithProjects {
  customer: Customer;
  projects: Project[];
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
}

/**
 * Preferred contact method result
 */
export interface PreferredContact {
  method: ContactMethod;
  value: string;
  label: string;
}

/**
 * Customer Service - Business logic for customer management
 */
export class CustomerService implements CustomerOperations {
  constructor(private deps: CustomerServiceDependencies) {}

  /**
   * List customers with filtering, sorting, and pagination
   */
  async list(
    params?: QueryParams<CustomerSortField, CustomerFilters>
  ): Promise<PaginatedApiResponse<Customer[]>> {
    try {
      const { customers, total } = await this.deps.customerRepository.findAll(params);

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;

      return createPaginatedResponse(
        customers,
        calculatePaginationMeta(total, page, pageSize)
      );
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list customers',
        },
      };
    }
  }

  /**
   * Get a customer by ID
   */
  async getById(id: string): Promise<ApiResponse<Customer>> {
    try {
      const customer = await this.deps.customerRepository.findById(id);

      if (!customer) {
        return createErrorResponse('CUSTOMER_NOT_FOUND', `Customer ${id} not found`);
      }

      return createSuccessResponse(customer);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch customer'
      );
    }
  }

  /**
   * Create a new customer
   */
  async create(data: CreateCustomer): Promise<ApiResponse<Customer>> {
    try {
      // Validate input
      const validation = validateCreateCustomer(data);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid customer data',
            details: validation.error.errors,
          },
        };
      }

      // Check for potential duplicates
      const duplicates = await this.findPotentialDuplicates(validation.data);
      if (duplicates.length > 0) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_CUSTOMER',
            message: 'Potential duplicate customer found',
            details: {
              duplicates: duplicates.map((c) => ({
                id: c.id,
                name: `${c.firstName} ${c.lastName}`,
                email: c.email,
                phone: c.phone,
              })),
            },
          },
        };
      }

      const customer = await this.deps.customerRepository.create(validation.data);
      return createSuccessResponse(customer);
    } catch (error) {
      return createErrorResponse(
        'CREATE_ERROR',
        error instanceof Error ? error.message : 'Failed to create customer'
      );
    }
  }

  /**
   * Update a customer
   */
  async update(id: string, data: UpdateCustomer): Promise<ApiResponse<Customer>> {
    try {
      // Validate input
      const validation = validateUpdateCustomer(data);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validation.error.errors,
          },
        };
      }

      // Check if customer exists
      const existing = await this.deps.customerRepository.findById(id);
      if (!existing) {
        return createErrorResponse('CUSTOMER_NOT_FOUND', `Customer ${id} not found`);
      }

      // If email or phone is changing, check for duplicates
      if (data.email && data.email !== existing.email) {
        const emailExists = await this.deps.customerRepository.findByEmail(data.email);
        if (emailExists && emailExists.id !== id) {
          return createErrorResponse(
            'DUPLICATE_EMAIL',
            `Email ${data.email} is already in use by another customer`
          );
        }
      }

      if (data.phone && data.phone !== existing.phone) {
        const phoneExists = await this.deps.customerRepository.findByPhone(data.phone);
        if (phoneExists && phoneExists.id !== id) {
          return createErrorResponse(
            'DUPLICATE_PHONE',
            `Phone ${data.phone} is already in use by another customer`
          );
        }
      }

      // Perform update
      const updated = await this.deps.customerRepository.update(id, {
        ...data,
        id: undefined,
        metadata: undefined,
      });

      if (!updated) {
        return createErrorResponse('UPDATE_ERROR', 'Failed to update customer');
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to update customer'
      );
    }
  }

  /**
   * Delete a customer
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const exists = await this.deps.customerRepository.exists(id);
      if (!exists) {
        return createErrorResponse('CUSTOMER_NOT_FOUND', `Customer ${id} not found`);
      }

      // Check if customer has active projects
      if (this.deps.projectRepository) {
        const projects = await this.deps.projectRepository.findByClientId(id);
        const activeProjects = projects.filter(
          (p) => p.status !== 'complete' && p.status !== 'cancelled'
        );

        if (activeProjects.length > 0) {
          return createErrorResponse(
            'CUSTOMER_HAS_ACTIVE_PROJECTS',
            `Cannot delete customer with ${activeProjects.length} active project(s). Complete or cancel projects first.`
          );
        }
      }

      const deleted = await this.deps.customerRepository.delete(id);
      if (!deleted) {
        return createErrorResponse('DELETE_ERROR', 'Failed to delete customer');
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(
        'DELETE_ERROR',
        error instanceof Error ? error.message : 'Failed to delete customer'
      );
    }
  }

  /**
   * Search customers by query string
   */
  async searchCustomers(query: string): Promise<ApiResponse<Customer[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return createErrorResponse(
          'INVALID_QUERY',
          'Search query must be at least 2 characters'
        );
      }

      const customers = await this.deps.customerRepository.search(query.trim());
      return createSuccessResponse(customers);
    } catch (error) {
      return createErrorResponse(
        'SEARCH_ERROR',
        error instanceof Error ? error.message : 'Failed to search customers'
      );
    }
  }

  /**
   * Get customer with all their projects
   */
  async getCustomerWithProjects(id: string): Promise<ApiResponse<CustomerWithProjects>> {
    try {
      const customer = await this.deps.customerRepository.findById(id);
      if (!customer) {
        return createErrorResponse('CUSTOMER_NOT_FOUND', `Customer ${id} not found`);
      }

      const projects = this.deps.projectRepository
        ? await this.deps.projectRepository.findByClientId(id)
        : [];

      const totalProjects = projects.length;
      const activeProjects = projects.filter(
        (p) => p.status !== 'complete' && p.status !== 'cancelled'
      ).length;
      const completedProjects = projects.filter((p) => p.status === 'complete').length;

      return createSuccessResponse({
        customer,
        projects,
        totalProjects,
        activeProjects,
        completedProjects,
      });
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch customer with projects'
      );
    }
  }

  /**
   * Get customer history timeline
   */
  async getCustomerHistory(id: string): Promise<ApiResponse<CustomerHistoryEvent[]>> {
    try {
      const customer = await this.deps.customerRepository.findById(id);
      if (!customer) {
        return createErrorResponse('CUSTOMER_NOT_FOUND', `Customer ${id} not found`);
      }

      const events: CustomerHistoryEvent[] = [];

      // Add customer creation event
      events.push({
        id: `${customer.id}-created`,
        type: 'customer_created',
        date: customer.metadata.createdAt,
        description: `Customer account created`,
      });

      // Add customer update event if modified
      if (customer.metadata.updatedAt !== customer.metadata.createdAt) {
        events.push({
          id: `${customer.id}-updated`,
          type: 'customer_updated',
          date: customer.metadata.updatedAt,
          description: `Customer information updated`,
        });
      }

      // Add project events
      if (this.deps.projectRepository) {
        const projects = await this.deps.projectRepository.findByClientId(id);

        for (const project of projects) {
          events.push({
            id: `${project.id}-created`,
            type: 'project_created',
            date: project.metadata.createdAt,
            description: `Project "${project.name}" created`,
            projectId: project.id,
            projectName: project.name,
          });

          // Add project status changes if we had audit logs
          // For now, just add completion events
          if (project.status === 'complete' && project.dates.actualEndDate) {
            events.push({
              id: `${project.id}-completed`,
              type: 'project_status_change',
              date: project.dates.actualEndDate,
              description: `Project "${project.name}" completed`,
              projectId: project.id,
              projectName: project.name,
            });
          }
        }
      }

      // Sort by date descending (most recent first)
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return createSuccessResponse(events);
    } catch (error) {
      return createErrorResponse(
        'HISTORY_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch customer history'
      );
    }
  }

  /**
   * Find potential duplicate customers
   */
  async findPotentialDuplicates(data: Partial<CreateCustomer>): Promise<Customer[]> {
    return this.deps.customerRepository.findSimilar(data);
  }

  /**
   * Get preferred contact method for customer
   */
  getPreferredContact(customer: Customer): PreferredContact {
    const method = customer.preferredContactMethod;

    switch (method) {
      case 'email':
        return {
          method: 'email',
          value: customer.email,
          label: `Email: ${customer.email}`,
        };
      case 'phone':
        return {
          method: 'phone',
          value: customer.phone,
          label: `Phone: ${customer.phone}`,
        };
      case 'sms':
        return {
          method: 'sms',
          value: customer.phone,
          label: `SMS: ${customer.phone}`,
        };
      default:
        // Default to email if not specified
        return {
          method: 'email',
          value: customer.email,
          label: `Email: ${customer.email}`,
        };
    }
  }

  /**
   * Format customer address for display
   */
  formatCustomerAddress(customer: Customer, format: 'inline' | 'multiline' = 'inline'): string {
    if (!customer.address) {
      return 'No address on file';
    }

    const { street, unit, city, province, postalCode, country } = customer.address;

    const parts: string[] = [];

    // Street address
    if (street) {
      parts.push(unit ? `${street}, ${unit}` : street);
    }

    // City, Province PostalCode
    const cityLine: string[] = [];
    if (city) cityLine.push(city);
    if (province) cityLine.push(province);
    if (postalCode) cityLine.push(postalCode);

    if (cityLine.length > 0) {
      parts.push(cityLine.join(', '));
    }

    // Country
    if (country && country !== 'Canada') {
      parts.push(country);
    }

    return format === 'inline' ? parts.join(', ') : parts.join('\n');
  }
}
