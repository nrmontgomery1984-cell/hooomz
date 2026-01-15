/**
 * Field Docs module-specific types
 */

// Re-export inspection types
export type {
  InspectionType,
  InspectionStatus,
  Inspection,
  CreateInspection,
  UpdateInspection,
  InspectionFilters,
  InspectionResult,
  IInspectionRepository,
} from '../inspections/inspection.repository';

export type {
  InspectionServiceDependencies,
  InspectionWithContext,
} from '../inspections/inspection.service';

// Re-export photo types
export type {
  PhotoMetadata,
  Photo,
  CreatePhoto,
  UpdatePhoto,
  PhotoFilters,
  IPhotoRepository,
} from '../photos/photo.repository';

export type {
  PhotoServiceDependencies,
  PhotosByDate,
  PhotoStats,
} from '../photos/photo.service';

// Re-export checklist types
export type {
  ChecklistItemStatus,
  ChecklistItem,
  ChecklistTemplate,
  ChecklistInstanceItem,
  ChecklistInstance,
  CreateChecklistInstance,
  UpdateChecklistItem,
  ChecklistProgress,
} from '../checklists/checklist.service';
