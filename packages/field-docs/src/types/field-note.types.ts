/**
 * Field note types for field documentation
 */

export type FieldNoteType =
  | 'observation'
  | 'issue'
  | 'client_request'
  | 'material_delivery'
  | 'weather'
  | 'safety'
  | 'general';

export type InputMethod = 'typed' | 'voice';

export interface FieldNote {
  id: string;
  organization_id: string;
  project_id: string;
  property_id: string;

  // Context
  location_id: string | null;
  work_category_code: string | null;
  task_instance_id: string | null;

  // Content
  note_type: FieldNoteType;
  content: string;

  // Source
  input_method: InputMethod;
  voice_transcript: string | null;

  // Linked items
  photo_ids: string[];

  // Metadata
  created_at: string;
  created_by: string;

  // CYA flag
  flagged_for_co: boolean;
}

export interface CreateFieldNote {
  organization_id: string;
  project_id: string;
  property_id: string;
  location_id?: string;
  work_category_code?: string;
  task_instance_id?: string;
  note_type?: FieldNoteType;
  content: string;
  input_method?: InputMethod;
  voice_transcript?: string;
  photo_ids?: string[];
  created_by: string;
}

export interface UpdateFieldNote {
  location_id?: string | null;
  work_category_code?: string | null;
  task_instance_id?: string | null;
  note_type?: FieldNoteType;
  content?: string;
  photo_ids?: string[];
  flagged_for_co?: boolean;
}

export interface FieldNoteFilters {
  organization_id?: string;
  project_id?: string;
  property_id?: string;
  location_id?: string;
  work_category_code?: string;
  task_instance_id?: string;
  note_type?: FieldNoteType;
  created_by?: string;
  flagged_for_co?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface FieldNoteContext {
  location_id?: string;
  work_category_code?: string;
  task_instance_id?: string;
}

export interface VoiceNoteInput {
  project_id: string;
  property_id: string;
  audio_blob: Blob;
  context?: FieldNoteContext;
  note_type?: FieldNoteType;
}
