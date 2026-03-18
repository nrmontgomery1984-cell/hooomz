'use client';

/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 *
 * - Loading: full-screen dark spinner (no flash, no layout shift)
 * - No user: redirect to /login
 * - User exists: render children
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/lib/hooks/usePermissions';

/** Map pathname prefix → module key for permission checks */
const PATH_TO_MODULE: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/leads': 'leads',
  '/jobs': 'jobs',
  '/pipeline': 'pipeline',
  '/sales': 'sales',
  '/production/site-visits': 'site_visits',
  '/production/estimates': 'estimates',
  '/production/contracts': 'contracts',
  '/production/materials': 'materials',
  '/production/punch-lists': 'punch_lists',
  '/catalogue': 'cost_items',
  '/finance': 'dashboard',
  '/labs': 'labs',
  '/settings': 'settings',
  '/admin': 'admin',
  '/standards': 'dashboard',
  '/activity': 'dashboard',
  '/production': 'jobs',
  '/projects': 'jobs',
};

function resolveModule(pathname: string): string | null {
  // Try longest prefix match first
  const sorted = Object.keys(PATH_TO_MODULE).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return PATH_TO_MODULE[prefix];
    }
  }
  return null;
}

/** Routes that bypass auth entirely */
const PUBLIC_PATHS = ['/login', '/portal', '/intake'];

function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, firstAccessibleModule, loading: permLoading } = usePermissions();

  const isPublic = isPublicRoute(pathname);
  const loading = authLoading || permLoading;

  useEffect(() => {
    if (isPublic || loading) return;

    // Not authenticated → login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Check module permission for current path
    const mod = resolveModule(pathname || '');
    if (mod && !hasAccess(mod)) {
      // Redirect to first accessible module, or login if none
      const fallback = firstAccessibleModule();
      if (fallback) {
        // Reverse lookup: find first path for this module
        const entry = Object.entries(PATH_TO_MODULE).find(([, m]) => m === fallback);
        router.replace(entry ? entry[0] : '/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isPublic, loading, user, pathname, hasAccess, firstAccessibleModule, router]);

  // Public routes render immediately
  if (isPublic) return <>{children}</>;

  // Loading state — dark spinner, no flash
  if (loading || !user) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111010',
          zIndex: 9999,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: '2px solid #333',
            borderTopColor: '#aaa',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
