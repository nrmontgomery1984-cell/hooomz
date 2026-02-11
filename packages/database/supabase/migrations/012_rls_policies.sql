-- Migration 012: Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_ownership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_blocked_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_pending_data ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ===========================================
-- ORGANIZATIONS
-- ===========================================
CREATE POLICY "Users can view own org" ON organizations
  FOR SELECT USING (id = get_user_org_id());

-- ===========================================
-- PROPERTIES
-- ===========================================
CREATE POLICY "Users can view org properties" ON properties
  FOR SELECT USING (created_by_org_id = get_user_org_id());

CREATE POLICY "Users can insert org properties" ON properties
  FOR INSERT WITH CHECK (created_by_org_id = get_user_org_id());

CREATE POLICY "Users can update org properties" ON properties
  FOR UPDATE USING (created_by_org_id = get_user_org_id());

-- ===========================================
-- CUSTOMERS
-- ===========================================
CREATE POLICY "Users can view org customers" ON customers
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org customers" ON customers
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org customers" ON customers
  FOR UPDATE USING (organization_id = get_user_org_id());

-- ===========================================
-- PROPERTY OWNERSHIP HISTORY
-- ===========================================
CREATE POLICY "Users can view org property history" ON property_ownership_history
  FOR SELECT USING (
    property_id IN (SELECT id FROM properties WHERE created_by_org_id = get_user_org_id())
  );

-- ===========================================
-- PROJECTS
-- ===========================================
CREATE POLICY "Users can view org projects" ON projects
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org projects" ON projects
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org projects" ON projects
  FOR UPDATE USING (organization_id = get_user_org_id());

-- ===========================================
-- LOOP CONTEXTS
-- ===========================================
CREATE POLICY "Users can view org loop contexts" ON loop_contexts
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can insert org loop contexts" ON loop_contexts
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can update org loop contexts" ON loop_contexts
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can delete org loop contexts" ON loop_contexts
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

-- ===========================================
-- LOOP ITERATIONS
-- ===========================================
CREATE POLICY "Users can view org loop iterations" ON loop_iterations
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can insert org loop iterations" ON loop_iterations
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can update org loop iterations" ON loop_iterations
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can delete org loop iterations" ON loop_iterations
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

-- ===========================================
-- ACTIVITY EVENTS
-- ===========================================
CREATE POLICY "Users can view org activity" ON activity_events
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org activity" ON activity_events
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- Homeowner policy for activity_events
CREATE POLICY "Homeowners can view visible events" ON activity_events
  FOR SELECT USING (
    homeowner_visible = TRUE
    AND property_id IN (
      SELECT id FROM properties WHERE current_owner_id IN (
        SELECT id FROM customers WHERE portal_user_id = auth.uid()
      )
    )
  );

-- ===========================================
-- TEAM MEMBERS
-- ===========================================
CREATE POLICY "Users can view org team members" ON team_members
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org team members" ON team_members
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org team members" ON team_members
  FOR UPDATE USING (organization_id = get_user_org_id());

-- ===========================================
-- TIME ENTRIES
-- ===========================================
CREATE POLICY "Users can view org time entries" ON time_entries
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org time entries" ON time_entries
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org time entries" ON time_entries
  FOR UPDATE USING (organization_id = get_user_org_id());

-- ===========================================
-- TASK TEMPLATES
-- ===========================================
CREATE POLICY "Users can view org task templates" ON task_templates
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org task templates" ON task_templates
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org task templates" ON task_templates
  FOR UPDATE USING (organization_id = get_user_org_id());

-- ===========================================
-- TASK INSTANCES
-- ===========================================
CREATE POLICY "Users can view org task instances" ON task_instances
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can insert org task instances" ON task_instances
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can update org task instances" ON task_instances
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can delete org task instances" ON task_instances
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id())
  );

-- ===========================================
-- TASK BLOCKED INFO
-- ===========================================
CREATE POLICY "Users can view org task blocked info" ON task_blocked_info
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM task_instances WHERE project_id IN (
        SELECT id FROM projects WHERE organization_id = get_user_org_id()
      )
    )
  );

CREATE POLICY "Users can insert org task blocked info" ON task_blocked_info
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM task_instances WHERE project_id IN (
        SELECT id FROM projects WHERE organization_id = get_user_org_id()
      )
    )
  );

CREATE POLICY "Users can update org task blocked info" ON task_blocked_info
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM task_instances WHERE project_id IN (
        SELECT id FROM projects WHERE organization_id = get_user_org_id()
      )
    )
  );

-- ===========================================
-- ESTIMATES
-- ===========================================
CREATE POLICY "Users can view org estimates" ON estimates
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org estimates" ON estimates
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org estimates" ON estimates
  FOR UPDATE USING (organization_id = get_user_org_id());

-- ===========================================
-- ESTIMATE SECTIONS
-- ===========================================
CREATE POLICY "Users can view org estimate sections" ON estimate_sections
  FOR SELECT USING (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can insert org estimate sections" ON estimate_sections
  FOR INSERT WITH CHECK (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can update org estimate sections" ON estimate_sections
  FOR UPDATE USING (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can delete org estimate sections" ON estimate_sections
  FOR DELETE USING (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

-- ===========================================
-- ESTIMATE LINE ITEMS
-- ===========================================
CREATE POLICY "Users can view org line items" ON estimate_line_items
  FOR SELECT USING (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can insert org line items" ON estimate_line_items
  FOR INSERT WITH CHECK (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can update org line items" ON estimate_line_items
  FOR UPDATE USING (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can delete org line items" ON estimate_line_items
  FOR DELETE USING (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

-- ===========================================
-- ESTIMATE LINE MATERIALS
-- ===========================================
CREATE POLICY "Users can view org line materials" ON estimate_line_materials
  FOR SELECT USING (
    line_item_id IN (
      SELECT id FROM estimate_line_items WHERE estimate_id IN (
        SELECT id FROM estimates WHERE organization_id = get_user_org_id()
      )
    )
  );

CREATE POLICY "Users can insert org line materials" ON estimate_line_materials
  FOR INSERT WITH CHECK (
    line_item_id IN (
      SELECT id FROM estimate_line_items WHERE estimate_id IN (
        SELECT id FROM estimates WHERE organization_id = get_user_org_id()
      )
    )
  );

CREATE POLICY "Users can update org line materials" ON estimate_line_materials
  FOR UPDATE USING (
    line_item_id IN (
      SELECT id FROM estimate_line_items WHERE estimate_id IN (
        SELECT id FROM estimates WHERE organization_id = get_user_org_id()
      )
    )
  );

CREATE POLICY "Users can delete org line materials" ON estimate_line_materials
  FOR DELETE USING (
    line_item_id IN (
      SELECT id FROM estimate_line_items WHERE estimate_id IN (
        SELECT id FROM estimates WHERE organization_id = get_user_org_id()
      )
    )
  );

-- ===========================================
-- ESTIMATE PAYMENT SCHEDULES
-- ===========================================
CREATE POLICY "Users can view org payment schedules" ON estimate_payment_schedules
  FOR SELECT USING (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can insert org payment schedules" ON estimate_payment_schedules
  FOR INSERT WITH CHECK (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can update org payment schedules" ON estimate_payment_schedules
  FOR UPDATE USING (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Users can delete org payment schedules" ON estimate_payment_schedules
  FOR DELETE USING (
    estimate_id IN (SELECT id FROM estimates WHERE organization_id = get_user_org_id())
  );

-- ===========================================
-- PHOTOS
-- ===========================================
CREATE POLICY "Users can view org photos" ON photos
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert org photos" ON photos
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update org photos" ON photos
  FOR UPDATE USING (organization_id = get_user_org_id());

-- Homeowner policy for photos
CREATE POLICY "Homeowners can view visible photos" ON photos
  FOR SELECT USING (
    homeowner_visible = TRUE
    AND project_id IN (
      SELECT id FROM projects WHERE property_id IN (
        SELECT id FROM properties WHERE current_owner_id IN (
          SELECT id FROM customers WHERE portal_user_id = auth.uid()
        )
      )
    )
  );

-- ===========================================
-- PROPERTY PENDING DATA
-- ===========================================
CREATE POLICY "Users can view org pending data" ON property_pending_data
  FOR SELECT USING (
    property_id IN (SELECT id FROM properties WHERE created_by_org_id = get_user_org_id())
  );

CREATE POLICY "Users can insert org pending data" ON property_pending_data
  FOR INSERT WITH CHECK (
    property_id IN (SELECT id FROM properties WHERE created_by_org_id = get_user_org_id())
  );

CREATE POLICY "Users can update org pending data" ON property_pending_data
  FOR UPDATE USING (
    property_id IN (SELECT id FROM properties WHERE created_by_org_id = get_user_org_id())
  );
