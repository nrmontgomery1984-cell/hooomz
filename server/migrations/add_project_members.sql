-- =====================================================
-- PROJECT TEAM/SHARING FEATURES
-- Allow multiple users to collaborate on projects
-- =====================================================

-- Project Members Table
-- Links users to projects with specific roles
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Function to automatically add creator as owner
CREATE OR REPLACE FUNCTION add_project_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-add creator as owner
DROP TRIGGER IF EXISTS trigger_add_project_creator_as_owner ON projects;
CREATE TRIGGER trigger_add_project_creator_as_owner
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_creator_as_owner();

-- Update existing projects to add creators as owners
INSERT INTO project_members (project_id, user_id, role)
SELECT id, created_by, 'owner'
FROM projects
WHERE created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = projects.id
      AND project_members.user_id = projects.created_by
  );

-- Comment for documentation
COMMENT ON TABLE project_members IS 'Links users to projects for multi-user collaboration';
COMMENT ON COLUMN project_members.role IS 'User role: owner (full control), admin (manage members), member (edit), viewer (read-only)';
