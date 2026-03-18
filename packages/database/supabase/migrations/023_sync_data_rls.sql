-- Migration 023: Tighten sync_data RLS
--
-- Adds org_id column and replaces the wide-open policy with
-- organization-scoped access for authenticated users.
--
-- IMPORTANT: Do NOT apply this migration until Supabase Auth is wired up
-- in the app (login flow, session management). Until then, auth.uid()
-- returns null and all sync operations will be denied.

-- 1. Add org_id column (nullable so existing rows aren't broken)
ALTER TABLE sync_data
  ADD COLUMN IF NOT EXISTS org_id UUID;

-- Index for RLS lookups
CREATE INDEX IF NOT EXISTS idx_sync_data_org ON sync_data(org_id);

-- 2. Drop the wide-open policy
DROP POLICY IF EXISTS "sync_data_all" ON sync_data;

-- 3. Authenticated users: read own org's data
CREATE POLICY "sync_data_select_own_org" ON sync_data
  FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

-- 4. Authenticated users: insert with org_id matching their org
CREATE POLICY "sync_data_insert_own_org" ON sync_data
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org_id());

-- 5. Authenticated users: update own org's data
CREATE POLICY "sync_data_update_own_org" ON sync_data
  FOR UPDATE
  TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- 6. Authenticated users: delete own org's data
CREATE POLICY "sync_data_delete_own_org" ON sync_data
  FOR DELETE
  TO authenticated
  USING (org_id = get_user_org_id());

-- 7. Deny anonymous access entirely (no policy = no access under RLS)
-- Anonymous users have zero policies, so RLS blocks all operations.
