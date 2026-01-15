/**
 * Example usage of utility functions
 * This file demonstrates how to use the utilities and can be removed in production
 */

import {
  // ID generation
  generateId,
  generateProjectId,
  generateCustomerId,
  generateTaskId,

  // Date utilities
  formatDate,
  parseDate,
  isOverdue,
  daysUntil,
  now,
  createMetadata,
  updateMetadata,

  // Money utilities
  formatCurrency,
  parseCurrency,
  sumLineItems,
  calculateLineItemTotal,
  calculateBudgetPercentage,
  isOverBudget,

  // Status utilities
  getStatusColor,
  getPriorityColor,
  getNextStatuses,
  isTerminalStatus,
  isValidStatusTransition,
} from './index';

import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  UnitOfMeasure,
  CostCategory,
} from '../types';

// ============================================================================
// ID Generation Examples
// ============================================================================

console.log('=== ID Generation ===');
console.log('Generic ID:', generateId());
console.log('Project ID:', generateProjectId()); // proj-xxxxxxxxxx
console.log('Customer ID:', generateCustomerId()); // cust-xxxxxxxxxx
console.log('Task ID:', generateTaskId()); // task-xxxxxxxxxx

// ============================================================================
// Date Utilities Examples
// ============================================================================

console.log('\n=== Date Utilities ===');

const sampleDate = new Date('2024-02-15');

console.log('Short format:', formatDate(sampleDate, 'short')); // 02/15/2024
console.log('Medium format:', formatDate(sampleDate, 'medium')); // Feb 15, 2024
console.log('Long format:', formatDate(sampleDate, 'long')); // February 15, 2024
console.log('ISO format:', formatDate(sampleDate, 'iso')); // 2024-02-15

const parsedDate = parseDate('2024-02-15');
console.log('Parsed date:', parsedDate); // 2024-02-15

const pastDate = new Date('2024-01-01');
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

console.log('Past date is overdue?', isOverdue(pastDate)); // true
console.log('Future date is overdue?', isOverdue(futureDate)); // false

console.log('Days until past date:', daysUntil(pastDate)); // negative number
console.log('Days until future date:', daysUntil(futureDate)); // ~7

const metadata = createMetadata();
console.log('Created metadata:', metadata);

const updated = updateMetadata(metadata);
console.log('Updated metadata:', updated);

// ============================================================================
// Money Utilities Examples
// ============================================================================

console.log('\n=== Money Utilities ===');

console.log('Format $1,234.56:', formatCurrency(1234.56)); // $1,234.56
console.log('Format $1,000 (no cents):', formatCurrency(1000, false)); // $1,000
console.log('Format $0:', formatCurrency(0)); // $0.00

console.log('Parse "$1,234.56":', parseCurrency('$1,234.56')); // 1234.56
console.log('Parse "1234.56":', parseCurrency('1234.56')); // 1234.56
console.log('Parse "$1,000":', parseCurrency('$1,000')); // 1000

const lineItems = [
  {
    id: 'line-1',
    projectId: 'proj-1',
    category: CostCategory.MATERIALS,
    description: 'Lumber',
    quantity: 100,
    unit: UnitOfMeasure.SQUARE_FOOT,
    unitCost: 5.50,
    totalCost: 550,
    isLabor: false,
    metadata: createMetadata(),
  },
  {
    id: 'line-2',
    projectId: 'proj-1',
    category: CostCategory.LABOR,
    description: 'Installation',
    quantity: 8,
    unit: UnitOfMeasure.HOUR,
    unitCost: 75,
    totalCost: 600,
    isLabor: true,
    metadata: createMetadata(),
  },
];

console.log('Sum of line items:', formatCurrency(sumLineItems(lineItems))); // $1,150.00

const total = calculateLineItemTotal(10, 99.99);
console.log('Line item total (10 × $99.99):', formatCurrency(total)); // $999.90

const budgetPercent = calculateBudgetPercentage(4500, 5000);
console.log('Budget percentage (4500/5000):', budgetPercent + '%'); // 90%

console.log('Is $4500 over $5000 budget?', isOverBudget(4500, 5000)); // false
console.log('Is $5500 over $5000 budget?', isOverBudget(5500, 5000)); // true

// ============================================================================
// Status Utilities Examples
// ============================================================================

console.log('\n=== Status Utilities ===');

console.log('Lead status color:', getStatusColor(ProjectStatus.LEAD));
console.log('In Progress status color:', getStatusColor(ProjectStatus.IN_PROGRESS));
console.log('Complete status color:', getStatusColor(ProjectStatus.COMPLETE));

console.log('Low priority color:', getPriorityColor(TaskPriority.LOW));
console.log('Urgent priority color:', getPriorityColor(TaskPriority.URGENT));

// Status transitions
const leadNextStatuses = getNextStatuses(ProjectStatus.LEAD);
console.log('Valid transitions from LEAD:', leadNextStatuses);
// [ProjectStatus.QUOTED, ProjectStatus.CANCELLED]

const inProgressNextStatuses = getNextStatuses(ProjectStatus.IN_PROGRESS);
console.log('Valid transitions from IN_PROGRESS:', inProgressNextStatuses);
// [ProjectStatus.ON_HOLD, ProjectStatus.COMPLETE, ProjectStatus.CANCELLED]

const completeNextStatuses = getNextStatuses(ProjectStatus.COMPLETE);
console.log('Valid transitions from COMPLETE:', completeNextStatuses);
// [] - terminal status

console.log('Is COMPLETE a terminal status?', isTerminalStatus(ProjectStatus.COMPLETE)); // true
console.log('Is IN_PROGRESS a terminal status?', isTerminalStatus(ProjectStatus.IN_PROGRESS)); // false

// Validate transitions
const validTransition = isValidStatusTransition(
  ProjectStatus.QUOTED,
  ProjectStatus.APPROVED
);
console.log('Can transition from QUOTED to APPROVED?', validTransition); // true

const invalidTransition = isValidStatusTransition(
  ProjectStatus.LEAD,
  ProjectStatus.COMPLETE
);
console.log('Can transition from LEAD to COMPLETE?', invalidTransition); // false

// Task status transitions
const taskNextStatuses = getNextStatuses(TaskStatus.IN_PROGRESS);
console.log('Valid task transitions from IN_PROGRESS:', taskNextStatuses);
// [TaskStatus.BLOCKED, TaskStatus.COMPLETE]

// ============================================================================
// Practical Example: Creating a New Project
// ============================================================================

console.log('\n=== Practical Example: Creating a New Project ===');

const newProject = {
  id: generateProjectId(),
  name: 'Smith Kitchen Renovation',
  status: ProjectStatus.LEAD,
  estimatedCost: 45000,
  actualCost: 0,
  startDate: formatDate(new Date(), 'iso'),
  estimatedEndDate: formatDate(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    'iso'
  ),
  metadata: createMetadata(),
};

console.log('New project created:');
console.log('  ID:', newProject.id);
console.log('  Name:', newProject.name);
console.log('  Status:', newProject.status);
console.log('  Status color:', getStatusColor(newProject.status));
console.log('  Budget:', formatCurrency(newProject.estimatedCost));
console.log('  Start:', formatDate(newProject.startDate, 'medium'));
console.log('  End:', formatDate(newProject.estimatedEndDate, 'medium'));
console.log('  Days until end:', daysUntil(newProject.estimatedEndDate));
console.log('  Can approve?', isValidStatusTransition(newProject.status, ProjectStatus.APPROVED)); // false - must quote first
console.log('  Can quote?', isValidStatusTransition(newProject.status, ProjectStatus.QUOTED)); // true

export {
  sampleDate,
  metadata,
  lineItems,
  newProject,
};
