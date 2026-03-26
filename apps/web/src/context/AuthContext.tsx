'use client';

/**
 * AuthContext — Supabase authentication state for the app.
 *
 * Provides: user, profile (including role), loading, signIn, signOut.
 * Does NOT enforce route protection — that's a separate concern (Phase 2).
 *
 * SEQUENCING NOTE: After signIn, the user must have a row in team_members
 * linked to their Supabase auth UUID for sync RLS to work. If they don't,
 * sync will silently fail. Account provisioning is the Owner's job via
 * the admin panel (Phase 3) — do not auto-create team_members rows.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  signIn as supabaseSignIn,
  signOut as supabaseSignOut,
  getSession,
  onAuthStateChange,
} from '@/lib/supabase/client';

// ── Types ──

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'owner' | 'operator' | 'installer' | 'homeowner';
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

// ── Context ──

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helpers ──

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

// ── Provider ──

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile whenever user changes
  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(authUser.id);
    setProfile(p);
  }, []);

  // Initial session check
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Safety timeout — if getSession() hangs (wrong URL/key), use cached JWT
    // to unblock the app. 2s max wait, then proceed with whatever we have.
    const timeout = setTimeout(() => {
      if (!mounted) return;

      // Check localStorage for Supabase's cached session token
      const storageKey = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (storageKey) {
        try {
          const stored = JSON.parse(localStorage.getItem(storageKey) || '');
          const token = stored?.access_token;
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            const nowSec = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp > nowSec) {
              // JWT still valid — proceed with cached user instead of hanging
              console.warn('[Auth] Session check slow — proceeding with cached JWT');
              const cachedUser = stored.user as User | undefined;
              if (cachedUser) {
                setUser(cachedUser);
                loadProfile(cachedUser).catch(() => {});
              }
              setLoading(false);
              return;
            }
          }
        } catch {
          // Malformed token — fall through to redirect
        }
      }

      // No valid cached JWT — stop loading so ProtectedRoute redirects to /login
      console.warn('[Auth] Session check timed out, no valid cached JWT — redirecting to login');
      setLoading(false);
    }, 2000);

    async function init() {
      try {
        const { data: { session } } = await getSession();
        if (mounted) {
          const authUser = session?.user ?? null;
          setUser(authUser);
          await loadProfile(authUser);
        }
      } catch {
        // Supabase not reachable — continue without auth
      } finally {
        clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => { mounted = false; clearTimeout(timeout); };
  }, [loadProfile]);

  // Subscribe to auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data: { subscription } } = onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      await loadProfile(authUser);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── Actions ──

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabaseSignIn(email, password);
    if (error) return { error: error.message };
    // Eagerly set user state so ProtectedRoute sees it immediately
    // on navigation — don't rely solely on onAuthStateChange which
    // fires asynchronously and loses the race with router.push('/').
    const authUser = data?.user ?? null;
    if (authUser) {
      setUser(authUser);
      await loadProfile(authUser);
    }
    return { error: null };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
