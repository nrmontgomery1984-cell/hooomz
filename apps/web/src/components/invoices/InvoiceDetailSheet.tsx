'use client';

/**
 * InvoiceDetailSheet — Full invoice detail view as a bottom sheet.
 * Shows header, line items table, totals block, payment history.
 * Actions: Mark Sent, Record Payment, Cancel.
 */

import { useState } from 'react';
import { Send, XCircle, DollarSign } from 'lucide-react';
import { useUpdateInvoiceStatus } from '@/lib/hooks/useInvoices';
import { usePayments } from '@/lib/hooks/usePayments';
import { useToast } from '@/components/ui/Toast';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { RecordPaymentSheet } from './RecordPaymentSheet';
import type { InvoiceRecord, InvoiceStatus, PaymentRecord } from '@hooomz/shared-contracts';

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
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  sent: { bg: '#DBEAFE', text: '#2563EB' },
  viewed: { bg: '#DBEAFE', text: '#2563EB' },
  partial: { bg: '#FEF3C7', text: '#D97706' },
  paid: { bg: '#D1FAE5', text: '#059669' },
  overdue: { bg: '#FEE2E2', text: '#DC2626' },
  cancelled: { bg: '#F3F4F6', text: '#9CA3AF' },
};

interface InvoiceDetailSheetProps {
  invoice: InvoiceRecord;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailSheet({ invoice, isOpen, onClose }: InvoiceDetailSheetProps) {
  const updateStatus = useUpdateInvoiceStatus();
  const { data: payments = [] } = usePayments(invoice.id);
  const { showToast } = useToast();
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

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
    try {
      await updateStatus.mutateAsync({ id: invoice.id, action: 'cancel', projectId: invoice.projectId });
      showToast({ message: 'Invoice cancelled', variant: 'success', duration: 2000 });
    } catch {
      showToast({ message: 'Failed to cancel invoice', variant: 'error', duration: 3000 });
    }
  };

  const labelStyle = {
    fontFamily: 'var(--font-cond)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#6B7280',
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title={invoice.invoiceNumber}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              ...labelStyle,
              fontSize: 10,
              textTransform: 'capitalize',
            }}>
              {invoice.invoiceType}
            </span>
            <span style={{
              fontFamily: 'var(--font-cond)',
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: statusColor.text,
              background: statusColor.bg,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              {invoice.status}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#6B7280' }}>
              Due {formatDate(invoice.dueDate)}
            </span>
          </div>

          {/* Line Items */}
          {invoice.lineItems.length > 0 && (
            <div>
              <div style={{ ...labelStyle, marginBottom: 6 }}>Line Items</div>
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                {invoice.lineItems.map((li, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderBottom: i < invoice.lineItems.length - 1 ? '1px solid #F3F4F6' : undefined,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ flex: 1, color: '#374151' }}>{li.description}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#6B7280', fontSize: 10, flexShrink: 0 }}>
                      {li.quantity} × {formatCurrency(li.unitCost)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111827', fontSize: 10, width: 70, textAlign: 'right', flexShrink: 0 }}>
                      {formatCurrency(li.totalCost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div style={{
            background: '#F9FAFB',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#6B7280' }}>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#374151' }}>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#6B7280' }}>Tax ({(invoice.taxRate * 100).toFixed(0)}%)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#374151' }}>{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, borderTop: '1px solid #E5E7EB', paddingTop: 4 }}>
              <span>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#059669' }}>Paid</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#059669' }}>−{formatCurrency(invoice.amountPaid)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, borderTop: '1px solid #E5E7EB', paddingTop: 4 }}>
              <span>Balance Due</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: invoice.balanceDue > 0 ? '#DC2626' : '#059669' }}>
                {formatCurrency(invoice.balanceDue)}
              </span>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div>
              <div style={{ ...labelStyle, marginBottom: 6 }}>Payments</div>
              {payments.map((p: PaymentRecord) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 0',
                    fontSize: 11,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600, width: 70, flexShrink: 0 }}>
                    {formatCurrency(p.amount)}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-cond)',
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#6B7280',
                    background: '#F3F4F6',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}>
                    {p.method}
                  </span>
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatDate(p.date)}</span>
                  {p.reference && (
                    <span style={{ fontSize: 9, color: '#9CA3AF', marginLeft: 'auto' }}>#{p.reference}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div>
              <div style={{ ...labelStyle, marginBottom: 4 }}>Notes</div>
              <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {invoice.status === 'draft' && (
                <button
                  onClick={handleSend}
                  disabled={updateStatus.isPending}
                  style={{
                    flex: 1,
                    minHeight: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-cond)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#FFFFFF',
                    background: '#3B82F6',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Send size={12} /> MARK SENT
                </button>
              )}

              <button
                onClick={() => setShowPaymentSheet(true)}
                style={{
                  flex: 1,
                  minHeight: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-cond)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: '#FFFFFF',
                  background: '#0F766E',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <DollarSign size={12} /> RECORD PAYMENT
              </button>

              <button
                onClick={handleCancel}
                disabled={updateStatus.isPending}
                style={{
                  minHeight: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  fontFamily: 'var(--font-cond)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: '#EF4444',
                  background: 'none',
                  borderRadius: 8,
                  border: '1px solid #FCA5A5',
                  cursor: 'pointer',
                  padding: '0 12px',
                }}
              >
                <XCircle size={12} />
              </button>
            </div>
          )}
        </div>
      </BottomSheet>

      <RecordPaymentSheet
        invoice={invoice}
        isOpen={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
      />
    </>
  );
}
