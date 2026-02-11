/**
 * Photo types for field documentation
 */

export interface Photo {
  id: string;
  organization_id: string;
  project_id: string;
  property_id: string;

  // Three-axis context (all optional)
  location_id: string | null;
  work_category_code: string | null;
  task_instance_id: string | null;

  // Storage
  storage_path: string;
  thumbnail_path: string | null;

  // Metadata
  caption: string | null;
  tags: string[];
  taken_at: string;
  uploaded_by: string;

  // Sharing
  shared_to_portal: boolean;
  shared_at: string | null;

  created_at: string;
}

export interface CreatePhoto {
  organization_id: string;
  project_id: string;
  property_id: string;
  location_id?: string;
  work_category_code?: string;
  task_instance_id?: string;
  storage_path: string;
  thumbnail_path?: string;
  caption?: string;
  tags?: string[];
  taken_at?: string;
  uploaded_by: string;
}

export interface UpdatePhoto {
  location_id?: string | null;
  work_category_code?: string | null;
  task_instance_id?: string | null;
  caption?: string | null;
  tags?: string[];
  shared_to_portal?: boolean;
}

export interface PhotoFilters {
  project_id?: string;
  property_id?: string;
  location_id?: string;
  work_category_code?: string;
  task_instance_id?: string;
  shared_to_portal?: boolean;
  uploaded_by?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface PhotoContext {
  location_id?: string;
  work_category_code?: string;
  task_instance_id?: string;
}

export interface PhotoUploadRequest {
  project_id: string;
  property_id: string;
  file: File | Blob;
  context?: PhotoContext;
  caption?: string;
  tags?: string[];
}

export interface PhotosByDate {
  date: string;
  photos: Photo[];
}

export interface PhotoStats {
  total_count: number;
  shared_count: number;
  by_location: Record<string, number>;
  by_work_category: Record<string, number>;
}
