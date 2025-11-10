-- Add is_critical column to scope_item_checklist table
-- This was missing from the original migration

ALTER TABLE scope_item_checklist
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false;

-- Update existing rows to have is_critical = false if NULL
UPDATE scope_item_checklist
SET is_critical = false
WHERE is_critical IS NULL;
