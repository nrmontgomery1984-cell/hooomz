'use client';

/**
 * ContractPDF — Client-side PDF via @react-pdf/renderer.
 * Plain-language contractor agreement derived from quote data.
 * Generated when quote is marked 'sent'. Downloaded alongside the quote PDF.
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
  if (!iso) return 'To be confirmed';
  return new Date(iso).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Category label map
const CATEGORY_LABELS: Record<string, string> = {
  'site-work': 'Site Work', foundation: 'Foundation', framing: 'Framing',
  exterior: 'Exterior', roofing: 'Roofing', 'windows-doors': 'Windows & Doors',
  plumbing: 'Plumbing', electrical: 'Electrical', hvac: 'HVAC',
  insulation: 'Insulation', drywall: 'Drywall', 'interior-trim': 'Interior Trim',
  flooring: 'Flooring', painting: 'Painting', 'cabinets-countertops': 'Cabinets & Countertops',
  appliances: 'Appliances', fixtures: 'Fixtures', landscaping: 'Landscaping',
  'permits-fees': 'Permits & Fees', labor: 'Labor', materials: 'Materials',
  'equipment-rental': 'Equipment Rental', subcontractors: 'Subcontractors',
  contingency: 'Contingency', other: 'Other',
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
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    paddingBottom: 12,
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#FFFFFF',
    backgroundColor: TEAL,
    padding: '4px 8px',
    marginTop: 16,
    marginBottom: 8,
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
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
    marginBottom: 6,
  },
  metaBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaCol: {
    width: '48%',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
  },
  itemDesc: { flex: 1, fontSize: 9 },
  itemQty: { width: 60, textAlign: 'right', fontSize: 9 },
  itemTotal: { width: 80, textAlign: 'right', fontSize: 9, fontFamily: 'Courier' },
  categoryLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: TEAL,
    marginTop: 6,
    marginBottom: 2,
  },
  signatureBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureCol: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    marginTop: 40,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#6b7280',
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

interface ContractPDFProps {
  quote: QuoteRecord;
  project: { name: string; address?: { street?: string; city?: string; province?: string; postalCode?: string }; dates?: { startDate?: string; estimatedEndDate?: string } };
  customer: CustomerRecord;
  lineItems: LineItem[];
  depositPercentage: number;
}

// ============================================================================
// Document
// ============================================================================

function ContractDocument({ quote, project, customer, lineItems, depositPercentage }: ContractPDFProps) {
  const depositAmount = Math.round(quote.totalAmount * (depositPercentage / 100) * 100) / 100;
  const progressAmount = Math.round(quote.totalAmount * 0.40 * 100) / 100;
  const finalAmount = Math.round((quote.totalAmount - depositAmount - progressAmount) * 100) / 100;
  const taxRate = 15;

  const customerAddr = [customer.propertyAddress, customer.propertyCity, customer.propertyProvince].filter(Boolean).join(', ');
  const projectAddr = project.address
    ? [project.address.street, project.address.city, project.address.province, project.address.postalCode].filter(Boolean).join(', ')
    : customerAddr;

  // Group line items by category
  const groupMap = new Map<string, LineItem[]>();
  for (const item of lineItems) {
    const key = item.category || 'other';
    const existing = groupMap.get(key) || [];
    existing.push(item);
    groupMap.set(key, existing);
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Hooomz Interiors</Text>
            <Text style={styles.subtitle}>Moncton, NB</Text>
          </View>
          <View>
            <Text style={styles.docType}>CONTRACT</Text>
            <Text style={styles.dateText}>
              {formatDate(quote.contractGeneratedAt || quote.sentAt || new Date().toISOString())}
            </Text>
          </View>
        </View>

        {/* Section 1 — Parties */}
        <Text style={styles.sectionHeader}>1. Parties</Text>
        <View style={styles.metaBlock}>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Contractor</Text>
            <Text style={styles.value}>Hooomz Interiors</Text>
            <Text style={[styles.value, { color: '#6b7280', fontSize: 9 }]}>Moncton, NB</Text>
            <Text style={[styles.value, { color: '#6b7280', fontSize: 9 }]}>License: [To be assigned]</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Client</Text>
            <Text style={styles.value}>{customer.firstName} {customer.lastName}</Text>
            {customerAddr && <Text style={[styles.value, { color: '#6b7280', fontSize: 9 }]}>{customerAddr}</Text>}
            {customer.phone && <Text style={[styles.value, { color: '#6b7280', fontSize: 9 }]}>{customer.phone}</Text>}
            {customer.email && <Text style={[styles.value, { color: '#6b7280', fontSize: 9 }]}>{customer.email}</Text>}
          </View>
        </View>

        {/* Property */}
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.label}>Property Address</Text>
          <Text style={styles.value}>{projectAddr}</Text>
        </View>

        {/* Section 2 — Scope of Work */}
        <Text style={styles.sectionHeader}>2. Scope of Work</Text>
        <Text style={styles.bodyText}>
          The contractor agrees to complete the following work at the property described above:
        </Text>

        {Array.from(groupMap.entries()).map(([category, items]) => (
          <View key={category}>
            <Text style={styles.categoryLabel}>
              {CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            {items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
                <Text style={styles.itemTotal}>{formatCurrency(item.totalCost)}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Section 3 — Contract Price */}
        <Text style={styles.sectionHeader}>3. Contract Price</Text>
        <Text style={styles.bodyText}>
          Total contract price: <Text style={{ fontWeight: 'bold', fontFamily: 'Courier' }}>{formatCurrency(quote.totalAmount)}</Text> (CAD), inclusive of HST at {taxRate}%.
        </Text>
        <Text style={styles.bodyText}>
          Price is based on the scope of work described above. Changes to scope are subject to a written change order.
        </Text>

        {/* Section 4 — Payment Schedule */}
        <Text style={styles.sectionHeader}>4. Payment Schedule</Text>
        <View style={{ marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 10 }}>Deposit ({depositPercentage}%) — due at signing</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Courier', fontWeight: 'bold' }}>{formatCurrency(depositAmount)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 10 }}>Progress payment (40%) — substantial completion of rough work</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Courier', fontWeight: 'bold' }}>{formatCurrency(progressAmount)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 10 }}>Final payment — due at completion</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Courier', fontWeight: 'bold' }}>{formatCurrency(finalAmount)}</Text>
          </View>
        </View>
        <Text style={[styles.bodyText, { fontSize: 9 }]}>
          Payment methods accepted: e-transfer, cheque, or credit card.
        </Text>

        {/* Section 5 — Timeline */}
        <Text style={styles.sectionHeader}>5. Timeline</Text>
        <Text style={styles.bodyText}>
          Estimated start date: {formatDate(project.dates?.startDate)}.{'\n'}
          Estimated completion: {formatDate(project.dates?.estimatedEndDate)}.
        </Text>
        <Text style={[styles.bodyText, { fontSize: 9 }]}>
          Timeline is subject to material availability, weather, and customer-caused delays.
        </Text>

        {/* Section 6 — Materials */}
        <Text style={styles.sectionHeader}>6. Materials</Text>
        <Text style={styles.bodyText}>
          All materials will be selected in consultation with the client. Material allowances are included in the contract price where specified. Upgrades or changes to materials may result in a change order.
        </Text>

        {/* Section 7 — Warranty */}
        <Text style={styles.sectionHeader}>7. Warranty</Text>
        <Text style={styles.bodyText}>
          Hooomz Interiors warrants all labour for a period of one (1) year from the date of substantial completion. Manufacturer warranties apply to all materials and fixtures.
        </Text>

        {/* Section 8 — Change Orders */}
        <Text style={styles.sectionHeader}>8. Change Orders</Text>
        <Text style={styles.bodyText}>
          Any changes to the scope of work must be agreed to in writing via a signed change order before work proceeds. Change orders may affect the contract price and timeline.
        </Text>

        {/* Section 9 — Signatures */}
        <Text style={styles.sectionHeader}>9. Signatures</Text>
        <Text style={[styles.bodyText, { marginBottom: 4 }]}>
          This contract is binding upon signature by both parties.
        </Text>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Client Signature</Text>
            <View style={[styles.signatureLine, { marginTop: 20 }]} />
            <Text style={styles.signatureLabel}>Printed Name</Text>
            <View style={[styles.signatureLine, { marginTop: 20 }]} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
          <View style={styles.signatureCol}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Contractor Signature</Text>
            <View style={[styles.signatureLine, { marginTop: 20 }]} />
            <Text style={styles.signatureLabel}>Printed Name</Text>
            <View style={[styles.signatureLine, { marginTop: 20 }]} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>

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

export interface DownloadContractPDFProps {
  quote: QuoteRecord;
  project: ContractPDFProps['project'];
  customer: CustomerRecord;
  lineItems: LineItem[];
  depositPercentage: number;
  children?: React.ReactNode;
}

export function DownloadContractPDF({
  quote,
  project,
  customer,
  lineItems,
  depositPercentage,
  children,
}: DownloadContractPDFProps) {
  const fileName = `Hooomz-Contract-${customer.lastName}-${quote.projectId}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <ContractDocument
          quote={quote}
          project={project}
          customer={customer}
          lineItems={lineItems}
          depositPercentage={depositPercentage}
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
              color: '#0F766E',
              background: '#FFFFFF',
              borderRadius: 'var(--radius, 12px)',
              border: '2px solid #0F766E',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0 16px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Generating...' : 'Download Contract'}
          </button>
        )
      }
    </PDFDownloadLink>
  );
}
