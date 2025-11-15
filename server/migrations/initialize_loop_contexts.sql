-- ============================================================================
-- INITIALIZE LOOP CONTEXTS FOR A PROJECT
-- Run this after creating a new project to set up standard loop structure
-- ============================================================================

-- Replace 'YOUR_PROJECT_ID_HERE' with actual project ID before running

-- Variables (PostgreSQL doesn't support user variables, so we use WITH clause)
WITH project_var AS (
  SELECT 'YOUR_PROJECT_ID_HERE'::UUID AS project_id
)

-- Create standard loop contexts
, created_contexts AS (
  INSERT INTO loop_contexts (project_id, name, parent_context_id, display_order)
  SELECT
    pv.project_id,
    context_name,
    NULL,
    context_order
  FROM project_var pv,
  (VALUES
    ('Buildings', 10),
    ('Floors', 20),
    ('Rooms', 30),
    ('Zones', 40),
    ('Units', 50)
  ) AS contexts(context_name, context_order)
  RETURNING id, name, display_order
)

-- Show created contexts
SELECT
  'Loop Context Created' AS action,
  name,
  display_order AS order,
  id
FROM created_contexts
ORDER BY display_order;

-- Example: Set up parent-child relationships (optional)
-- This example makes Rooms a child of Floors
-- Uncomment and adjust as needed:

/*
WITH project_var AS (
  SELECT 'YOUR_PROJECT_ID_HERE'::UUID AS project_id
)
UPDATE loop_contexts
SET parent_context_id = (
  SELECT id FROM loop_contexts
  WHERE project_id = (SELECT project_id FROM project_var)
  AND name = 'Floors'
)
WHERE project_id = (SELECT project_id FROM project_var)
AND name = 'Rooms';
*/

-- Verify contexts created
SELECT
  'Verification' AS status,
  COUNT(*) AS contexts_created
FROM loop_contexts
WHERE project_id = 'YOUR_PROJECT_ID_HERE'::UUID;

SELECT 'Loop contexts initialized successfully!' AS message;
