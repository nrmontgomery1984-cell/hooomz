'use client';

/**
 * usePermissions — checks module-level access based on the user's role.
 *
 * Fetches role_permissions from Supabase for the current user's role,
 * exposes hasAccess(module) and firstAccessibleModule() helpers.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface RolePermission {
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

// Ordered by priority for fallback redirect
const MODULE_PRIORITY = [
  'dashboard',
  'leads',
  'jobs',
  'pipeline',
  'sales',
  'customers',
  'site_visits',
  'estimates',
  'contracts',
  'materials',
  'punch_lists',
  'cost_items',
  'labs',
  'settings',
  'admin',
];

export function usePermissions() {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured() || !profile?.role) {
      // If no Supabase or no profile, grant full access (dev fallback)
      setPermissions(
        MODULE_PRIORITY.map((m) => ({ module: m, can_view: true, can_edit: true, can_delete: true }))
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    let mounted = true;

    async function load() {
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('module, can_view, can_edit, can_delete')
          .eq('role', profile!.role);

        if (mounted) {
          if (!error && data) {
            setPermissions(data as RolePermission[]);
          } else {
            // Fallback: grant all if query fails
            setPermissions(
              MODULE_PRIORITY.map((m) => ({ module: m, can_view: true, can_edit: true, can_delete: true }))
            );
          }
        }
      } catch {
        if (mounted) {
          setPermissions(
            MODULE_PRIORITY.map((m) => ({ module: m, can_view: true, can_edit: true, can_delete: true }))
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally depend on role only, not full profile object
  }, [profile?.role]);

  const hasAccess = useCallback(
    (module: string, level: 'view' | 'edit' | 'delete' = 'view'): boolean => {
      const perm = permissions.find((p) => p.module === module);
      if (!perm) return false;
      if (level === 'edit') return perm.can_edit;
      if (level === 'delete') return perm.can_delete;
      return perm.can_view;
    },
    [permissions]
  );

  const firstAccessibleModule = useCallback((): string | null => {
    for (const mod of MODULE_PRIORITY) {
      const perm = permissions.find((p) => p.module === mod);
      if (perm?.can_view) return mod;
    }
    return null;
  }, [permissions]);

  return { hasAccess, firstAccessibleModule, permissions, loading };
}
