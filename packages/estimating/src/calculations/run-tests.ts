/**
 * Simple test runner for calculation functions
 * Run with: npx tsx run-tests.ts
 */

import type { LineItem } from '@hooomz/shared-contracts';
import {
  NB_HST_RATE,
  calculateLineItemTotal,
  calculateWithWaste,
  calculateLaborCost,
  calculateEstimateTotal,
  calculateMargin,
  calculateBreakeven,
  projectProfitability,
  calculateVariance,
  compareEstimateToActual,
} from './index';

// Test counter
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error}`);
    failed++;
  }
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, got ${actual}`
    );
  }
}

function assertCloseTo(actual: number, expected: number, precision = 2) {
  const diff = Math.abs(actual - expected);
  const tolerance = Math.pow(10, -precision);
  if (diff > tolerance) {
    throw new Error(`Expected ${expected}, got ${actual} (diff: ${diff})`);
  }
}

// Helper to create mock line items
function createLineItem(
  description: string,
  quantity: number,
  unitCost: number,
  isLabor: boolean = false,
  category: string = 'general'
): LineItem {
  return {
    id: `item_${Math.random()}`,
    projectId: 'proj_test',
    description,
    quantity,
    unit: isLabor ? 'hour' : 'each',
    unitCost,
    totalCost: quantity * unitCost,
    isLabor,
    category,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
  };
}

console.log('\n🧪 Running Calculation Tests\n');

// Line Item Calculations
console.log('Line Item Calculations:');
test('calculateLineItemTotal - basic', () => {
  assertEqual(calculateLineItemTotal(10, 5.5), 55);
});

test('calculateLineItemTotal - handles negatives', () => {
  assertEqual(calculateLineItemTotal(-10, 5), 0);
});

test('calculateWithWaste - adds waste', () => {
  assertEqual(calculateWithWaste(100, 10), 110);
});

test('calculateLaborCost - calculates correctly', () => {
  assertEqual(calculateLaborCost(8, 45), 360);
});

// Estimate Totals
console.log('\nEstimate Totals:');
test('NB HST rate is correct', () => {
  assertEqual(NB_HST_RATE, 15);
});

const sampleItems: LineItem[] = [
  createLineItem('Lumber', 100, 4.99, false, 'lumber'),
  createLineItem('Drywall', 20, 12.99, false, 'drywall'),
  createLineItem('Carpenter', 40, 45, true, 'carpentry'),
  createLineItem('Electrician', 8, 75, true, 'electrical'),
];

test('calculateEstimateTotal - complete calculation', () => {
  const result = calculateEstimateTotal(sampleItems, 30, NB_HST_RATE);

  assertCloseTo(result.subtotal, 3158.8);
  assertCloseTo(result.materialsSubtotal, 758.8);
  assertCloseTo(result.laborSubtotal, 2400);
  assertCloseTo(result.afterMarkup, 4106.44);
  assertCloseTo(result.taxAmount, 615.97);
  assertCloseTo(result.total, 4722.41);
});

// Margin Analysis
console.log('\nMargin Analysis:');
test('calculateMargin - calculates percentage', () => {
  assertCloseTo(calculateMargin(1500, 1000), 33.33);
});

test('calculateBreakeven - calculates revenue needed', () => {
  assertEqual(calculateBreakeven(10000, 25), 40000);
});

test('projectProfitability - full analysis', () => {
  const analysis = projectProfitability(50000, 30000, 10);

  assertEqual(analysis.revenue, 50000);
  assertEqual(analysis.cost, 30000);
  assertEqual(analysis.grossProfit, 20000);
  assertCloseTo(analysis.grossMarginPercentage, 40);
  assertEqual(analysis.netProfit, 15000);
  assertEqual(analysis.netMarginPercentage, 30);
  assertEqual(analysis.roi, 50);
});

// Variance Analysis
console.log('\nVariance Analysis:');
test('calculateVariance - identifies overruns', () => {
  const variance = calculateVariance(1000, 1200);

  assertEqual(variance.variance, 200);
  assertEqual(variance.variancePercentage, 20);
  assertEqual(variance.status, 'over');
});

test('calculateVariance - identifies savings', () => {
  const variance = calculateVariance(1000, 800);

  assertEqual(variance.variance, -200);
  assertEqual(variance.variancePercentage, -20);
  assertEqual(variance.status, 'under');
});

test('calculateVariance - identifies on-budget', () => {
  const variance = calculateVariance(1000, 1040);
  assertEqual(variance.status, 'on-budget');
});

// Estimate Comparison
console.log('\nEstimate Comparison:');
const estimatedItems: LineItem[] = [
  createLineItem('Lumber', 100, 5.0, false, 'lumber'),
  createLineItem('Drywall', 50, 10.0, false, 'drywall'),
  createLineItem('Carpenter', 40, 45.0, true, 'carpentry'),
];

const actualItems: LineItem[] = [
  createLineItem('Lumber', 110, 5.5, false, 'lumber'),
  createLineItem('Drywall', 45, 10.0, false, 'drywall'),
  createLineItem('Carpenter', 50, 45.0, true, 'carpentry'),
];

test('compareEstimateToActual - provides comparison', () => {
  const comparison = compareEstimateToActual(estimatedItems, actualItems);

  assertEqual(comparison.summary.totalEstimated, 2800);
  assertEqual(comparison.summary.totalActual, 3305);
  assertEqual(comparison.summary.totalVariance, 505);

  if (comparison.overruns.length === 0) {
    throw new Error('Should have identified overruns');
  }

  if (comparison.savings.length === 0) {
    throw new Error('Should have identified savings');
  }
});

// Integration Test
console.log('\nIntegration Test:');
test('Complete estimate workflow', () => {
  const projectItems: LineItem[] = [
    createLineItem('2x4 Lumber', 200, 4.99, false, 'lumber'),
    createLineItem('Drywall Sheets', 30, 12.99, false, 'drywall'),
    createLineItem('Paint', 10, 42.99, false, 'paint'),
    createLineItem('Carpenter', 80, 45, true, 'carpentry'),
    createLineItem('Painter', 40, 35, true, 'painting'),
  ];

  const estimate = calculateEstimateTotal(projectItems, 35, NB_HST_RATE);

  // Verify all fields exist
  if (!estimate.subtotal || estimate.subtotal <= 0) {
    throw new Error('Invalid subtotal');
  }

  if (!estimate.markupAmount || estimate.markupAmount <= 0) {
    throw new Error('Invalid markup');
  }

  if (!estimate.taxAmount || estimate.taxAmount <= 0) {
    throw new Error('Invalid tax');
  }

  if (!estimate.total || estimate.total <= 0) {
    throw new Error('Invalid total');
  }

  // Verify calculations
  const expectedAfterMarkup = Math.round(estimate.subtotal * 1.35 * 100) / 100;
  if (estimate.afterMarkup !== expectedAfterMarkup) {
    throw new Error(`Markup calculation incorrect: ${estimate.afterMarkup} !== ${expectedAfterMarkup}`);
  }

  const expectedTotal = estimate.afterMarkup + estimate.taxAmount;
  if (estimate.total !== expectedTotal) {
    throw new Error(`Total calculation incorrect: ${estimate.total} !== ${expectedTotal}`);
  }

  // Calculate profitability
  const profitability = projectProfitability(estimate.total, estimate.subtotal, 12);

  if (profitability.roi <= 0) {
    throw new Error('ROI should be positive');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✓ Passed: ${passed}`);
console.log(`✗ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
