-- =====================================================
-- TASK ENHANCEMENTS: Templates, Checklists, Photos
-- Based on construction category spreadsheet and
-- Atul Gawande's Checklist Manifesto principles
-- =====================================================

-- =====================================================
-- 1. WORKERS/EMPLOYEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  hourly_rate DECIMAL(8, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default workers
INSERT INTO workers (name, role, is_active) VALUES
  ('Nathan', 'General Contractor', true),
  ('Nishant', 'General Contractor', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. STANDARD CATEGORY/SUBCATEGORY TEMPLATES
-- Reference data from the construction category spreadsheet
-- =====================================================
CREATE TABLE IF NOT EXISTS category_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subcategory_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_template_id UUID REFERENCES category_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_template_id, name)
);

-- Insert standard categories from spreadsheet
INSERT INTO category_templates (name, display_order) VALUES
  ('Demo', 1),
  ('Design and Planning', 2),
  ('Foundation', 3),
  ('Framing - Structural', 4),
  ('Framing - Non structural', 5),
  ('Building Envelope', 6),
  ('Drywall and Paint', 7),
  ('Flooring', 8),
  ('Finish Carpentry', 9),
  ('Siding', 10),
  ('Roofing', 11),
  ('Masonry', 12),
  ('Landscaping', 13),
  ('Hardscaping', 14),
  ('Millwork', 15),
  ('Tile', 16),
  ('Stairs and Railing', 17)
ON CONFLICT (name) DO NOTHING;

-- Insert subcategories for each category (sample - can be expanded)
-- Framing - Structural
INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Framing - Walls', 1 FROM category_templates WHERE name = 'Framing - Structural'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Framing - slip wall', 2 FROM category_templates WHERE name = 'Framing - Structural'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Bracing', 3 FROM category_templates WHERE name = 'Framing - Structural'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Sheathing - Walls', 4 FROM category_templates WHERE name = 'Framing - Structural'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Sheathing - Roof', 5 FROM category_templates WHERE name = 'Framing - Structural'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Framing - Roof', 6 FROM category_templates WHERE name = 'Framing - Structural'
ON CONFLICT DO NOTHING;

-- Drywall and Paint
INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Drywall - Walls', 1 FROM category_templates WHERE name = 'Drywall and Paint'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Drywall - Ceiling', 2 FROM category_templates WHERE name = 'Drywall and Paint'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Drywall - Taping', 3 FROM category_templates WHERE name = 'Drywall and Paint'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Painting', 4 FROM category_templates WHERE name = 'Drywall and Paint'
ON CONFLICT DO NOTHING;

-- Finish Carpentry
INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Trim - Casing', 1 FROM category_templates WHERE name = 'Finish Carpentry'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Trim - Baseboards', 2 FROM category_templates WHERE name = 'Finish Carpentry'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Interior Doors - Swing', 3 FROM category_templates WHERE name = 'Finish Carpentry'
ON CONFLICT DO NOTHING;

-- Flooring
INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Flooring - Tile', 1 FROM category_templates WHERE name = 'Flooring'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Flooring - Laminate', 2 FROM category_templates WHERE name = 'Flooring'
ON CONFLICT DO NOTHING;

INSERT INTO subcategory_templates (category_template_id, name, display_order)
SELECT id, 'Flooring - Hardwood', 3 FROM category_templates WHERE name = 'Flooring'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. TASK DETAIL ENHANCEMENTS
-- =====================================================

-- Link scope items to standard category templates (optional)
ALTER TABLE scope_items
ADD COLUMN IF NOT EXISTS category_template_id UUID REFERENCES category_templates(id),
ADD COLUMN IF NOT EXISTS subcategory_template_id UUID REFERENCES subcategory_templates(id);

-- Tools and Materials for scope items
CREATE TABLE IF NOT EXISTS scope_item_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scope_item_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Checklist items (Atul Gawande style - simple, focused on critical steps)
CREATE TABLE IF NOT EXISTS scope_item_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Photos for scope items (before/during/after)
CREATE TABLE IF NOT EXISTS scope_item_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  photo_type TEXT CHECK (photo_type IN ('before', 'during', 'after', 'issue', 'other')),
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. CHECKLIST TEMPLATES FOR COMMON TASKS
-- Based on Atul Gawande's Checklist Manifesto:
-- - Simple and concise (5-9 items)
-- - Focus on critical steps that are easy to skip
-- - "Do-confirm" style (perform task, then check off)
-- =====================================================

CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_template_id UUID REFERENCES category_templates(id),
  subcategory_template_id UUID REFERENCES subcategory_templates(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_template_id UUID REFERENCES checklist_templates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample checklist templates following Atul Gawande principles

-- DRYWALL INSTALLATION CHECKLIST
INSERT INTO checklist_templates (name, description)
VALUES ('Drywall Installation', 'Critical steps for proper drywall installation')
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify all electrical/plumbing rough-in is complete and inspected', 1, true FROM checklist_templates WHERE name = 'Drywall Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check for proper insulation in all cavities', 2, true FROM checklist_templates WHERE name = 'Drywall Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm vapor barrier installed where required', 3, true FROM checklist_templates WHERE name = 'Drywall Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify fastener spacing (12" max on walls, 8" on ceilings)', 4, false FROM checklist_templates WHERE name = 'Drywall Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check all seams are staggered (avoid 4-way intersections)', 5, false FROM checklist_templates WHERE name = 'Drywall Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm no fasteners are proud or sunken', 6, false FROM checklist_templates WHERE name = 'Drywall Installation'
ON CONFLICT DO NOTHING;

-- FRAMING CHECKLIST
INSERT INTO checklist_templates (name, description)
VALUES ('Wall Framing', 'Essential framing safety and quality checks')
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify layout matches architectural plans', 1, true FROM checklist_templates WHERE name = 'Wall Framing'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm all plates are properly aligned and fastened', 2, true FROM checklist_templates WHERE name = 'Wall Framing'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check stud spacing (16" O.C. unless specified otherwise)', 3, true FROM checklist_templates WHERE name = 'Wall Framing'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify window/door headers are sized correctly per span tables', 4, true FROM checklist_templates WHERE name = 'Wall Framing'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm king studs and jack studs at all openings', 5, true FROM checklist_templates WHERE name = 'Wall Framing'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check walls are plumb and square', 6, false FROM checklist_templates WHERE name = 'Wall Framing'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify proper blocking for cabinets, fixtures, and handrails', 7, false FROM checklist_templates WHERE name = 'Wall Framing'
ON CONFLICT DO NOTHING;

-- PAINTING CHECKLIST
INSERT INTO checklist_templates (name, description)
VALUES ('Interior Painting', 'Quality finish painting checklist')
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm all surfaces are clean and dust-free', 1, true FROM checklist_templates WHERE name = 'Interior Painting'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify all holes and imperfections are filled and sanded', 2, true FROM checklist_templates WHERE name = 'Interior Painting'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check primer has been applied where required', 3, true FROM checklist_templates WHERE name = 'Interior Painting'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm proper masking and protection of trim/floors', 4, false FROM checklist_templates WHERE name = 'Interior Painting'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify two coats applied with proper dry time between', 5, false FROM checklist_templates WHERE name = 'Interior Painting'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check for missed spots, drips, or uneven coverage', 6, false FROM checklist_templates WHERE name = 'Interior Painting'
ON CONFLICT DO NOTHING;

-- TILE INSTALLATION CHECKLIST
INSERT INTO checklist_templates (name, description)
VALUES ('Tile Installation', 'Critical tile installation steps')
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify substrate is clean, flat, and properly prepared', 1, true FROM checklist_templates WHERE name = 'Tile Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm waterproofing membrane installed in wet areas', 2, true FROM checklist_templates WHERE name = 'Tile Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check layout is centered and symmetrical', 3, false FROM checklist_templates WHERE name = 'Tile Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify proper thinset coverage (no voids)', 4, true FROM checklist_templates WHERE name = 'Tile Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm consistent grout joint spacing with spacers', 5, false FROM checklist_templates WHERE name = 'Tile Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check tiles are level and lippage is minimal', 6, false FROM checklist_templates WHERE name = 'Tile Installation'
ON CONFLICT DO NOTHING;

-- TRIM/BASEBOARD INSTALLATION CHECKLIST
INSERT INTO checklist_templates (name, description)
VALUES ('Trim Installation', 'Finish carpentry quality checklist')
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify all walls are painted before trim installation', 1, true FROM checklist_templates WHERE name = 'Trim Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm miter cuts are tight and accurate', 2, false FROM checklist_templates WHERE name = 'Trim Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check all trim is level and properly aligned', 3, false FROM checklist_templates WHERE name = 'Trim Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Verify nail holes are filled and sanded smooth', 4, false FROM checklist_templates WHERE name = 'Trim Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Confirm caulking applied at all gaps and seams', 5, false FROM checklist_templates WHERE name = 'Trim Installation'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (checklist_template_id, description, display_order, is_critical)
SELECT id, 'Check final paint/stain touchup is complete', 6, false FROM checklist_templates WHERE name = 'Trim Installation'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_workers_active ON workers(is_active);
CREATE INDEX IF NOT EXISTS idx_scope_item_materials_scope_item ON scope_item_materials(scope_item_id);
CREATE INDEX IF NOT EXISTS idx_scope_item_tools_scope_item ON scope_item_tools(scope_item_id);
CREATE INDEX IF NOT EXISTS idx_scope_item_checklist_scope_item ON scope_item_checklist(scope_item_id);
CREATE INDEX IF NOT EXISTS idx_scope_item_checklist_completed ON scope_item_checklist(is_completed);
CREATE INDEX IF NOT EXISTS idx_scope_item_photos_scope_item ON scope_item_photos(scope_item_id);
CREATE INDEX IF NOT EXISTS idx_scope_item_photos_type ON scope_item_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_category ON checklist_templates(category_template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_template ON checklist_template_items(checklist_template_id);

-- =====================================================
-- 6. TRIGGERS FOR AUTO-TIMESTAMPS
-- =====================================================

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE workers IS 'Contractors and employees (Nathan, Nishant, etc.)';
COMMENT ON TABLE category_templates IS 'Standard construction categories from reference spreadsheet';
COMMENT ON TABLE subcategory_templates IS 'Standard construction subcategories';
COMMENT ON TABLE scope_item_materials IS 'Materials needed for each scope item';
COMMENT ON TABLE scope_item_tools IS 'Tools required for each scope item';
COMMENT ON TABLE scope_item_checklist IS 'Atul Gawande-style checklists for quality control';
COMMENT ON TABLE scope_item_photos IS 'Before/during/after photos for documentation';
COMMENT ON TABLE checklist_templates IS 'Reusable checklist templates for common construction tasks';
COMMENT ON TABLE checklist_template_items IS 'Individual checklist steps in templates';
