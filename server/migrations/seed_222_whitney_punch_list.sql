-- =====================================================
-- 222 WHITNEY PROJECT - PUNCH LIST TASKS
-- Adds all punch list items to the 222 Whitney project
-- =====================================================

-- First, get the project ID for 222 Whitney
-- You'll need to replace 'PROJECT_ID_HERE' with the actual project ID after finding it
-- To find it, run: SELECT id FROM projects WHERE name = '222 Whitney';

-- For this script to work, replace 'PROJECT_ID_HERE' with the actual UUID

DO $$
DECLARE
  v_project_id UUID;
  v_category_id UUID;
  v_master_bedroom_id UUID;
  v_hallway_id UUID;
  v_bedroom_two_id UUID;
  v_bedroom_three_id UUID;
  v_main_bathroom_id UUID;
  v_living_room_id UUID;
  v_kitchen_id UUID;
  v_side_entry_id UUID;
  v_common_area_id UUID;
  v_basement_bathroom_id UUID;
  v_mechanical_room_id UUID;
  v_basement_bedroom_one_id UUID;
  v_basement_bedroom_two_id UUID;
  v_storage_room_id UUID;
BEGIN
  -- Get the 222 Whitney project ID
  SELECT id INTO v_project_id FROM projects WHERE name = '222 Whitney' LIMIT 1;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION '222 Whitney project not found. Please create the project first.';
  END IF;

  -- Create or get the main category (Punch List)
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (v_project_id, 'Punch List', 1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_category_id;

  -- If the category already exists, get its ID
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM scope_categories
    WHERE project_id = v_project_id AND name = 'Punch List' LIMIT 1;
  END IF;

  -- Create subcategories (rooms) and add tasks

  -- Master Bedroom
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Master Bedroom', 1)
  RETURNING id INTO v_master_bedroom_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order)
  VALUES (v_master_bedroom_id, 'Replace window crank', 'pending', 1);

  -- Hallway
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Hallway', 2)
  RETURNING id INTO v_hallway_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
    (v_hallway_id, 'Install vent cover', 'pending', 1),
    (v_hallway_id, 'Paint shared kitchen wall', 'pending', 2);

  -- Bedroom Two
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Bedroom Two', 3)
  RETURNING id INTO v_bedroom_two_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order)
  VALUES (v_bedroom_two_id, 'Plug hole in floor', 'completed', 1);

  -- Bedroom Three
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Bedroom Three', 4)
  RETURNING id INTO v_bedroom_three_id;

  -- No tasks for Bedroom Three (marked as complete)

  -- Main Bathroom
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Main Bathroom', 5)
  RETURNING id INTO v_main_bathroom_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
    (v_main_bathroom_id, 'Change light bulbs in fixture', 'pending', 1),
    (v_main_bathroom_id, 'Tile next to vanity', 'pending', 2),
    (v_main_bathroom_id, 'Change knob', 'pending', 3);

  -- Living Room
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Living Room', 6)
  RETURNING id INTO v_living_room_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
    (v_living_room_id, 'Paint ceiling at fireplace wall', 'pending', 1),
    (v_living_room_id, 'Caulking at floor next to fireplace', 'pending', 2),
    (v_living_room_id, 'Plug hole in floor', 'pending', 3),
    (v_living_room_id, 'Painting next to fireplace', 'pending', 4),
    (v_living_room_id, 'Finish quarter round at front door', 'pending', 5);

  -- Kitchen
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Kitchen', 7)
  RETURNING id INTO v_kitchen_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
    (v_kitchen_id, 'Paint touch-up at receptacle', 'pending', 1),
    (v_kitchen_id, 'Install blind at kitchen window', 'pending', 2),
    (v_kitchen_id, 'Fix paint not sticking at side door jam', 'pending', 3),
    (v_kitchen_id, 'Side door opening adjustment', 'pending', 4);

  -- Side Entry
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Side Entry', 8)
  RETURNING id INTO v_side_entry_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
    (v_side_entry_id, 'Paint touch-ups on treads and risers', 'pending', 1),
    (v_side_entry_id, 'Flooring on landing', 'pending', 2),
    (v_side_entry_id, 'Trim new door at access panel for basement', 'pending', 3);

  -- Common Area
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Common Area', 9)
  RETURNING id INTO v_common_area_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
    (v_common_area_id, 'Finish baseboard', 'pending', 1),
    (v_common_area_id, 'Install door hardware', 'pending', 2),
    (v_common_area_id, 'Paint trim', 'pending', 3);

  -- Basement Bathroom
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Basement Bathroom', 10)
  RETURNING id INTO v_basement_bathroom_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
    (v_basement_bathroom_id, 'Vent dryer', 'pending', 1),
    (v_basement_bathroom_id, 'Finish flooring', 'pending', 2),
    (v_basement_bathroom_id, 'Install baseboard', 'pending', 3),
    (v_basement_bathroom_id, 'Install exhaust fan cover', 'pending', 4),
    (v_basement_bathroom_id, 'Remove plastic from tub surround and caulk', 'pending', 5),
    (v_basement_bathroom_id, 'Patch around shower head escutcheon', 'pending', 6);

  -- Mechanical Room
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Mechanical Room', 11)
  RETURNING id INTO v_mechanical_room_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order)
  VALUES (v_mechanical_room_id, 'Clean up', 'pending', 1);

  -- Basement Bedroom One
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Basement Bedroom One', 12)
  RETURNING id INTO v_basement_bedroom_one_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
    (v_basement_bedroom_one_id, 'Nail baseboard', 'pending', 1),
    (v_basement_bedroom_one_id, 'Casing around door', 'pending', 2),
    (v_basement_bedroom_one_id, 'Trim windows', 'pending', 3);

  -- Basement Bedroom Two
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Basement Bedroom Two', 13)
  RETURNING id INTO v_basement_bedroom_two_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order) VALUES
    (v_basement_bedroom_two_id, 'Nail baseboard', 'pending', 1),
    (v_basement_bedroom_two_id, 'Install and trim door', 'pending', 2),
    (v_basement_bedroom_two_id, 'Trim windows', 'pending', 3);

  -- Storage Room
  INSERT INTO scope_subcategories (category_id, name, display_order)
  VALUES (v_category_id, 'Storage Room', 14)
  RETURNING id INTO v_storage_room_id;

  INSERT INTO scope_items (subcategory_id, description, status, display_order)
  VALUES (v_storage_room_id, 'Clean up', 'pending', 1);

  RAISE NOTICE 'Successfully added punch list tasks to 222 Whitney project!';
  RAISE NOTICE 'Total: 14 rooms, ~40 tasks';
END $$;
