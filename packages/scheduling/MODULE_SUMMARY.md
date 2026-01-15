# @hooomz/scheduling - Module Summary

## Overview

Complete calendar and task scheduling module with dependency management, critical path analysis, conflict detection, and intelligent scheduling suggestions.

## Module Structure

```
@hooomz/scheduling/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── types/
│   │   └── index.ts               # Type re-exports
│   ├── tasks/
│   │   ├── task.repository.ts     # Data layer with dependency support
│   │   ├── task.service.ts        # Business logic (20+ methods)
│   │   └── index.ts               # Task module exports
│   └── calendar/
│       ├── calendar.service.ts    # Calendar & scheduling (10+ methods)
│       └── index.ts               # Calendar module exports
├── package.json
├── tsconfig.json
├── README.md                       # Complete documentation
└── MODULE_SUMMARY.md               # This file
```

## Core Components

### 1. TaskRepository (ITaskRepository)

Data access layer with:

**CRUD Operations:**
- `findAll(params?)` - List with filtering, sorting, pagination
- `findById(id)` - Get single task
- `findByProjectId(projectId)` - Get project tasks
- `findByAssignee(assigneeId)` - Get assignee tasks
- `findOverdue()` - Get overdue tasks
- `findByDateRange(start, end, filters?)` - Date range query
- `create(data)` - Create new task
- `update(id, data)` - Update task
- `delete(id)` - Delete task
- `exists(id)` - Check existence
- `bulkUpdate(ids[], data)` - Batch update

**Dependency Management:**
- `addDependency(taskId, dependsOnTaskId)` - Link tasks
- `removeDependency(taskId, dependsOnTaskId)` - Unlink tasks
- `getDependencies(taskId)` - Get what task depends on
- `getDependents(taskId)` - Get what depends on task
- `hasCyclicDependency(taskId, dependsOnTaskId)` - Cycle detection

### 2. TaskService (SchedulingOperations)

Business logic with 20+ methods:

**Basic CRUD:**
- `list(params?)` - List tasks
- `getById(id)` - Get task
- `create(data)` - Create task
- `update(id, data)` - Update task
- `delete(id)` - Delete task

**Queries:**
- `getTasksByProject(projectId)` - Project tasks
- `getTasksByAssignee(assigneeId)` - Assignee tasks
- `getOverdueTasks(params?)` - Overdue tasks
- `getTaskWithDependencies(id)` - Task with full dep info

**Status Management:**
- `updateTaskStatus(taskId, status)` - Status with validation
- `bulkUpdateStatus(taskIds[], status)` - Batch status update
- `reorderTasks(projectId, taskIds[])` - Change task order

**Dependencies:**
- `addDependency(taskId, dependsOnTaskId)` - Add dependency
- `removeDependency(taskId, dependsOnTaskId)` - Remove dependency
- `getDependencyChain(taskId)` - All upstream deps
- `canStartTask(taskId)` - Check if deps met
- `updateTaskDependencies(taskId, deps[])` - Update all deps

**Critical Path:**
- `getCriticalPath(projectId)` - Identify critical tasks

### 3. CalendarService

Scheduling and availability with 10+ methods:

**Schedule Management:**
- `getSchedule(startDate, endDate, filters?)` - Get schedule
- `getToday(assigneeId?)` - Today's tasks
- `getThisWeek(assigneeId?)` - This week's tasks
- `getUpcomingTasks(days?, assigneeId?)` - Upcoming tasks

**Availability:**
- `getAvailability(date, assigneeId?)` - Hourly availability
- `detectConflicts(newTask)` - Find scheduling conflicts
- `suggestNextAvailableSlot(duration, assigneeId?, startAfter?)` - Suggest slots

## Key Features

### Status Transition Validation

Enforces valid status transitions:

```typescript
const VALID_TRANSITIONS = {
  'not-started': ['in-progress', 'blocked', 'cancelled'],
  'in-progress': ['completed', 'blocked', 'cancelled'],
  'blocked': ['not-started', 'in-progress', 'cancelled'],
  'completed': ['in-progress'], // Reopen
  'cancelled': ['not-started'], // Restart
};
```

Attempting invalid transitions returns clear error with valid options.

### Dependency Management

**Cycle Detection:**
```typescript
// Prevents circular dependencies
await taskService.addDependency('task_2', 'task_1'); // OK
await taskService.addDependency('task_1', 'task_2'); // ERROR: Would create cycle
```

**Dependency Chain:**
```typescript
// Get all upstream dependencies
const chain = await taskService.getDependencyChain('task_5');
// Returns: ['task_4', 'task_3', 'task_1'] if that's the chain
```

**Start Validation:**
```typescript
// Check if task can start
const canStart = await taskService.canStartTask('task_3');
// Returns false if any dependency is not completed
```

### Critical Path Analysis

Uses forward/backward pass algorithm to calculate:

- **Earliest Start/Finish**: Earliest possible timing given dependencies
- **Latest Start/Finish**: Latest possible timing without delaying project
- **Slack/Float**: Flexibility in scheduling (days task can be delayed)
- **Critical Flag**: Tasks with zero slack (on critical path)

```typescript
const critical = await taskService.getCriticalPath('proj_123');

critical.data.forEach((item) => {
  console.log({
    task: item.task.title,
    earliestStart: item.earliestStart,
    latestStart: item.latestStart,
    slack: item.slack, // Days
    isCritical: item.isCritical, // slack === 0
  });
});
```

### Conflict Detection

Identifies three types of conflicts:

1. **Assignee Overlap**: Same person assigned to multiple tasks at once
2. **Resource Conflict**: Multiple tasks on same project at same time
3. **Time Overlap**: General scheduling overlap

```typescript
const conflicts = await calendarService.detectConflicts({
  startDate: '2024-02-15T10:00:00Z',
  dueDate: '2024-02-15T14:00:00Z',
  assignedTo: 'john@example.com',
  projectId: 'proj_123',
});

// Returns array of conflicts with:
// - conflictType
// - conflictingTask
// - reason
```

### Smart Scheduling

Suggests optimal time slots:

```typescript
const suggestions = await calendarService.suggestNextAvailableSlot(
  4, // Hours needed
  'john@example.com', // Assignee
  '2024-02-20' // Start after
);

// Returns up to 5 suggestions with:
// - startDate
// - endDate
// - confidence (0-100)
// - reason
```

**Confidence Scoring:**
- 100% for today's slots
- Decreases 2% per day out
- Additional 10% reduction after 7 days
- Minimum 20% confidence

### Availability Tracking

Returns hourly slots (8 AM - 6 PM):

```typescript
const availability = await calendarService.getAvailability(
  '2024-02-15',
  'john@example.com'
);

// Returns 10 hourly slots with:
// - start/end times
// - isAvailable flag
// - tasks scheduled in slot
```

## Type Definitions

### Core Types

```typescript
// Task
interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'not-started' | 'in-progress' | 'blocked' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  progress?: number;
  dependencies?: string[];
  order?: number;
  metadata: Metadata;
}

// Task Dependency
interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  metadata: Metadata;
}

// Task with Dependencies
interface TaskWithDependencies extends Task {
  dependencyTasks: Task[]; // Tasks this depends on
  blockedBy: Task[]; // Tasks that depend on this
}
```

### Critical Path Types

```typescript
interface CriticalPathTask {
  task: Task;
  earliestStart: Date;
  earliestFinish: Date;
  latestStart: Date;
  latestFinish: Date;
  slack: number; // In days
  isCritical: boolean;
}
```

### Calendar Types

```typescript
// Schedule Entry
interface ScheduleEntry {
  task: Task;
  project: Project;
  isOverdue: boolean;
  daysUntilDue: number | null;
}

// Availability Slot
interface AvailabilitySlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  tasks: Task[];
}

// Scheduling Conflict
interface SchedulingConflict {
  conflictType: 'assignee-overlap' | 'resource-conflict' | 'time-overlap';
  conflictingTask: Task;
  reason: string;
}

// Suggested Slot
interface SuggestedSlot {
  startDate: Date;
  endDate: Date;
  confidence: number; // 0-100
  reason: string;
}
```

## Usage Patterns

### 1. Project Setup

```typescript
// Create tasks with dependencies
const task1 = await taskService.create({ /* demo task */ });
const task2 = await taskService.create({ /* install task */ });
const task3 = await taskService.create({ /* paint task */ });

// Set up dependency chain
await taskService.addDependency(task2.data.id, task1.data.id);
await taskService.addDependency(task3.data.id, task2.data.id);

// Verify no cycles
const canAdd = await taskService.addDependency(task1.data.id, task3.data.id);
// ERROR: Would create cycle
```

### 2. Status Workflow

```typescript
// Start task (validates dependencies)
const result = await taskService.updateTaskStatus('task_2', 'in-progress');

if (!result.success) {
  console.error(result.error.message);
  // "Cannot start task: dependencies not completed"
}

// Complete task
await taskService.updateTaskStatus('task_2', 'completed');

// Block task
await taskService.updateTaskStatus('task_3', 'blocked');

// Resume blocked task
await taskService.updateTaskStatus('task_3', 'in-progress');
```

### 3. Schedule Planning

```typescript
// Get critical path
const critical = await taskService.getCriticalPath('proj_123');
const criticalTasks = critical.data.filter(t => t.isCritical);

// Schedule critical tasks first
for (const item of criticalTasks) {
  // Check for conflicts
  const conflicts = await calendarService.detectConflicts({
    startDate: item.earliestStart.toISOString(),
    dueDate: item.earliestFinish.toISOString(),
    assignedTo: item.task.assignedTo,
    projectId: item.task.projectId,
  });

  if (conflicts.data.length > 0) {
    // Find alternative slot
    const slot = await calendarService.suggestNextAvailableSlot(
      item.task.estimatedHours || 8,
      item.task.assignedTo,
      item.earliestStart.toISOString()
    );

    if (slot.success && slot.data.length > 0) {
      await taskService.update(item.task.id, {
        startDate: slot.data[0].startDate.toISOString(),
        dueDate: slot.data[0].endDate.toISOString(),
      });
    }
  }
}
```

### 4. Workload Management

```typescript
// Check assignee workload
const upcoming = await calendarService.getUpcomingTasks(7, 'john@example.com');
const totalHours = upcoming.data.reduce(
  (sum, task) => sum + (task.estimatedHours || 0),
  0
);

console.log(`John has ${totalHours} hours of work this week`);

// Rebalance if overloaded
if (totalHours > 40) {
  // Find tasks to reassign
  const tasks = upcoming.data
    .sort((a, b) => (a.priority === 'high' ? -1 : 1))
    .slice(5); // Take lower priority tasks

  for (const task of tasks) {
    // Find available person
    const jane = await calendarService.getUpcomingTasks(7, 'jane@example.com');
    const janeHours = jane.data.reduce(
      (sum, t) => sum + (t.estimatedHours || 0),
      0
    );

    if (janeHours < 30) {
      await taskService.update(task.id, { assignedTo: 'jane@example.com' });
    }
  }
}
```

## Integration Points

### With @hooomz/shared-contracts

Uses:
- Task types (Task, CreateTask, UpdateTask)
- Validation functions (validateCreateTask, validateUpdateTask)
- API response types (ApiResponse, PaginatedApiResponse)
- Utility functions (generateId, createMetadata, updateMetadata)

### With Other Packages

Can be used by:
- **@hooomz/core**: Project task management
- **@hooomz/customers**: Customer task assignments
- **@hooomz/field-docs**: Field work scheduling
- **@hooomz/reporting**: Task analytics and reporting

## Implementation Details

### Cycle Detection Algorithm

Uses depth-first search to detect cycles:

```typescript
async hasCyclicDependency(taskId, dependsOnTaskId) {
  const visited = new Set<string>();
  const stack = [dependsOnTaskId];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === taskId) {
      return true; // Cycle detected
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Get dependencies of current task
    const deps = await this.getDependencies(current);
    for (const dep of deps) {
      stack.push(dep.dependsOnTaskId);
    }
  }

  return false;
}
```

### Critical Path Algorithm

Uses forward pass (earliest times) and backward pass (latest times):

1. **Forward Pass**: Calculate earliest start/finish for each task
2. **Backward Pass**: Calculate latest start/finish from project end
3. **Slack Calculation**: Latest start - earliest start
4. **Critical Path**: Tasks with zero slack

### Conflict Detection Logic

Checks for overlaps in three dimensions:
1. **Time**: Do date ranges overlap?
2. **Assignee**: Same person assigned?
3. **Resources**: Same project affected?

## Best Practices

1. **Always Check Dependencies**:
   ```typescript
   const canStart = await taskService.canStartTask(taskId);
   if (canStart.data) {
     await taskService.updateTaskStatus(taskId, 'in-progress');
   }
   ```

2. **Use Status Transitions**:
   ```typescript
   // Use updateTaskStatus (validates transitions)
   await taskService.updateTaskStatus(taskId, 'in-progress');

   // Not update (bypasses validation)
   await taskService.update(taskId, { status: 'in-progress' }); // DON'T
   ```

3. **Check Conflicts Before Scheduling**:
   ```typescript
   const conflicts = await calendarService.detectConflicts(taskData);
   if (conflicts.data.length > 0) {
     // Handle conflicts
   }
   ```

4. **Use Critical Path for Planning**:
   ```typescript
   const critical = await taskService.getCriticalPath(projectId);
   const criticalTasks = critical.data.filter(t => t.isCritical);
   // Schedule these first!
   ```

5. **Monitor Workload**:
   ```typescript
   const upcoming = await calendarService.getUpcomingTasks(7, assigneeId);
   // Track hours and rebalance if needed
   ```

## Status

✅ **Module Complete**

- TaskRepository: Full CRUD + dependencies
- TaskService: 20+ methods including critical path
- CalendarService: 10+ scheduling methods
- Status transition validation
- Cycle detection
- Conflict detection
- Smart scheduling
- Complete documentation
- Type definitions
- Ready for integration

## Next Steps

1. **Integration**: Connect with project module
2. **Testing**: Add unit and integration tests
3. **UI Components**: Build calendar and Gantt chart views
4. **Notifications**: Add overdue task alerts
5. **Optimization**: Add caching for critical path calculations
