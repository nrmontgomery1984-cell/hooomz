/**
 * Crew Schedule Service
 * Calendar scheduling: assign tasks to crew members on specific dates
 */

import type { CrewScheduleBlock, CrewScheduleStatus, Task } from '@hooomz/shared-contracts';
import type { CrewScheduleRepository } from '../repositories/crewSchedule.repository';
import type { TaskRepository } from '../repositories/task.repository';
import type { DeployedTaskRepository } from '../repositories/deployedTask.repository';
import type { ActivityService } from '../repositories/activity.repository';
import { addDays, startOfWeek, format } from 'date-fns';

export interface HoursSummary {
  scheduled: number;
  actual: number;
}

export interface ScheduleConflict {
  existingBlock: CrewScheduleBlock;
  reason: string;
}

export interface CrewScheduleService {
  // Queries
  getWeekSchedule(crewId: string, weekStart: string): Promise<CrewScheduleBlock[]>;
  getProjectWeekSchedule(projectId: string, weekStart: string): Promise<CrewScheduleBlock[]>;
  getTeamWeekSchedule(weekStart: string): Promise<CrewScheduleBlock[]>;
  getUnscheduledTasks(projectId?: string): Promise<Task[]>;
  getDayHours(crewId: string, date: string): Promise<HoursSummary>;
  getWeekHours(crewId: string, weekStart: string): Promise<HoursSummary>;
  detectConflicts(crewId: string, date: string, excludeBlockId?: string): Promise<ScheduleConflict[]>;

  // Mutations
  scheduleTask(params: {
    taskId: string;
    crewMemberId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    estimatedHours?: number;
  }): Promise<CrewScheduleBlock>;
  rescheduleBlock(blockId: string, newDate: string, newStartTime?: string, newEndTime?: string): Promise<CrewScheduleBlock | null>;
  unscheduleBlock(blockId: string): Promise<boolean>;
  updateBlockStatus(blockId: string, status: CrewScheduleStatus): Promise<CrewScheduleBlock | null>;
  updateActualHours(blockId: string, hours: number): Promise<CrewScheduleBlock | null>;
  bulkSchedule(assignments: Array<{
    taskId: string;
    crewMemberId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    estimatedHours?: number;
  }>): Promise<CrewScheduleBlock[]>;
}

export function createCrewScheduleService(
  scheduleRepo: CrewScheduleRepository,
  taskRepo: TaskRepository,
  deployedTaskRepo: DeployedTaskRepository,
  activityService: ActivityService,
): CrewScheduleService {

  function getWeekDateRange(weekStart: string): { start: string; end: string } {
    const startDate = new Date(weekStart + 'T00:00:00');
    const mondayStart = startOfWeek(startDate, { weekStartsOn: 1 });
    const sundayEnd = addDays(mondayStart, 6);
    return {
      start: format(mondayStart, 'yyyy-MM-dd'),
      end: format(sundayEnd, 'yyyy-MM-dd'),
    };
  }

  return {
    async getWeekSchedule(crewId, weekStart) {
      const { start, end } = getWeekDateRange(weekStart);
      const blocks = await scheduleRepo.findByCrewAndDateRange(crewId, start, end);
      return blocks.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        return 0;
      });
    },

    async getProjectWeekSchedule(projectId, weekStart) {
      const { start, end } = getWeekDateRange(weekStart);
      const blocks = await scheduleRepo.findByProjectAndDateRange(projectId, start, end);
      return blocks.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        return 0;
      });
    },

    async getTeamWeekSchedule(weekStart) {
      const { start, end } = getWeekDateRange(weekStart);
      const blocks = await scheduleRepo.findByDateRange(start, end);
      return blocks.sort((a, b) => {
        if (a.crewMemberId !== b.crewMemberId) return a.crewMemberId.localeCompare(b.crewMemberId);
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        return 0;
      });
    },

    async getUnscheduledTasks(projectId?) {
      const { tasks: allTasks } = await taskRepo.findAll();
      const allBlocks = await scheduleRepo.findAll();
      const scheduledTaskIds = new Set(allBlocks.map(b => b.taskId));

      return allTasks.filter(t => {
        if (scheduledTaskIds.has(t.id)) return false;
        if (t.status === 'complete') return false;
        if (projectId && t.projectId !== projectId) return false;
        return true;
      });
    },

    async getDayHours(crewId, date) {
      const blocks = await scheduleRepo.findByCrewAndDateRange(crewId, date, date);
      return {
        scheduled: blocks.reduce((sum, b) => sum + b.estimatedHours, 0),
        actual: blocks.reduce((sum, b) => sum + b.actualHours, 0),
      };
    },

    async getWeekHours(crewId, weekStart) {
      const { start, end } = getWeekDateRange(weekStart);
      const blocks = await scheduleRepo.findByCrewAndDateRange(crewId, start, end);
      return {
        scheduled: blocks.reduce((sum, b) => sum + b.estimatedHours, 0),
        actual: blocks.reduce((sum, b) => sum + b.actualHours, 0),
      };
    },

    async detectConflicts(crewId, date, excludeBlockId?) {
      const existingBlocks = await scheduleRepo.findByCrewAndDateRange(crewId, date, date);
      const conflicts: ScheduleConflict[] = [];
      const totalHours = existingBlocks
        .filter(b => b.id !== excludeBlockId)
        .reduce((sum, b) => sum + b.estimatedHours, 0);

      if (totalHours >= 10) {
        conflicts.push({
          existingBlock: existingBlocks[0],
          reason: `${crewId} already has ${totalHours}h scheduled on ${date}`,
        });
      }

      return conflicts;
    },

    async scheduleTask(params) {
      const task = await taskRepo.findById(params.taskId);
      if (!task) throw new Error(`Task not found: ${params.taskId}`);

      // Get SOP info from deployed task if available
      const deployed = await deployedTaskRepo.findByTaskId(params.taskId);

      const block = await scheduleRepo.create({
        taskId: params.taskId,
        projectId: task.projectId,
        crewMemberId: params.crewMemberId,
        date: params.date,
        startTime: params.startTime ?? null,
        endTime: params.endTime ?? null,
        estimatedHours: params.estimatedHours ?? 1,
        actualHours: 0,
        status: 'scheduled',
        trade: deployed?.sopCode?.split('-')[1] ?? '',
        workflowPhase: '',
        title: task.title,
        sopCode: deployed?.sopCode ?? null,
      });

      await activityService.create({
        event_type: 'task.scheduled',
        project_id: task.projectId,
        entity_type: 'task',
        entity_id: params.taskId,
        summary: `Scheduled "${task.title}" for ${params.crewMemberId} on ${params.date}`,
        event_data: { blockId: block.id },
      });

      return block;
    },

    async rescheduleBlock(blockId, newDate, newStartTime?, newEndTime?) {
      const updated = await scheduleRepo.update(blockId, {
        date: newDate,
        startTime: newStartTime ?? null,
        endTime: newEndTime ?? null,
      });

      if (updated) {
        await activityService.create({
          event_type: 'task.rescheduled',
          project_id: updated.projectId,
          entity_type: 'task',
          entity_id: updated.taskId,
          summary: `Rescheduled "${updated.title}" to ${newDate}`,
          event_data: { blockId, newDate },
        });
      }

      return updated;
    },

    async unscheduleBlock(blockId) {
      const block = await scheduleRepo.findById(blockId);
      if (!block) return false;

      await scheduleRepo.delete(blockId);

      await activityService.create({
        event_type: 'task.unscheduled',
        project_id: block.projectId,
        entity_type: 'task',
        entity_id: block.taskId,
        summary: `Unscheduled "${block.title}" from ${block.date}`,
        event_data: { blockId },
      });

      return true;
    },

    async updateBlockStatus(blockId, status) {
      return scheduleRepo.update(blockId, { status });
    },

    async updateActualHours(blockId, hours) {
      return scheduleRepo.update(blockId, { actualHours: hours });
    },

    async bulkSchedule(assignments) {
      const results: CrewScheduleBlock[] = [];
      for (const assignment of assignments) {
        const block = await this.scheduleTask(assignment);
        results.push(block);
      }
      return results;
    },
  };
}
