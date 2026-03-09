'use client';

/**
 * Invoice Aging Hook — bucket outstanding invoices by days overdue.
 * Delegates to pure utility function for reuse.
 */

import { useMemo } from 'react';
import type { InvoiceRecord } from '@hooomz/shared-contracts';
import { computeInvoiceAging } from '../utils/invoiceAging';

export interface InvoiceAgingData {
  /** Invoices past due date */
  overdue: InvoiceRecord[];
  /** Not yet due */
  current: number;
  /** 1-30 days overdue */
  days30: number;
  /** 31-60 days overdue */
  days60: number;
  /** 61+ days overdue */
  days90plus: number;
  /** Sum of all balanceDue across unpaid invoices */
  totalOutstanding: number;
}

export function useInvoiceAging(invoices: InvoiceRecord[] | undefined): InvoiceAgingData {
  return useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return { overdue: [], current: 0, days30: 0, days60: 0, days90plus: 0, totalOutstanding: 0 };
    }

    const result = computeInvoiceAging(invoices);

    return {
      overdue: result.overdueInvoices,
      current: result.current,
      days30: result.days30,
      days60: result.days60,
      days90plus: result.days90plus,
      totalOutstanding: result.totalOutstanding,
    };
  }, [invoices]);
}
