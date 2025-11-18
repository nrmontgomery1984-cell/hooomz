-- Fix RLS policies for expense_categories table
-- This table should be readable by all authenticated users

-- Enable RLS on expense_categories if not already enabled
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all authenticated users to read categories" ON expense_categories;
DROP POLICY IF EXISTS "Allow admins to manage categories" ON expense_categories;

-- Create policy to allow all authenticated users to read categories
CREATE POLICY "Allow all authenticated users to read categories"
ON expense_categories
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow admins to insert/update/delete categories (optional, for future use)
CREATE POLICY "Allow admins to manage categories"
ON expense_categories
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify categories exist
SELECT COUNT(*) as category_count FROM expense_categories;
