import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/crew
 *
 * Creates a Supabase Auth account for a new crew member.
 * Uses the service role key to call auth.admin.createUser().
 * Called from /admin/crew when the Owner adds a new crew member.
 *
 * Body: { email, password, fullName, role }
 * Returns: { userId } — the Supabase Auth UUID to store as supabaseUserId
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const ORG_ID = '17167c5f-f74f-4fca-9b07-5b47033044ef';

function getServiceClient() {
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const client = getServiceClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Supabase service role not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, fullName, role } = body as {
      email: string;
      password: string;
      fullName: string;
      role: 'owner' | 'operator' | 'installer';
    };

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, fullName, role' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email verification — owner is creating the account
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Create user_profiles row
    const { error: profileError } = await client
      .from('user_profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Failed to create user_profiles row:', profileError);
      // Don't fail — auth account was created, profile can be fixed later
    }

    // 3. Create team_members row (required for RLS/sync)
    const { error: teamError } = await client
      .from('team_members')
      .upsert({
        id: userId, // use auth UUID as team_members PK
        organization_id: ORG_ID,
        user_id: userId,
        role: role === 'owner' ? 'owner' : role === 'operator' ? 'project_manager' : 'worker',
        is_active: true,
        certifications: [],
        created_at: new Date().toISOString(),
      });

    if (teamError) {
      console.error('Failed to create team_members row:', teamError);
    }

    return NextResponse.json({ userId });
  } catch (err) {
    console.error('POST /api/crew error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
