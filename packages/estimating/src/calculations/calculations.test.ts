/**
 * Tests for calculation functions
 */

import type { LineItem } from '@hooomz/shared-contracts';
import {
  // Constants
  NB_HST_RATE,
  DEFAULT_WASTE_FACTORS,

  // Line item calculations
  calculateLineItemTotal,
  calculateWithWaste,
  calculateLaborCost,
  getDefaultWasteFactor,

  // Estimate totals
  calculateSubtotal,
  calculateMaterialsTotal,
  calculateLaborTotal,
  applyMarkup,
  calculateTax,
  calculateEstimateTotal,

  // Margin analysis
  calculateMargin,
  calculateBreakeven,
  analyzeBreakeven,
  projectProfitability,

  // Comparison functions
  calculateVariance,
  compareEstimateToActual,
  identifyOverruns,
} from './index';

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

// Test suite for line item calculations
describe('Line Item Calculations', () => {
  test('calculateLineItemTotal - basic multiplication', () => {
    expect(calculateLineItemTotal(10, 5.5)).toBe(55);
    expect(calculateLineItemTotal(3, 12.99)).toBe(38.97);
  });

  test('calculateLineItemTotal - handles negative values', () => {
    expect(calculateLineItemTotal(-10, 5)).toBe(0);
    expect(calculateLineItemTotal(10, -5)).toBe(0);
    expect(calculateLineItemTotal(-10, -5)).toBe(0);
  });

  test('calculateLineItemTotal - rounds to 2 decimals', () => {
    expect(calculateLineItemTotal(3, 1.115)).toBe(3.35);
  });

  test('calculateWithWaste - adds waste factor correctly', () => {
    expect(calculateWithWaste(100, 10)).toBe(110);
    expect(calculateWithWaste(100, 15)).toBe(115);
  });

  test('calculateWithWaste - handles negative values', () => {
    expect(calculateWithWaste(-100, 10)).toBe(0);
    expect(calculateWithWaste(100, -10)).toBe(100); // Negative waste treated as 0
  });

  test('calculateLaborCost - calculates hours * rate', () => {
    expect(calculateLaborCost(8, 45)).toBe(360);
    expect(calculateLaborCost(4.5, 75)).toBe(337.5);
  });

  test('calculateLaborCost - handles negative values', () => {
    expect(calculateLaborCost(-8, 45)).toBe(0);
    expect(calculateLaborCost(8, -45)).toBe(0);
  });

  test('getDefaultWasteFactor - returns correct factors', () => {
    expect(getDefaultWasteFactor('lumber')).toBe(10);
    expect(getDefaultWasteFactor('drywall')).toBe(15);
    expect(getDefaultWasteFactor('tile')).toBe(15);
    expect(getDefaultWasteFactor('paint')).toBe(5);
  });

  test('getDefaultWasteFactor - returns default for unknown category', () => {
    expect(getDefaultWasteFactor('unknown')).toBe(10);
  });
});

// Test suite for estimate totals
describe('Estimate Totals Calculations', () => {
  const sampleLineItems: LineItem[] = [
    createLineItem('2x4 Lumber', 100, 4.99, false, 'lumber'),
    createLineItem('Drywall Sheet', 20, 12.99, false, 'drywall'),
    createLineItem('Carpenter Labor', 40, 45, true, 'carpentry'),
    createLineItem('Electrician Labor', 8, 75, true, 'electrical'),
  ];

  test('calculateSubtotal - sums all line items', () => {
    const subtotal = calculateSubtotal(sampleLineItems);
    // 100*4.99 + 20*12.99 + 40*45 + 8*75 = 499 + 259.8 + 1800 + 600 = 3158.8
    expect(subtotal).toBe(3158.8);
  });

  test('calculateSubtotal - handles empty array', () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  test('calculateMaterialsTotal - sums only material items', () => {
    const materialsTotal = calculateMaterialsTotal(sampleLineItems);
    // 499 + 259.8 = 758.8
    expect(materialsTotal).toBe(758.8);
  });

  test('calculateLaborTotal - sums only labor items', () => {
    const laborTotal = calculateLaborTotal(sampleLineItems);
    // 1800 + 600 = 2400
    expect(laborTotal).toBe(2400);
  });

  test('applyMarkup - adds markup percentage correctly', () => {
    expect(applyMarkup(1000, 50)).toBe(1500);
    expect(applyMarkup(1000, 25)).toBe(1250);
    expect(applyMarkup(1000, 0)).toBe(1000);
  });

  test('applyMarkup - handles negative values', () => {
    expect(applyMarkup(-1000, 50)).toBe(0);
    expect(applyMarkup(1000, -50)).toBe(1000); // Negative markup treated as 0
  });

  test('calculateTax - calculates NB HST correctly', () => {
    expect(calculateTax(1000, NB_HST_RATE)).toBe(150);
    expect(calculateTax(1000, 15)).toBe(150);
    expect(calculateTax(500.5, 15)).toBe(75.08);
  });

  test('calculateTax - handles negative values', () => {
    expect(calculateTax(-1000, 15)).toBe(0);
    expect(calculateTax(1000, -15)).toBe(0);
  });

  test('calculateEstimateTotal - complete calculation with markup and tax', () => {
    const result = calculateEstimateTotal(sampleLineItems, 30, NB_HST_RATE);

    expect(result.subtotal).toBe(3158.8);
    expect(result.materialsSubtotal).toBe(758.8);
    expect(result.laborSubtotal).toBe(2400);

    // Subtotal with 30% markup: 3158.8 * 1.3 = 4106.44
    expect(result.afterMarkup).toBe(4106.44);
    expect(result.markupAmount).toBe(947.64);

    // Tax on after-markup amount: 4106.44 * 0.15 = 615.97
    expect(result.taxAmount).toBe(615.97);

    // Total: 4106.44 + 615.97 = 4722.41
    expect(result.total).toBe(4722.41);
  });

  test('calculateEstimateTotal - works without markup', () => {
    const result = calculateEstimateTotal(sampleLineItems, 0, NB_HST_RATE);

    expect(result.subtotal).toBe(3158.8);
    expect(result.afterMarkup).toBe(3158.8);
    expect(result.markupAmount).toBe(0);

    // Tax: 3158.8 * 0.15 = 473.82
    expect(result.taxAmount).toBe(473.82);
    expect(result.total).toBe(3632.62);
  });

  test('calculateEstimateTotal - works without tax', () => {
    const result = calculateEstimateTotal(sampleLineItems, 30, 0);

    expect(result.subtotal).toBe(3158.8);
    expect(result.afterMarkup).toBe(4106.44);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(4106.44);
  });
});

// Test suite for margin analysis
describe('Margin Analysis', () => {
  test('calculateMargin - calculates profit margin percentage', () => {
    expect(calculateMargin(1500, 1000)).toBe(33.33);
    expect(calculateMargin(2000, 1500)).toBe(25);
    expect(calculateMargin(1000, 800)).toBe(20);
  });

  test('calculateMargin - handles zero and negative values', () => {
    expect(calculateMargin(0, 1000)).toBe(0);
    expect(calculateMargin(-1000, 500)).toBe(0);
    expect(calculateMargin(1000, -500)).toBe(0);
  });

  test('calculateMargin - handles 100% margin', () => {
    expect(calculateMargin(1000, 0)).toBe(100);
  });

  test('calculateBreakeven - calculates breakeven revenue', () => {
    // $10,000 fixed costs at 25% margin = $40,000 breakeven
    expect(calculateBreakeven(10000, 25)).toBe(40000);

    // $5,000 fixed costs at 20% margin = $25,000 breakeven
    expect(calculateBreakeven(5000, 20)).toBe(25000);
  });

  test('calculateBreakeven - handles edge cases', () => {
    expect(calculateBreakeven(-5000, 25)).toBe(0); // Negative fixed costs
    expect(calculateBreakeven(5000, 0)).toBe(Infinity); // Zero margin
    expect(calculateBreakeven(5000, 100)).toBe(Infinity); // 100% margin
  });

  test('analyzeBreakeven - provides detailed analysis', () => {
    const analysis = analyzeBreakeven(10000, 25, 100, 500);

    expect(analysis.fixedCosts).toBe(10000);
    expect(analysis.marginPercentage).toBe(25);
    expect(analysis.breakevenRevenue).toBe(40000);
    expect(analysis.breakevenUnits).toBe(400); // 40000 / 100
    expect(analysis.daysToBreakeven).toBe(80); // 40000 / 500
  });

  test('analyzeBreakeven - works without unit price or daily revenue', () => {
    const analysis = analyzeBreakeven(10000, 25);

    expect(analysis.breakevenRevenue).toBe(40000);
    expect(analysis.breakevenUnits).toBe(0);
    expect(analysis.daysToBreakeven).toBe(0);
  });

  test('projectProfitability - calculates profitability metrics', () => {
    const analysis = projectProfitability(50000, 30000, 10);

    expect(analysis.revenue).toBe(50000);
    expect(analysis.cost).toBe(30000);
    expect(analysis.grossProfit).toBe(20000);
    expect(analysis.grossMarginPercentage).toBe(40);

    // Overhead: 50000 * 0.1 = 5000
    // Net profit: 20000 - 5000 = 15000
    expect(analysis.netProfit).toBe(15000);
    expect(analysis.netMarginPercentage).toBe(30); // 15000 / 50000

    // ROI: 15000 / 30000 = 50%
    expect(analysis.roi).toBe(50);
  });

  test('projectProfitability - handles negative profit', () => {
    const analysis = projectProfitability(30000, 40000, 10);

    expect(analysis.grossProfit).toBe(-10000);
    expect(analysis.netProfit).toBe(-13000); // -10000 - 3000 overhead
    expect(analysis.roi).toBe(-32.5); // -13000 / 40000
  });
});

// Test suite for variance calculations
describe('Variance Calculations', () => {
  test('calculateVariance - calculates variance correctly', () => {
    const variance = calculateVariance(1000, 1200);

    expect(variance.estimated).toBe(1000);
    expect(variance.actual).toBe(1200);
    expect(variance.variance).toBe(200);
    expect(variance.variancePercentage).toBe(20);
    expect(variance.status).toBe('over');
  });

  test('calculateVariance - identifies under budget', () => {
    const variance = calculateVariance(1000, 800);

    expect(variance.variance).toBe(-200);
    expect(variance.variancePercentage).toBe(-20);
    expect(variance.status).toBe('under');
  });

  test('calculateVariance - identifies on-budget (within 5%)', () => {
    const variance1 = calculateVariance(1000, 1040);
    expect(variance1.status).toBe('on-budget');

    const variance2 = calculateVariance(1000, 970);
    expect(variance2.status).toBe('on-budget');

    const variance3 = calculateVariance(1000, 1000);
    expect(variance3.status).toBe('on-budget');
  });

  test('calculateVariance - handles edge cases', () => {
    const variance = calculateVariance(0, 1000);
    expect(variance.variancePercentage).toBe(0);
  });
});

// Test suite for estimate comparisons
describe('Estimate Comparison', () => {
  const estimatedItems: LineItem[] = [
    createLineItem('Lumber', 100, 5.0, false, 'lumber'),
    createLineItem('Drywall', 50, 10.0, false, 'drywall'),
    createLineItem('Carpenter', 40, 45.0, true, 'carpentry'),
  ];

  const actualItems: LineItem[] = [
    createLineItem('Lumber', 110, 5.5, false, 'lumber'), // Over on quantity and price
    createLineItem('Drywall', 45, 10.0, false, 'drywall'), // Under on quantity
    createLineItem('Carpenter', 50, 45.0, true, 'carpentry'), // Over on hours
  ];

  test('compareEstimateToActual - provides detailed comparison', () => {
    const comparison = compareEstimateToActual(estimatedItems, actualItems);

    // Estimated: 500 + 500 + 1800 = 2800
    expect(comparison.summary.totalEstimated).toBe(2800);

    // Actual: 605 + 450 + 2250 = 3305
    expect(comparison.summary.totalActual).toBe(3305);

    // Variance: 3305 - 2800 = 505
    expect(comparison.summary.totalVariance).toBe(505);
    expect(comparison.summary.totalVariancePercentage).toBeCloseTo(18.04, 1);
  });

  test('compareEstimateToActual - identifies overruns', () => {
    const comparison = compareEstimateToActual(estimatedItems, actualItems);

    expect(comparison.overruns.length).toBeGreaterThan(0);

    // Lumber should be in overruns (605 vs 500)
    const lumberOverrun = comparison.overruns.find(item =>
      item.description.toLowerCase().includes('lumber')
    );
    expect(lumberOverrun).toBeDefined();
    expect(lumberOverrun?.variance).toBeGreaterThan(0);
  });

  test('compareEstimateToActual - identifies savings', () => {
    const comparison = compareEstimateToActual(estimatedItems, actualItems);

    expect(comparison.savings.length).toBeGreaterThan(0);

    // Drywall should be in savings (450 vs 500)
    const drywallSaving = comparison.savings.find(item =>
      item.description.toLowerCase().includes('drywall')
    );
    expect(drywallSaving).toBeDefined();
    expect(drywallSaving?.variance).toBeLessThan(0);
  });

  test('identifyOverruns - filters by threshold', () => {
    // Default threshold is 10%
    const overruns = identifyOverruns(estimatedItems, actualItems, 10);

    // Only items with >10% variance should be included
    overruns.forEach(item => {
      expect(Math.abs(item.variancePercentage)).toBeGreaterThanOrEqual(10);
    });
  });

  test('identifyOverruns - works with different thresholds', () => {
    const overruns5 = identifyOverruns(estimatedItems, actualItems, 5);
    const overruns20 = identifyOverruns(estimatedItems, actualItems, 20);

    // Lower threshold should have more or equal items
    expect(overruns5.length).toBeGreaterThanOrEqual(overruns20.length);
  });
});

// Test suite for constants
describe('Constants', () => {
  test('NB_HST_RATE is correct', () => {
    expect(NB_HST_RATE).toBe(15);
  });

  test('DEFAULT_WASTE_FACTORS contains expected categories', () => {
    expect(DEFAULT_WASTE_FACTORS.lumber).toBe(10);
    expect(DEFAULT_WASTE_FACTORS.drywall).toBe(15);
    expect(DEFAULT_WASTE_FACTORS.tile).toBe(15);
    expect(DEFAULT_WASTE_FACTORS.paint).toBe(5);
    expect(DEFAULT_WASTE_FACTORS.concrete).toBe(5);
    expect(DEFAULT_WASTE_FACTORS.insulation).toBe(10);
    expect(DEFAULT_WASTE_FACTORS.roofing).toBe(10);
  });
});

// Integration test
describe('Integration: Complete Estimate Flow', () => {
  test('Calculate complete estimate with all features', () => {
    // Create a realistic project estimate
    const lineItems: LineItem[] = [
      // Materials
      createLineItem('2x4 Lumber', 200, 4.99, false, 'lumber'),
      createLineItem('Drywall Sheets', 30, 12.99, false, 'drywall'),
      createLineItem('Paint (gallons)', 10, 42.99, false, 'paint'),
      createLineItem('Flooring (sqft)', 500, 2.49, false, 'flooring'),

      // Labor
      createLineItem('Carpenter Labor', 80, 45, true, 'carpentry'),
      createLineItem('Drywall Labor (sqft)', 800, 1.25, true, 'drywall'),
      createLineItem('Painter Labor (sqft)', 1000, 1.5, true, 'painting'),
    ];

    // Calculate totals with 35% markup and NB HST
    const estimate = calculateEstimateTotal(lineItems, 35, NB_HST_RATE);

    // Verify structure
    expect(estimate).toHaveProperty('subtotal');
    expect(estimate).toHaveProperty('markupAmount');
    expect(estimate).toHaveProperty('afterMarkup');
    expect(estimate).toHaveProperty('taxAmount');
    expect(estimate).toHaveProperty('total');
    expect(estimate).toHaveProperty('materialsSubtotal');
    expect(estimate).toHaveProperty('laborSubtotal');

    // Verify all values are positive
    expect(estimate.subtotal).toBeGreaterThan(0);
    expect(estimate.markupAmount).toBeGreaterThan(0);
    expect(estimate.afterMarkup).toBeGreaterThan(0);
    expect(estimate.taxAmount).toBeGreaterThan(0);
    expect(estimate.total).toBeGreaterThan(0);

    // Verify materials and labor are separated correctly
    expect(estimate.materialsSubtotal).toBeGreaterThan(0);
    expect(estimate.laborSubtotal).toBeGreaterThan(0);
    expect(estimate.materialsSubtotal + estimate.laborSubtotal).toBe(estimate.subtotal);

    // Verify markup calculation
    expect(estimate.afterMarkup).toBe(
      Math.round((estimate.subtotal * 1.35) * 100) / 100
    );

    // Verify total calculation
    expect(estimate.total).toBe(estimate.afterMarkup + estimate.taxAmount);

    // Calculate profitability
    const profitability = projectProfitability(estimate.total, estimate.subtotal, 12);
    expect(profitability.revenue).toBe(estimate.total);
    expect(profitability.cost).toBe(estimate.subtotal);
    expect(profitability.grossProfit).toBeGreaterThan(0);
    expect(profitability.roi).toBeGreaterThan(0);
  });
});

console.log('All calculation tests completed successfully!');
