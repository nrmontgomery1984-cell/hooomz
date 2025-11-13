-- =====================================================
-- TODOIST-LIKE TASK FIELDS
-- Add fields inspired by Todoist task management
-- =====================================================

-- Add Todoist-style fields to scope_items
ALTER TABLE scope_items
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 4 CHECK (priority >= 1 AND priority <= 4),
ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS labels TEXT[], -- Array of labels/tags
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES scope_items(id) ON DELETE CASCADE, -- For subtasks
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT, -- e.g., "every day", "every week", "every Monday"
ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS location TEXT, -- Physical location (room, area, etc.)
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER; -- Estimated duration

-- Add comments table for tasks (Todoist-style task comments)
CREATE TABLE IF NOT EXISTS scope_item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add task sections (Todoist sections within projects)
CREATE TABLE IF NOT EXISTS task_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link scope_items to sections
ALTER TABLE scope_items
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES task_sections(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scope_items_priority ON scope_items(priority);
CREATE INDEX IF NOT EXISTS idx_scope_items_assignee ON scope_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_scope_items_parent_task ON scope_items(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_scope_items_labels ON scope_items USING GIN(labels);
CREATE INDEX IF NOT EXISTS idx_scope_items_section ON scope_items(section_id);
CREATE INDEX IF NOT EXISTS idx_scope_items_location ON scope_items(location);
CREATE INDEX IF NOT EXISTS idx_scope_item_comments_scope_item ON scope_item_comments(scope_item_id);
CREATE INDEX IF NOT EXISTS idx_scope_item_comments_user ON scope_item_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_sections_project ON task_sections(project_id);

-- Add trigger for comments updated_at
CREATE TRIGGER update_scope_item_comments_updated_at BEFORE UPDATE ON scope_item_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_sections_updated_at BEFORE UPDATE ON task_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON COLUMN scope_items.priority IS 'Task priority: 1=urgent/red, 2=high/orange, 3=medium/yellow, 4=normal/white (Todoist style)';
COMMENT ON COLUMN scope_items.assignee_id IS 'User assigned to this task';
COMMENT ON COLUMN scope_items.labels IS 'Array of label/tag strings for categorization';
COMMENT ON COLUMN scope_items.parent_task_id IS 'Parent task ID for subtasks';
COMMENT ON COLUMN scope_items.is_recurring IS 'Whether this is a recurring task';
COMMENT ON COLUMN scope_items.recurrence_pattern IS 'Human-readable recurrence pattern';
COMMENT ON COLUMN scope_items.reminder_date IS 'When to send a reminder notification';
COMMENT ON COLUMN scope_items.location IS 'Physical location or room where task should be done';
COMMENT ON COLUMN scope_items.duration_minutes IS 'Estimated time to complete task in minutes';
COMMENT ON COLUMN scope_items.section_id IS 'Task section for organization within project';
COMMENT ON TABLE scope_item_comments IS 'Comments/discussions on tasks (Todoist-style)';
COMMENT ON TABLE task_sections IS 'Sections for organizing tasks within projects (like Todoist sections)';
