import { z } from 'zod';
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
} from '../types';
import {
  POSTAL_CODE_REGEX,
  PHONE_REGEX,
  EMAIL_REGEX,
} from '../constants';

// Enum Schemas
export const ProjectStatusSchema = z.nativeEnum(ProjectStatus);
export const ProjectTypeSchema = z.nativeEnum(ProjectType);
export const TaskStatusSchema = z.nativeEnum(TaskStatus);
export const TaskPrioritySchema = z.nativeEnum(TaskPriority);
export const InspectionStatusSchema = z.nativeEnum(InspectionStatus);
export const InspectionTypeSchema = z.nativeEnum(InspectionType);
export const ContactMethodSchema = z.nativeEnum(ContactMethod);
export const UnitOfMeasureSchema = z.nativeEnum(UnitOfMeasure);
export const CostCategorySchema = z.nativeEnum(CostCategory);

// Supporting Schemas
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().length(2, 'Province must be 2 characters'),
  postalCode: z.string().regex(POSTAL_CODE_REGEX, 'Invalid postal code format'),
  country: z.string().min(1, 'Country is required'),
});

export const MetadataSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Core Entity Schemas

// Project Schema
export const ProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Project name is required').max(200),
  address: AddressSchema,
  status: ProjectStatusSchema,
  projectType: ProjectTypeSchema,
  clientId: z.string().min(1, 'Client ID is required'),
  dates: z.object({
    startDate: z.string().date().optional(),
    estimatedEndDate: z.string().date().optional(),
    actualEndDate: z.string().date().optional(),
  }),
  budget: z.object({
    estimatedCost: z.number().nonnegative('Estimated cost must be non-negative'),
    actualCost: z.number().nonnegative('Actual cost must be non-negative'),
  }),
  metadata: MetadataSchema,
});

// Customer Schema
export const CustomerSchema = z.object({
  id: z.string().min(1, 'Customer ID is required'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email format').regex(EMAIL_REGEX, 'Invalid email format'),
  phone: z.string().regex(PHONE_REGEX, 'Invalid phone number format'),
  address: AddressSchema,
  notes: z.string().max(2000).optional(),
  preferredContactMethod: ContactMethodSchema,
  metadata: MetadataSchema,
});

// Task Schema
export const TaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  assignedTo: z.string().max(100).optional(),
  dueDate: z.string().date().optional(),
  dependencies: z.array(z.string()),
  metadata: MetadataSchema,
});

// LineItem Schema
export const LineItemSchema = z.object({
  id: z.string().min(1, 'Line item ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  category: CostCategorySchema,
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive'),
  unit: UnitOfMeasureSchema,
  unitCost: z.number().nonnegative('Unit cost must be non-negative'),
  totalCost: z.number().nonnegative('Total cost must be non-negative'),
  isLabor: z.boolean(),
  metadata: MetadataSchema,
}).refine(
  (data) => Math.abs(data.totalCost - data.quantity * data.unitCost) < 0.01,
  {
    message: 'Total cost must equal quantity × unit cost',
    path: ['totalCost'],
  }
);

// Inspection Schema
export const InspectionSchema = z.object({
  id: z.string().min(1, 'Inspection ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  inspectionType: InspectionTypeSchema,
  date: z.string().date(),
  status: InspectionStatusSchema,
  notes: z.string().max(2000).optional(),
  photos: z.array(z.string()),
  inspector: z.string().max(100).optional(),
  metadata: MetadataSchema,
});

// Create Schemas (without id and metadata)

export const CreateProjectSchema = ProjectSchema.omit({ id: true, metadata: true }).extend({
  budget: z.object({
    estimatedCost: z.number().nonnegative('Estimated cost must be non-negative'),
    actualCost: z.number().nonnegative('Actual cost must be non-negative').default(0),
  }),
});

export const CreateCustomerSchema = CustomerSchema.omit({ id: true, metadata: true });

export const CreateTaskSchema = TaskSchema.omit({ id: true, metadata: true }).extend({
  dependencies: z.array(z.string()).default([]),
});

export const CreateLineItemSchema = LineItemSchema.omit({ id: true, metadata: true });

export const CreateInspectionSchema = InspectionSchema.omit({ id: true, metadata: true }).extend({
  photos: z.array(z.string()).default([]),
});

// Update Schemas (all fields optional except id)

export const UpdateProjectSchema = ProjectSchema.partial().required({ id: true });

export const UpdateCustomerSchema = CustomerSchema.partial().required({ id: true });

export const UpdateTaskSchema = TaskSchema.partial().required({ id: true });

export const UpdateLineItemSchema = LineItemSchema.partial().required({ id: true });

export const UpdateInspectionSchema = InspectionSchema.partial().required({ id: true });

// Inferred Types - These become the canonical types

export type Project = z.infer<typeof ProjectSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type Inspection = z.infer<typeof InspectionSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;

export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type CreateLineItem = z.infer<typeof CreateLineItemSchema>;
export type CreateInspection = z.infer<typeof CreateInspectionSchema>;

export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
export type UpdateLineItem = z.infer<typeof UpdateLineItemSchema>;
export type UpdateInspection = z.infer<typeof UpdateInspectionSchema>;

// Validation Helper Functions

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: z.ZodError;
}

export function validateProject(data: unknown): ValidationResult<Project> {
  const result = ProjectSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateCreateProject(data: unknown): ValidationResult<CreateProject> {
  const result = CreateProjectSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateUpdateProject(data: unknown): ValidationResult<UpdateProject> {
  const result = UpdateProjectSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateCustomer(data: unknown): ValidationResult<Customer> {
  const result = CustomerSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateCreateCustomer(data: unknown): ValidationResult<CreateCustomer> {
  const result = CreateCustomerSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateUpdateCustomer(data: unknown): ValidationResult<UpdateCustomer> {
  const result = UpdateCustomerSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateTask(data: unknown): ValidationResult<Task> {
  const result = TaskSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateCreateTask(data: unknown): ValidationResult<CreateTask> {
  const result = CreateTaskSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateUpdateTask(data: unknown): ValidationResult<UpdateTask> {
  const result = UpdateTaskSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateLineItem(data: unknown): ValidationResult<LineItem> {
  const result = LineItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateCreateLineItem(data: unknown): ValidationResult<CreateLineItem> {
  const result = CreateLineItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateUpdateLineItem(data: unknown): ValidationResult<UpdateLineItem> {
  const result = UpdateLineItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateInspection(data: unknown): ValidationResult<Inspection> {
  const result = InspectionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateCreateInspection(data: unknown): ValidationResult<CreateInspection> {
  const result = CreateInspectionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateUpdateInspection(data: unknown): ValidationResult<UpdateInspection> {
  const result = UpdateInspectionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateAddress(data: unknown): ValidationResult<Address> {
  const result = AddressSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
