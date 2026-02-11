// Property types
export type {
  Property,
  PropertyType,
  PropertyOwnershipHistory,
  OwnershipTransferType,
  PropertyPendingData,
  PendingDataType,
} from './property';

// Project types
export type {
  Project,
  ProjectStatus,
  ProjectHealth,
} from './project';

// Loop types
export type {
  LoopContext,
  LoopType,
  LoopIteration,
  LoopStatus,
  LoopChildCounts,
} from './loop';
export { PROPERTY_LOOP_TYPES } from './loop';

// Activity types
export type {
  ActivityEvent,
  ActorType,
  ActivityEventType,
  InputMethod,
  ActivityQueryOptions,
  PaginatedActivityResult,
  CreateActivityEventInput,
} from './activity';
export {
  EVENT_VISIBILITY_DEFAULTS,
  EVENT_CATEGORIES,
  EVENT_ICONS,
  DEFAULT_EVENT_ICON,
  getEventIcon,
  SYSTEM_USER,
} from './activity';

// Estimate types
export type {
  Estimate,
  EstimateStatus,
  EstimateSection,
  PricingTier,
  EstimateLineItem,
  TierRelationship,
  EstimateLineMaterial,
  EstimatePaymentSchedule,
  PaymentTrigger,
} from './estimate';

// Task types
export type {
  TaskTemplate,
  BindingPattern,
  TaskInstance,
  TaskStatus,
  TaskBlockedInfo,
  BlockedReason,
} from './task';

// Team types
export type {
  TeamMember,
  TeamRole,
  TimeEntry,
  GpsCoordinate,
} from './team';

// Photo/Field docs types
export type {
  Photo,
  PhotoTag,
  Inspection,
  InspectionStatus,
  InspectionResult,
  Document,
  DocumentType,
} from './photo';

// Customer types
export type {
  Customer,
  CustomerSource,
  ContactMethod,
  CustomerProperty,
  PropertyRelationship,
  CustomerSelection,
  SelectionTier,
  ChangeOrder,
  ChangeOrderStatus,
  ChangeOrderLineItem,
} from './customer';

// Property Bridge types
export type {
  PropertyPendingDataType,
  PropertyPendingData as BridgePendingData,
  ProjectCompletionChecklist,
  MaterialRecord,
} from './property-bridge.types';

// Portal types
export type {
  DocumentCategory,
  PortalDocumentShare,
} from './portal.types';
export { DOCUMENT_EXPLANATIONS, PORTAL_WELCOME_MESSAGE } from './portal.types';

// Completion types
export type {
  HomeownerManual,
  SystemRecord,
  WarrantyRecord,
  MaintenanceScheduleRecord,
} from './completion.types';
