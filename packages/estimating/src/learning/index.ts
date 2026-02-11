/**
 * Smart Estimating Learning Module
 *
 * This module powers the learning system that makes estimates more accurate over time.
 * It tracks:
 * - Price history from receipts and invoices
 * - Labor durations from time entries and task completions
 * - Estimate accuracy from completed projects
 *
 * The system calculates confidence levels based on data points:
 * - ✓ Verified: 3+ data points
 * - ~ Limited: 1-2 data points
 * - ? Estimate: No data
 */

export * from './types';
export { PriceLearningService } from './price-learning.service';
export { LaborLearningService } from './labor-learning.service';
export { EstimateAccuracyService } from './estimate-accuracy.service';
