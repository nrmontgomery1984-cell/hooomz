/**
 * Comprehensive test suite for TaskService
 * Tests all core functionality including CRUD, dependencies, critical path
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { CreateTask, UpdateTask } from '@hooomz/shared-contracts';
import { TaskService } from './task.service';
import { InMemoryTaskRepository } from './task.repository';

describe('TaskService', () => {
  let service: TaskService;
  let repository: InMemoryTaskRepository;

  beforeEach(() => {
    repository = new InMemoryTaskRepository();
    service = new TaskService({ taskRepository: repository });
  });

  describe('CRUD Operations', () => {
    it('should create a task', async () => {
      const taskData: CreateTask = {
        projectId: 'proj_123',
        title: 'Demo cabinets',
        description: 'Remove and dispose of old cabinets',
        status: 'not-started',
        priority: 'high',
        assignedTo: 'john@example.com',
        estimatedHours: 8,
      };

      const result = await service.create(taskData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Demo cabinets');
      expect(result.data?.projectId).toBe('proj_123');
      expect(result.data?.status).toBe('not-started');
    });

    it('should get task by id', async () => {
      const created = await service.create({
        projectId: 'proj_123',
        title: 'Test Task',
        status: 'not-started',
        priority: 'medium',
      });

      const result = await service.getById(created.data!.id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(created.data?.id);
      expect(result.data?.title).toBe('Test Task');
    });

    it('should update a task', async () => {
      const created = await service.create({
        projectId: 'proj_123',
        title: 'Test Task',
        status: 'not-started',
        priority: 'medium',
      });

      const updates: UpdateTask = {
        title: 'Updated Task',
        priority: 'high',
      };

      const result = await service.update(created.data!.id, updates);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Task');
      expect(result.data?.priority).toBe('high');
    });

    it('should delete a task', async () => {
      const created = await service.create({
        projectId: 'proj_123',
        title: 'Test Task',
        status: 'not-started',
        priority: 'medium',
      });

      const deleteResult = await service.delete(created.data!.id);
      expect(deleteResult.success).toBe(true);

      const getResult = await service.getById(created.data!.id);
      expect(getResult.success).toBe(false);
      expect(getResult.error?.code).toBe('NOT_FOUND');
    });

    it('should list tasks with filters', async () => {
      await service.create({
        projectId: 'proj_123',
        title: 'Task 1',
        status: 'not-started',
        priority: 'high',
      });

      await service.create({
        projectId: 'proj_123',
        title: 'Task 2',
        status: 'in-progress',
        priority: 'low',
      });

      await service.create({
        projectId: 'proj_456',
        title: 'Task 3',
        status: 'not-started',
        priority: 'medium',
      });

      const result = await service.list({
        filters: { projectId: 'proj_123' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
    });
  });

  describe('Status Transitions', () => {
    it('should allow valid status transitions', async () => {
      const task = await service.create({
        projectId: 'proj_123',
        title: 'Test Task',
        status: 'not-started',
        priority: 'medium',
      });

      // not-started -> in-progress (valid)
      const result = await service.updateTaskStatus(
        task.data!.id,
        'in-progress'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('in-progress');
    });

    it('should reject invalid status transitions', async () => {
      const task = await service.create({
        projectId: 'proj_123',
        title: 'Test Task',
        status: 'not-started',
        priority: 'medium',
      });

      // not-started -> completed (invalid, must go through in-progress)
      const result = await service.updateTaskStatus(task.data!.id, 'completed');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TRANSITION');
      expect(result.error?.message).toContain('Invalid status transition');
    });

    it('should allow reopening completed tasks', async () => {
      const task = await service.create({
        projectId: 'proj_123',
        title: 'Test Task',
        status: 'not-started',
        priority: 'medium',
      });

      await service.updateTaskStatus(task.data!.id, 'in-progress');
      await service.updateTaskStatus(task.data!.id, 'completed');

      // completed -> in-progress (reopen)
      const result = await service.updateTaskStatus(
        task.data!.id,
        'in-progress'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('in-progress');
    });

    it('should block task when needed', async () => {
      const task = await service.create({
        projectId: 'proj_123',
        title: 'Test Task',
        status: 'in-progress',
        priority: 'medium',
      });

      const result = await service.updateTaskStatus(task.data!.id, 'blocked');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('blocked');
    });
  });

  describe('Dependency Management', () => {
    it('should add dependency between tasks', async () => {
      const task1 = await service.create({
        projectId: 'proj_123',
        title: 'Task 1',
        status: 'not-started',
        priority: 'medium',
      });

      const task2 = await service.create({
        projectId: 'proj_123',
        title: 'Task 2',
        status: 'not-started',
        priority: 'medium',
      });

      const result = await service.addDependency(
        task2.data!.id,
        task1.data!.id
      );

      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('added successfully');
    });

    it('should detect cyclic dependencies', async () => {
      const task1 = await service.create({
        projectId: 'proj_123',
        title: 'Task 1',
        status: 'not-started',
        priority: 'medium',
      });

      const task2 = await service.create({
        projectId: 'proj_123',
        title: 'Task 2',
        status: 'not-started',
        priority: 'medium',
      });

      const task3 = await service.create({
        projectId: 'proj_123',
        title: 'Task 3',
        status: 'not-started',
        priority: 'medium',
      });

      // Create chain: task3 -> task2 -> task1
      await service.addDependency(task2.data!.id, task1.data!.id);
      await service.addDependency(task3.data!.id, task2.data!.id);

      // Try to create cycle: task1 -> task3
      const result = await service.addDependency(task1.data!.id, task3.data!.id);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CYCLIC_DEPENDENCY');
      expect(result.error?.message).toContain('circular dependency');
    });

    it('should get dependency chain', async () => {
      const task1 = await service.create({
        projectId: 'proj_123',
        title: 'Task 1',
        status: 'not-started',
        priority: 'medium',
      });

      const task2 = await service.create({
        projectId: 'proj_123',
        title: 'Task 2',
        status: 'not-started',
        priority: 'medium',
      });

      const task3 = await service.create({
        projectId: 'proj_123',
        title: 'Task 3',
        status: 'not-started',
        priority: 'medium',
      });

      // Create chain: task3 -> task2 -> task1
      await service.addDependency(task2.data!.id, task1.data!.id);
      await service.addDependency(task3.data!.id, task2.data!.id);

      const result = await service.getDependencyChain(task3.data!.id);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2); // Should have task2 and task1
      expect(result.data?.map(t => t.title)).toEqual(['Task 2', 'Task 1']);
    });

    it('should check if task can start', async () => {
      const task1 = await service.create({
        projectId: 'proj_123',
        title: 'Task 1',
        status: 'not-started',
        priority: 'medium',
      });

      const task2 = await service.create({
        projectId: 'proj_123',
        title: 'Task 2',
        status: 'not-started',
        priority: 'medium',
      });

      await service.addDependency(task2.data!.id, task1.data!.id);

      // Task 2 can't start because Task 1 is not completed
      const canStartBefore = await service.canStartTask(task2.data!.id);
      expect(canStartBefore.data).toBe(false);

      // Complete Task 1
      await service.updateTaskStatus(task1.data!.id, 'in-progress');
      await service.updateTaskStatus(task1.data!.id, 'completed');

      // Now Task 2 can start
      const canStartAfter = await service.canStartTask(task2.data!.id);
      expect(canStartAfter.data).toBe(true);
    });

    it('should remove dependency', async () => {
      const task1 = await service.create({
        projectId: 'proj_123',
        title: 'Task 1',
        status: 'not-started',
        priority: 'medium',
      });

      const task2 = await service.create({
        projectId: 'proj_123',
        title: 'Task 2',
        status: 'not-started',
        priority: 'medium',
      });

      await service.addDependency(task2.data!.id, task1.data!.id);

      const result = await service.removeDependency(
        task2.data!.id,
        task1.data!.id
      );

      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('removed successfully');

      // Task 2 should now be able to start
      const canStart = await service.canStartTask(task2.data!.id);
      expect(canStart.data).toBe(true);
    });
  });

  describe('Critical Path Analysis', () => {
    it('should calculate critical path for project', async () => {
      // Create a project with tasks and dependencies
      const task1 = await service.create({
        projectId: 'proj_123',
        title: 'Foundation',
        status: 'not-started',
        priority: 'high',
        startDate: '2024-02-01T08:00:00Z',
        dueDate: '2024-02-05T17:00:00Z',
        estimatedHours: 32,
      });

      const task2 = await service.create({
        projectId: 'proj_123',
        title: 'Framing',
        status: 'not-started',
        priority: 'high',
        startDate: '2024-02-06T08:00:00Z',
        dueDate: '2024-02-12T17:00:00Z',
        estimatedHours: 48,
      });

      const task3 = await service.create({
        projectId: 'proj_123',
        title: 'Electrical',
        status: 'not-started',
        priority: 'medium',
        startDate: '2024-02-13T08:00:00Z',
        dueDate: '2024-02-15T17:00:00Z',
        estimatedHours: 16,
      });

      // Set up dependencies: task2 depends on task1, task3 depends on task2
      await service.addDependency(task2.data!.id, task1.data!.id);
      await service.addDependency(task3.data!.id, task2.data!.id);

      const result = await service.getCriticalPath('proj_123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBe(3);

      // Check that all tasks are on critical path (linear dependency chain)
      const criticalTasks = result.data!.filter(t => t.isCritical);
      expect(criticalTasks.length).toBeGreaterThan(0);

      // Verify slack calculations
      result.data!.forEach(item => {
        expect(item.earliestStart).toBeDefined();
        expect(item.earliestFinish).toBeDefined();
        expect(item.latestStart).toBeDefined();
        expect(item.latestFinish).toBeDefined();
        expect(item.slack).toBeGreaterThanOrEqual(0);
      });
    });

    it('should identify non-critical tasks with slack', async () => {
      // Create parallel tasks where one has more time
      const task1 = await service.create({
        projectId: 'proj_123',
        title: 'Critical Task',
        status: 'not-started',
        priority: 'high',
        startDate: '2024-02-01T08:00:00Z',
        dueDate: '2024-02-10T17:00:00Z',
        estimatedHours: 72,
      });

      const task2 = await service.create({
        projectId: 'proj_123',
        title: 'Non-Critical Task',
        status: 'not-started',
        priority: 'low',
        startDate: '2024-02-01T08:00:00Z',
        dueDate: '2024-02-03T17:00:00Z',
        estimatedHours: 16,
      });

      const result = await service.getCriticalPath('proj_123');

      expect(result.success).toBe(true);

      // Task 1 should be critical (longer duration)
      const task1Critical = result.data!.find(t => t.task.id === task1.data!.id);
      expect(task1Critical?.isCritical).toBe(true);
      expect(task1Critical?.slack).toBe(0);

      // Task 2 should have slack
      const task2Critical = result.data!.find(t => t.task.id === task2.data!.id);
      expect(task2Critical?.slack).toBeGreaterThan(0);
    });
  });

  describe('Bulk Operations', () => {
    it('should update status for multiple tasks', async () => {
      const task1 = await service.create({
        projectId: 'proj_123',
        title: 'Task 1',
        status: 'not-started',
        priority: 'medium',
      });

      const task2 = await service.create({
        projectId: 'proj_123',
        title: 'Task 2',
        status: 'not-started',
        priority: 'medium',
      });

      const result = await service.bulkUpdateStatus(
        [task1.data!.id, task2.data!.id],
        'in-progress'
      );

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(result.data?.every(t => t.status === 'in-progress')).toBe(true);
    });

    it('should reorder tasks in project', async () => {
      const task1 = await service.create({
        projectId: 'proj_123',
        title: 'Task 1',
        status: 'not-started',
        priority: 'medium',
      });

      const task2 = await service.create({
        projectId: 'proj_123',
        title: 'Task 2',
        status: 'not-started',
        priority: 'medium',
      });

      const task3 = await service.create({
        projectId: 'proj_123',
        title: 'Task 3',
        status: 'not-started',
        priority: 'medium',
      });

      // Reorder: task3, task1, task2
      const result = await service.reorderTasks('proj_123', [
        task3.data!.id,
        task1.data!.id,
        task2.data!.id,
      ]);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(3);

      // Verify order
      const task1Updated = result.data!.find(t => t.id === task1.data!.id);
      const task2Updated = result.data!.find(t => t.id === task2.data!.id);
      const task3Updated = result.data!.find(t => t.id === task3.data!.id);

      expect(task3Updated?.order).toBe(0);
      expect(task1Updated?.order).toBe(1);
      expect(task2Updated?.order).toBe(2);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      // Set up test data
      await service.create({
        projectId: 'proj_123',
        title: 'Task 1',
        status: 'not-started',
        priority: 'high',
        assignedTo: 'john@example.com',
      });

      await service.create({
        projectId: 'proj_123',
        title: 'Task 2',
        status: 'in-progress',
        priority: 'medium',
        assignedTo: 'jane@example.com',
      });

      await service.create({
        projectId: 'proj_456',
        title: 'Task 3',
        status: 'completed',
        priority: 'low',
        assignedTo: 'john@example.com',
      });

      await service.create({
        projectId: 'proj_123',
        title: 'Overdue Task',
        status: 'in-progress',
        priority: 'high',
        assignedTo: 'john@example.com',
        dueDate: '2024-01-01T17:00:00Z', // Past date
      });
    });

    it('should get tasks by project', async () => {
      const result = await service.getTasksByProject('proj_123');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(3);
      expect(result.data?.every(t => t.projectId === 'proj_123')).toBe(true);
    });

    it('should get tasks by assignee', async () => {
      const result = await service.getTasksByAssignee('john@example.com');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(3);
      expect(
        result.data?.every(t => t.assignedTo === 'john@example.com')
      ).toBe(true);
    });

    it('should get overdue tasks', async () => {
      const result = await service.getOverdueTasks();

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);

      result.data?.forEach(task => {
        expect(task.dueDate).toBeDefined();
        expect(new Date(task.dueDate!) < new Date()).toBe(true);
      });
    });

    it('should get task with full dependency info', async () => {
      const task1 = await service.create({
        projectId: 'proj_789',
        title: 'Dependency Test 1',
        status: 'not-started',
        priority: 'medium',
      });

      const task2 = await service.create({
        projectId: 'proj_789',
        title: 'Dependency Test 2',
        status: 'not-started',
        priority: 'medium',
      });

      await service.addDependency(task2.data!.id, task1.data!.id);

      const result = await service.getTaskWithDependencies(task2.data!.id);

      expect(result.success).toBe(true);
      expect(result.data?.dependencyTasks).toBeDefined();
      expect(result.data?.dependencyTasks.length).toBe(1);
      expect(result.data?.dependencyTasks[0].id).toBe(task1.data!.id);
    });
  });
});
