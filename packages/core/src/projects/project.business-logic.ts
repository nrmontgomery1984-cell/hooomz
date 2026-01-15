/**
 * Project Business Logic
 *
 * Pure functions for project calculations and business rules.
 * These can be used independently or within the ProjectService.
 */

import type {
  Project,
  ProjectStatus,
  Task,
  TaskPriority,
  LineItem,
  Customer,
} from '@hooomz/shared-contracts';

import {
  isOverdue,
  daysUntil,
  sumLineItems,
  TaskStatus as SharedTaskStatus,
} from '@hooomz/shared-contracts';

/**
 * Project health status
 */
export type ProjectHealth = 'on-track' | 'at-risk' | 'behind' | 'over-budget';

/**
 * Project summary for UI display
 */
export interface ProjectSummary {
  // Basic info
  projectId: string;
  projectName: string;
  projectType: string;
  status: ProjectStatus;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Financial
  estimatedCost: number;
  actualCost: number;
  remainingBudget: number;
  budgetUtilization: number; // percentage

  // Timeline
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  daysElapsed: number;
  daysRemaining: number | null;
  isOverdue: boolean;

  // Progress
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  progressPercentage: number;
  weightedProgress: number;

  // Costs
  totalLineItems: number;
  laborCost: number;
  materialCost: number;

  // Health
  health: ProjectHealth;
}

// ============================================================================
// Status Transition Logic
// ============================================================================

/**
 * Valid status transitions map
 * Defines which statuses can transition to which other statuses
 */
const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  lead: ['quoted', 'cancelled'],
  quoted: ['approved', 'cancelled'],
  approved: ['in-progress', 'cancelled'],
  'in-progress': ['on-hold', 'complete', 'cancelled'],
  'on-hold': ['in-progress', 'cancelled'],
  complete: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidProjectStatusTransition(
  currentStatus: ProjectStatus,
  newStatus: ProjectStatus
): boolean {
  if (currentStatus === newStatus) return true; // No change
  const validTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(newStatus);
}

/**
 * Get valid next statuses for a project
 */
export function getValidNextStatuses(currentStatus: ProjectStatus): ProjectStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalProjectStatus(status: ProjectStatus): boolean {
  return STATUS_TRANSITIONS[status].length === 0;
}

// ============================================================================
// Project Health Calculation
// ============================================================================

/**
 * Calculate project health based on multiple factors
 *
 * Health determination:
 * - over-budget: Actual cost > estimated cost
 * - behind: Past estimated end date or has overdue tasks
 * - at-risk: >85% budget used or <15 days remaining with <50% complete
 * - on-track: Everything looks good
 */
export function getProjectHealth(
  project: Project,
  tasks: Task[],
  lineItems: LineItem[]
): ProjectHealth {
  // Check budget status
  const budgetUtilization =
    project.budget.estimatedCost > 0
      ? project.budget.actualCost / project.budget.estimatedCost
      : 0;

  if (budgetUtilization > 1) {
    return 'over-budget';
  }

  // Check timeline status
  const projectOverdue =
    project.dates.estimatedEndDate &&
    isOverdue(project.dates.estimatedEndDate) &&
    project.status !== 'complete';

  const hasOverdueTasks = tasks.some(
    (task) =>
      task.dueDate &&
      isOverdue(task.dueDate) &&
      task.status !== 'complete'
  );

  if (projectOverdue || hasOverdueTasks) {
    return 'behind';
  }

  // Check at-risk conditions
  const progress = calculateProjectProgress(project, tasks);
  const remainingDays = project.dates.estimatedEndDate
    ? daysUntil(project.dates.estimatedEndDate)
    : null;

  const isHighBudgetUtilization = budgetUtilization > 0.85;
  const isLowTimeHighProgress =
    remainingDays !== null && remainingDays < 15 && progress < 50;

  if (isHighBudgetUtilization || isLowTimeHighProgress) {
    return 'at-risk';
  }

  return 'on-track';
}

// ============================================================================
// Project Progress Calculation
// ============================================================================

/**
 * Task priority weights for progress calculation
 */
const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

/**
 * Calculate project progress as a percentage (0-100)
 * Weighted by task priority
 *
 * Formula:
 * - Each task contributes based on its priority weight
 * - Completed tasks contribute their full weight
 * - Progress = (sum of completed task weights / sum of all task weights) * 100
 */
export function calculateProjectProgress(project: Project, tasks: Task[]): number {
  if (tasks.length === 0) return 0;

  let totalWeight = 0;
  let completedWeight = 0;

  for (const task of tasks) {
    const weight = PRIORITY_WEIGHTS[task.priority] || 1;
    totalWeight += weight;

    if (task.status === 'complete') {
      completedWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;

  return Math.round((completedWeight / totalWeight) * 100);
}

/**
 * Calculate simple unweighted progress percentage
 */
export function calculateSimpleProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter((t) => t.status === 'complete').length;
  return Math.round((completedTasks / tasks.length) * 100);
}

// ============================================================================
// Project Summary Generation
// ============================================================================

/**
 * Generate a comprehensive project summary for UI display
 *
 * Combines project, tasks, line items, and customer data into a
 * denormalized summary object optimized for frontend consumption.
 */
export function getProjectSummary(
  project: Project,
  tasks: Task[],
  lineItems: LineItem[],
  customer: Customer
): ProjectSummary {
  // Customer info
  const customerName = `${customer.firstName} ${customer.lastName}`;

  // Financial calculations
  const remainingBudget = project.budget.estimatedCost - project.budget.actualCost;
  const budgetUtilization =
    project.budget.estimatedCost > 0
      ? Math.round((project.budget.actualCost / project.budget.estimatedCost) * 100)
      : 0;

  // Timeline calculations
  const daysElapsed = project.dates.startDate
    ? Math.abs(daysUntil(project.dates.startDate) || 0)
    : 0;

  const daysRemaining = project.dates.estimatedEndDate
    ? daysUntil(project.dates.estimatedEndDate)
    : null;

  const projectOverdue =
    project.dates.estimatedEndDate &&
    isOverdue(project.dates.estimatedEndDate) &&
    project.status !== 'complete';

  // Task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'complete').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;

  // Progress calculations
  const progressPercentage = calculateSimpleProgress(tasks);
  const weightedProgress = calculateProjectProgress(project, tasks);

  // Cost breakdown
  const laborCost = lineItems
    .filter((item) => item.isLabor)
    .reduce((sum, item) => sum + item.totalCost, 0);

  const materialCost = lineItems
    .filter((item) => !item.isLabor)
    .reduce((sum, item) => sum + item.totalCost, 0);

  // Health assessment
  const health = getProjectHealth(project, tasks, lineItems);

  return {
    // Basic info
    projectId: project.id,
    projectName: project.name,
    projectType: project.projectType,
    status: project.status,

    // Customer info
    customerName,
    customerEmail: customer.email,
    customerPhone: customer.phone,

    // Financial
    estimatedCost: project.budget.estimatedCost,
    actualCost: project.budget.actualCost,
    remainingBudget,
    budgetUtilization,

    // Timeline
    startDate: project.dates.startDate,
    estimatedEndDate: project.dates.estimatedEndDate,
    actualEndDate: project.dates.actualEndDate,
    daysElapsed,
    daysRemaining,
    isOverdue: projectOverdue || false,

    // Progress
    totalTasks,
    completedTasks,
    inProgressTasks,
    blockedTasks,
    progressPercentage,
    weightedProgress,

    // Costs
    totalLineItems: lineItems.length,
    laborCost,
    materialCost,

    // Health
    health,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate that a customer exists (for project creation/update)
 */
export function validateCustomerExists(
  customerId: string | undefined,
  customerExists: boolean
): ValidationResult {
  if (!customerId) {
    return {
      valid: false,
      errors: [{ field: 'clientId', message: 'Customer ID is required' }],
    };
  }

  if (!customerExists) {
    return {
      valid: false,
      errors: [{ field: 'clientId', message: `Customer ${customerId} not found` }],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate project dates are logical
 */
export function validateProjectDates(dates: {
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (dates.startDate && dates.estimatedEndDate) {
    const start = new Date(dates.startDate);
    const end = new Date(dates.estimatedEndDate);

    if (end < start) {
      errors.push({
        field: 'dates.estimatedEndDate',
        message: 'Estimated end date must be after start date',
      });
    }
  }

  if (dates.actualEndDate && dates.startDate) {
    const start = new Date(dates.startDate);
    const actual = new Date(dates.actualEndDate);

    if (actual < start) {
      errors.push({
        field: 'dates.actualEndDate',
        message: 'Actual end date must be after start date',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate project budget is reasonable
 */
export function validateProjectBudget(budget: {
  estimatedCost: number;
  actualCost: number;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (budget.estimatedCost < 0) {
    errors.push({
      field: 'budget.estimatedCost',
      message: 'Estimated cost cannot be negative',
    });
  }

  if (budget.actualCost < 0) {
    errors.push({
      field: 'budget.actualCost',
      message: 'Actual cost cannot be negative',
    });
  }

  if (budget.estimatedCost < 100) {
    errors.push({
      field: 'budget.estimatedCost',
      message: 'Estimated cost seems unreasonably low for a construction project',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
