/**
 * Labs Services — barrel export and LabsServices container
 */

import type { StorageAdapter } from '../../storage/StorageAdapter';
import type { ActivityService } from '../../repositories/activity.repository';

// Repos
import {
  FieldObservationRepository,
  LabsProductRepository,
  LabsTechniqueRepository,
  LabsToolMethodRepository,
  LabsCombinationRepository,
  CrewRatingRepository,
  FieldSubmissionRepository,
  NotificationRepository,
  ExperimentRepository,
  ExperimentParticipationRepository,
  CheckpointResponseRepository,
  KnowledgeItemRepository,
  ConfidenceEventRepository,
  KnowledgeChallengeRepository,
  ObservationKnowledgeLinkRepository,
  SopRepository,
  SopChecklistItemTemplateRepository,
  PendingBatchObservationRepository,
  ToolPlatformRepository,
  ToolResearchItemRepository,
  ToolInventoryRepository,
  LabsTokenRepository,
  LabsTestRepository,
  LabsVoteBallotRepository,
  LabsVoteRepository,
  LabsMaterialChangeRepository,
} from '../../repositories/labs';

// Services
import { FieldObservationService } from './fieldObservation.service';
import { LabsCatalogService } from './labsCatalog.service';
import { CrewRatingService } from './crewRating.service';
import { FieldSubmissionService } from './fieldSubmission.service';
import { NotificationService } from './notification.service';
import { ExperimentService } from './experiment.service';
import { ConfidenceScoringService } from './confidenceScoring.service';
import { KnowledgeItemService } from './knowledgeItem.service';
import { ObservationLinkingService } from './observationLinking.service';
import { SopService } from './sop.service';
import { ObservationTriggerService } from './observationTrigger.service';
import { ToolResearchService } from './toolResearch.service';
import { WorkflowService } from './workflow.service';
import { WorkflowRepository } from '../../repositories/workflow.repository';
import { LabsTokenService } from './labsToken.service';
import { LabsTestService } from './labsTest.service';
import { LabsVotingService } from './labsVoting.service';
import { LabsMaterialChangeService } from './labsMaterialChange.service';

export interface LabsServices {
  // Phase 1: Passive Data Capture
  observations: FieldObservationService;
  catalog: LabsCatalogService;
  crewRatings: CrewRatingService;

  // Phase 2: Field-Initiated Submissions
  submissions: FieldSubmissionService;
  notifications: NotificationService;

  // Phase 3: Active Experiments
  experiments: ExperimentService;
  checkpointResponses: CheckpointResponseRepository;

  // Phase 4: Knowledge + Confidence
  knowledge: KnowledgeItemService;
  confidence: ConfidenceScoringService;

  // Integration: Observation ↔ Knowledge Item Links
  observationLinks: ObservationLinkingService;

  // SOPs (Build 1.5)
  sops: SopService;

  // Build 2: Observation Trigger System
  observationTrigger: ObservationTriggerService;

  // Tool Research
  toolResearch: ToolResearchService;

  // Workflows (Labs — construction sequencing)
  workflows: WorkflowService;

  // Labs Integration: Tokens, Tests, Voting, Material Changes
  tokens: LabsTokenService;
  tests: LabsTestService;
  voting: LabsVotingService;
  materialChanges: LabsMaterialChangeService;
}

export function createLabsServices(
  storage: StorageAdapter,
  activity: ActivityService
): LabsServices {
  // Initialize all repos
  const observationRepo = new FieldObservationRepository(storage);
  const productRepo = new LabsProductRepository(storage);
  const techniqueRepo = new LabsTechniqueRepository(storage);
  const toolMethodRepo = new LabsToolMethodRepository(storage);
  const combinationRepo = new LabsCombinationRepository(storage);
  const crewRatingRepo = new CrewRatingRepository(storage);
  const submissionRepo = new FieldSubmissionRepository(storage);
  const notificationRepo = new NotificationRepository(storage);
  const experimentRepo = new ExperimentRepository(storage);
  const participationRepo = new ExperimentParticipationRepository(storage);
  const checkpointResponseRepo = new CheckpointResponseRepository(storage);
  const knowledgeItemRepo = new KnowledgeItemRepository(storage);
  const confidenceEventRepo = new ConfidenceEventRepository(storage);
  const challengeRepo = new KnowledgeChallengeRepository(storage);

  return {
    // Phase 1
    observations: new FieldObservationService(observationRepo, activity),
    catalog: new LabsCatalogService(productRepo, techniqueRepo, toolMethodRepo, combinationRepo, activity),
    crewRatings: new CrewRatingService(crewRatingRepo, activity),

    // Phase 2
    submissions: new FieldSubmissionService(submissionRepo, notificationRepo, activity),
    notifications: new NotificationService(notificationRepo),

    // Phase 3
    experiments: new ExperimentService(experimentRepo, participationRepo, notificationRepo, activity),
    checkpointResponses: checkpointResponseRepo,

    // Phase 4
    knowledge: new KnowledgeItemService(knowledgeItemRepo, challengeRepo, notificationRepo, activity),
    confidence: new ConfidenceScoringService(knowledgeItemRepo, confidenceEventRepo, challengeRepo, activity),

    // Integration
    observationLinks: new ObservationLinkingService(
      new ObservationKnowledgeLinkRepository(storage),
      observationRepo,
      knowledgeItemRepo
    ),

    // SOPs (Build 1.5)
    sops: new SopService(
      new SopRepository(storage),
      new SopChecklistItemTemplateRepository(storage),
      activity
    ),

    // Build 2: Observation Trigger System
    observationTrigger: new ObservationTriggerService(
      new SopChecklistItemTemplateRepository(storage),
      new SopRepository(storage),
      new PendingBatchObservationRepository(storage),
      new FieldObservationService(observationRepo, activity),
      new ObservationLinkingService(
        new ObservationKnowledgeLinkRepository(storage),
        observationRepo,
        knowledgeItemRepo
      ),
      activity
    ),

    // Tool Research
    toolResearch: new ToolResearchService(
      new ToolPlatformRepository(storage),
      new ToolResearchItemRepository(storage),
      new ToolInventoryRepository(storage),
      activity,
    ),

    // Workflows (Labs — construction sequencing)
    workflows: new WorkflowService(new WorkflowRepository(storage), activity),

    // Labs Integration: Tokens, Tests, Voting, Material Changes
    tokens: new LabsTokenService(new LabsTokenRepository(storage), activity),
    tests: new LabsTestService(new LabsTestRepository(storage), activity),
    voting: new LabsVotingService(
      new LabsVoteBallotRepository(storage),
      new LabsVoteRepository(storage),
      activity
    ),
    materialChanges: new LabsMaterialChangeService(new LabsMaterialChangeRepository(storage), activity),
  };
}

// Re-export service types
export { FieldObservationService } from './fieldObservation.service';
export { LabsCatalogService } from './labsCatalog.service';
export { CrewRatingService } from './crewRating.service';
export { FieldSubmissionService } from './fieldSubmission.service';
export { NotificationService } from './notification.service';
export { ExperimentService } from './experiment.service';
export { ConfidenceScoringService } from './confidenceScoring.service';
export { KnowledgeItemService } from './knowledgeItem.service';
export { ObservationLinkingService } from './observationLinking.service';
export { SopService } from './sop.service';
export { ObservationTriggerService } from './observationTrigger.service';
export { ToolResearchService } from './toolResearch.service';
export { WorkflowService } from './workflow.service';
export { LabsTokenService } from './labsToken.service';
export { LabsTestService } from './labsTest.service';
export { LabsVotingService } from './labsVoting.service';
export { LabsMaterialChangeService } from './labsMaterialChange.service';
