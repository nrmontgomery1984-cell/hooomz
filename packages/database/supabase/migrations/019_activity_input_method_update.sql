-- Migration 019: Update input_method enum
-- Remove 'system' value - for system-generated events, input_method should be NULL
--
-- Spec change: input_method is only for tracking HOW a user created something
-- System events don't have an input method, so NULL is appropriate

-- ============================================================================
-- UPDATE TRIGGER: Remove auto-set of 'system' input_method
-- ============================================================================
-- The old trigger set input_method = 'system' for system actors
-- New behavior: leave input_method NULL for system-generated events

CREATE OR REPLACE FUNCTION activity_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate actor_name if not provided
  IF NEW.actor_name IS NULL THEN
    NEW.actor_name := get_actor_display_name(NEW.actor_id, NEW.actor_type);
  END IF;

  -- For system actors, input_method should remain NULL (no longer auto-set to 'system')
  -- This is intentional - system events don't have an "input method"

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE ENUM: Remove 'system' value
-- ============================================================================
-- PostgreSQL doesn't support removing enum values directly, so we need to:
-- 1. Create a new enum type without 'system'
-- 2. Update column to use the new type
-- 3. Drop the old enum

-- First, update any existing 'system' values to NULL
UPDATE activity_events
SET input_method = NULL
WHERE input_method = 'system';

-- Create new enum type
CREATE TYPE input_method_v2 AS ENUM (
  'manual_entry',     -- User typed/selected in app (renamed from 'typed' for clarity)
  'voice',            -- Voice input
  'quick_action',     -- One-tap quick action
  'photo_trigger',    -- Triggered by photo upload
  'geofence',         -- GPS-based automatic trigger
  'integration',      -- External system (QuickBooks, etc.)
  'bulk_import'       -- CSV/bulk data import
);

-- Alter column to use new enum (via text cast)
ALTER TABLE activity_events
  ALTER COLUMN input_method TYPE input_method_v2
  USING input_method::text::input_method_v2;

-- Drop old enum and rename new one
DROP TYPE IF EXISTS input_method;
ALTER TYPE input_method_v2 RENAME TO input_method;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TYPE input_method IS 'How a user created an event. NULL for system-generated events.';
