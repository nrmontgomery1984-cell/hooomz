-- Populate Construction Categories and Subcategories
-- Based on residential construction categories
--
-- IMPORTANT: This script will add categories and subcategories for a project
--
-- Run this ONCE per project to set up the category structure.

CREATE OR REPLACE FUNCTION populate_construction_categories(project_uuid UUID)
RETURNS void AS $$
DECLARE
  cat_id UUID;
BEGIN
  -- Demo
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Demo', 1) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Remove copper', 1),
    (cat_id, 'Remove knob and tube', 2),
    (cat_id, 'Disconnect plumbing', 3),
    (cat_id, 'Disconnect electrical', 4),
    (cat_id, 'Remove attic insulation', 5);

  -- Design and Planning
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Design and Planning', 2) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Permits', 1),
    (cat_id, 'Design', 2),
    (cat_id, 'Scheduling', 3),
    (cat_id, 'Budgeting', 4),
    (cat_id, 'Engineering', 5),
    (cat_id, 'Permit fees', 6),
    (cat_id, 'Atlantic Home Warranty', 7),
    (cat_id, 'Energy Evaluation', 8),
    (cat_id, 'Land purchase', 9),
    (cat_id, 'NB power incentives', 10);

  -- Excavation
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Excavation', 3) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Grub Land', 1),
    (cat_id, 'Curb cut', 2),
    (cat_id, 'Backfill', 3),
    (cat_id, 'Excavation', 4),
    (cat_id, 'Backfill/rough grade', 5),
    (cat_id, 'Locate', 6);

  -- Foundation
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Foundation', 4) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Excavation', 1),
    (cat_id, 'Formwork', 2),
    (cat_id, 'Concrete', 3),
    (cat_id, 'Foundation Walls', 4),
    (cat_id, 'Technopost', 5),
    (cat_id, 'Concrete stairs', 6);

  -- Framing - Structural
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Framing - Structural', 5) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Framing - Walls', 1),
    (cat_id, 'Framing - slip wall', 2),
    (cat_id, 'Bracing', 3),
    (cat_id, 'Sheathing - Walls', 4),
    (cat_id, 'Sheathing - Roof', 5),
    (cat_id, 'Framing - Roof', 6),
    (cat_id, 'Install Beam - SPF', 7),
    (cat_id, 'Install Beam - LVL', 8),
    (cat_id, 'Install Beam - Steel', 9),
    (cat_id, 'Framing - Rake walls', 10),
    (cat_id, 'Floor', 11),
    (cat_id, 'Sub-floor', 12);

  -- Framing - Non structural
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Framing - Non structural', 6) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Partition walls', 1),
    (cat_id, 'Sub-floor', 2),
    (cat_id, 'Dri-core', 3),
    (cat_id, 'Strapping', 4),
    (cat_id, 'Stair stringers', 5);

  -- Building Envelope
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Building Envelope', 7) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Insulation - Cavities', 1),
    (cat_id, 'Insulation - Floor', 2),
    (cat_id, 'Insulation - Exterior', 3),
    (cat_id, 'Insulation - Attic', 4),
    (cat_id, 'Waterproofing', 5),
    (cat_id, 'Overhead doors', 6),
    (cat_id, 'Window - Standard', 7),
    (cat_id, 'Window - Oversize', 8),
    (cat_id, 'Door - Swing', 9),
    (cat_id, 'Door - Patio', 10),
    (cat_id, 'Opening Prep', 11),
    (cat_id, 'WRB', 12),
    (cat_id, 'Rainscreen', 13);

  -- Drywall and Paint
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Drywall and Paint', 8) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Drywall - Walls', 1),
    (cat_id, 'Drywall - Ceiling', 2),
    (cat_id, 'Drywall - Taping', 3),
    (cat_id, 'Painting', 4),
    (cat_id, 'Painting - Smell/stain sealing', 5);

  -- Flooring
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Flooring', 9) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Flooring - Ditra', 1),
    (cat_id, 'Flooring - Ditra heat', 2),
    (cat_id, 'Flooring - Tile', 3),
    (cat_id, 'Flooring - Laminate', 4),
    (cat_id, 'Flooring - Hardwood', 5),
    (cat_id, 'Flooring - Carpet', 6),
    (cat_id, 'Flooring - LVT', 7),
    (cat_id, 'Concrete floor paint', 8),
    (cat_id, 'Flooring - Puzzle mat', 9);

  -- Finish Carpentry
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Finish Carpentry', 10) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Trim - Casing', 1),
    (cat_id, 'Trim - Baseboards', 2),
    (cat_id, 'Trim - Other', 3),
    (cat_id, 'Interior Doors - Swing', 4),
    (cat_id, 'Interior Doors - Pocket', 5),
    (cat_id, 'Interior Doors - Double', 6),
    (cat_id, 'Interior Door - Closet', 7),
    (cat_id, 'Shelving - Closet', 8);

  -- Siding
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Siding', 11) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Siding - Vinyl', 1),
    (cat_id, 'Siding - Hardie', 2),
    (cat_id, 'Siding - Wood', 3),
    (cat_id, 'Soffit and Fascia', 4);

  -- Roofing
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Roofing', 12) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Membrane - Textile', 1),
    (cat_id, 'Membrane - High heat', 2),
    (cat_id, 'Roofing - Asphalt (3:12-6:12)', 3),
    (cat_id, 'Roofing - Asphalt (7:12-12:12)', 4),
    (cat_id, 'Roofing - Metal (3:12-6:12)', 5),
    (cat_id, 'Roofing - Metal (7:12-12:12)', 6),
    (cat_id, 'Gutters', 7),
    (cat_id, 'Gutter with guard', 8);

  -- Masonry
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Masonry', 13) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Parging', 1),
    (cat_id, 'Stone/Masonry', 2);

  -- Plumbing
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Plumbing', 14) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Toilet', 1),
    (cat_id, 'Shower - Acrylic base', 2),
    (cat_id, 'Shower - Fixtures', 3),
    (cat_id, 'Bathtub', 4),
    (cat_id, 'Bathtub - Fixtures', 5),
    (cat_id, 'Hose bib', 6),
    (cat_id, 'Sump pump', 7),
    (cat_id, 'Wash box', 8),
    (cat_id, 'Sink - Bathroom', 9),
    (cat_id, 'Sink - Kitchen', 10),
    (cat_id, 'Sink - Bar', 11),
    (cat_id, 'Sink - Laundry', 12),
    (cat_id, 'Dishwasher', 13),
    (cat_id, 'Aux. water line', 14);

  -- Electrical
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Electrical', 15) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Pot light', 1),
    (cat_id, 'Pendant light', 2),
    (cat_id, 'Sconce light', 3),
    (cat_id, 'Ceiling fan', 4),
    (cat_id, 'Exterior light - Sconce', 5),
    (cat_id, 'Exterior light - Soffit', 6),
    (cat_id, 'Baseboard heater', 7),
    (cat_id, 'Receptacle', 8),
    (cat_id, 'Receptacle - GFCI', 9),
    (cat_id, 'Receptacle - Specialty', 10),
    (cat_id, 'Switch', 11),
    (cat_id, 'Bathroom exhaust', 12),
    (cat_id, 'Kitchen exhaust', 13),
    (cat_id, 'Panel change/upgrade', 14),
    (cat_id, 'Doorbell', 15),
    (cat_id, 'Undercabinet lighting', 16),
    (cat_id, '220v Outlet', 17);

  -- HVAC
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'HVAC', 16) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Ductwork', 1),
    (cat_id, 'Mini split', 2),
    (cat_id, 'Air exchanger', 3),
    (cat_id, 'Fireplace', 4);

  -- Landscaping
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Landscaping', 17) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Grading', 1),
    (cat_id, 'Sod', 2),
    (cat_id, 'Planting', 3),
    (cat_id, 'Hydro seed', 4);

  -- Overhead
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Overhead', 18) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Snow removal', 1),
    (cat_id, 'Temporary Fencing', 2),
    (cat_id, 'Garbage Removal', 3),
    (cat_id, 'Site cleaning', 4),
    (cat_id, 'Porta potty', 5),
    (cat_id, 'Error margin', 6),
    (cat_id, 'Project Management', 7),
    (cat_id, 'Material moving', 8),
    (cat_id, 'Site meeting', 9);

  -- Hardscaping
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Hardscaping', 19) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Paving stones', 1),
    (cat_id, 'Deck - Grade', 2),
    (cat_id, 'Deck - 2\' - 6\'', 3),
    (cat_id, 'Deck - 6\' and above', 4),
    (cat_id, 'Deck Stairs', 5),
    (cat_id, 'Porch roof', 6),
    (cat_id, 'Railing', 7),
    (cat_id, 'Fence', 8),
    (cat_id, 'Shed/baby barn', 9);

  -- Millwork
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Millwork', 20) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Kitchen - Base', 1),
    (cat_id, 'Kitchen - Upper', 2),
    (cat_id, 'Pantry', 3),
    (cat_id, 'Vanity', 4),
    (cat_id, 'Bar', 5),
    (cat_id, 'Custom shelving', 6),
    (cat_id, 'Panel box out', 7),
    (cat_id, 'Countertop', 8),
    (cat_id, 'Laundry - Base', 9),
    (cat_id, 'Laundry - Upper', 10),
    (cat_id, 'Walk-in Closet', 11);

  -- Tile
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Tile', 21) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Backsplash', 1),
    (cat_id, 'Floor', 2),
    (cat_id, 'Floor-heat', 3),
    (cat_id, 'Wall', 4),
    (cat_id, 'Shower - walls', 5),
    (cat_id, 'Shower - Base', 6),
    (cat_id, 'Shower doors', 7),
    (cat_id, 'Mortar, Grout, Trims', 8);

  -- Stairs and Railing
  INSERT INTO scope_categories (project_id, name, display_order)
  VALUES (project_uuid, 'Stairs and Railing', 22) RETURNING id INTO cat_id;

  INSERT INTO scope_subcategories (category_id, name, display_order) VALUES
    (cat_id, 'Treads', 1),
    (cat_id, 'Risers', 2),
    (cat_id, 'Landing', 3),
    (cat_id, 'Railing', 4),
    (cat_id, 'Nosing', 5),
    (cat_id, 'Skirting', 6),
    (cat_id, 'Stringer', 7);

END;
$$ LANGUAGE plpgsql;

-- Now you can call this function for any project
-- Example usage (replace with your actual project ID):
-- SELECT populate_construction_categories('your-project-id-here');

-- To find your project IDs and populate categories for them:
-- SELECT id, name FROM projects;
-- Then call: SELECT populate_construction_categories('project-id');
