import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

type LoginState = 'idle' | 'sending' | 'sent' | 'error';

// ============================================================================
// COMPONENT
// ============================================================================

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<LoginState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { signInWithMagicLink, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, or default to dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      setState('error');
      return;
    }

    setState('sending');
    setErrorMessage('');

    const { error } = await signInWithMagicLink(email.trim());

    if (error) {
      setErrorMessage(error.message || 'Failed to send magic link. Please try again.');
      setState('error');
    } else {
      setState('sent');
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Hooomz Flooring</h1>
        <p className="text-gray-600 mt-2">Professional Flooring, Professionally Managed</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {state === 'sent' ? (
          // Success state
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Click the link in the email to sign in. The link expires in 1 hour.
            </p>
            <button
              onClick={() => {
                setState('idle');
                setEmail('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Use a different email
            </button>
          </div>
        ) : (
          // Form state
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in</h2>
            <p className="text-gray-600 mb-6">
              Enter your email and we'll send you a magic link to sign in.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  disabled={state === 'sending'}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {/* Error message */}
              {state === 'error' && errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={state === 'sending'}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center min-h-[48px]"
              >
                {state === 'sending' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send magic link'
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-500">
        Powered by Hooomz OS
      </p>
    </div>
  );
}
