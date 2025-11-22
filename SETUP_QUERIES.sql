-- =====================================================
-- HOOOMZ BUILDZ - INITIAL DATA SETUP QUERIES
-- Run these in Supabase SQL Editor to configure your system
-- =====================================================

-- =====================================================
-- STEP 1A: CHECK CURRENT EMPLOYEES
-- =====================================================

SELECT id, first_name, last_name, email, hourly_rate, charged_rate, is_active
FROM employees
WHERE is_active = TRUE
ORDER BY first_name;

-- =====================================================
-- STEP 1B: UPDATE EMPLOYEE RATES
-- Copy the IDs from above and update with actual rates
-- =====================================================

-- Example: Update specific employees by ID
-- Replace 'employee-uuid-here' with actual UUIDs from query above

UPDATE employees
SET
  hourly_rate = 28.00,    -- What you actually pay them per hour
  charged_rate = 55.00    -- What you charge clients for their work
WHERE id = 'employee-uuid-here';  -- Jake's ID

UPDATE employees
SET
  hourly_rate = 32.00,
  charged_rate = 65.00
WHERE id = 'another-employee-uuid';  -- Sarah's ID

-- OR: Update all employees at once with a 2x multiplier
-- (Only if you don't have rates set yet)
UPDATE employees
SET charged_rate = hourly_rate * 2.0
WHERE charged_rate IS NULL AND hourly_rate IS NOT NULL;

-- Verify the updates
SELECT first_name, last_name, hourly_rate, charged_rate
FROM employees
WHERE is_active = TRUE;

-- =====================================================
-- STEP 1C: CONFIGURE PAYROLL SETTINGS
-- =====================================================

-- Check current settings
SELECT * FROM payroll_settings;

-- Update with your actual pay period
UPDATE payroll_settings
SET
  pay_period_start_date = '2025-01-06',  -- Your first pay period start date
  pay_period_frequency = 'bi_weekly';     -- Options: weekly, bi_weekly, semi_monthly, monthly

-- Verify current pay period
SELECT
  pay_period_start_date,
  pay_period_frequency,
  (SELECT * FROM get_current_pay_period()) as current_period
FROM payroll_settings;

-- =====================================================
-- STEP 2A: FIND YOUR ACTIVE PROJECTS
-- =====================================================

SELECT id, name, status, budget, start_date
FROM projects
WHERE status = 'active'
ORDER BY name;

-- =====================================================
-- STEP 2B: CREATE CATEGORIES FOR A PROJECT
-- Replace 'PROJECT-UUID-HERE' with actual project ID from above
-- =====================================================

-- Example: Categories for a bathroom remodel project

INSERT INTO categories (project_id, phase_id, name, labor_budget_dollars, material_budget_dollars, status)
VALUES
  -- Demo phase
  (
    'PROJECT-UUID-HERE',
    (SELECT id FROM phases WHERE name = 'Demo' AND is_global_template = TRUE LIMIT 1),
    'Demo & Disposal',
    2500.00,  -- Labor budget
    500.00,   -- Material budget
    'complete'
  ),

  -- Rough-in phase
  (
    'PROJECT-UUID-HERE',
    (SELECT id FROM phases WHERE name = 'Rough-In' AND is_global_template = TRUE LIMIT 1),
    'Plumbing Rough-in',
    3000.00,
    2500.00,
    'complete'
  ),
  (
    'PROJECT-UUID-HERE',
    (SELECT id FROM phases WHERE name = 'Rough-In' AND is_global_template = TRUE LIMIT 1),
    'Electrical Rough-in',
    2800.00,
    1800.00,
    'complete'
  ),

  -- Closing In phase
  (
    'PROJECT-UUID-HERE',
    (SELECT id FROM phases WHERE name = 'Closing In' AND is_global_template = TRUE LIMIT 1),
    'Drywall Installation',
    1800.00,
    1200.00,
    'in_progress'
  ),
  (
    'PROJECT-UUID-HERE',
    (SELECT id FROM phases WHERE name = 'Closing In' AND is_global_template = TRUE LIMIT 1),
    'Tile Prep',
    1500.00,
    800.00,
    'in_progress'
  ),

  -- Finishing phase
  (
    'PROJECT-UUID-HERE',
    (SELECT id FROM phases WHERE name = 'Finishing' AND is_global_template = TRUE LIMIT 1),
    'Tile Installation',
    3200.00,
    3500.00,
    'not_started'
  ),
  (
    'PROJECT-UUID-HERE',
    (SELECT id FROM phases WHERE name = 'Finishing' AND is_global_template = TRUE LIMIT 1),
    'Fixture Installation',
    2200.00,
    5000.00,
    'not_started'
  ),
  (
    'PROJECT-UUID-HERE',
    (SELECT id FROM phases WHERE name = 'Finishing' AND is_global_template = TRUE LIMIT 1),
    'Paint & Touch-up',
    1200.00,
    600.00,
    'not_started'
  );

-- Verify categories were created
SELECT
  c.name as category_name,
  p.name as phase_name,
  c.labor_budget_dollars,
  c.material_budget_dollars,
  c.status
FROM categories c
JOIN phases p ON c.phase_id = p.id
WHERE c.project_id = 'PROJECT-UUID-HERE'
ORDER BY p.display_order, c.name;

-- =====================================================
-- STEP 2C: CREATE SUB-CATEGORIES
-- =====================================================

-- First, get the category ID for Drywall Installation
SELECT id, name FROM categories WHERE name = 'Drywall Installation';

-- Then create sub-categories (replace CATEGORY-UUID-HERE)
INSERT INTO sub_categories (category_id, name, hours_budgeted, order_index)
VALUES
  ('CATEGORY-UUID-HERE', 'Hanging', 12.00, 0),
  ('CATEGORY-UUID-HERE', 'Taping', 8.00, 1),
  ('CATEGORY-UUID-HERE', 'Sanding', 6.00, 2),
  ('CATEGORY-UUID-HERE', 'Priming', 4.00, 3);

-- Verify sub-categories
SELECT
  sc.name,
  sc.hours_budgeted,
  c.name as category_name
FROM sub_categories sc
JOIN categories c ON sc.category_id = c.id
WHERE c.name = 'Drywall Installation'
ORDER BY sc.order_index;

-- =====================================================
-- STEP 3: ASSIGN CREW TO CATEGORIES (Optional)
-- =====================================================

-- Get employee IDs
SELECT id, first_name, last_name FROM employees WHERE is_active = TRUE;

-- Assign crew to a category
UPDATE categories
SET assigned_crew = '["employee-uuid-1", "employee-uuid-2"]'::jsonb
WHERE id = 'category-uuid-here';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check everything is set up
SELECT 'Employees with rates' as check_item, COUNT(*) as count
FROM employees
WHERE is_active = TRUE AND hourly_rate IS NOT NULL AND charged_rate IS NOT NULL

UNION ALL

SELECT 'Active projects', COUNT(*)
FROM projects
WHERE status = 'active'

UNION ALL

SELECT 'Categories created', COUNT(*)
FROM categories

UNION ALL

SELECT 'Sub-categories created', COUNT(*)
FROM sub_categories

UNION ALL

SELECT 'Payroll configured', COUNT(*)
FROM payroll_settings;
