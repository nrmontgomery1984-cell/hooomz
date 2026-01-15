/**
 * Example usage of Zod schemas and validation functions
 * This file demonstrates runtime validation and can be removed in production
 */

import {
  validateProject,
  validateCreateProject,
  validateUpdateProject,
  validateCustomer,
  validateCreateCustomer,
  validateLineItem,
  type Project,
  type CreateProject,
  type UpdateProject,
  ProjectSchema,
  CreateProjectSchema,
} from './index';
import {
  ProjectStatus,
  ProjectType,
  ContactMethod,
  UnitOfMeasure,
  CostCategory,
} from '../types';

// Example: Validating a complete project
const validProject = {
  id: 'proj-001',
  name: 'Smith Kitchen Renovation',
  address: {
    street: '123 Main Street',
    city: 'Fredericton',
    province: 'NB',
    postalCode: 'E3B 1A1',
    country: 'Canada',
  },
  status: ProjectStatus.IN_PROGRESS,
  projectType: ProjectType.KITCHEN_REMODEL,
  clientId: 'cust-001',
  dates: {
    startDate: '2024-01-15',
    estimatedEndDate: '2024-03-01',
  },
  budget: {
    estimatedCost: 45000,
    actualCost: 42500,
  },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const projectValidation = validateProject(validProject);
if (projectValidation.success) {
  console.log('Valid project:', projectValidation.data);
} else {
  console.error('Validation errors:', projectValidation.error.errors);
}

// Example: Creating a new project (without id and metadata)
const newProjectData: CreateProject = {
  name: 'Jones Bathroom Remodel',
  address: {
    street: '456 Oak Avenue',
    city: 'Moncton',
    province: 'NB',
    postalCode: 'E1C 2B3',
    country: 'Canada',
  },
  status: ProjectStatus.QUOTED,
  projectType: ProjectType.BATHROOM_REMODEL,
  clientId: 'cust-002',
  dates: {},
  budget: {
    estimatedCost: 18500,
    actualCost: 0,
  },
};

const createValidation = validateCreateProject(newProjectData);
if (createValidation.success) {
  console.log('Valid new project:', createValidation.data);
  // At this point, you would:
  // 1. Generate an ID (e.g., using UUID)
  // 2. Add metadata with current timestamps
  // 3. Save to database
}

// Example: Updating a project (partial update)
const updateData: UpdateProject = {
  id: 'proj-001',
  status: ProjectStatus.COMPLETE,
  dates: {
    actualEndDate: '2024-02-28',
  },
  budget: {
    actualCost: 43200,
  },
};

const updateValidation = validateUpdateProject(updateData);
if (updateValidation.success) {
  console.log('Valid update:', updateValidation.data);
}

// Example: Invalid data showing validation errors
const invalidProject = {
  id: '', // Empty string - will fail
  name: '', // Empty string - will fail
  address: {
    street: '123 Main',
    city: 'Fredericton',
    province: 'NEW BRUNSWICK', // Wrong format - should be 2 chars
    postalCode: '12345', // Wrong format - should be Canadian
    country: 'Canada',
  },
  status: 'invalid-status', // Not a valid enum value
  projectType: ProjectType.KITCHEN_REMODEL,
  clientId: 'cust-001',
  dates: {},
  budget: {
    estimatedCost: -1000, // Negative - will fail
    actualCost: -500, // Negative - will fail
  },
  metadata: {
    createdAt: 'not-a-date', // Invalid datetime format
    updatedAt: 'not-a-date', // Invalid datetime format
  },
};

const invalidValidation = validateProject(invalidProject);
if (!invalidValidation.success) {
  console.error('Expected validation errors:');
  invalidValidation.error.errors.forEach((err) => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`);
  });
}

// Example: Creating a customer with validation
const newCustomerData = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '506-555-9876',
  address: {
    street: '789 Pine Road',
    city: 'Saint John',
    province: 'NB',
    postalCode: 'E2K 3L4',
    country: 'Canada',
  },
  preferredContactMethod: ContactMethod.EMAIL,
};

const customerValidation = validateCreateCustomer(newCustomerData);
if (customerValidation.success) {
  console.log('Valid customer:', customerValidation.data);
}

// Example: Using schemas directly with parse (throws on error)
try {
  const project: Project = ProjectSchema.parse(validProject);
  console.log('Parsed project:', project);
} catch (error) {
  console.error('Parse error:', error);
}

// Example: Using safeParse for non-throwing validation
const result = CreateProjectSchema.safeParse(newProjectData);
if (result.success) {
  console.log('Safe parse success:', result.data);
} else {
  console.error('Safe parse errors:', result.error.errors);
}

// Example: LineItem validation with totalCost calculation check
const lineItemData = {
  projectId: 'proj-001',
  category: CostCategory.CABINETS_COUNTERTOPS,
  description: 'Custom oak cabinets',
  quantity: 10,
  unit: UnitOfMeasure.EACH,
  unitCost: 850,
  totalCost: 8500, // Correctly calculated
  isLabor: false,
};

const lineItemValidation = validateLineItem({
  ...lineItemData,
  id: 'line-001',
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});

if (lineItemValidation.success) {
  console.log('Valid line item:', lineItemValidation.data);
}

// Example: LineItem with incorrect totalCost
const invalidLineItem = {
  ...lineItemData,
  totalCost: 9999, // Wrong calculation: should be 8500
  id: 'line-002',
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const invalidLineItemValidation = validateLineItem(invalidLineItem);
if (!invalidLineItemValidation.success) {
  console.error('LineItem validation error:');
  console.error(invalidLineItemValidation.error.errors[0].message);
  // Output: "Total cost must equal quantity × unit cost"
}

export {
  validProject,
  newProjectData,
  updateData,
  invalidProject,
  newCustomerData,
  lineItemData,
};
