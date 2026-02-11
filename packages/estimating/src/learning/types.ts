/**
 * Smart Estimating Learning Types
 * Types for the learning system that makes estimates more accurate over time
 */

export type ConfidenceLevel = 'verified' | 'limited' | 'estimate';

export type PriceSourceType = 'receipt' | 'invoice' | 'quote' | 'manual' | 'catalog';

export type LaborSourceType = 'time_entry' | 'task_close' | 'manual';

// ============================================================================
// PRICE HISTORY
// ============================================================================

export interface PriceHistoryRecord {
  id: string;
  organization_id: string;
  item_name: string;
  sku?: string;
  catalog_item_id?: string;
  unit_price: number;
  unit: string;
  quantity?: number;
  vendor?: string;
  source_type: PriceSourceType;
  source_id?: string;
  source_url?: string;
  project_id?: string;
  work_category?: string;
  recorded_at: string;
  created_at: string;
}

export interface CreatePriceHistoryRecord {
  item_name: string;
  unit_price: number;
  unit: string;
  sku?: string;
  quantity?: number;
  vendor?: string;
  source_type: PriceSourceType;
  source_id?: string;
  source_url?: string;
  project_id?: string;
  work_category?: string;
}

export interface PriceBaseline {
  item_name: string;
  unit: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  price_stddev: number;
  data_point_count: number;
  last_recorded: string;
  confidence: ConfidenceLevel;
}

// ============================================================================
// LABOR BASELINES
// ============================================================================

export interface LaborBaselineRecord {
  id: string;
  organization_id: string;
  task_name: string;
  task_template_id?: string;
  duration_hours: number;
  work_category?: string;
  location_type?: string;
  complexity?: string;
  team_member_id?: string;
  role?: string;
  source_type: LaborSourceType;
  source_id?: string;
  project_id?: string;
  recorded_at: string;
  created_at: string;
}

export interface CreateLaborBaselineRecord {
  task_name: string;
  duration_hours: number;
  task_template_id?: string;
  work_category?: string;
  location_type?: string;
  complexity?: string;
  team_member_id?: string;
  role?: string;
  source_type: LaborSourceType;
  source_id?: string;
  project_id?: string;
}

export interface LaborBaseline {
  task_name: string;
  work_category?: string;
  avg_hours: number;
  min_hours: number;
  max_hours: number;
  hours_stddev: number;
  data_point_count: number;
  last_recorded: string;
  confidence: ConfidenceLevel;
}

// ============================================================================
// ESTIMATE ACCURACY
// ============================================================================

export interface CategoryBreakdown {
  category: string;
  estimated: number;
  actual: number;
  variance_percent: number;
}

export interface EstimateAccuracyRecord {
  id: string;
  organization_id: string;
  project_id: string;
  estimate_id: string;
  estimated_total: number;
  actual_total: number;
  variance_amount: number;
  variance_percent: number;
  category_breakdowns: CategoryBreakdown[];
  project_type?: string;
  project_size?: string;
  completed_at: string;
  created_at: string;
}

export interface CreateEstimateAccuracyRecord {
  project_id: string;
  estimate_id: string;
  estimated_total: number;
  actual_total: number;
  category_breakdowns?: CategoryBreakdown[];
  project_type?: string;
  project_size?: string;
}

export interface EstimateAccuracyTrend {
  month: string;
  projects_completed: number;
  avg_variance: number;
  avg_absolute_variance: number;
  median_variance: number;
}

// ============================================================================
// MATERIAL BASELINES
// ============================================================================

export interface MaterialBaseline {
  id: string;
  organization_id: string;
  assembly_name: string;
  material_name: string;
  quantity_per_unit: number;
  unit: string;
  waste_factor: number;
  source_project_id?: string;
  data_point_count: number;
  last_updated_at: string;
  created_at: string;
}
