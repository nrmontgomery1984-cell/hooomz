'use client';

/**
 * InvoiceListPanel — Compact invoice summary for project detail page.
 *
 * Shows total outstanding, invoice count, each invoice as a row
 * with number, type pill, status badge, balance, due date.
 * Click → navigate to /invoices/{id}.
 * "+ New" button opens AddInvoiceSheet.
 */

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/lib/hooks/useInvoices';
import { AddInvoiceSheet } from './AddInvoiceSheet';
import { PanelSection } from '@/components/ui/PanelSection';
import type { InvoiceRecord, InvoiceStatus } from '@hooomz/shared-contracts';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: 'var(--surface-2)', text: 'var(--muted)' },
  sent: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
  viewed: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
  partial: { bg: 'var(--yellow-bg)', text: 'var(--yellow)' },
  paid: { bg: 'var(--green-bg)', text: 'var(--green)' },
  overdue: { bg: 'var(--red-bg)', text: 'var(--red)' },
  cancelled: { bg: 'var(--surface-2)', text: 'var(--muted)' },
};

const TYPE_LABELS: Record<string, string> = {
  deposit: 'DEP',
  progress: 'PROG',
  final: 'FIN',
};

interface InvoiceListPanelProps {
  projectId: string;
  customerId: string;
}

export function InvoiceListPanel({ projectId, customerId }: InvoiceListPanelProps) {
  const { data: invoices = [] } = useInvoices(projectId);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const router = useRouter();

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter((inv: InvoiceRecord) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum: number, inv: InvoiceRecord) => sum + inv.balanceDue, 0);
  }, [invoices]);

  const action = (
    <button
      onClick={() => setShowAddSheet(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 10,
        color: 'var(--accent)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        padding: 0,
      }}
    >
      <Plus size={9} /> New
    </button>
  );

  return (
    <>
      <PanelSection label="Invoices" action={action}>
        {invoices.length === 0 ? (
          <div style={{ padding: '6px 12px' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>No invoices yet</span>
          </div>
        ) : (
          <>
            {/* Total outstanding */}
            <div style={{ padding: '4px 12px 6px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>
                {formatCurrency(totalOutstanding)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                outstanding
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>
                {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
              </span>
            </div>

            {/* Invoice rows */}
            {invoices.map((inv: InvoiceRecord) => {
              const statusColor = STATUS_COLORS[inv.status] || STATUS_COLORS.draft;
              return (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  className="hover-surface"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                  }}
                >
                  {/* Invoice number */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--mid)',
                    width: 80,
                    flexShrink: 0,
                  }}>
                    {inv.invoiceNumber}
                  </span>

                  {/* Type pill */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--muted)',
                    background: 'var(--surface-2)',
                    padding: '1px 5px',
                    borderRadius: 3,
                    flexShrink: 0,
                  }}>
                    {TYPE_LABELS[inv.invoiceType] || inv.invoiceType.toUpperCase()}
                  </span>

                  {/* Status badge */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: statusColor.text,
                    background: statusColor.bg,
                    padding: '1px 5px',
                    borderRadius: 3,
                    flexShrink: 0,
                  }}>
                    {inv.status}
                  </span>

                  {/* Spacer */}
                  <span style={{ flex: 1 }} />

                  {/* Balance */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: inv.status === 'paid' ? 'var(--green)' : 'var(--charcoal)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {formatCurrency(inv.status === 'paid' ? inv.totalAmount : inv.balanceDue)}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </PanelSection>

      <AddInvoiceSheet
        projectId={projectId}
        customerId={customerId}
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
      />
    </>
  );
}
