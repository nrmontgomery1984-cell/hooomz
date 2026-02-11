-- Seed file for Hooomz
-- Run with: supabase db reset (this runs migrations then seed.sql)

-- ============================================================================
-- SYSTEM USER
-- ============================================================================
-- The System user is used as the actor for all automated/system-generated events
-- ID is a well-known UUID: 00000000-0000-0000-0000-000000000000

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'system@hooomz.internal',
  '', -- No password - cannot login
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (
  id,
  email,
  full_name,
  avatar_url,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@hooomz.internal',
  'System',
  NULL,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DEVELOPMENT SAMPLE DATA (optional - uncomment for local dev)
-- ============================================================================

-- Uncomment below for development testing:
/*
-- Sample organization
INSERT INTO organizations (id, name, slug)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo Contractor',
  'demo-contractor'
)
ON CONFLICT (id) DO NOTHING;
*/
