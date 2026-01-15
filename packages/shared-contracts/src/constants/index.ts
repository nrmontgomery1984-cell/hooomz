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
