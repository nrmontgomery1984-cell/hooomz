/**
 * Integration Types — Data Spine
 *
 * Types for the integration layer connecting Labs, SOPs, Tasks, Estimates,
 * and the Activity Log. Implements agreements from the Master Integration Spec.
 */

import type { Metadata } from '../schemas';
import type { KnowledgeType } from './labs';

// ============================================================================
// Observation ↔ Knowledge Item Link (Many-to-Many)
// ============================================================================

export type ObservationLinkType = 'auto_detected' | 'labs_assigned' | 'experiment_required';

export interface ObservationKnowledgeLink {
  id: string;
  observationId: string;
  knowledgeItemId: string;
  linkType: ObservationLinkType;
  linkConfidence: number | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Change Orders
// ============================================================================

export type ChangeOrderInitiatorType =
  | 'client_request'
  | 'contractor_recommendation'
  | 'site_condition'
  | 'sub_trade';

export type ChangeOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'declined'
  | 'cancelled';

export interface ChangeOrder {
  id: string;
  projectId: string;
  coNumber: string;
  title: string;
  description: string;
  initiatorType: ChangeOrderInitiatorType;
  initiatedBy: string;
  costImpact: number;
  scheduleImpactDays: number;
  status: ChangeOrderStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  declinedReason: string | null;
  createdBy: string;
  metadata: Metadata;
}

export interface ChangeOrderLineItem {
  id: string;
  changeOrderId: string;
  description: string;
  sopCode: string | null;
  category: string;
  estimatedHours: number;
  estimatedMaterialCost: number;
  estimatedLaborCost: number;
  estimatedTotal: number;
  generatesTaskTemplates: boolean;
  taskTemplateIds: string[];
  metadata: Metadata;
}

// ============================================================================
// Task Source Tracking
// ============================================================================

export type WorkSource = 'estimate' | 'change_order' | 'uncaptured';

export type UncapturedResolution = 'converted_to_co' | 'absorbed' | 'deleted';

/** Fields added to task instances for work authorization tracking */
export interface TaskSourceFields {
  workSource: WorkSource;
  workSourceId: string | null;
  changeOrderId: string | null;
  changeOrderLineItemId: string | null;
  isUncaptured: boolean;
  uncapturedResolution: UncapturedResolution | null;
  uncapturedResolvedAt: string | null;
  uncapturedResolvedBy: string | null;
}

// ============================================================================
// Callback Projects
// ============================================================================

export type IntegrationProjectType = 'standard' | 'callback';

export type CallbackReason =
  | 'warranty_claim'
  | 'quality_issue'
  | 'customer_complaint'
  | 'proactive_followup';

/** Fields added to projects for type and callback tracking */
export interface ProjectIntegrationFields {
  integrationProjectType: IntegrationProjectType;
  linkedProjectId: string | null;
  callbackReason: CallbackReason | null;
  callbackReportedAt: string | null;
  observationModeOverride: ObservationMode | null;
  activeExperimentIds: string[];
}

// ============================================================================
// SOP Versioning
// ============================================================================

export interface SOPVersionFields {
  version: number;
  versionNotes: string | null;
  previousVersionId: string | null;
  isCurrent: boolean;
  effectiveDate: string;
  supersededDate: string | null;
}

/** Fields added to task templates/instances for SOP version tracking */
export interface TaskSOPVersionFields {
  sopVersionId: string;
  sopVersionNumber: number;
}

// ============================================================================
// Observation Mode Configuration (Agreement C)
// ============================================================================

export type ObservationMode = 'minimal' | 'standard' | 'detailed';

/** SOP-level observation defaults */
export interface SOPObservationConfig {
  defaultObservationMode: ObservationMode;
}

/** Checklist item template fields for Labs bridge */
export interface ChecklistItemLabsConfig {
  generatesObservation: boolean;
  observationKnowledgeType: KnowledgeType | null;
  requiresPhoto: boolean;
  hasTimingFollowup: {
    enabled: boolean;
    delayMinutes: number;
    followupPrompt: string;
  } | null;
}

// ============================================================================
// SOP Entity Types (Build 1.5)
// ============================================================================

export type SopStatus = 'draft' | 'active' | 'archived' | 'future_experiment';

export type CertificationLevel = 'apprentice' | 'journeyman' | 'master';

export type ChecklistType = 'activity' | 'daily' | 'qc';

export type ChecklistCategory = 'safety' | 'quality' | 'procedure' | 'inspection' | 'documentation';

export type TriggerTiming = 'batch' | 'on_check';

// SCRIPT Framework — 6 phases for SOP organization
export type ScriptPhase = 'shield' | 'clear' | 'ready' | 'install' | 'punch' | 'turnover';

export interface TimingFollowup {
  enabled: boolean;
  delayMinutes: number;
  followupPrompt: string;
}

export interface Sop {
  id: string;

  // Identity
  sopCode: string;
  title: string;
  description: string | null;
  tradeFamily: string;

  // Versioning (Master Integration Spec, Agreement V)
  version: number;
  versionNotes: string | null;
  previousVersionId: string | null;
  isCurrent: boolean;
  effectiveDate: string;
  supersededDate: string | null;

  // Observation configuration (Master Integration Spec, Agreement C)
  defaultObservationMode: ObservationMode;

  // Training configuration (Master Integration Spec, Agreement E)
  certificationLevel: CertificationLevel;
  requiredSupervisedCompletions: number;
  reviewQuestionCount: number;
  reviewPassThreshold: number;

  // Content references
  fieldGuideRef: string | null;

  // Status
  status: SopStatus;

  // Extra
  createdBy: string | null;

  metadata: Metadata;
}

export interface SopChecklistItemTemplate {
  id: string;
  sopId: string;

  // Identity
  stepNumber: number;
  title: string;
  description: string | null;

  // Checklist classification
  checklistType: ChecklistType;
  category: ChecklistCategory;
  isCritical: boolean;

  // Labs bridge configuration (Master Integration Spec, Agreement C)
  generatesObservation: boolean;
  observationKnowledgeType: KnowledgeType | null;
  requiresPhoto: boolean;
  hasTimingFollowup: TimingFollowup | null;

  // Observation trigger timing (hybrid model)
  triggerTiming: TriggerTiming;

  // Default values for pre-fill (Master Integration Spec, Agreement H)
  defaultProductId: string | null;
  defaultTechniqueId: string | null;
  defaultToolId: string | null;

  // SCRIPT Framework phase assignment (null = not yet categorized)
  scriptPhase: ScriptPhase | null;

  metadata: Metadata;
}

// ============================================================================
// Build 2: Observation Trigger System
// ============================================================================

export type ConditionAssessment = 'good' | 'fair' | 'poor';

/** Pre-filled observation draft from SOP template defaults */
export interface ObservationDraft {
  knowledgeType: KnowledgeType;
  productId: string | null;
  techniqueId: string | null;
  toolMethodId: string | null;

  // Mode-dependent fields
  notes: string | null;
  photoIds: string[];
  conditionAssessment: ConditionAssessment | null;
  requiresPhoto: boolean;
  requiresNotes: boolean;
  requiresCondition: boolean;
}

/** Queued observation awaiting batch confirmation at task/shift end */
export interface PendingBatchObservation {
  id: string;
  taskId: string;
  sopId: string;
  checklistItemId: string;
  crewMemberId: string;
  projectId: string;

  // Pre-filled draft data
  draft: ObservationDraft;

  // Queue state
  status: 'pending' | 'confirmed' | 'skipped';
  queuedAt: string;
  processedAt: string | null;

  metadata: Metadata;
}

/** Result from handling a checklist item completion */
export interface TriggerResult {
  action: 'immediate_confirm' | 'queued_batch' | 'no_observation';
  draft?: ObservationDraft;
  pendingBatchId?: string;
}

/** Summary of batch processing */
export interface BatchResult {
  totalItems: number;
  confirmed: number;
  skipped: number;
  observationsCreated: string[];
}

// ============================================================================
// Build 3a: Time Clock + Crew Session
// ============================================================================

/** Active crew session — "who is holding the phone right now" */
export interface ActiveCrewSession {
  id: string;
  crewMemberId: string;
  crewMemberName: string;
  projectId: string;
  startedAt: string;
  isActive: boolean;
}

/** Runtime state for the currently-active clock session */
export interface TimeClockState {
  id: string;
  crewMemberId: string;
  projectId: string;
  isClockedIn: boolean;
  currentEntryId?: string;
  currentTaskId?: string;
  currentTaskTitle?: string;
  isOnBreak: boolean;
  clockInTime?: string;
  lastInteractionTime: string;
}

/** Enriched checklist step with who/when tracking */
export interface CompletedStep {
  stepNumber: number;
  completedAt: string;
  crewMemberId: string;
}

// ============================================================================
// Build 3b: Task Instance Pipeline
// ============================================================================

export type BlueprintStatus = 'pending' | 'deployed' | 'cancelled';

/** Intermediate record between estimate line item and deployable task */
export interface SopTaskBlueprint {
  id: string;
  projectId: string;
  name: string;
  sopId: string;
  sopCode: string;
  sopVersion: number;
  workSource: WorkSource;
  workSourceId: string;
  estimatedHoursPerUnit: number;
  totalUnits: number;
  loopContextLabel?: string;
  isLooped: boolean;
  status: BlueprintStatus;
  createdAt: string;
  updatedAt: string;
}

/** Sidecar record linking an existing Task to its pipeline context */
export interface DeployedTask {
  id: string;
  taskId: string;
  blueprintId: string;
  sopId: string;
  sopCode: string;
  sopVersion: number;
  loopBindingLabel?: string;
  loopIterationId?: string;
  createdAt: string;
}

// ============================================================================
// Build 3c: Crew Members
// ============================================================================

export type CrewTier = 'learner' | 'proven' | 'lead' | 'master';

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  tier: CrewTier;
  tradeSpecialties: string[];
  wageRate: number;
  chargedRate: number;
  isActive: boolean;
  startDate: string;
  certifications: string[];
  metadata: Metadata;
}

// ============================================================================
// Build 3c: Training Records
// ============================================================================

export type TrainingStatus = 'in_progress' | 'review_ready' | 'certified';

export interface SupervisedCompletion {
  taskId: string;
  projectId: string;
  completedAt: string;
  supervisorId: string;
  supervisorName: string;
  notes: string | null;
}

export interface ReviewAttempt {
  attemptNumber: number;
  date: string;
  score: number;
  passed: boolean;
  reviewedBy: string;
  notes: string | null;
}

export interface TrainingRecord {
  id: string;
  crewMemberId: string;
  sopId: string;
  sopCode: string;
  status: TrainingStatus;
  supervisedCompletions: SupervisedCompletion[];
  reviewAttempts: ReviewAttempt[];
  certifiedAt: string | null;
  certifiedBy: string | null;
  metadata: Metadata;
}

// ============================================================================
// Build 3c: Task Budget (Estimate → Budget Conversion)
// ============================================================================

export interface TaskBudget {
  id: string;
  taskId: string;
  blueprintId: string;
  projectId: string;
  sopCode: string;
  budgetedHours: number;
  actualHours: number;
  budgetedMaterialCost: number;
  actualMaterialCost: number;
  crewWageRate: number;
  chargedRate: number;
  efficiency: number | null;
  status: 'active' | 'complete' | 'over_budget';
  metadata: Metadata;
}

// ============================================================================
// Calendar / Scheduling
// ============================================================================

export type CrewScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped';

export interface CrewScheduleBlock {
  id: string;
  taskId: string;
  projectId: string;
  crewMemberId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  estimatedHours: number;
  actualHours: number;
  status: CrewScheduleStatus;
  trade: string;
  workflowPhase: string;
  title: string;
  sopCode: string | null;
  syncStatus: 'pending' | 'synced';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Schedule Notes (Scoped Manager Notes)
// ============================================================================

export type NoteAudience = 'crew_all' | 'site_all' | 'task_crew' | 'person';

export interface ScheduleNote {
  id: string;
  blockId: string;
  projectId: string;
  date: string;
  authorId: string;
  authorName: string;
  audience: NoteAudience;
  targetCrewMemberId: string | null;
  targetCrewMemberName: string | null;
  body: string;
  syncStatus: 'pending' | 'synced';
  createdAt: string;
  updatedAt: string;
}
