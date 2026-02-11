export interface Photo {
  id: string;
  organization_id: string;
  project_id: string;
  property_id: string;
  task_instance_id: string | null;
  loop_iteration_id: string | null;
  file_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  tags: string[];
  taken_at: string;
  uploaded_at: string;
  uploaded_by: string;
  homeowner_visible: boolean;
  gps_location: GpsCoordinate | null;
  captured_offline: boolean;
}

export interface GpsCoordinate {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type PhotoTag =
  | 'before'
  | 'during'
  | 'after'
  | 'issue'
  | 'material'
  | 'inspection'
  | 'progress'
  | 'detail';

export interface Inspection {
  id: string;
  organization_id: string;
  project_id: string;
  property_id: string;
  inspection_type: string;
  scheduled_date: string | null;
  completed_date: string | null;
  status: InspectionStatus;
  result: InspectionResult | null;
  inspector_name: string | null;
  notes: string | null;
  permit_number: string | null;
}

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type InspectionResult = 'passed' | 'failed' | 'conditional';

export interface Document {
  id: string;
  organization_id: string;
  project_id: string;
  property_id: string;
  name: string;
  document_type: DocumentType;
  file_url: string;
  uploaded_at: string;
  uploaded_by: string;
  homeowner_visible: boolean;
}

export type DocumentType =
  | 'permit'
  | 'contract'
  | 'warranty'
  | 'manual'
  | 'inspection_report'
  | 'other';
