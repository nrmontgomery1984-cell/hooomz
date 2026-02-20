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
  unit: z.string().max(50).optional(),
  city: z.string().min(1, 'City is required'),
  province: z.string().length(2, 'Province must be 2 characters'),
  postalCode: z.string().regex(POSTAL_CODE_REGEX, 'Invalid postal code format'),
  country: z.string().min(1, 'Country is required'),
});

export const MetadataSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().positive().default(1),
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
  // Integration fields (Build 1.5 — all optional for backward compatibility)
  integrationProjectType: z.enum(['standard', 'callback']).optional(),
  linkedProjectId: z.string().nullable().optional(),
  callbackReason: z.enum(['warranty_claim', 'quality_issue', 'customer_complaint', 'proactive_followup']).nullable().optional(),
  callbackReportedAt: z.string().nullable().optional(),
  observationModeOverride: z.enum(['minimal', 'standard', 'detailed']).nullable().optional(),
  activeExperimentIds: z.array(z.string()).optional(),
});

// Customer Type Schema
export const CustomerTypeSchema = z.enum(['residential', 'commercial']);

// Customer Schema
export const CustomerSchema = z.object({
  id: z.string().min(1, 'Customer ID is required'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email format').regex(EMAIL_REGEX, 'Invalid email format'),
  phone: z.string().regex(PHONE_REGEX, 'Invalid phone number format'),
  type: CustomerTypeSchema.default('residential'),
  company: z.string().max(200).optional(),
  address: AddressSchema,
  tags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
  preferredContactMethod: ContactMethodSchema,
  metadata: MetadataSchema,
});

export type CustomerType = z.infer<typeof CustomerTypeSchema>;

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
  // Integration fields (Build 1.5 — all optional for backward compatibility)
  workSource: z.enum(['estimate', 'change_order', 'uncaptured']).optional(),
  workSourceId: z.string().nullable().optional(),
  changeOrderId: z.string().nullable().optional(),
  changeOrderLineItemId: z.string().nullable().optional(),
  isUncaptured: z.boolean().optional(),
  uncapturedResolution: z.enum(['converted_to_co', 'absorbed', 'deleted']).nullable().optional(),
  uncapturedResolvedAt: z.string().nullable().optional(),
  uncapturedResolvedBy: z.string().nullable().optional(),
  sopVersionId: z.string().optional(),
  sopVersionNumber: z.number().optional(),
  // Build 3b: Task Instance Pipeline — SOP and estimate traceability
  sopId: z.string().optional(),
  sopCode: z.string().optional(),
  estimateLineItemId: z.string().optional(),
  blueprintId: z.string().optional(),
  // Build 3d: Loop Management — location binding
  loopIterationId: z.string().optional(),
  // Labs Bridge: flag task for labs observation capture
  labsFlagged: z.boolean().optional(),
  // Workflow: construction sequencing
  sortOrder: z.number().optional(),
  workflowId: z.string().optional(),
});

// LineItem Base Schema (without refinement for .omit() compatibility)
export const LineItemBaseSchema = z.object({
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
  // Build 3b: Task Instance Pipeline — SOP mapping and loop context
  sopCodes: z.array(z.string()).optional(),
  loopContextLabel: z.string().optional(),
  isLooped: z.boolean().optional(),
  estimatedHoursPerUnit: z.number().optional(),
  // Three-axis tagging (optional for backward compatibility)
  workCategoryCode: z.string().optional(),
  stageCode: z.string().optional(),
  locationLabel: z.string().optional(),
});

// LineItem Schema with validation refinement
export const LineItemSchema = LineItemBaseSchema.refine(
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

// Photo Location Schema
export const PhotoLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
});

// Photo Schema
export const PhotoSchema = z.object({
  id: z.string().min(1, 'Photo ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  inspectionId: z.string().optional(),
  filePath: z.string().min(1, 'File path is required'),
  fileSize: z.number().nonnegative(),
  mimeType: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  thumbnailPath: z.string().optional(),
  caption: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  location: PhotoLocationSchema.optional(),
  timestamp: z.string().datetime(),
  takenBy: z.string().optional(),
  deviceInfo: z.string().optional(),
  uploadedToCloud: z.boolean().default(false),
  metadata: MetadataSchema,
});

// Estimate Status Enum Schema
export const EstimateStatusSchema = z.enum(['draft', 'sent', 'approved', 'rejected', 'expired']);

// Estimate Schema
export const EstimateSchema = z.object({
  id: z.string().min(1, 'Estimate ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  status: EstimateStatusSchema,
  lineItems: z.array(z.string()), // References to LineItem IDs
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
  validUntil: z.string().date().optional(),
  notes: z.string().max(2000).optional(),
  metadata: MetadataSchema,
});

// Catalog Item Schema
export const CatalogItemSchema = z.object({
  id: z.string().min(1, 'Catalog item ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  category: CostCategorySchema,
  unit: UnitOfMeasureSchema,
  unitCost: z.number().nonnegative('Unit cost must be non-negative'),
  isLabor: z.boolean(),
  tags: z.array(z.string()).default([]),
  metadata: MetadataSchema,
});

// Workflow Schemas (Labs — construction sequencing)

export const WorkflowStatusSchema = z.enum(['active', 'draft', 'archived']);

export const WorkflowPhaseSchema = z.object({
  phaseCode: z.string(),
  name: z.string(),
  order: z.number(),
  stageCode: z.string(),
  tradeCodes: z.array(z.string()),
  sopCodes: z.array(z.string()),
  description: z.string().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: WorkflowStatusSchema,
  isDefault: z.boolean(),
  phases: z.array(WorkflowPhaseSchema),
  metadata: MetadataSchema,
});

export const CreateWorkflowSchema = WorkflowSchema.omit({ id: true, metadata: true });
export const UpdateWorkflowSchema = WorkflowSchema.partial().required({ id: true });

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

export const CreateLineItemSchema = LineItemBaseSchema.omit({ id: true, metadata: true });

export const CreateInspectionSchema = InspectionSchema.omit({ id: true, metadata: true }).extend({
  photos: z.array(z.string()).default([]),
});

export const CreatePhotoSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  inspectionId: z.string().optional(),
  filePath: z.string().min(1, 'File path is required'),
  fileSize: z.number().nonnegative(),
  mimeType: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  thumbnailPath: z.string().optional(),
  metadata: z.object({
    caption: z.string().max(500).optional(),
    tags: z.array(z.string()).default([]),
    location: PhotoLocationSchema.optional(),
    timestamp: z.string().datetime(),
    takenBy: z.string().optional(),
    deviceInfo: z.string().optional(),
  }),
});

export const CreateEstimateSchema = EstimateSchema.omit({ id: true, metadata: true }).extend({
  lineItems: z.array(z.string()).default([]),
});

export const CreateCatalogItemSchema = CatalogItemSchema.omit({ id: true, metadata: true }).extend({
  tags: z.array(z.string()).default([]),
});

// Update Schemas (all fields optional except id)

export const UpdateProjectSchema = ProjectSchema.partial().required({ id: true });

export const UpdateCustomerSchema = CustomerSchema.partial().required({ id: true });

export const UpdateTaskSchema = TaskSchema.partial().required({ id: true });

export const UpdateLineItemSchema = LineItemBaseSchema.partial().required({ id: true });

export const UpdateInspectionSchema = InspectionSchema.partial().required({ id: true });

export const UpdatePhotoSchema = PhotoSchema.omit({ id: true, metadata: true, projectId: true }).partial();

export const UpdateEstimateSchema = EstimateSchema.partial().required({ id: true });

export const UpdateCatalogItemSchema = CatalogItemSchema.partial().required({ id: true });

// Inferred Types - These become the canonical types

export type Project = z.infer<typeof ProjectSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type Inspection = z.infer<typeof InspectionSchema>;
export type PhotoLocation = z.infer<typeof PhotoLocationSchema>;
export type Photo = z.infer<typeof PhotoSchema>;
export type Estimate = z.infer<typeof EstimateSchema>;
export type EstimateStatus = z.infer<typeof EstimateStatusSchema>;
export type CatalogItem = z.infer<typeof CatalogItemSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;

export type WorkflowPhase = z.infer<typeof WorkflowPhaseSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;
export type CreateWorkflow = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflow = z.infer<typeof UpdateWorkflowSchema>;

export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type CreateLineItem = z.infer<typeof CreateLineItemSchema>;
export type CreateInspection = z.infer<typeof CreateInspectionSchema>;
export type CreatePhoto = z.infer<typeof CreatePhotoSchema>;
export type CreateEstimate = z.infer<typeof CreateEstimateSchema>;
export type CreateCatalogItem = z.infer<typeof CreateCatalogItemSchema>;

export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
export type UpdateLineItem = z.infer<typeof UpdateLineItemSchema>;
export type UpdateInspection = z.infer<typeof UpdateInspectionSchema>;
export type UpdatePhoto = z.infer<typeof UpdatePhotoSchema>;
export type UpdateEstimate = z.infer<typeof UpdateEstimateSchema>;
export type UpdateCatalogItem = z.infer<typeof UpdateCatalogItemSchema>;

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
