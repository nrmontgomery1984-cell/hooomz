/**
 * Financial Forecast Service
 * Pure computation — takes a ForecastConfig, returns a ForecastProjection.
 * No side effects, no storage access.
 */

import type { ForecastConfig, ForecastProjection, YearForecast } from '../types/forecast.types';
import { MATERIAL_COST_PCT } from '../types/forecast.types';

export function computeForecast(config: ForecastConfig): ForecastProjection {
  const currentYear = new Date().getFullYear();

  const years: YearForecast[] = [1, 2, 3].map((yr) => {
    const key = `y${yr}` as 'y1' | 'y2' | 'y3';

    const operatingWeeks = config.operatingWeeks[key];
    const jobsPerWeek = config.jobsPerWeek[key];
    const totalJobs = operatingWeeks * jobsPerWeek;
    const avgJobValue = config.avgJobValue[key];
    const grossRevenue = totalJobs * avgJobValue;

    // Labor hours — approximate from revenue and blended charged rate
    const nishantPct = config.nishantHoursPct[key];
    const blendedRate =
      config.nathanChargedRate * (1 - nishantPct) +
      config.nishantChargedRate * nishantPct;
    const estimatedTotalHours = blendedRate > 0 ? grossRevenue / blendedRate : 0;
    const nishantHours = estimatedTotalHours * nishantPct;
    const nathanHours = estimatedTotalHours - nishantHours;

    // Labor cost (wage rates, not charged rates)
    const nishantLaborCost = nishantHours * config.nishantWageRate;
    const nathanLaborCost = nathanHours * config.nathanWageRate;
    const totalLaborCost = nathanLaborCost + nishantLaborCost;

    // Materials at 25% of revenue
    const estimatedMaterialCost = grossRevenue * MATERIAL_COST_PCT;

    // Gross profit
    const grossProfit = grossRevenue - totalLaborCost - estimatedMaterialCost;

    // Overhead
    const totalOverhead =
      config.overhead.marketing +
      config.overhead.vehicle +
      config.overhead.insurance +
      config.overhead.software +
      config.overhead.other;

    // Net profit before share
    const netProfitBeforeShare = grossProfit - totalOverhead;

    // Profit share
    const profitSharePct = config.nishantProfitSharePct[key];
    const nishantProfitShare = Math.max(0, netProfitBeforeShare * profitSharePct);
    const nathanNetProfit = netProfitBeforeShare - nishantProfitShare;

    // Take-home
    const nathanWageDraw = nathanLaborCost;
    const nathanProfitDraw = nathanNetProfit;
    const nathanTotal = nathanWageDraw + nathanProfitDraw;
    const nishantWageDraw = nishantLaborCost;
    const nishantProfitDraw = nishantProfitShare;
    const nishantTotal = nishantWageDraw + nishantProfitDraw;

    // Margins
    const grossMarginPct = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    const netMarginPct = grossRevenue > 0 ? (netProfitBeforeShare / grossRevenue) * 100 : 0;

    return {
      year: yr,
      label: `Year ${yr} (${currentYear + yr - 1})`,
      operatingWeeks,
      jobsPerWeek,
      totalJobs,
      avgJobValue,
      grossRevenue,
      estimatedTotalHours,
      nishantHours,
      nathanHours,
      nishantLaborCost,
      nathanLaborCost,
      totalLaborCost,
      estimatedMaterialCost,
      grossProfit,
      totalOverhead,
      netProfitBeforeShare,
      nishantProfitShare,
      nathanNetProfit,
      nathanWageDraw,
      nathanProfitDraw,
      nathanTotal,
      nishantWageDraw,
      nishantProfitDraw,
      nishantTotal,
      grossMarginPct,
      netMarginPct,
    };
  });

  const threeYearTotals = {
    totalRevenue: years.reduce((s, y) => s + y.grossRevenue, 0),
    totalLaborCost: years.reduce((s, y) => s + y.totalLaborCost, 0),
    totalMaterialCost: years.reduce((s, y) => s + y.estimatedMaterialCost, 0),
    totalOverhead: years.reduce((s, y) => s + y.totalOverhead, 0),
    totalNetProfit: years.reduce((s, y) => s + y.netProfitBeforeShare, 0),
    nathanCumulative: years.reduce((s, y) => s + y.nathanTotal, 0),
    nishantCumulative: years.reduce((s, y) => s + y.nishantTotal, 0),
  };

  return { config, years, threeYearTotals };
}
