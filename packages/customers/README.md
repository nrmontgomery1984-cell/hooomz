# @hooomz/customers

Customer and client management module for the Hooomz construction management platform.

## Overview

This package handles customer relationship management including CRUD operations, search, duplicate detection, project tracking, and contact preferences.

## Features

- ✅ Customer CRUD operations
- ✅ Smart search across all customer fields
- ✅ Duplicate detection before creating customers
- ✅ Customer history timeline
- ✅ Project tracking per customer
- ✅ Contact preference management
- ✅ Address formatting utilities
- ✅ Repository pattern for data access abstraction
- ✅ Implements CustomerOperations from shared-contracts

## Architecture

### Repository Pattern

The module uses the repository pattern to abstract data access:
- **Interface**: `ICustomerRepository` - Abstract data access layer
- **Implementation**: `InMemoryCustomerRepository` - In-memory storage for testing/development
- **Purpose**: Allows swapping storage backends without changing business logic

### Service Layer

Business logic is encapsulated in the `CustomerService` class, which:
- Validates input data using Zod schemas
- Prevents duplicate customers
- Manages customer relationships
- Implements the CustomerOperations API contract

## Usage

### Basic Setup

```typescript
import {
  CustomerService,
  InMemoryCustomerRepository,
  type CustomerServiceDependencies
} from '@hooomz/customers';

// Create repository instance
const customerRepository = new InMemoryCustomerRepository();

// Create service with dependencies
const customerService = new CustomerService({
  customerRepository,
  // Optional: inject project repository for enhanced features
  // projectRepository
});
```

### CRUD Operations

```typescript
import { CustomerType, ContactMethod } from '@hooomz/shared-contracts';

// Create a customer
const createResponse = await customerService.create({
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
  phone: '506-555-0123',
  type: CustomerType.RESIDENTIAL,
  preferredContactMethod: ContactMethod.EMAIL,
  address: {
    street: '123 Main St',
    city: 'Fredericton',
    province: 'NB',
    postalCode: 'E3B 1A1',
    country: 'Canada'
  }
});

if (createResponse.success) {
  const customer = createResponse.data;
  console.log('Created customer:', customer.id);
}

// List customers with filtering
const listResponse = await customerService.list({
  filters: {
    type: CustomerType.RESIDENTIAL,
    search: 'Smith'
  },
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  pageSize: 20
});

// Get customer by ID
const getResponse = await customerService.getById('cust-123');

// Update customer
const updateResponse = await customerService.update('cust-123', {
  id: 'cust-123',
  preferredContactMethod: ContactMethod.PHONE
});

// Delete customer (prevents deletion if they have active projects)
const deleteResponse = await customerService.delete('cust-123');
```

### Customer Search

```typescript
// Search across all fields
const searchResponse = await customerService.searchCustomers('John');

if (searchResponse.success) {
  const customers = searchResponse.data;
  console.log(`Found ${customers.length} customers`);
}
```

### Duplicate Detection

```typescript
// Automatically checks for duplicates before creating
const createResponse = await customerService.create({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'existing@example.com', // Already exists
  phone: '506-555-9999',
  // ...
});

if (!createResponse.success && createResponse.error?.code === 'DUPLICATE_CUSTOMER') {
  console.log('Duplicate found:', createResponse.error.details);
  // {
  //   duplicates: [
  //     { id: 'cust-456', name: 'Jane Doe', email: 'existing@example.com', phone: '...' }
  //   ]
  // }
}

// Manual duplicate check
const duplicates = await customerService.findPotentialDuplicates({
  email: 'test@example.com'
});
```

### Customer with Projects

```typescript
const response = await customerService.getCustomerWithProjects('cust-123');

if (response.success) {
  const { customer, projects, totalProjects, activeProjects, completedProjects } = response.data;

  console.log('Customer:', customer.firstName, customer.lastName);
  console.log('Total Projects:', totalProjects);
  console.log('Active Projects:', activeProjects);
  console.log('Completed Projects:', completedProjects);

  projects.forEach(project => {
    console.log(`- ${project.name} (${project.status})`);
  });
}
```

### Customer History

```typescript
const historyResponse = await customerService.getCustomerHistory('cust-123');

if (historyResponse.success) {
  const events = historyResponse.data;

  events.forEach(event => {
    console.log(`[${event.date}] ${event.description}`);
    if (event.projectName) {
      console.log(`  Project: ${event.projectName}`);
    }
  });
}

// Example output:
// [2024-03-15] Project "Kitchen Renovation" completed
//   Project: Kitchen Renovation
// [2024-01-20] Project "Kitchen Renovation" created
//   Project: Kitchen Renovation
// [2024-01-15] Customer information updated
// [2024-01-10] Customer account created
```

### Contact Preferences

```typescript
// Get preferred contact method
const contact = customerService.getPreferredContact(customer);

console.log(contact.label); // "Email: john.smith@example.com"
console.log(contact.method); // "email"
console.log(contact.value);  // "john.smith@example.com"

// Use for sending communications
switch (contact.method) {
  case 'email':
    await sendEmail(contact.value, subject, body);
    break;
  case 'phone':
    await makePhoneCall(contact.value);
    break;
  case 'sms':
    await sendSMS(contact.value, message);
    break;
}
```

### Address Formatting

```typescript
// Inline format (for single line display)
const inline = customerService.formatCustomerAddress(customer, 'inline');
// "123 Main St, Fredericton, NB, E3B 1A1"

// Multiline format (for mailing labels, documents)
const multiline = customerService.formatCustomerAddress(customer, 'multiline');
// "123 Main St
//  Fredericton, NB, E3B 1A1"

// Use in documents
const invoice = `
Bill To:
${customer.firstName} ${customer.lastName}
${customerService.formatCustomerAddress(customer, 'multiline')}
`;
```

## Custom Repository Implementation

Implement `ICustomerRepository` for your database:

```typescript
import { ICustomerRepository } from '@hooomz/customers';
import type { Customer, CreateCustomer } from '@hooomz/shared-contracts';

class PostgresCustomerRepository implements ICustomerRepository {
  constructor(private db: DatabaseClient) {}

  async findById(id: string): Promise<Customer | null> {
    const result = await this.db.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const result = await this.db.query(
      'SELECT * FROM customers WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows[0] || null;
  }

  async search(query: string): Promise<Customer[]> {
    const result = await this.db.query(
      `SELECT * FROM customers
       WHERE first_name ILIKE $1
       OR last_name ILIKE $1
       OR email ILIKE $1
       OR phone LIKE $1`,
      [`%${query}%`]
    );
    return result.rows;
  }

  // Implement other methods...
}

// Use with service
const customerService = new CustomerService({
  customerRepository: new PostgresCustomerRepository(dbClient)
});
```

## Exports

```typescript
// Service
export { CustomerService, type CustomerServiceDependencies } from '@hooomz/customers';

// Repository
export {
  type ICustomerRepository,
  InMemoryCustomerRepository
} from '@hooomz/customers';

// Service types
export type {
  CustomerHistoryEvent,
  CustomerWithProjects,
  PreferredContact
} from '@hooomz/customers';

// Types (re-exported from shared-contracts)
export type {
  Customer,
  CreateCustomer,
  UpdateCustomer,
  CustomerType,
  ContactMethod
} from '@hooomz/customers';
```

## Dependencies

- `@hooomz/shared-contracts` - Types, validation, and utilities

## Integration with Projects

When integrated with the projects module:

```typescript
import { CustomerService } from '@hooomz/customers';
import { ProjectService } from '@hooomz/core';

const customerService = new CustomerService({
  customerRepository,
  projectRepository // Enables customer history and project tracking
});

// Now you can:
// - Get customer with all their projects
// - View customer history including project events
// - Prevent deletion of customers with active projects
```

## Business Rules

### Duplicate Prevention
- Checks for exact email matches
- Checks for exact phone matches (normalized)
- Checks for matching name + address combinations

### Deletion Protection
- Prevents deletion of customers with active projects
- Customers with only completed/cancelled projects can be deleted

### Contact Preferences
- Defaults to email if no preference specified
- Supports email, phone, and SMS

### Search
- Searches across: first name, last name, email, phone, company, address
- Case-insensitive
- Minimum 2 characters required

## Testing

The `InMemoryCustomerRepository` makes testing easy:

```typescript
import { CustomerService, InMemoryCustomerRepository } from '@hooomz/customers';

describe('CustomerService', () => {
  let service: CustomerService;
  let repository: InMemoryCustomerRepository;

  beforeEach(() => {
    repository = new InMemoryCustomerRepository();
    service = new CustomerService({ customerRepository: repository });
  });

  it('should prevent duplicate emails', async () => {
    await service.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '506-555-0123',
      type: 'residential',
      preferredContactMethod: 'email'
    });

    const duplicate = await service.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'john@example.com', // Same email
      phone: '506-555-9999',
      type: 'residential',
      preferredContactMethod: 'email'
    });

    expect(duplicate.success).toBe(false);
    expect(duplicate.error?.code).toBe('DUPLICATE_CUSTOMER');
  });
});
```

## Next Steps

- Implement concrete repository for your database
- Add customer notes/comments feature
- Integrate with email/SMS services
- Add customer tags and categorization
- Implement customer import/export
