'use client';

/**
 * Job Health Summary Hook — Three-Dimensional Business Health
 *
 * Each of the three O's in the HOOOMZ logo represents an independent
 * business dimension. All three CAN be green simultaneously — that's
 * the target state.
 *
 * O1 — Sales health: pipeline momentum, lead freshness, quote conversion
 * O2 — Production health: SCRIPT job status, blockers, schedule adherence
 * O3 — Financial health: AR aging, invoice status, outstanding balances
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { useDashboardData } from './useDashboardData';
import { useAllInvoices } from './useInvoices';
import { computeInvoiceAging } from '../utils/invoiceAging';
import type { JobHealthResult } from '../constants/threeDot';

export type DimensionHealth = 'green' | 'amber' | 'red';

export interface DimensionDetail {
  state: DimensionHealth;
  label: string; // tooltip line
}

export interface JobHealthSummary {
  sales: DimensionDetail;
  production: DimensionDetail;
  finance: DimensionDetail;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function useJobHealthSummary(): JobHealthSummary {
  const { services, isLoading: servicesLoading } = useServicesContext();
  const dashboard = useDashboardData();

  // ── Sales data ──
  const { data: salesData } = useQuery({
    queryKey: ['healthSummary', 'sales'],
    queryFn: async () => {
      const [customerResult, quotes] = await Promise.all([
        services!.customers.findAll(),
        services!.quotes.findAll(),
      ]);
      const allCustomers = (customerResult as any).customers || customerResult;
      // Leads = customers tagged as leads (have 'lead' tag or status)
      const leads = (Array.isArray(allCustomers) ? allCustomers : []).filter((c: any) =>
        c.tags?.some((t: string) => t.startsWith('stage:')) || c.status === 'lead'
      );
      const now = Date.now();
      const staleLeads = leads.filter((c: any) => {
        const updated = c.metadata?.updatedAt ? new Date(c.metadata.updatedAt).getTime() : 0;
        return (now - updated) > SEVEN_DAYS;
      });
      const activeQuotes = quotes.filter((q) => q.status === 'sent' || q.status === 'viewed');
      const expiringQuotes = activeQuotes.filter((q) => {
        if (!q.expiresAt) return false;
        const expires = new Date(q.expiresAt).getTime();
        return expires > 0 && (expires - now) < SEVEN_DAYS && expires > now;
      });
      const overdueQuotes = activeQuotes.filter((q) => {
        if (!q.expiresAt) return false;
        return new Date(q.expiresAt).getTime() < now;
      });
      return { leadCount: leads.length, staleCount: staleLeads.length, expiringCount: expiringQuotes.length, overdueQuoteCount: overdueQuotes.length };
    },
    enabled: !servicesLoading && !!services,
    staleTime: 30_000,
    refetchInterval: 5 * 60 * 1000,
  });

  // ── Production data ──
  const projectIds = dashboard.activeProjects.map((p) => p.id);

  const { data: healthMap } = useQuery<Map<string, JobHealthResult>>({
    queryKey: ['healthSummary', 'production', ...projectIds],
    queryFn: async () => {
      const map = new Map<string, JobHealthResult>();
      await Promise.all(
        projectIds.map(async (id) => {
          try {
            const result = await services!.jobHealth.getJobHealthStatus(id);
            map.set(id, result);
          } catch { /* skip */ }
        }),
      );
      return map;
    },
    enabled: !servicesLoading && !!services && projectIds.length > 0,
    staleTime: 15_000,
    refetchInterval: 5 * 60 * 1000,
  });

  // ── Finance data ──
  const { data: invoices } = useAllInvoices();

  // ── Compute dimensions ──
  return useMemo(() => {
    // === O1: Sales ===
    let sales: DimensionDetail;
    if (!salesData) {
      sales = { state: 'green', label: 'Sales: healthy' };
    } else {
      const { leadCount, staleCount, expiringCount, overdueQuoteCount } = salesData;
      if (leadCount === 0 || overdueQuoteCount > 0) {
        const parts: string[] = [];
        if (leadCount === 0) parts.push('no active leads');
        if (overdueQuoteCount > 0) parts.push(`${overdueQuoteCount} quote${overdueQuoteCount !== 1 ? 's' : ''} overdue`);
        sales = { state: 'red', label: `Sales: ${parts.join(' · ')}` };
      } else if (staleCount > 0 || expiringCount > 0) {
        const parts: string[] = [];
        if (staleCount > 0) parts.push(`${staleCount} lead${staleCount !== 1 ? 's' : ''} cold`);
        if (expiringCount > 0) parts.push(`${expiringCount} quote${expiringCount !== 1 ? 's' : ''} expiring`);
        sales = { state: 'amber', label: `Sales: ${parts.join(' · ')}` };
      } else {
        sales = { state: 'green', label: `Sales: ${leadCount} lead${leadCount !== 1 ? 's' : ''} active` };
      }
    }

    // === O2: Production ===
    let production: DimensionDetail;
    if (!healthMap || healthMap.size === 0) {
      production = { state: 'green', label: `Production: ${projectIds.length} job${projectIds.length !== 1 ? 's' : ''} active` };
    } else {
      let redCount = 0;
      let yellowCount = 0;
      for (const result of healthMap.values()) {
        if (result.color === 'red') redCount++;
        else if (result.color === 'yellow') yellowCount++;
      }
      const attentionCount = redCount + yellowCount;
      if (redCount > 0) {
        production = { state: 'red', label: `Production: ${redCount} blocked · ${healthMap.size} active` };
      } else if (yellowCount > 0) {
        production = { state: 'amber', label: `Production: ${attentionCount} need attention · ${healthMap.size} active` };
      } else {
        production = { state: 'green', label: `Production: ${healthMap.size} job${healthMap.size !== 1 ? 's' : ''} on track` };
      }
    }

    // === O3: Finance ===
    let finance: DimensionDetail;
    if (!invoices || invoices.length === 0) {
      finance = { state: 'green', label: 'Finance: healthy' };
    } else {
      const aging = computeInvoiceAging(invoices);
      const overdueCount = aging.overdueInvoices.length;
      const severeOverdue = aging.days60 + aging.days90plus;
      if (severeOverdue > 0) {
        finance = { state: 'red', label: `Finance: $${Math.round(aging.totalOutstanding).toLocaleString()} outstanding · ${overdueCount} overdue` };
      } else if (overdueCount > 0) {
        finance = { state: 'amber', label: `Finance: ${overdueCount} invoice${overdueCount !== 1 ? 's' : ''} overdue · $${Math.round(aging.totalOutstanding).toLocaleString()}` };
      } else {
        finance = { state: 'green', label: 'Finance: AR current' };
      }
    }

    return { sales, production, finance };
  }, [salesData, healthMap, invoices, projectIds.length]);
}
