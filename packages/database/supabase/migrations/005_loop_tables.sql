-- Migration 005: Loop Tables

CREATE TYPE loop_type AS ENUM (
  'floor', 'location', 'zone', 'work_category', 'phase', 'custom'
);

CREATE TYPE loop_status AS ENUM (
  'not_started', 'in_progress', 'blocked', 'complete'
);

CREATE TABLE loop_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_context_id UUID REFERENCES loop_contexts(id),
  display_order INTEGER NOT NULL DEFAULT 0,
  loop_type loop_type NOT NULL,
  binding_key TEXT
);

CREATE INDEX idx_loop_contexts_project ON loop_contexts(project_id);
CREATE INDEX idx_loop_contexts_parent ON loop_contexts(parent_context_id);

CREATE TABLE loop_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID NOT NULL REFERENCES loop_contexts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_iteration_id UUID REFERENCES loop_iterations(id),
  display_order INTEGER NOT NULL DEFAULT 0,
  computed_status loop_status NOT NULL DEFAULT 'not_started',
  child_counts JSONB NOT NULL DEFAULT '{"total":0,"not_started":0,"in_progress":0,"blocked":0,"complete":0}'
);

CREATE INDEX idx_loop_iterations_context ON loop_iterations(context_id);
CREATE INDEX idx_loop_iterations_project ON loop_iterations(project_id);
CREATE INDEX idx_loop_iterations_parent ON loop_iterations(parent_iteration_id);
