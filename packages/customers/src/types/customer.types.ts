import type { Customer } from '@hooomz/shared';

export type CustomerSource = 'referral' | 'website' | 'social' | 'repeat' | 'other';

export interface CreateCustomerInput {
  organization_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source?: CustomerSource;
  tags?: string[];
}

export interface UpdateCustomerInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: CustomerSource;
  tags?: string[];
}

export interface CustomerFilters {
  organization_id: string;
  search?: string; // Searches name, email, phone
  tags?: string[];
  source?: CustomerSource;
  has_portal_access?: boolean;
}

export interface CustomerWithRelations extends Customer {
  properties?: {
    id: string;
    address_line1: string;
    city: string;
    province: string;
  }[];
  projects?: {
    id: string;
    name: string;
    status: string;
  }[];
  lifetime_value?: number;
}

export interface CustomerInteraction {
  id: string;
  customer_id: string;
  organization_id: string;
  interaction_type: InteractionType;
  notes: string;
  project_id?: string;
  created_at: string;
  created_by: string;
}

export type InteractionType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'site_visit'
  | 'estimate_sent'
  | 'contract_signed'
  | 'note';
