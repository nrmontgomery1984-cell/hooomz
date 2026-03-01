/**
 * Sales Checklists — Config-based templates for sales process stages.
 *
 * Option C: Templates live in code (not IndexedDB). Completion state
 * is stored as `checklistCompletions` on ConsultationRecord / QuoteRecord.
 */

export interface SalesChecklistItem {
  key: string;
  label: string;
}

export interface SalesChecklistTemplate {
  id: string;
  label: string;
  entityType: 'consultation' | 'quote';
  items: SalesChecklistItem[];
}

export type ChecklistCompletions = Record<string, { checked: boolean; checkedAt?: string }>;

export const SALES_CHECKLISTS: SalesChecklistTemplate[] = [
  {
    id: 'pre-consultation',
    label: 'Pre-Consultation',
    entityType: 'consultation',
    items: [
      { key: 'initial-contact', label: 'Initial call/text made' },
      { key: 'scope-confirmed', label: 'Scope confirmed (which trades)' },
      { key: 'budget-discussed', label: 'Budget range discussed' },
      { key: 'timeline-established', label: 'Timeline established' },
      { key: 'followup-set', label: 'Follow-up date set' },
    ],
  },
  {
    id: 'site-visit',
    label: 'Site Visit',
    entityType: 'consultation',
    items: [
      { key: 'photos-taken', label: 'Site photos taken' },
      { key: 'measurements', label: 'Measurements recorded' },
      { key: 'conditions-documented', label: 'Existing conditions documented' },
      { key: 'preferences-confirmed', label: 'Customer preferences confirmed' },
      { key: 'access-noted', label: 'Special access requirements noted' },
    ],
  },
  {
    id: 'pre-quote',
    label: 'Pre-Quote',
    entityType: 'quote',
    items: [
      { key: 'items-reviewed', label: 'All line items reviewed' },
      { key: 'markup-verified', label: 'Markup percentages verified' },
      { key: 'availability-confirmed', label: 'Material availability confirmed' },
      { key: 'cover-notes', label: 'Cover notes written' },
      { key: 'video-recorded', label: 'Video walkthrough recorded' },
    ],
  },
  {
    id: 'contract-visit',
    label: 'Contract Visit',
    entityType: 'quote',
    items: [
      { key: 'contract-reviewed', label: 'Contract reviewed with customer' },
      { key: 'contract-signed', label: 'Contract signed (both parties)' },
      { key: 'deposit-collected', label: 'Deposit collected' },
      { key: 'materials-confirmed', label: 'Material selections confirmed' },
      { key: 'start-date-confirmed', label: 'Start date confirmed' },
      { key: 'vr-walkthrough', label: 'VR walkthrough completed (if applicable)' },
      { key: 'customer-portal', label: 'Customer portal access shared' },
    ],
  },
];

export function getTemplatesForEntity(entityType: 'consultation' | 'quote'): SalesChecklistTemplate[] {
  return SALES_CHECKLISTS.filter((t) => t.entityType === entityType);
}

export function getChecklistProgress(
  template: SalesChecklistTemplate,
  completions: ChecklistCompletions | undefined,
): { checked: number; total: number } {
  if (!completions) return { checked: 0, total: template.items.length };
  const checked = template.items.filter((item) => completions[item.key]?.checked).length;
  return { checked, total: template.items.length };
}
