/**
 * Labs Field Data Collection System — Type Definitions
 *
 * Covers all 4 phases:
 * 1. Passive Data Capture (field observations, catalogs, crew ratings)
 * 2. Field-Initiated Submissions
 * 3. Active Experiments
 * 4. Knowledge Items + Confidence Scoring
 */

import type { Metadata } from '../schemas';

// ============================================================================
// Knowledge Type — the 10 types of testable claims
// ============================================================================

export type KnowledgeType =
  | 'product'
  | 'material'
  | 'technique'
  | 'action'
  | 'procedure'
  | 'timing'
  | 'combination'
  | 'tool_method'
  | 'environmental_rule'
  | 'specification';

// ============================================================================
// Phase 1: Passive Data Capture
// ============================================================================

/** Core observation record — one per significant action on a job */
export interface FieldObservation {
  id: string;
  projectId: string;
  taskId?: string;
  knowledgeType: KnowledgeType;

  // Catalog references
  productId?: string;
  techniqueId?: string;
  toolMethodId?: string;
  combinationId?: string;

  // Context
  workCategoryCode?: string;
  trade?: string;
  stageCode?: string;
  locationId?: string;

  // Environmental (auto-populated where possible)
  environment?: ObservationEnvironment;

  // Timing
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;

  // Observation content
  notes?: string;
  photoIds?: string[];

  // Crew assessment
  crewMemberId: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  quality?: 1 | 2 | 3 | 4 | 5;

  // How this was captured
  captureMethod: 'automatic' | 'manual' | 'callback';

  // Labs linkage
  relatedKnowledgeItemIds?: string[];

  // SOP version tracking (Integration Spec V)
  sopVersionId?: string;

  // Deviation tracking (Build 2: Capture Mechanism)
  deviated?: boolean;
  deviationFields?: string[];
  deviationReason?: string;

  metadata: Metadata;
}

export interface ObservationEnvironment {
  setting?: 'interior' | 'exterior';
  substrate?: string;
  areaType?: string;
  temperatureC?: number;
  humidityPercent?: number;
  weatherConditions?: string;
}

/** Product catalog item */
export interface LabsProduct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  sku?: string;
  tags?: string[];
  addedBy: string;
  isActive: boolean;
  metadata: Metadata;
}

/** Technique catalog item */
export interface LabsTechnique {
  id: string;
  name: string;
  category: string;
  description?: string;
  sopIds?: string[];
  isDefault?: boolean;
  addedBy: string;
  isActive: boolean;
  metadata: Metadata;
}

/** Tool/method catalog item */
export interface LabsToolMethod {
  id: string;
  toolType: string;
  name: string;
  specification?: string;
  brand?: string;
  addedBy: string;
  isActive: boolean;
  metadata: Metadata;
}

/** Combination — tracked pairing of product + technique + tool */
export interface LabsCombination {
  id: string;
  components: CombinationComponent[];
  timesObserved: number;
  avgQuality?: number;
  notes?: string;
  autoDetected: boolean;
  metadata: Metadata;
}

export interface CombinationComponent {
  type: 'product' | 'technique' | 'tool_method' | 'substrate';
  referenceId?: string;
  name: string;
}

/** Crew rating submitted at job closeout */
export interface CrewRating {
  id: string;
  projectId: string;
  taskId?: string;
  submittedBy: string;
  timestamp: string;
  productRatings: ItemRating[];
  techniqueRatings: ItemRating[];
  overallDifficulty?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  metadata: Metadata;
}

export interface ItemRating {
  itemId: string;
  itemName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

// ============================================================================
// Phase 2: Field-Initiated Submissions
// ============================================================================

export type SubmissionCategory =
  | 'product_issue'
  | 'technique_improvement'
  | 'procedure_suggestion'
  | 'tool_finding'
  | 'timing_discrepancy'
  | 'combination_discovery'
  | 'environmental_observation'
  | 'safety_concern'
  | 'new_idea'
  | 'other';

export type SubmissionStatus =
  | 'submitted'
  | 'reviewed'
  | 'logged_as_observation'
  | 'promoted_to_experiment'
  | 'triggered_review'
  | 'archived';

export type SubmissionUrgency = 'good_to_know' | 'needs_attention';

export interface FieldSubmission {
  id: string;
  description: string;
  category: SubmissionCategory;
  urgency: SubmissionUrgency;

  // Evidence
  photoIds?: string[];

  // Context (auto-populated)
  submittedBy: string;
  division?: string;
  projectId?: string;
  jobType?: string;

  // Product/technique reference
  relatedProductId?: string;
  relatedProductName?: string;
  relatedTechniqueId?: string;

  // Labs processing
  status: SubmissionStatus;
  labsNotes?: string;
  linkedExperimentId?: string;
  reviewedBy?: string;
  reviewedAt?: string;

  // Grouping
  similarSubmissionIds?: string[];

  metadata: Metadata;
}

// ============================================================================
// Phase 3: Active Experiments
// ============================================================================

export type ExperimentStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

export interface Experiment {
  id: string;
  title: string;
  hypothesis?: string;
  knowledgeType: KnowledgeType;
  status: ExperimentStatus;

  // What we're testing
  testVariables: TestVariable[];
  heldConstant?: HeldConstant[];

  // Matching criteria for qualifying jobs
  matchCriteria: ExperimentMatchCriteria;

  // Sample requirements
  requiredSampleSize: number;
  currentSampleCounts: Record<string, number>;

  // Checkpoints
  checkpoints: ExperimentCheckpoint[];

  // Long-tail followups
  followups?: ExperimentFollowup[];

  // Results
  resultsSummary?: string;

  // Admin
  designedBy: string;
  startedAt?: string;
  completedAt?: string;
  metadata: Metadata;
}

export interface TestVariable {
  id: string;
  type: string;
  name: string;
  description?: string;
  referenceId?: string;
  role: 'test_subject' | 'control' | 'comparison';
  instructions?: string;
}

export interface HeldConstant {
  type: string;
  referenceId?: string;
  name: string;
  description?: string;
}

export interface ExperimentMatchCriteria {
  jobTypes?: string[];
  environment?: 'interior' | 'exterior' | 'either';
  workCategories?: string[];
  divisions?: string[];
  minParticipantSkill?: string;
}

export interface ExperimentCheckpoint {
  id: string;
  name: string;
  offsetMinutes: number;
  instructions: string;
  ratingPrompt?: string;
  photoRequired: boolean;
  reminderDelayMinutes: number;
  escalationDelayMinutes: number;
  maxDeferralMinutes?: number;
}

export interface ExperimentFollowup {
  id: string;
  name: string;
  daysFromApplication: number;
  instructions: string;
  photoRequired: boolean;
  deferralWindowDays: number;
}

export type ParticipationStatus =
  | 'offered'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'withdrawn';

export interface ExperimentParticipation {
  id: string;
  experimentId: string;
  projectId: string;
  participantId: string;
  variableAssigned: string;

  status: ParticipationStatus;

  checkpointResponses: CheckpointResponseEntry[];
  followupResponses?: FollowupResponseEntry[];

  offeredAt: string;
  acceptedAt?: string;
  metadata: Metadata;
}

export interface CheckpointResponseEntry {
  checkpointId: string;
  status: 'pending' | 'completed' | 'missed' | 'deferred';
  scheduledAt: string;
  completedAt?: string;
  photoIds?: string[];
  rating?: number;
  notes?: string;
  reminderSent: boolean;
  escalationSent: boolean;
}

export interface FollowupResponseEntry {
  followupId: string;
  status: 'pending' | 'completed' | 'missed';
  scheduledAt: string;
  completedAt?: string;
  photoIds?: string[];
  notes?: string;
}

// ============================================================================
// Phase 4: Knowledge Items + Confidence Scoring
// ============================================================================

export type KnowledgeItemStatus =
  | 'draft'
  | 'published'
  | 'under_review'
  | 'deprecated';

export interface KnowledgeItem {
  id: string;
  knowledgeType: KnowledgeType;
  category: string;
  title: string;
  summary: string;
  details?: string;

  // References
  productIds?: string[];
  techniqueIds?: string[];
  toolMethodIds?: string[];
  relatedObservationIds?: string[];
  relatedExperimentIds?: string[];

  // Confidence
  confidenceScore: number;
  lastConfidenceUpdate: string;

  // Scoring inputs
  observationCount: number;
  experimentCount: number;
  crewAgreementRate?: number;
  successRate?: number;

  // Status
  status: KnowledgeItemStatus;
  lastReviewDate?: string;
  nextReviewDate?: string;

  // Cost data
  costData?: KnowledgeCostData;

  createdBy: string;
  tags?: string[];
  metadata: Metadata;
}

export interface KnowledgeCostData {
  avgMaterialCostPerUnit?: number;
  avgLaborMinutes?: number;
  avgWastePercentage?: number;
  actualCoverageVsSpec?: number;
  callbackCostAvg?: number;
  totalCostComparison?: string;
  lastCalculated?: string;
}

export type ConfidenceEventType =
  | 'observation_added'
  | 'experiment_completed'
  | 'crew_feedback_positive'
  | 'crew_feedback_negative'
  | 'expert_review'
  | 'challenge_filed'
  | 'challenge_resolved'
  | 'age_decay'
  | 'manual_adjustment';

export interface ConfidenceEvent {
  id: string;
  knowledgeItemId: string;
  eventType: ConfidenceEventType;
  confidenceChange: number;
  newConfidenceScore: number;
  sourceId?: string;
  userId?: string;
  notes?: string;
  timestamp: string;
  metadata: Metadata;
}

export type ChallengeStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'needs_more_data';

export interface KnowledgeChallenge {
  id: string;
  knowledgeItemId: string;
  submittedBy: string;
  reason: string;
  description: string;
  supportingEvidenceIds?: string[];
  status: ChallengeStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
  confidenceAdjustment?: number;
  metadata: Metadata;
}

// ============================================================================
// Notifications (shared across phases)
// ============================================================================

export type NotificationType =
  | 'labs_submission_update'
  | 'experiment_checkpoint'
  | 'experiment_invitation'
  | 'confidence_alert'
  | 'challenge_update'
  | 'general';

export interface LabsNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  isRead: boolean;
  timestamp: string;
  metadata: Metadata;
}
