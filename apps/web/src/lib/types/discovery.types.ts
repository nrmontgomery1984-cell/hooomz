/**
 * Discovery Types
 *
 * Data models for the Discovery flow (Prompt 2).
 * Step 1: Property Overview — physical home details
 * Step 2: Design Preferences — aesthetic direction
 *
 * DiscoveryDraft persists wizard state to IndexedDB (local-only, like IntakeDraft).
 */

// ============================================================================
// Step 1: Property Overview
// ============================================================================

export type HomeType = 'detached' | 'semi' | 'townhouse' | 'condo' | 'duplex' | 'other';
export type HomeAge = 'new' | '1-10' | '10-25' | '25-50' | '50+' | 'unknown';
export type Storeys = 1 | 1.5 | 2 | 3;
export type ParkingType = 'driveway' | 'garage' | 'street' | 'none';
export type OccupancyStatus = 'occupied' | 'vacant' | 'rental_occupied' | 'rental_vacant';

export interface PropertyAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface PropertyData {
  address: PropertyAddress;
  homeType: HomeType | null;
  homeAge: HomeAge | null;
  storeys: Storeys | null;
  totalSqft: number | null;
  parking: ParkingType | null;
  occupancy: OccupancyStatus | null;
  pets: boolean;
  petDetails: string;
  accessNotes: string;
}

// ============================================================================
// Step 2: Design Preferences
// ============================================================================

export type DesignStyle = 'modern' | 'traditional' | 'transitional' | 'farmhouse' | 'coastal' | 'industrial' | 'not_sure';
export type ColorDirection = 'warm' | 'cool' | 'neutral' | 'bold' | 'not_sure';
export type FloorLook = 'warm_wood' | 'cool_gray' | 'natural' | 'dark' | 'light' | 'not_sure';
export type TrimStyle = 'modern_clean' | 'traditional_profile' | 'craftsman' | 'match_existing' | 'not_sure';
export type DesignPriority = 'durability' | 'appearance' | 'budget' | 'speed' | 'low_maintenance' | 'pet_friendly' | 'resale';

export interface DesignPreferences {
  style: DesignStyle | null;
  colorDirection: ColorDirection | null;
  floorLook: FloorLook | null;
  trimStyle: TrimStyle | null;
  priorities: DesignPriority[];     // max 3
  inspirationNotes: string;
}

// ============================================================================
// Discovery Draft — persisted wizard state
// ============================================================================

export type DiscoveryDraftStatus = 'in_progress' | 'complete';

export interface DiscoveryDraft {
  id: string;
  projectId: string;
  currentStep: number;               // 1 = property, 2 = preferences
  property: Partial<PropertyData>;
  preferences: Partial<DesignPreferences>;
  status: DiscoveryDraftStatus;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

// ============================================================================
// Defaults
// ============================================================================

export const EMPTY_PROPERTY: PropertyData = {
  address: { street: '', city: '', province: 'NB', postalCode: '' },
  homeType: null,
  homeAge: null,
  storeys: null,
  totalSqft: null,
  parking: null,
  occupancy: null,
  pets: false,
  petDetails: '',
  accessNotes: '',
};

export const EMPTY_PREFERENCES: DesignPreferences = {
  style: null,
  colorDirection: null,
  floorLook: null,
  trimStyle: null,
  priorities: [],
  inspirationNotes: '',
};
