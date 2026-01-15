/**
 * Estimation Calculation Functions
 *
 * Pure functions for cost calculations, markup, margin, and totals.
 * These functions are stateless and can be used independently.
 *
 * All monetary values are handled as dollars (not cents) for simplicity.
 * Results are rounded to 2 decimal places where appropriate.
 */

import type { LineItem } from '@hooomz/shared-contracts';

// ============================================================================
// Constants
// ============================================================================

/**
 * New Brunswick HST rate (15%)
 */
export const NB_HST_RATE = 15;

/**
 * Default waste percentages by category
 */
export const DEFAULT_WASTE_FACTORS: Record<string, number> = {
  lumber: 10,
  drywall: 15,
  flooring: 10,
  tile: 15,
  paint: 5,
  concrete: 5,
  insulation: 10,
  roofing: 10,
  siding: 10,
};

/**
 * Markup calculation result
 */
export interface MarkupResult {
  cost: number;
  markup: number;
  markupPercentage: number;
  price: number;
  margin: number;
  marginPercentage: number;
}

/**
 * Line item total calculation
 */
export interface LineItemTotal {
  lineItemId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  markup: number;
  price: number;
  isLabor: boolean;
}

/**
 * Estimate totals
 */
export interface EstimateTotals {
  // Costs
  materialCost: number;
  laborCost: number;
  totalCost: number;

  // Pricing
  materialPrice: number;
  laborPrice: number;
  totalPrice: number;

  // Markup
  materialMarkup: number;
  laborMarkup: number;
  totalMarkup: number;

  // Margins
  materialMargin: number;
  laborMargin: number;
  totalMargin: number;
  totalMarginPercentage: number;

  // Counts
  totalLineItems: number;
  materialLineItems: number;
  laborLineItems: number;
}

/**
 * Variance analysis result
 */
export interface VarianceAnalysis {
  estimated: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'under' | 'on-budget' | 'over';
}

/**
 * Line item comparison result
 */
export interface LineItemComparison {
  description: string;
  category?: string;
  estimated: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  isOverrun: boolean;
}

/**
 * Estimate vs actual comparison
 */
export interface EstimateComparison {
  summary: {
    totalEstimated: number;
    totalActual: number;
    totalVariance: number;
    totalVariancePercentage: number;
    materialVariance: number;
    laborVariance: number;
  };
  lineItems: LineItemComparison[];
  overruns: LineItemComparison[];
  savings: LineItemComparison[];
}

/**
 * Profitability analysis
 */
export interface ProfitabilityAnalysis {
  revenue: number;
  cost: number;
  grossProfit: number;
  grossMargin: number;
  grossMarginPercentage: number;
  netProfit: number; // After overhead
  netMarginPercentage: number;
  roi: number; // Return on investment percentage
}

/**
 * Breakeven analysis
 */
export interface BreakevenAnalysis {
  fixedCosts: number;
  marginPercentage: number;
  breakevenRevenue: number;
  breakevenUnits: number; // If unit price provided
  daysToBreakeven: number; // If daily revenue provided
}

// ============================================================================
// Basic Line Item Calculations
// ============================================================================

/**
 * Calculate line item total
 *
 * @param quantity - Number of units
 * @param unitCost - Cost per unit (in dollars)
 * @returns Total cost (in dollars)
 */
export function calculateLineItemTotal(quantity: number, unitCost: number): number {
  if (quantity < 0 || unitCost < 0) return 0;
  return Math.round(quantity * unitCost * 100) / 100;
}

/**
 * Calculate quantity with waste factor
 *
 * @param quantity - Base quantity needed
 * @param wastePercentage - Waste factor (e.g., 10 for 10%)
 * @returns Quantity including waste
 */
export function calculateWithWaste(quantity: number, wastePercentage: number): number {
  if (quantity < 0) return 0;
  if (wastePercentage < 0) wastePercentage = 0;

  return Math.ceil(quantity * (1 + wastePercentage / 100) * 100) / 100;
}

/**
 * Calculate labor cost
 *
 * @param hours - Number of hours
 * @param hourlyRate - Rate per hour (in dollars)
 * @returns Total labor cost (in dollars)
 */
export function calculateLaborCost(hours: number, hourlyRate: number): number {
  if (hours < 0 || hourlyRate < 0) return 0;
  return Math.round(hours * hourlyRate * 100) / 100;
}

/**
 * Get default waste factor for a category
 */
export function getDefaultWasteFactor(category: string): number {
  const lowerCategory = category.toLowerCase();
  return DEFAULT_WASTE_FACTORS[lowerCategory] || 10; // Default to 10%
}

// ============================================================================
// Estimate Totals Calculations
// ============================================================================

/**
 * Calculate subtotal (sum of all line items)
 *
 * @param lineItems - Array of line items
 * @returns Subtotal (in dollars)
 */
export function calculateSubtotal(lineItems: LineItem[]): number {
  if (!lineItems || lineItems.length === 0) return 0;

  const total = lineItems.reduce((sum, item) => {
    const itemTotal = calculateLineItemTotal(item.quantity || 0, item.unitCost || 0);
    return sum + itemTotal;
  }, 0);

  return Math.round(total * 100) / 100;
}

/**
 * Calculate materials total (non-labor items)
 *
 * @param lineItems - Array of line items
 * @returns Materials total (in dollars)
 */
export function calculateMaterialsTotal(lineItems: LineItem[]): number {
  if (!lineItems || lineItems.length === 0) return 0;

  const materials = lineItems.filter((item) => !item.isLabor);
  return calculateSubtotal(materials);
}

/**
 * Calculate labor total (labor items only)
 *
 * @param lineItems - Array of line items
 * @returns Labor total (in dollars)
 */
export function calculateLaborTotal(lineItems: LineItem[]): number {
  if (!lineItems || lineItems.length === 0) return 0;

  const labor = lineItems.filter((item) => item.isLabor);
  return calculateSubtotal(labor);
}

/**
 * Apply markup to an amount
 *
 * @param amount - Base amount (in dollars)
 * @param markupPercentage - Markup percentage (e.g., 50 for 50%)
 * @returns Amount after markup (in dollars)
 */
export function applyMarkup(amount: number, markupPercentage: number): number {
  if (amount < 0) return 0;
  if (markupPercentage < 0) return amount;

  return Math.round(amount * (1 + markupPercentage / 100) * 100) / 100;
}

/**
 * Calculate tax (HST for New Brunswick)
 *
 * @param amount - Amount to tax (in dollars)
 * @param taxRate - Tax rate (default 15 for NB HST)
 * @returns Tax amount (in dollars)
 */
export function calculateTax(amount: number, taxRate: number = NB_HST_RATE): number {
  if (amount < 0) return 0;
  if (taxRate < 0) return 0;

  return Math.round(amount * (taxRate / 100) * 100) / 100;
}

/**
 * Calculate complete estimate total
 *
 * @param lineItems - Array of line items
 * @param markupPercentage - Markup to apply to subtotal
 * @param taxRate - Tax rate (default 15 for NB HST)
 * @returns Object with subtotal, markup, tax, and total
 */
export function calculateEstimateTotal(
  lineItems: LineItem[],
  markupPercentage: number = 0,
  taxRate: number = NB_HST_RATE
): {
  subtotal: number;
  markupAmount: number;
  afterMarkup: number;
  taxAmount: number;
  total: number;
  materialsSubtotal: number;
  laborSubtotal: number;
} {
  const subtotal = calculateSubtotal(lineItems);
  const materialsSubtotal = calculateMaterialsTotal(lineItems);
  const laborSubtotal = calculateLaborTotal(lineItems);

  const afterMarkup = applyMarkup(subtotal, markupPercentage);
  const markupAmount = afterMarkup - subtotal;

  const taxAmount = calculateTax(afterMarkup, taxRate);
  const total = afterMarkup + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    markupAmount: Math.round(markupAmount * 100) / 100,
    afterMarkup: Math.round(afterMarkup * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    materialsSubtotal: Math.round(materialsSubtotal * 100) / 100,
    laborSubtotal: Math.round(laborSubtotal * 100) / 100,
  };
}

// ============================================================================
// Margin Analysis
// ============================================================================

/**
 * Calculate profit margin
 *
 * @param revenue - Total revenue (in dollars)
 * @param cost - Total cost (in dollars)
 * @returns Margin percentage
 */
export function calculateMargin(revenue: number, cost: number): number {
  if (revenue <= 0) return 0;
  if (cost < 0) return 0;

  const margin = ((revenue - cost) / revenue) * 100;
  return Math.round(margin * 100) / 100;
}

/**
 * Calculate breakeven point
 *
 * @param fixedCosts - Fixed costs (overhead, equipment, etc.)
 * @param marginPercentage - Profit margin percentage
 * @returns Breakeven revenue needed
 */
export function calculateBreakeven(fixedCosts: number, marginPercentage: number): number {
  if (fixedCosts < 0) return 0;
  if (marginPercentage <= 0 || marginPercentage >= 100) return Infinity;

  // Breakeven = Fixed Costs / Margin%
  return Math.round((fixedCosts / (marginPercentage / 100)) * 100) / 100;
}

/**
 * Detailed breakeven analysis
 *
 * @param fixedCosts - Fixed costs for the period
 * @param marginPercentage - Expected margin percentage
 * @param unitPrice - Optional: price per unit for unit breakeven
 * @param dailyRevenue - Optional: daily revenue for time breakeven
 */
export function analyzeBreakeven(
  fixedCosts: number,
  marginPercentage: number,
  unitPrice?: number,
  dailyRevenue?: number
): BreakevenAnalysis {
  const breakevenRevenue = calculateBreakeven(fixedCosts, marginPercentage);

  let breakevenUnits = 0;
  if (unitPrice && unitPrice > 0) {
    breakevenUnits = Math.ceil(breakevenRevenue / unitPrice);
  }

  let daysToBreakeven = 0;
  if (dailyRevenue && dailyRevenue > 0) {
    daysToBreakeven = Math.ceil(breakevenRevenue / dailyRevenue);
  }

  return {
    fixedCosts,
    marginPercentage,
    breakevenRevenue: Math.round(breakevenRevenue * 100) / 100,
    breakevenUnits,
    daysToBreakeven,
  };
}

/**
 * Project profitability analysis
 *
 * @param estimatedRevenue - Expected revenue from estimate
 * @param actualCosts - Actual costs incurred
 * @param overheadPercentage - Overhead as % of revenue (default 10%)
 * @returns Detailed profitability analysis
 */
export function projectProfitability(
  estimatedRevenue: number,
  actualCosts: number,
  overheadPercentage: number = 10
): ProfitabilityAnalysis {
  if (estimatedRevenue < 0) estimatedRevenue = 0;
  if (actualCosts < 0) actualCosts = 0;

  const grossProfit = estimatedRevenue - actualCosts;
  const grossMargin = grossProfit;
  const grossMarginPercentage = calculateMargin(estimatedRevenue, actualCosts);

  // Calculate overhead cost
  const overheadCost = estimatedRevenue * (overheadPercentage / 100);
  const netProfit = grossProfit - overheadCost;
  const netMarginPercentage =
    estimatedRevenue > 0 ? (netProfit / estimatedRevenue) * 100 : 0;

  // ROI = (Net Profit / Cost) * 100
  const roi = actualCosts > 0 ? (netProfit / actualCosts) * 100 : 0;

  return {
    revenue: Math.round(estimatedRevenue * 100) / 100,
    cost: Math.round(actualCosts * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
    grossMarginPercentage: Math.round(grossMarginPercentage * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    netMarginPercentage: Math.round(netMarginPercentage * 100) / 100,
    roi: Math.round(roi * 100) / 100,
  };
}

// ============================================================================
// Estimate vs Actual Comparison
// ============================================================================

/**
 * Calculate variance between estimated and actual
 *
 * @param estimated - Estimated amount
 * @param actual - Actual amount
 * @returns Variance analysis
 */
export function calculateVariance(estimated: number, actual: number): VarianceAnalysis {
  if (estimated < 0) estimated = 0;
  if (actual < 0) actual = 0;

  const variance = actual - estimated;
  const variancePercentage = estimated > 0 ? (variance / estimated) * 100 : 0;

  let status: 'under' | 'on-budget' | 'over';
  if (Math.abs(variancePercentage) <= 5) {
    status = 'on-budget'; // Within 5% is considered on budget
  } else if (variance < 0) {
    status = 'under';
  } else {
    status = 'over';
  }

  return {
    estimated: Math.round(estimated * 100) / 100,
    actual: Math.round(actual * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    variancePercentage: Math.round(variancePercentage * 100) / 100,
    status,
  };
}

/**
 * Compare estimated line items to actual line items
 *
 * @param estimatedItems - Line items from estimate
 * @param actualItems - Line items with actual costs
 * @returns Detailed comparison with overruns identified
 */
export function compareEstimateToActual(
  estimatedItems: LineItem[],
  actualItems: LineItem[]
): EstimateComparison {
  // Create maps for easier lookup
  const estimatedMap = new Map<string, LineItem>();
  const actualMap = new Map<string, LineItem>();

  // Use description as key (in real app, might use a proper ID)
  for (const item of estimatedItems) {
    estimatedMap.set(item.description.toLowerCase(), item);
  }

  for (const item of actualItems) {
    actualMap.set(item.description.toLowerCase(), item);
  }

  // Compare line items
  const lineItems: LineItemComparison[] = [];
  const overruns: LineItemComparison[] = [];
  const savings: LineItemComparison[] = [];

  // Get all unique descriptions
  const allDescriptions = new Set([
    ...estimatedItems.map((i) => i.description.toLowerCase()),
    ...actualItems.map((i) => i.description.toLowerCase()),
  ]);

  for (const desc of allDescriptions) {
    const estimatedItem = estimatedMap.get(desc);
    const actualItem = actualMap.get(desc);

    const estimated = estimatedItem
      ? calculateLineItemTotal(estimatedItem.quantity || 0, estimatedItem.unitCost || 0)
      : 0;

    const actual = actualItem
      ? calculateLineItemTotal(actualItem.quantity || 0, actualItem.unitCost || 0)
      : 0;

    const variance = actual - estimated;
    const variancePercentage = estimated > 0 ? (variance / estimated) * 100 : 0;
    const isOverrun = variance > 0;

    const comparison: LineItemComparison = {
      description: estimatedItem?.description || actualItem?.description || '',
      category: estimatedItem?.category || actualItem?.category,
      estimated: Math.round(estimated * 100) / 100,
      actual: Math.round(actual * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      variancePercentage: Math.round(variancePercentage * 100) / 100,
      isOverrun,
    };

    lineItems.push(comparison);

    if (isOverrun && Math.abs(variancePercentage) > 5) {
      overruns.push(comparison);
    } else if (!isOverrun && Math.abs(variancePercentage) > 5) {
      savings.push(comparison);
    }
  }

  // Calculate summary
  const totalEstimated = estimatedItems.reduce(
    (sum, item) => sum + calculateLineItemTotal(item.quantity || 0, item.unitCost || 0),
    0
  );

  const totalActual = actualItems.reduce(
    (sum, item) => sum + calculateLineItemTotal(item.quantity || 0, item.unitCost || 0),
    0
  );

  const totalVariance = totalActual - totalEstimated;
  const totalVariancePercentage =
    totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

  // Calculate material and labor variances
  const materialEstimated = calculateMaterialsTotal(estimatedItems);
  const materialActual = calculateMaterialsTotal(actualItems);
  const materialVariance = materialActual - materialEstimated;

  const laborEstimated = calculateLaborTotal(estimatedItems);
  const laborActual = calculateLaborTotal(actualItems);
  const laborVariance = laborActual - laborEstimated;

  return {
    summary: {
      totalEstimated: Math.round(totalEstimated * 100) / 100,
      totalActual: Math.round(totalActual * 100) / 100,
      totalVariance: Math.round(totalVariance * 100) / 100,
      totalVariancePercentage: Math.round(totalVariancePercentage * 100) / 100,
      materialVariance: Math.round(materialVariance * 100) / 100,
      laborVariance: Math.round(laborVariance * 100) / 100,
    },
    lineItems,
    overruns: overruns.sort((a, b) => b.variance - a.variance), // Highest overrun first
    savings: savings.sort((a, b) => a.variance - b.variance), // Highest savings first
  };
}

/**
 * Identify problem areas (overruns) in estimate vs actual
 *
 * @param estimatedItems - Line items from estimate
 * @param actualItems - Line items with actual costs
 * @param thresholdPercentage - Variance threshold to flag (default 10%)
 * @returns Array of overrun items sorted by severity
 */
export function identifyOverruns(
  estimatedItems: LineItem[],
  actualItems: LineItem[],
  thresholdPercentage: number = 10
): LineItemComparison[] {
  const comparison = compareEstimateToActual(estimatedItems, actualItems);

  return comparison.overruns.filter(
    (item) => item.variancePercentage >= thresholdPercentage
  );
}

/**
 * Calculate price from cost and markup percentage
 *
 * Formula: price = cost * (1 + markup%)
 * Example: $100 cost with 50% markup = $150 price
 */
export function calculatePriceFromMarkup(cost: number, markupPercentage: number): number {
  if (cost < 0) return 0;
  if (markupPercentage < 0) return cost;

  return cost * (1 + markupPercentage / 100);
}

/**
 * Calculate markup from cost and price
 *
 * Formula: markup = price - cost
 * Markup% = (markup / cost) * 100
 */
export function calculateMarkup(cost: number, price: number): MarkupResult {
  if (cost < 0 || price < 0) {
    return {
      cost: 0,
      markup: 0,
      markupPercentage: 0,
      price: 0,
      margin: 0,
      marginPercentage: 0,
    };
  }

  const markup = price - cost;
  const markupPercentage = cost > 0 ? (markup / cost) * 100 : 0;

  // Calculate margin (different from markup!)
  // Margin = (price - cost) / price * 100
  const margin = markup; // Same dollar amount
  const marginPercentage = price > 0 ? (margin / price) * 100 : 0;

  return {
    cost,
    markup,
    markupPercentage: Math.round(markupPercentage * 100) / 100,
    price,
    margin,
    marginPercentage: Math.round(marginPercentage * 100) / 100,
  };
}

/**
 * Calculate margin percentage from markup percentage
 *
 * Formula: margin% = markup% / (1 + markup%)
 * Example: 50% markup = 33.33% margin
 * Example: 100% markup = 50% margin
 */
export function convertMarkupToMargin(markupPercentage: number): number {
  if (markupPercentage <= 0) return 0;

  const marginPercentage = (markupPercentage / (100 + markupPercentage)) * 100;
  return Math.round(marginPercentage * 100) / 100;
}

/**
 * Calculate markup percentage from margin percentage
 *
 * Formula: markup% = margin% / (1 - margin%)
 * Example: 33.33% margin = 50% markup
 * Example: 50% margin = 100% markup
 */
export function convertMarginToMarkup(marginPercentage: number): number {
  if (marginPercentage <= 0) return 0;
  if (marginPercentage >= 100) return Infinity;

  const markupPercentage = (marginPercentage / (100 - marginPercentage)) * 100;
  return Math.round(markupPercentage * 100) / 100;
}

/**
 * Calculate line item total with markup
 *
 * Takes a full LineItem object and calculates totals including markup
 */
export function calculateLineItemWithMarkup(lineItem: LineItem): LineItemTotal {
  const quantity = lineItem.quantity || 1;
  const unitCost = lineItem.unitCost || 0;
  const totalCost = calculateLineItemTotal(quantity, unitCost);

  // Calculate price based on markup if provided, otherwise use totalCost
  let price: number;
  let markup: number;

  if (lineItem.markup !== undefined && lineItem.markup > 0) {
    price = calculatePriceFromMarkup(totalCost, lineItem.markup);
    markup = price - totalCost;
  } else {
    // Use the totalCost from the line item if provided
    price = lineItem.totalCost;
    markup = price - totalCost;
  }

  return {
    lineItemId: lineItem.id,
    quantity,
    unitCost,
    totalCost,
    markup,
    price,
    isLabor: lineItem.isLabor,
  };
}

/**
 * Calculate estimate totals from line items
 */
export function calculateEstimateTotals(lineItems: LineItem[]): EstimateTotals {
  if (lineItems.length === 0) {
    return {
      materialCost: 0,
      laborCost: 0,
      totalCost: 0,
      materialPrice: 0,
      laborPrice: 0,
      totalPrice: 0,
      materialMarkup: 0,
      laborMarkup: 0,
      totalMarkup: 0,
      materialMargin: 0,
      laborMargin: 0,
      totalMargin: 0,
      totalMarginPercentage: 0,
      totalLineItems: 0,
      materialLineItems: 0,
      laborLineItems: 0,
    };
  }

  // Calculate totals for each line item
  const itemTotals = lineItems.map(calculateLineItemWithMarkup);

  // Separate materials and labor
  const materialItems = itemTotals.filter((item) => !item.isLabor);
  const laborItems = itemTotals.filter((item) => item.isLabor);

  // Sum costs
  const materialCost = materialItems.reduce((sum, item) => sum + item.totalCost, 0);
  const laborCost = laborItems.reduce((sum, item) => sum + item.totalCost, 0);
  const totalCost = materialCost + laborCost;

  // Sum prices
  const materialPrice = materialItems.reduce((sum, item) => sum + item.price, 0);
  const laborPrice = laborItems.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = materialPrice + laborPrice;

  // Calculate markups
  const materialMarkup = materialPrice - materialCost;
  const laborMarkup = laborPrice - laborCost;
  const totalMarkup = totalPrice - totalCost;

  // Calculate margins (same dollar amount as markup, different percentage)
  const materialMargin = materialMarkup;
  const laborMargin = laborMarkup;
  const totalMargin = totalMarkup;
  const totalMarginPercentage = totalPrice > 0 ? (totalMargin / totalPrice) * 100 : 0;

  return {
    // Costs
    materialCost: Math.round(materialCost * 100) / 100,
    laborCost: Math.round(laborCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,

    // Pricing
    materialPrice: Math.round(materialPrice * 100) / 100,
    laborPrice: Math.round(laborPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,

    // Markup
    materialMarkup: Math.round(materialMarkup * 100) / 100,
    laborMarkup: Math.round(laborMarkup * 100) / 100,
    totalMarkup: Math.round(totalMarkup * 100) / 100,

    // Margins
    materialMargin: Math.round(materialMargin * 100) / 100,
    laborMargin: Math.round(laborMargin * 100) / 100,
    totalMargin: Math.round(totalMargin * 100) / 100,
    totalMarginPercentage: Math.round(totalMarginPercentage * 100) / 100,

    // Counts
    totalLineItems: lineItems.length,
    materialLineItems: materialItems.length,
    laborLineItems: laborItems.length,
  };
}

/**
 * Apply global markup to all line items
 *
 * Useful for applying a standard markup percentage to an entire estimate
 */
export function applyGlobalMarkup(
  lineItems: LineItem[],
  markupPercentage: number
): LineItem[] {
  return lineItems.map((item) => ({
    ...item,
    markup: markupPercentage,
    totalCost: calculatePriceFromMarkup(
      (item.quantity || 1) * (item.unitCost || 0),
      markupPercentage
    ),
  }));
}

/**
 * Apply different markups to materials and labor
 */
export function applyDifferentialMarkup(
  lineItems: LineItem[],
  materialMarkup: number,
  laborMarkup: number
): LineItem[] {
  return lineItems.map((item) => {
    const markupToApply = item.isLabor ? laborMarkup : materialMarkup;
    const baseCost = (item.quantity || 1) * (item.unitCost || 0);

    return {
      ...item,
      markup: markupToApply,
      totalCost: calculatePriceFromMarkup(baseCost, markupToApply),
    };
  });
}

/**
 * Calculate target price needed to achieve desired margin
 *
 * Formula: price = cost / (1 - margin%)
 * Example: $100 cost with 33.33% desired margin = $150 price
 */
export function calculatePriceFromMargin(cost: number, marginPercentage: number): number {
  if (cost < 0) return 0;
  if (marginPercentage <= 0) return cost;
  if (marginPercentage >= 100) return Infinity;

  return cost / (1 - marginPercentage / 100);
}

/**
 * Calculate cost breakdown by category
 */
export function calculateCategoryBreakdown(
  lineItems: LineItem[]
): Record<string, { cost: number; price: number; count: number }> {
  const breakdown: Record<string, { cost: number; price: number; count: number }> = {};

  for (const item of lineItems) {
    const category = item.category || 'uncategorized';
    const itemTotal = calculateLineItemWithMarkup(item);

    if (!breakdown[category]) {
      breakdown[category] = { cost: 0, price: 0, count: 0 };
    }

    breakdown[category].cost += itemTotal.totalCost;
    breakdown[category].price += itemTotal.price;
    breakdown[category].count += 1;
  }

  // Round values
  for (const category in breakdown) {
    breakdown[category].cost = Math.round(breakdown[category].cost * 100) / 100;
    breakdown[category].price = Math.round(breakdown[category].price * 100) / 100;
  }

  return breakdown;
}

/**
 * Calculate recommended markup based on project type and size
 *
 * Larger projects typically have lower markup percentages
 * but higher absolute dollar margins
 */
export function calculateRecommendedMarkup(
  projectType: string,
  estimatedCost: number
): {
  materialMarkup: number;
  laborMarkup: number;
  reasoning: string;
} {
  // Base markups for different project types
  const baseMarkups: Record<string, { material: number; labor: number }> = {
    'kitchen-remodel': { material: 45, labor: 50 },
    'bathroom-remodel': { material: 45, labor: 50 },
    'basement-finishing': { material: 40, labor: 45 },
    'deck-construction': { material: 35, labor: 40 },
    'flooring': { material: 40, labor: 45 },
    'painting': { material: 35, labor: 50 },
    'renovation': { material: 40, labor: 45 },
    'addition': { material: 40, labor: 45 },
    'roofing': { material: 30, labor: 35 },
    'siding': { material: 30, labor: 35 },
    'windows-doors': { material: 35, labor: 40 },
    'other': { material: 40, labor: 45 },
  };

  const base = baseMarkups[projectType] || baseMarkups['other'];

  // Adjust based on project size
  let sizeAdjustment = 0;
  let sizeCategory = '';

  if (estimatedCost < 5000) {
    sizeAdjustment = 10; // Small projects need higher markup
    sizeCategory = 'small';
  } else if (estimatedCost < 25000) {
    sizeAdjustment = 5;
    sizeCategory = 'medium';
  } else if (estimatedCost < 100000) {
    sizeAdjustment = 0;
    sizeCategory = 'large';
  } else {
    sizeAdjustment = -5; // Very large projects can have lower markup
    sizeCategory = 'very large';
  }

  const materialMarkup = Math.max(20, base.material + sizeAdjustment);
  const laborMarkup = Math.max(25, base.labor + sizeAdjustment);

  const reasoning = `${sizeCategory.charAt(0).toUpperCase() + sizeCategory.slice(1)} ${projectType} project. Material markup: ${materialMarkup}%, Labor markup: ${laborMarkup}%`;

  return {
    materialMarkup,
    laborMarkup,
    reasoning,
  };
}
