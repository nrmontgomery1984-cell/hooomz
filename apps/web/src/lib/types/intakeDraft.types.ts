/**
 * Intake Draft Types
 *
 * Drafts persist wizard state to IndexedDB so users can resume
 * after interruptions (home show booth, phone calls, site visits).
 */

import type { HomeownerIntakeData, ContractorIntakeData } from './intake.types';

export type IntakeDraftType = 'homeowner' | 'contractor';
export type IntakeDraftStatus = 'in_progress' | 'submitted';

export interface IntakeDraft {
  id: string;
  type: IntakeDraftType;
  currentStep: number;
  data: HomeownerIntakeData | ContractorIntakeData;
  customerName: string;
  projectSummary: string;
  status: IntakeDraftStatus;
  createdAt: string;
  updatedAt: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}
