-- Migration 006: Activity Log Table
-- The spine of the system - immutable event stream

CREATE TYPE actor_type AS ENUM ('team_member', 'system', 'customer');

CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID NOT NULL,
  actor_type actor_type NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  loop_iteration_id UUID REFERENCES loop_iterations(id),
  homeowner_visible BOOLEAN NOT NULL DEFAULT FALSE,
  event_data JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_activity_project ON activity_events(project_id);
CREATE INDEX idx_activity_property ON activity_events(property_id);
CREATE INDEX idx_activity_timestamp ON activity_events(timestamp DESC);
CREATE INDEX idx_activity_homeowner ON activity_events(property_id, homeowner_visible) WHERE homeowner_visible = TRUE;
