/**
 * Estimating module-specific types
 */

// Re-export commonly used types from shared-contracts
export type {
  LineItem,
  CreateLineItem,
  UpdateLineItem,
  CostCategory,
  UnitOfMeasure,
  EstimatingOperations,
} from '@hooomz/shared-contracts';

// Re-export calculation types
export type {
  MarkupResult,
  LineItemTotal,
  EstimateTotals,
} from '../calculations';

// Re-export catalog types
export type {
  CatalogItem,
  LaborRate,
  CreateCatalogItem,
  UpdateCatalogItem,
  CatalogQueryParams,
} from '../catalog/catalog.repository';

// Re-export labor rate service types
export type {
  CrewMember,
  CrewCostResult,
} from '../catalog/labor-rate.service';

// Re-export service types
export type { EstimateSummary } from '../estimates/estimate.service';
