'use client';

/**
 * AR Aging Table — collapsible card with bucket rows (label, amount, bar)
 */

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { InvoiceAgingData } from '@/lib/hooks/useInvoiceAging';

interface ARAgingTableProps {
  aging: InvoiceAgingData;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ARAgingTable({ aging }: ARAgingTableProps) {
  const [expanded, setExpanded] = useState(false);

  const buckets = [
    { label: 'Current', amount: aging.current, color: 'var(--green)' },
    { label: '1–30 Days', amount: aging.days30, color: 'var(--amber)' },
    { label: '31–60 Days', amount: aging.days60, color: '#F97316' },
    { label: '61+ Days', amount: aging.days90plus, color: 'var(--red)' },
  ];

  const maxAmount = Math.max(...buckets.map((b) => b.amount), 1);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px',
          background: 'var(--surface-2)', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', flex: 1, textAlign: 'left' }}>
          AR Aging
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: aging.totalOutstanding > 0 ? 'var(--charcoal)' : 'var(--muted)' }}>
          {formatCurrency(aging.totalOutstanding)}
        </span>
        {expanded ? <ChevronDown size={12} color="var(--muted)" /> : <ChevronRight size={12} color="var(--muted)" />}
      </button>

      {expanded && (
        <>
          {/* Bucket rows */}
          {buckets.map((bucket) => (
            <div key={bucket.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--mid)', width: 72, flexShrink: 0 }}>{bucket.label}</span>
              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(bucket.amount / maxAmount) * 100}%`, background: bucket.color, borderRadius: 3, minWidth: bucket.amount > 0 ? 4 : 0 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: bucket.amount > 0 ? 'var(--charcoal)' : 'var(--muted)', width: 64, textAlign: 'right', flexShrink: 0 }}>
                {formatCurrency(bucket.amount)}
              </span>
            </div>
          ))}

          {/* Overdue invoice list */}
          {aging.overdue.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <div style={{ padding: '6px 12px', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--red)' }}>
                  Overdue ({aging.overdue.length})
                </span>
              </div>
              {aging.overdue.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="hover-surface"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                    borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mid)' }}>{inv.invoiceNumber}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--red)' }}>
                    {formatCurrency(inv.balanceDue)}
                  </span>
                  <ChevronRight size={10} color="var(--muted)" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
