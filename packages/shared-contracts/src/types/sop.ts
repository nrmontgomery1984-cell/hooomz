/**
 * Standard SOP Types
 *
 * These types represent the new SOP system built from Training Guide modules.
 * Each SOP maps to a TG module via sourceRef and contains procedures + an
 * embedded checklist definition.
 *
 * Named "StandardSOP" to avoid collision with the legacy Sop type in integration.ts.
 *
 * Relationship chain:
 *   TrainingGuide → Module → StandardSOP → ChecklistSubmission
 */

import type { ContentTable, Callout, ProcedureCheckpoint, ProcedureTest } from './trainingGuide';

// ============================================================================
// StandardSOP — Core SOP entity
// ============================================================================

export interface StandardSOP {
  id: string;                       // UUID
  code: string;                     // "HI-SOP-FL-001"
  title: string;                    // "Substrate Assessment & Preparation"
  version: string;                  // "1.0"
  trade: string;                    // "Flooring" | "Painting" | "Drywall" | "Trim"
  status: 'active' | 'draft' | 'archived';

  /** Back-reference to source Training Guide module */
  sourceRef: SOPSourceRef;

  /** Introductory paragraph */
  introduction: string;
  learningObjectives: string[];
  criticalStandards: SOPCriticalStandard[];
  procedures: SOPProcedure[];
  labsReferences: string[];         // ["{{LABS:pin-moisture-meter}}", ...]

  /** Embedded checklist definition */
  checklist: ChecklistDefinition;

  metadata: SOPMetadata;
}

export interface SOPSourceRef {
  tgCode: string;                   // "TG-FLR-001"
  moduleCode: string;               // "TG-FLR-001-M02"
  moduleOrder: number;              // 2
}

export interface SOPMetadata {
  estimatedDuration: string;        // "30-60 minutes"
  difficulty: 'basic' | 'standard' | 'advanced';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SOPCriticalStandard — Stop conditions, specs, techniques
// ============================================================================

export interface SOPCriticalStandard {
  code: string;                     // "CS-FLR-007"
  description: string;
  category: SOPCriticalStandardCategory;
}

export type SOPCriticalStandardCategory =
  | 'stop-condition'
  | 'specification'
  | 'technique'
  | 'quality'
  | 'documentation'
  | 'material-science'
  | 'building-science'
  | 'climate';

// ============================================================================
// SOPProcedure — Step-by-step instructions within an SOP
// ============================================================================

export interface SOPProcedure {
  id: string;
  order: number;
  title: string;
  body?: string | null;
  steps?: string[] | null;
  tables?: ContentTable[] | null;
  callouts?: Callout[] | null;
  checkpoints?: ProcedureCheckpoint[] | null;
  tests?: ProcedureTest[] | null;
}

// ============================================================================
// ChecklistDefinition — What a checklist collects (embedded in SOP)
// ============================================================================

export interface ChecklistDefinition {
  id: string;
  sections: ChecklistSection[];
}

export interface ChecklistSection {
  id: string;
  title: string;
  fields: ChecklistField[];
}

export interface ChecklistField {
  id: string;
  type: 'checkbox' | 'text' | 'number' | 'select' | 'photo' | 'signature';
  label: string;
  required: boolean;
  options?: string[];               // For select type
  unit?: string;                    // For number type (e.g., "%", "inches")
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  linkedStandard?: string;          // e.g., "CS-FLR-007" — highlights if failed
}

// ============================================================================
// ChecklistSubmission — Completed checklist instance
// ============================================================================

export interface ChecklistSubmission {
  id: string;
  sopId: string;
  sopCode: string;
  projectId: string;

  /** Auto-populated */
  technicianId: string;
  technicianName: string;
  submittedAt: string;

  /** User input */
  values: Record<string, ChecklistValue>;
  photos: ChecklistPhoto[];
  notes: string;

  /** Status */
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  allPassed: boolean;               // Computed from stop-condition checks
}

export interface ChecklistValue {
  fieldId: string;
  value: string | number | boolean;
  passedValidation: boolean;
}

export interface ChecklistPhoto {
  id: string;
  fieldId?: string;                 // Optional link to specific field
  uri: string;                      // Base64 data URI
  caption?: string;
  timestamp: string;
}
