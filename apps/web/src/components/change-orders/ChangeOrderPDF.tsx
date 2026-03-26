'use client';

/**
 * ChangeOrderPDF — PDF generation for Change Orders using @react-pdf/renderer.
 * Exports a ChangeOrderPDF component wrapping PDFDownloadLink.
 */

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import type { ChangeOrder, ChangeOrderLineItem } from '@hooomz/shared-contracts';
import { CO_INITIATOR_LABEL } from '@hooomz/shared-contracts';

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  declined: 'Declined',
  draft: 'Draft',
  cancelled: 'Cancelled',
};

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
  },
  title: {
    fontSize: 20,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '8 0',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 4,
    marginBottom: 4,
    marginTop: 16,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
  },
  colDesc: { width: '40%' },
  colCategory: { width: '15%' },
  colHours: { width: '10%', textAlign: 'right' },
  colMaterial: { width: '12%', textAlign: 'right' },
  colLabor: { width: '12%', textAlign: 'right' },
  colTotal: { width: '11%', textAlign: 'right', fontWeight: 'bold' },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingTop: 6,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  description: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 16,
  },
});

interface ChangeOrderDocProps {
  changeOrder: ChangeOrder;
  lineItems: ChangeOrderLineItem[];
  projectName: string;
}

function ChangeOrderDocument({ changeOrder: co, lineItems, projectName }: ChangeOrderDocProps) {
  const totalMaterial = lineItems.reduce((s, li) => s + li.estimatedMaterialCost, 0);
  const totalLabor = lineItems.reduce((s, li) => s + li.estimatedLaborCost, 0);
  const totalHours = lineItems.reduce((s, li) => s + li.estimatedHours, 0);
  const grandTotal = lineItems.reduce((s, li) => s + li.estimatedTotal, 0);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>CHANGE ORDER</Text>
            <Text style={styles.subtitle}>Hooomz Interiors</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{co.coNumber}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
              {STATUS_LABELS[co.status] || co.status}
            </Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaBlock}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Project</Text>
            <Text style={styles.metaValue}>{projectName}</Text>
            <Text style={{ ...styles.metaLabel, marginTop: 8 }}>Title</Text>
            <Text style={styles.metaValue}>{co.title}</Text>
            <Text style={{ ...styles.metaLabel, marginTop: 8 }}>Initiated By</Text>
            <Text style={styles.metaValue}>{CO_INITIATOR_LABEL[co.initiatorType] || co.initiatorType}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Date Created</Text>
            <Text style={styles.metaValue}>{formatDate(co.metadata.createdAt)}</Text>
            {co.approvedAt && (
              <>
                <Text style={{ ...styles.metaLabel, marginTop: 8 }}>Date Approved</Text>
                <Text style={styles.metaValue}>{formatDate(co.approvedAt)}</Text>
              </>
            )}
            <Text style={{ ...styles.metaLabel, marginTop: 8 }}>Cost Impact</Text>
            <Text style={{ ...styles.metaValue, fontWeight: 'bold' }}>{formatCurrency(co.costImpact)}</Text>
            <Text style={{ ...styles.metaLabel, marginTop: 8 }}>Schedule Impact</Text>
            <Text style={styles.metaValue}>{co.scheduleImpactDays} day(s)</Text>
          </View>
        </View>

        {/* Description */}
        {co.description && (
          <View>
            <Text style={styles.metaLabel}>Description</Text>
            <Text style={styles.description}>{co.description}</Text>
          </View>
        )}

        {/* Line Items Table */}
        {lineItems.length > 0 && (
          <>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.colDesc, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Text>
              <Text style={{ ...styles.colCategory, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Category</Text>
              <Text style={{ ...styles.colHours, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hours</Text>
              <Text style={{ ...styles.colMaterial, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Material</Text>
              <Text style={{ ...styles.colLabor, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Labor</Text>
              <Text style={{ ...styles.colTotal, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</Text>
            </View>

            {lineItems.map((li) => (
              <View key={li.id} style={styles.tableRow}>
                <Text style={styles.colDesc}>{li.description}</Text>
                <Text style={styles.colCategory}>{li.category}</Text>
                <Text style={styles.colHours}>{li.estimatedHours}</Text>
                <Text style={styles.colMaterial}>{formatCurrency(li.estimatedMaterialCost)}</Text>
                <Text style={styles.colLabor}>{formatCurrency(li.estimatedLaborCost)}</Text>
                <Text style={styles.colTotal}>{formatCurrency(li.estimatedTotal)}</Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.colDesc}></Text>
              <Text style={{ ...styles.colCategory, fontWeight: 'bold' }}>Total</Text>
              <Text style={{ ...styles.colHours, fontWeight: 'bold' }}>{totalHours}</Text>
              <Text style={{ ...styles.colMaterial, fontWeight: 'bold' }}>{formatCurrency(totalMaterial)}</Text>
              <Text style={{ ...styles.colLabor, fontWeight: 'bold' }}>{formatCurrency(totalLabor)}</Text>
              <Text style={{ ...styles.colTotal, fontWeight: 'bold' }}>{formatCurrency(grandTotal)}</Text>
            </View>
          </>
        )}

        {/* Decline reason */}
        {co.status === 'declined' && co.declinedReason && (
          <View style={{ marginTop: 20, padding: 10, borderWidth: 1, borderColor: '#ef4444', borderRadius: 4 }}>
            <Text style={{ ...styles.metaLabel, color: '#ef4444' }}>Decline Reason</Text>
            <Text style={{ fontSize: 10, color: '#374151', lineHeight: 1.4 }}>{co.declinedReason}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Hooomz Interiors · Moncton, NB</Text>
          <Text style={styles.footerText}>{co.coNumber} · Generated {new Date().toLocaleDateString('en-CA')}</Text>
        </View>
      </Page>
    </Document>
  );
}

interface ChangeOrderPDFProps {
  changeOrder: ChangeOrder;
  lineItems: ChangeOrderLineItem[];
  projectName: string;
}

export function ChangeOrderPDF({ changeOrder, lineItems, projectName }: ChangeOrderPDFProps) {
  const filename = `${changeOrder.coNumber.replace(/[^a-zA-Z0-9-]/g, '_')}_${projectName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}.pdf`;

  return (
    <PDFDownloadLink
      document={<ChangeOrderDocument changeOrder={changeOrder} lineItems={lineItems} projectName={projectName} />}
      fileName={filename}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 44,
        borderRadius: 8,
        border: 'none',
        background: '#6B6560',
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
      }}
    >
      {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
    </PDFDownloadLink>
  );
}
