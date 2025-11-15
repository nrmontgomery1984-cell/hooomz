-- =====================================================
-- SEED DATA: Nate's Contact List
-- Preload common contractors and vendors
-- =====================================================

-- Note: This uses NULL for created_by to make these "system" contacts
-- When implementing, you may want to assign to a specific user_id

INSERT INTO contacts (name, company, contact_type, trade_specialty, is_favorite) VALUES
  -- Contractors
  ('MatKen', 'MatKen', 'contractor', 'General Contractor', true),
  ('Shawn''s Electric', 'Shawn''s Electric', 'contractor', 'Electrical', true),
  ('Hub City Plumbing', 'Hub City Plumbing', 'contractor', 'Plumbing', true),
  ('Forward Electric', 'Forward Electric', 'contractor', 'Electrical', false),
  ('Moncton Electrical Services', 'Moncton Electrical Services', 'contractor', 'Electrical', false),
  ('East Coast Waterproofing', 'East Coast Waterproofing', 'contractor', 'Waterproofing', false),
  ('Bellvieu Roofing', 'Bellvieu Roofing', 'contractor', 'Roofing', true),
  ('East Coast Siding', 'East Coast Siding', 'contractor', 'Siding', false),
  ('Cassie Painting', 'Cassie Painting', 'contractor', 'Painting', true),
  ('City Drywall', 'City Drywall', 'contractor', 'Drywall', true),
  ('Economy Glass', 'Economy Glass', 'contractor', 'Glass & Windows', false),
  ('Mikes Insulation', 'Mikes Insulation', 'contractor', 'Insulation', false),
  ('Advantage Insulation', 'Advantage Insulation', 'contractor', 'Insulation', false),
  ('InfoExcavation', 'InfoExcavation', 'contractor', 'Excavation', false),
  ('T&W', 'T&W', 'contractor', 'General', false),
  ('Ryan Mercer', 'Ryan Mercer', 'contractor', 'General', false),

  -- Vendors / Suppliers
  ('Ritchies', 'Ritchies', 'vendor', 'Lumber & Building Supplies', true),
  ('Clover Dale', 'Clover Dale', 'vendor', 'Building Supplies', false),
  ('RPM', 'RPM', 'vendor', 'Building Supplies', false),
  ('Technopost', 'Technopost', 'vendor', 'Foundation Posts', false),
  ('Artisan', 'Artisan', 'vendor', 'Building Supplies', false),
  ('PLG', 'PLG', 'vendor', 'Building Supplies', false),
  ('Jailet', 'Jailet', 'vendor', 'Building Supplies', false),
  ('Greenfoot', 'Greenfoot', 'vendor', 'Building Supplies', false),
  ('Vintage', 'Vintage', 'vendor', 'Building Supplies', false),
  ('Atlas Systems', 'Atlas Systems', 'vendor', 'Building Systems', false),
  ('Cap Pele Saw Mill', 'Cap Pele Saw Mill', 'vendor', 'Lumber', false),
  ('Eastern Gutter Workx', 'Eastern Gutter Workx', 'vendor', 'Gutters', false),
  ('Home Hardware', 'Home Hardware', 'vendor', 'Hardware & Tools', true),
  ('Fransyl', 'Fransyl', 'vendor', 'Building Supplies', false),
  ('Boucher', 'Boucher', 'vendor', 'Building Supplies', false)
ON CONFLICT DO NOTHING;

-- Add notes to some key contacts (optional - customize as needed)
UPDATE contacts SET notes = 'Primary electrical contractor' WHERE name = 'Shawn''s Electric';
UPDATE contacts SET notes = 'Main lumber supplier' WHERE name = 'Ritchies';
UPDATE contacts SET notes = 'Go-to for waterproofing jobs' WHERE name = 'East Coast Waterproofing';
