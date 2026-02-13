/**
 * Labs Repositories — barrel export
 */

// Phase 1: Passive Data Capture
export { FieldObservationRepository } from './fieldObservation.repository';
export { LabsProductRepository } from './labsProduct.repository';
export { LabsTechniqueRepository } from './labsTechnique.repository';
export { LabsToolMethodRepository } from './labsToolMethod.repository';
export { LabsCombinationRepository } from './labsCombination.repository';
export { CrewRatingRepository } from './crewRating.repository';

// Phase 2: Field-Initiated Submissions
export { FieldSubmissionRepository } from './fieldSubmission.repository';
export { NotificationRepository } from './notification.repository';

// Phase 3: Active Experiments
export { ExperimentRepository } from './experiment.repository';
export { ExperimentParticipationRepository } from './experimentParticipation.repository';
export { CheckpointResponseRepository } from './checkpointResponse.repository';

// Phase 4: Knowledge Items + Confidence Scoring
export { KnowledgeItemRepository } from './knowledgeItem.repository';
export { ConfidenceEventRepository } from './confidenceEvent.repository';
export { KnowledgeChallengeRepository } from './knowledgeChallenge.repository';

// Integration: Observation ↔ Knowledge Item Links
export { ObservationKnowledgeLinkRepository } from './observationKnowledgeLink.repository';

// SOPs (Build 1.5)
export { SopRepository } from './sop.repository';
export { SopChecklistItemTemplateRepository } from './sopChecklistItemTemplate.repository';

// Build 2: Observation Trigger System
export { PendingBatchObservationRepository } from './pendingBatchObservation.repository';

// Tool Research
export { ToolPlatformRepository } from './toolPlatform.repository';
export { ToolResearchItemRepository } from './toolResearchItem.repository';
export { ToolInventoryRepository } from './toolInventory.repository';
