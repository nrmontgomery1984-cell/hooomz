export interface Property {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  current_owner_id: string | null;
  ownership_transferred_at: string | null;
  created_at: string;
  created_by_org_id: string;
  year_built: number | null;
  property_type: PropertyType | null;
}

export type PropertyType =
  | 'single_family'
  | 'semi_detached'
  | 'townhouse'
  | 'condo'
  | 'multi_unit'
  | 'other';

export interface PropertyOwnershipHistory {
  id: string;
  property_id: string;
  owner_id: string;
  started_at: string;
  ended_at: string | null;
  transfer_type: OwnershipTransferType;
}

export type OwnershipTransferType = 'initial' | 'sale' | 'inheritance' | 'other';

export interface PropertyPendingData {
  id: string;
  property_id: string;
  project_id: string;
  data_type: PendingDataType;
  source_entity_type: string;
  source_entity_id: string;
  data_snapshot: Record<string, unknown>;
  created_at: string;
  processed_at: string | null;
}

export type PendingDataType = 'material' | 'photo' | 'contractor' | 'loop_structure' | 'document';
