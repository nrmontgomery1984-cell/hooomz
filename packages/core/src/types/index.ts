/**
 * Core module-specific types
 *
 * This file can contain additional types specific to the core module
 * that extend or complement the shared contracts.
 */

// Re-export commonly used types from shared-contracts for convenience
export type {
  Project,
  CreateProject,
  UpdateProject,
  ProjectStatus,
  ProjectType,
  ProjectWithDetails,
  ProjectStats,
  CoreOperations,
} from '@hooomz/shared-contracts';

// Module-specific type extensions can be added here
// Example:
// export interface ProjectWithAnalytics extends Project {
//   analytics: {
//     viewCount: number;
//     lastAccessed: string;
//   };
// }
