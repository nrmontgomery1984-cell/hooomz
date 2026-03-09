/**
 * Invoice Aging — Pure utility function
 *
 * Extracted from useInvoiceAging hook for reuse by Financial Score service.
 */

import type { InvoiceRecord } from '@hooomz/shared-contracts';

export interface InvoiceAgingBuckets {
  current: number;
  days30: number;
  days60: number;
  days90plus: number;
  totalOutstanding: number;
  overdueInvoices: InvoiceRecord[];
}

export function computeInvoiceAging(invoices: InvoiceRecord[]): InvoiceAgingBuckets {
  if (invoices.length === 0) {
    return { current: 0, days30: 0, days60: 0, days90plus: 0, totalOutstanding: 0, overdueInvoices: [] };
  }

  const now = new Date();
  const unpaid = invoices.filter(
    (inv) => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft',
  );

  let current = 0;
  let days30 = 0;
  let days60 = 0;
  let days90plus = 0;
  const overdueInvoices: InvoiceRecord[] = [];

  for (const inv of unpaid) {
    const due = new Date(inv.dueDate);
    const diffMs = now.getTime() - due.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      current += inv.balanceDue;
    } else {
      overdueInvoices.push(inv);
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

  return { current, days30, days60, days90plus, totalOutstanding, overdueInvoices };
}
