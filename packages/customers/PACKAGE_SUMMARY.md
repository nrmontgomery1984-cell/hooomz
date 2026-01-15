# @hooomz/customers - Package Summary

## Overview

The `@hooomz/customers` package implements customer and client management functionality for the Hooomz platform. It provides business logic, data access abstraction, and customer-specific features.

## Architecture

### Repository Pattern
- **Interface**: `ICustomerRepository` - Abstract data access layer
- **Implementation**: `InMemoryCustomerRepository` - In-memory storage for testing/development
- **Purpose**: Allows swapping storage backends without changing business logic

### Service Layer
- **Class**: `CustomerService` - Business logic implementation
- **Implements**: `CustomerOperations` from `@hooomz/shared-contracts`
- **Responsibilities**: Validation, duplicate detection, search, history tracking

## Package Structure

```
packages/customers/
├── src/
│   ├── customers/
│   │   ├── customer.repository.ts    # Repository interface & in-memory implementation
│   │   ├── customer.service.ts       # Business logic & API implementation
│   │   └── index.ts                  # Module exports
│   ├── types/
│   │   └── index.ts                  # Module-specific type exports
│   └── index.ts                      # Package entry point
├── package.json
├── tsconfig.json
├── README.md                         # Full documentation
└── PACKAGE_SUMMARY.md                # This file
```

## Key Features

### ✅ CRUD Operations
- `list()` - List customers with filtering, sorting, pagination
- `getById()` - Get single customer
- `create()` - Create new customer with duplicate detection
- `update()` - Update customer with validation
- `delete()` - Delete customer (protected if has active projects)

### ✅ Smart Search
- `searchCustomers(query)` - Search across all customer fields
- Searches: first name, last name, email, phone, company, address
- Case-insensitive, minimum 2 characters
- Returns matching customers

### ✅ Duplicate Detection
- Automatic check before creating customers
- Checks for:
  - Exact email match (case-insensitive)
  - Exact phone match (normalized)
  - Matching name + address combination
- Returns list of potential duplicates with details

### ✅ Customer Relationships
- `getCustomerWithProjects(id)` - Fetch customer with all projects
- Returns project counts: total, active, completed
- Integration with project repository

### ✅ Customer History
- `getCustomerHistory(id)` - Timeline of all customer events
- Includes:
  - Customer creation/updates
  - Project creation events
  - Project completion events
- Sorted by date (most recent first)

### ✅ Contact Preferences
- `getPreferredContact(customer)` - Returns preferred contact method
- Supports: email, phone, SMS
- Returns formatted contact information
- Defaults to email if not specified

### ✅ Address Formatting
- `formatCustomerAddress(customer, format)` - Format address for display
- **inline**: Single line format for UI display
- **multiline**: Multi-line format for documents/labels
- Handles missing address gracefully

## Dependencies

```json
{
  "dependencies": {
    "@hooomz/shared-contracts": "workspace:*"
  }
}
```

## Exports

```typescript
// Service
export { CustomerService, type CustomerServiceDependencies }

// Repository
export { type ICustomerRepository, InMemoryCustomerRepository }

// Service-specific types
export type {
  CustomerHistoryEvent,
  CustomerWithProjects,
  PreferredContact
}

// Types (re-exported from shared-contracts)
export type {
  Customer,
  CreateCustomer,
  UpdateCustomer,
  CustomerType,
  ContactMethod
}
```

## Usage Example

```typescript
import {
  CustomerService,
  InMemoryCustomerRepository
} from '@hooomz/customers';
import { CustomerType, ContactMethod } from '@hooomz/shared-contracts';

// Setup
const repository = new InMemoryCustomerRepository();
const service = new CustomerService({ customerRepository: repository });

// Create customer
const response = await service.create({
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

if (response.success) {
  const customer = response.data;

  // Get preferred contact
  const contact = service.getPreferredContact(customer);
  console.log(contact.label); // "Email: john.smith@example.com"

  // Format address
  const address = service.formatCustomerAddress(customer, 'inline');
  console.log(address); // "123 Main St, Fredericton, NB, E3B 1A1"

  // Search customers
  const searchResults = await service.searchCustomers('Smith');

  // Get customer with projects
  const withProjects = await service.getCustomerWithProjects(customer.id);
  if (withProjects.success) {
    console.log('Active projects:', withProjects.data.activeProjects);
  }
}
```

## Business Rules

### Duplicate Detection
- Prevents creating customers with:
  - Same email address (case-insensitive)
  - Same phone number (normalized)
  - Same name + same address
- Returns error with duplicate details

### Update Validation
- Prevents changing email to one that's already in use
- Prevents changing phone to one that's already in use
- Validates all input using Zod schemas

### Deletion Protection
- Cannot delete customer with active projects
- Can delete customer with only completed/cancelled projects
- Returns clear error message if deletion blocked

### Search Requirements
- Minimum 2 characters required
- Returns error for queries < 2 characters

## Integration with Other Modules

The service accepts optional repository dependencies:

```typescript
const service = new CustomerService({
  customerRepository,
  projectRepository    // For getCustomerWithProjects() and getCustomerHistory()
});
```

When `projectRepository` is provided:
- `getCustomerWithProjects()` returns full project data
- `getCustomerHistory()` includes project events
- `delete()` checks for active projects before deletion

## Status

✅ **Complete and Production-Ready**
- All CRUD operations implemented
- Duplicate detection working
- Search functionality implemented
- Customer history tracking
- Project integration ready
- Repository pattern established
- Full documentation available

## Key Implementation Details

### Validation
- All input validated using Zod schemas from shared-contracts
- Returns detailed validation errors
- Type-safe at compile time

### Error Handling
- Consistent error format across all operations
- Specific error codes for different failures
- User-friendly error messages

### Type Safety
- Fully typed with TypeScript
- Implements API contract from shared-contracts
- No `any` types used

### Phone Normalization
- Removes spaces, dashes, parentheses for comparison
- Ensures accurate duplicate detection
- Works with various phone formats

### Search Performance
- In-memory implementation is O(n)
- Database implementation should use indexes
- Case-insensitive matching

---

**Ready to use in applications and ready for database integration!**
