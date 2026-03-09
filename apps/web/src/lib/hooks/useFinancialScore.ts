'use client';

/**
 * useFinancialScore — composes aging + actuals + forecast for FinancialScoreWidget.
 */

import { useMemo } from 'react';
import { useAllInvoices } from './useInvoices';
import { useActiveForecastConfig, useForecastProjection } from './useForecast';
import { computeInvoiceAging } from '../utils/invoiceAging';
import { computeFinancialScore } from '../services/financialScore.service';
import type { FinancialScoreResult } from '../services/financialScore.service';

export function useFinancialScore(): {
  data: FinancialScoreResult | null;
  isLoading: boolean;
} {
  const { data: allInvoices, isLoading: invoicesLoading } = useAllInvoices();
  const { data: forecastConfig, isLoading: configLoading } = useActiveForecastConfig();
  const { data: projection } = useForecastProjection(forecastConfig ?? null);

  const data = useMemo(() => {
    if (!allInvoices) return null;

    const agingBuckets = computeInvoiceAging(allInvoices);

    // Revenue: sum of paid invoices
    const paidInvoices = allInvoices.filter((inv) => inv.status === 'paid');
    const actualRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Forecast revenue from first year
    const forecastRevenue = projection?.years?.[0]?.grossRevenue ?? 0;

    // Margins: actual margin vs target (default 25%)
    const targetMargin = 0.25;
    // Simple margin = (revenue - costs) / revenue; approximate with paid amounts
    const totalCosts = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.balanceDue), 0);
    const actualMargin = actualRevenue > 0 ? (actualRevenue - totalCosts) / actualRevenue : targetMargin;

    return computeFinancialScore({
      aging: agingBuckets,
      actualRevenue,
      forecastRevenue,
      actualMargin,
      targetMargin,
    });
  }, [allInvoices, projection, forecastConfig]);

  return {
    data,
    isLoading: invoicesLoading || configLoading,
  };
}
