-- Add lunch and approval fields to time_entries table

ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS lunch_deducted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_by_manager BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_manual_entry BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN time_entries.lunch_deducted IS 'Whether 30 minutes was deducted for lunch';
COMMENT ON COLUMN time_entries.approved_by_manager IS 'Whether this entry has been approved by a manager';
COMMENT ON COLUMN time_entries.approved_at IS 'When the entry was approved';
COMMENT ON COLUMN time_entries.approved_by IS 'User ID of manager who approved this entry';
COMMENT ON COLUMN time_entries.is_manual_entry IS 'Whether this entry was manually created (not from timer)';
