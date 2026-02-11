-- Migration 018: Enhanced Activity Log
-- Upgrades activity_events to full spec with denormalized names, three-axis metadata,
-- input tracking, and batch support
--
-- The Activity Log is THE SPINE of Hooomz:
-- - IMMUTABLE: Events are NEVER edited or deleted
-- - APPEND-ONLY: Only INSERT operations allowed
-- - SOURCE OF TRUTH: All dashboards and reports derive from events

-- ============================================================================
-- SYSTEM USER
-- ============================================================================
-- Create a special "System" user for automated events
-- This user is referenced by system-generated activity events
INSERT INTO auth.users (id, email, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@hooomz.internal',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, email, full_name, avatar_url, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@hooomz.internal',
  'System',
  NULL,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ENUM TYPE FOR INPUT METHOD
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE input_method AS ENUM (
    'manual_entry',     -- User typed/selected in app
    'voice',            -- Voice input
    'quick_action',     -- One-tap quick action
    'photo_trigger',    -- Triggered by photo upload
    'geofence',         -- GPS-based automatic trigger
    'integration',      -- External system (QuickBooks, etc.)
    'bulk_import',      -- CSV/bulk data import
    'system'            -- System-generated (no user action)
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ADD NEW COLUMNS TO activity_events
-- ============================================================================
-- Actor name (denormalized for display without joins)
ALTER TABLE activity_events
  ADD COLUMN IF NOT EXISTS actor_name TEXT;

-- Three-Axis Metadata (for filtering tasks by category/stage/location)
ALTER TABLE activity_events
  ADD COLUMN IF NOT EXISTS work_category_code TEXT,
  ADD COLUMN IF NOT EXISTS stage_code TEXT,
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Input tracking (how was this event created?)
ALTER TABLE activity_events
  ADD COLUMN IF NOT EXISTS input_method input_method;

-- Batch support (group related events together)
ALTER TABLE activity_events
  ADD COLUMN IF NOT EXISTS batch_id UUID;

-- Make project_id nullable for organization-level events
ALTER TABLE activity_events
  ALTER COLUMN project_id DROP NOT NULL;

-- Make property_id nullable for non-property events
ALTER TABLE activity_events
  ALTER COLUMN property_id DROP NOT NULL;

-- ============================================================================
-- CONTEXT CONSTRAINT
-- ============================================================================
-- Ensure we always have organizational context
ALTER TABLE activity_events
  ADD CONSTRAINT activity_has_context
  CHECK (project_id IS NOT NULL OR organization_id IS NOT NULL);

-- ============================================================================
-- NEW INDEXES FOR PERFORMANCE
-- ============================================================================
-- Three-axis filtering indexes
CREATE INDEX IF NOT EXISTS idx_activity_work_category
  ON activity_events(work_category_code) WHERE work_category_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_stage
  ON activity_events(stage_code) WHERE stage_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_location
  ON activity_events(location_id) WHERE location_id IS NOT NULL;

-- Event type filtering (for activity feed filters)
CREATE INDEX IF NOT EXISTS idx_activity_event_type
  ON activity_events(event_type);

-- Entity lookup (find all events for a specific entity)
CREATE INDEX IF NOT EXISTS idx_activity_entity
  ON activity_events(entity_type, entity_id);

-- Batch grouping
CREATE INDEX IF NOT EXISTS idx_activity_batch
  ON activity_events(batch_id) WHERE batch_id IS NOT NULL;

-- Organization-level queries
CREATE INDEX IF NOT EXISTS idx_activity_org_timestamp
  ON activity_events(organization_id, timestamp DESC);

-- ============================================================================
-- IMMUTABILITY PROTECTION
-- ============================================================================
-- Trigger function to prevent updates and deletes
CREATE OR REPLACE FUNCTION prevent_activity_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Activity events are immutable and cannot be updated. Event ID: %', OLD.id;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Activity events are immutable and cannot be deleted. Event ID: %', OLD.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS activity_immutability_trigger ON activity_events;

CREATE TRIGGER activity_immutability_trigger
  BEFORE UPDATE OR DELETE ON activity_events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_activity_modification();

-- ============================================================================
-- HELPER FUNCTION: Get Actor Name
-- ============================================================================
-- Used to denormalize actor_name on insert
CREATE OR REPLACE FUNCTION get_actor_display_name(
  p_actor_id UUID,
  p_actor_type actor_type
) RETURNS TEXT AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF p_actor_type = 'system' THEN
    RETURN 'System';
  ELSIF p_actor_type = 'team_member' THEN
    SELECT up.full_name INTO v_name
    FROM team_members tm
    JOIN user_profiles up ON tm.user_id = up.id
    WHERE tm.id = p_actor_id;
  ELSIF p_actor_type = 'customer' THEN
    SELECT c.name INTO v_name
    FROM customers c
    WHERE c.id = p_actor_id;
  END IF;

  RETURN COALESCE(v_name, 'Unknown');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INSERT TRIGGER: Auto-populate actor_name
-- ============================================================================
CREATE OR REPLACE FUNCTION activity_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate actor_name if not provided
  IF NEW.actor_name IS NULL THEN
    NEW.actor_name := get_actor_display_name(NEW.actor_id, NEW.actor_type);
  END IF;

  -- Set system input_method for system actors
  IF NEW.actor_type = 'system' AND NEW.input_method IS NULL THEN
    NEW.input_method := 'system';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS activity_before_insert_trigger ON activity_events;

CREATE TRIGGER activity_before_insert_trigger
  BEFORE INSERT ON activity_events
  FOR EACH ROW
  EXECUTE FUNCTION activity_before_insert();

-- ============================================================================
-- MATERIALIZED VIEW: Dashboard Stats (refreshed periodically)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_activity_stats AS
SELECT
  organization_id,
  project_id,
  DATE_TRUNC('day', timestamp) as event_date,
  event_type,
  COUNT(*) as event_count
FROM activity_events
GROUP BY organization_id, project_id, DATE_TRUNC('day', timestamp), event_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_activity_stats_pk
  ON mv_activity_stats(organization_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::UUID), event_date, event_type);

-- ============================================================================
-- FUNCTION: Refresh Activity Stats
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_activity_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_activity_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Recent Activity with Project Context
-- ============================================================================
CREATE OR REPLACE VIEW v_recent_activity AS
SELECT
  ae.id,
  ae.event_type,
  ae.timestamp,
  ae.actor_id,
  ae.actor_type,
  ae.actor_name,
  ae.organization_id,
  ae.project_id,
  p.name as project_name,
  ae.property_id,
  ae.entity_type,
  ae.entity_id,
  ae.work_category_code,
  ae.stage_code,
  ae.location_id,
  ae.loop_iteration_id,
  ae.homeowner_visible,
  ae.event_data,
  ae.input_method,
  ae.batch_id
FROM activity_events ae
LEFT JOIN projects p ON ae.project_id = p.id
ORDER BY ae.timestamp DESC;

-- ============================================================================
-- VIEW: Homeowner-Visible Activity
-- ============================================================================
CREATE OR REPLACE VIEW v_homeowner_activity AS
SELECT
  ae.id,
  ae.event_type,
  ae.timestamp,
  ae.actor_name,
  ae.project_id,
  p.name as project_name,
  ae.property_id,
  ae.event_data
FROM activity_events ae
LEFT JOIN projects p ON ae.project_id = p.id
WHERE ae.homeowner_visible = TRUE
ORDER BY ae.timestamp DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE activity_events IS 'Immutable event log - THE SPINE of Hooomz. All actions write here. Never edit, never delete.';
COMMENT ON COLUMN activity_events.actor_name IS 'Denormalized actor name for display without joins';
COMMENT ON COLUMN activity_events.work_category_code IS 'Three-axis: Electrical, Plumbing, Framing, etc.';
COMMENT ON COLUMN activity_events.stage_code IS 'Three-axis: Rough-In, Drywall, Finish, etc.';
COMMENT ON COLUMN activity_events.location_id IS 'Three-axis: Kitchen, Master Bath, Exterior, etc.';
COMMENT ON COLUMN activity_events.input_method IS 'How was this event triggered? Manual, voice, quick-action, etc.';
COMMENT ON COLUMN activity_events.batch_id IS 'Groups related events (e.g., bulk task completion)';
COMMENT ON COLUMN activity_events.homeowner_visible IS 'If TRUE, appears in customer portal activity feed';
