/**
 * Portal Types
 * For homeowner portal interactions and document sharing
 */

export type DocumentCategory =
  | 'permit'
  | 'contract'
  | 'change_order'
  | 'invoice'
  | 'receipt'
  | 'warranty'
  | 'manual'
  | 'drawing'
  | 'spec_sheet'
  | 'other';

export interface PortalDocumentShare {
  document_id: string;
  category: DocumentCategory;
  explanation: string;
  shared_at: string;
  shared_by: string;
}

/**
 * Auto-generated explanations by document category
 * Provides context for homeowners when documents are shared
 */
export const DOCUMENT_EXPLANATIONS: Record<DocumentCategory, string> = {
  permit: 'This permit confirms your project meets local building code requirements. Keep for your records.',
  warranty: 'Warranty document for materials or workmanship. Reference this for future service claims.',
  manual: 'Operation and maintenance instructions. Reference for care and troubleshooting.',
  contract: 'Your signed agreement outlining the scope and terms of work.',
  change_order: 'Approved change to the original project scope with cost and schedule impact.',
  invoice: 'Billing record for completed work.',
  receipt: 'Proof of purchase for materials installed in your home.',
  drawing: 'Plans and specifications showing what was built.',
  spec_sheet: 'Technical specifications for materials or equipment in your home.',
  other: 'Project documentation for your records.',
};

export const PORTAL_WELCOME_MESSAGE = `
Welcome to your project portal! Here you can:
• View real-time project progress and photos
• See scheduled inspections and their results
• Make material selections when prompted
• Review and approve change orders
• Access all documents shared with you
• Track project timeline and milestones

All information shared here becomes part of your permanent home profile.
`;
