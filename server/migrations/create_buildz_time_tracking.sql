-- =====================================================
-- HOOOMZ BUILDZ - TIME TRACKING SYSTEM
-- Comprehensive time tracking for construction projects
-- =====================================================

-- =====================================================
-- 1. PHASES TABLE
-- Standard construction phases
-- =====================================================

CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'Pre-Construction', 'Demo', 'Rough-in', etc.
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name)
);

-- Seed standard construction phases
INSERT INTO phases (name, order_index) VALUES
  ('Pre-Construction', 0),
  ('Demo', 1),
  ('Rough-in', 2),
  ('Closing In', 3),
  ('Finishing', 4),
  ('Closeout', 5)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. CATEGORIES TABLE (Work Packages)
-- Main work categories that crew selects for time tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id),
  name TEXT NOT NULL, -- 'Drywall Installation', 'Plumbing Rough-in', etc.
  labor_budget_dollars DECIMAL(10,2),
  material_budget_dollars DECIMAL(10,2),
  assigned_crew JSONB, -- Array of employee IDs: ["uuid1", "uuid2"]
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);
CREATE INDEX IF NOT EXISTS idx_categories_phase ON categories(phase_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- =====================================================
-- 3. SUB_CATEGORIES TABLE
-- Specific tasks under a category
-- =====================================================

CREATE TABLE IF NOT EXISTS sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Hanging', 'Taping', 'Sanding'
  hours_budgeted DECIMAL(6,2), -- Optional individual budget
  order_index INTEGER NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_categories_category ON sub_categories(category_id);

-- =====================================================
-- 4. ENHANCE TIME_ENTRIES TABLE
-- Add new fields for Buildz time tracking
-- =====================================================

-- Add project_id for easier querying
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Add phase tracking
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES phases(id);

-- Add category/sub-category tracking (replace scope_item_id approach)
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES sub_categories(id);

-- Add rounded times (15-minute intervals)
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS clock_in_time_rounded TIMESTAMP WITH TIME ZONE;

ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS clock_out_time_rounded TIMESTAMP WITH TIME ZONE;

-- Add break tracking
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS break_duration INTEGER DEFAULT 0; -- Minutes of unpaid breaks

ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS break_start_time TIMESTAMP WITH TIME ZONE;

ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS on_break BOOLEAN DEFAULT FALSE;

-- Add total hours (calculated field)
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS total_hours DECIMAL(6,2);

-- Add pay period tracking (stored at creation, never changes)
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS pay_period_start DATE;

ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS pay_period_end DATE;

-- Enhanced approval workflow
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'submitted', 'approved'));

-- Add edit tracking for audit trail
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id);

ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS edit_notes TEXT;

-- Add employee reference (replace worker_name with proper FK)
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_category ON time_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_phase ON time_entries(phase_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_approval ON time_entries(approval_status);
CREATE INDEX IF NOT EXISTS idx_time_entries_pay_period ON time_entries(pay_period_start, pay_period_end);

-- Index for finding active entries (null end_time)
CREATE INDEX IF NOT EXISTS idx_time_entries_active ON time_entries(end_time) WHERE end_time IS NULL;

-- =====================================================
-- 5. PAYROLL_SETTINGS TABLE
-- Configure pay period settings
-- =====================================================

CREATE TABLE IF NOT EXISTS payroll_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_period_start_date DATE NOT NULL, -- First pay period start date
  pay_period_frequency TEXT NOT NULL CHECK (pay_period_frequency IN ('weekly', 'bi_weekly', 'semi_monthly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Single row table constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_settings_singleton ON payroll_settings((id IS NOT NULL));

-- Insert default settings (bi-weekly starting today)
INSERT INTO payroll_settings (pay_period_start_date, pay_period_frequency)
SELECT CURRENT_DATE, 'bi_weekly'
WHERE NOT EXISTS (SELECT 1 FROM payroll_settings);

-- =====================================================
-- 6. BUDGET_TRACKING TABLE
-- Cached budget calculations for performance
-- =====================================================

CREATE TABLE IF NOT EXISTS budget_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id),
  category_id UUID REFERENCES categories(id),
  sub_category_id UUID REFERENCES sub_categories(id),

  hours_budgeted DECIMAL(8,2),
  hours_spent DECIMAL(8,2),

  revenue_budgeted DECIMAL(10,2), -- Based on charged rates
  revenue_spent DECIMAL(10,2), -- Based on charged rates

  cost_actual DECIMAL(10,2), -- Based on actual wages

  variance_hours DECIMAL(8,2), -- hours_spent - hours_budgeted
  variance_dollars DECIMAL(10,2), -- revenue_spent - revenue_budgeted

  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budget_tracking_project ON budget_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_tracking_category ON budget_tracking(category_id);

-- =====================================================
-- 7. ACTIVITY_LOG TABLE
-- For trade partners and general project events
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL CHECK (activity_type IN ('trade_partner_on_site', 'issue_flagged', 'change_order', 'inspection', 'delivery', 'other')),

  -- For trade partner logging
  trade_partner_id UUID REFERENCES employees(id), -- If in employees table
  trade_partner_name TEXT, -- If not in system

  activity_date DATE,
  description TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);

-- =====================================================
-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger for categories updated_at
CREATE OR REPLACE FUNCTION update_categories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_timestamp();

-- Trigger for sub_categories updated_at
DROP TRIGGER IF EXISTS update_sub_categories_updated_at ON sub_categories;
CREATE TRIGGER update_sub_categories_updated_at
  BEFORE UPDATE ON sub_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_timestamp();

-- Trigger for payroll_settings updated_at
DROP TRIGGER IF EXISTS update_payroll_settings_updated_at ON payroll_settings;
CREATE TRIGGER update_payroll_settings_updated_at
  BEFORE UPDATE ON payroll_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_timestamp();

-- Trigger for budget_tracking updated_at
DROP TRIGGER IF EXISTS update_budget_tracking_updated_at ON budget_tracking;
CREATE TRIGGER update_budget_tracking_updated_at
  BEFORE UPDATE ON budget_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_timestamp();

-- Trigger for activity_log updated_at
DROP TRIGGER IF EXISTS update_activity_log_updated_at ON activity_log;
CREATE TRIGGER update_activity_log_updated_at
  BEFORE UPDATE ON activity_log
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_timestamp();

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to round timestamp to nearest 15 minutes
CREATE OR REPLACE FUNCTION round_to_15_minutes(ts TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  minutes INT;
  rounded_minutes INT;
BEGIN
  minutes := EXTRACT(MINUTE FROM ts)::INT;
  rounded_minutes := ROUND(minutes / 15.0) * 15;

  -- Handle case where rounding goes to 60 minutes
  IF rounded_minutes = 60 THEN
    RETURN date_trunc('hour', ts) + INTERVAL '1 hour';
  ELSE
    RETURN date_trunc('hour', ts) + (rounded_minutes || ' minutes')::INTERVAL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get current pay period based on settings
CREATE OR REPLACE FUNCTION get_current_pay_period()
RETURNS TABLE(period_start DATE, period_end DATE) AS $$
DECLARE
  settings RECORD;
  days_since_start INT;
  periods_passed INT;
  days_in_period INT;
BEGIN
  -- Get payroll settings
  SELECT * INTO settings FROM payroll_settings LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll settings not configured';
  END IF;

  -- Calculate days in period based on frequency
  CASE settings.pay_period_frequency
    WHEN 'weekly' THEN days_in_period := 7;
    WHEN 'bi_weekly' THEN days_in_period := 14;
    WHEN 'semi_monthly' THEN days_in_period := 15; -- Approximate
    WHEN 'monthly' THEN days_in_period := 30; -- Approximate
  END CASE;

  -- Calculate which period we're in
  days_since_start := CURRENT_DATE - settings.pay_period_start_date;
  periods_passed := FLOOR(days_since_start / days_in_period);

  -- Calculate period boundaries
  period_start := settings.pay_period_start_date + (periods_passed * days_in_period);
  period_end := period_start + days_in_period - 1;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-populate pay period on time entry insert
CREATE OR REPLACE FUNCTION set_time_entry_pay_period()
RETURNS TRIGGER AS $$
DECLARE
  period RECORD;
BEGIN
  -- Only set if not already provided
  IF NEW.pay_period_start IS NULL OR NEW.pay_period_end IS NULL THEN
    SELECT * INTO period FROM get_current_pay_period();
    NEW.pay_period_start := period.period_start;
    NEW.pay_period_end := period.period_end;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pay_period_on_time_entry_insert ON time_entries;
CREATE TRIGGER set_pay_period_on_time_entry_insert
  BEFORE INSERT ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_time_entry_pay_period();

-- =====================================================
-- 10. ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read phases
DROP POLICY IF EXISTS "Authenticated users can view phases" ON phases;
CREATE POLICY "Authenticated users can view phases"
  ON phases FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to manage categories
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to manage sub_categories
DROP POLICY IF EXISTS "Authenticated users can manage sub_categories" ON sub_categories;
CREATE POLICY "Authenticated users can manage sub_categories"
  ON sub_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to read payroll_settings
DROP POLICY IF EXISTS "Authenticated users can view payroll settings" ON payroll_settings;
CREATE POLICY "Authenticated users can view payroll settings"
  ON payroll_settings FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to update payroll_settings
DROP POLICY IF EXISTS "Authenticated users can update payroll settings" ON payroll_settings;
CREATE POLICY "Authenticated users can update payroll settings"
  ON payroll_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to manage budget_tracking
DROP POLICY IF EXISTS "Authenticated users can manage budget tracking" ON budget_tracking;
CREATE POLICY "Authenticated users can manage budget tracking"
  ON budget_tracking FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to manage activity_log
DROP POLICY IF EXISTS "Authenticated users can manage activity log" ON activity_log;
CREATE POLICY "Authenticated users can manage activity log"
  ON activity_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE phases IS 'Standard construction phases (Demo, Rough-in, Closing In, etc.)';
COMMENT ON TABLE categories IS 'Work packages/categories that crew selects for time tracking';
COMMENT ON TABLE sub_categories IS 'Specific tasks within a category (e.g., Hanging, Taping under Drywall)';
COMMENT ON TABLE payroll_settings IS 'Payroll configuration (pay period frequency, start date)';
COMMENT ON TABLE budget_tracking IS 'Cached budget calculations for performance';
COMMENT ON TABLE activity_log IS 'Activity log for trade partners and project events';

COMMENT ON COLUMN time_entries.clock_in_time_rounded IS 'Clock in time rounded to nearest 15 minutes';
COMMENT ON COLUMN time_entries.clock_out_time_rounded IS 'Clock out time rounded to nearest 15 minutes';
COMMENT ON COLUMN time_entries.break_duration IS 'Total break duration in minutes (unpaid)';
COMMENT ON COLUMN time_entries.total_hours IS 'Total billable hours (clock_out - clock_in - breaks)';
COMMENT ON COLUMN time_entries.pay_period_start IS 'Pay period start date (set at creation, never changes)';
COMMENT ON COLUMN time_entries.pay_period_end IS 'Pay period end date (set at creation, never changes)';
COMMENT ON COLUMN time_entries.approval_status IS 'Approval status: draft, submitted, approved';
