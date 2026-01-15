# @hooomz/reporting

Dashboards and reporting module for the Hooomz construction management platform.

## Overview

This module provides comprehensive analytics, reporting, and export functionality for construction projects. It includes:

- **Dashboard Views**: Aggregated analytics for owners, projects, crews, and financial summaries
- **Report Generation**: Detailed reports for projects, estimates, inspections, and variance analysis
- **Export Services**: Convert reports to PDF, CSV, and email formats
- **Business Metrics**: Calculate KPIs like average project duration, profit margin trends, on-time delivery rates, and cost overruns

## Installation

```bash
npm install @hooomz/reporting
```

## Features

### 1. Dashboard Service

Generate aggregated analytics views for different user roles:

#### Owner Dashboard
- Summary of all projects, revenue, and profit
- Financial metrics (monthly revenue, average project value)
- Pipeline visibility (estimates in progress, upcoming inspections)
- Top performers and problem areas

#### Project Dashboard
- Project overview and completion status
- Financial summary (costs, variance, profit margin)
- Schedule tracking (tasks, milestones)
- Quality metrics (inspections, pass rate)

#### Crew Dashboard
- Individual workload and hours
- Today's and this week's tasks
- Upcoming inspections
- Performance metrics (on-time completion, average task duration)

#### Financial Summary
- Revenue, costs, and profit over a date range
- Breakdown by project
- Trend analysis

### 2. Report Service

Generate detailed reports for various purposes:

#### Project Report
Comprehensive project summary including:
- Project details (customer, timeline, location)
- Financial analysis (budget, spending, variance, profit margin)
- Schedule status (tasks, critical path, milestones)
- Quality tracking (inspections, issues)
- Team assignments
- Summary and recommendations

#### Estimate Report
Detailed cost breakdown including:
- Summary (subtotal, markup, tax, total)
- Line items with quantities and costs
- Breakdown by category (materials vs labor)
- Assumptions and exclusions
- Valid until date

#### Inspection Report
All inspections with status:
- Summary statistics (total, passed, failed, pass rate)
- Detailed inspection records with results
- Timeline of inspection events
- Recommendations for improvements

#### Variance Report
Estimate vs actual analysis:
- Overview (estimated vs actual, variance, status)
- Breakdown by category
- Top overruns and savings
- Analysis (materials vs labor variance)
- Recommendations

### 3. Export Service

Convert reports to various formats:

#### PDF Export
- Returns structured data for PDF generation
- Configurable page size and orientation
- Sections with tables and charts
- Header and footer support

#### CSV Export
- Convert tabular data to CSV format
- Auto-generate headers from data
- Formatted cells (dates, numbers, booleans)
- Metadata tracking

#### Email Export
- Format reports for email delivery
- Plain text and HTML versions
- Optional PDF attachments
- Recipient management (to, cc, bcc)

### 4. Metrics Calculations

Calculate business intelligence metrics:

#### Average Project Duration
- Calculate average days from all projects
- Breakdown by status (completed vs in-progress)
- Identify fastest and slowest projects
- Calculate median duration

#### Profit Margin Trend
- Track profit margin over time (week, month, quarter, year)
- Identify trend direction (increasing, decreasing, stable)
- Calculate percentage change
- Revenue and profit by period

#### On-Time Delivery Rate
- Calculate percentage of projects completed on time
- Identify late projects and average days late
- Breakdown of on-time vs late projects
- Top 10 most delayed projects

#### Top Cost Overruns
- Identify projects with highest cost overruns
- Calculate overrun amount and percentage
- Sort by absolute overrun value
- Filter to only over-budget projects

## Usage

```typescript
import {
  DashboardService,
  ReportService,
  ExportService,
  calculateAverageProjectDuration,
  calculateProfitMarginTrend,
  calculateOnTimeDeliveryRate,
  identifyTopCostOverruns,
} from '@hooomz/reporting';

// Initialize services
const dashboardService = new DashboardService();
const reportService = new ReportService();
const exportService = new ExportService();

// Get owner dashboard
const ownerDashboard = await dashboardService.getOwnerDashboard();
console.log('Active projects:', ownerDashboard.data?.summary.activeProjects);

// Get project dashboard
const projectDashboard = await dashboardService.getProjectDashboard('proj_123');
console.log('Budget variance:', projectDashboard.data?.financial.variance);

// Generate project report
const projectReport = await reportService.generateProjectReport('proj_123');

// Export to PDF
const pdfData = await exportService.exportToPDF(projectReport.data!, {
  title: 'Project Summary Report',
  orientation: 'portrait',
  pageSize: 'letter',
});

// Export to CSV
const csvData = await exportService.exportToCSV([
  { project: 'House Build', cost: 150000, revenue: 180000 },
  { project: 'Deck Addition', cost: 25000, revenue: 32000 },
]);

// Export to Email
const emailData = await exportService.exportToEmail(
  projectReport.data!,
  { email: 'owner@example.com', name: 'John Smith' },
  { includeAttachments: true }
);

// Calculate metrics
const avgDuration = await calculateAverageProjectDuration([
  {
    id: 'proj_1',
    name: 'House Build',
    startDate: '2024-01-01',
    actualEndDate: '2024-06-30',
    status: 'completed',
    estimatedCost: 150000,
    actualCost: 155000,
    estimatedRevenue: 180000,
    actualRevenue: 180000,
  },
  // ... more projects
]);

const profitTrend = await calculateProfitMarginTrend(projects, 'month');
const onTimeRate = await calculateOnTimeDeliveryRate(projects);
const topOverruns = await identifyTopCostOverruns(projects, 10);
```

## API Reference

### DashboardService

#### `getOwnerDashboard(): Promise<ApiResponse<OwnerDashboard>>`
Get aggregated dashboard for business owner.

#### `getProjectDashboard(projectId: string): Promise<ApiResponse<ProjectDashboard>>`
Get detailed dashboard for a specific project.

#### `getCrewDashboard(assigneeId: string): Promise<ApiResponse<CrewDashboard>>`
Get workload and performance dashboard for a crew member.

#### `getFinancialSummary(dateRange: DateRange): Promise<ApiResponse<FinancialSummary>>`
Get financial summary for a date range.

### ReportService

#### `generateProjectReport(projectId: string): Promise<ApiResponse<ProjectReport>>`
Generate comprehensive project report.

#### `generateEstimateReport(projectId: string): Promise<ApiResponse<EstimateReport>>`
Generate detailed estimate report with cost breakdown.

#### `generateInspectionReport(projectId: string): Promise<ApiResponse<InspectionReport>>`
Generate inspection summary report.

#### `generateVarianceReport(projectId: string): Promise<ApiResponse<VarianceReport>>`
Generate estimate vs actual variance report.

### ExportService

#### `exportToPDF(report: Record<string, unknown>, options?): Promise<ApiResponse<PDFExportData>>`
Prepare report data for PDF generation.

**Options**:
- `title?: string` - PDF title
- `orientation?: 'portrait' | 'landscape'` - Page orientation
- `pageSize?: 'letter' | 'legal' | 'a4'` - Page size

#### `exportToCSV(data: Record<string, unknown>[], options?): Promise<ApiResponse<CSVExportData>>`
Convert data to CSV format.

**Options**:
- `filename?: string` - Output filename
- `headers?: string[]` - Custom headers

#### `exportToEmail(report: Record<string, unknown>, recipient: EmailRecipient, options?): Promise<ApiResponse<EmailExportData>>`
Format report for email delivery.

**Options**:
- `includeAttachments?: boolean` - Include PDF attachment
- `subject?: string` - Custom email subject

### Metrics Functions

#### `calculateAverageProjectDuration(projects: ProjectMetricsData[]): Promise<ApiResponse<AverageProjectDuration>>`
Calculate average project duration with breakdown.

#### `calculateProfitMarginTrend(projects: ProjectMetricsData[], period: TimePeriod): Promise<ApiResponse<ProfitMarginTrend>>`
Calculate profit margin trend over time.

**Period**: `'week' | 'month' | 'quarter' | 'year'`

#### `calculateOnTimeDeliveryRate(projects: ProjectMetricsData[]): Promise<ApiResponse<OnTimeDeliveryRate>>`
Calculate on-time delivery rate.

#### `identifyTopCostOverruns(projects: ProjectMetricsData[], limit?: number): Promise<ApiResponse<CostOverrun[]>>`
Identify projects with highest cost overruns.

## Type Definitions

All TypeScript types are exported from the main package:

```typescript
import type {
  // Dashboard types
  OwnerDashboard,
  ProjectDashboard,
  CrewDashboard,
  FinancialSummary,

  // Report types
  ProjectReport,
  EstimateReport,
  InspectionReport,
  VarianceReport,

  // Export types
  PDFExportData,
  CSVExportData,
  EmailExportData,
  EmailRecipient,

  // Metrics types
  ProjectMetricsData,
  TimePeriod,
  AverageProjectDuration,
  ProfitMarginTrend,
  OnTimeDeliveryRate,
  CostOverrun,
} from '@hooomz/reporting';
```

## Building

```bash
# Type check
npm run typecheck

# Build
npm run build

# Clean build artifacts
npm run clean
```

## Dependencies

- `@hooomz/shared-contracts` - Shared types and utilities

## Module Structure

```
packages/reporting/
├── src/
│   ├── dashboards/
│   │   ├── dashboard.service.ts    # Dashboard views
│   │   └── index.ts
│   ├── reports/
│   │   ├── report.service.ts       # Report generation
│   │   └── index.ts
│   ├── exports/
│   │   ├── export.service.ts       # Export formats
│   │   └── index.ts
│   ├── metrics/
│   │   ├── calculations.ts         # Business metrics
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts                # Type exports
│   └── index.ts                     # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Integration Notes

### Real Implementation

The current implementation provides structured interfaces and return types but contains placeholder data. In a real application, you would:

1. **Inject Data Repositories**: Pass repositories for projects, estimates, inspections, etc. to services
2. **Aggregate from Multiple Sources**: Pull data from scheduling, estimating, field-docs, and other modules
3. **Implement PDF Generation**: Use a library like pdfkit or puppeteer in the app layer
4. **Implement Email Sending**: Integrate with an email service (SendGrid, AWS SES, etc.)
5. **Add Caching**: Cache dashboard data for performance
6. **Add Filtering**: Allow date ranges, status filters, etc. on dashboards
7. **Add Real-time Updates**: Use WebSockets or polling for live dashboards

### Example Integration

```typescript
import { DashboardService } from '@hooomz/reporting';
import { ProjectRepository } from '@hooomz/scheduling';
import { EstimateRepository } from '@hooomz/estimating';

// In real implementation, inject repositories
const dashboardService = new DashboardService({
  projectRepository,
  estimateRepository,
  inspectionRepository,
  // ... other dependencies
});
```

## License

MIT
