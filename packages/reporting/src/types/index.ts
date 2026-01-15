/**
 * Type exports for @hooomz/reporting
 */

// Dashboard types
export type {
  OwnerDashboard,
  ProjectDashboard,
  CrewDashboard,
  FinancialSummary,
  DateRange,
} from '../dashboards/dashboard.service';

// Report types
export type {
  ProjectReport,
  EstimateReport,
  InspectionReport,
  VarianceReport,
} from '../reports/report.service';

// Export types
export type {
  PDFExportData,
  CSVExportData,
  EmailExportData,
  EmailRecipient,
} from '../exports/export.service';

// Metrics types
export type {
  ProjectMetricsData,
  TimePeriod,
  AverageProjectDuration,
  ProfitMarginTrend,
  OnTimeDeliveryRate,
  CostOverrun,
} from '../metrics/calculations';
