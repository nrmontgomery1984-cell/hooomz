-- ============================================================================
-- NESTED LOOP ARCHITECTURE MIGRATION
-- Hooomz Buildz - Complete Database Schema
-- ============================================================================

-- Drop existing objects if they exist (for clean re-runs)
DROP VIEW IF EXISTS v_project_financials CASCADE;
DROP VIEW IF EXISTS v_task_instances_full CASCADE;
DROP TABLE IF EXISTS uncaptured_labour_log CASCADE;
DROP TABLE IF EXISTS change_orders CASCADE;
DROP TABLE IF EXISTS task_tools CASCADE;
DROP TABLE IF EXISTS task_instance_materials CASCADE;
DROP TABLE IF EXISTS task_materials CASCADE;
DROP TABLE IF EXISTS task_checklist_items CASCADE;
DROP TABLE IF EXISTS phase_checklists CASCADE;
DROP TABLE IF EXISTS task_instances CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS loop_iterations CASCADE;
DROP TABLE IF EXISTS loop_contexts CASCADE;
DROP TABLE IF EXISTS phases CASCADE;

-- ============================================================================
-- TABLE 1: phases
-- Construction phases (Rough-In, Finish, etc.)
-- Global templates + project-specific
-- ============================================================================

CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_global_template BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique names per project (NULL project_id = global)
  CONSTRAINT unique_phase_name UNIQUE NULLS NOT DISTINCT (project_id, name)
);

CREATE INDEX idx_phases_project ON phases(project_id);
CREATE INDEX idx_phases_global ON phases(is_global_template) WHERE is_global_template = TRUE;

-- Seed global phases
INSERT INTO phases (name, description, is_global_template, display_order) VALUES
  ('Estimate', 'Initial planning and estimation phase', TRUE, 10),
  ('Rough-In', 'Initial installation and rough work', TRUE, 20),
  ('Installation', 'Main installation phase', TRUE, 30),
  ('Finish', 'Final touches and finishing work', TRUE, 40),
  ('Inspection', 'Quality control and inspection', TRUE, 50),
  ('Warranty', 'Warranty and post-installation support', TRUE, 60);

COMMENT ON TABLE phases IS 'Construction phases that tasks progress through';

-- ============================================================================
-- TABLE 2: loop_contexts
-- Defines types of nested loops (Buildings, Floors, Rooms, Zones, etc.)
-- ============================================================================

CREATE TABLE loop_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Floors", "Rooms", "Zones", "Units"
  parent_context_id UUID REFERENCES loop_contexts(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_context_name UNIQUE (project_id, name)
);

CREATE INDEX idx_loop_contexts_project ON loop_contexts(project_id);
CREATE INDEX idx_loop_contexts_parent ON loop_contexts(parent_context_id);

COMMENT ON TABLE loop_contexts IS 'Types of nested loops (Floors, Rooms, etc.) that define project structure';

-- ============================================================================
-- TABLE 3: loop_iterations
-- Actual instances of loops (1st Floor, Living Room, etc.)
-- ============================================================================

CREATE TABLE loop_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID NOT NULL REFERENCES loop_contexts(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "1st Floor", "Living Room", "Building A"
  parent_iteration_id UUID REFERENCES loop_iterations(id) ON DELETE CASCADE,
  location_path TEXT, -- Auto-generated: "Building A > 1st Floor > Living Room"
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loop_iterations_context ON loop_iterations(context_id);
CREATE INDEX idx_loop_iterations_parent ON loop_iterations(parent_iteration_id);
CREATE INDEX idx_loop_iterations_location_path ON loop_iterations(location_path);

COMMENT ON TABLE loop_iterations IS 'Actual instances of loop contexts (e.g., specific floors, rooms)';

-- ============================================================================
-- TABLE 4: task_templates
-- Task templates in "quantum state" (unlocated, not yet deployed)
-- ============================================================================

CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES scope_categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES scope_subcategories(id) ON DELETE SET NULL,

  -- Loop binding (quantum state)
  loop_context_id UUID REFERENCES loop_contexts(id) ON DELETE SET NULL,
  total_quantity INTEGER DEFAULT 1,
  instances_deployed INTEGER DEFAULT 0,

  -- Estimation
  estimated_hours DECIMAL(10, 2),
  estimated_cost DECIMAL(12, 2),

  -- Metadata
  priority TEXT DEFAULT 'medium',
  tags TEXT[],
  notes TEXT,

  -- Link to estimate
  estimate_line_item_id UUID,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_instances_deployed CHECK (instances_deployed >= 0 AND instances_deployed <= total_quantity)
);

CREATE INDEX idx_task_templates_project ON task_templates(project_id);
CREATE INDEX idx_task_templates_category ON task_templates(category_id);
CREATE INDEX idx_task_templates_loop_context ON task_templates(loop_context_id);
CREATE INDEX idx_task_templates_quantum ON task_templates(instances_deployed, total_quantity)
  WHERE instances_deployed < total_quantity;

COMMENT ON TABLE task_templates IS 'Task templates in quantum state before deployment to locations';

-- ============================================================================
-- TABLE 5: task_materials
-- Materials for task templates (inherited by instances)
-- ============================================================================

CREATE TABLE task_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT,
  unit_cost DECIMAL(12, 2),
  total_cost DECIMAL(12, 2),
  is_locked BOOLEAN DEFAULT FALSE, -- Locked from Material Selection
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_materials_template ON task_materials(template_id);
CREATE INDEX idx_task_materials_product ON task_materials(product_id);

COMMENT ON TABLE task_materials IS 'Materials required for task templates';

-- ============================================================================
-- TABLE 6: task_tools
-- Tools required for task templates
-- ============================================================================

CREATE TABLE task_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_tools_template ON task_tools(template_id);

COMMENT ON TABLE task_tools IS 'Tools required for task templates';

-- ============================================================================
-- TABLE 7: phase_checklists
-- Checklist templates for each phase of a task template
-- ============================================================================

CREATE TABLE phase_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_critical BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_phase_checklist UNIQUE (template_id, phase_id, description)
);

CREATE INDEX idx_phase_checklists_template ON phase_checklists(template_id);
CREATE INDEX idx_phase_checklists_phase ON phase_checklists(phase_id);

COMMENT ON TABLE phase_checklists IS 'Checklist templates for each phase of a task';

-- ============================================================================
-- TABLE 8: task_instances
-- Deployed tasks at specific locations
-- ============================================================================

CREATE TABLE task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  iteration_id UUID NOT NULL REFERENCES loop_iterations(id) ON DELETE CASCADE,

  -- Overrides from template
  description TEXT,
  estimated_hours DECIMAL(10, 2),
  actual_hours DECIMAL(10, 2),

  -- Location (auto-generated from iteration)
  location_path TEXT,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, blocked
  priority TEXT DEFAULT 'medium',

  -- Assignment
  assignee_id UUID REFERENCES project_members(id) ON DELETE SET NULL,

  -- Dates
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_template_iteration UNIQUE (template_id, iteration_id)
);

CREATE INDEX idx_task_instances_template ON task_instances(template_id);
CREATE INDEX idx_task_instances_iteration ON task_instances(iteration_id);
CREATE INDEX idx_task_instances_status ON task_instances(status);
CREATE INDEX idx_task_instances_assignee ON task_instances(assignee_id);
CREATE INDEX idx_task_instances_location_path ON task_instances(location_path);

COMMENT ON TABLE task_instances IS 'Deployed task instances at specific locations';

-- ============================================================================
-- TABLE 9: task_checklist_items
-- Checklist items for task instances (copied from phase_checklists)
-- ============================================================================

CREATE TABLE task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES task_instances(id) ON DELETE CASCADE,
  phase_checklist_id UUID NOT NULL REFERENCES phase_checklists(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_instance_checklist UNIQUE (instance_id, phase_checklist_id)
);

CREATE INDEX idx_task_checklist_items_instance ON task_checklist_items(instance_id);
CREATE INDEX idx_task_checklist_items_phase_checklist ON task_checklist_items(phase_checklist_id);
CREATE INDEX idx_task_checklist_items_completed ON task_checklist_items(is_completed);

COMMENT ON TABLE task_checklist_items IS 'Checklist items for specific task instances';

-- ============================================================================
-- TABLE 10: task_instance_materials
-- Additional materials added to task instances (change orders, uncaptured)
-- ============================================================================

CREATE TABLE task_instance_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES task_instances(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT,
  unit_cost DECIMAL(12, 2),
  total_cost DECIMAL(12, 2),
  reason TEXT, -- Why added (change order, uncaptured, etc.)
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_instance_materials_instance ON task_instance_materials(instance_id);
CREATE INDEX idx_task_instance_materials_product ON task_instance_materials(product_id);

COMMENT ON TABLE task_instance_materials IS 'Additional materials added to task instances';

-- ============================================================================
-- TABLE 11: change_orders
-- Change orders for tracking scope/cost changes
-- ============================================================================

CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  co_number TEXT NOT NULL, -- e.g., "CO-0001"
  instance_id UUID REFERENCES task_instances(id) ON DELETE SET NULL,

  -- Change details
  reason TEXT NOT NULL,
  description TEXT,
  source TEXT, -- 'client_request', 'field_condition', 'design_change', 'uncaptured_labour'

  -- Financial impact
  material_cost_delta DECIMAL(12, 2) DEFAULT 0,
  labor_hours_delta DECIMAL(10, 2) DEFAULT 0,
  total_cost_delta DECIMAL(12, 2) DEFAULT 0,

  -- Approval
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  rejection_reason TEXT,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_co_number UNIQUE (project_id, co_number)
);

CREATE INDEX idx_change_orders_project ON change_orders(project_id);
CREATE INDEX idx_change_orders_instance ON change_orders(instance_id);
CREATE INDEX idx_change_orders_status ON change_orders(status);

COMMENT ON TABLE change_orders IS 'Change orders for tracking scope and cost changes';

-- ============================================================================
-- TABLE 12: uncaptured_labour_log
-- Log of labour/materials not captured in estimates (before CO decision)
-- ============================================================================

CREATE TABLE uncaptured_labour_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES task_instances(id) ON DELETE SET NULL,

  -- What was uncaptured
  reason TEXT NOT NULL,
  description TEXT,
  material_cost_delta DECIMAL(12, 2) DEFAULT 0,
  labor_hours_delta DECIMAL(10, 2) DEFAULT 0,
  total_cost_delta DECIMAL(12, 2) DEFAULT 0,

  -- Logging
  logged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Resolution
  status TEXT DEFAULT 'pending', -- pending, converted_to_co, resolved
  converted_co_id UUID REFERENCES change_orders(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  converted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

CREATE INDEX idx_uncaptured_labour_project ON uncaptured_labour_log(project_id);
CREATE INDEX idx_uncaptured_labour_instance ON uncaptured_labour_log(instance_id);
CREATE INDEX idx_uncaptured_labour_status ON uncaptured_labour_log(status);

COMMENT ON TABLE uncaptured_labour_log IS 'Log of uncaptured labour before CO decision';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger 1: Auto-generate location_path for loop_iterations
CREATE OR REPLACE FUNCTION generate_location_path(iteration_id UUID)
RETURNS TEXT AS $$
DECLARE
  path TEXT;
  current_id UUID;
  current_name TEXT;
  parent_id UUID;
BEGIN
  path := '';
  current_id := iteration_id;

  LOOP
    SELECT name, parent_iteration_id INTO current_name, parent_id
    FROM loop_iterations
    WHERE id = current_id;

    IF current_name IS NULL THEN
      EXIT;
    END IF;

    IF path = '' THEN
      path := current_name;
    ELSE
      path := current_name || ' > ' || path;
    END IF;

    IF parent_id IS NULL THEN
      EXIT;
    END IF;

    current_id := parent_id;
  END LOOP;

  RETURN path;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_location_path()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location_path := generate_location_path(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_location_path
BEFORE INSERT OR UPDATE ON loop_iterations
FOR EACH ROW
EXECUTE FUNCTION set_location_path();

-- Trigger 2: Auto-set location_path for task_instances from iteration
CREATE OR REPLACE FUNCTION set_instance_location_path()
RETURNS TRIGGER AS $$
BEGIN
  SELECT location_path INTO NEW.location_path
  FROM loop_iterations
  WHERE id = NEW.iteration_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_instance_location_path
BEFORE INSERT OR UPDATE ON task_instances
FOR EACH ROW
EXECUTE FUNCTION set_instance_location_path();

-- Trigger 3: Update instances_deployed count on template
CREATE OR REPLACE FUNCTION update_instances_deployed()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE task_templates
    SET instances_deployed = instances_deployed + 1
    WHERE id = NEW.template_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE task_templates
    SET instances_deployed = GREATEST(0, instances_deployed - 1)
    WHERE id = OLD.template_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_instances_deployed
AFTER INSERT OR DELETE ON task_instances
FOR EACH ROW
EXECUTE FUNCTION update_instances_deployed();

-- Trigger 4: Auto-create checklist items when task instance is created
CREATE OR REPLACE FUNCTION create_checklist_items()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_checklist_items (instance_id, phase_checklist_id, is_completed)
  SELECT NEW.id, pc.id, FALSE
  FROM phase_checklists pc
  WHERE pc.template_id = NEW.template_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_checklist_items
AFTER INSERT ON task_instances
FOR EACH ROW
EXECUTE FUNCTION create_checklist_items();

-- Trigger 5: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER trigger_update_updated_at_phases
BEFORE UPDATE ON phases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_loop_contexts
BEFORE UPDATE ON loop_contexts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_loop_iterations
BEFORE UPDATE ON loop_iterations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_task_templates
BEFORE UPDATE ON task_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_task_materials
BEFORE UPDATE ON task_materials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_phase_checklists
BEFORE UPDATE ON phase_checklists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_task_instances
BEFORE UPDATE ON task_instances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_task_instance_materials
BEFORE UPDATE ON task_instance_materials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_change_orders
BEFORE UPDATE ON change_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View 1: Full task instance details with all joins
CREATE OR REPLACE VIEW v_task_instances_full AS
SELECT
  ti.id,
  ti.template_id,
  ti.iteration_id,
  ti.description,
  ti.location_path,
  ti.status,
  ti.priority,
  ti.estimated_hours,
  ti.actual_hours,
  ti.start_date,
  ti.due_date,
  ti.completed_at,
  ti.assignee_id,
  ti.notes,
  ti.created_at,
  ti.updated_at,

  -- Template info
  tt.name AS template_name,
  tt.category_id,
  tt.subcategory_id,
  tt.project_id,

  -- Iteration info
  li.name AS iteration_name,
  lc.name AS context_name,

  -- Assignee info
  pm.user_id AS assignee_user_id,
  u.email AS assignee_email,
  u.full_name AS assignee_name,

  -- Category info
  sc.name AS category_name,
  ssc.name AS subcategory_name,

  -- Checklist progress
  (
    SELECT COUNT(*)
    FROM task_checklist_items tci
    WHERE tci.instance_id = ti.id
  ) AS total_checklist_items,
  (
    SELECT COUNT(*)
    FROM task_checklist_items tci
    WHERE tci.instance_id = ti.id AND tci.is_completed = TRUE
  ) AS completed_checklist_items,

  -- Material costs
  (
    SELECT COALESCE(SUM(tm.total_cost), 0)
    FROM task_materials tm
    WHERE tm.template_id = ti.template_id
  ) AS template_material_cost,
  (
    SELECT COALESCE(SUM(tim.total_cost), 0)
    FROM task_instance_materials tim
    WHERE tim.instance_id = ti.id
  ) AS instance_material_cost

FROM task_instances ti
INNER JOIN task_templates tt ON ti.template_id = tt.id
INNER JOIN loop_iterations li ON ti.iteration_id = li.id
INNER JOIN loop_contexts lc ON li.context_id = lc.id
LEFT JOIN project_members pm ON ti.assignee_id = pm.id
LEFT JOIN users u ON pm.user_id = u.id
LEFT JOIN scope_categories sc ON tt.category_id = sc.id
LEFT JOIN scope_subcategories ssc ON tt.subcategory_id = ssc.id;

COMMENT ON VIEW v_task_instances_full IS 'Complete task instance details with all related info';

-- View 2: Project financial summary
CREATE OR REPLACE VIEW v_project_financials AS
SELECT
  tt.project_id,

  -- Template costs
  COUNT(DISTINCT tt.id) AS total_templates,
  COALESCE(SUM(tt.estimated_cost), 0) AS total_estimated_cost,
  COALESCE(SUM(tt.estimated_hours), 0) AS total_estimated_hours,

  -- Instance counts
  COUNT(DISTINCT ti.id) AS total_instances,
  COUNT(DISTINCT ti.id) FILTER (WHERE ti.status = 'completed') AS completed_instances,
  COUNT(DISTINCT ti.id) FILTER (WHERE ti.status = 'in_progress') AS in_progress_instances,
  COUNT(DISTINCT ti.id) FILTER (WHERE ti.status = 'pending') AS pending_instances,

  -- Actual hours
  COALESCE(SUM(ti.actual_hours), 0) AS total_actual_hours,

  -- Material costs
  (
    SELECT COALESCE(SUM(tm.total_cost), 0)
    FROM task_materials tm
    WHERE tm.template_id = tt.id
  ) AS total_template_materials,
  (
    SELECT COALESCE(SUM(tim.total_cost), 0)
    FROM task_instance_materials tim
    INNER JOIN task_instances ti2 ON tim.instance_id = ti2.id
    WHERE ti2.template_id = tt.id
  ) AS total_instance_materials,

  -- Change orders
  (
    SELECT COALESCE(SUM(co.total_cost_delta), 0)
    FROM change_orders co
    WHERE co.project_id = tt.project_id AND co.status = 'approved'
  ) AS total_approved_cos,
  (
    SELECT COUNT(*)
    FROM change_orders co
    WHERE co.project_id = tt.project_id AND co.status = 'pending'
  ) AS pending_cos,

  -- Uncaptured labour
  (
    SELECT COALESCE(SUM(ul.total_cost_delta), 0)
    FROM uncaptured_labour_log ul
    WHERE ul.project_id = tt.project_id AND ul.status = 'pending'
  ) AS total_uncaptured_labour

FROM task_templates tt
LEFT JOIN task_instances ti ON tt.id = ti.template_id
GROUP BY tt.project_id;

COMMENT ON VIEW v_project_financials IS 'Financial summary for projects including COs and uncaptured labour';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_instance_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE uncaptured_labour_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - adjust based on your auth system)

-- Phases: Global templates readable by all, project phases by project members
CREATE POLICY phases_select ON phases FOR SELECT
  USING (is_global_template = TRUE OR project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  ));

CREATE POLICY phases_insert ON phases FOR INSERT
  WITH CHECK (project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY phases_update ON phases FOR UPDATE
  USING (project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY phases_delete ON phases FOR DELETE
  USING (project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Loop contexts: Project members only
CREATE POLICY loop_contexts_all ON loop_contexts FOR ALL
  USING (project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  ));

-- Loop iterations: Through context's project
CREATE POLICY loop_iterations_all ON loop_iterations FOR ALL
  USING (context_id IN (
    SELECT lc.id FROM loop_contexts lc
    INNER JOIN project_members pm ON lc.project_id = pm.project_id
    WHERE pm.user_id = auth.uid()
  ));

-- Task templates: Project members
CREATE POLICY task_templates_all ON task_templates FOR ALL
  USING (project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  ));

-- Task materials: Through template's project
CREATE POLICY task_materials_all ON task_materials FOR ALL
  USING (template_id IN (
    SELECT tt.id FROM task_templates tt
    INNER JOIN project_members pm ON tt.project_id = pm.project_id
    WHERE pm.user_id = auth.uid()
  ));

-- Task tools: Through template's project
CREATE POLICY task_tools_all ON task_tools FOR ALL
  USING (template_id IN (
    SELECT tt.id FROM task_templates tt
    INNER JOIN project_members pm ON tt.project_id = pm.project_id
    WHERE pm.user_id = auth.uid()
  ));

-- Phase checklists: Through template's project
CREATE POLICY phase_checklists_all ON phase_checklists FOR ALL
  USING (template_id IN (
    SELECT tt.id FROM task_templates tt
    INNER JOIN project_members pm ON tt.project_id = pm.project_id
    WHERE pm.user_id = auth.uid()
  ));

-- Task instances: Through template's project
CREATE POLICY task_instances_all ON task_instances FOR ALL
  USING (template_id IN (
    SELECT tt.id FROM task_templates tt
    INNER JOIN project_members pm ON tt.project_id = pm.project_id
    WHERE pm.user_id = auth.uid()
  ));

-- Task checklist items: Through instance's project
CREATE POLICY task_checklist_items_all ON task_checklist_items FOR ALL
  USING (instance_id IN (
    SELECT ti.id FROM task_instances ti
    INNER JOIN task_templates tt ON ti.template_id = tt.id
    INNER JOIN project_members pm ON tt.project_id = pm.project_id
    WHERE pm.user_id = auth.uid()
  ));

-- Task instance materials: Through instance's project
CREATE POLICY task_instance_materials_all ON task_instance_materials FOR ALL
  USING (instance_id IN (
    SELECT ti.id FROM task_instances ti
    INNER JOIN task_templates tt ON ti.template_id = tt.id
    INNER JOIN project_members pm ON tt.project_id = pm.project_id
    WHERE pm.user_id = auth.uid()
  ));

-- Change orders: Project members
CREATE POLICY change_orders_all ON change_orders FOR ALL
  USING (project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  ));

-- Uncaptured labour: Project members
CREATE POLICY uncaptured_labour_log_all ON uncaptured_labour_log FOR ALL
  USING (project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_task_instances_template_status ON task_instances(template_id, status);
CREATE INDEX idx_task_instances_iteration_status ON task_instances(iteration_id, status);
CREATE INDEX idx_task_checklist_items_instance_completed ON task_checklist_items(instance_id, is_completed);
CREATE INDEX idx_change_orders_project_status ON change_orders(project_id, status);
CREATE INDEX idx_uncaptured_labour_project_status ON uncaptured_labour_log(project_id, status);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'phases', 'loop_contexts', 'loop_iterations', 'task_templates',
    'task_materials', 'task_tools', 'phase_checklists', 'task_instances',
    'task_checklist_items', 'task_instance_materials', 'change_orders',
    'uncaptured_labour_log'
  );

  RAISE NOTICE 'Created % tables for nested loop architecture', table_count;
END $$;

-- Success message
SELECT 'Nested Loop Architecture migration completed successfully!' AS status;
