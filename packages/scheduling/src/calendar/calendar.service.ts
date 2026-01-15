/**
 * Calendar Service
 *
 * Business logic for scheduling, availability, and conflict detection.
 */

import type {
  Task,
  ApiResponse,
  TaskFilters,
  ScheduleEntry,
} from '@hooomz/shared-contracts';

import {
  createSuccessResponse,
  createErrorResponse,
} from '@hooomz/shared-contracts';

import type { ITaskRepository } from '../tasks/task.repository';

/**
 * Calendar Service Dependencies
 */
export interface CalendarServiceDependencies {
  taskRepository: ITaskRepository;
}

/**
 * Scheduling conflict
 */
export interface SchedulingConflict {
  conflictType: 'assignee-overlap' | 'resource-conflict' | 'time-overlap';
  conflictingTask: Task;
  reason: string;
}

/**
 * Availability slot
 */
export interface AvailabilitySlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  tasks: Task[];
}

/**
 * Suggested time slot
 */
export interface SuggestedSlot {
  startDate: Date;
  endDate: Date;
  confidence: number; // 0-100
  reason: string;
}

/**
 * Calendar Service
 */
export class CalendarService {
  constructor(private deps: CalendarServiceDependencies) {}

  /**
   * Get schedule for a date range
   */
  async getSchedule(
    startDate: string,
    endDate: string,
    params?: {
      projectId?: string;
      assignedTo?: string;
      status?: string[];
    }
  ): Promise<ApiResponse<ScheduleEntry[]>> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        return createErrorResponse('INVALID_RANGE', 'Start date must be before end date');
      }

      const filters: TaskFilters = {
        ...params,
      };

      const tasks = await this.deps.taskRepository.findByDateRange(start, end, filters);

      // Convert to schedule entries
      const entries: ScheduleEntry[] = await Promise.all(
        tasks.map(async (task) => {
          const now = new Date();
          const dueDate = task.dueDate ? new Date(task.dueDate) : null;
          const isOverdue = dueDate ? dueDate < now && task.status !== 'completed' : false;

          let daysUntilDue: number | null = null;
          if (dueDate) {
            const diff = dueDate.getTime() - now.getTime();
            daysUntilDue = Math.ceil(diff / (1000 * 60 * 60 * 24));
          }

          // Fetch project info (would normally come from project repository)
          const project = {
            id: task.projectId,
            name: `Project ${task.projectId}`,
            status: 'active',
          };

          return {
            task,
            project: project as any, // Simplified for now
            isOverdue,
            daysUntilDue,
          };
        })
      );

      // Sort by due date
      entries.sort((a, b) => {
        const aDate = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Infinity;
        const bDate = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Infinity;
        return aDate - bDate;
      });

      return createSuccessResponse(entries);
    } catch (error) {
      return createErrorResponse(
        'SCHEDULE_ERROR',
        error instanceof Error ? error.message : 'Failed to get schedule'
      );
    }
  }

  /**
   * Get availability for a specific date
   */
  async getAvailability(
    date: string,
    assigneeId?: string
  ): Promise<ApiResponse<AvailabilitySlot[]>> {
    try {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const filters: TaskFilters = assigneeId ? { assignedTo: assigneeId } : {};

      const tasks = await this.deps.taskRepository.findByDateRange(
        startOfDay,
        endOfDay,
        filters
      );

      // Create hourly slots (8 AM to 6 PM = 10 hours)
      const slots: AvailabilitySlot[] = [];
      const workdayStart = 8; // 8 AM
      const workdayEnd = 18; // 6 PM

      for (let hour = workdayStart; hour < workdayEnd; hour++) {
        const slotStart = new Date(startOfDay);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(startOfDay);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Find tasks that overlap with this slot
        const overlappingTasks = tasks.filter((task) => {
          if (!task.startDate || !task.dueDate) return false;

          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.dueDate);

          return (
            (taskStart <= slotEnd && taskEnd >= slotStart) ||
            (taskStart >= slotStart && taskStart < slotEnd)
          );
        });

        slots.push({
          start: slotStart,
          end: slotEnd,
          isAvailable: overlappingTasks.length === 0,
          tasks: overlappingTasks,
        });
      }

      return createSuccessResponse(slots);
    } catch (error) {
      return createErrorResponse(
        'AVAILABILITY_ERROR',
        error instanceof Error ? error.message : 'Failed to get availability'
      );
    }
  }

  /**
   * Detect scheduling conflicts for a new task
   */
  async detectConflicts(newTask: {
    startDate?: string;
    dueDate?: string;
    assignedTo?: string;
    projectId: string;
  }): Promise<ApiResponse<SchedulingConflict[]>> {
    try {
      const conflicts: SchedulingConflict[] = [];

      if (!newTask.startDate || !newTask.dueDate) {
        return createSuccessResponse(conflicts);
      }

      const start = new Date(newTask.startDate);
      const end = new Date(newTask.dueDate);

      // Get all tasks in the same time range
      const filters: TaskFilters = {};
      if (newTask.assignedTo) {
        filters.assignedTo = newTask.assignedTo;
      }

      const existingTasks = await this.deps.taskRepository.findByDateRange(start, end, filters);

      for (const task of existingTasks) {
        if (!task.startDate || !task.dueDate) continue;

        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.dueDate);

        // Check for time overlap
        const hasTimeOverlap =
          (start <= taskEnd && end >= taskStart) ||
          (start >= taskStart && start < taskEnd);

        if (hasTimeOverlap) {
          // Assignee overlap
          if (newTask.assignedTo && task.assignedTo === newTask.assignedTo) {
            conflicts.push({
              conflictType: 'assignee-overlap',
              conflictingTask: task,
              reason: `${task.assignedTo} is already assigned to "${task.title}" during this time`,
            });
          }

          // Same project overlap (potential resource conflict)
          if (newTask.projectId === task.projectId) {
            conflicts.push({
              conflictType: 'resource-conflict',
              conflictingTask: task,
              reason: `Task "${task.title}" on the same project overlaps this time period`,
            });
          }

          // General time overlap
          if (!newTask.assignedTo || task.assignedTo !== newTask.assignedTo) {
            conflicts.push({
              conflictType: 'time-overlap',
              conflictingTask: task,
              reason: `Task "${task.title}" overlaps this time period`,
            });
          }
        }
      }

      return createSuccessResponse(conflicts);
    } catch (error) {
      return createErrorResponse(
        'CONFLICT_ERROR',
        error instanceof Error ? error.message : 'Failed to detect conflicts'
      );
    }
  }

  /**
   * Suggest next available time slot
   */
  async suggestNextAvailableSlot(
    duration: number, // In hours
    assigneeId?: string,
    startAfter?: string
  ): Promise<ApiResponse<SuggestedSlot[]>> {
    try {
      const startDate = startAfter ? new Date(startAfter) : new Date();

      // Search for available slots over the next 30 days
      const suggestions: SuggestedSlot[] = [];
      const daysToSearch = 30;

      for (let dayOffset = 0; dayOffset < daysToSearch; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayOffset);

        const dateString = currentDate.toISOString().split('T')[0];
        const availability = await this.getAvailability(dateString, assigneeId);

        if (!availability.success || !availability.data) continue;

        const slots = availability.data;

        // Find consecutive available slots that match the duration
        const hoursNeeded = Math.ceil(duration);
        let consecutiveSlots = 0;
        let slotStart: Date | null = null;

        for (const slot of slots) {
          if (slot.isAvailable) {
            if (consecutiveSlots === 0) {
              slotStart = slot.start;
            }
            consecutiveSlots++;

            if (consecutiveSlots >= hoursNeeded) {
              // Found a suitable slot
              const slotEnd = new Date(slotStart!.getTime() + duration * 60 * 60 * 1000);

              // Calculate confidence based on how soon the slot is
              const daysOut = dayOffset;
              let confidence = 100;

              if (daysOut > 0) confidence -= daysOut * 2; // Reduce confidence for future dates
              if (daysOut > 7) confidence -= 10; // Further reduction after a week
              confidence = Math.max(20, confidence); // Minimum 20% confidence

              const reason = assigneeId
                ? `${assigneeId} has ${hoursNeeded} consecutive hour(s) available starting ${slotStart!.toLocaleString()}`
                : `${hoursNeeded} consecutive hour(s) available starting ${slotStart!.toLocaleString()}`;

              suggestions.push({
                startDate: slotStart!,
                endDate: slotEnd,
                confidence,
                reason,
              });

              break; // Found one for this day, move to next day
            }
          } else {
            // Slot not available, reset counter
            consecutiveSlots = 0;
            slotStart = null;
          }
        }

        // Stop after finding 5 suggestions
        if (suggestions.length >= 5) {
          break;
        }
      }

      if (suggestions.length === 0) {
        return createErrorResponse(
          'NO_SLOTS_AVAILABLE',
          `No available slots found for ${duration} hour(s) in the next ${daysToSearch} days`
        );
      }

      // Sort by confidence (highest first)
      suggestions.sort((a, b) => b.confidence - a.confidence);

      return createSuccessResponse(suggestions);
    } catch (error) {
      return createErrorResponse(
        'SUGGESTION_ERROR',
        error instanceof Error ? error.message : 'Failed to suggest slots'
      );
    }
  }

  /**
   * Get tasks scheduled for today
   */
  async getToday(assigneeId?: string): Promise<ApiResponse<Task[]>> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    try {
      const filters: TaskFilters = assigneeId ? { assignedTo: assigneeId } : {};
      const tasks = await this.deps.taskRepository.findByDateRange(startOfDay, endOfDay, filters);

      return createSuccessResponse(tasks);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to get today\'s tasks'
      );
    }
  }

  /**
   * Get tasks scheduled for this week
   */
  async getThisWeek(assigneeId?: string): Promise<ApiResponse<Task[]>> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    try {
      const filters: TaskFilters = assigneeId ? { assignedTo: assigneeId } : {};
      const tasks = await this.deps.taskRepository.findByDateRange(startOfWeek, endOfWeek, filters);

      return createSuccessResponse(tasks);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to get this week\'s tasks'
      );
    }
  }

  /**
   * Get upcoming tasks (next 7 days)
   */
  async getUpcomingTasks(
    days: number = 7,
    assigneeId?: string
  ): Promise<ApiResponse<Task[]>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);
    endDate.setHours(23, 59, 59, 999);

    try {
      const filters: TaskFilters = assigneeId ? { assignedTo: assigneeId } : {};
      const tasks = await this.deps.taskRepository.findByDateRange(today, endDate, filters);

      // Sort by due date
      tasks.sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      });

      return createSuccessResponse(tasks);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to get upcoming tasks'
      );
    }
  }
}
