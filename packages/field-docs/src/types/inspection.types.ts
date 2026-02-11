/**
 * Inspection types for field documentation
 */

export type InspectionType =
  | 'building_permit'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'framing'
  | 'insulation'
  | 'fire'
  | 'final'
  | 'other';

export type InspectionStatus = 'scheduled' | 'passed' | 'failed' | 'cancelled';

export interface Inspection {
  id: string;
  organization_id: string;
  project_id: string;
  property_id: string;

  // Context
  location_id: string | null;
  work_category_code: string | null;
  stage_code: string | null;

  // Details
  inspection_type: InspectionType;
  inspector_name: string | null;
  inspector_phone: string | null;

  // Scheduling
  scheduled_date: string;
  scheduled_time: string | null;

  // Result
  status: InspectionStatus;
  result_notes: string | null;
  completed_at: string | null;

  // Linked items
  photo_ids: string[];
  document_id: string | null;

  created_at: string;
  created_by: string;
}

export interface CreateInspection {
  organization_id: string;
  project_id: string;
  property_id: string;
  location_id?: string;
  work_category_code?: string;
  stage_code?: string;
  inspection_type: InspectionType;
  inspector_name?: string;
  inspector_phone?: string;
  scheduled_date: string;
  scheduled_time?: string;
  created_by: string;
}

export interface UpdateInspection {
  location_id?: string | null;
  work_category_code?: string | null;
  stage_code?: string | null;
  inspection_type?: InspectionType;
  inspector_name?: string | null;
  inspector_phone?: string | null;
  scheduled_date?: string;
  scheduled_time?: string | null;
  status?: InspectionStatus;
  result_notes?: string | null;
  completed_at?: string | null;
  photo_ids?: string[];
  document_id?: string | null;
}

export interface InspectionFilters {
  organization_id?: string;
  project_id?: string;
  property_id?: string;
  status?: InspectionStatus;
  inspection_type?: InspectionType;
  scheduled_from?: string;
  scheduled_to?: string;
  created_by?: string;
}

export interface InspectionResult {
  status: 'passed' | 'failed';
  result_notes?: string;
  photo_ids?: string[];
  document_id?: string;
}

export interface UpcomingInspection extends Inspection {
  project_name?: string;
  property_address?: string;
}
