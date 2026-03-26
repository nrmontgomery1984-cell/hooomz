-- Migration 025: Role Permissions
-- Module-level access control per role

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('owner', 'operator', 'installer', 'homeowner')),
  module TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, module)
);

-- RLS: authenticated users can read permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Seed data
-- owner: all true
INSERT INTO role_permissions (role, module, can_view, can_edit, can_delete) VALUES
  ('owner', 'dashboard',    true, true, true),
  ('owner', 'leads',        true, true, true),
  ('owner', 'jobs',         true, true, true),
  ('owner', 'pipeline',     true, true, true),
  ('owner', 'sales',        true, true, true),
  ('owner', 'site_visits',  true, true, true),
  ('owner', 'estimates',    true, true, true),
  ('owner', 'contracts',    true, true, true),
  ('owner', 'materials',    true, true, true),
  ('owner', 'punch_lists',  true, true, true),
  ('owner', 'cost_items',   true, true, true),
  ('owner', 'labs',         true, true, true),
  ('owner', 'settings',     true, true, true),
  ('owner', 'admin',        true, true, true);

-- operator: most modules, no labs/settings/admin
INSERT INTO role_permissions (role, module, can_view, can_edit, can_delete) VALUES
  ('operator', 'dashboard',    true, true, false),
  ('operator', 'leads',        true, true, false),
  ('operator', 'jobs',         true, true, false),
  ('operator', 'pipeline',     true, true, false),
  ('operator', 'sales',        true, true, false),
  ('operator', 'site_visits',  true, true, false),
  ('operator', 'estimates',    true, true, false),
  ('operator', 'contracts',    true, true, false),
  ('operator', 'materials',    true, true, false),
  ('operator', 'punch_lists',  true, true, false),
  ('operator', 'cost_items',   true, false, false),
  ('operator', 'labs',         false, false, false),
  ('operator', 'settings',     false, false, false),
  ('operator', 'admin',        false, false, false);

-- installer: limited modules
INSERT INTO role_permissions (role, module, can_view, can_edit, can_delete) VALUES
  ('installer', 'dashboard',    true, false, false),
  ('installer', 'leads',        false, false, false),
  ('installer', 'jobs',         true, true, false),
  ('installer', 'pipeline',     false, false, false),
  ('installer', 'sales',        false, false, false),
  ('installer', 'site_visits',  true, true, false),
  ('installer', 'estimates',    false, false, false),
  ('installer', 'contracts',    false, false, false),
  ('installer', 'materials',    false, false, false),
  ('installer', 'punch_lists',  true, true, false),
  ('installer', 'cost_items',   false, false, false),
  ('installer', 'labs',         false, false, false),
  ('installer', 'settings',     false, false, false),
  ('installer', 'admin',        false, false, false);

-- homeowner: no internal access
INSERT INTO role_permissions (role, module, can_view, can_edit, can_delete) VALUES
  ('homeowner', 'dashboard',    false, false, false),
  ('homeowner', 'leads',        false, false, false),
  ('homeowner', 'jobs',         false, false, false),
  ('homeowner', 'pipeline',     false, false, false),
  ('homeowner', 'sales',        false, false, false),
  ('homeowner', 'site_visits',  false, false, false),
  ('homeowner', 'estimates',    false, false, false),
  ('homeowner', 'contracts',    false, false, false),
  ('homeowner', 'materials',    false, false, false),
  ('homeowner', 'punch_lists',  false, false, false),
  ('homeowner', 'cost_items',   false, false, false),
  ('homeowner', 'labs',         false, false, false),
  ('homeowner', 'settings',     false, false, false),
  ('homeowner', 'admin',        false, false, false);
