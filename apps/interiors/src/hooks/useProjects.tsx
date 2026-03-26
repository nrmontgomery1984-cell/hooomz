import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { getProjects } from '../services/api/loops';
import type { Loop } from '../types/database';

interface UseProjectsReturn {
  projects: Loop[];
  portfolioScore: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Calculate portfolio score as weighted average of project health scores
 */
function calculatePortfolioScore(projects: Loop[]): number {
  if (projects.length === 0) return 0;
  const total = projects.reduce((sum, p) => sum + p.health_score, 0);
  return Math.round(total / projects.length);
}

/**
 * Hook to get all projects for a company
 */
export function useProjects(companyId: string | null): UseProjectsReturn {
  const [projects, setProjects] = useState<Loop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!companyId) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getProjects(companyId);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Subscribe to realtime updates for loops
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`company-projects-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'loops',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          // Handle different events
          if (payload.eventType === 'INSERT') {
            const newLoop = payload.new as Loop;
            if (newLoop.type === 'project') {
              setProjects((prev) => [newLoop, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedLoop = payload.new as Loop;
            if (updatedLoop.type === 'project') {
              setProjects((prev) =>
                prev.map((p) => (p.id === updatedLoop.id ? updatedLoop : p))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setProjects((prev) => prev.filter((p) => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const portfolioScore = calculatePortfolioScore(projects);

  return {
    projects,
    portfolioScore,
    isLoading,
    error,
    refetch: fetchProjects,
  };
}

export default useProjects;
