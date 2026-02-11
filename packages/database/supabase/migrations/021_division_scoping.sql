-- Migration: 021_division_scoping.sql
-- Purpose: Add division scoping to support multiple Hooomz business divisions
-- Divisions: Interiors, Exteriors, DIY, Maintenance
--
-- IMPORTANT: This is ADDITIVE only. Do not modify existing data.
-- Existing categories/stages remain for Exteriors compatibility.

-- ============================================================================
-- Division Enum
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE division AS ENUM (
    'interiors',   -- Flooring, paint, trim, accent walls
    'exteriors',   -- Roofing, siding, decks, windows/doors
    'diy',         -- Slat wall system
    'maintenance'  -- Seasonal packages, Home Partner tier
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Work Category Codes (Division-Scoped)
-- ============================================================================

-- Create work_category lookup table if it doesn't exist
CREATE TABLE IF NOT EXISTS work_categories (
  code VARCHAR(4) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  display_order INTEGER DEFAULT 0,
  divisions division[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Interiors work categories
INSERT INTO work_categories (code, name, icon, display_order, divisions) VALUES
  ('FL', 'Flooring', '🪵', 1, '{interiors}'),
  ('PT', 'Paint', '🎨', 2, '{interiors}'),
  ('FC', 'Finish Carpentry', '📐', 3, '{interiors}'),
  ('TL', 'Tile', '🔲', 4, '{interiors}'),
  ('DW', 'Drywall', '🧱', 5, '{interiors}'),
  ('OH', 'Overhead', '⚙️', 99, '{interiors,exteriors,diy,maintenance}'),
  ('DM', 'Demo', '🔨', 0, '{interiors,exteriors}')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  divisions = EXCLUDED.divisions,
  updated_at = NOW();

-- Add Exteriors work categories (if not already present)
INSERT INTO work_categories (code, name, icon, display_order, divisions) VALUES
  ('RF', 'Roofing', '🏠', 10, '{exteriors}'),
  ('SD', 'Siding', '🏡', 11, '{exteriors}'),
  ('DK', 'Decks', '🌲', 12, '{exteriors}'),
  ('WD', 'Windows & Doors', '🚪', 13, '{exteriors}'),
  ('EL', 'Electrical', '⚡', 14, '{exteriors}'),
  ('PL', 'Plumbing', '🔧', 15, '{exteriors}'),
  ('HV', 'HVAC', '❄️', 16, '{exteriors}'),
  ('FR', 'Framing', '🪚', 20, '{exteriors}'),
  ('FN', 'Foundation', '🧱', 21, '{exteriors}'),
  ('IN', 'Insulation', '🧊', 22, '{exteriors}'),
  ('CN', 'Concrete', '🪨', 23, '{exteriors}'),
  ('ST', 'Site Work', '🚜', 24, '{exteriors}')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  divisions = EXCLUDED.divisions,
  updated_at = NOW();

-- ============================================================================
-- Project Stages (Division-Scoped)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_stages (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  divisions division[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Interiors stages
INSERT INTO project_stages (code, name, display_order, divisions) VALUES
  ('ST-DM', 'Demolition', 1, '{interiors}'),
  ('ST-PR', 'Prime & Prep', 2, '{interiors}'),
  ('ST-FN', 'Finish', 3, '{interiors}'),
  ('ST-PL', 'Punch List', 4, '{interiors,exteriors}'),
  ('ST-CL', 'Closeout', 5, '{interiors,exteriors}')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  divisions = EXCLUDED.divisions,
  updated_at = NOW();

-- Add Exteriors/Construction stages
INSERT INTO project_stages (code, name, display_order, divisions) VALUES
  ('ST-SITE', 'Site Prep', 1, '{exteriors}'),
  ('ST-FOUND', 'Foundation', 2, '{exteriors}'),
  ('ST-FRAME', 'Framing', 3, '{exteriors}'),
  ('ST-ROUGH', 'Rough-In', 4, '{exteriors}'),
  ('ST-INSUL', 'Insulation', 5, '{exteriors}'),
  ('ST-DRY', 'Drywall', 6, '{exteriors}'),
  ('ST-EXT', 'Exterior', 7, '{exteriors}'),
  ('ST-INT', 'Interior', 8, '{exteriors}'),
  ('ST-FINAL', 'Final', 9, '{exteriors}')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  divisions = EXCLUDED.divisions,
  updated_at = NOW();

-- ============================================================================
-- Interiors Bundle Types
-- ============================================================================

CREATE TABLE IF NOT EXISTS interiors_bundles (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  work_categories VARCHAR(4)[] NOT NULL DEFAULT '{}',
  base_price_cad DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO interiors_bundles (code, name, description, work_categories, base_price_cad) VALUES
  ('floor-refresh', 'Floor Refresh', 'LVP flooring + new baseboard', '{FL,FC}', 5400.00),
  ('room-refresh', 'Room Refresh', 'LVP flooring + paint + baseboard', '{FL,PT,FC}', 8200.00),
  ('full-interior', 'Full Interior', 'LVP flooring + paint + full trim package + doors', '{FL,PT,FC,DW}', 11800.00),
  ('accent-package', 'Accent Package', 'Board & batten, wainscoting, picture frame molding, accent wallpaper', '{FC,PT}', NULL),
  ('custom', 'Custom', 'Custom scope of work', '{}', NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  work_categories = EXCLUDED.work_categories,
  base_price_cad = EXCLUDED.base_price_cad,
  updated_at = NOW();

-- ============================================================================
-- Add division column to projects table (if not already present)
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS division division DEFAULT 'interiors';
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- Helper Functions for Division Filtering
-- ============================================================================

-- Get work categories for a specific division
CREATE OR REPLACE FUNCTION get_work_categories_for_division(p_division division)
RETURNS TABLE (code VARCHAR(4), name VARCHAR(100), icon VARCHAR(10), display_order INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT wc.code, wc.name, wc.icon, wc.display_order
  FROM work_categories wc
  WHERE p_division = ANY(wc.divisions)
    AND wc.is_active = true
  ORDER BY wc.display_order;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get project stages for a specific division
CREATE OR REPLACE FUNCTION get_stages_for_division(p_division division)
RETURNS TABLE (code VARCHAR(10), name VARCHAR(100), display_order INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT ps.code, ps.name, ps.display_order
  FROM project_stages ps
  WHERE p_division = ANY(ps.divisions)
    AND ps.is_active = true
  ORDER BY ps.display_order;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TYPE division IS 'Hooomz business divisions: Interiors, Exteriors, DIY, Maintenance';
COMMENT ON TABLE work_categories IS 'Work category codes with division scoping. Use get_work_categories_for_division() to filter.';
COMMENT ON TABLE project_stages IS 'Project stage codes with division scoping. Use get_stages_for_division() to filter.';
COMMENT ON TABLE interiors_bundles IS 'Hooomz Interiors bundle packages with pricing and included work categories.';
COMMENT ON FUNCTION get_work_categories_for_division IS 'Returns work categories applicable to a specific division';
COMMENT ON FUNCTION get_stages_for_division IS 'Returns project stages applicable to a specific division';
