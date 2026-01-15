/**
 * Simple test runner for scheduling module
 * Run with: npx tsx run-tests.ts
 */

import type { CreateTask } from '@hooomz/shared-contracts';
import { TaskService } from './tasks/task.service';
import { CalendarService } from './calendar/calendar.service';
import { InMemoryTaskRepository } from './tasks/task.repository';

// Test counter
let passed = 0;
let failed = 0;

function test(name: string, fn: () => Promise<void>) {
  return (async () => {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(`  ${error}`);
      failed++;
    }
  })();
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value: boolean, message?: string) {
  if (!value) {
    throw new Error(message || `Expected true, got ${value}`);
  }
}

async function runTests() {
  console.log('\n🧪 Running Scheduling Module Tests\n');

  const repository = new InMemoryTaskRepository();
  const taskService = new TaskService({ taskRepository: repository });
  const calendarService = new CalendarService({ taskRepository: repository });

  // Task CRUD Operations
  console.log('Task CRUD Operations:');

  await test('Create task', async () => {
    const taskData: CreateTask = {
      projectId: 'proj_test',
      title: 'Test Task',
      description: 'Test description',
      status: 'not-started',
      priority: 'medium',
    };

    const result = await taskService.create(taskData);
    assertTrue(result.success, 'Should create successfully');
    assertEqual(result.data?.title, 'Test Task');
    assertEqual(result.data?.status, 'not-started');
  });

  await test('Get task by id', async () => {
    const created = await taskService.create({
      projectId: 'proj_test',
      title: 'Get Test',
      status: 'not-started',
      priority: 'low',
    });

    const result = await taskService.getById(created.data!.id);
    assertTrue(result.success);
    assertEqual(result.data?.id, created.data?.id);
  });

  await test('Update task', async () => {
    const created = await taskService.create({
      projectId: 'proj_test',
      title: 'Update Test',
      status: 'not-started',
      priority: 'low',
    });

    const result = await taskService.update(created.data!.id, {
      title: 'Updated Title',
      priority: 'high',
    });

    assertTrue(result.success);
    assertEqual(result.data?.title, 'Updated Title');
    assertEqual(result.data?.priority, 'high');
  });

  await test('Delete task', async () => {
    const created = await taskService.create({
      projectId: 'proj_test',
      title: 'Delete Test',
      status: 'not-started',
      priority: 'low',
    });

    const deleteResult = await taskService.delete(created.data!.id);
    assertTrue(deleteResult.success);

    const getResult = await taskService.getById(created.data!.id);
    assertTrue(!getResult.success);
  });

  // Status Transitions
  console.log('\nStatus Transitions:');

  await test('Allow valid status transitions', async () => {
    const task = await taskService.create({
      projectId: 'proj_test',
      title: 'Status Test',
      status: 'not-started',
      priority: 'medium',
    });

    const result = await taskService.updateTaskStatus(
      task.data!.id,
      'in-progress'
    );
    assertTrue(result.success);
    assertEqual(result.data?.status, 'in-progress');
  });

  await test('Reject invalid status transitions', async () => {
    const task = await taskService.create({
      projectId: 'proj_test',
      title: 'Invalid Status Test',
      status: 'not-started',
      priority: 'medium',
    });

    const result = await taskService.updateTaskStatus(
      task.data!.id,
      'completed'
    );
    assertTrue(!result.success, 'Should reject invalid transition');
    assertEqual(result.error?.code, 'INVALID_TRANSITION');
  });

  // Dependency Management
  console.log('\nDependency Management:');

  await test('Add dependency', async () => {
    const task1 = await taskService.create({
      projectId: 'proj_test',
      title: 'Task 1',
      status: 'not-started',
      priority: 'medium',
    });

    const task2 = await taskService.create({
      projectId: 'proj_test',
      title: 'Task 2',
      status: 'not-started',
      priority: 'medium',
    });

    const result = await taskService.addDependency(
      task2.data!.id,
      task1.data!.id
    );
    assertTrue(result.success);
  });

  await test('Detect cyclic dependencies', async () => {
    const task1 = await taskService.create({
      projectId: 'proj_cycle',
      title: 'Cycle Task 1',
      status: 'not-started',
      priority: 'medium',
    });

    const task2 = await taskService.create({
      projectId: 'proj_cycle',
      title: 'Cycle Task 2',
      status: 'not-started',
      priority: 'medium',
    });

    await taskService.addDependency(task2.data!.id, task1.data!.id);

    // Try to create cycle
    const result = await taskService.addDependency(
      task1.data!.id,
      task2.data!.id
    );
    assertTrue(!result.success, 'Should detect cycle');
    assertEqual(result.error?.code, 'CYCLIC_DEPENDENCY');
  });

  await test('Check if task can start', async () => {
    const task1 = await taskService.create({
      projectId: 'proj_dep',
      title: 'Dependency 1',
      status: 'not-started',
      priority: 'medium',
    });

    const task2 = await taskService.create({
      projectId: 'proj_dep',
      title: 'Dependency 2',
      status: 'not-started',
      priority: 'medium',
    });

    await taskService.addDependency(task2.data!.id, task1.data!.id);

    const canStartBefore = await taskService.canStartTask(task2.data!.id);
    assertEqual(canStartBefore.data, false, 'Should not be able to start');

    // Complete task1
    await taskService.updateTaskStatus(task1.data!.id, 'in-progress');
    await taskService.updateTaskStatus(task1.data!.id, 'completed');

    const canStartAfter = await taskService.canStartTask(task2.data!.id);
    assertEqual(canStartAfter.data, true, 'Should be able to start now');
  });

  await test('Get dependency chain', async () => {
    const task1 = await taskService.create({
      projectId: 'proj_chain',
      title: 'Chain 1',
      status: 'not-started',
      priority: 'medium',
    });

    const task2 = await taskService.create({
      projectId: 'proj_chain',
      title: 'Chain 2',
      status: 'not-started',
      priority: 'medium',
    });

    const task3 = await taskService.create({
      projectId: 'proj_chain',
      title: 'Chain 3',
      status: 'not-started',
      priority: 'medium',
    });

    await taskService.addDependency(task2.data!.id, task1.data!.id);
    await taskService.addDependency(task3.data!.id, task2.data!.id);

    const result = await taskService.getDependencyChain(task3.data!.id);
    assertTrue(result.success);
    assertEqual(result.data?.length, 2, 'Should have 2 dependencies');
  });

  // Critical Path
  console.log('\nCritical Path Analysis:');

  await test('Calculate critical path', async () => {
    const proj = 'proj_critical';

    const task1 = await taskService.create({
      projectId: proj,
      title: 'Foundation',
      status: 'not-started',
      priority: 'high',
      startDate: '2024-02-01T08:00:00Z',
      dueDate: '2024-02-05T17:00:00Z',
      estimatedHours: 32,
    });

    const task2 = await taskService.create({
      projectId: proj,
      title: 'Framing',
      status: 'not-started',
      priority: 'high',
      startDate: '2024-02-06T08:00:00Z',
      dueDate: '2024-02-10T17:00:00Z',
      estimatedHours: 32,
    });

    await taskService.addDependency(task2.data!.id, task1.data!.id);

    const result = await taskService.getCriticalPath(proj);
    assertTrue(result.success);
    assertTrue(result.data!.length >= 2, 'Should have at least 2 tasks');

    // Verify structure
    result.data!.forEach(item => {
      assertTrue(item.earliestStart !== undefined);
      assertTrue(item.earliestFinish !== undefined);
      assertTrue(item.latestStart !== undefined);
      assertTrue(item.latestFinish !== undefined);
      assertTrue(item.slack !== undefined);
      assertTrue(item.slack >= 0);
    });
  });

  // Calendar Operations
  console.log('\nCalendar Operations:');

  await test('Get today tasks', async () => {
    await taskService.create({
      projectId: 'proj_calendar',
      title: 'Today Task',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'test@example.com',
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    });

    const result = await calendarService.getToday('test@example.com');
    assertTrue(result.success);
    assertTrue(result.data!.length > 0);
  });

  await test('Get availability', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await calendarService.getAvailability(
      today.toISOString(),
      'test@example.com'
    );

    assertTrue(result.success);
    assertEqual(result.data?.length, 10, 'Should have 10 hourly slots');

    result.data?.forEach(slot => {
      assertTrue(slot.start !== undefined);
      assertTrue(slot.end !== undefined);
      assertTrue(slot.isAvailable !== undefined);
      assertTrue(Array.isArray(slot.tasks));
    });
  });

  await test('Detect conflicts', async () => {
    await taskService.create({
      projectId: 'proj_conflict',
      title: 'Existing Task',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'conflict@example.com',
      startDate: '2024-03-15T10:00:00Z',
      dueDate: '2024-03-15T14:00:00Z',
    });

    const result = await calendarService.detectConflicts({
      startDate: '2024-03-15T11:00:00Z',
      dueDate: '2024-03-15T15:00:00Z',
      assignedTo: 'conflict@example.com',
      projectId: 'proj_other',
    });

    assertTrue(result.success);
    assertTrue(result.data!.length > 0, 'Should detect conflict');

    const conflict = result.data![0];
    assertTrue(conflict.conflictType !== undefined);
    assertTrue(conflict.conflictingTask !== undefined);
    assertTrue(conflict.reason !== undefined);
  });

  await test('Suggest available slots', async () => {
    const result = await calendarService.suggestNextAvailableSlot(
      4,
      'new@example.com'
    );

    assertTrue(result.success);
    assertTrue(result.data!.length > 0, 'Should suggest at least one slot');
    assertTrue(
      result.data!.length <= 5,
      'Should suggest max 5 slots'
    );

    result.data?.forEach(slot => {
      assertTrue(slot.startDate !== undefined);
      assertTrue(slot.endDate !== undefined);
      assertTrue(slot.confidence >= 0 && slot.confidence <= 100);
      assertTrue(slot.reason !== undefined);
    });
  });

  // Bulk Operations
  console.log('\nBulk Operations:');

  await test('Bulk update status', async () => {
    const task1 = await taskService.create({
      projectId: 'proj_bulk',
      title: 'Bulk 1',
      status: 'not-started',
      priority: 'medium',
    });

    const task2 = await taskService.create({
      projectId: 'proj_bulk',
      title: 'Bulk 2',
      status: 'not-started',
      priority: 'medium',
    });

    const result = await taskService.bulkUpdateStatus(
      [task1.data!.id, task2.data!.id],
      'in-progress'
    );

    assertTrue(result.success);
    assertEqual(result.data?.length, 2);
    assertTrue(result.data?.every(t => t.status === 'in-progress'));
  });

  await test('Reorder tasks', async () => {
    const task1 = await taskService.create({
      projectId: 'proj_reorder',
      title: 'Order 1',
      status: 'not-started',
      priority: 'medium',
    });

    const task2 = await taskService.create({
      projectId: 'proj_reorder',
      title: 'Order 2',
      status: 'not-started',
      priority: 'medium',
    });

    const task3 = await taskService.create({
      projectId: 'proj_reorder',
      title: 'Order 3',
      status: 'not-started',
      priority: 'medium',
    });

    const result = await taskService.reorderTasks('proj_reorder', [
      task3.data!.id,
      task1.data!.id,
      task2.data!.id,
    ]);

    assertTrue(result.success);
    assertEqual(result.data?.length, 3);

    const task1Updated = result.data!.find(t => t.id === task1.data!.id);
    const task3Updated = result.data!.find(t => t.id === task3.data!.id);

    assertEqual(task3Updated?.order, 0);
    assertEqual(task1Updated?.order, 1);
  });

  // Integration Test
  console.log('\nIntegration Test:');

  await test('Complete workflow: create, depend, schedule', async () => {
    const proj = 'proj_integration';

    // Create tasks
    const demo = await taskService.create({
      projectId: proj,
      title: 'Demo cabinets',
      status: 'not-started',
      priority: 'high',
      assignedTo: 'john@example.com',
      startDate: '2024-04-01T08:00:00Z',
      dueDate: '2024-04-01T17:00:00Z',
      estimatedHours: 8,
    });

    const install = await taskService.create({
      projectId: proj,
      title: 'Install cabinets',
      status: 'not-started',
      priority: 'high',
      assignedTo: 'john@example.com',
      startDate: '2024-04-02T08:00:00Z',
      dueDate: '2024-04-03T17:00:00Z',
      estimatedHours: 16,
    });

    // Add dependency
    const depResult = await taskService.addDependency(
      install.data!.id,
      demo.data!.id
    );
    assertTrue(depResult.success);

    // Check can't start install yet
    const canStartBefore = await taskService.canStartTask(install.data!.id);
    assertEqual(canStartBefore.data, false);

    // Complete demo
    await taskService.updateTaskStatus(demo.data!.id, 'in-progress');
    await taskService.updateTaskStatus(demo.data!.id, 'completed');

    // Now can start install
    const canStartAfter = await taskService.canStartTask(install.data!.id);
    assertEqual(canStartAfter.data, true);

    // Check critical path
    const critical = await taskService.getCriticalPath(proj);
    assertTrue(critical.success);
    assertTrue(critical.data!.length >= 2);

    // Check for conflicts before scheduling another task
    const conflicts = await calendarService.detectConflicts({
      startDate: '2024-04-02T10:00:00Z',
      dueDate: '2024-04-02T14:00:00Z',
      assignedTo: 'john@example.com',
      projectId: proj,
    });

    assertTrue(conflicts.success);
    assertTrue(
      conflicts.data!.length > 0,
      'Should detect conflict with install task'
    );

    // Suggest alternative slot
    const suggestions = await calendarService.suggestNextAvailableSlot(
      4,
      'john@example.com',
      '2024-04-01T00:00:00Z'
    );

    assertTrue(suggestions.success);
    assertTrue(suggestions.data!.length > 0);
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
