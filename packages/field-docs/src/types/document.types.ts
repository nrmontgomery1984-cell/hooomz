/**
 * Document types for field documentation
 */

export type DocumentCategory =
  | 'permit'
  | 'contract'
  | 'change_order'
  | 'invoice'
  | 'receipt'
  | 'warranty'
  | 'manual'
  | 'drawing'
  | 'spec_sheet'
  | 'other';

export interface Document {
  id: string;
  organization_id: string;
  project_id: string | null;
  property_id: string | null;

  // File info
  name: string;
  category: DocumentCategory;
  storage_path: string;
  file_type: string;
  file_size: number;

  // Metadata
  description: string | null;
  tags: string[];
  uploaded_by: string;

  // Sharing
  shared_to_portal: boolean;
  shared_at: string | null;
  portal_explanation: string | null;

  // Versioning
  version: number;
  previous_version_id: string | null;

  created_at: string;
}

export interface CreateDocument {
  organization_id: string;
  project_id?: string;
  property_id?: string;
  name: string;
  category: DocumentCategory;
  storage_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  tags?: string[];
  uploaded_by: string;
}

export interface UpdateDocument {
  name?: string;
  category?: DocumentCategory;
  description?: string | null;
  tags?: string[];
  shared_to_portal?: boolean;
  portal_explanation?: string | null;
}

export interface DocumentFilters {
  organization_id?: string;
  project_id?: string;
  property_id?: string;
  category?: DocumentCategory;
  uploaded_by?: string;
  shared_to_portal?: boolean;
  tags?: string[];
}

export interface DocumentUploadRequest {
  project_id?: string;
  property_id?: string;
  name: string;
  category: DocumentCategory;
  file: File | Blob;
  description?: string;
  tags?: string[];
}

export interface DocumentVersion {
  id: string;
  version: number;
  created_at: string;
  uploaded_by: string;
}

export interface DocumentWithVersions extends Document {
  versions: DocumentVersion[];
}
