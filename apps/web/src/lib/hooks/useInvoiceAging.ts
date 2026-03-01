'use client';

/**
 * Invoice Aging Hook — bucket outstanding invoices by days overdue.
 * Pure computation from InvoiceRecord[] — no service dependency.
 */

import { useMemo } from 'react';
import type { InvoiceRecord } from '@hooomz/shared-contracts';

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

    const now = new Date();
    const unpaid = invoices.filter(
      (inv) => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft',
    );

    let current = 0;
    let days30 = 0;
    let days60 = 0;
    let days90plus = 0;
    const overdue: InvoiceRecord[] = [];

    for (const inv of unpaid) {
      const due = new Date(inv.dueDate);
      const diffMs = now.getTime() - due.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        current += inv.balanceDue;
      } else {
        overdue.push(inv);
        if (diffDays <= 30) {
          days30 += inv.balanceDue;
        } else if (diffDays <= 60) {
          days60 += inv.balanceDue;
        } else {
          days90plus += inv.balanceDue;
        }
      }
    }

    const totalOutstanding = current + days30 + days60 + days90plus;

    return { overdue, current, days30, days60, days90plus, totalOutstanding };
  }, [invoices]);
}
