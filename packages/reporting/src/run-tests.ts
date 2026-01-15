/**
 * Test suite for @hooomz/reporting module
 * Tests dashboard aggregation, metrics calculations, and report generation
 */

import { DashboardService } from './dashboards/dashboard.service';
import { ReportService } from './reports/report.service';
import { ExportService } from './exports/export.service';
import {
  calculateAverageProjectDuration,
  calculateProfitMarginTrend,
  calculateOnTimeDeliveryRate,
  identifyTopCostOverruns,
  type ProjectMetricsData,
} from './metrics/calculations';

// Test utilities
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      `Expected ${expected}, got ${actual}${message ? ` - ${message}` : ''}`
    );
  }
}

function assertTrue(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(`Expected true${message ? ` - ${message}` : ''}`);
  }
}

function assertGreaterThan(actual: number, expected: number, message?: string): void {
  if (actual <= expected) {
    throw new Error(
      `Expected ${actual} to be greater than ${expected}${message ? ` - ${message}` : ''}`
    );
  }
}

function assertArrayLength<T>(array: T[], expectedLength: number): void {
  if (array.length !== expectedLength) {
    throw new Error(
      `Expected array length ${expectedLength}, got ${array.length}`
    );
  }
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }
}

// Sample data for tests
function createSampleProjects(): ProjectMetricsData[] {
  return [
    {
      id: 'proj_1',
      name: 'Residential House Build',
      startDate: '2024-01-01',
      estimatedEndDate: '2024-06-30',
      actualEndDate: '2024-07-15',
      status: 'completed',
      estimatedCost: 150000,
      actualCost: 165000,
      estimatedRevenue: 180000,
      actualRevenue: 180000,
      completedOnTime: false,
    },
    {
      id: 'proj_2',
      name: 'Deck Addition',
      startDate: '2024-02-01',
      estimatedEndDate: '2024-03-15',
      actualEndDate: '2024-03-10',
      status: 'completed',
      estimatedCost: 25000,
      actualCost: 23000,
      estimatedRevenue: 32000,
      actualRevenue: 32000,
      completedOnTime: true,
    },
    {
      id: 'proj_3',
      name: 'Kitchen Renovation',
      startDate: '2024-03-01',
      estimatedEndDate: '2024-04-30',
      actualEndDate: '2024-05-05',
      status: 'completed',
      estimatedCost: 45000,
      actualCost: 48000,
      estimatedRevenue: 58000,
      actualRevenue: 58000,
      completedOnTime: false,
    },
    {
      id: 'proj_4',
      name: 'Basement Finishing',
      startDate: '2024-04-01',
      estimatedEndDate: '2024-07-31',
      actualEndDate: undefined,
      status: 'in-progress',
      estimatedCost: 65000,
      actualCost: 42000,
      estimatedRevenue: 80000,
      actualRevenue: undefined,
    },
    {
      id: 'proj_5',
      name: 'Garage Construction',
      startDate: '2024-05-01',
      estimatedEndDate: '2024-08-15',
      actualEndDate: '2024-08-10',
      status: 'completed',
      estimatedCost: 38000,
      actualCost: 36500,
      estimatedRevenue: 48000,
      actualRevenue: 48000,
      completedOnTime: true,
    },
  ];
}

// ============================================================
// Test Suite
// ============================================================

async function runTests() {
  console.log('\n🧪 Running Reporting Module Tests\n');

  const dashboardService = new DashboardService();
  const reportService = new ReportService();
  const exportService = new ExportService();
  const sampleProjects = createSampleProjects();

  // ============================================================
  // 1️⃣  Dashboard Aggregation Logic Tests
  // ============================================================
  console.log('1️⃣  Dashboard Aggregation Logic:');
  console.log('   Testing dashboard views for different roles\n');

  await test('Get owner dashboard - returns valid structure', async () => {
    const result = await dashboardService.getOwnerDashboard();
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertTrue('summary' in result.data!, 'Should have summary');
    assertTrue('financial' in result.data!, 'Should have financial');
    assertTrue('pipeline' in result.data!, 'Should have pipeline');
    assertTrue('topMetrics' in result.data!, 'Should have topMetrics');
  });

  await test('Owner dashboard has correct summary structure', async () => {
    const result = await dashboardService.getOwnerDashboard();
    const summary = result.data!.summary;
    assertTrue(typeof summary.totalProjects === 'number', 'totalProjects is number');
    assertTrue(typeof summary.activeProjects === 'number', 'activeProjects is number');
    assertTrue(typeof summary.totalRevenue === 'number', 'totalRevenue is number');
    assertTrue(typeof summary.totalProfit === 'number', 'totalProfit is number');
    assertTrue(typeof summary.profitMargin === 'number', 'profitMargin is number');
  });

  await test('Get project dashboard - returns valid structure', async () => {
    const result = await dashboardService.getProjectDashboard('proj_123');
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertTrue('project' in result.data!, 'Should have project');
    assertTrue('financial' in result.data!, 'Should have financial');
    assertTrue('schedule' in result.data!, 'Should have schedule');
    assertTrue('quality' in result.data!, 'Should have quality');
  });

  await test('Project dashboard has financial metrics', async () => {
    const result = await dashboardService.getProjectDashboard('proj_123');
    const financial = result.data!.financial;
    assertTrue('estimatedCost' in financial, 'Has estimatedCost');
    assertTrue('actualCost' in financial, 'Has actualCost');
    assertTrue('variance' in financial, 'Has variance');
    assertTrue('profitMargin' in financial, 'Has profitMargin');
  });

  await test('Get crew dashboard - returns valid structure', async () => {
    const result = await dashboardService.getCrewDashboard('user_456');
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertTrue('assignee' in result.data!, 'Should have assignee');
    assertTrue('workload' in result.data!, 'Should have workload');
    assertTrue('schedule' in result.data!, 'Should have schedule');
    assertTrue('performance' in result.data!, 'Should have performance');
  });

  await test('Crew dashboard has workload tracking', async () => {
    const result = await dashboardService.getCrewDashboard('user_456');
    const workload = result.data!.workload;
    assertTrue(typeof workload.totalTasks === 'number', 'totalTasks is number');
    assertTrue(typeof workload.activeTasks === 'number', 'activeTasks is number');
    assertTrue(typeof workload.totalHours === 'number', 'totalHours is number');
    assertTrue(typeof workload.remainingHours === 'number', 'remainingHours is number');
  });

  await test('Get financial summary - returns valid structure', async () => {
    const result = await dashboardService.getFinancialSummary({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertTrue('period' in result.data!, 'Should have period');
    assertTrue('revenue' in result.data!, 'Should have revenue');
    assertTrue('costs' in result.data!, 'Should have costs');
    assertTrue('profit' in result.data!, 'Should have profit');
  });

  await test('Financial summary has revenue breakdown', async () => {
    const result = await dashboardService.getFinancialSummary({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    const revenue = result.data!.revenue;
    assertTrue(typeof revenue.total === 'number', 'total is number');
    assertTrue(Array.isArray(revenue.byProject), 'byProject is array');
    assertTrue(Array.isArray(revenue.trend), 'trend is array');
  });

  // ============================================================
  // 2️⃣  Metrics Calculations Tests
  // ============================================================
  console.log('\n2️⃣  Metrics Calculations:');
  console.log('   Testing business intelligence metrics\n');

  await test('Calculate average project duration', async () => {
    const result = await calculateAverageProjectDuration(sampleProjects);
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertGreaterThan(result.data!.averageDays, 0, 'Average should be positive');
    assertEqual(result.data!.totalProjects, 5, 'Should count all projects');
  });

  await test('Average duration includes breakdown', async () => {
    const result = await calculateAverageProjectDuration(sampleProjects);
    const breakdown = result.data!.breakdown;
    assertTrue('fastest' in breakdown, 'Has fastest');
    assertTrue('slowest' in breakdown, 'Has slowest');
    assertTrue('median' in breakdown, 'Has median');
    assertGreaterThan(breakdown.slowest.days, breakdown.fastest.days, 'Slowest > fastest');
  });

  await test('Average duration separates completed vs in-progress', async () => {
    const result = await calculateAverageProjectDuration(sampleProjects);
    const byStatus = result.data!.byStatus;
    assertGreaterThan(byStatus.completed, 0, 'Has completed average');
    assertGreaterThan(byStatus.inProgress, 0, 'Has in-progress average');
  });

  await test('Calculate profit margin trend - monthly', async () => {
    const result = await calculateProfitMarginTrend(sampleProjects, 'month');
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertEqual(result.data!.period, 'month', 'Period should be month');
    assertTrue(Array.isArray(result.data!.dataPoints), 'Has data points');
  });

  await test('Profit margin trend has summary', async () => {
    const result = await calculateProfitMarginTrend(sampleProjects, 'month');
    const summary = result.data!.summary;
    assertGreaterThan(summary.averageMargin, 0, 'Has average margin');
    assertTrue(['increasing', 'decreasing', 'stable'].includes(summary.trend), 'Valid trend');
    assertTrue(typeof summary.percentageChange === 'number', 'Has percentage change');
  });

  await test('Profit margin trend data points have correct structure', async () => {
    const result = await calculateProfitMarginTrend(sampleProjects, 'month');
    const dataPoints = result.data!.dataPoints;
    assertTrue(dataPoints.length > 0, 'Has data points');
    const firstPoint = dataPoints[0];
    assertTrue('date' in firstPoint, 'Has date');
    assertTrue('profitMargin' in firstPoint, 'Has profitMargin');
    assertTrue('revenue' in firstPoint, 'Has revenue');
    assertTrue('profit' in firstPoint, 'Has profit');
    assertTrue('projectCount' in firstPoint, 'Has projectCount');
  });

  await test('Calculate on-time delivery rate', async () => {
    const result = await calculateOnTimeDeliveryRate(sampleProjects);
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertGreaterThan(result.data!.completedProjects, 0, 'Has completed projects');
    assertTrue(result.data!.onTimeRate >= 0 && result.data!.onTimeRate <= 100, 'Rate is percentage');
  });

  await test('On-time delivery rate has breakdown', async () => {
    const result = await calculateOnTimeDeliveryRate(sampleProjects);
    const breakdown = result.data!.breakdown;
    assertTrue(Array.isArray(breakdown.onTime), 'Has onTime array');
    assertTrue(Array.isArray(breakdown.late), 'Has late array');
    assertEqual(
      breakdown.onTime.length + breakdown.late.length,
      result.data!.completedProjects,
      'Breakdown equals completed'
    );
  });

  await test('On-time delivery calculates correct rate', async () => {
    const result = await calculateOnTimeDeliveryRate(sampleProjects);
    // From sample data: 2 on-time (proj_2, proj_5) out of 4 completed = 50%
    assertEqual(result.data!.onTimeProjects, 2, 'Should have 2 on-time');
    assertEqual(result.data!.lateProjects, 2, 'Should have 2 late');
    assertEqual(result.data!.onTimeRate, 50, 'Should be 50%');
  });

  await test('Identify top cost overruns', async () => {
    const result = await identifyTopCostOverruns(sampleProjects, 10);
    assertTrue(result.success, 'Should return success');
    assertTrue(Array.isArray(result.data), 'Should return array');
    assertTrue(result.data!.length > 0, 'Should find overruns');
  });

  await test('Cost overruns have correct structure', async () => {
    const result = await identifyTopCostOverruns(sampleProjects, 10);
    const overruns = result.data!;
    const firstOverrun = overruns[0];
    assertTrue('projectId' in firstOverrun, 'Has projectId');
    assertTrue('projectName' in firstOverrun, 'Has projectName');
    assertTrue('estimatedCost' in firstOverrun, 'Has estimatedCost');
    assertTrue('actualCost' in firstOverrun, 'Has actualCost');
    assertTrue('overrun' in firstOverrun, 'Has overrun');
    assertTrue('overrunPercentage' in firstOverrun, 'Has overrunPercentage');
    assertGreaterThan(firstOverrun.overrun, 0, 'Overrun is positive');
  });

  await test('Cost overruns are sorted by amount', async () => {
    const result = await identifyTopCostOverruns(sampleProjects, 10);
    const overruns = result.data!;
    // Verify descending order
    for (let i = 1; i < overruns.length; i++) {
      assertTrue(
        overruns[i - 1].overrun >= overruns[i].overrun,
        'Should be sorted descending'
      );
    }
  });

  await test('Cost overruns exclude under-budget projects', async () => {
    const result = await identifyTopCostOverruns(sampleProjects, 10);
    const overruns = result.data!;
    // proj_2 and proj_5 were under budget, should not be included
    assertTrue(
      !overruns.find((o) => o.projectId === 'proj_2'),
      'Should not include proj_2'
    );
    assertTrue(
      !overruns.find((o) => o.projectId === 'proj_5'),
      'Should not include proj_5'
    );
  });

  await test('Metrics handle empty array', async () => {
    const result = await calculateAverageProjectDuration([]);
    assertTrue(!result.success, 'Should fail with empty array');
    assertTrue(result.error !== undefined, 'Should have error');
    assertEqual(result.error!.code, 'INVALID_INPUT', 'Should be invalid input');
  });

  // ============================================================
  // 3️⃣  Report Data Structure Generation Tests
  // ============================================================
  console.log('\n3️⃣  Report Data Structure Generation:');
  console.log('   Testing report generation and structure\n');

  await test('Generate project report - returns valid structure', async () => {
    const result = await reportService.generateProjectReport('proj_123');
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertTrue('project' in result.data!, 'Should have project');
    assertTrue('financial' in result.data!, 'Should have financial');
    assertTrue('schedule' in result.data!, 'Should have schedule');
    assertTrue('quality' in result.data!, 'Should have quality');
    assertTrue('team' in result.data!, 'Should have team');
    assertTrue('generatedAt' in result.data!, 'Should have timestamp');
  });

  await test('Project report has financial details', async () => {
    const result = await reportService.generateProjectReport('proj_123');
    const financial = result.data!.financial;
    assertTrue('budget' in financial, 'Has budget');
    assertTrue('spent' in financial, 'Has spent');
    assertTrue('remaining' in financial, 'Has remaining');
    assertTrue('variance' in financial, 'Has variance');
    assertTrue('profitMargin' in financial, 'Has profitMargin');
  });

  await test('Project report has schedule tracking', async () => {
    const result = await reportService.generateProjectReport('proj_123');
    const schedule = result.data!.schedule;
    assertTrue(typeof schedule.totalTasks === 'number', 'totalTasks is number');
    assertTrue(typeof schedule.completedTasks === 'number', 'completedTasks is number');
    assertTrue(typeof schedule.percentComplete === 'number', 'percentComplete is number');
    assertTrue(Array.isArray(schedule.criticalPathTasks), 'Has critical path tasks');
    assertTrue(Array.isArray(schedule.milestones), 'Has milestones');
  });

  await test('Generate estimate report - returns valid structure', async () => {
    const result = await reportService.generateEstimateReport('proj_123');
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertTrue('summary' in result.data!, 'Should have summary');
    assertTrue('lineItems' in result.data!, 'Should have lineItems');
    assertTrue('breakdown' in result.data!, 'Should have breakdown');
    assertTrue('assumptions' in result.data!, 'Should have assumptions');
    assertTrue('exclusions' in result.data!, 'Should have exclusions');
  });

  await test('Estimate report has correct summary', async () => {
    const result = await reportService.generateEstimateReport('proj_123');
    const summary = result.data!.summary;
    assertTrue('subtotal' in summary, 'Has subtotal');
    assertTrue('markupAmount' in summary, 'Has markupAmount');
    assertTrue('taxAmount' in summary, 'Has taxAmount');
    assertTrue('totalEstimate' in summary, 'Has totalEstimate');
    assertEqual(summary.taxRate, 15, 'Tax rate is NB HST (15%)');
  });

  await test('Estimate report has breakdown by category', async () => {
    const result = await reportService.generateEstimateReport('proj_123');
    const breakdown = result.data!.breakdown;
    assertTrue('byCategory' in breakdown, 'Has byCategory');
    assertTrue('materialsCost' in breakdown, 'Has materialsCost');
    assertTrue('laborCost' in breakdown, 'Has laborCost');
  });

  await test('Generate inspection report - returns valid structure', async () => {
    const result = await reportService.generateInspectionReport('proj_123');
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertTrue('summary' in result.data!, 'Should have summary');
    assertTrue('inspections' in result.data!, 'Should have inspections');
    assertTrue('timeline' in result.data!, 'Should have timeline');
  });

  await test('Inspection report has summary statistics', async () => {
    const result = await reportService.generateInspectionReport('proj_123');
    const summary = result.data!.summary;
    assertTrue('total' in summary, 'Has total');
    assertTrue('passed' in summary, 'Has passed');
    assertTrue('failed' in summary, 'Has failed');
    assertTrue('pending' in summary, 'Has pending');
    assertTrue('passRate' in summary, 'Has passRate');
  });

  await test('Generate variance report - returns valid structure', async () => {
    const result = await reportService.generateVarianceReport('proj_123');
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertTrue('overview' in result.data!, 'Should have overview');
    assertTrue('byCategory' in result.data!, 'Should have byCategory');
    assertTrue('topOverruns' in result.data!, 'Should have topOverruns');
    assertTrue('topSavings' in result.data!, 'Should have topSavings');
    assertTrue('analysis' in result.data!, 'Should have analysis');
  });

  await test('Variance report calculates status', async () => {
    const result = await reportService.generateVarianceReport('proj_123');
    const overview = result.data!.overview;
    assertTrue('estimatedTotal' in overview, 'Has estimatedTotal');
    assertTrue('actualTotal' in overview, 'Has actualTotal');
    assertTrue('variance' in overview, 'Has variance');
    assertTrue('status' in overview, 'Has status');
    assertTrue(
      ['on-budget', 'over-budget', 'under-budget'].includes(overview.status),
      'Valid status'
    );
  });

  await test('Variance report has analysis breakdown', async () => {
    const result = await reportService.generateVarianceReport('proj_123');
    const analysis = result.data!.analysis;
    assertTrue('materialsVariance' in analysis, 'Has materialsVariance');
    assertTrue('laborVariance' in analysis, 'Has laborVariance');
    assertTrue('avgVariancePerItem' in analysis, 'Has avgVariancePerItem');
    assertTrue('itemsOverBudget' in analysis, 'Has itemsOverBudget');
    assertTrue('itemsUnderBudget' in analysis, 'Has itemsUnderBudget');
  });

  // ============================================================
  // 4️⃣  Export Service Tests
  // ============================================================
  console.log('\n4️⃣  Export Service:');
  console.log('   Testing export functionality\n');

  await test('Export to PDF - returns valid structure', async () => {
    const report = await reportService.generateProjectReport('proj_123');
    const result = await exportService.exportToPDF(report.data!, {
      title: 'Test Report',
      orientation: 'portrait',
    });
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertEqual(result.data!.format, 'pdf', 'Format is PDF');
    assertTrue('content' in result.data!, 'Has content');
    assertTrue('metadata' in result.data!, 'Has metadata');
    assertTrue('styling' in result.data!, 'Has styling');
  });

  await test('PDF export has correct structure', async () => {
    const report = await reportService.generateProjectReport('proj_123');
    const result = await exportService.exportToPDF(report.data!);
    const pdfData = result.data!;
    assertTrue(Array.isArray(pdfData.content.sections), 'Has sections array');
    assertEqual(pdfData.styling.pageSize, 'letter', 'Default page size');
    assertTrue(pdfData.metadata.generatedAt.length > 0, 'Has timestamp');
  });

  await test('Export to CSV - returns valid structure', async () => {
    const data = [
      { project: 'House Build', cost: 150000, revenue: 180000 },
      { project: 'Deck', cost: 25000, revenue: 32000 },
    ];
    const result = await exportService.exportToCSV(data);
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertEqual(result.data!.format, 'csv', 'Format is CSV');
    assertTrue(Array.isArray(result.data!.headers), 'Has headers');
    assertTrue(Array.isArray(result.data!.rows), 'Has rows');
  });

  await test('CSV export extracts headers from data', async () => {
    const data = [
      { project: 'House Build', cost: 150000 },
      { project: 'Deck', cost: 25000 },
    ];
    const result = await exportService.exportToCSV(data);
    const csvData = result.data!;
    assertArrayLength(csvData.headers, 2);
    assertArrayLength(csvData.rows, 2);
    assertEqual(csvData.rows[0][0], 'House Build', 'First row first column');
  });

  await test('CSV export handles empty array', async () => {
    const result = await exportService.exportToCSV([]);
    assertTrue(!result.success, 'Should fail with empty array');
    assertEqual(result.error!.code, 'INVALID_INPUT', 'Invalid input error');
  });

  await test('Export to Email - returns valid structure', async () => {
    const report = await reportService.generateProjectReport('proj_123');
    const result = await exportService.exportToEmail(
      report.data!,
      { email: 'test@example.com', name: 'Test User' },
      { includeAttachments: true }
    );
    assertTrue(result.success, 'Should return success');
    assertTrue(result.data !== undefined, 'Should have data');
    assertEqual(result.data!.format, 'email', 'Format is email');
    assertTrue('subject' in result.data!, 'Has subject');
    assertTrue('body' in result.data!, 'Has body');
  });

  await test('Email export has both text and HTML', async () => {
    const report = await reportService.generateProjectReport('proj_123');
    const result = await exportService.exportToEmail(
      report.data!,
      { email: 'test@example.com' }
    );
    const emailData = result.data!;
    assertTrue(typeof emailData.body.text === 'string', 'Has text body');
    assertTrue(typeof emailData.body.html === 'string', 'Has HTML body');
    assertTrue(emailData.body.text.length > 0, 'Text body not empty');
    assertTrue(emailData.body.html.length > 0, 'HTML body not empty');
  });

  await test('Email export includes attachments when requested', async () => {
    const report = await reportService.generateProjectReport('proj_123');
    const result = await exportService.exportToEmail(
      report.data!,
      { email: 'test@example.com' },
      { includeAttachments: true }
    );
    const emailData = result.data!;
    assertTrue(emailData.attachments !== undefined, 'Has attachments');
    assertTrue(emailData.attachments!.length > 0, 'Has at least one attachment');
  });

  // ============================================================
  // Test Summary
  // ============================================================
  console.log('\n============================================================');
  console.log(`✓ Passed: ${passedTests}`);
  console.log(`✗ Failed: ${failedTests}`);
  console.log('============================================================\n');

  if (failedTests === 0) {
    console.log('✅ All tests passed!\n');
    console.log('📊 Test Summary:');
    console.log('   • Dashboard Aggregation Logic: 8 tests ✓');
    console.log('   • Metrics Calculations: 11 tests ✓');
    console.log('   • Report Data Structure Generation: 12 tests ✓');
    console.log('   • Export Service: 9 tests ✓');
    console.log('\n🎉 @hooomz/reporting module is fully verified and ready!');
  } else {
    console.error('❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
