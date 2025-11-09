-- =====================================================
-- PROJECT MANAGEMENT AND TIME TRACKING SYSTEM
-- For contractor projects like 222 Whitney
-- =====================================================

-- Projects Table
-- Stores contractor projects (e.g., 222 Whitney renovation)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  client_name TEXT,
  client_contact TEXT,
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  budget DECIMAL(12, 2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Scope Categories
-- Main categories for organizing work items (e.g., Interior, Exterior, Mechanical)
CREATE TABLE IF NOT EXISTS scope_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scope Subcategories
-- Subcategories within main categories (e.g., Living Room, Kitchen under Interior)
CREATE TABLE IF NOT EXISTS scope_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES scope_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scope Items
-- Individual work items/tasks within subcategories
CREATE TABLE IF NOT EXISTS scope_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID REFERENCES scope_subcategories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  estimated_hours DECIMAL(8, 2),
  actual_hours DECIMAL(8, 2) DEFAULT 0,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Time Entries
-- Tracks actual time spent on scope items
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_item_id UUID REFERENCES scope_items(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_scope_categories_project ON scope_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_scope_subcategories_category ON scope_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_scope_items_subcategory ON scope_items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_scope_items_status ON scope_items(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_scope_item ON time_entries(scope_item_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_worker ON time_entries(worker_name);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scope_categories_updated_at BEFORE UPDATE ON scope_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scope_subcategories_updated_at BEFORE UPDATE ON scope_subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scope_items_updated_at BEFORE UPDATE ON scope_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate actual hours from time entries
CREATE OR REPLACE FUNCTION update_scope_item_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scope_items
  SET actual_hours = (
    SELECT COALESCE(SUM(duration_minutes), 0) / 60.0
    FROM time_entries
    WHERE scope_item_id = COALESCE(NEW.scope_item_id, OLD.scope_item_id)
  )
  WHERE id = COALESCE(NEW.scope_item_id, OLD.scope_item_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update actual hours when time entries change
CREATE TRIGGER update_actual_hours_on_time_entry_insert
  AFTER INSERT ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_scope_item_actual_hours();

CREATE TRIGGER update_actual_hours_on_time_entry_update
  AFTER UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_scope_item_actual_hours();

CREATE TRIGGER update_actual_hours_on_time_entry_delete
  AFTER DELETE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_scope_item_actual_hours();

-- Comments for documentation
COMMENT ON TABLE projects IS 'Contractor projects like renovations';
COMMENT ON TABLE scope_categories IS 'Main work categories (Interior, Exterior, etc.)';
COMMENT ON TABLE scope_subcategories IS 'Subcategories within main categories (Living Room, Kitchen, etc.)';
COMMENT ON TABLE scope_items IS 'Individual work tasks';
COMMENT ON TABLE time_entries IS 'Time tracking for scope items';
