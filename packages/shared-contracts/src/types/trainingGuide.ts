/**
 * Training Guide Types
 *
 * A TrainingGuide is the top-level training document for a trade.
 * Each TG contains modules, and each module maps to one or more SOPs.
 *
 * Relationship chain:
 *   TrainingGuide → Module → SOP → Checklist → Observation → Knowledge → Labs
 *
 * Content is created through the app or imported as structured JSON.
 * The conversion prompt (TG → JSON) produces objects matching these types.
 */

// ============================================================================
// TrainingGuide — Top-level training document
// ============================================================================

export interface TrainingGuide {
  id: string;                                    // "tg-flr-001"
  code: string;                                  // "TG-FLR-001"
  title: string;                                 // "Flooring Installation — Complete Training Guide"
  trade: string;                                 // "Flooring" | "Painting" | "Finish Carpentry" | etc.
  version: string;                               // "1.2"
  status: TrainingGuideStatus;
  effectiveDate?: string;                        // "2026-02"
  modules: TrainingModule[];
  appendices?: TrainingAppendix[];
  metadata: TrainingGuideMetadata;
}

export type TrainingGuideStatus = 'draft' | 'active' | 'archived';

// ============================================================================
// TrainingModule — Major section within a TG
// ============================================================================

export interface TrainingModule {
  id: string;                                    // "tg-flr-001-m01"
  code: string;                                  // "TG-FLR-001-M01"
  title: string;                                 // "Flooring Fundamentals"
  order: number;
  sopCodes: string[];                            // ["HI-SOP-FL-001"] or [] for background modules
  learningObjectives: string[];
  criticalStandards: CriticalStandard[];
  content: ModuleContent;
  labsReferences: string[];                      // ["{{LABS:pin-moisture-meter}}"]
}

// ============================================================================
// ModuleContent — Flexible content container
// ============================================================================

export interface ModuleContent {
  /** Module-level introduction paragraph */
  introduction?: string;

  /** Module-level callouts (outside of any section) */
  callouts?: Callout[];

  /** For fundamentals/background modules */
  sections?: ContentSection[];

  /** For procedural modules — drives SOP generation */
  procedures?: Procedure[];

  /** For specification tables, comparison data, requirements */
  specifications?: Record<string, unknown>;
}

export interface ContentSection {
  title: string;
  /** Section-level body text (paragraph prose) */
  body?: string;
  /** Structured subsections with their own prose, tables, callouts */
  subsections?: SubSection[];
  /** Section-level tables */
  tables?: ContentTable[];
  /** Section-level callouts */
  callouts?: Callout[];
}

// ============================================================================
// SubSection — Nested content block within a section
// ============================================================================

export interface SubSection {
  title: string;
  body?: string;
  tables?: ContentTable[];
  callouts?: Callout[];
}

// ============================================================================
// ContentTable — Structured data table
// ============================================================================

export interface ContentTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

// ============================================================================
// Callout — Highlighted information box
// ============================================================================

export interface Callout {
  type: 'info' | 'warning' | 'critical' | 'tip' | 'labs';
  title?: string;
  content: string;
}

// ============================================================================
// Procedure — Step-by-step instructions within a module
// ============================================================================

export interface Procedure {
  title: string;

  /** Procedure-level introduction/context paragraph */
  body?: string;

  /** Standard procedure steps → maps to SOP quick_steps */
  steps?: string[];

  /** For inspection/quality procedures */
  checkpoints?: ProcedureCheckpoint[];

  /** For functional test procedures */
  tests?: ProcedureTest[];

  /** Simple checklist items (no pass/fail criteria) */
  checks?: string[];

  /** Procedure-level tables */
  tables?: ContentTable[];

  /** Procedure-level callouts */
  callouts?: Callout[];
}

export interface ProcedureCheckpoint {
  checkpoint: string;
  acceptable: string;
  unacceptable: string;
}

export interface ProcedureTest {
  test: string;
  method: string;
}

// ============================================================================
// CriticalStandard — Extracted from callout boxes and spec tables
// ============================================================================

export interface CriticalStandard {
  code: string;                                  // "CS-FLR-001"
  description: string;
  category: CriticalStandardCategory;
}

export type CriticalStandardCategory =
  | 'specification'       // Measurable requirements (tolerances, limits)
  | 'technique'           // Method requirements (how to do something)
  | 'stop-condition'      // Things that halt work
  | 'quality'             // Acceptance criteria
  | 'documentation'       // Recording/photo requirements
  | 'material-science'    // Material behavior knowledge
  | 'building-science'    // Physics/environmental knowledge
  | 'climate';            // Climate-zone specific

// ============================================================================
// TrainingAppendix — Quick references, tool checklists, Labs index
// ============================================================================

export interface TrainingAppendix {
  id: string;                                    // "appendix-a"
  title: string;
  content: Record<string, unknown>;              // Structure varies by appendix type
}

// ============================================================================
// TrainingGuideMetadata — Richer than standard Metadata
// ============================================================================

export interface TrainingGuideMetadata {
  createdAt: string;                             // ISO timestamp
  updatedAt: string;
  createdBy: string;
  sourceDocument?: string;                       // Original filename
  totalModules: number;
  totalSOPs: number;
  totalCriticalStandards: number;
  totalLabsReferences: number;
}

// ============================================================================
// SOP Module Reference — Used by Sop.moduleRef
// ============================================================================

export interface SopModuleRef {
  moduleId: string;                              // "tg-flr-001-m05"
  moduleCode: string;                            // "TG-FLR-001-M05"
  procedureTitle?: string;                       // "Click-Lock Installation"
}
