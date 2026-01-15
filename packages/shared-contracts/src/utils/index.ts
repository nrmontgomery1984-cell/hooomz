import { nanoid } from 'nanoid';
import {
  ProjectStatus,
  TaskStatus,
  InspectionStatus,
  TaskPriority,
} from '../types';
import type { LineItem } from '../schemas';

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID with optional prefix
 * @param prefix - Optional prefix for the ID (e.g., 'proj', 'cust', 'task')
 * @returns Unique ID string
 */
export function generateId(prefix?: string): string {
  const id = nanoid(12); // 12 characters for reasonable uniqueness
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Generate IDs with specific prefixes for each entity type
 */
export const generateProjectId = () => generateId('proj');
export const generateCustomerId = () => generateId('cust');
export const generateTaskId = () => generateId('task');
export const generateLineItemId = () => generateId('line');
export const generateInspectionId = () => generateId('insp');

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Date format options
 */
export type DateFormat = 'short' | 'medium' | 'long' | 'iso';

/**
 * Format a date for display
 * @param date - Date to format (Date object or ISO string)
 * @param format - Display format
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | undefined | null,
  format: DateFormat = 'medium'
): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  switch (format) {
    case 'short':
      // MM/DD/YYYY
      return d.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/(\d{4})-(\d{2})-(\d{2})/, '$2/$3/$1');

    case 'medium':
      // Jan 15, 2024
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    case 'long':
      // January 15, 2024
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case 'iso':
      // YYYY-MM-DD
      return d.toISOString().split('T')[0];

    default:
      return d.toLocaleDateString();
  }
}

/**
 * Parse a date string from form input
 * @param dateString - Date string to parse
 * @returns ISO date string (YYYY-MM-DD) or null if invalid
 */
export function parseDate(dateString: string): string | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  return date.toISOString().split('T')[0];
}

/**
 * Check if a date is overdue (past today)
 * @param dueDate - Due date to check (Date object or ISO string)
 * @returns True if the date is in the past
 */
export function isOverdue(dueDate: Date | string | undefined | null): boolean {
  if (!dueDate) return false;

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  if (isNaN(due.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

/**
 * Calculate days until a date
 * @param date - Target date (Date object or ISO string)
 * @returns Number of days until the date (negative if in the past)
 */
export function daysUntil(date: Date | string | undefined | null): number | null {
  if (!date) return null;

  const target = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get current timestamp in ISO format
 * @returns ISO timestamp string
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Create metadata object with current timestamps
 * @returns Metadata object
 */
export function createMetadata() {
  const timestamp = now();
  return {
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Update metadata object with new updatedAt timestamp
 * @param metadata - Existing metadata
 * @returns Updated metadata object
 */
export function updateMetadata(metadata: { createdAt: string; updatedAt: string }) {
  return {
    ...metadata,
    updatedAt: now(),
  };
}

// ============================================================================
// Money Utilities
// ============================================================================

/**
 * Format a number as currency (CAD)
 * @param amount - Amount in dollars (not cents)
 * @param includeCents - Whether to include cents (default: true)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | undefined | null,
  includeCents: boolean = true
): string {
  if (amount === undefined || amount === null) return '$0.00';

  const formatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  });

  return formatter.format(amount);
}

/**
 * Parse a currency string to a number
 * @param currencyString - Currency string (e.g., "$1,234.56" or "1234.56")
 * @returns Numeric value or null if invalid
 */
export function parseCurrency(currencyString: string): number | null {
  if (!currencyString) return null;

  // Remove currency symbols, spaces, and commas
  const cleaned = currencyString.replace(/[$,\s]/g, '');
  const value = parseFloat(cleaned);

  if (isNaN(value)) return null;

  return value;
}

/**
 * Sum the total cost of an array of line items
 * @param items - Array of line items
 * @returns Total cost
 */
export function sumLineItems(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.totalCost, 0);
}

/**
 * Calculate line item total cost
 * @param quantity - Quantity
 * @param unitCost - Unit cost
 * @returns Total cost (rounded to 2 decimal places)
 */
export function calculateLineItemTotal(quantity: number, unitCost: number): number {
  return Math.round(quantity * unitCost * 100) / 100;
}

/**
 * Calculate percentage of budget used
 * @param actualCost - Actual cost spent
 * @param estimatedCost - Estimated/budgeted cost
 * @returns Percentage (0-100+)
 */
export function calculateBudgetPercentage(actualCost: number, estimatedCost: number): number {
  if (estimatedCost === 0) return 0;
  return Math.round((actualCost / estimatedCost) * 100);
}

/**
 * Check if over budget
 * @param actualCost - Actual cost spent
 * @param estimatedCost - Estimated/budgeted cost
 * @returns True if over budget
 */
export function isOverBudget(actualCost: number, estimatedCost: number): boolean {
  return actualCost > estimatedCost;
}

// ============================================================================
// Status Utilities
// ============================================================================

/**
 * Status color mapping for UI
 */
const STATUS_COLORS = {
  // Project statuses
  [ProjectStatus.LEAD]: '#9CA3AF', // gray
  [ProjectStatus.QUOTED]: '#60A5FA', // blue
  [ProjectStatus.APPROVED]: '#34D399', // green
  [ProjectStatus.IN_PROGRESS]: '#FBBF24', // yellow
  [ProjectStatus.ON_HOLD]: '#F59E0B', // orange
  [ProjectStatus.COMPLETE]: '#10B981', // green
  [ProjectStatus.CANCELLED]: '#EF4444', // red

  // Task statuses
  [TaskStatus.NOT_STARTED]: '#9CA3AF', // gray
  [TaskStatus.IN_PROGRESS]: '#3B82F6', // blue
  [TaskStatus.BLOCKED]: '#EF4444', // red
  [TaskStatus.COMPLETE]: '#10B981', // green

  // Inspection statuses
  [InspectionStatus.SCHEDULED]: '#60A5FA', // blue
  [InspectionStatus.PASSED]: '#10B981', // green
  [InspectionStatus.FAILED]: '#EF4444', // red
  [InspectionStatus.PENDING_REINSPECTION]: '#F59E0B', // orange
} as const;

/**
 * Get color code for a status
 * @param status - Status value
 * @returns Hex color code
 */
export function getStatusColor(
  status: ProjectStatus | TaskStatus | InspectionStatus
): string {
  return STATUS_COLORS[status] || '#9CA3AF';
}

/**
 * Task priority color mapping
 */
const PRIORITY_COLORS = {
  [TaskPriority.LOW]: '#6B7280', // gray
  [TaskPriority.MEDIUM]: '#3B82F6', // blue
  [TaskPriority.HIGH]: '#F59E0B', // orange
  [TaskPriority.URGENT]: '#EF4444', // red
} as const;

/**
 * Get color code for a priority level
 * @param priority - Priority value
 * @returns Hex color code
 */
export function getPriorityColor(priority: TaskPriority): string {
  return PRIORITY_COLORS[priority] || '#6B7280';
}

/**
 * Valid project status transitions
 */
const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.LEAD]: [ProjectStatus.QUOTED, ProjectStatus.CANCELLED],
  [ProjectStatus.QUOTED]: [ProjectStatus.APPROVED, ProjectStatus.CANCELLED],
  [ProjectStatus.APPROVED]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
  [ProjectStatus.IN_PROGRESS]: [ProjectStatus.ON_HOLD, ProjectStatus.COMPLETE, ProjectStatus.CANCELLED],
  [ProjectStatus.ON_HOLD]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
  [ProjectStatus.COMPLETE]: [],
  [ProjectStatus.CANCELLED]: [],
};

/**
 * Valid task status transitions
 */
const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.NOT_STARTED]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.BLOCKED, TaskStatus.COMPLETE],
  [TaskStatus.BLOCKED]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.COMPLETE]: [],
};

/**
 * Valid inspection status transitions
 */
const INSPECTION_STATUS_TRANSITIONS: Record<InspectionStatus, InspectionStatus[]> = {
  [InspectionStatus.SCHEDULED]: [InspectionStatus.PASSED, InspectionStatus.FAILED],
  [InspectionStatus.PASSED]: [],
  [InspectionStatus.FAILED]: [InspectionStatus.PENDING_REINSPECTION],
  [InspectionStatus.PENDING_REINSPECTION]: [InspectionStatus.SCHEDULED],
};

/**
 * Get valid next statuses for a current status
 * @param currentStatus - Current status
 * @returns Array of valid next statuses
 */
export function getNextStatuses(
  currentStatus: ProjectStatus
): ProjectStatus[];
export function getNextStatuses(
  currentStatus: TaskStatus
): TaskStatus[];
export function getNextStatuses(
  currentStatus: InspectionStatus
): InspectionStatus[];
export function getNextStatuses(
  currentStatus: ProjectStatus | TaskStatus | InspectionStatus
): (ProjectStatus | TaskStatus | InspectionStatus)[] {
  if (Object.values(ProjectStatus).includes(currentStatus as ProjectStatus)) {
    return PROJECT_STATUS_TRANSITIONS[currentStatus as ProjectStatus] || [];
  }
  if (Object.values(TaskStatus).includes(currentStatus as TaskStatus)) {
    return TASK_STATUS_TRANSITIONS[currentStatus as TaskStatus] || [];
  }
  if (Object.values(InspectionStatus).includes(currentStatus as InspectionStatus)) {
    return INSPECTION_STATUS_TRANSITIONS[currentStatus as InspectionStatus] || [];
  }
  return [];
}

/**
 * Check if a status is terminal (no further transitions)
 * @param status - Status to check
 * @returns True if terminal status
 */
export function isTerminalStatus(
  status: ProjectStatus | TaskStatus | InspectionStatus
): boolean {
  return getNextStatuses(status as any).length === 0;
}

/**
 * Check if a status transition is valid
 * @param currentStatus - Current status
 * @param newStatus - Proposed new status
 * @returns True if transition is valid
 */
export function isValidStatusTransition(
  currentStatus: ProjectStatus,
  newStatus: ProjectStatus
): boolean;
export function isValidStatusTransition(
  currentStatus: TaskStatus,
  newStatus: TaskStatus
): boolean;
export function isValidStatusTransition(
  currentStatus: InspectionStatus,
  newStatus: InspectionStatus
): boolean;
export function isValidStatusTransition(
  currentStatus: ProjectStatus | TaskStatus | InspectionStatus,
  newStatus: ProjectStatus | TaskStatus | InspectionStatus
): boolean {
  const validNextStatuses = getNextStatuses(currentStatus as any);
  return validNextStatuses.includes(newStatus as any);
}
