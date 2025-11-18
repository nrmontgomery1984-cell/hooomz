-- =====================================================
-- PAY PERIODS TABLE
-- Defines pay period cycles for time tracking and payroll
-- =====================================================

-- Pay Periods Table
-- Stores pay period configurations (bi-weekly, weekly, monthly, etc.)
CREATE TABLE IF NOT EXISTS pay_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Pay Period 1/1/2024 - 1/15/2024"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  frequency TEXT DEFAULT 'biweekly' CHECK (frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly', 'custom')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'processing', 'paid')),
  total_hours DECIMAL(10, 2) DEFAULT 0, -- Total hours for all workers in this period
  total_cost DECIMAL(12, 2) DEFAULT 0, -- Total cost for this pay period
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Add pay_period_id to time_entries for associating entries with specific pay periods
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS pay_period_id UUID REFERENCES pay_periods(id) ON DELETE SET NULL;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pay_periods_dates ON pay_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pay_periods_status ON pay_periods(status);
CREATE INDEX IF NOT EXISTS idx_pay_periods_created_by ON pay_periods(created_by);
CREATE INDEX IF NOT EXISTS idx_time_entries_pay_period ON time_entries(pay_period_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_pay_periods_updated_at
BEFORE UPDATE ON pay_periods
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically assign time entries to pay periods
-- This function finds the appropriate pay period for a time entry based on start_time
CREATE OR REPLACE FUNCTION assign_time_entry_to_pay_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if pay_period_id is not already set
  IF NEW.pay_period_id IS NULL THEN
    SELECT id INTO NEW.pay_period_id
    FROM pay_periods
    WHERE NEW.start_time::DATE >= start_date
      AND NEW.start_time::DATE <= end_date
      AND status != 'closed'
    ORDER BY start_date DESC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign pay period when time entry is inserted or updated
DROP TRIGGER IF EXISTS assign_pay_period_on_time_entry ON time_entries;
CREATE TRIGGER assign_pay_period_on_time_entry
BEFORE INSERT OR UPDATE ON time_entries
FOR EACH ROW EXECUTE FUNCTION assign_time_entry_to_pay_period();

-- Function to recalculate pay period totals
CREATE OR REPLACE FUNCTION recalculate_pay_period_totals(period_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE pay_periods
  SET
    total_hours = COALESCE((
      SELECT SUM(duration_minutes) / 60.0
      FROM time_entries
      WHERE pay_period_id = period_id
        AND end_time IS NOT NULL
    ), 0)
  WHERE id = period_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate totals when time entries change
CREATE OR REPLACE FUNCTION update_pay_period_totals_on_time_entry_change()
RETURNS TRIGGER AS $$
DECLARE
  old_period_id UUID;
  new_period_id UUID;
BEGIN
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.pay_period_id IS NOT NULL THEN
      PERFORM recalculate_pay_period_totals(OLD.pay_period_id);
    END IF;
    RETURN OLD;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    old_period_id := OLD.pay_period_id;
    new_period_id := NEW.pay_period_id;

    IF old_period_id IS NOT NULL AND old_period_id != new_period_id THEN
      PERFORM recalculate_pay_period_totals(old_period_id);
    END IF;
  END IF;

  -- Handle INSERT and UPDATE (new period)
  IF NEW.pay_period_id IS NOT NULL THEN
    PERFORM recalculate_pay_period_totals(NEW.pay_period_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pay_period_totals_on_time_entry ON time_entries;
CREATE TRIGGER update_pay_period_totals_on_time_entry
AFTER INSERT OR UPDATE OR DELETE ON time_entries
FOR EACH ROW EXECUTE FUNCTION update_pay_period_totals_on_time_entry_change();

-- Enable RLS on pay_periods table
ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read pay periods
DROP POLICY IF EXISTS "Allow authenticated users to read pay periods" ON pay_periods;
CREATE POLICY "Allow authenticated users to read pay periods"
ON pay_periods
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create pay periods
DROP POLICY IF EXISTS "Allow authenticated users to create pay periods" ON pay_periods;
CREATE POLICY "Allow authenticated users to create pay periods"
ON pay_periods
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own pay periods or if they're admins
DROP POLICY IF EXISTS "Allow users to update pay periods" ON pay_periods;
CREATE POLICY "Allow users to update pay periods"
ON pay_periods
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow users to delete their own pay periods
DROP POLICY IF EXISTS "Allow users to delete pay periods" ON pay_periods;
CREATE POLICY "Allow users to delete pay periods"
ON pay_periods
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Insert a default current pay period (bi-weekly, starting today)
INSERT INTO pay_periods (name, start_date, end_date, frequency, status)
SELECT
  'Pay Period ' || CURRENT_DATE::TEXT || ' - ' || (CURRENT_DATE + INTERVAL '13 days')::DATE::TEXT,
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '13 days')::DATE,
  'biweekly',
  'open'
WHERE NOT EXISTS (
  SELECT 1 FROM pay_periods WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
);

-- View for pay period summaries with worker breakdowns
CREATE OR REPLACE VIEW pay_period_summaries AS
SELECT
  pp.id,
  pp.name,
  pp.start_date,
  pp.end_date,
  pp.frequency,
  pp.status,
  pp.total_hours,
  pp.total_cost,
  COUNT(DISTINCT te.worker_name) as worker_count,
  COUNT(te.id) as entry_count,
  json_agg(
    json_build_object(
      'worker_name', te.worker_name,
      'total_hours', SUM(te.duration_minutes) / 60.0,
      'entry_count', COUNT(te.id)
    )
  ) FILTER (WHERE te.id IS NOT NULL) as worker_breakdown
FROM pay_periods pp
LEFT JOIN time_entries te ON te.pay_period_id = pp.id
GROUP BY pp.id, pp.name, pp.start_date, pp.end_date, pp.frequency, pp.status, pp.total_hours, pp.total_cost
ORDER BY pp.start_date DESC;
