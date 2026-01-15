# @hooomz/scheduling

Calendar and task scheduling module for project management.

## Features

- **Task Management**: Full CRUD operations with status transitions
- **Dependency Management**: Task dependencies with cycle detection
- **Critical Path Analysis**: Identify critical path tasks for project planning
- **Calendar Scheduling**: Schedule management with date range queries
- **Availability Tracking**: Check assignee availability and workload
- **Conflict Detection**: Detect and prevent scheduling conflicts
- **Smart Scheduling**: Suggest optimal time slots for new tasks

## Installation

```bash
# Install in workspace
npm install @hooomz/scheduling
```

## Quick Start

```typescript
import {
  TaskService,
  CalendarService,
  InMemoryTaskRepository,
} from '@hooomz/scheduling';

// Initialize
const taskRepository = new InMemoryTaskRepository();

const taskService = new TaskService({
  taskRepository,
});

const calendarService = new CalendarService({
  taskRepository,
});

// Create a task
const task = await taskService.create({
  projectId: 'proj_123',
  title: 'Install drywall',
  description: 'Install drywall in main bedroom',
  status: 'not-started',
  priority: 'high',
  assignedTo: 'john@example.com',
  startDate: '2024-02-01T08:00:00Z',
  dueDate: '2024-02-03T17:00:00Z',
  estimatedHours: 16,
});

// Get schedule for a date range
const schedule = await calendarService.getSchedule(
  '2024-02-01',
  '2024-02-28',
  { assignedTo: 'john@example.com' }
);

// Detect conflicts
const conflicts = await calendarService.detectConflicts({
  startDate: '2024-02-01T08:00:00Z',
  dueDate: '2024-02-03T17:00:00Z',
  assignedTo: 'john@example.com',
  projectId: 'proj_123',
});

// Suggest available time slot
const suggestions = await calendarService.suggestNextAvailableSlot(
  8, // 8 hours
  'john@example.com'
);
```

## Task Management

### TaskService

Complete CRUD operations plus advanced features.

#### Basic Operations

```typescript
// Create task
const task = await taskService.create({
  projectId: 'proj_123',
  title: 'Install flooring',
  status: 'not-started',
  priority: 'medium',
  assignedTo: 'jane@example.com',
});

// Get task
const result = await taskService.getById('task_123');

// Update task
await taskService.update('task_123', {
  status: 'in-progress',
  progress: 50,
});

// Delete task
await taskService.delete('task_123');

// List with filters
const tasks = await taskService.list({
  filters: {
    projectId: 'proj_123',
    status: ['in-progress', 'blocked'],
  },
  sortBy: 'dueDate',
  sortOrder: 'asc',
  page: 1,
  pageSize: 20,
});
```

#### Project & Assignee Queries

```typescript
// Get all tasks for a project
const projectTasks = await taskService.getTasksByProject('proj_123');

// Get all tasks for an assignee
const assigneeTasks = await taskService.getTasksByAssignee('john@example.com');

// Get overdue tasks
const overdue = await taskService.getOverdueTasks({
  projectId: 'proj_123',
  assignedTo: 'john@example.com',
});
```

#### Status Management

```typescript
// Update status with validation
const result = await taskService.updateTaskStatus('task_123', 'in-progress');

// Valid transitions:
// not-started → in-progress, blocked, cancelled
// in-progress → completed, blocked, cancelled
// blocked → not-started, in-progress, cancelled
// completed → in-progress (reopen)
// cancelled → not-started (restart)

// Bulk update status
await taskService.bulkUpdateStatus(
  ['task_1', 'task_2', 'task_3'],
  'in-progress'
);
```

#### Task Reordering

```typescript
// Reorder tasks within a project
await taskService.reorderTasks('proj_123', [
  'task_5', // First
  'task_2', // Second
  'task_1', // Third
  'task_3', // Fourth
]);
```

## Dependency Management

### Adding Dependencies

```typescript
// Add dependency (task_2 depends on task_1)
await taskService.addDependency('task_2', 'task_1');

// Task 2 cannot start until Task 1 is completed

// Remove dependency
await taskService.removeDependency('task_2', 'task_1');
```

### Dependency Chain

```typescript
// Get all upstream dependencies
const chain = await taskService.getDependencyChain('task_5');

// Returns all tasks that must be completed before task_5 can start
```

### Checking Dependencies

```typescript
// Check if task can start
const canStart = await taskService.canStartTask('task_3');

if (canStart.success && canStart.data) {
  // All dependencies are completed
  await taskService.updateTaskStatus('task_3', 'in-progress');
} else {
  console.log('Dependencies not met');
}
```

### Task with Dependencies

```typescript
// Get task with full dependency information
const taskWithDeps = await taskService.getTaskWithDependencies('task_3');

// Returns:
// - task: The task itself
// - dependencyTasks: Tasks this task depends on
// - blockedBy: Tasks that depend on this task
```

### Updating Dependencies

```typescript
// Update all dependencies at once
await taskService.updateTaskDependencies('task_4', [
  'task_1', // task_4 now depends on task_1
  'task_2', // and task_2
]);

// Automatically validates for cycles
```

## Critical Path Analysis

Identify critical tasks that directly impact project completion date.

```typescript
const criticalPath = await taskService.getCriticalPath('proj_123');

if (criticalPath.success && criticalPath.data) {
  criticalPath.data.forEach((item) => {
    console.log(`Task: ${item.task.title}`);
    console.log(`Earliest Start: ${item.earliestStart}`);
    console.log(`Latest Start: ${item.latestStart}`);
    console.log(`Slack: ${item.slack} days`);
    console.log(`Critical: ${item.isCritical ? 'YES' : 'NO'}`);
  });

  // Critical tasks (slack = 0) must be completed on time
  const critical = criticalPath.data.filter(item => item.isCritical);
  console.log(`${critical.length} critical tasks found`);
}
```

**Critical Path Concepts:**
- **Earliest Start**: Earliest date task can start given dependencies
- **Latest Start**: Latest date task can start without delaying project
- **Slack**: Flexibility in scheduling (days task can be delayed)
- **Critical**: Tasks with zero slack (directly impact project end date)

## Calendar & Scheduling

### CalendarService

Schedule management, availability, and conflict detection.

#### Get Schedule

```typescript
// Get schedule for date range
const schedule = await calendarService.getSchedule(
  '2024-02-01',
  '2024-02-29',
  {
    projectId: 'proj_123',
    assignedTo: 'john@example.com',
    status: ['in-progress', 'not-started'],
  }
);

// Returns schedule entries with:
// - task
// - project
// - isOverdue
// - daysUntilDue
```

#### Check Availability

```typescript
// Get availability for a specific date
const availability = await calendarService.getAvailability(
  '2024-02-15',
  'john@example.com' // Optional assignee filter
);

if (availability.success && availability.data) {
  availability.data.forEach((slot) => {
    console.log(`${slot.start} - ${slot.end}`);
    console.log(`Available: ${slot.isAvailable}`);
    console.log(`Tasks: ${slot.tasks.length}`);
  });
}
```

Returns hourly slots (8 AM - 6 PM) showing:
- Time range
- Availability status
- Scheduled tasks in that slot

#### Detect Conflicts

```typescript
// Check for conflicts before scheduling
const conflicts = await calendarService.detectConflicts({
  startDate: '2024-02-15T10:00:00Z',
  dueDate: '2024-02-15T14:00:00Z',
  assignedTo: 'john@example.com',
  projectId: 'proj_123',
});

if (conflicts.success && conflicts.data && conflicts.data.length > 0) {
  console.log('Conflicts detected:');
  conflicts.data.forEach((conflict) => {
    console.log(`Type: ${conflict.conflictType}`);
    console.log(`Task: ${conflict.conflictingTask.title}`);
    console.log(`Reason: ${conflict.reason}`);
  });
}
```

**Conflict Types:**
- `assignee-overlap`: Same person assigned to multiple tasks
- `resource-conflict`: Tasks on same project overlap
- `time-overlap`: General scheduling overlap

#### Suggest Available Slots

```typescript
// Find next available time slots
const suggestions = await calendarService.suggestNextAvailableSlot(
  4, // Duration in hours
  'john@example.com', // Optional assignee
  '2024-02-20' // Optional start after date
);

if (suggestions.success && suggestions.data) {
  suggestions.data.forEach((slot) => {
    console.log(`Start: ${slot.startDate}`);
    console.log(`End: ${slot.endDate}`);
    console.log(`Confidence: ${slot.confidence}%`);
    console.log(`Reason: ${slot.reason}`);
  });

  // Use the highest confidence slot
  const best = suggestions.data[0];
}
```

Returns up to 5 suggested slots with confidence scores.

### Quick Access Methods

```typescript
// Get today's tasks
const today = await calendarService.getToday('john@example.com');

// Get this week's tasks
const thisWeek = await calendarService.getThisWeek('john@example.com');

// Get upcoming tasks (next 7 days)
const upcoming = await calendarService.getUpcomingTasks(
  7, // Days
  'john@example.com'
);
```

## Status Transitions

Valid status transitions are enforced:

```
not-started
  ↓
  ├─→ in-progress
  ├─→ blocked
  └─→ cancelled

in-progress
  ↓
  ├─→ completed
  ├─→ blocked
  └─→ cancelled

blocked
  ↓
  ├─→ not-started
  ├─→ in-progress
  └─→ cancelled

completed
  ↓
  └─→ in-progress (reopen)

cancelled
  ↓
  └─→ not-started (restart)
```

Attempting invalid transitions returns an error with valid options.

## Advanced Examples

### Project Planning Workflow

```typescript
// 1. Create project tasks
const task1 = await taskService.create({
  projectId: 'proj_kitchen',
  title: 'Demo existing cabinets',
  status: 'not-started',
  priority: 'high',
  estimatedHours: 8,
});

const task2 = await taskService.create({
  projectId: 'proj_kitchen',
  title: 'Install new cabinets',
  status: 'not-started',
  priority: 'high',
  estimatedHours: 16,
});

// 2. Set up dependencies
await taskService.addDependency(task2.data!.id, task1.data!.id);
// task2 depends on task1

// 3. Find critical path
const critical = await taskService.getCriticalPath('proj_kitchen');

// 4. Schedule critical tasks first
const criticalTasks = critical.data!.filter(t => t.isCritical);
for (const item of criticalTasks) {
  // Find available slot
  const slot = await calendarService.suggestNextAvailableSlot(
    item.task.estimatedHours || 8,
    item.task.assignedTo
  );

  if (slot.success && slot.data && slot.data.length > 0) {
    const best = slot.data[0];
    await taskService.update(item.task.id, {
      startDate: best.startDate.toISOString(),
      dueDate: best.endDate.toISOString(),
    });
  }
}
```

### Resource Management

```typescript
// Check team member workload
async function getWorkload(assigneeId: string, days: number = 7) {
  const upcoming = await calendarService.getUpcomingTasks(days, assigneeId);

  if (!upcoming.success || !upcoming.data) return null;

  const totalHours = upcoming.data.reduce(
    (sum, task) => sum + (task.estimatedHours || 0),
    0
  );

  return {
    taskCount: upcoming.data.length,
    totalHours,
    averagePerDay: totalHours / days,
  };
}

// Balance workload
const johnWorkload = await getWorkload('john@example.com');
const janeWorkload = await getWorkload('jane@example.com');

console.log(`John: ${johnWorkload.totalHours} hours`);
console.log(`Jane: ${janeWorkload.totalHours} hours`);
```

### Dependency Validation

```typescript
// Validate dependencies before scheduling
async function validateSchedule(projectId: string) {
  const tasks = await taskService.getTasksByProject(projectId);

  for (const task of tasks.data || []) {
    const canStart = await taskService.canStartTask(task.id);

    if (!canStart.data && task.status === 'in-progress') {
      console.warn(`Task ${task.title} is in progress but dependencies not met!`);
    }
  }
}
```

## API Response Format

All operations return `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

Always check `response.success` before using `response.data`.

## Type Safety

Full TypeScript support with strict typing:

```typescript
import type {
  Task,
  CreateTask,
  UpdateTask,
  TaskWithDependencies,
  ScheduleEntry,
  CriticalPathTask,
  SchedulingConflict,
  AvailabilitySlot,
  SuggestedSlot,
} from '@hooomz/scheduling';
```

## Dependencies

- **@hooomz/shared-contracts**: Base types and utilities

## Documentation

- Full API reference in code comments
- TypeScript definitions for all types
- Examples for common workflows

## Best Practices

1. **Check Dependencies**: Always verify dependencies are met before starting tasks
2. **Detect Conflicts**: Check for conflicts before creating new tasks
3. **Use Critical Path**: Prioritize critical path tasks to stay on schedule
4. **Validate Transitions**: Let the service enforce valid status transitions
5. **Monitor Workload**: Track assignee workload to prevent overallocation
6. **Schedule Smart**: Use suggested slots for optimal scheduling

## License

Private - Internal use only
