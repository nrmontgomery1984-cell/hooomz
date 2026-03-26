/**
 * useClientProject Hook
 * Fetches project data for client portal (read-only, client_visible events only)
 *
 * Key differences from useProject:
 * - Only fetches client_visible: true activity events
 * - No status change capability
 * - Includes submitComment for client comments
 */

import { useState, useEffect, useCallback } from 'react';
import { getLoop, getProjectWithLoops } from '../services/api/loops';
import { getFloorPlans, getFloorPlanElements } from '../services/api/floorPlans';
import {
  getClientVisibleActivity,
  createClientCommentEvent,
} from '../services/api/activity';
import type {
  Loop,
  FloorPlan,
  FloorPlanElement,
  ActivityEvent,
} from '../types/database';

export interface UseClientProjectReturn {
  project: Loop | null;
  floorPlan: FloorPlan | null;
  elements: FloorPlanElement[];
  loops: Map<string, Loop>;
  recentUpdates: ActivityEvent[]; // client_visible only
  isLoading: boolean;
  error: Error | null;
  isAccessDenied: boolean;
  submitComment: (content: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useClientProject(
  projectId: string | undefined,
  accessCode?: string
): UseClientProjectReturn {
  const [project, setProject] = useState<Loop | null>(null);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [elements, setElements] = useState<FloorPlanElement[]>([]);
  const [loops, setLoops] = useState<Map<string, Loop>>(new Map());
  const [recentUpdates, setRecentUpdates] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Verify access code if required
  const verifyAccess = useCallback(
    (proj: Loop): boolean => {
      const requiredCode = (proj.metadata as { client_access_code?: string })
        ?.client_access_code;

      // If no code required (for demo), allow access
      if (!requiredCode) {
        return true;
      }

      // If code is required, check if provided code matches
      if (accessCode && accessCode === requiredCode) {
        return true;
      }

      return false;
    },
    [accessCode]
  );

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsAccessDenied(false);

    try {
      // Fetch project
      const proj = await getLoop(projectId);

      // Verify it's a project type
      if (proj.type !== 'project') {
        throw new Error('Not a valid project');
      }

      // Verify access
      const hasAccess = verifyAccess(proj);
      if (!hasAccess) {
        setIsAccessDenied(true);
        setIsLoading(false);
        return;
      }

      setProject(proj);

      // Fetch all data in parallel
      const [projectData, floorPlansData, activityData] = await Promise.all([
        getProjectWithLoops(projectId),
        getFloorPlans(projectId),
        getClientVisibleActivity(projectId, 20),
      ]);

      // Process loops into map
      const loopMap = new Map<string, Loop>();
      projectData.loops.forEach((loop) => {
        loopMap.set(loop.id, loop);
      });
      setLoops(loopMap);

      // Set activity (already filtered to client_visible: true)
      setRecentUpdates(activityData);

      // Process floor plans
      if (floorPlansData.length > 0) {
        setFloorPlan(floorPlansData[0]);

        // Fetch elements for the first floor plan
        const elementsData = await getFloorPlanElements(floorPlansData[0].id);
        setElements(elementsData);
      } else {
        setFloorPlan(null);
        setElements([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, verifyAccess]);

  // Submit client comment
  const submitComment = useCallback(
    async (content: string) => {
      if (!projectId || !content.trim()) {
        throw new Error('Project ID and content are required');
      }

      // Create comment event
      await createClientCommentEvent(projectId, content.trim());

      // Refresh activity to show the new comment
      const updatedActivity = await getClientVisibleActivity(projectId, 20);
      setRecentUpdates(updatedActivity);
    },
    [projectId]
  );

  // Fetch on mount and when projectId changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    project,
    floorPlan,
    elements,
    loops,
    recentUpdates,
    isLoading,
    error,
    isAccessDenied,
    submitComment,
    refetch: fetchData,
  };
}
