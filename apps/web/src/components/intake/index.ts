/**
 * Intake Components
 *
 * Two intake flows:
 * - HomeownerIntakeWizard: 11-step flow for homeowners with scope tiers and selections
 * - ContractorIntakeWizard: 4-step efficient flow for contractors with trade-organized scope
 */

export { IntakeWizard, default as HomeownerIntakeWizard } from './IntakeWizard';
export { ContractorIntakeWizard } from './ContractorIntakeWizard';
export { RoomScopeBuilder } from './RoomScopeBuilder';
export { RoomDetailPanel } from './RoomDetailPanel';

// Re-export types for convenience
export type {
  HomeownerIntakeData,
  ContractorIntakeData,
  ScopeTier,
  QualityTier,
  RoomScopeTier,
  RoomScope,
  RoomTradeScopes,
  RoomMeasurements,
  RoomMaterials,
  RoomPhoto,
  FlooringMaterial,
  PaintMaterial,
  TrimMaterial,
  TileMaterial,
  MaterialSelection,
  ScopeItem,
  ThreeAxisTags,
} from '@/lib/types/intake.types';
