/**
 * Financial Forecasting Module — Types
 * Stores: FORECAST_CONFIGS, FORECAST_SNAPSHOTS
 * Services: financialActualsService, financialForecastService
 */

// ============================================================================
// Forecast Config (persisted to IndexedDB)
// ============================================================================

export interface ForecastConfig {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Crew inputs
  nathanWageRate: number;
  nathanChargedRate: number;
  nishantWageRate: number;
  nishantChargedRate: number;

  // Operating inputs per year
  operatingWeeks: { y1: number; y2: number; y3: number };

  // Job volume inputs per year
  jobsPerWeek: { y1: number; y2: number; y3: number };

  // Average job value inputs per year
  avgJobValue: { y1: number; y2: number; y3: number };

  // Nishant utilization — % of total billed hours
  nishantHoursPct: { y1: number; y2: number; y3: number };

  // Overhead inputs (annual)
  overhead: {
    marketing: number;
    vehicle: number;
    insurance: number;
    software: number;
    other: number;
  };

  // Nishant profit share % (applied to net profit after overhead)
  nishantProfitSharePct: { y1: number; y2: number; y3: number };

  // Scenario tag
  scenario: 'conservative' | 'base' | 'aggressive';

  // Manual revenue override — key format: "YYYY-MM"
  manualRevenueOverrides: Record<string, number>;
}

// ============================================================================
// Forecast Snapshot (persisted to IndexedDB)
// ============================================================================

export interface ForecastSnapshot {
  id: string;
  configId: string;
  snapshotDate: string;
  periodType: 'monthly' | 'quarterly' | 'annual';
  periodLabel: string;

  // Forecast
  forecastRevenue: number;
  forecastLaborCost: number;
  forecastMaterialCost: number;
  forecastOverhead: number;
  forecastGrossProfit: number;
  forecastNetProfit: number;
  forecastNathanTakeHome: number;
  forecastNishantTakeHome: number;

  // Actuals
  actualRevenue: number;
  actualLaborCost: number;
  actualMaterialCost: number;
  actualGrossProfit: number;
  actualNetProfit: number;

  // Variance
  revenueVariance: number;
  revenueVariancePct: number;
  profitVariance: number;
  profitVariancePct: number;

  createdAt: string;
}

// ============================================================================
// Financial Actuals (computed — not persisted)
// ============================================================================

export interface ProjectFinancialSummary {
  projectId: string;
  projectName: string;
  status: string;
  completedDate: string | null;
  revenue: number;
  laborCost: number;
  materialCost: number;
  grossProfit: number;
  marginPct: number;
  nathanHours: number;
  nishantHours: number;
}

export interface FinancialActuals {
  period: { from: string; to: string };

  // Revenue
  completedProjectRevenue: number;
  inProgressRevenue: number;
  changeOrderRevenue: number;
  totalRevenue: number;

  // Pipeline
  pipelineValue: number;
  pipelineCount: number;

  // Labor costs
  nathanLaborCost: number;
  nishantLaborCost: number;
  totalLaborCost: number;

  // Labor hours
  nathanHours: number;
  nishantHours: number;
  totalHours: number;

  // Material costs
  materialCost: number;

  // Derived
  grossProfit: number;
  grossMarginPct: number;
  avgJobValue: number;
  completedProjectCount: number;

  // Drill-down
  projectBreakdown: ProjectFinancialSummary[];

  // Data quality
  unresolvedProjectCount: number;
}

// ============================================================================
// Forecast Projection (computed — not persisted)
// ============================================================================

export interface YearForecast {
  year: number;
  label: string;

  // Volume
  operatingWeeks: number;
  jobsPerWeek: number;
  totalJobs: number;
  avgJobValue: number;

  // Revenue
  grossRevenue: number;

  // Labor
  estimatedTotalHours: number;
  nishantHours: number;
  nathanHours: number;
  nishantLaborCost: number;
  nathanLaborCost: number;
  totalLaborCost: number;

  // Materials
  estimatedMaterialCost: number;

  // Gross
  grossProfit: number;

  // Overhead
  totalOverhead: number;

  // Net
  netProfitBeforeShare: number;

  // Profit share
  nishantProfitShare: number;
  nathanNetProfit: number;

  // Take-home
  nathanWageDraw: number;
  nathanProfitDraw: number;
  nathanTotal: number;
  nishantWageDraw: number;
  nishantProfitDraw: number;
  nishantTotal: number;

  // Margins
  grossMarginPct: number;
  netMarginPct: number;
}

export interface ForecastProjection {
  config: ForecastConfig;
  years: YearForecast[];
  threeYearTotals: {
    totalRevenue: number;
    totalLaborCost: number;
    totalMaterialCost: number;
    totalOverhead: number;
    totalNetProfit: number;
    nathanCumulative: number;
    nishantCumulative: number;
  };
}

// ============================================================================
// Default Config
// ============================================================================

export const DEFAULT_FORECAST_VALUES = {
  nathanWageRate: 45,
  nathanChargedRate: 95,
  nishantWageRate: 28,
  nishantChargedRate: 55,
  operatingWeeks: { y1: 36, y2: 46, y3: 50 },
  jobsPerWeek: { y1: 1.5, y2: 2.5, y3: 3.5 },
  avgJobValue: { y1: 6500, y2: 7500, y3: 8500 },
  nishantHoursPct: { y1: 0.50, y2: 0.65, y3: 0.75 },
  nishantProfitSharePct: { y1: 0.15, y2: 0.25, y3: 0.35 },
  overhead: {
    marketing: 6000,
    vehicle: 8400,
    insurance: 3600,
    software: 1200,
    other: 2400,
  },
} as const;

export const MATERIAL_COST_PCT = 0.25;
