-- Migration 004: Project Tables

CREATE TYPE project_status AS ENUM (
  'lead', 'estimate', 'quoted', 'approved', 'in_progress', 'on_hold', 'complete', 'cancelled'
);

CREATE TYPE project_health AS ENUM (
  'on_track', 'at_risk', 'behind'
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  name TEXT NOT NULL,
  status project_status NOT NULL DEFAULT 'lead',
  health project_health NOT NULL DEFAULT 'on_track',
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_property ON projects(property_id);
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_projects_status ON projects(status);
