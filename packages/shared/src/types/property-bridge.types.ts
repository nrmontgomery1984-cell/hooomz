/**
 * Property Bridge Types
 * For transferring project data to property profile on completion
 */

export type PropertyPendingDataType =
  | 'material'
  | 'document'
  | 'warranty'
  | 'photo'
  | 'system'
  | 'maintenance_schedule';

export interface PropertyPendingData {
  id: string;
  property_id: string;
  source_project_id: string;

  data_type: PropertyPendingDataType;
  source_entity_type: string;
  source_entity_id: string;

  data_snapshot: Record<string, unknown>;

  status: 'pending' | 'transferred' | 'rejected';
  transferred_at?: string;

  created_at: string;
}

export interface ProjectCompletionChecklist {
  id: string;
  project_id: string;

  final_walkthrough_complete: boolean;
  final_walkthrough_date?: string;
  punch_list_resolved: boolean;
  final_invoice_paid: boolean;
  warranty_documents_shared: boolean;
  homeowner_manual_generated: boolean;
  property_profile_synced: boolean;

  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialRecord {
  name: string;
  brand?: string;
  model?: string;
  color?: string;
  finish?: string;
  quantity: number;
  unit: string;
  location_name: string;
  installed_date: string;
  warranty_info?: {
    provider: string;
    duration_years: number;
    document_id?: string;
  };
  spec_sheet_url?: string;
  maintenance_notes?: string;
}
