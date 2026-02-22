/**
 * Labour Estimation Engine — Types
 *
 * Stores: SKILL_RATE_CONFIG (singleton)
 * Services: LabourEstimationService
 *
 * Core formula:
 *   sellBudget    = quantity × catalogueSellRate
 *   costBudget    = sellBudget / (1 + margin)
 *   budgetedHours = costBudget / skillLevel.costRate
 */

// ============================================================================
// Skill Level
// ============================================================================

export interface SkillLevel {
  level: number;         // 0, 1, 2, 3, 4
  label: string;         // "Labourer", "Apprentice Yr 1-2", etc.
  costRate: number;      // $/hr — what you PAY this level
  description: string;   // brief note on what qualifies
}

// ============================================================================
// Margin Targets
// ============================================================================

export interface MarginTargets {
  default: number;                          // e.g. 0.35 = 35%
  byProjectType: Record<string, number>;    // e.g. { residential: 0.35, commercial: 0.40 }
  byTradeCategory: Record<string, number>;  // e.g. { tile: 0.40, paint: 0.30 }
}

// ============================================================================
// Skill Rate Config (persisted to IndexedDB — singleton)
// ============================================================================

export interface SkillRateConfig {
  id: 'singleton';
  updatedAt: string;
  marginTargets: MarginTargets;
  skillLevels: SkillLevel[];
}

export const DEFAULT_SKILL_RATE_CONFIG: SkillRateConfig = {
  id: 'singleton',
  updatedAt: new Date().toISOString(),
  marginTargets: {
    default: 0.35,
    byProjectType: {
      residential: 0.35,
      commercial: 0.40,
    },
    byTradeCategory: {},
  },
  skillLevels: [
    { level: 0, label: 'Labourer',           costRate: 22, description: 'No certification required' },
    { level: 1, label: 'Apprentice Yr 1-2',  costRate: 26, description: 'Basic certification, supervised work' },
    { level: 2, label: 'Apprentice Yr 3-4',  costRate: 30, description: 'Intermediate certification, semi-independent' },
    { level: 3, label: 'Journeyman',         costRate: 38, description: 'Full certification, independent work' },
    { level: 4, label: 'Lead',               costRate: 44, description: 'Journeyman + field leadership, trains others' },
  ],
};

// ============================================================================
// Estimate Params (input to calculateTaskEstimate)
// ============================================================================

export interface EstimateParams {
  catalogueSellRate: number;   // $/unit from cost catalogue (sell price)
  quantity: number;
  unit: string;
  minSkillLevel: number;
  projectType?: string;        // for margin resolution
  tradeCategory?: string;      // for margin resolution
}

// ============================================================================
// Task Labour Estimate (written to DeployedTask.labourEstimate)
// ============================================================================

export interface TaskLabourEstimate {
  quantity: number;
  unit: string;
  sellBudget: number;
  costBudget: number;
  budgetedHours: number;
  optimalSkillLevel: number;
  optimalCostRate: number;
  marginApplied: number;
  calculatedAt: string;
}

// ============================================================================
// Labour Actual (written to DeployedTask.labourActual)
// ============================================================================

export interface LabourActual {
  assignedCrewMemberId: string;
  assignedCostRate: number;
  actualHours: number | null;
  actualCost: number | null;
  schedulingVariance: number | null;
  variantReason?: string;
}

// ============================================================================
// Project Variance Summary (for finance dashboard)
// ============================================================================

export interface ProjectVarianceSummary {
  totalSellBudget: number;
  totalCostBudget: number;
  totalActualCost: number | null;
  totalVariance: number | null;
  varianceByCrewMember: {
    crewMemberId: string;
    crewMemberName: string;
    totalVariance: number;
    taskCount: number;
  }[];
  tasksWithoutEstimate: string[];
  totalBudgetedHours: number;
  totalActualHours: number | null;
  overallEfficiency: number | null;
}

// ============================================================================
// Crew Variance Record (for crew performance view)
// ============================================================================

export interface CrewVarianceRecord {
  taskId: string;
  deployedTaskId: string;
  projectId: string;
  taskName: string;
  budgetedHours: number;
  actualHours: number;
  hoursVariance: number;
  schedulingVariance: number;
  completedAt: string;
}

// ============================================================================
// Helper
// ============================================================================

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
