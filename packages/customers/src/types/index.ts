/**
 * Customers module-specific types
 *
 * This file can contain additional types specific to the customers module
 * that extend or complement the shared contracts.
 */

// Re-export commonly used types from shared-contracts for convenience
export type {
  Customer,
  CreateCustomer,
  UpdateCustomer,
  CustomerType,
  ContactMethod,
  CustomerOperations,
} from '@hooomz/shared-contracts';

// Re-export customer service types
export type {
  CustomerHistoryEvent,
  CustomerWithProjects,
  PreferredContact,
} from '../customers/customer.service';
