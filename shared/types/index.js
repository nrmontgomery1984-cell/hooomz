/**
 * Shared type definitions and interfaces for Hooomz Profile
 * These can be used by both client and server
 */

export const UserRole = {
  HOMEOWNER: 'homeowner',
  CONTRACTOR: 'contractor',
  REALTOR: 'realtor',
  ADMIN: 'admin'
}

export const MaintenanceFrequency = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUALLY: 'annually',
  BIANNUALLY: 'biannually'
}

export const SystemType = {
  HVAC: 'hvac',
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing',
  ROOF: 'roof',
  FOUNDATION: 'foundation',
  WINDOWS: 'windows',
  INSULATION: 'insulation',
  APPLIANCE: 'appliance',
  OTHER: 'other'
}

export const MaterialCategory = {
  FLOORING: 'flooring',
  PAINT: 'paint',
  COUNTERTOP: 'countertop',
  CABINET: 'cabinet',
  FIXTURE: 'fixture',
  TILE: 'tile',
  HARDWARE: 'hardware',
  OTHER: 'other'
}

export const DocumentCategory = {
  WARRANTY: 'warranty',
  MANUAL: 'manual',
  RECEIPT: 'receipt',
  INSPECTION: 'inspection',
  PERMIT: 'permit',
  CONTRACT: 'contract',
  PHOTO: 'photo',
  OTHER: 'other'
}
