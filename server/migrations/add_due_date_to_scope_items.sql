-- Add due_date field to scope_items for deadline tracking

ALTER TABLE scope_items
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add index for querying tasks by due date
CREATE INDEX IF NOT EXISTS idx_scope_items_due_date ON scope_items(due_date);

-- Comment for documentation
COMMENT ON COLUMN scope_items.due_date IS 'Deadline for completing this task';
