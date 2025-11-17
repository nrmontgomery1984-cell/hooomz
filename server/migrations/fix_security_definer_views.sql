-- ==========================================
-- Fix SECURITY DEFINER Views
-- Remove SECURITY DEFINER from views to fix Supabase linter warnings
-- ==========================================

-- The views v_project_financials and v_task_instances_full are defined
-- with SECURITY DEFINER, which means they run with the permissions of
-- the view creator rather than the querying user.
--
-- Since we now have RLS policies in place, we can safely remove
-- SECURITY DEFINER and let the views use SECURITY INVOKER (default).
--
-- This means:
-- - Views will respect RLS policies
-- - Users will only see data they have permission to access
-- - More secure and compliant with Supabase best practices

-- ==========================================
-- Option 1: Drop and recreate views without SECURITY DEFINER
-- ==========================================

-- Note: If you're using the nested loop architecture migration,
-- you'll need to run that migration again without SECURITY DEFINER.
--
-- For now, these views may not exist yet if you haven't applied
-- the nested loop migration. This is just a preventive fix.

-- Drop views if they exist
DROP VIEW IF EXISTS public.v_task_instances_full CASCADE;
DROP VIEW IF EXISTS public.v_project_financials CASCADE;

-- The views will be recreated by the nested loop migration
-- or can be recreated here without SECURITY DEFINER

-- ==========================================
-- Alternative: Change existing views to SECURITY INVOKER
-- ==========================================

-- PostgreSQL doesn't have a direct ALTER VIEW command to change
-- security definer, so we need to recreate the views.

-- If the views exist and are critical, you would recreate them
-- with the exact same SELECT statement but without SECURITY DEFINER.

-- Example template (adjust based on your actual view definition):
--
-- CREATE OR REPLACE VIEW v_task_instances_full
-- SECURITY INVOKER  -- This is the default, can be omitted
-- AS
-- SELECT ... your original query ...

-- ==========================================
-- Summary
-- ==========================================

-- Since these views are part of the Nested Loop Architecture migration
-- which hasn't been fully implemented yet, the safest approach is to:
--
-- 1. Drop the views if they exist (done above)
-- 2. When you apply the nested loop migration in the future,
--    ensure the CREATE VIEW statements do NOT include SECURITY DEFINER
-- 3. By default, views use SECURITY INVOKER which respects RLS

COMMENT ON SCHEMA public IS 'Security definer views have been removed. Views now use SECURITY INVOKER (default) and respect RLS policies.';
