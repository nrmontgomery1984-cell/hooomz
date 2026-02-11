import type { ProjectStatus } from '../types/project';

/**
 * Project Completion Checklist
 * All items must be satisfied before a project can transition to 'complete' status.
 * These are enforced at the service layer.
 */
export interface CompletionChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

export const PROJECT_COMPLETION_CHECKLIST: CompletionChecklistItem[] = [
  {
    id: 'all_tasks_complete',
    label: 'All tasks complete',
    description: 'Every task instance in the project must have status "complete" or "cancelled"',
    required: true,
  },
  {
    id: 'all_inspections_passed',
    label: 'All inspections passed',
    description: 'Every scheduled inspection must have result "passed" or "conditional"',
    required: true,
  },
  {
    id: 'final_photos_uploaded',
    label: 'Final photos uploaded',
    description: 'At least one photo tagged "after" must exist for the project',
    required: true,
  },
  {
    id: 'final_payment_received',
    label: 'Final payment received',
    description: 'All invoices must be marked as paid',
    required: true,
  },
  {
    id: 'homeowner_data_queued',
    label: 'Homeowner data queued',
    description: 'All homeowner-visible data has been queued in PropertyPendingData',
    required: true,
  },
];

/**
 * Status transitions that are allowed for projects.
 * Key is current status, value is array of allowed next statuses.
 */
export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  lead: ['estimate', 'cancelled'],
  estimate: ['quoted', 'cancelled'],
  quoted: ['approved', 'estimate', 'cancelled'],
  approved: ['in_progress', 'on_hold', 'cancelled'],
  in_progress: ['on_hold', 'complete', 'cancelled'],
  on_hold: ['in_progress', 'cancelled'],
  complete: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Statuses that require completion checklist validation before entering.
 */
export const STATUSES_REQUIRING_CHECKLIST: ProjectStatus[] = ['complete'];

/**
 * Statuses that allow data modification.
 * Once a project is complete or cancelled, data is locked.
 */
export const EDITABLE_STATUSES: ProjectStatus[] = [
  'lead',
  'estimate',
  'quoted',
  'approved',
  'in_progress',
  'on_hold',
];
