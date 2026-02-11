/**
 * Estimate Types
 * Types for Smart Estimating with confidence indicators
 */

export type ConfidenceLevel = 'verified' | 'limited' | 'estimate';

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total: number;
  confidence: ConfidenceLevel;
  data_points: number;
  line_type: 'labor' | 'material' | 'subcontractor';
}

export interface EstimateCategory {
  name: string;
  items: EstimateLineItem[];
  subtotal: number;
  confidence: ConfidenceLevel;
}

export interface Estimate {
  id: string;
  project_id: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  categories: EstimateCategory[];
  subtotal: number;
  markup_percent: number;
  markup_amount: number;
  total: number;
  overall_confidence: ConfidenceLevel;
  confidence_score: number;
  suggested_contingency: number;
}
