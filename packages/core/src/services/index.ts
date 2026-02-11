export { ProjectService } from './project.service';
export type { ActivityService } from './project.service';
export { LoopService } from './loop.service';
export { ProjectLifecycleService } from './project-lifecycle.service';
export type {
  CompletionCheckResult,
  ProjectCompletionRequirements,
  ProjectCompletionWarnings,
  ProjectSummary,
} from './project-lifecycle.service';
export { LoopFactoryService } from './loop-factory.service';
export type { FloorPlanInput, SimpleRoomInput } from './loop-factory.service';

// Property bridge and completion services
export { PropertyBridgeService } from './property-bridge.service';
export type { PropertyPendingData } from './property-bridge.service';
export { ProjectCompletionService } from './project-completion.service';
export type { ActivityService as CompletionActivityService } from './project-completion.service';

// Home Profile service
export { HomeProfileService } from './home-profile.service';
export type { HomeProfileActivityService } from './home-profile.service';
