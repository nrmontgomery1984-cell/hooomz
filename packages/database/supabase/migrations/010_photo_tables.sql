-- Migration 010: Photo Tables

CREATE TYPE photo_category AS ENUM (
  'before', 'progress', 'after', 'issue', 'documentation', 'internal'
);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  loop_iteration_id UUID REFERENCES loop_iterations(id),
  task_instance_id UUID REFERENCES task_instances(id),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  photo_category photo_category NOT NULL DEFAULT 'progress',
  homeowner_visible BOOLEAN NOT NULL DEFAULT FALSE,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES team_members(id),
  captured_offline BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_photos_project ON photos(project_id);
CREATE INDEX idx_photos_loop ON photos(loop_iteration_id);
CREATE INDEX idx_photos_category ON photos(photo_category);
CREATE INDEX idx_photos_homeowner ON photos(project_id, homeowner_visible) WHERE homeowner_visible = TRUE;
