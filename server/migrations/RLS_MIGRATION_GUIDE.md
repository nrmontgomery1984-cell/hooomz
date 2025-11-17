# RLS Migration Guide

## Overview

This migration enables Row Level Security (RLS) on all public tables to fix Supabase linter warnings and improve database security.

## What This Migration Does

1. **Enables RLS** on all 20 public tables
2. **Creates comprehensive RLS policies** for:
   - Project-based access control
   - User ownership verification
   - Team member collaboration
   - Public template access

## How to Apply

### Method 1: Supabase SQL Editor (RECOMMENDED)

This is the safest and most reliable method:

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `enable_rls_policies.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for all statements to execute
8. Verify in the **Database** → **Policies** section

### Method 2: Using psql (Alternative)

If you have direct database access:

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f migrations/enable_rls_policies.sql
```

### Method 3: Programmatic (Not Recommended)

```bash
node apply-rls-migration.js
```

Note: This method may have issues with some statements due to RPC limitations.

## RLS Policy Summary

### Projects Table
- **SELECT**: Users can view projects they created or are members of
- **INSERT**: Users can create projects
- **UPDATE**: Project creators and admins can update
- **DELETE**: Only project creators can delete

### Scope Items (Tasks)
- **Access**: Project members can view and modify all tasks
- **Hierarchy**: Policies cascade through categories → subcategories → items

### Time Entries
- **SELECT**: Users can view their own entries or entries on their projects
- **INSERT/UPDATE/DELETE**: Users can only manage their own entries

### Comments
- **SELECT**: Project members can view all comments
- **INSERT**: Project members can create comments (as themselves)
- **UPDATE/DELETE**: Users can only modify their own comments

### Templates (Public)
- **SELECT**: Anyone can read (for creating new projects)
- **INSERT/UPDATE/DELETE**: Only authenticated users can modify

### Contacts
- **All Operations**: Users can only access their own contacts

## Testing After Migration

### 1. Verify RLS is Enabled

In Supabase Dashboard → Database → Tables, check that each table shows "RLS Enabled" ✓

### 2. Test Access Control

Login as different users and verify:
- Can only see own projects
- Can see projects where added as member
- Cannot see other users' projects
- Can create and modify tasks in accessible projects
- Can only delete own comments

### 3. Test Application

Run through these key flows:
1. Create a new project
2. Add tasks to the project
3. Track time on tasks
4. Add comments to tasks
5. Invite team members
6. Verify team members can access shared projects

## Rollback (If Needed)

To disable RLS on all tables (emergency only):

```sql
-- DANGER: This removes all RLS protection!
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_items DISABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

## Common Issues & Solutions

### Issue: "permission denied for table"

**Cause**: RLS policy is too restrictive
**Solution**: Check that user is project member or owner

### Issue: "new row violates row-level security policy"

**Cause**: INSERT policy WITH CHECK condition not met
**Solution**: Ensure `created_by` or `user_id` matches `auth.uid()`

### Issue: Queries are slower after RLS

**Cause**: Complex policy checks on large datasets
**Solution**: Add indexes on commonly filtered columns:

```sql
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
```

## Backend Code Changes Required

### Using Service Role Key (Current Setup)

Your server uses the **service role key**, which **bypasses RLS**. This means:
- ✅ No code changes needed for server-side operations
- ✅ Server can access all data (as intended)
- ⚠️ Client-side queries will be affected by RLS

### Client-Side Considerations

If you're using Supabase client-side (anon key):
- Queries will be filtered by RLS policies
- Users will only see data they have access to
- This is the correct behavior for security

## Verification Checklist

After applying migration, verify:

- [ ] All tables show "RLS Enabled" in Supabase Dashboard
- [ ] Can create new projects
- [ ] Can view own projects
- [ ] Cannot view other users' projects (unless member)
- [ ] Can add tasks to accessible projects
- [ ] Can track time on tasks
- [ ] Can add/delete own comments
- [ ] Can invite team members
- [ ] Team members can access shared projects
- [ ] Templates are still accessible for project creation

## Impact Assessment

**Breaking Changes**: None expected
- Server uses service role key (bypasses RLS)
- Client-side access is properly restricted
- All existing functionality should work

**Security Improvements**:
- ✅ Data isolation between users
- ✅ Project-based access control
- ✅ Protection against unauthorized access
- ✅ Compliance with Supabase best practices

## Support

If you encounter issues after migration:
1. Check Supabase logs in Dashboard → Logs
2. Review RLS policies in Database → Policies
3. Test with different user accounts
4. Verify service role key is being used server-side
