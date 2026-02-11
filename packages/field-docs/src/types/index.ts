/**
 * Field Docs module types
 */

// Photo types
export type {
  Photo,
  CreatePhoto,
  UpdatePhoto,
  PhotoFilters,
  PhotoContext,
  PhotoUploadRequest,
  PhotosByDate,
  PhotoStats,
} from './photo.types';

// Document types
export type {
  DocumentCategory,
  Document,
  CreateDocument,
  UpdateDocument,
  DocumentFilters,
  DocumentUploadRequest,
  DocumentVersion,
  DocumentWithVersions,
} from './document.types';

// Inspection types
export type {
  InspectionType,
  InspectionStatus,
  Inspection,
  CreateInspection,
  UpdateInspection,
  InspectionFilters,
  InspectionResult,
  UpcomingInspection,
} from './inspection.types';

// Field note types
export type {
  FieldNoteType,
  InputMethod,
  FieldNote,
  CreateFieldNote,
  UpdateFieldNote,
  FieldNoteFilters,
  FieldNoteContext,
  VoiceNoteInput,
} from './field-note.types';
