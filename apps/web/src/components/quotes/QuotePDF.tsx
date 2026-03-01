'use client';

/**
 * QuotePDF — Simplified client-facing quote PDF.
 * Clean, Hooomz Interiors-branded summary: project, line items by trade,
 * payment schedule, cover notes, expiry. No legal boilerplate or signatures.
 */

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import type { QuoteRecord, CustomerRecord, LineItem } from '@hooomz/shared-contracts';

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

const CATEGORY_LABELS: Record<string, string> = {
  'site-work': 'Site Work', foundation: 'Foundation', framing: 'Framing',
  exterior: 'Exterior', roofing: 'Roofing', 'windows-doors': 'Windows & Doors',
  plumbing: 'Plumbing', electrical: 'Electrical', hvac: 'HVAC',
  insulation: 'Insulation', drywall: 'Drywall', 'interior-trim': 'Interior Trim',
  flooring: 'Flooring', painting: 'Painting', trim: 'Trim & Millwork',
  cabinets: 'Cabinets', countertops: 'Countertops', fixtures: 'Fixtures',
  appliances: 'Appliances', landscaping: 'Landscaping', cleanup: 'Cleanup',
  general: 'General', overhead: 'Overhead', other: 'Other',
  FLOR: 'Flooring', TRIM: 'Trim', PAINT: 'Painting', DEMO: 'Demo',
  PLMB: 'Plumbing', ELEC: 'Electrical', TILE: 'Tile', CARP: 'Carpentry',
};

// ============================================================================
// Styles
// ============================================================================

const TEAL = '#0F766E';

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
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    paddingBottom: 12,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  docType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEAL,
    textAlign: 'right' as const,
  },
  dateText: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'right' as const,
  },
  metaBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaCol: {
    width: '48%',
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#6b7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 2,
  },
  tradeHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: TEAL,
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  itemDesc: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
  },
  itemTotal: {
    width: 80,
    textAlign: 'right',
    fontSize: 9,
    fontFamily: 'Courier',
    color: '#374151',
  },
  totalSection: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: TEAL,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginVertical: 4,
  },
  paymentSection: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: TEAL,
    marginBottom: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  notesSection: {
    marginTop: 14,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.5,
  },
  expiryText: {
    marginTop: 12,
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

// ============================================================================
// Types
// ============================================================================

interface QuotePDFProps {
  quote: QuoteRecord;
  project: {
    name: string;
    address?: { street?: string; city?: string; province?: string; postalCode?: string };
    dates?: { startDate?: string; estimatedEndDate?: string };
  };
  customer: CustomerRecord;
  lineItems: LineItem[];
}

interface TradeGroup {
  key: string;
  label: string;
  items: LineItem[];
  total: number;
}

// ============================================================================
// Document
// ============================================================================

function QuoteDocument({ quote, project, customer, lineItems }: QuotePDFProps) {
  const depositPct = quote.depositPercentage ?? 25;
  const depositAmount = Math.round(quote.totalAmount * (depositPct / 100) * 100) / 100;
  const progressAmount = Math.round(quote.totalAmount * 0.40 * 100) / 100;
  const finalAmount = Math.round((quote.totalAmount - depositAmount - progressAmount) * 100) / 100;

  const customerAddr = [customer.propertyAddress, customer.propertyCity, customer.propertyProvince].filter(Boolean).join(', ');
  const projectAddr = project.address
    ? [project.address.street, project.address.city, project.address.province].filter(Boolean).join(', ')
    : customerAddr;

  // Group line items by trade/category
  const groupMap = new Map<string, LineItem[]>();
  for (const item of lineItems) {
    const key = item.workCategoryCode || item.category || 'other';
    const existing = groupMap.get(key) || [];
    existing.push(item);
    groupMap.set(key, existing);
  }

  const tradeGroups: TradeGroup[] = [];
  for (const [key, items] of groupMap) {
    const total = items.reduce((s, i) => s + i.totalCost, 0);
    tradeGroups.push({
      key,
      label: CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
      items,
      total,
    });
  }
  tradeGroups.sort((a, b) => b.total - a.total);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>Hooomz Interiors</Text>
            <Text style={styles.brandSub}>Moncton, NB</Text>
          </View>
          <View>
            <Text style={styles.docType}>QUOTE</Text>
            <Text style={styles.dateText}>
              {formatDate(quote.sentAt || quote.createdAt)}
            </Text>
          </View>
        </View>

        {/* Client & Project Info */}
        <View style={styles.metaBlock}>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Prepared For</Text>
            <Text style={styles.value}>{customer.firstName} {customer.lastName}</Text>
            {customerAddr ? <Text style={[styles.value, { color: '#6b7280', fontSize: 9 }]}>{customerAddr}</Text> : null}
            {customer.phone ? <Text style={[styles.value, { color: '#6b7280', fontSize: 9 }]}>{customer.phone}</Text> : null}
            {customer.email ? <Text style={[styles.value, { color: '#6b7280', fontSize: 9 }]}>{customer.email}</Text> : null}
          </View>
          <View style={[styles.metaCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.label}>Project</Text>
            <Text style={[styles.value, { textAlign: 'right' }]}>{project.name || 'Renovation Project'}</Text>
            {projectAddr ? <Text style={[styles.value, { color: '#6b7280', fontSize: 9, textAlign: 'right' }]}>{projectAddr}</Text> : null}
            {project.dates?.startDate && (
              <>
                <Text style={[styles.label, { marginTop: 6 }]}>Estimated Start</Text>
                <Text style={[styles.value, { textAlign: 'right' }]}>{formatDate(project.dates.startDate)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Scope of Work — Grouped by Trade */}
        <Text style={[styles.label, { marginTop: 4, marginBottom: 6, fontSize: 9 }]}>Scope of Work</Text>

        {tradeGroups.map((group) => (
          <View key={group.key} wrap={false}>
            <Text style={styles.tradeHeader}>{group.label}</Text>
            {group.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemDesc}>
                  {item.description}
                  {item.quantity > 1 ? ` (${item.quantity} ${item.unit || 'ea'})` : ''}
                </Text>
                <Text style={styles.itemTotal}>{formatCurrency(item.totalCost)}</Text>
              </View>
            ))}
            {/* Trade subtotal */}
            <View style={[styles.itemRow, { borderTopWidth: 0.5, borderTopColor: '#e5e7eb', marginTop: 2, paddingTop: 3 }]}>
              <Text style={[styles.itemDesc, { fontWeight: 'bold', fontSize: 9 }]}>{group.label} Subtotal</Text>
              <Text style={[styles.itemTotal, { fontWeight: 'bold' }]}>{formatCurrency(group.total)}</Text>
            </View>
          </View>
        ))}

        {/* Grand Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalBold}>Total</Text>
            <Text style={[styles.totalBold, { fontFamily: 'Courier' }]}>{formatCurrency(quote.totalAmount)}</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
            All amounts in CAD. HST included.
          </Text>
        </View>

        {/* Payment Schedule */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Payment Schedule</Text>
          <View style={styles.paymentRow}>
            <Text style={{ fontSize: 10 }}>Deposit ({depositPct}%) — due at signing</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Courier', fontWeight: 'bold' }}>{formatCurrency(depositAmount)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={{ fontSize: 10 }}>Progress payment (40%) — mid-project</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Courier', fontWeight: 'bold' }}>{formatCurrency(progressAmount)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={{ fontSize: 10 }}>Final payment — at completion</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Courier', fontWeight: 'bold' }}>{formatCurrency(finalAmount)}</Text>
          </View>
        </View>

        {/* Cover Notes */}
        {quote.coverNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{quote.coverNotes}</Text>
          </View>
        )}

        {/* Video link mention */}
        {quote.videoLink && (
          <Text style={[styles.expiryText, { marginTop: 10 }]}>
            A video walkthrough of this project is available — ask us for the link.
          </Text>
        )}

        {/* Expiry */}
        {quote.expiresAt && (
          <Text style={styles.expiryText}>
            This quote is valid until {formatDate(quote.expiresAt)}.
          </Text>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Hooomz Interiors — Moncton, NB — hooomz.com
        </Text>
      </Page>
    </Document>
  );
}

// ============================================================================
// Download Wrapper
// ============================================================================

export interface DownloadQuotePDFProps {
  quote: QuoteRecord;
  project: QuotePDFProps['project'];
  customer: CustomerRecord;
  lineItems: LineItem[];
  children?: React.ReactNode;
}

export function DownloadQuotePDF({
  quote,
  project,
  customer,
  lineItems,
  children,
}: DownloadQuotePDFProps) {
  const fileName = `Hooomz-Quote-${customer.lastName}-${quote.projectId}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <QuoteDocument
          quote={quote}
          project={project}
          customer={customer}
          lineItems={lineItems}
        />
      }
      fileName={fileName}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) =>
        children || (
          <button
            style={{
              minHeight: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: TEAL,
              background: '#FFFFFF',
              borderRadius: 'var(--radius, 12px)',
              border: `2px solid ${TEAL}`,
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0 16px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Generating...' : 'Download Quote PDF'}
          </button>
        )
      }
    </PDFDownloadLink>
  );
}
