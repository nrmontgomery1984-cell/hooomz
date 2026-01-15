// Enums for constrained values

export enum ProjectStatus {
  LEAD = 'lead',
  QUOTED = 'quoted',
  APPROVED = 'approved',
  IN_PROGRESS = 'in-progress',
  ON_HOLD = 'on-hold',
  COMPLETE = 'complete',
  CANCELLED = 'cancelled',
}

export enum ProjectType {
  NEW_CONSTRUCTION = 'new-construction',
  RENOVATION = 'renovation',
  ADDITION = 'addition',
  KITCHEN_REMODEL = 'kitchen-remodel',
  BATHROOM_REMODEL = 'bathroom-remodel',
  BASEMENT_FINISHING = 'basement-finishing',
  DECK_CONSTRUCTION = 'deck-construction',
  ROOFING = 'roofing',
  SIDING = 'siding',
  WINDOWS_DOORS = 'windows-doors',
  FLOORING = 'flooring',
  PAINTING = 'painting',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  LANDSCAPING = 'landscaping',
  OTHER = 'other',
}

export enum TaskStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  BLOCKED = 'blocked',
  COMPLETE = 'complete',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  PASSED = 'passed',
  FAILED = 'failed',
  PENDING_REINSPECTION = 'pending-reinspection',
}

export enum InspectionType {
  INITIAL = 'initial',
  PROGRESS = 'progress',
  FINAL = 'final',
  FRAMING = 'framing',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  INSULATION = 'insulation',
  DRYWALL = 'drywall',
  FOUNDATION = 'foundation',
  ROOFING = 'roofing',
  HVAC = 'hvac',
  BUILDING_CODE = 'building-code',
  SAFETY = 'safety',
  OTHER = 'other',
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  TEXT = 'text',
  IN_PERSON = 'in-person',
}

export enum UnitOfMeasure {
  SQUARE_FOOT = 'sqft',
  LINEAR_FOOT = 'lf',
  CUBIC_YARD = 'cy',
  EACH = 'each',
  HOUR = 'hour',
  DAY = 'day',
  LOT = 'lot',
  GALLON = 'gal',
  POUND = 'lb',
  TON = 'ton',
  BUNDLE = 'bundle',
  BOX = 'box',
  BAG = 'bag',
}

export enum CostCategory {
  SITE_WORK = 'site-work',
  FOUNDATION = 'foundation',
  FRAMING = 'framing',
  EXTERIOR = 'exterior',
  ROOFING = 'roofing',
  WINDOWS_DOORS = 'windows-doors',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HVAC = 'hvac',
  INSULATION = 'insulation',
  DRYWALL = 'drywall',
  INTERIOR_TRIM = 'interior-trim',
  FLOORING = 'flooring',
  PAINTING = 'painting',
  CABINETS_COUNTERTOPS = 'cabinets-countertops',
  APPLIANCES = 'appliances',
  FIXTURES = 'fixtures',
  LANDSCAPING = 'landscaping',
  PERMITS_FEES = 'permits-fees',
  LABOR = 'labor',
  MATERIALS = 'materials',
  EQUIPMENT_RENTAL = 'equipment-rental',
  SUBCONTRACTORS = 'subcontractors',
  CONTINGENCY = 'contingency',
  OTHER = 'other',
}

// NOTE: Core entity types (Project, Customer, Task, LineItem, Inspection, Address, Metadata)
// are now inferred from Zod schemas in ../schemas/index.ts
// Import those types from the schemas file or from the root index.ts
