'use client';

/**
 * Portal Data Hook — aggregates data for the homeowner-facing client portal.
 * Read-only. Filters out internal events. No budget/financial data exposed.
 */

import { useQuery } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { useLocalProject, useLocalTasks } from './useLocalData';
import { useActiveCrewMembers } from './useCrewData';
import type { Project, Photo, Task } from '@hooomz/shared-contracts';
import type { CrewMember, CrewTier } from '@hooomz/shared-contracts';
import type { ActivityEvent } from '../repositories/activity.repository';

// ============================================================================
// Types
// ============================================================================

export interface TradeProgressItem {
  tradeCode: string;
  tradeName: string;
  totalTasks: number;
  completedTasks: number;
  hasIterations: boolean;
  iterationLabel?: string;
}

export interface PortalUpdate {
  id: string;
  type: 'completed' | 'started' | 'deployed' | 'approved' | 'photo' | 'other';
  summary: string;
  timestamp: string;
}

export interface PortalTeamMember {
  id: string;
  displayName: string;
  displayRole: string;
}

export interface PortalData {
  project: Project | null;
  projectStatus: 'on-track' | 'needs-attention' | 'complete';
  statusLabel: string;
  estimatedCompletion: string;

  totalTasks: number;
  completedTasks: number;
  progressPercent: number;

  tradeProgress: TradeProgressItem[];

  recentUpdates: PortalUpdate[];

  photos: Photo[];

  team: PortalTeamMember[];

  isLoading: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const TRADE_NAMES: Record<string, string> = {
  FL: 'Flooring',
  PT: 'Paint',
  FC: 'Baseboards & Trim',
  DW: 'Drywall',
  TL: 'Tile',
  OH: 'General',
};

const TIER_ROLES: Record<CrewTier, string> = {
  master: 'Project Lead',
  lead: 'Lead Installer',
  proven: 'Installer',
  learner: 'Apprentice',
};

// ============================================================================
// Helpers
// ============================================================================

function formatCrewName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function formatEstimatedCompletion(project: Project | null | undefined): string {
  if (!project?.dates?.estimatedEndDate) return 'In Progress';
  const date = new Date(project.dates.estimatedEndDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function deriveProjectStatus(
  tasks: Task[],
): 'on-track' | 'needs-attention' | 'complete' {
  if (tasks.length === 0) return 'on-track';
  const allComplete = tasks.every((t) => t.status === 'complete');
  if (allComplete) return 'complete';
  const hasBlocked = tasks.some((t) => t.status === 'blocked');
  if (hasBlocked) return 'needs-attention';
  return 'on-track';
}

function deriveStatusLabel(status: 'on-track' | 'needs-attention' | 'complete'): string {
  switch (status) {
    case 'on-track': return 'On Track';
    case 'needs-attention': return 'Needs Attention';
    case 'complete': return 'Complete';
  }
}

function deriveUpdateType(eventType: string): PortalUpdate['type'] {
  if (eventType.includes('completed') || eventType.includes('passed')) return 'completed';
  if (eventType.includes('started') || eventType.includes('status_changed')) return 'started';
  if (eventType.includes('deployed') || eventType.includes('scheduled')) return 'deployed';
  if (eventType.includes('approved')) return 'approved';
  if (eventType.includes('photo')) return 'photo';
  return 'other';
}

function buildTradeProgress(tasks: Task[]): TradeProgressItem[] {
  const groups = new Map<string, { tasks: Task[]; iterations: Set<string> }>();

  for (const task of tasks) {
    const code = task.sopCode?.slice(0, 2) || 'OT';
    if (!groups.has(code)) {
      groups.set(code, { tasks: [], iterations: new Set() });
    }
    const group = groups.get(code)!;
    group.tasks.push(task);
    if (task.loopIterationId) {
      group.iterations.add(task.loopIterationId);
    }
  }

  const result: TradeProgressItem[] = [];
  for (const [code, group] of groups) {
    const total = group.tasks.length;
    const completed = group.tasks.filter((t) => t.status === 'complete').length;
    const hasIterations = group.iterations.size > 0;

    let iterationLabel: string | undefined;
    if (hasIterations) {
      const completedIterations = new Set<string>();
      for (const task of group.tasks) {
        if (task.status === 'complete' && task.loopIterationId) {
          completedIterations.add(task.loopIterationId);
        }
      }
      iterationLabel = `${completedIterations.size}/${group.iterations.size} rooms`;
    }

    result.push({
      tradeCode: code,
      tradeName: TRADE_NAMES[code] || code,
      totalTasks: total,
      completedTasks: completed,
      hasIterations,
      iterationLabel,
    });
  }

  // Sort: incomplete first, then by trade name
  result.sort((a, b) => {
    const aDone = a.completedTasks === a.totalTasks ? 1 : 0;
    const bDone = b.completedTasks === b.totalTasks ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return a.tradeName.localeCompare(b.tradeName);
  });

  return result;
}

// ============================================================================
// Hook
// ============================================================================

export function usePortalData(projectId: string): PortalData {
  const { services, isLoading: servicesLoading } = useServicesContext();

  // Project details
  const { data: project, isLoading: projectLoading } = useLocalProject(projectId);

  // Tasks for this project
  const { data: tasksData, isLoading: tasksLoading } = useLocalTasks(projectId);
  const tasks = tasksData?.tasks ?? [];

  // Active crew members
  const { data: crewRaw = [] } = useActiveCrewMembers();

  // Homeowner-visible activity events
  const { data: activityData } = useQuery({
    queryKey: ['portal', 'activity', projectId],
    queryFn: async () => {
      if (!services) return { events: [], total: 0 };
      const repo = services.activity.getRepository();
      return repo.findHomeownerVisible(projectId, { limit: 15 });
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 10_000,
  });

  // Project photos
  const { data: photos = [] } = useQuery({
    queryKey: ['portal', 'photos', projectId],
    queryFn: async () => {
      if (!services) return [];
      return services.fieldDocs.photos.findByProjectId(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 30_000,
  });

  // Derive values
  const completedTasks = tasks.filter(
    (t) => t.status === 'complete'
  ).length;
  const activeTasks = tasks.length;
  const progressPercent = activeTasks > 0
    ? Math.round((completedTasks / activeTasks) * 100)
    : 0;

  const projectStatus = deriveProjectStatus(tasks);

  const recentUpdates: PortalUpdate[] = (activityData?.events ?? []).map(
    (event: ActivityEvent) => ({
      id: event.id,
      type: deriveUpdateType(event.event_type),
      summary: event.summary,
      timestamp: event.timestamp,
    })
  );

  const team: PortalTeamMember[] = crewRaw.map((member: CrewMember) => ({
    id: member.id,
    displayName: formatCrewName(member.name),
    displayRole: TIER_ROLES[member.tier] || member.role,
  }));

  return {
    project: project ?? null,
    projectStatus,
    statusLabel: deriveStatusLabel(projectStatus),
    estimatedCompletion: formatEstimatedCompletion(project),

    totalTasks: activeTasks,
    completedTasks,
    progressPercent,

    tradeProgress: buildTradeProgress(tasks),

    recentUpdates,

    photos,

    team,

    isLoading: projectLoading || tasksLoading,
  };
}
