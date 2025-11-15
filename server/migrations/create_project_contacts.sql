-- =====================================================
-- PROJECT CONTACTS LINKING TABLE
-- Links contacts to projects they worked on
-- =====================================================

-- Project Contacts junction table
CREATE TABLE IF NOT EXISTS project_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role TEXT, -- e.g., "Lead Electrician", "Supplier", "Subcontractor"
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure a contact can only be added once per project
  CONSTRAINT unique_project_contact UNIQUE (project_id, contact_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_contacts_project ON project_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contacts_contact ON project_contacts(contact_id);

-- Comments for documentation
COMMENT ON TABLE project_contacts IS 'Links contacts (contractors/vendors) to projects they worked on';
COMMENT ON COLUMN project_contacts.role IS 'The role this contact played in the project';
