-- Migration 009: Estimate Tables

CREATE TYPE estimate_status AS ENUM (
  'draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted'
);

CREATE TYPE pricing_tier AS ENUM ('good', 'better', 'best');

CREATE TYPE tier_relationship AS ENUM ('base', 'downgrade', 'upgrade');

CREATE TYPE payment_trigger AS ENUM (
  'on_signature', 'on_start', 'on_milestone', 'on_completion', 'custom_date'
);

CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  name TEXT NOT NULL,
  status estimate_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  parent_estimate_id UUID REFERENCES estimates(id),
  is_current_version BOOLEAN NOT NULL DEFAULT TRUE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  converted_project_id UUID REFERENCES projects(id)
);

CREATE INDEX idx_estimates_org ON estimates(organization_id);
CREATE INDEX idx_estimates_property ON estimates(property_id);
CREATE INDEX idx_estimates_customer ON estimates(customer_id);
CREATE INDEX idx_estimates_status ON estimates(status);

CREATE TABLE estimate_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  selected_tier pricing_tier NOT NULL DEFAULT 'better'
);

CREATE INDEX idx_estimate_sections_estimate ON estimate_sections(estimate_id);

CREATE TABLE estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES estimate_sections(id) ON DELETE CASCADE,
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'ea',
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  tier pricing_tier NOT NULL DEFAULT 'better',
  tier_relationship tier_relationship NOT NULL DEFAULT 'base',
  base_line_item_id UUID REFERENCES estimate_line_items(id),
  loop_binding_pattern TEXT,
  generated_template_id UUID REFERENCES task_templates(id),
  display_order INTEGER NOT NULL DEFAULT 0,
  markup_percent DECIMAL(5,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_line_items_section ON estimate_line_items(section_id);
CREATE INDEX idx_line_items_estimate ON estimate_line_items(estimate_id);
CREATE INDEX idx_line_items_tier ON estimate_line_items(tier);

CREATE TABLE estimate_line_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_item_id UUID NOT NULL REFERENCES estimate_line_items(id) ON DELETE CASCADE,
  material_id UUID,  -- FK to materials table when created
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'ea',
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  warranty_years INTEGER,
  expected_lifespan_years INTEGER,
  manufacturer_warranty_url TEXT
);

CREATE INDEX idx_line_materials_item ON estimate_line_materials(line_item_id);

CREATE TABLE estimate_payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_trigger payment_trigger NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_payment_schedule_estimate ON estimate_payment_schedules(estimate_id);
