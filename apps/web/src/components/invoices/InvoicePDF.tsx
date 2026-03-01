'use client';

/**
 * InvoicePDF — Client-side PDF generation using @react-pdf/renderer.
 * Exports DownloadInvoicePDF component wrapping PDFDownloadLink.
 */

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import type { InvoiceRecord, PaymentRecord } from '@hooomz/shared-contracts';

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  metaBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaCol: {
    width: '48%',
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6b7280',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    marginBottom: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
  },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: 'right' },
  colUnit: { width: 70, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#6b7280',
  },
  totalsBlock: {
    marginTop: 12,
    alignSelf: 'flex-end',
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Courier',
  },
  totalBold: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginVertical: 4,
  },
  paymentSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6b7280',
    marginBottom: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#6b7280',
    marginTop: 4,
  },
});

interface InvoiceDocProps {
  invoice: InvoiceRecord;
  payments?: PaymentRecord[];
  businessName?: string;
  customerName?: string;
  customerAddress?: string;
}

function InvoiceDocument({ invoice, payments = [], businessName = 'Hooomz Interiors', customerName, customerAddress }: InvoiceDocProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{businessName}</Text>
            <Text style={styles.subtitle}>Moncton, NB</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>INVOICE</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Courier', marginTop: 2 }}>{invoice.invoiceNumber}</Text>
            <Text style={styles.statusBadge}>{invoice.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaBlock}>
          <View style={styles.metaCol}>
            {customerName ? (
              <>
                <Text style={styles.metaLabel}>Bill To</Text>
                <Text style={styles.metaValue}>{customerName}</Text>
                {customerAddress && <Text style={[styles.metaValue, { color: '#6b7280', fontSize: 9 }]}>{customerAddress}</Text>}
              </>
            ) : (
              <>
                <Text style={styles.metaLabel}>Invoice Type</Text>
                <Text style={styles.metaValue}>{invoice.invoiceType.charAt(0).toUpperCase() + invoice.invoiceType.slice(1)}</Text>
              </>
            )}
          </View>
          <View style={[styles.metaCol, { alignItems: 'flex-end' }]}>
            {customerName && (
              <>
                <Text style={styles.metaLabel}>Invoice Type</Text>
                <Text style={[styles.metaValue, { marginBottom: 6 }]}>{invoice.invoiceType.charAt(0).toUpperCase() + invoice.invoiceType.slice(1)}</Text>
              </>
            )}
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.colDesc]}>Description</Text>
          <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
          <Text style={[styles.headerText, styles.colUnit]}>Unit Price</Text>
          <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
        </View>

        {invoice.lineItems.map((li, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{li.description}</Text>
            <Text style={[styles.colQty, { fontFamily: 'Courier' }]}>{li.quantity}</Text>
            <Text style={[styles.colUnit, { fontFamily: 'Courier' }]}>{formatCurrency(li.unitCost)}</Text>
            <Text style={[styles.colTotal, { fontFamily: 'Courier', fontWeight: 'bold' }]}>{formatCurrency(li.totalCost)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({(invoice.taxRate * 100).toFixed(0)}%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalBold}>Total</Text>
            <Text style={[styles.totalBold, { fontFamily: 'Courier' }]}>{formatCurrency(invoice.totalAmount)}</Text>
          </View>
          {invoice.amountPaid > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#059669' }]}>Paid</Text>
              <Text style={[styles.totalValue, { color: '#059669' }]}>−{formatCurrency(invoice.amountPaid)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalBold}>Balance Due</Text>
            <Text style={[styles.totalBold, { fontFamily: 'Courier' }]}>{formatCurrency(invoice.balanceDue)}</Text>
          </View>
        </View>

        {/* Payment History */}
        {payments.length > 0 && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <Text>{formatDate(p.date)} — {p.method}</Text>
                <Text style={{ fontFamily: 'Courier' }}>{formatCurrency(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {businessName} — Thank you for your business
        </Text>
      </Page>
    </Document>
  );
}

interface DownloadInvoicePDFProps {
  invoice: InvoiceRecord;
  payments?: PaymentRecord[];
  customerName?: string;
  customerAddress?: string;
  children?: React.ReactNode;
}

export function DownloadInvoicePDF({ invoice, payments = [], customerName, customerAddress, children }: DownloadInvoicePDFProps) {
  const fileName = `${invoice.invoiceNumber}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoiceDocument invoice={invoice} payments={payments} customerName={customerName} customerAddress={customerAddress} />}
      fileName={fileName}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) =>
        children || (
          <button
            style={{
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: 'var(--font-cond)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: '#374151',
              background: '#F3F4F6',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0 14px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'GENERATING…' : 'DOWNLOAD PDF'}
          </button>
        )
      }
    </PDFDownloadLink>
  );
}
