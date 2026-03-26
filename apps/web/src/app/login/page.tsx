'use client';

/**
 * Login Page — /login
 *
 * Email + password authentication via Supabase Auth.
 * No sign-up flow — accounts are created by the Owner in the admin panel (Phase 3).
 * Matches the dark instrument UI aesthetic (sidebar palette).
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HooomzLogoMark } from '@/components/navigation/HooomzLogoMark';

const MONO = "'DM Mono', monospace";
const FIG = "'Figtree', sans-serif";

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, signIn, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If user is already authenticated, redirect based on role
  useEffect(() => {
    if (!authLoading && user) {
      const role = profile?.role;
      if (role === 'installer') router.push('/schedule');
      else if (role === 'operator') router.push('/production');
      else router.push('/');
    }
  }, [authLoading, user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      // Don't router.push here — the useEffect above will redirect
      // once AuthContext updates `user`. Pushing immediately races
      // with ProtectedRoute which still sees user=null and bounces
      // back to /login.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--dark-nav)',
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <HooomzLogoMark size={28} />
          <p
            style={{
              fontFamily: MONO,
              fontSize: 9,
              fontWeight: 400,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginTop: 8,
            }}
          >
            Interiors
          </p>
        </div>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label
            htmlFor="email"
            style={{
              fontFamily: MONO,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              fontFamily: FIG,
              fontSize: 14,
              padding: '12px 14px',
              background: 'var(--charcoal)',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#fff',
              outline: 'none',
            }}
          />
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label
            htmlFor="password"
            style={{
              fontFamily: MONO,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              fontFamily: FIG,
              fontSize: 14,
              padding: '12px 14px',
              background: 'var(--charcoal)',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#fff',
              outline: 'none',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: 'var(--red)',
              margin: 0,
              padding: '8px 12px',
              background: 'var(--red-bg)',
              border: '1px solid var(--red-bg)',
              borderRadius: 6,
            }}
          >
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            padding: '14px 24px',
            background: submitting ? '#333' : 'var(--surface)',
            color: submitting ? '#666' : 'var(--dark-nav)',
            border: 'none',
            borderRadius: 6,
            cursor: submitting ? 'wait' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Note */}
        <p
          style={{
            fontFamily: MONO,
            fontSize: 9,
            color: '#333',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          No account? Contact your admin.
        </p>
      </form>
    </div>
  );
}
