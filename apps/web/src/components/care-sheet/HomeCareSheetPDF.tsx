'use client';

/**
 * HomeCareSheetPDF — Client-side PDF generation using @react-pdf/renderer.
 * Exports DownloadCareSheetPDF component wrapping PDFDownloadLink.
 */

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import type { HomeCareSheetData, CareTradeSection } from '@/lib/types/homeCareSheet.types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ============================================================================
// Styles
// ============================================================================

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
    borderBottomColor: '#1e3a5f',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a5f',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginTop: 18,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tradeHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginTop: 14,
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 3,
  },
  bulletItem: {
    fontSize: 9,
    marginBottom: 2,
    paddingLeft: 8,
    color: '#374151',
  },
  materialRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b7280',
    width: 100,
  },
  infoValue: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
  },
  warrantyBox: {
    marginTop: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 4,
    backgroundColor: '#f0fdf4',
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
});

// ============================================================================
// Document
// ============================================================================

function CareSheetDocument({ data }: { data: HomeCareSheetData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Home Care Sheet</Text>
            <Text style={styles.subtitle}>{data.businessName} — Moncton, NB</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{data.projectName}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{data.propertyAddress}</Text>
          </View>
        </View>

        {/* Project Info */}
        <View style={{ marginBottom: 12 }}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Homeowner</Text>
            <Text style={styles.infoValue}>{data.customerName}</Text>
          </View>
          {data.customerPhone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{data.customerPhone}</Text>
            </View>
          )}
          {data.customerEmail && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{data.customerEmail}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Completed</Text>
            <Text style={styles.infoValue}>{formatDate(data.completionDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warranty Until</Text>
            <Text style={[styles.infoValue, { fontWeight: 'bold', color: '#059669' }]}>{formatDate(data.warrantyExpiryDate)}</Text>
          </View>
        </View>

        {/* Trade Sections */}
        {data.tradeSections.map((section) => (
          <TradeSectionPDF key={section.tradeCode} section={section} />
        ))}

        {/* General Warranty */}
        <View style={styles.warrantyBox}>
          <Text style={[styles.subLabel, { marginTop: 0 }]}>Labour Warranty</Text>
          <Text style={styles.bulletItem}>All labour is warranted for 1 year from project completion ({formatDate(data.completionDate)} — {formatDate(data.warrantyExpiryDate)}).</Text>
          <Text style={styles.bulletItem}>Warranty covers defects in workmanship only — not normal wear, misuse, or acts of nature.</Text>
          <Text style={styles.bulletItem}>To file a claim, contact {data.businessName} at {data.businessPhone} or {data.businessEmail}.</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {data.businessName} — Thank you for choosing us for your home
        </Text>
      </Page>
    </Document>
  );
}

function TradeSectionPDF({ section }: { section: CareTradeSection }) {
  return (
    <View wrap={false}>
      <Text style={styles.tradeHeader}>{section.tradeName}</Text>

      {/* Locations */}
      {section.locationsWorked.length > 0 && (
        <>
          <Text style={styles.subLabel}>Locations</Text>
          <Text style={styles.bulletItem}>{section.locationsWorked.join(', ')}</Text>
        </>
      )}

      {/* Materials */}
      {section.materialsInstalled.length > 0 && (
        <>
          <Text style={styles.subLabel}>Materials Installed</Text>
          {section.materialsInstalled.map((mat, i) => (
            <View key={i} style={styles.materialRow}>
              <Text style={{ flex: 1, fontSize: 9 }}>{mat.description}</Text>
              {mat.location && <Text style={{ width: 80, fontSize: 9, color: '#6b7280' }}>{mat.location}</Text>}
              {mat.quantity != null && (
                <Text style={{ width: 60, fontSize: 9, fontFamily: 'Courier', textAlign: 'right' }}>
                  {mat.quantity} {mat.unit || ''}
                </Text>
              )}
            </View>
          ))}
        </>
      )}

      {/* Care Instructions */}
      <Text style={styles.subLabel}>Care Instructions</Text>
      {section.careInstructions.map((instruction, i) => (
        <Text key={i} style={styles.bulletItem}>• {instruction}</Text>
      ))}

      {/* Things to Avoid */}
      {section.thingsToAvoid.length > 0 && (
        <>
          <Text style={styles.subLabel}>Things to Avoid</Text>
          {section.thingsToAvoid.map((item, i) => (
            <Text key={i} style={styles.bulletItem}>✕ {item}</Text>
          ))}
        </>
      )}

      {/* Warranty Note */}
      <Text style={[styles.bulletItem, { marginTop: 4, fontStyle: 'italic', color: '#6b7280' }]}>
        {section.warrantyNotes}
      </Text>
    </View>
  );
}

// ============================================================================
// Download Button Wrapper
// ============================================================================

interface DownloadCareSheetPDFProps {
  data: HomeCareSheetData;
  children?: React.ReactNode;
}

export function DownloadCareSheetPDF({ data, children }: DownloadCareSheetPDFProps) {
  const fileName = `Care-Sheet_${data.projectName.replace(/\s+/g, '-')}.pdf`;

  return (
    <PDFDownloadLink
      document={<CareSheetDocument data={data} />}
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
              fontFamily: 'DM Mono, monospace',
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
