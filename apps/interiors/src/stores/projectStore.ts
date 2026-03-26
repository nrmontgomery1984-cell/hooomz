import { create } from 'zustand';
import type { Loop } from '../types/database';

interface ProjectState {
  // State
  projects: Loop[];
  currentProject: Loop | null;
  loops: Map<string, Loop>;
  isLoading: boolean;
  error: Error | null;

  // Actions
  setProjects: (projects: Loop[]) => void;
  setCurrentProject: (project: Loop | null) => void;
  setLoops: (loops: Loop[]) => void;
  updateLoop: (loopId: string, updates: Partial<Loop>) => void;
  addLoop: (loop: Loop) => void;
  removeLoop: (loopId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  currentProject: null,
  loops: new Map<string, Loop>(),
  isLoading: false,
  error: null,
};

/**
 * Zustand store for project and loop state
 */
export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  setProjects: (projects) =>
    set({
      projects,
      // Also update loops map with project-type loops
      loops: new Map(projects.map((p) => [p.id, p])),
    }),

  setCurrentProject: (project) =>
    set({ currentProject: project }),

  setLoops: (loops) =>
    set((state) => {
      const newLoops = new Map(state.loops);
      loops.forEach((loop) => newLoops.set(loop.id, loop));
      return { loops: newLoops };
    }),

  updateLoop: (loopId, updates) =>
    set((state) => {
      const existingLoop = state.loops.get(loopId);
      if (!existingLoop) return state;

      const updatedLoop = { ...existingLoop, ...updates };
      const newLoops = new Map(state.loops);
      newLoops.set(loopId, updatedLoop);

      // Also update projects array if this is a project
      const updatedProjects = state.projects.map((p) =>
        p.id === loopId ? updatedLoop : p
      );

      // Update current project if it matches
      const currentProject =
        state.currentProject?.id === loopId
          ? updatedLoop
          : state.currentProject;

      return {
        loops: newLoops,
        projects: updatedProjects,
        currentProject,
      };
    }),

  addLoop: (loop) =>
    set((state) => {
      const newLoops = new Map(state.loops);
      newLoops.set(loop.id, loop);

      // Also add to projects array if this is a project
      const projects =
        loop.type === 'project'
          ? [loop, ...state.projects]
          : state.projects;

      return {
        loops: newLoops,
        projects,
      };
    }),

  removeLoop: (loopId) =>
    set((state) => {
      const newLoops = new Map(state.loops);
      newLoops.delete(loopId);

      // Also remove from projects array
      const projects = state.projects.filter((p) => p.id !== loopId);

      // Clear current project if it was deleted
      const currentProject =
        state.currentProject?.id === loopId ? null : state.currentProject;

      return {
        loops: newLoops,
        projects,
        currentProject,
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
