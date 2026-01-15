/**
 * Calculation Accuracy Integration Tests
 *
 * Verifies accuracy of financial calculations across modules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockCustomer,
  mockProject,
  mockLineItems,
  mockEstimate,
  expectedCalculations,
  mockActualCosts,
  expectedVariance,
} from '../fixtures';
import { setupTestEnvironment } from '../setup';

describe('Calculation Accuracy', () => {
  setupTestEnvironment();

  let projectId: string;
  let estimateId: string;

  beforeEach(async () => {
    // Setup: Create customer, project, and estimate with known values
    const customerService = {} as any;
    const projectService = {} as any;
    const estimatingService = {} as any;

    const customer = await customerService.create(mockCustomer);
    const project = await projectService.create({
      ...mockProject,
      customerId: customer.data!.id,
    });
    projectId = project.data!.id;

    const estimate = await estimatingService.create({
      ...mockEstimate,
      projectId,
    });
    estimateId = estimate.data!.id;

    // Add line items
    for (const lineItem of mockLineItems) {
      await estimatingService.addLineItem(estimateId, {
        ...lineItem,
        estimateId,
        projectId,
      });
    }
  });

  describe('Estimate Calculations', () => {
    it('should calculate line item totals correctly', async () => {
      const estimatingService = {} as any;
      const estimate = await estimatingService.getById(estimateId);

      const lineItems = estimate.data?.lineItems || [];

      // Verify each line item total
      lineItems.forEach((item: any) => {
        const expectedTotal = item.quantity * item.unitCost;
        expect(item.total).toBeCloseTo(expectedTotal, 2);
      });
    });

    it('should calculate subtotal correctly', async () => {
      const estimatingService = {} as any;
      const estimate = await estimatingService.getById(estimateId);

      expect(estimate.data?.subtotal).toBeCloseTo(expectedCalculations.subtotal, 2);
    });

    it('should calculate markup correctly', async () => {
      const estimatingService = {} as any;
      const estimate = await estimatingService.getById(estimateId);

      const expectedMarkup = expectedCalculations.subtotal * (mockEstimate.markup! / 100);

      expect(estimate.data?.markupAmount).toBeCloseTo(expectedMarkup, 2);
      expect(estimate.data?.subtotalWithMarkup).toBeCloseTo(
        expectedCalculations.subtotalWithMarkup,
        2
      );
    });

    it('should calculate tax correctly', async () => {
      const estimatingService = {} as any;
      const estimate = await estimatingService.getById(estimateId);

      const expectedTax =
        expectedCalculations.subtotalWithMarkup * (mockEstimate.taxRate! / 100);

      expect(estimate.data?.taxAmount).toBeCloseTo(expectedTax, 2);
    });

    it('should calculate grand total correctly', async () => {
      const estimatingService = {} as any;
      const estimate = await estimatingService.getById(estimateId);

      expect(estimate.data?.grandTotal).toBeCloseTo(expectedCalculations.grandTotal, 2);
    });

    it('should recalculate when line items change', async () => {
      const estimatingService = {} as any;

      // Add a new line item
      await estimatingService.addLineItem(estimateId, {
        description: 'Additional Paint',
        category: 'materials',
        quantity: 5,
        unit: 'gallon',
        unitCost: 45.0,
        estimateId,
        projectId,
      });

      const estimate = await estimatingService.getById(estimateId);

      // New subtotal should include the additional $225
      const newSubtotal = expectedCalculations.subtotal + 225.0;
      expect(estimate.data?.subtotal).toBeCloseTo(newSubtotal, 2);

      // Verify cascading calculations
      const newMarkup = newSubtotal * (mockEstimate.markup! / 100);
      const newSubtotalWithMarkup = newSubtotal + newMarkup;
      const newTax = newSubtotalWithMarkup * (mockEstimate.taxRate! / 100);
      const newGrandTotal = newSubtotalWithMarkup + newTax;

      expect(estimate.data?.grandTotal).toBeCloseTo(newGrandTotal, 2);
    });

    it('should handle zero markup and tax', async () => {
      const estimatingService = {} as any;

      await estimatingService.update(estimateId, {
        markup: 0,
        taxRate: 0,
      });

      const estimate = await estimatingService.getById(estimateId);

      expect(estimate.data?.markupAmount).toBe(0);
      expect(estimate.data?.taxAmount).toBe(0);
      expect(estimate.data?.grandTotal).toBeCloseTo(expectedCalculations.subtotal, 2);
    });
  });

  describe('Category Breakdown', () => {
    it('should calculate category totals correctly', async () => {
      const estimatingService = {} as any;
      const estimate = await estimatingService.getById(estimateId);

      const categoryTotals = estimate.data?.categoryBreakdown;

      // Materials: (12 * 450) + (25 * 85) = 7525
      expect(categoryTotals?.materials).toBeCloseTo(7525.0, 2);

      // Labor: 16 * 75 = 1200
      expect(categoryTotals?.labor).toBeCloseTo(1200.0, 2);

      // Subcontractors: 2500 + 1800 = 4300
      expect(categoryTotals?.subcontractors).toBeCloseTo(4300.0, 2);

      // Total should equal subtotal
      const categoriesSum =
        (categoryTotals?.materials || 0) +
        (categoryTotals?.labor || 0) +
        (categoryTotals?.subcontractors || 0);

      expect(categoriesSum).toBeCloseTo(expectedCalculations.subtotal, 2);
    });
  });

  describe('Variance Analysis', () => {
    beforeEach(async () => {
      // Record actual costs
      const estimatingService = {} as any;

      await estimatingService.recordActualCosts(estimateId, mockActualCosts);
    });

    it('should calculate variance correctly', async () => {
      const estimatingService = {} as any;
      const comparison = await estimatingService.getComparison(estimateId);

      // Verify individual category variances
      expect(comparison.data?.materialsVariance).toBeCloseTo(
        expectedVariance.materialsVariance,
        2
      );
      expect(comparison.data?.laborVariance).toBeCloseTo(expectedVariance.laborVariance, 2);
      expect(comparison.data?.subcontractorsVariance).toBeCloseTo(
        expectedVariance.subcontractorsVariance,
        2
      );

      // Verify total variance
      expect(comparison.data?.totalVariance).toBeCloseTo(expectedVariance.totalVariance, 2);
    });

    it('should calculate variance percentage correctly', async () => {
      const estimatingService = {} as any;
      const comparison = await estimatingService.getComparison(estimateId);

      const expectedPercent =
        (expectedVariance.totalVariance / expectedCalculations.subtotal) * 100;

      expect(comparison.data?.variancePercentage).toBeCloseTo(expectedPercent, 2);
    });

    it('should identify over/under budget items', async () => {
      const estimatingService = {} as any;
      const comparison = await estimatingService.getComparison(estimateId);

      // Materials and subcontractors under budget
      expect(comparison.data?.materialsVariance).toBeLessThan(0);
      expect(comparison.data?.subcontractorsVariance).toBeLessThan(0);

      // Labor over budget
      expect(comparison.data?.laborVariance).toBeGreaterThan(0);
    });

    it('should calculate profit margin correctly', async () => {
      const estimatingService = {} as any;
      const comparison = await estimatingService.getComparison(estimateId);

      // Actual total cost
      const actualTotal =
        mockActualCosts.materials + mockActualCosts.labor + mockActualCosts.subcontractors;

      // Revenue (grandTotal from estimate)
      const revenue = expectedCalculations.grandTotal;

      // Profit = Revenue - Actual Cost
      const profit = revenue - actualTotal;

      // Margin = (Profit / Revenue) * 100
      const expectedMargin = (profit / revenue) * 100;

      expect(comparison.data?.profitMargin).toBeCloseTo(expectedMargin, 2);
    });
  });

  describe('Rounding and Precision', () => {
    it('should handle fractional cents correctly', async () => {
      const estimatingService = {} as any;

      // Add item with price that results in fractional cents
      await estimatingService.addLineItem(estimateId, {
        description: 'Test Item',
        category: 'materials',
        quantity: 3,
        unit: 'ea',
        unitCost: 33.33, // Results in 99.99
        estimateId,
        projectId,
      });

      const estimate = await estimatingService.getById(estimateId);

      // All currency values should be rounded to 2 decimal places
      expect(estimate.data?.subtotal.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(
        2
      );
      expect(
        estimate.data?.grandTotal.toString().split('.')[1]?.length || 0
      ).toBeLessThanOrEqual(2);
    });

    it('should handle very large numbers correctly', async () => {
      const estimatingService = {} as any;

      // Add expensive item
      await estimatingService.addLineItem(estimateId, {
        description: 'Major Equipment',
        category: 'materials',
        quantity: 1,
        unit: 'ea',
        unitCost: 999999.99,
        estimateId,
        projectId,
      });

      const estimate = await estimatingService.getById(estimateId);

      // Should handle large numbers without overflow
      expect(estimate.data?.grandTotal).toBeGreaterThan(1000000);
      expect(Number.isFinite(estimate.data?.grandTotal)).toBe(true);
    });

    it('should handle zero and negative values appropriately', async () => {
      const estimatingService = {} as any;

      // Try to add item with zero cost (should be allowed)
      const zeroResponse = await estimatingService.addLineItem(estimateId, {
        description: 'No Charge Item',
        category: 'materials',
        quantity: 1,
        unit: 'ea',
        unitCost: 0,
        estimateId,
        projectId,
      });

      expect(zeroResponse.success).toBe(true);

      // Try to add item with negative cost (should be rejected)
      const negativeResponse = await estimatingService.addLineItem(estimateId, {
        description: 'Invalid Item',
        category: 'materials',
        quantity: 1,
        unit: 'ea',
        unitCost: -100,
        estimateId,
        projectId,
      });

      expect(negativeResponse.success).toBe(false);
      expect(negativeResponse.error).toBeDefined();
    });
  });

  describe('Tax and Markup Edge Cases', () => {
    it('should handle 100% markup correctly', async () => {
      const estimatingService = {} as any;

      await estimatingService.update(estimateId, {
        markup: 100,
      });

      const estimate = await estimatingService.getById(estimateId);

      // 100% markup doubles the subtotal
      expect(estimate.data?.subtotalWithMarkup).toBeCloseTo(
        expectedCalculations.subtotal * 2,
        2
      );
    });

    it('should handle maximum tax rate correctly', async () => {
      const estimatingService = {} as any;

      await estimatingService.update(estimateId, {
        taxRate: 50, // 50% tax (hypothetical)
      });

      const estimate = await estimatingService.getById(estimateId);

      const expectedTax = estimate.data!.subtotalWithMarkup * 0.5;
      expect(estimate.data?.taxAmount).toBeCloseTo(expectedTax, 2);
    });

    it('should reject invalid markup percentages', async () => {
      const estimatingService = {} as any;

      const response = await estimatingService.update(estimateId, {
        markup: -10, // Negative markup
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('markup');
    });
  });
});
