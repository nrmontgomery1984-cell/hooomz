export interface Estimate {
  id: string;
  organization_id: string;
  project_id: string | null;
  property_id: string;
  customer_id: string;
  name: string;
  status: EstimateStatus;
  version: number;
  parent_estimate_id: string | null;
  is_current_version: boolean;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  converted_project_id: string | null;
}

export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired' | 'converted';

export interface EstimateSection {
  id: string;
  estimate_id: string;
  name: string;
  description: string | null;
  display_order: number;
  selected_tier: PricingTier;
}

export type PricingTier = 'good' | 'better' | 'best';

export interface EstimateLineItem {
  id: string;
  section_id: string;
  estimate_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  tier: PricingTier;
  tier_relationship: TierRelationship;
  base_line_item_id: string | null;
  loop_binding_pattern: string | null;
  generated_template_id: string | null;
  display_order: number;
  markup_percent: number;
}

export type TierRelationship = 'base' | 'downgrade' | 'upgrade';

export interface EstimateLineMaterial {
  id: string;
  line_item_id: string;
  material_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  warranty_years: number | null;
  expected_lifespan_years: number | null;
  manufacturer_warranty_url: string | null;
}

export interface EstimatePaymentSchedule {
  id: string;
  estimate_id: string;
  milestone_name: string;
  percentage: number;
  amount: number;
  due_trigger: PaymentTrigger;
  display_order: number;
}

export type PaymentTrigger = 'on_signature' | 'on_start' | 'on_milestone' | 'on_completion' | 'custom_date';
