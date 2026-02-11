/**
 * Loop Service - Wraps Loop operations with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all loop (nested task container) operations are logged.
 *
 * Loops (Looops) are collapsible containers for organizing work by:
 * - Trade (Flooring, Paint, Finish Carpentry, Tile, Drywall, Overhead)
 * - Stage (Demo, Prime & Prep, Finish, Punch List, Closeout)
 * - Location (Kitchen, Master Bath, etc.)
 */

import type { Services } from './index';

// Loop type definition (simplified for web app)
interface Loop {
  id: string;
  projectId: string;
  name: string;
  type: 'trade' | 'stage' | 'location';
  parentLoopId: string | null;
  status: 'pending' | 'in-progress' | 'complete' | 'blocked';
  healthScore: number; // 0-100
  taskIds: string[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
  // Three-axis context
  workCategoryCode?: string;
  trade?: string;
  stageCode?: string;
  locationId?: string;
}

interface CreateLoopInput {
  projectId: string;
  name: string;
  type: 'trade' | 'stage' | 'location';
  parentLoopId?: string | null;
  workCategoryCode?: string;
  trade?: string;
  stageCode?: string;
  locationId?: string;
}

/**
 * LoopService - Handles loop operations with activity logging
 *
 * Note: This service creates in-memory loops and logs events.
 * In a full implementation, you'd have a LoopRepository backing this.
 */
export class LoopService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Create a new loop
   */
  async create(data: CreateLoopInput): Promise<Loop> {
    const loop: Loop = {
      id: crypto.randomUUID(),
      projectId: data.projectId,
      name: data.name,
      type: data.type,
      parentLoopId: data.parentLoopId || null,
      status: 'pending',
      healthScore: 100,
      taskIds: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
      workCategoryCode: data.workCategoryCode,
      trade: data.trade,
      stageCode: data.stageCode,
      locationId: data.locationId,
    };

    // Log to activity (non-blocking)
    this.services.activity.logLoopEvent('loop.created', data.projectId, loop.id, {
      loop_name: loop.name,
      loop_type: loop.type,
      parent_loop_id: loop.parentLoopId,
      work_category_code: loop.workCategoryCode,
      trade: loop.trade,
      stage_code: loop.stageCode,
      location_id: loop.locationId,
    }).catch((err) => console.error('Failed to log loop.created:', err));

    return loop;
  }

  /**
   * Update loop status
   */
  async updateStatus(
    projectId: string,
    loopId: string,
    newStatus: 'pending' | 'in-progress' | 'complete' | 'blocked',
    existingLoop: Loop
  ): Promise<Loop> {
    const oldStatus = existingLoop.status;

    const updated: Loop = {
      ...existingLoop,
      status: newStatus,
      metadata: {
        ...existingLoop.metadata,
        updatedAt: new Date().toISOString(),
        version: existingLoop.metadata.version + 1,
      },
    };

    // Log status change (non-blocking)
    this.services.activity.logLoopEvent('loop.status_changed', projectId, loopId, {
      loop_name: existingLoop.name,
      loop_type: existingLoop.type,
      old_status: oldStatus,
      new_status: newStatus,
      work_category_code: existingLoop.workCategoryCode,
      trade: existingLoop.trade,
      stage_code: existingLoop.stageCode,
      location_id: existingLoop.locationId,
    }).catch((err) => console.error('Failed to log loop.status_changed:', err));

    return updated;
  }

  /**
   * Update loop health score
   */
  async updateHealth(
    projectId: string,
    loopId: string,
    healthScore: number,
    existingLoop: Loop
  ): Promise<Loop> {
    const updated: Loop = {
      ...existingLoop,
      healthScore,
      metadata: {
        ...existingLoop.metadata,
        updatedAt: new Date().toISOString(),
        version: existingLoop.metadata.version + 1,
      },
    };

    // Log health update (non-blocking)
    this.services.activity.logLoopEvent('loop.health_updated', projectId, loopId, {
      loop_name: existingLoop.name,
      loop_type: existingLoop.type,
      health_score: healthScore,
      work_category_code: existingLoop.workCategoryCode,
      trade: existingLoop.trade,
      stage_code: existingLoop.stageCode,
      location_id: existingLoop.locationId,
    }).catch((err) => console.error('Failed to log loop.health_updated:', err));

    return updated;
  }

  /**
   * Delete a loop
   */
  async delete(
    projectId: string,
    loopId: string,
    existingLoop?: Loop
  ): Promise<boolean> {
    // Log deletion (non-blocking)
    this.services.activity.logLoopEvent('loop.deleted', projectId, loopId, {
      loop_name: existingLoop?.name || 'Unknown',
      loop_type: existingLoop?.type,
      work_category_code: existingLoop?.workCategoryCode,
      trade: existingLoop?.trade,
      stage_code: existingLoop?.stageCode,
      location_id: existingLoop?.locationId,
    }).catch((err) => console.error('Failed to log loop.deleted:', err));

    return true;
  }

  /**
   * Add a task to a loop
   */
  async addTask(
    _projectId: string,
    _loopId: string,
    taskId: string,
    existingLoop: Loop
  ): Promise<Loop> {
    const updated: Loop = {
      ...existingLoop,
      taskIds: [...existingLoop.taskIds, taskId],
      metadata: {
        ...existingLoop.metadata,
        updatedAt: new Date().toISOString(),
        version: existingLoop.metadata.version + 1,
      },
    };

    return updated;
  }

  /**
   * Remove a task from a loop
   */
  async removeTask(
    _projectId: string,
    _loopId: string,
    taskId: string,
    existingLoop: Loop
  ): Promise<Loop> {
    const updated: Loop = {
      ...existingLoop,
      taskIds: existingLoop.taskIds.filter(id => id !== taskId),
      metadata: {
        ...existingLoop.metadata,
        updatedAt: new Date().toISOString(),
        version: existingLoop.metadata.version + 1,
      },
    };

    return updated;
  }

  /**
   * Calculate health score based on task statuses
   * Color escalation: Green (on track) → Yellow (at risk) → Red (blocked/overdue)
   */
  calculateHealthScore(
    completedTasks: number,
    totalTasks: number,
    blockedTasks: number,
    overdueTasks: number
  ): number {
    if (totalTasks === 0) return 100;

    // Base completion percentage
    const completionScore = (completedTasks / totalTasks) * 100;

    // Penalties for blocked/overdue tasks
    const blockedPenalty = (blockedTasks / totalTasks) * 30;
    const overduePenalty = (overdueTasks / totalTasks) * 20;

    const healthScore = Math.max(0, Math.min(100, completionScore - blockedPenalty - overduePenalty));
    return Math.round(healthScore);
  }
}

/**
 * Create a LoopService instance
 */
export function createLoopService(services: Services): LoopService {
  return new LoopService(services);
}
