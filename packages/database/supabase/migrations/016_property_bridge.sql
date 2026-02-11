-- Migration 016: Property Bridge & Completion Flow
-- Enables data transfer from projects to property profile

-- =====================
-- PROPERTY PENDING DATA BRIDGE
-- =====================
CREATE TABLE property_pending_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  data_type TEXT NOT NULL CHECK (data_type IN (
    'material', 'document', 'warranty', 'photo', 'system', 'maintenance_schedule'
  )),
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,

  data_snapshot JSONB NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'transferred', 'rejected'
  )),
  transferred_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pending_property ON property_pending_data(property_id, status);
CREATE INDEX idx_pending_project ON property_pending_data(source_project_id);
CREATE INDEX idx_pending_status ON property_pending_data(status) WHERE status = 'pending';

-- RLS
ALTER TABLE property_pending_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org pending data" ON property_pending_data
  FOR SELECT USING (
    source_project_id IN (
      SELECT id FROM projects WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Users can insert own org pending data" ON property_pending_data
  FOR INSERT WITH CHECK (
    source_project_id IN (
      SELECT id FROM projects WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Users can update own org pending data" ON property_pending_data
  FOR UPDATE USING (
    source_project_id IN (
      SELECT id FROM projects WHERE organization_id = get_user_org_id()
    )
  );

-- =====================
-- PROJECT COMPLETION CHECKLIST
-- =====================
CREATE TABLE project_completion_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,

  final_walkthrough_complete BOOLEAN NOT NULL DEFAULT false,
  final_walkthrough_date DATE,
  punch_list_resolved BOOLEAN NOT NULL DEFAULT false,
  final_invoice_paid BOOLEAN NOT NULL DEFAULT false,
  warranty_documents_shared BOOLEAN NOT NULL DEFAULT false,
  homeowner_manual_generated BOOLEAN NOT NULL DEFAULT false,
  property_profile_synced BOOLEAN NOT NULL DEFAULT false,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create checklist when project created
CREATE OR REPLACE FUNCTION create_completion_checklist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_completion_checklists (project_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_completion_checklist
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_completion_checklist();

-- RLS
ALTER TABLE project_completion_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own org checklists" ON project_completion_checklists
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = get_user_org_id()
    )
  );

-- =====================
-- ADD PORTAL EXPLANATION TO DOCUMENTS
-- =====================
ALTER TABLE documents ADD COLUMN IF NOT EXISTS portal_explanation TEXT;

-- =====================
-- HOMEOWNER MANUALS
-- =====================
CREATE TABLE homeowner_manuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  content JSONB NOT NULL,  -- Full manual content
  pdf_storage_path TEXT,   -- Generated PDF location

  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(project_id)
);

CREATE INDEX idx_manuals_property ON homeowner_manuals(property_id);

-- RLS
ALTER TABLE homeowner_manuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org manuals" ON homeowner_manuals
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Users can insert own org manuals" ON homeowner_manuals
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = get_user_org_id()
    )
  );

-- Homeowners can view their property manuals via portal
CREATE POLICY "Homeowners can view their manuals" ON homeowner_manuals
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE current_owner_id IN (
        SELECT id FROM customers WHERE portal_user_id = auth.uid()
      )
    )
  );
