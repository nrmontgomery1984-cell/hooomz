/**
 * API Hooks Index
 * Re-exports all API hooks for easy importing
 */

// Core entity hooks
export * from './useProjects';
export * from './useCustomers';
export * from './useTasks';
export * from './useInspections';
export * from './usePhotos';
export * from './useEstimates';
export * from './useCatalog';

// Loop hierarchy hooks (nested loop architecture)
export * from './useLoops';

// Activity log hooks (the spine of Hooomz)
export * from './useActivity';

// Business health hooks (sphere visualization data)
export * from './useBusinessHealth';

// Smart Estimating learning hooks (THE differentiator)
export * from './useSmartEstimating';
