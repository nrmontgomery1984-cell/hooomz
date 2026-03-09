/**
 * Financial Score Service
 *
 * Pure function: computeFinancialScore → { score, color, hex, label, subIndicators }
 *
 * Score weights: Receivables 40%, Margins 30%, Revenue 30%
 * Thresholds: Green 80-100, Yellow 50-79, Red 0-49
 */

import type { ThreeDotColor } from '../constants/threeDot';
import { scoreToThreeDot, THREE_DOT_HEX, THREE_DOT_LABELS } from '../constants/threeDot';
import type { InvoiceAgingBuckets } from '../utils/invoiceAging';

export interface FinancialSubIndicator {
  label: string;
  score: number;
  color: ThreeDotColor;
  hex: string;
}

export interface FinancialScoreResult {
  score: number;
  color: ThreeDotColor;
  hex: string;
  label: string;
  subIndicators: {
    receivables: FinancialSubIndicator;
    margins: FinancialSubIndicator;
    revenue: FinancialSubIndicator;
  };
}

interface FinancialScoreInput {
  aging: InvoiceAgingBuckets;
  actualRevenue: number;
  forecastRevenue: number;
  actualMargin: number;
  targetMargin: number;
}

export function computeFinancialScore(input: FinancialScoreInput): FinancialScoreResult {
  const { aging, actualRevenue, forecastRevenue, actualMargin, targetMargin } = input;

  // --- Receivables sub-score (40%) ---
  // Based on AR aging distribution. More overdue = lower score.
  let receivablesScore = 100;
  if (aging.totalOutstanding > 0) {
    const overdueAmount = aging.days30 + aging.days60 + aging.days90plus;
    const overdueRatio = overdueAmount / aging.totalOutstanding;
    // 90+ days is worst
    const severeRatio = aging.totalOutstanding > 0 ? aging.days90plus / aging.totalOutstanding : 0;
    receivablesScore = Math.round(100 - overdueRatio * 60 - severeRatio * 40);
  }
  receivablesScore = Math.max(0, Math.min(100, receivablesScore));

  // --- Margins sub-score (30%) ---
  let marginsScore = 100;
  if (targetMargin > 0) {
    const ratio = actualMargin / targetMargin;
    if (ratio >= 1) marginsScore = 100;
    else if (ratio >= 0.8) marginsScore = Math.round(60 + (ratio - 0.8) * 200);
    else if (ratio >= 0.5) marginsScore = Math.round(20 + (ratio - 0.5) * 133);
    else marginsScore = Math.round(ratio * 40);
  }
  marginsScore = Math.max(0, Math.min(100, marginsScore));

  // --- Revenue sub-score (30%) ---
  let revenueScore = 100;
  if (forecastRevenue > 0) {
    const ratio = actualRevenue / forecastRevenue;
    if (ratio >= 1) revenueScore = 100;
    else if (ratio >= 0.8) revenueScore = Math.round(60 + (ratio - 0.8) * 200);
    else if (ratio >= 0.5) revenueScore = Math.round(20 + (ratio - 0.5) * 133);
    else revenueScore = Math.round(ratio * 40);
  }
  revenueScore = Math.max(0, Math.min(100, revenueScore));

  // Weighted total
  const score = Math.round(
    receivablesScore * 0.4 + marginsScore * 0.3 + revenueScore * 0.3
  );

  const color = scoreToThreeDot(score);

  function makeSubIndicator(label: string, s: number): FinancialSubIndicator {
    const c = scoreToThreeDot(s);
    return { label, score: s, color: c, hex: THREE_DOT_HEX[c] };
  }

  return {
    score,
    color,
    hex: THREE_DOT_HEX[color],
    label: THREE_DOT_LABELS[color],
    subIndicators: {
      receivables: makeSubIndicator('Receivables', receivablesScore),
      margins: makeSubIndicator('Margins', marginsScore),
      revenue: makeSubIndicator('Revenue', revenueScore),
    },
  };
}
