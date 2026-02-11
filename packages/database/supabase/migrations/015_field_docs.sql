-- Migration 015: Field Docs Tables
-- Photos, Documents, Inspections, and Field Notes

-- =====================
-- PHOTOS
-- =====================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id),

  -- Three-axis context (all optional)
  location_id UUID REFERENCES loop_iterations(id),
  work_category_code TEXT,
  task_instance_id UUID REFERENCES task_instances(id),

  -- Storage
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,

  -- Metadata
  caption TEXT,
  tags TEXT[] DEFAULT '{}',
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES team_members(id),

  -- Sharing
  shared_to_portal BOOLEAN NOT NULL DEFAULT FALSE,
  shared_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_project ON photos(project_id);
CREATE INDEX idx_photos_property ON photos(property_id);
CREATE INDEX idx_photos_location ON photos(location_id);
CREATE INDEX idx_photos_task ON photos(task_instance_id);
CREATE INDEX idx_photos_taken ON photos(taken_at DESC);
CREATE INDEX idx_photos_shared ON photos(project_id, shared_to_portal) WHERE shared_to_portal = TRUE;

-- =====================
-- DOCUMENTS
-- =====================
CREATE TYPE document_category AS ENUM (
  'permit', 'contract', 'change_order', 'invoice', 'receipt',
  'warranty', 'manual', 'drawing', 'spec_sheet', 'other'
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),

  -- File info
  name TEXT NOT NULL,
  category document_category NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,

  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID NOT NULL REFERENCES team_members(id),

  -- Sharing
  shared_to_portal BOOLEAN NOT NULL DEFAULT FALSE,
  shared_at TIMESTAMPTZ,

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES documents(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_org ON documents(organization_id);

-- =====================
-- INSPECTIONS
-- =====================
CREATE TYPE inspection_type AS ENUM (
  'building_permit', 'electrical', 'plumbing', 'hvac', 'framing',
  'insulation', 'fire', 'final', 'other'
);

CREATE TYPE inspection_status AS ENUM (
  'scheduled', 'passed', 'failed', 'cancelled'
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id),

  -- Context
  location_id UUID REFERENCES loop_iterations(id),
  work_category_code TEXT,
  stage_code TEXT,

  -- Details
  inspection_type inspection_type NOT NULL,
  inspector_name TEXT,
  inspector_phone TEXT,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,

  -- Result
  status inspection_status NOT NULL DEFAULT 'scheduled',
  result_notes TEXT,
  completed_at TIMESTAMPTZ,

  -- Linked items
  photo_ids UUID[] DEFAULT '{}',
  document_id UUID REFERENCES documents(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES team_members(id)
);

CREATE INDEX idx_inspections_project ON inspections(project_id);
CREATE INDEX idx_inspections_property ON inspections(property_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_scheduled ON inspections(scheduled_date);
CREATE INDEX idx_inspections_org_upcoming ON inspections(organization_id, scheduled_date)
  WHERE status = 'scheduled';

-- =====================
-- FIELD NOTES
-- =====================
CREATE TYPE field_note_type AS ENUM (
  'observation', 'issue', 'client_request', 'material_delivery',
  'weather', 'safety', 'general'
);

CREATE TYPE input_method AS ENUM ('typed', 'voice');

CREATE TABLE field_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id),

  -- Context
  location_id UUID REFERENCES loop_iterations(id),
  work_category_code TEXT,
  task_instance_id UUID REFERENCES task_instances(id),

  -- Content
  note_type field_note_type NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,

  -- Source
  input_method input_method NOT NULL DEFAULT 'typed',
  voice_transcript TEXT,

  -- Linked items
  photo_ids UUID[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES team_members(id),

  -- CYA flag
  flagged_for_co BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_field_notes_project ON field_notes(project_id);
CREATE INDEX idx_field_notes_property ON field_notes(property_id);
CREATE INDEX idx_field_notes_created ON field_notes(created_at DESC);
CREATE INDEX idx_field_notes_type ON field_notes(note_type);
CREATE INDEX idx_field_notes_flagged ON field_notes(project_id, flagged_for_co)
  WHERE flagged_for_co = TRUE;

-- =====================
-- RLS POLICIES
-- =====================
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_notes ENABLE ROW LEVEL SECURITY;

-- Photos RLS
CREATE POLICY "Users can view org photos" ON photos
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org photos" ON photos
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org photos" ON photos
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "Users can delete org photos" ON photos
  FOR DELETE USING (organization_id = get_user_org_id());

CREATE POLICY "Homeowners can view shared photos" ON photos
  FOR SELECT USING (
    shared_to_portal = TRUE
    AND property_id IN (
      SELECT id FROM properties WHERE current_owner_id IN (
        SELECT id FROM customers WHERE portal_user_id = auth.uid()
      )
    )
  );

-- Documents RLS
CREATE POLICY "Users can view org documents" ON documents
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org documents" ON documents
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org documents" ON documents
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "Users can delete org documents" ON documents
  FOR DELETE USING (organization_id = get_user_org_id());

CREATE POLICY "Homeowners can view shared documents" ON documents
  FOR SELECT USING (
    shared_to_portal = TRUE
    AND property_id IN (
      SELECT id FROM properties WHERE current_owner_id IN (
        SELECT id FROM customers WHERE portal_user_id = auth.uid()
      )
    )
  );

-- Inspections RLS
CREATE POLICY "Users can view org inspections" ON inspections
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org inspections" ON inspections
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org inspections" ON inspections
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "Users can delete org inspections" ON inspections
  FOR DELETE USING (organization_id = get_user_org_id());

-- Field Notes RLS
CREATE POLICY "Users can view org field notes" ON field_notes
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org field notes" ON field_notes
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org field notes" ON field_notes
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "Users can delete org field notes" ON field_notes
  FOR DELETE USING (organization_id = get_user_org_id());
