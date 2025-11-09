-- =====================================================
-- SEED DATA FOR 222 WHITNEY PROJECT
-- Based on text messages from David Richard
-- =====================================================

-- Insert the project
INSERT INTO projects (id, name, address, client_name, status, notes)
VALUES (
  '222-whitney-project-id'::uuid,
  '222 Whitney Renovation',
  '222 Whitney',
  'David Richard',
  'active',
  'Full renovation project - upstairs and downstairs work'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INTERIOR WORK CATEGORY
-- =====================================================

INSERT INTO scope_categories (id, project_id, name, display_order)
VALUES (
  'interior-category-id'::uuid,
  '222-whitney-project-id'::uuid,
  'Interior',
  1
) ON CONFLICT (id) DO NOTHING;

-- Living Room Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'living-room-subcat-id'::uuid,
  'interior-category-id'::uuid,
  'Living Room',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('living-room-subcat-id'::uuid, 'Install baseboard and quarter round', 'pending', 1),
  ('living-room-subcat-id'::uuid, 'Touch up all painting including windows', 'pending', 2),
  ('living-room-subcat-id'::uuid, 'Install window blinds', 'pending', 3);

-- Kitchen Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'kitchen-subcat-id'::uuid,
  'interior-category-id'::uuid,
  'Kitchen',
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('kitchen-subcat-id'::uuid, 'Touch up painting on windows', 'pending', 1),
  ('kitchen-subcat-id'::uuid, 'Install transition to kitchen', 'pending', 2),
  ('kitchen-subcat-id'::uuid, 'Change casing at kitchen to entrance - to all white', 'pending', 3);

-- Hallway Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'hallway-subcat-id'::uuid,
  'interior-category-id'::uuid,
  'Hallway',
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('hallway-subcat-id'::uuid, 'Plug hole in hall floor', 'pending', 1);

-- Master Bedroom Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'master-bedroom-subcat-id'::uuid,
  'interior-category-id'::uuid,
  'Master Bedroom',
  4
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('master-bedroom-subcat-id'::uuid, 'Install gear mechanism on master window', 'pending', 1);

-- Upstairs Bathroom Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'upstairs-bath-subcat-id'::uuid,
  'interior-category-id'::uuid,
  'Upstairs Bathroom',
  5
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('upstairs-bath-subcat-id'::uuid, 'Paint inside of bathroom vanity', 'pending', 1);

-- Upstairs General Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'upstairs-general-subcat-id'::uuid,
  'interior-category-id'::uuid,
  'Upstairs General',
  6
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('upstairs-general-subcat-id'::uuid, 'All door upstairs drilled and door knobs installed', 'completed', 1),
  ('upstairs-general-subcat-id'::uuid, 'Upstairs to be 100% complete', 'in_progress', 2),
  ('upstairs-general-subcat-id'::uuid, 'Window cleaning to take place', 'pending', 3);

-- =====================================================
-- DOWNSTAIRS CATEGORY
-- =====================================================

INSERT INTO scope_categories (id, project_id, name, display_order)
VALUES (
  'downstairs-category-id'::uuid,
  '222-whitney-project-id'::uuid,
  'Downstairs',
  2
) ON CONFLICT (id) DO NOTHING;

-- Washer/Dryer Area Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'washer-dryer-subcat-id'::uuid,
  'downstairs-category-id'::uuid,
  'Washer/Dryer Bath Area',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('washer-dryer-subcat-id'::uuid, 'Install flooring in washer/drier bath area', 'pending', 1),
  ('washer-dryer-subcat-id'::uuid, 'Install baseboard', 'pending', 2),
  ('washer-dryer-subcat-id'::uuid, 'Install W and D (washer and dryer)', 'pending', 3);

-- Downstairs Windows/Doors Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'downstairs-windows-doors-subcat-id'::uuid,
  'downstairs-category-id'::uuid,
  'Windows & Doors',
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('downstairs-windows-doors-subcat-id'::uuid, 'Install window finish', 'pending', 1),
  ('downstairs-windows-doors-subcat-id'::uuid, 'Install doors', 'pending', 2);

-- Stairs Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'stairs-subcat-id'::uuid,
  'downstairs-category-id'::uuid,
  'Stairs',
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('stairs-subcat-id'::uuid, 'Install stairs and running boards', 'pending', 1),
  ('stairs-subcat-id'::uuid, 'Install handrail', 'pending', 2);

-- Downstairs Flooring Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'downstairs-flooring-subcat-id'::uuid,
  'downstairs-category-id'::uuid,
  'Flooring',
  4
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('downstairs-flooring-subcat-id'::uuid, 'Paint floor', 'pending', 1);

-- Entrance Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'entrance-subcat-id'::uuid,
  'downstairs-category-id'::uuid,
  'Entrance',
  5
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('entrance-subcat-id'::uuid, 'Complete landing at enterance', 'pending', 1);

-- =====================================================
-- EXTERIOR CATEGORY
-- =====================================================

INSERT INTO scope_categories (id, project_id, name, display_order)
VALUES (
  'exterior-category-id'::uuid,
  '222-whitney-project-id'::uuid,
  'Exterior',
  3
) ON CONFLICT (id) DO NOTHING;

-- Exterior General Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'exterior-general-subcat-id'::uuid,
  'exterior-category-id'::uuid,
  'Exterior General',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('exterior-general-subcat-id'::uuid, 'Install mail box - on counter. Needs Aztec', 'pending', 1),
  ('exterior-general-subcat-id'::uuid, 'Install numbers - on counter. Needs Aztec', 'pending', 2),
  ('exterior-general-subcat-id'::uuid, 'Install covers for holes alongside side door - take a look and comment. If they work: Need paint and install', 'pending', 3),
  ('exterior-general-subcat-id'::uuid, 'Spray foam drier vent tomorrow, need some sort of cover for it', 'pending', 4);

-- =====================================================
-- MECHANICAL CATEGORY
-- =====================================================

INSERT INTO scope_categories (id, project_id, name, display_order)
VALUES (
  'mechanical-category-id'::uuid,
  '222-whitney-project-id'::uuid,
  'Mechanical',
  4
) ON CONFLICT (id) DO NOTHING;

-- HVAC Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'hvac-subcat-id'::uuid,
  'mechanical-category-id'::uuid,
  'HVAC',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('hvac-subcat-id'::uuid, 'Ryan to install heater', 'pending', 1);

-- =====================================================
-- GENERAL / CLEANUP CATEGORY
-- =====================================================

INSERT INTO scope_categories (id, project_id, name, display_order)
VALUES (
  'general-category-id'::uuid,
  '222-whitney-project-id'::uuid,
  'General & Cleanup',
  5
) ON CONFLICT (id) DO NOTHING;

-- Cleanup Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'cleanup-subcat-id'::uuid,
  'general-category-id'::uuid,
  'Cleanup',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('cleanup-subcat-id'::uuid, 'Place has been cleaned top to bottom - all garbage removed and swept', 'completed', 1);

-- Outstanding Work Subcategory
INSERT INTO scope_subcategories (id, category_id, name, display_order)
VALUES (
  'outstanding-subcat-id'::uuid,
  'general-category-id'::uuid,
  'Outstanding Items',
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
  ('outstanding-subcat-id'::uuid, 'Mark had work to finish', 'pending', 1);
