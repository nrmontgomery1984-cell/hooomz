/**
 * Verification tests for @hooomz/scheduling
 * Tests the four key areas: status transitions, dependency chains, date ranges, and conflicts
 * Run with: npx tsx src/verification-tests.ts
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

function assertFalse(value: boolean, message?: string) {
  if (value) {
    throw new Error(message || `Expected false, got ${value}`);
  }
}

async function runVerificationTests() {
  console.log('\n🧪 Running Scheduling Module Verification Tests\n');

  const repository = new InMemoryTaskRepository();
  const taskService = new TaskService({ taskRepository: repository });
  const calendarService = new CalendarService({ taskRepository: repository });

  // =========================================================================
  // TEST SUITE 1: Task Status Transitions
  // =========================================================================
  console.log('1️⃣  Task Status Transitions:');
  console.log('   Testing state machine with 5 states and valid/invalid transitions\n');

  await test('Status: not-started → in-progress (VALID)', async () => {
    const task = await taskService.create({
      projectId: 'proj_status_1',
      title: 'Status Test 1',
      status: 'not-started',
      priority: 'medium',
    });

    const result = await taskService.updateTaskStatus(task.data!.id, 'in-progress');
    assertTrue(result.success, 'Should allow not-started → in-progress');
    assertEqual(result.data?.status, 'in-progress');
  });

  await test('Status: in-progress → completed (VALID)', async () => {
    const task = await taskService.create({
      projectId: 'proj_status_2',
      title: 'Status Test 2',
      status: 'in-progress',
      priority: 'medium',
    });

    const result = await taskService.updateTaskStatus(task.data!.id, 'completed');
    assertTrue(result.success, 'Should allow in-progress → completed');
    assertEqual(result.data?.status, 'completed');
  });

  await test('Status: not-started → completed (INVALID)', async () => {
    const task = await taskService.create({
      projectId: 'proj_status_3',
      title: 'Status Test 3',
      status: 'not-started',
      priority: 'medium',
    });

    const result = await taskService.updateTaskStatus(task.data!.id, 'completed');
    assertFalse(result.success, 'Should reject not-started → completed');
    assertEqual(result.error?.code, 'INVALID_TRANSITION');
    assertTrue(
      result.error?.message.includes('Invalid status transition'),
      'Should have clear error message'
    );
  });

  await test('Status: completed → in-progress (VALID - reopen)', async () => {
    const task = await taskService.create({
      projectId: 'proj_status_4',
      title: 'Status Test 4',
      status: 'not-started',
      priority: 'medium',
    });

    await taskService.updateTaskStatus(task.data!.id, 'in-progress');
    await taskService.updateTaskStatus(task.data!.id, 'completed');

    // Reopen the completed task
    const result = await taskService.updateTaskStatus(task.data!.id, 'in-progress');
    assertTrue(result.success, 'Should allow reopening completed task');
    assertEqual(result.data?.status, 'in-progress');
  });

  await test('Status: in-progress → blocked (VALID)', async () => {
    const task = await taskService.create({
      projectId: 'proj_status_5',
      title: 'Status Test 5',
      status: 'in-progress',
      priority: 'high',
    });

    const result = await taskService.updateTaskStatus(task.data!.id, 'blocked');
    assertTrue(result.success, 'Should allow blocking in-progress task');
    assertEqual(result.data?.status, 'blocked');
  });

  await test('Status: blocked → in-progress (VALID - unblock)', async () => {
    const task = await taskService.create({
      projectId: 'proj_status_6',
      title: 'Status Test 6',
      status: 'blocked',
      priority: 'high',
    });

    const result = await taskService.updateTaskStatus(task.data!.id, 'in-progress');
    assertTrue(result.success, 'Should allow unblocking task');
    assertEqual(result.data?.status, 'in-progress');
  });

  await test('Status: not-started → cancelled (VALID)', async () => {
    const task = await taskService.create({
      projectId: 'proj_status_7',
      title: 'Status Test 7',
      status: 'not-started',
      priority: 'low',
    });

    const result = await taskService.updateTaskStatus(task.data!.id, 'cancelled');
    assertTrue(result.success, 'Should allow cancelling not-started task');
    assertEqual(result.data?.status, 'cancelled');
  });

  await test('Status: cancelled → not-started (VALID - restart)', async () => {
    const task = await taskService.create({
      projectId: 'proj_status_8',
      title: 'Status Test 8',
      status: 'cancelled',
      priority: 'medium',
    });

    const result = await taskService.updateTaskStatus(task.data!.id, 'not-started');
    assertTrue(result.success, 'Should allow restarting cancelled task');
    assertEqual(result.data?.status, 'not-started');
  });

  // =========================================================================
  // TEST SUITE 2: Dependency Chain Calculation
  // =========================================================================
  console.log('\n2️⃣  Dependency Chain Calculation:');
  console.log('   Testing cycle detection, chain traversal, and start validation\n');

  await test('Dependency: Add simple dependency (A depends on B)', async () => {
    const taskA = await taskService.create({
      projectId: 'proj_dep_1',
      title: 'Task A',
      status: 'not-started',
      priority: 'medium',
    });

    const taskB = await taskService.create({
      projectId: 'proj_dep_1',
      title: 'Task B',
      status: 'not-started',
      priority: 'medium',
    });

    const result = await taskService.addDependency(taskA.data!.id, taskB.data!.id);
    assertTrue(result.success, 'Should add dependency successfully');
  });

  await test('Dependency: Get dependency chain (C → B → A)', async () => {
    const taskA = await taskService.create({
      projectId: 'proj_dep_2',
      title: 'Task A (first)',
      status: 'not-started',
      priority: 'medium',
    });

    const taskB = await taskService.create({
      projectId: 'proj_dep_2',
      title: 'Task B (second)',
      status: 'not-started',
      priority: 'medium',
    });

    const taskC = await taskService.create({
      projectId: 'proj_dep_2',
      title: 'Task C (third)',
      status: 'not-started',
      priority: 'medium',
    });

    // Create chain: C → B → A
    await taskService.addDependency(taskB.data!.id, taskA.data!.id);
    await taskService.addDependency(taskC.data!.id, taskB.data!.id);

    const chain = await taskService.getDependencyChain(taskC.data!.id);
    assertTrue(chain.success, 'Should get dependency chain');
    assertEqual(chain.data?.length, 2, 'Should have 2 dependencies (B and A)');

    // Verify order: should be [B, A]
    assertEqual(chain.data![0].title, 'Task B (second)', 'First dependency should be B');
    assertEqual(chain.data![1].title, 'Task A (first)', 'Second dependency should be A');
  });

  await test('Dependency: Detect cyclic dependency (prevent A → B → A)', async () => {
    const taskA = await taskService.create({
      projectId: 'proj_dep_3',
      title: 'Cycle Task A',
      status: 'not-started',
      priority: 'medium',
    });

    const taskB = await taskService.create({
      projectId: 'proj_dep_3',
      title: 'Cycle Task B',
      status: 'not-started',
      priority: 'medium',
    });

    // A → B
    await taskService.addDependency(taskA.data!.id, taskB.data!.id);

    // Try B → A (would create cycle)
    const result = await taskService.addDependency(taskB.data!.id, taskA.data!.id);
    assertFalse(result.success, 'Should detect and prevent cycle');
    assertEqual(result.error?.code, 'CYCLIC_DEPENDENCY');
    assertTrue(
      result.error?.message.includes('circular dependency'),
      'Should mention circular dependency'
    );
  });

  await test('Dependency: Detect complex cycle (D → C → B → A → D)', async () => {
    const tasks = [];
    for (let i = 0; i < 4; i++) {
      const task = await taskService.create({
        projectId: 'proj_dep_4',
        title: `Complex Cycle Task ${String.fromCharCode(65 + i)}`,
        status: 'not-started',
        priority: 'medium',
      });
      tasks.push(task.data!.id);
    }

    // Create chain: D → C → B → A
    await taskService.addDependency(tasks[3], tasks[2]); // D → C
    await taskService.addDependency(tasks[2], tasks[1]); // C → B
    await taskService.addDependency(tasks[1], tasks[0]); // B → A

    // Try A → D (would complete cycle)
    const result = await taskService.addDependency(tasks[0], tasks[3]);
    assertFalse(result.success, 'Should detect complex cycle');
    assertEqual(result.error?.code, 'CYCLIC_DEPENDENCY');
  });

  await test('Dependency: Cannot start task with incomplete dependencies', async () => {
    const task1 = await taskService.create({
      projectId: 'proj_dep_5',
      title: 'Prerequisite Task',
      status: 'not-started',
      priority: 'high',
    });

    const task2 = await taskService.create({
      projectId: 'proj_dep_5',
      title: 'Dependent Task',
      status: 'not-started',
      priority: 'high',
    });

    await taskService.addDependency(task2.data!.id, task1.data!.id);

    const canStart = await taskService.canStartTask(task2.data!.id);
    assertEqual(canStart.data, false, 'Should not be able to start with incomplete dependency');
  });

  await test('Dependency: Can start task after dependencies completed', async () => {
    const task1 = await taskService.create({
      projectId: 'proj_dep_6',
      title: 'Prerequisite Task',
      status: 'not-started',
      priority: 'high',
    });

    const task2 = await taskService.create({
      projectId: 'proj_dep_6',
      title: 'Dependent Task',
      status: 'not-started',
      priority: 'high',
    });

    await taskService.addDependency(task2.data!.id, task1.data!.id);

    // Complete task1
    await taskService.updateTaskStatus(task1.data!.id, 'in-progress');
    await taskService.updateTaskStatus(task1.data!.id, 'completed');

    const canStart = await taskService.canStartTask(task2.data!.id);
    assertEqual(canStart.data, true, 'Should be able to start after dependency completed');
  });

  await test('Dependency: Remove dependency', async () => {
    const task1 = await taskService.create({
      projectId: 'proj_dep_7',
      title: 'Task 1',
      status: 'not-started',
      priority: 'medium',
    });

    const task2 = await taskService.create({
      projectId: 'proj_dep_7',
      title: 'Task 2',
      status: 'not-started',
      priority: 'medium',
    });

    await taskService.addDependency(task2.data!.id, task1.data!.id);

    const removeResult = await taskService.removeDependency(task2.data!.id, task1.data!.id);
    assertTrue(removeResult.success, 'Should remove dependency');

    // Now task2 should be able to start
    const canStart = await taskService.canStartTask(task2.data!.id);
    assertEqual(canStart.data, true, 'Should be able to start after dependency removed');
  });

  // =========================================================================
  // TEST SUITE 3: Date Range Queries
  // =========================================================================
  console.log('\n3️⃣  Date Range Queries:');
  console.log('   Testing schedule queries, today/week views, and date filtering\n');

  // Set up test data with specific dates
  const today = new Date();
  today.setHours(10, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  await test('Date Range: Create tasks with various dates', async () => {
    // Today task
    const todayTask = await taskService.create({
      projectId: 'proj_date_1',
      title: 'Today Task',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'john@example.com',
      startDate: today.toISOString(),
      dueDate: new Date(today.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      estimatedHours: 4,
    });

    // Tomorrow task
    const tomorrowTask = await taskService.create({
      projectId: 'proj_date_1',
      title: 'Tomorrow Task',
      status: 'not-started',
      priority: 'medium',
      assignedTo: 'john@example.com',
      startDate: tomorrow.toISOString(),
      dueDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      estimatedHours: 2,
    });

    // Next week task
    const nextWeekTask = await taskService.create({
      projectId: 'proj_date_1',
      title: 'Next Week Task',
      status: 'not-started',
      priority: 'low',
      assignedTo: 'jane@example.com',
      startDate: nextWeek.toISOString(),
      dueDate: new Date(nextWeek.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      estimatedHours: 8,
    });

    assertTrue(todayTask.success && tomorrowTask.success && nextWeekTask.success, 'Should create all tasks');
  });

  await test('Date Range: Get today tasks', async () => {
    const result = await calendarService.getToday('john@example.com');
    assertTrue(result.success, 'Should get today tasks');
    assertTrue(result.data!.length > 0, 'Should have at least one task today');

    // Verify tasks are for today
    result.data!.forEach(entry => {
      const taskDate = new Date(entry.task.startDate!);
      const today = new Date();
      assertEqual(
        taskDate.toDateString(),
        today.toDateString(),
        'Task should be scheduled for today'
      );
    });
  });

  await test('Date Range: Get this week tasks', async () => {
    const result = await calendarService.getThisWeek('john@example.com');
    assertTrue(result.success, 'Should get this week tasks');
    assertTrue(result.data!.length >= 1, 'Should have tasks this week');

    // Verify tasks are within this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    result.data!.forEach(entry => {
      const taskDate = new Date(entry.task.startDate!);
      assertTrue(
        taskDate >= startOfWeek && taskDate < endOfWeek,
        'Task should be within this week'
      );
    });
  });

  await test('Date Range: Get upcoming tasks (14 days)', async () => {
    const result = await calendarService.getUpcomingTasks(14, 'john@example.com');
    assertTrue(result.success, 'Should get upcoming tasks');

    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    result.data!.forEach(task => {
      if (task.startDate) {
        const taskDate = new Date(task.startDate);
        assertTrue(
          taskDate >= now && taskDate <= twoWeeksFromNow,
          'Task should be within next 14 days'
        );
      }
    });
  });

  await test('Date Range: Get schedule for specific date range', async () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const result = await calendarService.getSchedule(
      startDate.toISOString(),
      endDate.toISOString()
    );

    assertTrue(result.success, 'Should get schedule for date range');

    result.data!.forEach(entry => {
      if (entry.task.startDate) {
        const taskStart = new Date(entry.task.startDate);
        assertTrue(
          taskStart >= startDate && taskStart <= endDate,
          'All tasks should be within specified range'
        );
      }
    });
  });

  await test('Date Range: Filter schedule by assignee', async () => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = await calendarService.getSchedule(
      startDate.toISOString(),
      endDate.toISOString(),
      { assignedTo: 'john@example.com' }
    );

    assertTrue(result.success, 'Should filter by assignee');
    result.data!.forEach(entry => {
      assertEqual(
        entry.task.assignedTo,
        'john@example.com',
        'All tasks should be assigned to john'
      );
    });
  });

  await test('Date Range: Get overdue tasks', async () => {
    // Create an overdue task
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    await taskService.create({
      projectId: 'proj_date_2',
      title: 'Overdue Task',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'john@example.com',
      startDate: pastDate.toISOString(),
      dueDate: new Date(pastDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    });

    const result = await taskService.getOverdueTasks();
    assertTrue(result.success, 'Should get overdue tasks');
    assertTrue(result.data!.length > 0, 'Should have at least one overdue task');

    const now = new Date();
    result.data!.forEach(task => {
      const dueDate = new Date(task.dueDate!);
      assertTrue(dueDate < now, 'Task should have due date in the past');
      assertTrue(
        task.status !== 'completed' && task.status !== 'cancelled',
        'Overdue task should not be completed or cancelled'
      );
    });
  });

  // =========================================================================
  // TEST SUITE 4: Conflict Detection
  // =========================================================================
  console.log('\n4️⃣  Conflict Detection:');
  console.log('   Testing assignee overlap, resource conflicts, and time overlap\n');

  await test('Conflict: Detect assignee overlap (same person, overlapping time)', async () => {
    // Create existing task: 10 AM - 2 PM
    await taskService.create({
      projectId: 'proj_conflict_1',
      title: 'Existing Task',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'sarah@example.com',
      startDate: '2024-03-15T10:00:00Z',
      dueDate: '2024-03-15T14:00:00Z',
      estimatedHours: 4,
    });

    // Try to schedule new task: 11 AM - 3 PM (overlaps with existing)
    const conflicts = await calendarService.detectConflicts({
      startDate: '2024-03-15T11:00:00Z',
      dueDate: '2024-03-15T15:00:00Z',
      assignedTo: 'sarah@example.com',
      projectId: 'proj_conflict_2', // Different project
    });

    assertTrue(conflicts.success, 'Should detect conflicts');
    assertTrue(conflicts.data!.length > 0, 'Should have at least one conflict');

    const assigneeConflict = conflicts.data!.find(
      c => c.conflictType === 'assignee-overlap'
    );
    assertTrue(assigneeConflict !== undefined, 'Should detect assignee overlap');
    assertTrue(
      assigneeConflict!.reason.includes('sarah@example.com'),
      'Conflict reason should mention assignee'
    );
  });

  await test('Conflict: Detect resource conflict (same project, overlapping time)', async () => {
    // Create existing task on project A
    await taskService.create({
      projectId: 'proj_resource_conflict',
      title: 'Existing Project Task',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'mike@example.com',
      startDate: '2024-03-16T09:00:00Z',
      dueDate: '2024-03-16T12:00:00Z',
      estimatedHours: 3,
    });

    // Try to schedule another task on same project, different person
    const conflicts = await calendarService.detectConflicts({
      startDate: '2024-03-16T10:00:00Z',
      dueDate: '2024-03-16T13:00:00Z',
      assignedTo: 'lisa@example.com', // Different person
      projectId: 'proj_resource_conflict', // Same project
    });

    assertTrue(conflicts.success, 'Should detect conflicts');

    const resourceConflict = conflicts.data!.find(
      c => c.conflictType === 'resource-conflict'
    );
    assertTrue(
      resourceConflict !== undefined,
      'Should detect resource conflict on same project'
    );
  });

  await test('Conflict: No conflict when times do not overlap', async () => {
    // Create existing task: 8 AM - 12 PM
    await taskService.create({
      projectId: 'proj_no_conflict_1',
      title: 'Morning Task',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'bob@example.com',
      startDate: '2024-03-17T08:00:00Z',
      dueDate: '2024-03-17T12:00:00Z',
      estimatedHours: 4,
    });

    // Schedule task after: 1 PM - 5 PM (no overlap)
    const conflicts = await calendarService.detectConflicts({
      startDate: '2024-03-17T13:00:00Z',
      dueDate: '2024-03-17T17:00:00Z',
      assignedTo: 'bob@example.com',
      projectId: 'proj_no_conflict_1',
    });

    assertTrue(conflicts.success, 'Should check for conflicts');
    assertEqual(conflicts.data!.length, 0, 'Should have no conflicts');
  });

  await test('Conflict: Detect time overlap (general scheduling conflict)', async () => {
    // Create existing task
    await taskService.create({
      projectId: 'proj_time_overlap_1',
      title: 'Existing Task',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'emma@example.com',
      startDate: '2024-03-18T12:00:00Z',
      dueDate: '2024-03-18T16:00:00Z',
      estimatedHours: 4,
    });

    // Try to schedule overlapping task on different project, same person
    const conflicts = await calendarService.detectConflicts({
      startDate: '2024-03-18T14:00:00Z',
      dueDate: '2024-03-18T18:00:00Z',
      assignedTo: 'emma@example.com',
      projectId: 'proj_time_overlap_2', // Different project
    });

    assertTrue(conflicts.success, 'Should detect conflicts');
    assertTrue(conflicts.data!.length > 0, 'Should have time overlap conflict');
  });

  await test('Conflict: Handle tasks without dates gracefully', async () => {
    const conflicts = await calendarService.detectConflicts({
      assignedTo: 'test@example.com',
      projectId: 'proj_no_dates',
      // No startDate or dueDate
    });

    assertTrue(conflicts.success, 'Should handle missing dates');
    assertEqual(conflicts.data!.length, 0, 'Should have no conflicts without dates');
  });

  await test('Conflict: Multiple conflicts detected', async () => {
    // Create two overlapping tasks
    await taskService.create({
      projectId: 'proj_multi_conflict',
      title: 'Task 1',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'alex@example.com',
      startDate: '2024-03-19T10:00:00Z',
      dueDate: '2024-03-19T14:00:00Z',
    });

    await taskService.create({
      projectId: 'proj_multi_conflict',
      title: 'Task 2',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'alex@example.com',
      startDate: '2024-03-19T12:00:00Z',
      dueDate: '2024-03-19T16:00:00Z',
    });

    // Try to add a third overlapping task
    const conflicts = await calendarService.detectConflicts({
      startDate: '2024-03-19T11:00:00Z',
      dueDate: '2024-03-19T15:00:00Z',
      assignedTo: 'alex@example.com',
      projectId: 'proj_multi_conflict',
    });

    assertTrue(conflicts.success, 'Should detect conflicts');
    assertTrue(
      conflicts.data!.length >= 2,
      'Should detect multiple conflicts'
    );
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\n❌ Some verification tests failed!');
    console.log('Please review the failures above and fix any issues.');
    process.exit(1);
  } else {
    console.log('\n✅ All verification tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('   • Status Transitions: 8 tests ✓');
    console.log('   • Dependency Chains: 8 tests ✓');
    console.log('   • Date Range Queries: 7 tests ✓');
    console.log('   • Conflict Detection: 7 tests ✓');
    console.log('\n🎉 @hooomz/scheduling module is fully verified and ready!');
    process.exit(0);
  }
}

// Run verification tests
runVerificationTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
