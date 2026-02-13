'use client';

/**
 * Local Data Hooks - IndexedDB-backed React Query hooks
 *
 * These hooks provide offline-first data access by reading directly from
 * IndexedDB repositories. No external API server required.
 *
 * Use these hooks for the UI to enable true offline-first operation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { getLoggedServices } from '../services';
import type { CreateProject, UpdateProject } from '@hooomz/shared-contracts';
import type { ActivityResponse } from '../repositories/activity.repository';

// ============================================================================
// Query Keys
// ============================================================================

export const LOCAL_QUERY_KEYS = {
  projects: {
    all: ['local', 'projects'] as const,
    lists: () => [...LOCAL_QUERY_KEYS.projects.all, 'list'] as const,
    list: (filters: ProjectListParams) =>
      [...LOCAL_QUERY_KEYS.projects.lists(), filters] as const,
    details: () => [...LOCAL_QUERY_KEYS.projects.all, 'detail'] as const,
    detail: (id: string) => [...LOCAL_QUERY_KEYS.projects.details(), id] as const,
  },
  tasks: {
    all: ['local', 'tasks'] as const,
    allTasks: ['local', 'all-tasks'] as const,
    byProject: (projectId: string) => [...LOCAL_QUERY_KEYS.tasks.all, 'project', projectId] as const,
  },
  activity: {
    all: ['local', 'activity'] as const,
    recent: (limit: number) => [...LOCAL_QUERY_KEYS.activity.all, 'recent', limit] as const,
    project: (projectId: string, limit: number) =>
      [...LOCAL_QUERY_KEYS.activity.all, 'project', projectId, limit] as const,
  },
  customers: {
    all: ['local', 'customers'] as const,
    detail: (id: string) => [...LOCAL_QUERY_KEYS.customers.all, 'detail', id] as const,
  },
  intakeDrafts: {
    all: ['local', 'intakeDrafts'] as const,
    inProgress: ['local', 'intakeDrafts', 'inProgress'] as const,
    detail: (id: string) => ['local', 'intakeDrafts', 'detail', id] as const,
  },
};

// ============================================================================
// Project Hooks
// ============================================================================

interface ProjectListParams {
  status?: string | string[];
  clientId?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

/**
 * Fetch all projects from IndexedDB
 * Offline-first: Works without API server
 */
export function useLocalProjects(params: ProjectListParams = {}) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.projects.list(params),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');

      const result = await services.projects.findAll({
        filters: {
          status: params.status,
          clientId: params.clientId,
        },
        pageSize: params.limit,
        page: params.offset ? Math.floor(params.offset / (params.limit || 20)) + 1 : 1,
      });

      return result;
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5 * 1000, // 5 seconds
  });
}

/**
 * Fetch a single project by ID from IndexedDB
 */
export function useLocalProject(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.projects.detail(id!),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.projects.findById(id!);
    },
    enabled: !servicesLoading && !!services && !!id,
  });
}

/**
 * Create a new project (uses logged service for activity tracking)
 */
export function useCreateLocalProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProject) => {
      const loggedServices = getLoggedServices();
      return loggedServices.projects.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.projects.lists() });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Update an existing project (uses logged service for activity tracking)
 */
export function useUpdateLocalProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProject }) => {
      const loggedServices = getLoggedServices();
      return loggedServices.projects.update(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.projects.lists() });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Delete a project (uses logged service for activity tracking)
 */
export function useDeleteLocalProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const loggedServices = getLoggedServices();
      return loggedServices.projects.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.projects.lists() });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

// ============================================================================
// Task Hooks
// ============================================================================

/**
 * Fetch tasks for a specific project from IndexedDB.
 * Optionally filter by status.
 */
export function useLocalTasks(projectId: string | null, statusFilter?: string | string[]) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: [...LOCAL_QUERY_KEYS.tasks.byProject(projectId || ''), statusFilter],
    queryFn: async () => {
      if (!services || !projectId) return { tasks: [], total: 0 };
      const result = await services.scheduling.tasks.findAll({
        filters: {
          projectId,
          ...(statusFilter ? { status: statusFilter as any } : {}),
        },
      });
      return result;
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5 * 1000,
  });
}

/**
 * Mark a task complete. Logs to Activity spine and invalidates caches.
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, taskId }: { projectId: string; taskId: string; taskTitle?: string }) => {
      const loggedServices = getLoggedServices();
      return loggedServices.tasks.updateStatus(projectId, taskId, 'complete' as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.tasks.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.tasks.allTasks });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Undo a completed task — set status back to not-started.
 */
export function useUndoCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, taskId }: { projectId: string; taskId: string }) => {
      const loggedServices = getLoggedServices();
      return loggedServices.tasks.updateStatus(projectId, taskId, 'not-started' as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.tasks.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.tasks.allTasks });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Update a task's description (for notes, etc.)
 */
export function useUpdateTaskDescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, taskId, description }: { projectId: string; taskId: string; description: string }) => {
      const loggedServices = getLoggedServices();
      return loggedServices.tasks.update(projectId, taskId, { description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.tasks.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.tasks.allTasks });
    },
  });
}

export function useToggleLabsFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, taskId, flagged }: { projectId: string; taskId: string; flagged: boolean }) => {
      const loggedServices = getLoggedServices();
      return loggedServices.tasks.update(projectId, taskId, { labsFlagged: flagged });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.tasks.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.tasks.allTasks });
    },
  });
}

// ============================================================================
// SOP Progress Hooks
// ============================================================================

export interface SOPProgressData {
  id: string;
  taskId: string;
  sopId: string;
  completedSteps: (number | CompletedStep)[];
  updatedAt: string;
}

/** Build 3a: Enriched step completion with who/when tracking */
interface CompletedStep {
  stepNumber: number;
  completedAt: string;
  crewMemberId: string;
}

/** Type guard: is this an enriched CompletedStep or a legacy bare number? */
function isEnrichedStep(step: number | CompletedStep): step is CompletedStep {
  return typeof step === 'object' && 'stepNumber' in step;
}

/** Check if a step order is completed (handles both legacy number[] and enriched CompletedStep[]) */
export function isStepCompleted(completedSteps: (number | CompletedStep)[], stepOrder: number): boolean {
  return completedSteps.some(s => isEnrichedStep(s) ? s.stepNumber === stepOrder : s === stepOrder);
}

/** Get the step number from either format */
function getStepNumber(step: number | CompletedStep): number {
  return isEnrichedStep(step) ? step.stepNumber : step;
}

/**
 * Get SOP checklist progress for a task from IndexedDB
 */
export function useSOPProgress(taskId: string, sopId: string | undefined) {
  const progressId = sopId ? `${taskId}:${sopId}` : '';

  return useQuery({
    queryKey: ['local', 'sop-progress', progressId],
    queryFn: async (): Promise<SOPProgressData | null> => {
      if (!sopId) return null;
      const { initializeStorage } = await import('../storage');
      const adapter = await initializeStorage();
      return adapter.get<SOPProgressData>('sopProgress', progressId);
    },
    enabled: !!sopId && !!taskId,
    staleTime: 2 * 1000,
  });
}

/**
 * Toggle a step completion in SOP checklist progress
 */
export function useToggleSOPStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, sopId, stepOrder, crewMemberId }: { taskId: string; sopId: string; stepOrder: number; crewMemberId: string }) => {
      const { initializeStorage } = await import('../storage');
      const adapter = await initializeStorage();
      const progressId = `${taskId}:${sopId}`;

      const existing = await adapter.get<SOPProgressData>('sopProgress', progressId);
      const completedSteps = existing?.completedSteps || [];

      const alreadyCompleted = isStepCompleted(completedSteps, stepOrder);
      let updatedSteps: (number | CompletedStep)[];

      if (alreadyCompleted) {
        // Remove: filter out this step (handles both formats)
        updatedSteps = completedSteps.filter(s => getStepNumber(s) !== stepOrder);
      } else {
        // Add: push enriched CompletedStep, sort by step number
        const enrichedStep: CompletedStep = {
          stepNumber: stepOrder,
          completedAt: new Date().toISOString(),
          crewMemberId,
        };
        updatedSteps = [...completedSteps, enrichedStep].sort(
          (a, b) => getStepNumber(a) - getStepNumber(b)
        );
      }

      const progress: SOPProgressData = {
        id: progressId,
        taskId,
        sopId,
        completedSteps: updatedSteps,
        updatedAt: new Date().toISOString(),
      };

      await adapter.set('sopProgress', progressId, progress);
      return progress;
    },
    onSuccess: (_data, variables) => {
      const progressId = `${variables.taskId}:${variables.sopId}`;
      queryClient.invalidateQueries({ queryKey: ['local', 'sop-progress', progressId] });
    },
  });
}

// ============================================================================
// Activity Hooks
// ============================================================================

/**
 * Fetch recent activity from IndexedDB
 * Offline-first: Works without API server
 */
export function useLocalRecentActivity(limit = 20) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.activity.recent(limit),
    queryFn: async (): Promise<ActivityResponse> => {
      if (!services) throw new Error('Services not initialized');

      const repository = services.activity.getRepository();
      return repository.findRecent({ limit });
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5 * 1000, // 5 seconds - activity updates frequently
  });
}

/**
 * Fetch activity for a specific project from IndexedDB
 */
export function useLocalProjectActivity(projectId: string, limit = 20) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.activity.project(projectId, limit),
    queryFn: async (): Promise<ActivityResponse> => {
      if (!services) throw new Error('Services not initialized');

      const repository = services.activity.getRepository();
      return repository.findByProject(projectId, { limit });
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5 * 1000,
  });
}

// ============================================================================
// Business Health Hook (derived from local projects)
// ============================================================================

/**
 * Project status values considered "active"
 * Must match ProjectStatus enum values (hyphenated)
 */
const ACTIVE_STATUSES = ['in-progress', 'approved', 'lead', 'quoted'] as const;

/**
 * Project status indicating work is blocked
 */
const BLOCKED_STATUS = 'on-hold' as const;

/**
 * Business health summary
 */
export interface LocalBusinessHealthData {
  /** Overall health score 0-100 (average of active project scores) */
  healthScore: number;
  /** Number of projects currently in progress */
  activeProjectCount: number;
  /** Number of projects with blocked status */
  blockedCount: number;
  /** List of active projects for drilling down */
  projects: Array<{
    id: string;
    name: string;
    status: string;
    health_score?: number;
    taskCount: number;
    completedCount: number;
    nextTask?: string;
  }>;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Calculate health score for a single project from its tasks.
 * Health = (complete tasks / total tasks) * 100
 * If no tasks, returns 0.
 */
function calculateProjectHealth(tasks: Array<{ status: string }>): number {
  if (tasks.length === 0) return 0;
  const complete = tasks.filter((t) => t.status === 'complete').length;
  return Math.round((complete / tasks.length) * 100);
}

/**
 * Calculate business health from local IndexedDB projects + tasks.
 * Health scores are derived from task completion — never set directly.
 * Offline-first: Works without API server.
 */
export function useLocalBusinessHealth(): LocalBusinessHealthData {
  const { services, isLoading: servicesLoading } = useServicesContext();
  const { data, isLoading: projectsLoading } = useLocalProjects();

  // Fetch all tasks to calculate per-project health
  const tasksQuery = useQuery({
    queryKey: ['local', 'all-tasks'],
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      const result = await services.scheduling.tasks.findAll();
      return result.tasks || [];
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5 * 1000,
  });

  const isLoading = projectsLoading || tasksQuery.isLoading;

  if (isLoading || !data) {
    return {
      healthScore: 0,
      activeProjectCount: 0,
      blockedCount: 0,
      projects: [],
      isLoading,
    };
  }

  const projectList = data.projects || [];
  const allTasks = tasksQuery.data || [];

  // Filter to active projects
  const activeProjects = projectList.filter((p) =>
    ACTIVE_STATUSES.includes(p.status as (typeof ACTIVE_STATUSES)[number])
  );

  // Calculate per-project health from task completion
  const projectsWithHealth = activeProjects.map((p) => {
    const projectTasks = allTasks.filter((t) => t.projectId === p.id);
    const completedCount = projectTasks.filter((t) => t.status === 'complete').length;
    const incompleteTasks = projectTasks
      .filter((t) => t.status !== 'complete');
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      health_score: calculateProjectHealth(projectTasks),
      taskCount: projectTasks.length,
      completedCount,
      nextTask: incompleteTasks[0]?.title,
    };
  });

  // Portfolio health = average of project health scores
  const healthScore =
    projectsWithHealth.length > 0
      ? Math.round(
          projectsWithHealth.reduce((sum, p) => sum + p.health_score, 0) /
            projectsWithHealth.length
        )
      : 0;

  const blockedCount = activeProjects.filter(
    (p) => (p.status as string) === BLOCKED_STATUS
  ).length;

  return {
    healthScore,
    activeProjectCount: activeProjects.length,
    blockedCount,
    projects: projectsWithHealth,
    isLoading,
  };
}

// ============================================================================
// Customer Hooks
// ============================================================================

/**
 * Fetch all customers from IndexedDB
 */
export function useLocalCustomers() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.customers.all,
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.customers.findAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single customer by ID
 */
export function useLocalCustomer(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.customers.detail(id!),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.customers.findById(id!);
    },
    enabled: !servicesLoading && !!services && !!id,
  });
}

// ============================================================================
// Intake Draft Hooks
// ============================================================================

/**
 * Fetch all in-progress intake drafts from IndexedDB
 */
export function useIntakeDrafts() {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.intakeDrafts.inProgress,
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.intakeDrafts.findInProgress();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5 * 1000,
  });
}

/**
 * Fetch a single intake draft by ID
 */
export function useIntakeDraft(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.intakeDrafts.detail(id!),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.intakeDrafts.findById(id!);
    },
    enabled: !servicesLoading && !!services && !!id,
  });
}
