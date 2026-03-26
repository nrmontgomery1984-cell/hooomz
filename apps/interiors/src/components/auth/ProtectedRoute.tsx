import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile } from '../../types/database';

// ============================================================================
// TYPES
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required roles to access this route. If not specified, any authenticated user can access. */
  allowedRoles?: Profile['role'][];
  /** Where to redirect if not authenticated */
  redirectTo?: string;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = profile?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have required role - redirect to dashboard with message
      return <Navigate to="/" state={{ accessDenied: true }} replace />;
    }
  }

  return <>{children}</>;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ProtectedRoute;
