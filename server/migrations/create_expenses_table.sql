-- Expense Tracking System Migration
-- Creates tables for tracking project expenses with receipt uploads and OCR data

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Expense details
  date DATE NOT NULL,
  vendor VARCHAR(255),
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,

  -- Receipt information
  receipt_url TEXT,
  receipt_filename VARCHAR(255),
  receipt_uploaded_at TIMESTAMP WITH TIME ZONE,

  -- OCR extracted data (stored as JSONB for flexibility)
  ocr_data JSONB,
  ocr_processed BOOLEAN DEFAULT FALSE,
  ocr_confidence DECIMAL(3, 2), -- 0.00 to 1.00

  -- Approval workflow
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Notes and tags
  notes TEXT,
  tags TEXT[], -- Array of tags for categorization

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_categories table for standardized categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default expense categories
INSERT INTO expense_categories (name, description, color, icon) VALUES
  ('Materials', 'Building materials and supplies', '#3b82f6', 'Package'),
  ('Labor', 'Labor costs and subcontractors', '#10b981', 'Users'),
  ('Equipment', 'Tools and equipment rentals', '#f59e0b', 'Wrench'),
  ('Permits', 'Permits and inspections', '#6366f1', 'FileText'),
  ('Transportation', 'Vehicle and fuel costs', '#8b5cf6', 'Truck'),
  ('Utilities', 'Electricity, water, gas', '#14b8a6', 'Zap'),
  ('Professional Services', 'Architects, engineers, consultants', '#ef4444', 'Briefcase'),
  ('Insurance', 'Project insurance costs', '#ec4899', 'Shield'),
  ('Waste Removal', 'Debris and waste disposal', '#f97316', 'Trash'),
  ('Other', 'Miscellaneous expenses', '#6b7280', 'MoreHorizontal')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_tags ON expenses USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_expenses_ocr_data ON expenses USING GIN(ocr_data);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at_trigger
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Add comments
COMMENT ON TABLE expenses IS 'Project expense tracking with receipt uploads and OCR';
COMMENT ON COLUMN expenses.ocr_data IS 'JSON data extracted from receipt via OCR';
COMMENT ON COLUMN expenses.ocr_confidence IS 'OCR confidence score from 0 to 1';
COMMENT ON COLUMN expenses.status IS 'Approval status: pending, approved, rejected';
COMMENT ON COLUMN expenses.tags IS 'Array of tags for flexible categorization';
