# Time Tracking Features Migration

## Required Migration

Run the following SQL in Supabase SQL Editor to add new time tracking features:

```sql
-- Add lunch and approval fields to time_entries table

ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS lunch_deducted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_by_manager BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_manual_entry BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN time_entries.lunch_deducted IS 'Whether 30 minutes was deducted for lunch';
COMMENT ON COLUMN time_entries.approved_by_manager IS 'Whether this entry has been approved by a manager';
COMMENT ON COLUMN time_entries.approved_at IS 'When the entry was approved';
COMMENT ON COLUMN time_entries.approved_by IS 'User ID of manager who approved this entry';
COMMENT ON COLUMN time_entries.is_manual_entry IS 'Whether this entry was manually created (not from timer)';
```

## New Features

1. **Automatic 15-Minute Rounding** - Time entries are automatically rounded up to the nearest 15 minutes
2. **Smart Rounding** - Consecutive tasks (within 2 minutes) are not double-rounded
3. **Automatic Lunch Deduction** - Days over 6 hours automatically have 30 minutes deducted for lunch
4. **Manual Lunch Toggle** - Users can manually add/remove lunch deduction via Coffee button
5. **Manual Time Entry** - Upload button allows creating time entries manually with date/time pickers
6. **Manager Approval** - Admins can approve/unapprove time entries with checkmark button

## How to Run

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Paste the SQL above
5. Click Run

The migration is idempotent and can be run multiple times safely.
