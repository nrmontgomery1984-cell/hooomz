-- =====================================================
-- EMPLOYEES AND TIME OFF MANAGEMENT
-- Comprehensive employee information and PTO tracking
-- =====================================================

-- Employees Table
-- Stores comprehensive employee information
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,

  -- Employment Details
  hire_date DATE,
  position TEXT,
  department TEXT,
  hourly_rate DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,

  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Address (optional)
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Time Off Requests Table
-- Tracks PTO requests from employees
CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Request Details
  request_type TEXT NOT NULL CHECK (request_type IN ('vacation', 'sick', 'personal', 'unpaid', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(4, 2) NOT NULL, -- Supports half days

  -- Status Management
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,

  -- Additional Info
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_employee ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_dates ON time_off_requests(start_date, end_date);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_time_off_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at_trigger
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employees_updated_at();

CREATE TRIGGER update_time_off_requests_updated_at_trigger
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_time_off_requests_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
-- Anyone authenticated can view employees
CREATE POLICY "Authenticated users can view employees"
  ON employees FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can create/update/delete employees
CREATE POLICY "Admins can manage employees"
  ON employees FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for time_off_requests
-- Users can view their own requests and admins can view all
CREATE POLICY "Users can view their own time off requests"
  ON time_off_requests FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Users can create their own time off requests
CREATE POLICY "Users can create their own time off requests"
  ON time_off_requests FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Users can update/cancel their own pending requests
CREATE POLICY "Users can update their own pending requests"
  ON time_off_requests FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE email = auth.jwt() ->> 'email'
    )
    AND status = 'pending'
  );

-- Admins can manage all time off requests
CREATE POLICY "Admins can manage all time off requests"
  ON time_off_requests FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Comments for documentation
COMMENT ON TABLE employees IS 'Company employees with comprehensive information';
COMMENT ON TABLE time_off_requests IS 'PTO and time off requests from employees';
COMMENT ON COLUMN employees.emergency_contact_name IS 'Name of emergency contact person';
COMMENT ON COLUMN employees.emergency_contact_phone IS 'Phone number of emergency contact';
COMMENT ON COLUMN employees.hourly_rate IS 'Employee hourly pay rate';
COMMENT ON COLUMN time_off_requests.request_type IS 'Type: vacation, sick, personal, unpaid, other';
COMMENT ON COLUMN time_off_requests.total_days IS 'Total days off (supports half days with decimals)';
COMMENT ON COLUMN time_off_requests.status IS 'Status: pending, approved, denied, cancelled';

-- Migrate existing workers to employees table (if workers table exists)
INSERT INTO employees (first_name, last_name, email, phone, position, hourly_rate, hire_date, is_active)
SELECT
  split_part(name, ' ', 1) as first_name,
  COALESCE(split_part(name, ' ', 2), '') as last_name,
  email,
  phone,
  role as position,
  hourly_rate,
  CURRENT_DATE as hire_date,
  is_active
FROM workers
WHERE name IS NOT NULL
ON CONFLICT (email) DO NOTHING;
