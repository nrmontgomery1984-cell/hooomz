/**
 * Field Docs services
 */

export { PhotoService } from './photo.service';
export type {
  PhotoServiceDependencies,
  ActivityService as PhotoActivityService,
  StorageService as PhotoStorageService,
} from './photo.service';

export { DocumentService } from './document.service';
export type {
  DocumentServiceDependencies,
  ActivityService as DocumentActivityService,
  StorageService as DocumentStorageService,
} from './document.service';

export { InspectionService } from './inspection.service';
export type {
  InspectionServiceDependencies,
  ActivityService as InspectionActivityService,
} from './inspection.service';

export { FieldNoteService } from './field-note.service';
export type {
  FieldNoteServiceDependencies,
  ActivityService as FieldNoteActivityService,
  TranscriptionService,
} from './field-note.service';
