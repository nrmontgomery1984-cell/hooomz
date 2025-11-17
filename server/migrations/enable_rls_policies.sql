-- ==========================================
-- Enable Row Level Security (RLS) on all tables
-- Migration to fix Supabase linter warnings
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_item_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_item_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_item_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_item_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS Policies for Projects
-- ==========================================

-- Projects: Users can view projects they created or are members of
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- Projects: Users can insert projects they create
CREATE POLICY "Users can create projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Projects: Users can update projects they created or are admin members of
CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('owner', 'admin')
    )
  );

-- Projects: Users can delete projects they created
CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = created_by);

-- ==========================================
-- RLS Policies for Project Members
-- ==========================================

-- Project Members: Can view members of projects they have access to
CREATE POLICY "Users can view project members"
  ON public.project_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = projects.id
          AND pm.user_id = auth.uid()
        )
      )
    )
  );

-- Project Members: Project owners can add members
CREATE POLICY "Project owners can add members"
  ON public.project_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Project Members: Project owners can remove members
CREATE POLICY "Project owners can remove members"
  ON public.project_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- ==========================================
-- RLS Policies for Scope Categories
-- ==========================================

-- Scope Categories: Users can view categories for projects they have access to
CREATE POLICY "Users can view scope categories"
  ON public.scope_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scope_categories.project_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Scope Categories: Project members can create categories
CREATE POLICY "Project members can create scope categories"
  ON public.scope_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scope_categories.project_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Scope Categories: Project members can update/delete categories
CREATE POLICY "Project members can modify scope categories"
  ON public.scope_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scope_categories.project_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- ==========================================
-- RLS Policies for Scope Subcategories
-- ==========================================

-- Scope Subcategories: Users can view subcategories for accessible projects
CREATE POLICY "Users can view scope subcategories"
  ON public.scope_subcategories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_categories
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_categories.id = scope_subcategories.category_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Scope Subcategories: Project members can modify subcategories
CREATE POLICY "Project members can modify scope subcategories"
  ON public.scope_subcategories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_categories
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_categories.id = scope_subcategories.category_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- ==========================================
-- RLS Policies for Scope Items (Tasks)
-- ==========================================

-- Scope Items: Users can view items for accessible projects
CREATE POLICY "Users can view scope items"
  ON public.scope_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_subcategories
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_subcategories.id = scope_items.subcategory_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Scope Items: Project members can modify items
CREATE POLICY "Project members can modify scope items"
  ON public.scope_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_subcategories
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_subcategories.id = scope_items.subcategory_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- ==========================================
-- RLS Policies for Time Entries
-- ==========================================

-- Time Entries: Users can view their own time entries or entries on their projects
CREATE POLICY "Users can view time entries"
  ON public.time_entries
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = time_entries.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Time Entries: Users can create their own time entries
CREATE POLICY "Users can create time entries"
  ON public.time_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Time Entries: Users can update their own time entries
CREATE POLICY "Users can update own time entries"
  ON public.time_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Time Entries: Users can delete their own time entries
CREATE POLICY "Users can delete own time entries"
  ON public.time_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS Policies for Scope Item Materials
-- ==========================================

CREATE POLICY "Users can view scope item materials"
  ON public.scope_item_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_materials.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can modify scope item materials"
  ON public.scope_item_materials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_materials.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- ==========================================
-- RLS Policies for Scope Item Tools
-- ==========================================

CREATE POLICY "Users can view scope item tools"
  ON public.scope_item_tools
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_tools.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can modify scope item tools"
  ON public.scope_item_tools
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_tools.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- ==========================================
-- RLS Policies for Scope Item Checklist
-- ==========================================

CREATE POLICY "Users can view scope item checklist"
  ON public.scope_item_checklist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_checklist.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can modify scope item checklist"
  ON public.scope_item_checklist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_checklist.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- ==========================================
-- RLS Policies for Scope Item Photos
-- ==========================================

CREATE POLICY "Users can view scope item photos"
  ON public.scope_item_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_photos.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can modify scope item photos"
  ON public.scope_item_photos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_photos.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- ==========================================
-- RLS Policies for Scope Item Comments
-- ==========================================

CREATE POLICY "Users can view scope item comments"
  ON public.scope_item_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_comments.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can create comments"
  ON public.scope_item_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.scope_items
      JOIN public.scope_subcategories ON scope_subcategories.id = scope_items.subcategory_id
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_items.id = scope_item_comments.scope_item_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.scope_item_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.scope_item_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS Policies for Templates (Public Read)
-- ==========================================

-- Category Templates: Everyone can read, only authenticated users can modify
CREATE POLICY "Anyone can view category templates"
  ON public.category_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify category templates"
  ON public.category_templates
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Subcategory Templates: Everyone can read
CREATE POLICY "Anyone can view subcategory templates"
  ON public.subcategory_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify subcategory templates"
  ON public.subcategory_templates
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Checklist Templates: Everyone can read
CREATE POLICY "Anyone can view checklist templates"
  ON public.checklist_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify checklist templates"
  ON public.checklist_templates
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Checklist Template Items: Everyone can read
CREATE POLICY "Anyone can view checklist template items"
  ON public.checklist_template_items
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify checklist template items"
  ON public.checklist_template_items
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ==========================================
-- RLS Policies for Workers
-- ==========================================

-- Workers: Authenticated users can view all workers
CREATE POLICY "Authenticated users can view workers"
  ON public.workers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can modify workers"
  ON public.workers
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ==========================================
-- RLS Policies for Task Sections
-- ==========================================

CREATE POLICY "Users can view task sections"
  ON public.task_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_subcategories
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_subcategories.id = task_sections.subcategory_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can modify task sections"
  ON public.task_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scope_subcategories
      JOIN public.scope_categories ON scope_categories.id = scope_subcategories.category_id
      JOIN public.projects ON projects.id = scope_categories.project_id
      WHERE scope_subcategories.id = task_sections.subcategory_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- ==========================================
-- RLS Policies for Contacts
-- ==========================================

-- Contacts: Users can view their own contacts
CREATE POLICY "Users can view own contacts"
  ON public.contacts
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create contacts"
  ON public.contacts
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own contacts"
  ON public.contacts
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own contacts"
  ON public.contacts
  FOR DELETE
  USING (auth.uid() = created_by);

-- ==========================================
-- RLS Policies for Project Contacts
-- ==========================================

CREATE POLICY "Users can view project contacts"
  ON public.project_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_contacts.project_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can manage project contacts"
  ON public.project_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_contacts.project_id
      AND (
        projects.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- ==========================================
-- Grant necessary permissions
-- ==========================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ==========================================
-- END OF MIGRATION
-- ==========================================
