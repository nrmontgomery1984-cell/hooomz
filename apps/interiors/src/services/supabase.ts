import { createClient } from '@supabase/supabase-js';
import type { Database, Profile } from '../types/database';

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
  );
}

/**
 * Typed Supabase client
 */
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ============================================================================
// AUTH HELPERS
// ============================================================================

/**
 * Get the currently authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting current user:', error.message);
    return null;
  }

  return user;
}

/**
 * Get the current user's profile from the profiles table
 * Returns null if not authenticated or profile not found
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error getting profile:', error.message);
    return null;
  }

  return data;
}

/**
 * Get the current user's company_id
 * Returns null if not authenticated or no company assigned
 */
export async function getUserCompanyId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  return profile?.company_id ?? null;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: Profile['role']): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === role;
}

/**
 * Check if the current user has one of the specified roles
 */
export async function hasAnyRole(roles: Profile['role'][]): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile ? roles.includes(profile.role) : false;
}

// ============================================================================
// AUTH LISTENERS
// ============================================================================

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default supabase;
