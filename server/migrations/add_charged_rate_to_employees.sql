-- Add charged_rate field to employees table
-- This is used for budget calculations (different from hourly_rate which is actual cost)

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS charged_rate DECIMAL(10,2);

-- Add comment
COMMENT ON COLUMN employees.hourly_rate IS 'Employee actual hourly wage (cost to company, hidden from employee)';
COMMENT ON COLUMN employees.charged_rate IS 'Employee charged rate for budget calculations (revenue)';

-- Update existing employees with a default charged rate (e.g., 2x hourly_rate as a starting point)
-- Manager can adjust these later
UPDATE employees
SET charged_rate = hourly_rate * 2
WHERE charged_rate IS NULL AND hourly_rate IS NOT NULL;
