import type { Property, PropertyType, OwnershipTransferType } from '@hooomz/shared';

export interface CreatePropertyInput {
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code: string;
  country?: string;
  current_owner_id?: string;
  created_by_org_id: string;
  year_built?: number;
  property_type?: PropertyType;
}

export interface UpdatePropertyInput {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  year_built?: number;
  property_type?: PropertyType;
}

export interface PropertyFilters {
  organization_id?: string; // Properties created by this org
  current_owner_id?: string;
  city?: string;
  province?: string;
  search?: string; // Address search
}

export interface PropertyWithHistory extends Property {
  ownership_history?: {
    owner_id: string;
    owner_name: string;
    started_at: string;
    ended_at: string | null;
    transfer_type: OwnershipTransferType;
  }[];
  projects?: {
    id: string;
    name: string;
    status: string;
    organization_name: string;
    completed_at?: string;
  }[];
}

export interface TransferOwnershipInput {
  property_id: string;
  new_owner_id: string;
  transfer_type: OwnershipTransferType;
}
