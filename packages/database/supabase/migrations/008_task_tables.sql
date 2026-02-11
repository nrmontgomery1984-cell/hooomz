-- Migration 008: Task Tables

CREATE TYPE binding_pattern AS ENUM (
  'per_project', 'per_floor', 'per_room', 'per_zone'
);

CREATE TYPE task_status AS ENUM (
  'not_started', 'in_progress', 'blocked', 'complete', 'cancelled'
);

CREATE TYPE blocked_reason AS ENUM (
  'material_delay', 'weather', 'waiting_on_trade', 'waiting_on_customer', 'issue_discovered', 'other'
);

CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  category_code TEXT,
  estimated_hours DECIMAL(5,2),
  binding_pattern binding_pattern,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_task_templates_org ON task_templates(organization_id);

CREATE TABLE task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id),
  loop_iteration_id UUID NOT NULL REFERENCES loop_iterations(id),
  name TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'not_started',
  assigned_to UUID REFERENCES team_members(id),
  scheduled_start DATE,
  scheduled_end DATE,
  actual_start TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,  -- Critical for owner's manual
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_task_instances_project ON task_instances(project_id);
CREATE INDEX idx_task_instances_loop ON task_instances(loop_iteration_id);
CREATE INDEX idx_task_instances_status ON task_instances(status);
CREATE INDEX idx_task_instances_assigned ON task_instances(assigned_to);

-- Now add FK from time_entries
ALTER TABLE time_entries
  ADD CONSTRAINT fk_time_entries_task
  FOREIGN KEY (task_instance_id) REFERENCES task_instances(id);

CREATE TABLE task_blocked_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES task_instances(id) ON DELETE CASCADE,
  reason blocked_reason NOT NULL,
  note TEXT,
  customer_visible BOOLEAN NOT NULL DEFAULT FALSE,
  customer_note TEXT,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_task_blocked_task ON task_blocked_info(task_id);
