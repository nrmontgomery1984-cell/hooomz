'use client';

/**
 * Invoice Detail Page — Full-page invoice view.
 * Shows header, line items, totals, payment history, actions, PDF download.
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Send, XCircle, DollarSign } from 'lucide-react';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { useInvoice, useUpdateInvoiceStatus } from '@/lib/hooks/useInvoices';
import { usePayments } from '@/lib/hooks/usePayments';
import { useCustomer } from '@/lib/hooks/useCustomersV2';
import { useToast } from '@/components/ui/Toast';
import { RecordPaymentSheet } from '@/components/invoices/RecordPaymentSheet';
import dynamic from 'next/dynamic';
const DownloadInvoicePDF = dynamic(
  () => import('@/components/invoices/InvoicePDF').then(mod => mod.DownloadInvoicePDF),
  { ssr: false }
);
import type { InvoiceStatus, PaymentRecord } from '@hooomz/shared-contracts';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: payments = [] } = usePayments(invoiceId);
  const { data: customer } = useCustomer(invoice?.customerId ?? '');
  const updateStatus = useUpdateInvoiceStatus();
  const { showToast } = useToast();
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading invoice…</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Invoice not found</p>
        <button
          onClick={() => router.back()}
          style={{ marginTop: 12, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Go back
        </button>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[invoice.status] || STATUS_COLORS.draft;

  const handleSend = async () => {
    try {
      await updateStatus.mutateAsync({ id: invoice.id, action: 'send', projectId: invoice.projectId });
      showToast({ message: 'Invoice marked as sent', variant: 'success', duration: 2000 });
    } catch {
      showToast({ message: 'Failed to update status', variant: 'error', duration: 3000 });
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    try {
      await updateStatus.mutateAsync({ id: invoice.id, action: 'cancel', projectId: invoice.projectId });
      showToast({ message: 'Invoice cancelled', variant: 'success', duration: 2000 });
      setConfirmCancel(false);
    } catch {
      showToast({ message: 'Failed to cancel invoice', variant: 'error', duration: 3000 });
      setConfirmCancel(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
  };

  return (
    <PageErrorBoundary>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 60px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <ChevronLeft size={18} color="var(--mid)" />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>
            {invoice.invoiceNumber}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: statusColor.text,
            background: statusColor.bg,
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            {invoice.status}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {invoice.invoiceType.charAt(0).toUpperCase() + invoice.invoiceType.slice(1)}
          </span>
        </div>

        {/* Meta row */}
        <div style={{
          display: 'flex',
          gap: 24,
          padding: '10px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          marginBottom: 16,
        }}>
          <div>
            <div style={labelStyle}>Due Date</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', marginTop: 2 }}>{formatDate(invoice.dueDate)}</div>
          </div>
          <div>
            <div style={labelStyle}>Total</div>
            <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--charcoal)', marginTop: 2 }}>{formatCurrency(invoice.totalAmount)}</div>
          </div>
          <div>
            <div style={labelStyle}>Balance</div>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: invoice.balanceDue > 0 ? 'var(--red)' : 'var(--green)',
              marginTop: 2,
            }}>
              {formatCurrency(invoice.balanceDue)}
            </div>
          </div>
        </div>

        {/* Line Items */}
        {invoice.lineItems.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...labelStyle, marginBottom: 8 }}>Line Items</div>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 60px 80px 80px',
                gap: 8,
                padding: '8px 12px',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={labelStyle}>Description</span>
                <span style={{ ...labelStyle, textAlign: 'right' }}>Qty</span>
                <span style={{ ...labelStyle, textAlign: 'right' }}>Unit Price</span>
                <span style={{ ...labelStyle, textAlign: 'right' }}>Total</span>
              </div>

              {/* Rows */}
              {invoice.lineItems.map((li, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 80px 80px',
                    gap: 8,
                    padding: '6px 12px',
                    borderBottom: i < invoice.lineItems.length - 1 ? '1px solid var(--surface-2)' : undefined,
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: 'var(--mid)' }}>{li.description}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', textAlign: 'right' }}>{li.quantity}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', textAlign: 'right' }}>{formatCurrency(li.unitCost)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--charcoal)', textAlign: 'right' }}>{formatCurrency(li.totalCost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Subtotal</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mid)' }}>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Tax ({(invoice.taxRate * 100).toFixed(0)}%)</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mid)' }}>{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(invoice.totalAmount)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--green)' }}>Paid</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>−{formatCurrency(invoice.amountPaid)}</span>
            </div>
          )}
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
            <span>Balance Due</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: invoice.balanceDue > 0 ? 'var(--red)' : 'var(--green)' }}>
              {formatCurrency(invoice.balanceDue)}
            </span>
          </div>
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...labelStyle, marginBottom: 8 }}>Payment History</div>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              {payments.map((p: PaymentRecord, i: number) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderBottom: i < payments.length - 1 ? '1px solid var(--surface-2)' : undefined,
                    fontSize: 11,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--green)', width: 80 }}>
                    {formatCurrency(p.amount)}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--muted)',
                    background: 'var(--surface-2)',
                    padding: '1px 6px',
                    borderRadius: 3,
                  }}>
                    {p.method}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: 10 }}>{formatDate(p.date)}</span>
                  {p.reference && (
                    <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--muted)' }}>#{p.reference}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...labelStyle, marginBottom: 4 }}>Notes</div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{invoice.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {invoice.status === 'draft' && (
            <button
              onClick={handleSend}
              disabled={updateStatus.isPending}
              style={{
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#fff',
                background: 'var(--blue)',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                padding: '0 20px',
              }}
            >
              <Send size={13} /> MARK SENT
            </button>
          )}

          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button
              onClick={() => setShowPaymentSheet(true)}
              style={{
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#fff',
                background: 'var(--accent)',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                padding: '0 20px',
              }}
            >
              <DollarSign size={13} /> RECORD PAYMENT
            </button>
          )}

          <DownloadInvoicePDF
            invoice={invoice}
            payments={payments}
            customerName={customer ? `${customer.firstName} ${customer.lastName}`.trim() : undefined}
            customerAddress={customer ? [customer.propertyAddress, customer.propertyCity, customer.propertyProvince, customer.propertyPostalCode].filter(Boolean).join(', ') : undefined}
          />

          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={handleCancel}
                disabled={updateStatus.isPending}
                style={{
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: '#fff',
                  background: confirmCancel ? 'var(--red)' : 'none',
                  borderRadius: 8,
                  border: confirmCancel ? '1px solid var(--red)' : '1px solid var(--red-bg)',
                  cursor: 'pointer',
                  padding: '0 16px',
                  ...(confirmCancel ? {} : { color: 'var(--red)' }),
                }}
              >
                <XCircle size={13} /> {confirmCancel ? 'CONFIRM CANCEL' : 'CANCEL'}
              </button>
              {confirmCancel && (
                <button
                  onClick={() => setConfirmCancel(false)}
                  style={{
                    minHeight: 44,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: 'var(--muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 8px',
                  }}
                >
                  Never mind
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showPaymentSheet && (
        <RecordPaymentSheet
          invoice={invoice}
          isOpen={showPaymentSheet}
          onClose={() => setShowPaymentSheet(false)}
        />
      )}
    </PageErrorBoundary>
  );
}
