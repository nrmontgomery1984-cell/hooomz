export interface Customer {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  portal_access: boolean;
  portal_user_id: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  source: CustomerSource | null;
}

export type CustomerSource = 'referral' | 'website' | 'social' | 'repeat' | 'other';

export type ContactMethod = 'email' | 'phone' | 'text' | 'portal';

export interface CustomerProperty {
  id: string;
  customer_id: string;
  property_id: string;
  relationship: PropertyRelationship;
  is_primary: boolean;
}

export type PropertyRelationship = 'owner' | 'tenant' | 'property_manager' | 'other';

export interface CustomerSelection {
  id: string;
  customer_id: string;
  estimate_id: string;
  line_item_id: string;
  selected_tier: SelectionTier;
  selected_at: string;
  approved_by_contractor: boolean;
  approved_at: string | null;
}

export type SelectionTier = 'good' | 'better' | 'best';

export interface ChangeOrder {
  id: string;
  organization_id: string;
  project_id: string;
  customer_id: string;
  name: string;
  description: string | null;
  status: ChangeOrderStatus;
  total_amount: number;
  created_at: string;
  sent_at: string | null;
  responded_at: string | null;
}

export type ChangeOrderStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'cancelled';

export interface ChangeOrderLineItem {
  id: string;
  change_order_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}
