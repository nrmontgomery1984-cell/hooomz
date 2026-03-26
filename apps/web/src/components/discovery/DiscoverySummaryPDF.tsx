'use client';

/**
 * DiscoverySummaryPDF — Client-side PDF via @react-pdf/renderer.
 * Generates a full discovery summary for the customer.
 * Follows the InvoicePDF pattern (Helvetica built-in fonts, StyleSheet.create).
 */

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import type { DiscoveryDraft, PropertyData, DesignPreferences } from '@/lib/types/discovery.types';

// ============================================================================
// Helpers
// ============================================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function capitalize(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// Styles
// ============================================================================

const ACCENT = '#6B6560';

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
    fontSize: 14,
    fontWeight: 'bold',
    color: ACCENT,
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
    marginBottom: 20,
  },
  metaCol: {
    width: '48%',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: ACCENT,
    marginBottom: 8,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
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
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  col2: {
    width: '50%',
  },
  col3: {
    width: '33.3%',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  pill: {
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#f0fdfa',
    color: ACCENT,
    fontWeight: 'bold',
  },
  scopeText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  confirmBlock: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  confirmText: {
    fontSize: 10,
    color: ACCENT,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 2,
  },
});

// ============================================================================
// Document
// ============================================================================

interface DiscoverySummaryDocProps {
  draft: DiscoveryDraft;
  projectName: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  scopeNotes?: string;
  confirmedAt?: string | null;
}

function DiscoverySummaryDocument({
  draft,
  projectName,
  customerName,
  customerPhone,
  customerEmail,
  scopeNotes,
  confirmedAt,
}: DiscoverySummaryDocProps) {
  const p = draft.property as PropertyData;
  const pref = draft.preferences as DesignPreferences;
  const addr = p?.address;
  const completedDate = draft.metadata?.updatedAt || draft.updatedAt;

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
            <Text style={styles.docType}>DISCOVERY SUMMARY</Text>
            <Text style={styles.dateText}>{formatDate(completedDate)}</Text>
          </View>
        </View>

        {/* Project + Customer */}
        <View style={styles.metaBlock}>
          <View style={styles.metaCol}>
            <Text style={styles.label}>Project</Text>
            <Text style={styles.value}>{projectName}</Text>
            {addr && (
              <>
                <Text style={[styles.value, { fontSize: 9, color: '#6b7280' }]}>
                  {[addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ')}
                </Text>
              </>
            )}
          </View>
          <View style={[styles.metaCol, { alignItems: 'flex-end' as const }]}>
            <Text style={styles.label}>Prepared For</Text>
            <Text style={styles.value}>{customerName}</Text>
            {customerPhone && <Text style={[styles.value, { fontSize: 9, color: '#6b7280' }]}>{customerPhone}</Text>}
            {customerEmail && <Text style={[styles.value, { fontSize: 9, color: '#6b7280' }]}>{customerEmail}</Text>}
          </View>
        </View>

        {/* Property Details */}
        <Text style={styles.sectionHeader}>Property Details</Text>
        <View style={styles.row}>
          <View style={styles.col3}>
            <Text style={styles.label}>Home Type</Text>
            <Text style={styles.value}>{capitalize(p?.homeType)}</Text>
          </View>
          <View style={styles.col3}>
            <Text style={styles.label}>Home Age</Text>
            <Text style={styles.value}>{p?.homeAge ? `${p.homeAge} yr` : '—'}</Text>
          </View>
          <View style={styles.col3}>
            <Text style={styles.label}>Storeys</Text>
            <Text style={styles.value}>{p?.storeys ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col3}>
            <Text style={styles.label}>Square Footage</Text>
            <Text style={{ ...styles.value, fontFamily: 'Courier' }}>{p?.totalSqft ? `${p.totalSqft} sqft` : '—'}</Text>
          </View>
          <View style={styles.col3}>
            <Text style={styles.label}>Parking</Text>
            <Text style={styles.value}>{capitalize(p?.parking)}</Text>
          </View>
          <View style={styles.col3}>
            <Text style={styles.label}>Occupancy</Text>
            <Text style={styles.value}>{capitalize(p?.occupancy)}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col2}>
            <Text style={styles.label}>Pets</Text>
            <Text style={styles.value}>{p?.pets ? `Yes — ${p.petDetails || 'details not specified'}` : 'No'}</Text>
          </View>
        </View>
        {p?.accessNotes ? (
          <View>
            <Text style={styles.label}>Access Notes</Text>
            <Text style={styles.value}>{p.accessNotes}</Text>
          </View>
        ) : null}

        {/* Design Preferences */}
        <Text style={styles.sectionHeader}>Design Preferences</Text>
        <View style={styles.row}>
          <View style={styles.col2}>
            <Text style={styles.label}>Style</Text>
            <Text style={styles.value}>{capitalize(pref?.style)}</Text>
          </View>
          <View style={styles.col2}>
            <Text style={styles.label}>Colour Direction</Text>
            <Text style={styles.value}>{capitalize(pref?.colorDirection)}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col2}>
            <Text style={styles.label}>Floor Look</Text>
            <Text style={styles.value}>{capitalize(pref?.floorLook)}</Text>
          </View>
          <View style={styles.col2}>
            <Text style={styles.label}>Trim Style</Text>
            <Text style={styles.value}>{capitalize(pref?.trimStyle)}</Text>
          </View>
        </View>
        {pref?.priorities?.length > 0 && (
          <View>
            <Text style={styles.label}>Top Priorities</Text>
            <View style={styles.pillRow}>
              {pref.priorities.map((pri) => (
                <Text key={pri} style={styles.pill}>{capitalize(pri)}</Text>
              ))}
            </View>
          </View>
        )}
        {pref?.inspirationNotes ? (
          <View>
            <Text style={styles.label}>Inspiration / Notes</Text>
            <Text style={styles.value}>{pref.inspirationNotes}</Text>
          </View>
        ) : null}

        {/* Scope Notes */}
        {scopeNotes ? (
          <>
            <Text style={styles.sectionHeader}>Scope Notes</Text>
            <Text style={styles.scopeText}>{scopeNotes}</Text>
          </>
        ) : null}

        {/* Confirmation */}
        <View style={styles.confirmBlock}>
          {confirmedAt ? (
            <Text style={styles.confirmText}>
              Reviewed and confirmed by customer on {formatDateTime(confirmedAt)}.
            </Text>
          ) : (
            <Text style={[styles.confirmText, { color: '#9ca3af' }]}>
              Pending customer review.
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This document confirms the scope discussed at the site visit.
          </Text>
          <Text style={styles.footerText}>
            Final pricing is subject to the formal quote.
          </Text>
          <Text style={[styles.footerText, { marginTop: 4 }]}>
            Hooomz Interiors — Moncton, NB — hooomz.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ============================================================================
// Download Wrapper
// ============================================================================

export interface DownloadDiscoverySummaryPDFProps {
  draft: DiscoveryDraft;
  projectName: string;
  customerName: string;
  customerLastName?: string;
  customerPhone?: string;
  customerEmail?: string;
  scopeNotes?: string;
  confirmedAt?: string | null;
  children?: React.ReactNode;
}

export function DownloadDiscoverySummaryPDF({
  draft,
  projectName,
  customerName,
  customerLastName,
  customerPhone,
  customerEmail,
  scopeNotes,
  confirmedAt,
  children,
}: DownloadDiscoverySummaryPDFProps) {
  const datePart = new Date().toISOString().slice(0, 10);
  const namePart = customerLastName || customerName.split(' ').pop() || 'Customer';
  const fileName = `Hooomz-Discovery-${namePart}-${datePart}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <DiscoverySummaryDocument
          draft={draft}
          projectName={projectName}
          customerName={customerName}
          customerPhone={customerPhone}
          customerEmail={customerEmail}
          scopeNotes={scopeNotes}
          confirmedAt={confirmedAt}
        />
      }
      fileName={fileName}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) =>
        children || (
          <button
            style={{
              minHeight: 44,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              background: '#F3F4F6',
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0 16px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Generating...' : 'Download Summary PDF'}
          </button>
        )
      }
    </PDFDownloadLink>
  );
}
