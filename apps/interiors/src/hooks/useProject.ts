/**
 * useProject Hook
 * Fetches all data needed for the project view in parallel
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getProjectWithLoops } from '../services/api/loops';
import { getFloorPlans, getFloorPlanElements } from '../services/api/floorPlans';
import { getProjectActivity } from '../services/api/activity';
import type {
  Loop,
  FloorPlan,
  FloorPlanElement,
  ActivityEvent,
} from '../types/database';

export interface UseProjectReturn {
  /** The project loop */
  project: Loop | null;
  /** All loops in the project (flat list) */
  loops: Loop[];
  /** Map of loop ID to loop for quick lookup */
  loopsMap: Map<string, Loop>;
  /** The primary floor plan (first one, if exists) */
  floorPlan: FloorPlan | null;
  /** All floor plans for the project */
  floorPlans: FloorPlan[];
  /** Floor plan elements for the primary floor plan */
  floorPlanElements: FloorPlanElement[];
  /** Recent activity events */
  activity: ActivityEvent[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch all data */
  refetch: () => Promise<void>;
  /** Update a single loop in local state (for optimistic updates) */
  updateLoopLocally: (loop: Loop) => void;
  /** Add an activity event to local state */
  addActivityLocally: (event: ActivityEvent) => void;
}

export function useProject(projectId: string | undefined): UseProjectReturn {
  const [project, setProject] = useState<Loop | null>(null);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [floorPlanElements, setFloorPlanElements] = useState<FloorPlanElement[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create loops map for quick lookup
  const loopsMap = useMemo(() => {
    const map = new Map<string, Loop>();
    loops.forEach((loop) => map.set(loop.id, loop));
    return map;
  }, [loops]);

  // Primary floor plan (first one)
  const floorPlan = useMemo(() => {
    return floorPlans.length > 0 ? floorPlans[0] : null;
  }, [floorPlans]);

  // Fetch all project data
  const fetchData = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoops([]);
      setFloorPlans([]);
      setFloorPlanElements([]);
      setActivity([]);
      setIsLoading(false);
      return;
    }

    // Handle mock project IDs (demo data)
    if (projectId.startsWith('mock-')) {
      const mockProjects: Record<string, { name: string; score: number; status: Loop['status'] }> = {
        'mock-1': { name: 'Henderson LVT', score: 94, status: 'in_progress' },
        'mock-2': { name: 'Willow Creek Tile', score: 72, status: 'in_progress' },
        'mock-3': { name: 'Oakridge Hardwood', score: 38, status: 'blocked' },
      };
      const mockInfo = mockProjects[projectId] || { name: 'Demo Project', score: 75, status: 'in_progress' as const };

      const mockProject: Loop = {
        id: projectId,
        company_id: 'demo-company',
        parent_id: null,
        project_id: null,
        type: 'project',
        name: mockInfo.name,
        cost_code: 'FLOOR-001',
        status: mockInfo.status,
        health_score: mockInfo.score,
        planned_start: null,
        planned_end: null,
        actual_start: new Date().toISOString(),
        actual_end: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
      };

      const mockLoops: Loop[] = [
        mockProject,
        { ...mockProject, id: `${projectId}-room-1`, parent_id: projectId, project_id: projectId, type: 'room', name: 'Living Room', status: 'complete', health_score: 100 },
        { ...mockProject, id: `${projectId}-room-2`, parent_id: projectId, project_id: projectId, type: 'room', name: 'Kitchen', status: 'in_progress', health_score: 80 },
        { ...mockProject, id: `${projectId}-room-3`, parent_id: projectId, project_id: projectId, type: 'room', name: 'Master Bedroom', status: mockInfo.status, health_score: mockInfo.score },
      ];

      setProject(mockProject);
      setLoops(mockLoops);
      setFloorPlans([]);
      setFloorPlanElements([]);
      setActivity([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch project, loops, floor plans, and activity in parallel
      const [projectData, floorPlansData, activityData] = await Promise.all([
        getProjectWithLoops(projectId),
        getFloorPlans(projectId),
        getProjectActivity(projectId, 50),
      ]);

      setProject(projectData.project);
      setLoops(projectData.loops);
      setFloorPlans(floorPlansData);
      setActivity(activityData);

      // If we have a floor plan, fetch its elements
      if (floorPlansData.length > 0) {
        const elements = await getFloorPlanElements(floorPlansData[0].id);
        setFloorPlanElements(elements);
      } else {
        setFloorPlanElements([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load project'));
      console.error('Error loading project:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update a single loop locally (for optimistic updates and real-time)
  const updateLoopLocally = useCallback((updatedLoop: Loop) => {
    // Update in loops array
    setLoops((prev) =>
      prev.map((loop) => (loop.id === updatedLoop.id ? updatedLoop : loop))
    );

    // Update project if it's the project loop
    setProject((prev) => {
      if (prev && prev.id === updatedLoop.id) {
        return updatedLoop;
      }
      return prev;
    });
  }, []);

  // Add an activity event locally (for optimistic updates and real-time)
  const addActivityLocally = useCallback((event: ActivityEvent) => {
    setActivity((prev) => [event, ...prev]);
  }, []);

  return {
    project,
    loops,
    loopsMap,
    floorPlan,
    floorPlans,
    floorPlanElements,
    activity,
    isLoading,
    error,
    refetch: fetchData,
    updateLoopLocally,
    addActivityLocally,
  };
}

export default useProject;
