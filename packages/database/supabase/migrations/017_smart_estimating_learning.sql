-- Migration 017: Smart Estimating Learning Tables
-- These tables power the learning system that makes estimates more accurate over time

-- ============================================================================
-- PRICE HISTORY
-- Records material prices from receipts, invoices, and manual entries
-- ============================================================================

CREATE TYPE price_source_type AS ENUM (
  'receipt',      -- Scanned/uploaded receipt
  'invoice',      -- Vendor invoice
  'quote',        -- Vendor quote
  'manual',       -- Manual entry
  'catalog'       -- From cost catalog
);

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Item identification
  item_name TEXT NOT NULL,
  sku TEXT,
  catalog_item_id UUID,  -- FK to cost catalog when we have one

  -- Price data
  unit_price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,

  -- Source tracking (Filter 7: Traceability)
  vendor TEXT,
  source_type price_source_type NOT NULL,
  source_id UUID,  -- Reference to receipt, invoice, etc.
  source_url TEXT, -- Link to uploaded document

  -- Project context
  project_id UUID REFERENCES projects(id),
  work_category TEXT,

  -- Timestamps
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_org ON price_history(organization_id);
CREATE INDEX idx_price_history_item ON price_history(organization_id, item_name);
CREATE INDEX idx_price_history_sku ON price_history(organization_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_price_history_recorded ON price_history(recorded_at DESC);

-- ============================================================================
-- LABOR BASELINES
-- Records how long tasks actually take, by task type and conditions
-- ============================================================================

CREATE TYPE labor_source_type AS ENUM (
  'time_entry',   -- From time tracking
  'task_close',   -- From task completion
  'manual'        -- Manual entry
);

CREATE TABLE labor_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Task identification
  task_name TEXT NOT NULL,
  task_template_id UUID REFERENCES task_templates(id),

  -- Duration data
  duration_hours DECIMAL(6,2) NOT NULL,

  -- Context for better baselines
  work_category TEXT,
  location_type TEXT,  -- e.g., 'kitchen', 'bathroom', 'exterior'
  complexity TEXT,     -- e.g., 'simple', 'standard', 'complex'

  -- Who did the work (for role-based baselines)
  team_member_id UUID REFERENCES team_members(id),
  role TEXT,  -- e.g., 'journeyman', 'apprentice', 'lead'

  -- Source tracking (Filter 7: Traceability)
  source_type labor_source_type NOT NULL,
  source_id UUID,  -- Reference to time entry, task, etc.

  -- Project context
  project_id UUID REFERENCES projects(id),

  -- Timestamps
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labor_baselines_org ON labor_baselines(organization_id);
CREATE INDEX idx_labor_baselines_task ON labor_baselines(organization_id, task_name);
CREATE INDEX idx_labor_baselines_template ON labor_baselines(task_template_id) WHERE task_template_id IS NOT NULL;
CREATE INDEX idx_labor_baselines_recorded ON labor_baselines(recorded_at DESC);

-- ============================================================================
-- ESTIMATE ACCURACY
-- Tracks how well estimates predicted actual project costs
-- This is the ultimate feedback loop for Smart Estimating
-- ============================================================================

CREATE TABLE estimate_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- References
  project_id UUID NOT NULL REFERENCES projects(id),
  estimate_id UUID NOT NULL REFERENCES estimates(id),

  -- Total comparison
  estimated_total DECIMAL(12,2) NOT NULL,
  actual_total DECIMAL(12,2) NOT NULL,
  variance_amount DECIMAL(12,2) NOT NULL,
  variance_percent DECIMAL(5,2) NOT NULL,

  -- Breakdown by category (for learning where estimates go wrong)
  category_breakdowns JSONB DEFAULT '[]',
  -- Format: [{ category: "electrical", estimated: 5000, actual: 5500, variance_percent: 10 }]

  -- Context
  project_type TEXT,
  project_size TEXT,  -- e.g., 'small', 'medium', 'large'

  -- Timestamps
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_estimate_accuracy_org ON estimate_accuracy(organization_id);
CREATE INDEX idx_estimate_accuracy_project ON estimate_accuracy(project_id);
CREATE INDEX idx_estimate_accuracy_estimate ON estimate_accuracy(estimate_id);
CREATE INDEX idx_estimate_accuracy_completed ON estimate_accuracy(completed_at DESC);

-- ============================================================================
-- MATERIAL BASELINES
-- Tracks typical material quantities for assemblies (e.g., wire per outlet)
-- ============================================================================

CREATE TABLE material_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Assembly identification
  assembly_name TEXT NOT NULL,  -- e.g., 'electrical_outlet_install'

  -- Material data
  material_name TEXT NOT NULL,
  quantity_per_unit DECIMAL(10,4) NOT NULL,
  unit TEXT NOT NULL,
  waste_factor DECIMAL(5,4) DEFAULT 0.10,  -- 10% default waste

  -- Source tracking
  source_project_id UUID REFERENCES projects(id),
  data_point_count INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_material_baselines_org ON material_baselines(organization_id);
CREATE INDEX idx_material_baselines_assembly ON material_baselines(organization_id, assembly_name);

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- Price baseline view with rolling averages
CREATE OR REPLACE VIEW v_price_baselines AS
SELECT
  organization_id,
  item_name,
  unit,
  COUNT(*) as data_point_count,
  AVG(unit_price) as avg_price,
  MIN(unit_price) as min_price,
  MAX(unit_price) as max_price,
  STDDEV(unit_price) as price_stddev,
  MAX(recorded_at) as last_recorded,
  CASE
    WHEN COUNT(*) >= 3 THEN 'verified'
    WHEN COUNT(*) >= 1 THEN 'limited'
    ELSE 'estimate'
  END as confidence
FROM price_history
GROUP BY organization_id, item_name, unit;

-- Labor baseline view with averages
CREATE OR REPLACE VIEW v_labor_baselines AS
SELECT
  organization_id,
  task_name,
  work_category,
  COUNT(*) as data_point_count,
  AVG(duration_hours) as avg_hours,
  MIN(duration_hours) as min_hours,
  MAX(duration_hours) as max_hours,
  STDDEV(duration_hours) as hours_stddev,
  MAX(recorded_at) as last_recorded,
  CASE
    WHEN COUNT(*) >= 3 THEN 'verified'
    WHEN COUNT(*) >= 1 THEN 'limited'
    ELSE 'estimate'
  END as confidence
FROM labor_baselines
GROUP BY organization_id, task_name, work_category;

-- Estimate accuracy trend view
CREATE OR REPLACE VIEW v_estimate_accuracy_trend AS
SELECT
  organization_id,
  DATE_TRUNC('month', completed_at) as month,
  COUNT(*) as projects_completed,
  AVG(variance_percent) as avg_variance,
  AVG(ABS(variance_percent)) as avg_absolute_variance,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY variance_percent) as median_variance
FROM estimate_accuracy
GROUP BY organization_id, DATE_TRUNC('month', completed_at)
ORDER BY month DESC;
