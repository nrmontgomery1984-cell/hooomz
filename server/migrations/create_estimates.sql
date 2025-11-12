-- Create estimates and estimate line items tables
-- This enables quote/estimate creation and conversion to project scope

-- Estimates table
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'converted')),
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  valid_until DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estimate line items table
CREATE TABLE IF NOT EXISTS estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  category VARCHAR(255),
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'ea',
  unit_price DECIMAL(10, 2) DEFAULT 0,
  labor_hours DECIMAL(10, 2),
  materials_cost DECIMAL(10, 2),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_estimates_project_id ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate_id ON estimate_line_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_category ON estimate_line_items(category);

-- Add updated_at trigger for estimates
CREATE OR REPLACE FUNCTION update_estimates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estimates_updated_at_trigger
BEFORE UPDATE ON estimates
FOR EACH ROW
EXECUTE FUNCTION update_estimates_updated_at();

-- Add updated_at trigger for estimate_line_items
CREATE OR REPLACE FUNCTION update_estimate_line_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estimate_line_items_updated_at_trigger
BEFORE UPDATE ON estimate_line_items
FOR EACH ROW
EXECUTE FUNCTION update_estimate_line_items_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for estimates
CREATE POLICY "Users can view estimates for their projects"
  ON estimates FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create estimates for their projects"
  ON estimates FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update estimates for their projects"
  ON estimates FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete estimates for their projects"
  ON estimates FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for estimate_line_items
CREATE POLICY "Users can view line items for their estimates"
  ON estimate_line_items FOR SELECT
  USING (
    estimate_id IN (
      SELECT e.id FROM estimates e
      INNER JOIN project_members pm ON e.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create line items for their estimates"
  ON estimate_line_items FOR INSERT
  WITH CHECK (
    estimate_id IN (
      SELECT e.id FROM estimates e
      INNER JOIN project_members pm ON e.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update line items for their estimates"
  ON estimate_line_items FOR UPDATE
  USING (
    estimate_id IN (
      SELECT e.id FROM estimates e
      INNER JOIN project_members pm ON e.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete line items for their estimates"
  ON estimate_line_items FOR DELETE
  USING (
    estimate_id IN (
      SELECT e.id FROM estimates e
      INNER JOIN project_members pm ON e.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );
