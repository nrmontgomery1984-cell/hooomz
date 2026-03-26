'use client';

/**
 * CustomerSummarySheet — Bottom sheet for on-device customer confirmation
 * and PDF download. Opened from the Discovery Review page.
 *
 * Flow:
 *   "Looks Good" → logs activity event, writes confirmedAt to draft → success state
 *   "Need to Change Something" → closes sheet, shows toast with edit hint
 */

import { useState, useCallback } from 'react';
import { Check, ArrowLeft, Download } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import dynamic from 'next/dynamic';
const DownloadDiscoverySummaryPDF = dynamic(
  () => import('./DiscoverySummaryPDF').then(mod => mod.DownloadDiscoverySummaryPDF),
  { ssr: false }
);
import type { DiscoveryDraft, PropertyData, DesignPreferences } from '@/lib/types/discovery.types';

// ============================================================================
// Helpers
// ============================================================================

function capitalize(s: string | null | undefined): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// Component
// ============================================================================

interface CustomerSummarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  draft: DiscoveryDraft;
  projectName: string;
  customerName: string;
  customerLastName?: string;
  customerPhone?: string;
  customerEmail?: string;
  scopeNotes?: string;
  confirmedAt: string | null;
  onConfirm: () => Promise<void>;
  onNeedChange: () => void;
}

export function CustomerSummarySheet({
  isOpen,
  onClose,
  draft,
  projectName,
  customerName,
  customerLastName,
  customerPhone,
  customerEmail,
  scopeNotes,
  confirmedAt,
  onConfirm,
  onNeedChange,
}: CustomerSummarySheetProps) {
  const [confirming, setConfirming] = useState(false);

  const p = draft.property as PropertyData;
  const pref = draft.preferences as DesignPreferences;
  const addr = p?.address;

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }, [onConfirm]);

  const handleNeedChange = useCallback(() => {
    onNeedChange();
    onClose();
  }, [onNeedChange, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Customer Summary">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Condensed property summary */}
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>
            {projectName}
          </p>
          {addr && (
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
              {[addr.street, addr.city, addr.province].filter(Boolean).join(', ')}
            </p>
          )}
          {/* Property basics */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {p?.homeType && <Chip>{capitalize(p.homeType)}</Chip>}
            {p?.totalSqft && <Chip>{p.totalSqft} sqft</Chip>}
            {p?.storeys && <Chip>{p.storeys} storey</Chip>}
            {p?.homeAge && <Chip>{p.homeAge === 'new' ? 'New Build' : `${p.homeAge} yrs`}</Chip>}
          </div>
          {/* Property details */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {p?.parking && <Chip>{capitalize(p.parking)}</Chip>}
            {p?.occupancy && <Chip>{capitalize(p.occupancy)}</Chip>}
            {p?.pets && <Chip>Pets{p.petDetails ? `: ${p.petDetails}` : ''}</Chip>}
          </div>
          {p?.accessNotes && (
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
              Access: {p.accessNotes}
            </p>
          )}
          {/* Design direction */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {pref?.style && <Chip>{capitalize(pref.style)}</Chip>}
            {pref?.colorDirection && <Chip>{capitalize(pref.colorDirection)}</Chip>}
            {pref?.floorLook && <Chip>Floor: {capitalize(pref.floorLook)}</Chip>}
            {pref?.trimStyle && <Chip>Trim: {capitalize(pref.trimStyle)}</Chip>}
          </div>
          {/* Priorities */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {pref?.priorities?.map((pri) => (
              <Chip key={pri}>{capitalize(pri)}</Chip>
            ))}
          </div>
          {pref?.inspirationNotes && (
            <p style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 6 }}>
              {pref.inspirationNotes}
            </p>
          )}
        </div>

        {/* Scope notes */}
        {scopeNotes && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 4 }}>
              Scope Notes
            </p>
            <p style={{ fontSize: 12, color: 'var(--mid)', lineHeight: 1.5 }}>{scopeNotes}</p>
          </div>
        )}

        {/* Confirmation section */}
        {confirmedAt ? (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'var(--green-bg)',
              border: '1px solid var(--green-bg)',
              textAlign: 'center',
            }}
          >
            <Check size={20} style={{ color: 'var(--green)', margin: '0 auto 4px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>
              Confirmed
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {new Date(confirmedAt).toLocaleString('en-CA', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', textAlign: 'center', marginBottom: 12 }}>
              Does this look right?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleNeedChange}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--mid)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <ArrowLeft size={16} /> Change
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                style={{
                  flex: 2,
                  minHeight: 48,
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  background: confirming ? 'var(--muted)' : 'var(--accent)',
                  border: 'none',
                  cursor: confirming ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Check size={16} /> Looks Good
              </button>
            </div>
          </div>
        )}

        {/* PDF download — always available */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <DownloadDiscoverySummaryPDF
            draft={draft}
            projectName={projectName}
            customerName={customerName}
            customerLastName={customerLastName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            scopeNotes={scopeNotes}
            confirmedAt={confirmedAt}
          >
            <button
              style={{
                width: '100%',
                minHeight: 44,
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--mid)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Download size={16} /> Download Summary PDF
            </button>
          </DownloadDiscoverySummaryPDF>
        </div>
      </div>
    </BottomSheet>
  );
}

// ============================================================================
// Chip helper
// ============================================================================

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 6,
        background: 'var(--accent-bg)',
        color: 'var(--accent)',
      }}
    >
      {children}
    </span>
  );
}
