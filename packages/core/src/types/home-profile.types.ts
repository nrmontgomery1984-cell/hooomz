/**
 * Home Profile Types
 *
 * Types for the Home Profile / Property lifecycle features
 */

// =====================
// Property Extensions (Home Profile)
// =====================
export interface PropertyHomeProfile {
  id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  current_owner_id?: string;
  ownership_transferred_at?: string;
  created_at: string;
  created_by_org_id: string;
  year_built?: number;
  property_type?: PropertyType;
  // Extended home profile fields
  square_footage?: number;
  lot_size_sf?: number;
  stories?: number;
  bedrooms?: number;
  bathrooms?: number;
  construction_type?: string;
  scan_verified?: boolean;
  original_project_id?: string;
}

export type PropertyType =
  | 'single_family'
  | 'semi_detached'
  | 'townhouse'
  | 'condo'
  | 'multi_unit'
  | 'other';

export interface UpdatePropertyHomeProfileInput {
  square_footage?: number;
  lot_size_sf?: number;
  stories?: number;
  bedrooms?: number;
  bathrooms?: number;
  construction_type?: string;
  year_built?: number;
  property_type?: PropertyType;
}

// =====================
// Installed Products
// =====================
export type ProductCategory =
  | 'hvac'
  | 'plumbing'
  | 'electrical'
  | 'roofing'
  | 'windows_doors'
  | 'appliances'
  | 'flooring'
  | 'siding'
  | 'insulation'
  | 'finishes'
  | 'structural'
  | 'other';

export interface InstalledProduct {
  id: string;
  property_id: string;
  organization_id?: string;
  project_id?: string;
  category: ProductCategory;
  product_type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  install_date?: string;
  location?: string;
  location_id?: string;
  warranty_years?: number;
  warranty_expires?: string;
  warranty_document_id?: string;
  maintenance_interval_months?: number;
  last_serviced?: string;
  next_service_due?: string;
  notes?: string;
  specifications?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateInstalledProductInput {
  property_id: string;
  organization_id?: string;
  project_id?: string;
  category: ProductCategory;
  product_type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  install_date?: string;
  location?: string;
  location_id?: string;
  warranty_years?: number;
  warranty_expires?: string;
  warranty_document_id?: string;
  maintenance_interval_months?: number;
  notes?: string;
  specifications?: Record<string, unknown>;
}

export interface UpdateInstalledProductInput {
  category?: ProductCategory;
  product_type?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  install_date?: string;
  location?: string;
  location_id?: string;
  warranty_years?: number;
  warranty_expires?: string;
  warranty_document_id?: string;
  maintenance_interval_months?: number;
  last_serviced?: string;
  next_service_due?: string;
  notes?: string;
  specifications?: Record<string, unknown>;
}

export interface InstalledProductFilters {
  property_id: string;
  category?: ProductCategory;
  has_warranty?: boolean;
  warranty_expiring_within_days?: number;
  maintenance_due_within_days?: number;
}

// =====================
// Home Scans
// =====================
export type ScanStage =
  | 'existing_conditions'
  | 'framing'
  | 'rough_in'
  | 'final'
  | 'other';

export interface HomeScan {
  id: string;
  property_id: string;
  project_id?: string;
  organization_id: string;
  scan_date: string;
  stage: ScanStage;
  scan_provider?: string;
  point_cloud_path?: string;
  revit_model_path?: string;
  deviation_report_path?: string;
  deviation_count?: number;
  deviations_resolved?: boolean;
  notes?: string;
  scanned_by?: string;
  created_at: string;
}

export interface CreateHomeScanInput {
  property_id: string;
  project_id?: string;
  organization_id: string;
  scan_date: string;
  stage: ScanStage;
  scan_provider?: string;
  point_cloud_path?: string;
  revit_model_path?: string;
  deviation_report_path?: string;
  deviation_count?: number;
  notes?: string;
  scanned_by?: string;
}

export interface UpdateHomeScanInput {
  point_cloud_path?: string;
  revit_model_path?: string;
  deviation_report_path?: string;
  deviation_count?: number;
  deviations_resolved?: boolean;
  notes?: string;
}

// =====================
// Maintenance Records
// =====================
export type MaintenanceType =
  | 'scheduled'
  | 'repair'
  | 'replacement'
  | 'inspection'
  | 'emergency'
  | 'upgrade';

export interface MaintenanceRecord {
  id: string;
  property_id: string;
  product_id?: string;
  organization_id?: string;
  maintenance_type: MaintenanceType;
  description: string;
  performed_date: string;
  performed_by?: string;
  cost?: number;
  invoice_id?: string;
  outcome?: string;
  next_recommended?: string;
  photo_ids?: string[];
  created_at: string;
}

export interface CreateMaintenanceRecordInput {
  property_id: string;
  product_id?: string;
  organization_id?: string;
  maintenance_type: MaintenanceType;
  description: string;
  performed_date: string;
  performed_by?: string;
  cost?: number;
  invoice_id?: string;
  outcome?: string;
  next_recommended?: string;
  photo_ids?: string[];
}

// =====================
// Ownership History
// =====================
export type OwnershipTransferType = 'initial' | 'sale' | 'inheritance' | 'other';

export interface OwnershipHistory {
  id: string;
  property_id: string;
  customer_id?: string;
  start_date: string;
  end_date?: string;
  transfer_type: OwnershipTransferType;
  transfer_notes?: string;
  profile_access_granted?: boolean;
  profile_access_granted_at?: string;
  created_at: string;
}

export interface CreateOwnershipHistoryInput {
  property_id: string;
  customer_id?: string;
  start_date: string;
  transfer_type: OwnershipTransferType;
  transfer_notes?: string;
}

// =====================
// Query Results
// =====================
export interface ExpiringWarranty {
  product_id: string;
  product_type: string;
  manufacturer?: string;
  model?: string;
  warranty_expires: string;
  days_until_expiry: number;
}

export interface MaintenanceDue {
  product_id: string;
  product_type: string;
  location?: string;
  last_serviced?: string;
  next_service_due: string;
  days_overdue: number;
}

export interface HomeProfileSummary {
  property: PropertyHomeProfile;
  product_count: number;
  scan_count: number;
  scan_verified: boolean;
  expiring_warranties: ExpiringWarranty[];
  maintenance_due: MaintenanceDue[];
}
