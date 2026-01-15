/**
 * Verify that all exports are working correctly
 */

import {
  // Service
  CustomerService,
  type CustomerServiceDependencies,

  // Repository
  type ICustomerRepository,
  InMemoryCustomerRepository,

  // Service types
  type CustomerHistoryEvent,
  type CustomerWithProjects,
  type PreferredContact,

  // Re-exported types from shared-contracts
  type Customer,
  type CreateCustomer,
  type UpdateCustomer,
  type CustomerType,
  type ContactMethod,
} from './index';

console.log('✅ All exports verified successfully!');

// Type checks
const _typeCheck1: typeof CustomerService = CustomerService;
const _typeCheck2: typeof InMemoryCustomerRepository = InMemoryCustomerRepository;

// Verify instantiation
const repository = new InMemoryCustomerRepository();
const service = new CustomerService({ customerRepository: repository });

console.log('✅ Service and repository instantiation successful!');
console.log('✅ Package is ready to use!');
