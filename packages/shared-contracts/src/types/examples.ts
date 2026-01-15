/**
 * Example usage of the shared contracts types
 * This file demonstrates how to use the types and can be removed in production
 */

import type {
  Project,
  Customer,
  Task,
  LineItem,
  Inspection,
  Address,
} from '../schemas';
import {
  ProjectStatus,
  ProjectType,
  TaskStatus,
  TaskPriority,
  InspectionStatus,
  InspectionType,
  ContactMethod,
  UnitOfMeasure,
  CostCategory,
} from './index';

// Example Address
const exampleAddress: Address = {
  street: '123 Main Street',
  city: 'Fredericton',
  province: 'NB',
  postalCode: 'E3B 1A1',
  country: 'Canada',
};

// Example Customer
const exampleCustomer: Customer = {
  id: 'cust-001',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@example.com',
  phone: '506-555-1234',
  address: exampleAddress,
  notes: 'Prefers morning appointments',
  preferredContactMethod: ContactMethod.EMAIL,
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Example Project
const exampleProject: Project = {
  id: 'proj-001',
  name: 'Smith Kitchen Renovation',
  address: exampleAddress,
  status: ProjectStatus.IN_PROGRESS,
  projectType: ProjectType.KITCHEN_REMODEL,
  clientId: exampleCustomer.id,
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

// Example Task
const exampleTask: Task = {
  id: 'task-001',
  projectId: exampleProject.id,
  title: 'Install kitchen cabinets',
  description: 'Install custom oak cabinets',
  status: TaskStatus.IN_PROGRESS,
  priority: TaskPriority.HIGH,
  assignedTo: 'Mike Johnson',
  dueDate: '2024-02-15',
  dependencies: [],
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Example LineItem
const exampleLineItem: LineItem = {
  id: 'line-001',
  projectId: exampleProject.id,
  category: CostCategory.CABINETS_COUNTERTOPS,
  description: 'Custom oak kitchen cabinets',
  quantity: 12,
  unit: UnitOfMeasure.EACH,
  unitCost: 850,
  totalCost: 10200,
  isLabor: false,
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// Example Inspection
const exampleInspection: Inspection = {
  id: 'insp-001',
  projectId: exampleProject.id,
  inspectionType: InspectionType.ELECTRICAL,
  date: '2024-02-10',
  status: InspectionStatus.PASSED,
  notes: 'All electrical work meets code requirements',
  photos: ['photo-001.jpg', 'photo-002.jpg'],
  inspector: 'Sarah Williams',
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export {
  exampleAddress,
  exampleCustomer,
  exampleProject,
  exampleTask,
  exampleLineItem,
  exampleInspection,
};
