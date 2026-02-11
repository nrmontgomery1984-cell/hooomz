/**
 * Custom Hooks
 * Centralized exports for all custom React hooks
 */

// Activity-logging mutation hooks
// Use these instead of calling repositories directly to ensure
// every mutation logs to the Activity Log (THE SPINE)
export {
  useProjectMutations,
  useTaskMutations,
  usePhotoMutations,
  useInspectionMutations,
  useCustomerMutations,
  useEstimateMutations,
  useFinancialMutations,
  useFieldNoteMutations,
} from './useActivityMutations';
