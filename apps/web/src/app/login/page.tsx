'use client';

/**
 * Login Page — /login
 *
 * Email + password authentication via Supabase Auth.
 * No sign-up flow — accounts are created by the Owner in the admin panel (Phase 3).
 * Matches the dark instrument UI aesthetic (sidebar palette).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HooomzLogoMark } from '@/components/navigation/HooomzLogoMark';

const MONO = "'DM Mono', monospace";
const FIG = "'Figtree', sans-serif";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError);
      setSubmitting(false);
      return;
    }

    router.push('/leads');
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111010' }}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555' }}>
          Loading&hellip;
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111010',
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
              color: '#555',
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
              color: '#555',
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
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#ffffff',
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
              color: '#555',
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
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#ffffff',
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
              color: '#DC2626',
              margin: 0,
              padding: '8px 12px',
              background: 'rgba(220,38,38,.08)',
              border: '1px solid rgba(220,38,38,.2)',
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
            background: submitting ? '#333' : '#ffffff',
            color: submitting ? '#666' : '#111010',
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
