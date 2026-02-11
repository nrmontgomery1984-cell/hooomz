import {
  ProjectStatus,
  ProjectType,
  TaskStatus,
  TaskPriority,
  InspectionStatus,
  InspectionType,
  ContactMethod,
  UnitOfMeasure,
  CostCategory,
  Division,
  WorkCategory,
  ProjectStage,
  InteriorsBundle,
  WORK_CATEGORY_META,
  PROJECT_STAGE_META,
  INTERIORS_BUNDLE_META,
  getWorkCategoriesForDivision,
  getStagesForDivision,
} from '../types';

// Project Status Constants
export const PROJECT_STATUSES = [
  { value: ProjectStatus.LEAD, label: 'Lead' },
  { value: ProjectStatus.QUOTED, label: 'Quoted' },
  { value: ProjectStatus.APPROVED, label: 'Approved' },
  { value: ProjectStatus.IN_PROGRESS, label: 'In Progress' },
  { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
  { value: ProjectStatus.COMPLETE, label: 'Complete' },
  { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
] as const;

// Project Type Constants - Residential Construction in New Brunswick
export const PROJECT_TYPES = [
  { value: ProjectType.NEW_CONSTRUCTION, label: 'New Construction' },
  { value: ProjectType.RENOVATION, label: 'Renovation' },
  { value: ProjectType.ADDITION, label: 'Addition' },
  { value: ProjectType.KITCHEN_REMODEL, label: 'Kitchen Remodel' },
  { value: ProjectType.BATHROOM_REMODEL, label: 'Bathroom Remodel' },
  { value: ProjectType.BASEMENT_FINISHING, label: 'Basement Finishing' },
  { value: ProjectType.DECK_CONSTRUCTION, label: 'Deck Construction' },
  { value: ProjectType.ROOFING, label: 'Roofing' },
  { value: ProjectType.SIDING, label: 'Siding' },
  { value: ProjectType.WINDOWS_DOORS, label: 'Windows & Doors' },
  { value: ProjectType.FLOORING, label: 'Flooring' },
  { value: ProjectType.PAINTING, label: 'Painting' },
  { value: ProjectType.ELECTRICAL, label: 'Electrical' },
  { value: ProjectType.PLUMBING, label: 'Plumbing' },
  { value: ProjectType.HVAC, label: 'HVAC' },
  { value: ProjectType.LANDSCAPING, label: 'Landscaping' },
  { value: ProjectType.OTHER, label: 'Other' },
] as const;

// Task Status Constants
export const TASK_STATUSES = [
  { value: TaskStatus.NOT_STARTED, label: 'Not Started' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { value: TaskStatus.BLOCKED, label: 'Blocked' },
  { value: TaskStatus.COMPLETE, label: 'Complete' },
] as const;

// Task Priority Constants
export const TASK_PRIORITIES = [
  { value: TaskPriority.LOW, label: 'Low', color: '#6B7280' },
  { value: TaskPriority.MEDIUM, label: 'Medium', color: '#3B82F6' },
  { value: TaskPriority.HIGH, label: 'High', color: '#F59E0B' },
  { value: TaskPriority.URGENT, label: 'Urgent', color: '#EF4444' },
] as const;

// Inspection Status Constants
export const INSPECTION_STATUSES = [
  { value: InspectionStatus.SCHEDULED, label: 'Scheduled' },
  { value: InspectionStatus.PASSED, label: 'Passed' },
  { value: InspectionStatus.FAILED, label: 'Failed' },
  { value: InspectionStatus.PENDING_REINSPECTION, label: 'Pending Re-inspection' },
] as const;

// Inspection Type Constants
export const INSPECTION_TYPES = [
  { value: InspectionType.INITIAL, label: 'Initial Inspection' },
  { value: InspectionType.PROGRESS, label: 'Progress Inspection' },
  { value: InspectionType.FINAL, label: 'Final Inspection' },
  { value: InspectionType.FRAMING, label: 'Framing Inspection' },
  { value: InspectionType.ELECTRICAL, label: 'Electrical Inspection' },
  { value: InspectionType.PLUMBING, label: 'Plumbing Inspection' },
  { value: InspectionType.INSULATION, label: 'Insulation Inspection' },
  { value: InspectionType.DRYWALL, label: 'Drywall Inspection' },
  { value: InspectionType.FOUNDATION, label: 'Foundation Inspection' },
  { value: InspectionType.ROOFING, label: 'Roofing Inspection' },
  { value: InspectionType.HVAC, label: 'HVAC Inspection' },
  { value: InspectionType.BUILDING_CODE, label: 'Building Code Inspection' },
  { value: InspectionType.SAFETY, label: 'Safety Inspection' },
  { value: InspectionType.OTHER, label: 'Other' },
] as const;

// Contact Method Constants
export const CONTACT_METHODS = [
  { value: ContactMethod.EMAIL, label: 'Email' },
  { value: ContactMethod.PHONE, label: 'Phone' },
  { value: ContactMethod.TEXT, label: 'Text' },
  { value: ContactMethod.IN_PERSON, label: 'In Person' },
] as const;

// Units of Measure Constants
export const UNITS_OF_MEASURE = [
  { value: UnitOfMeasure.SQUARE_FOOT, label: 'Square Foot', abbr: 'sq.ft.' },
  { value: UnitOfMeasure.LINEAR_FOOT, label: 'Linear Foot', abbr: 'l.f.' },
  { value: UnitOfMeasure.CUBIC_YARD, label: 'Cubic Yard', abbr: 'cu.yd.' },
  { value: UnitOfMeasure.EACH, label: 'Each', abbr: 'ea.' },
  { value: UnitOfMeasure.HOUR, label: 'Hour', abbr: 'hr.' },
  { value: UnitOfMeasure.DAY, label: 'Day', abbr: 'day' },
  { value: UnitOfMeasure.LOT, label: 'Lot', abbr: 'lot' },
  { value: UnitOfMeasure.GALLON, label: 'Gallon', abbr: 'gal.' },
  { value: UnitOfMeasure.POUND, label: 'Pound', abbr: 'lb.' },
  { value: UnitOfMeasure.TON, label: 'Ton', abbr: 'ton' },
  { value: UnitOfMeasure.BUNDLE, label: 'Bundle', abbr: 'bdl.' },
  { value: UnitOfMeasure.BOX, label: 'Box', abbr: 'box' },
  { value: UnitOfMeasure.BAG, label: 'Bag', abbr: 'bag' },
] as const;

// Cost Category Constants
export const COST_CATEGORIES = [
  { value: CostCategory.SITE_WORK, label: 'Site Work' },
  { value: CostCategory.FOUNDATION, label: 'Foundation' },
  { value: CostCategory.FRAMING, label: 'Framing' },
  { value: CostCategory.EXTERIOR, label: 'Exterior' },
  { value: CostCategory.ROOFING, label: 'Roofing' },
  { value: CostCategory.WINDOWS_DOORS, label: 'Windows & Doors' },
  { value: CostCategory.PLUMBING, label: 'Plumbing' },
  { value: CostCategory.ELECTRICAL, label: 'Electrical' },
  { value: CostCategory.HVAC, label: 'HVAC' },
  { value: CostCategory.INSULATION, label: 'Insulation' },
  { value: CostCategory.DRYWALL, label: 'Drywall' },
  { value: CostCategory.INTERIOR_TRIM, label: 'Interior Trim' },
  { value: CostCategory.FLOORING, label: 'Flooring' },
  { value: CostCategory.PAINTING, label: 'Painting' },
  { value: CostCategory.CABINETS_COUNTERTOPS, label: 'Cabinets & Countertops' },
  { value: CostCategory.APPLIANCES, label: 'Appliances' },
  { value: CostCategory.FIXTURES, label: 'Fixtures' },
  { value: CostCategory.LANDSCAPING, label: 'Landscaping' },
  { value: CostCategory.PERMITS_FEES, label: 'Permits & Fees' },
  { value: CostCategory.LABOR, label: 'Labor' },
  { value: CostCategory.MATERIALS, label: 'Materials' },
  { value: CostCategory.EQUIPMENT_RENTAL, label: 'Equipment Rental' },
  { value: CostCategory.SUBCONTRACTORS, label: 'Subcontractors' },
  { value: CostCategory.CONTINGENCY, label: 'Contingency' },
  { value: CostCategory.OTHER, label: 'Other' },
] as const;

// Canadian Provinces (for New Brunswick context)
export const CANADIAN_PROVINCES = [
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'QC', label: 'Quebec' },
  { value: 'ON', label: 'Ontario' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'YT', label: 'Yukon' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
] as const;

// Default Values
export const DEFAULT_COUNTRY = 'Canada';
export const DEFAULT_PROVINCE = 'NB';
export const DEFAULT_CURRENCY = 'CAD';

// Validation Constants
export const POSTAL_CODE_REGEX = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
export const PHONE_REGEX = /^(\+1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// Division Constants
// ============================================================================

export const DIVISIONS = [
  { value: Division.INTERIORS, label: 'Hooomz Interiors', description: 'Flooring, paint, trim, accent walls' },
  { value: Division.EXTERIORS, label: 'Hooomz Exteriors', description: 'Roofing, siding, decks, windows/doors' },
  { value: Division.DIY, label: 'Hooomz DIY', description: 'Slat wall system' },
  { value: Division.MAINTENANCE, label: 'Hooomz Maintenance', description: 'Seasonal packages, Home Partner tier' },
] as const;

// ============================================================================
// Work Category Constants (by Division)
// ============================================================================

/** All work categories with metadata */
export const WORK_CATEGORIES = Object.entries(WORK_CATEGORY_META).map(([code, meta]) => ({
  value: code as WorkCategory,
  label: meta.name,
  icon: meta.icon,
  order: meta.order,
})).sort((a, b) => a.order - b.order);

/** Work categories for Interiors division */
export const INTERIORS_WORK_CATEGORIES = getWorkCategoriesForDivision(Division.INTERIORS).map(code => ({
  value: code,
  label: WORK_CATEGORY_META[code].name,
  icon: WORK_CATEGORY_META[code].icon,
  order: WORK_CATEGORY_META[code].order,
}));

/** Work categories for Exteriors division */
export const EXTERIORS_WORK_CATEGORIES = getWorkCategoriesForDivision(Division.EXTERIORS).map(code => ({
  value: code,
  label: WORK_CATEGORY_META[code].name,
  icon: WORK_CATEGORY_META[code].icon,
  order: WORK_CATEGORY_META[code].order,
}));

// ============================================================================
// Project Stage Constants (by Division)
// ============================================================================

/** All project stages with metadata */
export const PROJECT_STAGES = Object.entries(PROJECT_STAGE_META).map(([code, meta]) => ({
  value: code as ProjectStage,
  label: meta.name,
  order: meta.order,
})).sort((a, b) => a.order - b.order);

/** Project stages for Interiors division */
export const INTERIORS_PROJECT_STAGES = getStagesForDivision(Division.INTERIORS).map(code => ({
  value: code,
  label: PROJECT_STAGE_META[code].name,
  order: PROJECT_STAGE_META[code].order,
}));

/** Project stages for Exteriors division */
export const EXTERIORS_PROJECT_STAGES = getStagesForDivision(Division.EXTERIORS).map(code => ({
  value: code,
  label: PROJECT_STAGE_META[code].name,
  order: PROJECT_STAGE_META[code].order,
}));

// ============================================================================
// Interiors Bundle Constants
// ============================================================================

export const INTERIORS_BUNDLES = [
  {
    value: InteriorsBundle.FLOOR_REFRESH,
    label: INTERIORS_BUNDLE_META[InteriorsBundle.FLOOR_REFRESH].name,
    description: INTERIORS_BUNDLE_META[InteriorsBundle.FLOOR_REFRESH].description,
  },
  {
    value: InteriorsBundle.ROOM_REFRESH,
    label: INTERIORS_BUNDLE_META[InteriorsBundle.ROOM_REFRESH].name,
    description: INTERIORS_BUNDLE_META[InteriorsBundle.ROOM_REFRESH].description,
  },
  {
    value: InteriorsBundle.FULL_INTERIOR,
    label: INTERIORS_BUNDLE_META[InteriorsBundle.FULL_INTERIOR].name,
    description: INTERIORS_BUNDLE_META[InteriorsBundle.FULL_INTERIOR].description,
  },
  {
    value: InteriorsBundle.ACCENT_PACKAGE,
    label: INTERIORS_BUNDLE_META[InteriorsBundle.ACCENT_PACKAGE].name,
    description: INTERIORS_BUNDLE_META[InteriorsBundle.ACCENT_PACKAGE].description,
  },
  {
    value: InteriorsBundle.CUSTOM,
    label: INTERIORS_BUNDLE_META[InteriorsBundle.CUSTOM].name,
    description: INTERIORS_BUNDLE_META[InteriorsBundle.CUSTOM].description,
  },
] as const;

// ============================================================================
// Interiors-Specific Inspection Types
// ============================================================================

/** Inspection types applicable to Interiors work */
export const INTERIORS_INSPECTION_TYPES = [
  { value: 'floor-flatness', label: 'Floor Flatness Check' },
  { value: 'paint-quality', label: 'Paint Quality Inspection' },
  { value: 'trim-alignment', label: 'Trim Alignment Check' },
  { value: 'final-walkthrough', label: 'Final Walkthrough' },
  { value: 'punch-list', label: 'Punch List Review' },
] as const;
