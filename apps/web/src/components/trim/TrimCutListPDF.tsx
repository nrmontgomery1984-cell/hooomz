'use client';

/**
 * TrimCutListPDF — @react-pdf/renderer document for the trim cut list.
 * Matches QuotePDF pattern: Document component + PDFDownloadLink wrapper.
 */

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import type { Room } from '@/lib/types/roomScan.types';
import type { TrimCalculationResult, CutPieceCategory } from '@/lib/types/trim.types';
import type { RevealGauge } from '@/lib/contexts/RevealGaugeContext';
import { mmToFractionalInches } from '@/lib/utils/units';

// ─── Constants ───────────────────────────────────────────────────────────────

const NAVY = '#1E3A8A';

const CATEGORY_LABELS: Record<CutPieceCategory, string> = {
  jamb:      'Jambs',
  stop:      'Doorstop',
  sill:      'Sill',
  casing:    'Casing',
  apron:     'Apron',
  baseboard: 'Baseboard',
};

const CATEGORY_ORDER: CutPieceCategory[] = ['jamb', 'stop', 'sill', 'casing', 'apron', 'baseboard'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mmToLf(mm: number): string {
  return (mm / 304.8).toFixed(1);
}

function fmtPiece(mm: number, category: CutPieceCategory): string {
  if (category === 'baseboard') return `${mmToLf(mm)} lf`;
  return mmToFractionalInches(mm);
}

function today(): string {
  return new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
    paddingBottom: 10,
  },
  brandLabel: {
    fontSize: 8,
    color: '#9ca3af',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomName: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerMeta: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 1,
    textAlign: 'right' as const,
  },
  revealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  revealSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  revealLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  // Settings row
  settingsRow: {
    flexDirection: 'row',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  settingsCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  settingsCellLast: {
    flex: 1,
    padding: 8,
  },
  settingsLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#9ca3af',
    marginBottom: 2,
  },
  settingsValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  summaryCardAccent: {
    flex: 1,
    padding: 10,
    borderWidth: 2,
    borderColor: NAVY,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9ca3af',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Cut list table
  openingHeader: {
    backgroundColor: NAVY,
    padding: '5 10',
  },
  openingHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  categoryHeader: {
    backgroundColor: '#f3f4f6',
    padding: '3 10',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  categoryHeaderText: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#6b7280',
  },
  pieceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  // The colored left bar is a fixed-width View child — @react-pdf backgroundColor is reliable on Views
  pieceColorBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  pieceContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5 10 5 8',
  },
  pieceLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  pieceNote: {
    fontSize: 7,
    color: '#9ca3af',
  },
  pieceDimWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pieceDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  pieceDim: {
    fontSize: 10,
    fontWeight: 'bold',
    color: NAVY,
    fontFamily: 'Courier',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

// ─── Props ───────────────────────────────────────────────────────────────────

export interface TrimCutListPDFProps {
  room: Room;
  result: TrimCalculationResult;
  activeGauge: RevealGauge;
  casingIn: number;
  revealIn: number;
  joint: 'miter' | 'butt';
  wastePct: number;
  jobId: string;
}

// ─── Document ────────────────────────────────────────────────────────────────

function TrimCutListDocument({
  room,
  result,
  activeGauge,
  casingIn,
  revealIn,
  joint,
  wastePct,
  jobId,
}: TrimCutListPDFProps) {
  // Build opening groups preserving insertion order
  const groups: { label: string; pieces: typeof result.pieces }[] = [];
  const groupMap = new Map<string, typeof result.pieces>();
  for (const p of result.pieces) {
    const g = groupMap.get(p.opening_label) ?? [];
    g.push(p);
    groupMap.set(p.opening_label, g);
  }
  for (const [label, pieces] of groupMap) {
    groups.push({ label, pieces });
  }

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.brandLabel}>Hooomz OS</Text>
            <Text style={s.title}>Trim Cut List</Text>
            <Text style={s.roomName}>{room.name}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerMeta}>Job: {jobId.slice(0, 8)}</Text>
            <Text style={s.headerMeta}>{today()}</Text>
            <View style={s.revealBadge}>
              <View style={[s.revealSwatch, { backgroundColor: activeGauge.color }]} />
              <Text style={[s.revealLabel, { color: activeGauge.color }]}>
                Reveal: {activeGauge.label}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Settings row ──────────────────────────────────────────── */}
        <View style={s.settingsRow}>
          <View style={s.settingsCell}>
            <Text style={s.settingsLabel}>Casing</Text>
            <Text style={s.settingsValue}>{casingIn}&quot;</Text>
          </View>
          <View style={s.settingsCell}>
            <Text style={s.settingsLabel}>Reveal</Text>
            <Text style={s.settingsValue}>{revealIn}&quot;</Text>
          </View>
          <View style={s.settingsCell}>
            <Text style={s.settingsLabel}>Joint</Text>
            <Text style={s.settingsValue}>{joint === 'miter' ? 'Miter' : 'Butt'}</Text>
          </View>
          <View style={s.settingsCellLast}>
            <Text style={s.settingsLabel}>Waste</Text>
            <Text style={s.settingsValue}>{(wastePct * 100).toFixed(0)}%</Text>
          </View>
        </View>

        {/* ── Summary cards ─────────────────────────────────────────── */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Casing</Text>
            <Text style={s.summaryValue}>{result.casing_lf.toFixed(1)} lf</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Baseboard</Text>
            <Text style={s.summaryValue}>{result.baseboard_lf.toFixed(1)} lf</Text>
          </View>
          <View style={s.summaryCardAccent}>
            <Text style={s.summaryLabel}>Stock Needed</Text>
            <Text style={[s.summaryValue, { color: NAVY }]}>{result.stock_lf.toFixed(1)} lf</Text>
          </View>
        </View>

        {/* ── Cut list ──────────────────────────────────────────────── */}
        {groups.map((group) => {
          // Sub-group by category in canonical order
          const byCategory = new Map<CutPieceCategory, typeof result.pieces>();
          for (const p of group.pieces) {
            const c = byCategory.get(p.category) ?? [];
            c.push(p);
            byCategory.set(p.category, c);
          }
          const cats = CATEGORY_ORDER.filter((c) => byCategory.has(c));

          return (
            <View key={group.label} wrap={false}>
              {/* Opening header */}
              <View style={s.openingHeader}>
                <Text style={s.openingHeaderText}>{group.label}</Text>
              </View>

              {cats.map((cat) => (
                <View key={cat}>
                  {/* Category sub-header */}
                  <View style={s.categoryHeader}>
                    <Text style={s.categoryHeaderText}>{CATEGORY_LABELS[cat]}</Text>
                  </View>

                  {/* Pieces */}
                  {byCategory.get(cat)!.map((piece, pi) => (
                    <View key={`${group.label}-${cat}-${pi}`} style={s.pieceRow}>
                      {/* Colored left bar */}
                      <View style={[s.pieceColorBar, { backgroundColor: activeGauge.color }]} />
                      <View style={s.pieceContent}>
                        <View>
                          <Text style={s.pieceLabel}>
                            {piece.qty > 1 ? `${piece.qty}\u00D7 ` : ''}{piece.label}
                          </Text>
                          {piece.note ? <Text style={s.pieceNote}>{piece.note}</Text> : null}
                        </View>
                        <View style={s.pieceDimWrap}>
                          <View style={[s.pieceDot, { backgroundColor: activeGauge.color }]} />
                          <Text style={s.pieceDim}>
                            {fmtPiece(piece.length_mm, cat)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <Text style={s.footer}>
          Generated by Hooomz OS — {today()}
        </Text>
      </Page>
    </Document>
  );
}

// ─── Download wrapper ────────────────────────────────────────────────────────

export function DownloadTrimCutListPDF(props: TrimCutListPDFProps) {
  const fileName = `trim-cut-list-${props.room.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;

  return (
    <PDFDownloadLink
      document={<TrimCutListDocument {...props} />}
      fileName={fileName}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) => (
        <button
          style={{
            minHeight: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: NAVY,
            background: '#FFFFFF',
            borderRadius: 8,
            border: `2px solid ${NAVY}`,
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '0 16px',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Generating...' : 'Download Cut List'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
