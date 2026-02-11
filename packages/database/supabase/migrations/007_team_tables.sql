-- Migration 007: Team Tables

CREATE TYPE team_role AS ENUM (
  'owner', 'admin', 'project_manager', 'foreman', 'worker', 'apprentice'
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role team_role NOT NULL,
  hourly_rate DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  public_contact_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  certifications TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_members_org ON team_members(organization_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE UNIQUE INDEX idx_team_members_org_user ON team_members(organization_id, user_id);

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  team_member_id UUID NOT NULL REFERENCES team_members(id),
  task_instance_id UUID,  -- FK added after task_instances table
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  total_hours DECIMAL(5,2),
  hourly_rate DECIMAL(10,2) NOT NULL,
  note TEXT,
  gps_clock_in JSONB,
  gps_clock_out JSONB,
  captured_offline BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_member ON time_entries(team_member_id);
CREATE INDEX idx_time_entries_date ON time_entries(clock_in);
