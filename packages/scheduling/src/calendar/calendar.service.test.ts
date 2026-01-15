/**
 * Comprehensive test suite for CalendarService
 * Tests scheduling, availability, conflict detection, and smart suggestions
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { CreateTask } from '@hooomz/shared-contracts';
import { CalendarService } from './calendar.service';
import { TaskService } from '../tasks/task.service';
import { InMemoryTaskRepository } from '../tasks/task.repository';

describe('CalendarService', () => {
  let calendarService: CalendarService;
  let taskService: TaskService;
  let repository: InMemoryTaskRepository;

  beforeEach(() => {
    repository = new InMemoryTaskRepository();
    taskService = new TaskService({ taskRepository: repository });
    calendarService = new CalendarService({
      taskRepository: repository,
    });
  });

  describe('Schedule Queries', () => {
    beforeEach(async () => {
      // Set up test data with various dates
      await taskService.create({
        projectId: 'proj_123',
        title: 'Today Task',
        status: 'in-progress',
        priority: 'high',
        assignedTo: 'john@example.com',
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 8,
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await taskService.create({
        projectId: 'proj_123',
        title: 'Tomorrow Task',
        status: 'not-started',
        priority: 'medium',
        assignedTo: 'john@example.com',
        startDate: tomorrow.toISOString(),
        dueDate: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 4,
      });

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await taskService.create({
        projectId: 'proj_123',
        title: 'Next Week Task',
        status: 'not-started',
        priority: 'low',
        assignedTo: 'jane@example.com',
        startDate: nextWeek.toISOString(),
        dueDate: new Date(nextWeek.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 8,
      });
    });

    it('should get today tasks', async () => {
      const result = await calendarService.getToday('john@example.com');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);

      result.data?.forEach(entry => {
        expect(entry.task).toBeDefined();
        expect(entry.project).toBeDefined();
        expect(entry.isOverdue).toBeDefined();
      });
    });

    it('should get this week tasks', async () => {
      const result = await calendarService.getThisWeek('john@example.com');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('should get upcoming tasks', async () => {
      const result = await calendarService.getUpcomingTasks(
        14,
        'john@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);

      // Verify all tasks are for john
      result.data?.forEach(task => {
        expect(task.assignedTo).toBe('john@example.com');
      });
    });

    it('should get schedule for date range', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const result = await calendarService.getSchedule(
        startDate.toISOString(),
        endDate.toISOString()
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      result.data?.forEach(entry => {
        const taskStart = new Date(entry.task.startDate!);
        expect(taskStart >= startDate).toBe(true);
        expect(taskStart <= endDate).toBe(true);
      });
    });

    it('should filter schedule by assignee', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const result = await calendarService.getSchedule(
        startDate.toISOString(),
        endDate.toISOString(),
        { assignedTo: 'john@example.com' }
      );

      expect(result.success).toBe(true);
      result.data?.forEach(entry => {
        expect(entry.task.assignedTo).toBe('john@example.com');
      });
    });
  });

  describe('Availability Tracking', () => {
    it('should return hourly availability slots', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await calendarService.getAvailability(
        today.toISOString(),
        'john@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(10); // 8 AM to 6 PM = 10 hours

      result.data?.forEach(slot => {
        expect(slot.start).toBeDefined();
        expect(slot.end).toBeDefined();
        expect(slot.isAvailable).toBeDefined();
        expect(slot.tasks).toBeDefined();
        expect(Array.isArray(slot.tasks)).toBe(true);
      });
    });

    it('should mark slots as unavailable when tasks scheduled', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0); // 10 AM

      const taskEnd = new Date(today);
      taskEnd.setHours(12, 0, 0, 0); // 12 PM

      await taskService.create({
        projectId: 'proj_123',
        title: 'Morning Meeting',
        status: 'in-progress',
        priority: 'high',
        assignedTo: 'john@example.com',
        startDate: today.toISOString(),
        dueDate: taskEnd.toISOString(),
        estimatedHours: 2,
      });

      const queryDate = new Date();
      queryDate.setHours(0, 0, 0, 0);

      const result = await calendarService.getAvailability(
        queryDate.toISOString(),
        'john@example.com'
      );

      expect(result.success).toBe(true);

      // Check that 10 AM and 11 AM slots are unavailable
      const slot10am = result.data?.find(s => {
        const hour = new Date(s.start).getHours();
        return hour === 10;
      });

      expect(slot10am).toBeDefined();
      expect(slot10am?.isAvailable).toBe(false);
      expect(slot10am?.tasks.length).toBeGreaterThan(0);
    });

    it('should return all slots available when no tasks', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const result = await calendarService.getAvailability(
        futureDate.toISOString(),
        'newuser@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.data?.every(slot => slot.isAvailable)).toBe(true);
    });
  });

  describe('Conflict Detection', () => {
    beforeEach(async () => {
      // Create existing task
      await taskService.create({
        projectId: 'proj_123',
        title: 'Existing Task',
        status: 'in-progress',
        priority: 'high',
        assignedTo: 'john@example.com',
        startDate: '2024-02-15T10:00:00Z',
        dueDate: '2024-02-15T14:00:00Z',
        estimatedHours: 4,
      });
    });

    it('should detect assignee overlap conflict', async () => {
      const result = await calendarService.detectConflicts({
        startDate: '2024-02-15T11:00:00Z',
        dueDate: '2024-02-15T15:00:00Z',
        assignedTo: 'john@example.com',
        projectId: 'proj_456',
      });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);

      const assigneeConflict = result.data?.find(
        c => c.conflictType === 'assignee-overlap'
      );
      expect(assigneeConflict).toBeDefined();
      expect(assigneeConflict?.reason).toContain('john@example.com');
    });

    it('should detect resource conflict on same project', async () => {
      const result = await calendarService.detectConflicts({
        startDate: '2024-02-15T09:00:00Z',
        dueDate: '2024-02-15T12:00:00Z',
        assignedTo: 'jane@example.com', // Different assignee
        projectId: 'proj_123', // Same project
      });

      expect(result.success).toBe(true);

      const resourceConflict = result.data?.find(
        c => c.conflictType === 'resource-conflict'
      );
      expect(resourceConflict).toBeDefined();
    });

    it('should not detect conflicts when no overlap', async () => {
      const result = await calendarService.detectConflicts({
        startDate: '2024-02-15T15:00:00Z', // After existing task
        dueDate: '2024-02-15T17:00:00Z',
        assignedTo: 'john@example.com',
        projectId: 'proj_123',
      });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(0);
    });

    it('should detect time overlap conflict', async () => {
      const result = await calendarService.detectConflicts({
        startDate: '2024-02-15T12:00:00Z',
        dueDate: '2024-02-15T16:00:00Z',
        assignedTo: 'john@example.com',
        projectId: 'proj_789', // Different project
      });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('should handle tasks without dates gracefully', async () => {
      const result = await calendarService.detectConflicts({
        assignedTo: 'john@example.com',
        projectId: 'proj_999',
      });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(0); // No conflicts if no dates
    });
  });

  describe('Smart Scheduling Suggestions', () => {
    beforeEach(async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      // Book 10 AM - 2 PM
      await taskService.create({
        projectId: 'proj_123',
        title: 'Morning Task',
        status: 'in-progress',
        priority: 'high',
        assignedTo: 'john@example.com',
        startDate: today.toISOString(),
        dueDate: new Date(today.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 4,
      });
    });

    it('should suggest available slots', async () => {
      const result = await calendarService.suggestNextAvailableSlot(
        2, // 2 hours
        'john@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
      expect(result.data!.length).toBeLessThanOrEqual(5); // Max 5 suggestions

      result.data?.forEach(slot => {
        expect(slot.startDate).toBeDefined();
        expect(slot.endDate).toBeDefined();
        expect(slot.confidence).toBeGreaterThanOrEqual(0);
        expect(slot.confidence).toBeLessThanOrEqual(100);
        expect(slot.reason).toBeDefined();
      });
    });

    it('should have higher confidence for sooner slots', async () => {
      const result = await calendarService.suggestNextAvailableSlot(
        1,
        'jane@example.com' // User with no tasks
      );

      expect(result.success).toBe(true);
      expect(result.data!.length).toBeGreaterThan(1);

      // First suggestion should have higher confidence than later ones
      const firstConfidence = result.data![0].confidence;
      const lastConfidence = result.data![result.data!.length - 1].confidence;

      expect(firstConfidence).toBeGreaterThanOrEqual(lastConfidence);
    });

    it('should suggest slots after specified date', async () => {
      const startAfter = new Date();
      startAfter.setDate(startAfter.getDate() + 7); // Start after 1 week

      const result = await calendarService.suggestNextAvailableSlot(
        4,
        'john@example.com',
        startAfter.toISOString()
      );

      expect(result.success).toBe(true);

      result.data?.forEach(slot => {
        expect(new Date(slot.startDate) >= startAfter).toBe(true);
      });
    });

    it('should find consecutive available hours', async () => {
      const result = await calendarService.suggestNextAvailableSlot(
        8, // Full day
        'newuser@example.com' // No existing tasks
      );

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);

      // Verify duration is correct
      result.data?.forEach(slot => {
        const duration =
          (new Date(slot.endDate).getTime() -
            new Date(slot.startDate).getTime()) /
          (1000 * 60 * 60);
        expect(duration).toBeCloseTo(8, 1);
      });
    });

    it('should handle duration longer than work day', async () => {
      const result = await calendarService.suggestNextAvailableSlot(
        12, // 12 hours (longer than 8 AM - 6 PM)
        'john@example.com'
      );

      expect(result.success).toBe(true);
      // Should still suggest slots, spanning multiple days if needed
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('should apply confidence scoring correctly', async () => {
      const result = await calendarService.suggestNextAvailableSlot(
        2,
        'john@example.com'
      );

      expect(result.success).toBe(true);

      result.data?.forEach((slot, index) => {
        // Today's slots should be 100% confidence
        const slotDate = new Date(slot.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (
          slotDate.toDateString() === today.toDateString() &&
          index === 0
        ) {
          expect(slot.confidence).toBe(100);
        }

        // All confidence should be at least 20%
        expect(slot.confidence).toBeGreaterThanOrEqual(20);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty schedule gracefully', async () => {
      const result = await calendarService.getToday('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(0);
    });

    it('should handle invalid date ranges', async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Start after end

      const result = await calendarService.getSchedule(
        startDate.toISOString(),
        endDate.toISOString()
      );

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(0);
    });

    it('should handle availability for past dates', async () => {
      const pastDate = new Date('2023-01-01');

      const result = await calendarService.getAvailability(
        pastDate.toISOString(),
        'john@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(10); // Still returns slots
    });

    it('should suggest slots when no assignee specified', async () => {
      const result = await calendarService.suggestNextAvailableSlot(4);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with TaskService', () => {
    it('should reflect task status changes in schedule', async () => {
      const task = await taskService.create({
        projectId: 'proj_123',
        title: 'Test Task',
        status: 'in-progress',
        priority: 'high',
        assignedTo: 'john@example.com',
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 4,
      });

      const todayBefore = await calendarService.getToday('john@example.com');
      expect(todayBefore.data?.length).toBeGreaterThan(0);

      // Complete the task
      await taskService.updateTaskStatus(task.data!.id, 'completed');

      const todayAfter = await calendarService.getToday('john@example.com');
      const completedTask = todayAfter.data?.find(
        e => e.task.id === task.data!.id
      );
      expect(completedTask?.task.status).toBe('completed');
    });

    it('should handle task deletion in availability', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      const task = await taskService.create({
        projectId: 'proj_123',
        title: 'Temp Task',
        status: 'in-progress',
        priority: 'high',
        assignedTo: 'john@example.com',
        startDate: today.toISOString(),
        dueDate: new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 2,
      });

      const queryDate = new Date();
      queryDate.setHours(0, 0, 0, 0);

      const availBefore = await calendarService.getAvailability(
        queryDate.toISOString(),
        'john@example.com'
      );
      const slot10Before = availBefore.data?.find(
        s => new Date(s.start).getHours() === 10
      );
      expect(slot10Before?.isAvailable).toBe(false);

      // Delete task
      await taskService.delete(task.data!.id);

      const availAfter = await calendarService.getAvailability(
        queryDate.toISOString(),
        'john@example.com'
      );
      const slot10After = availAfter.data?.find(
        s => new Date(s.start).getHours() === 10
      );
      expect(slot10After?.isAvailable).toBe(true);
    });
  });
});
