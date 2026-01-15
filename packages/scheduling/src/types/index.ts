/**
 * Scheduling module-specific types
 */

// Re-export commonly used types from shared-contracts
export type {
  Task,
  CreateTask,
  UpdateTask,
  TaskFilters,
  TaskSortField,
  SchedulingOperations,
  TaskWithDependencies,
  ScheduleEntry,
} from '@hooomz/shared-contracts';

// Re-export task types
export type {
  TaskDependency,
  ITaskRepository,
} from '../tasks/task.repository';

// Re-export task service types
export type {
  TaskServiceDependencies,
  CriticalPathTask,
} from '../tasks/task.service';

// Re-export calendar types
export type {
  CalendarServiceDependencies,
  SchedulingConflict,
  AvailabilitySlot,
  SuggestedSlot,
} from '../calendar/calendar.service';
