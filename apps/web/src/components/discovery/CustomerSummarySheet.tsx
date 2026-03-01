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
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
            {projectName}
          </p>
          {addr && (
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
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
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
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
            <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 6 }}>
              {pref.inspirationNotes}
            </p>
          )}
        </div>

        {/* Scope notes */}
        {scopeNotes && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 4 }}>
              Scope Notes
            </p>
            <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{scopeNotes}</p>
          </div>
        )}

        {/* Confirmation section */}
        {confirmedAt ? (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              textAlign: 'center',
            }}
          >
            <Check size={20} style={{ color: '#10B981', margin: '0 auto 4px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>
              Confirmed
            </p>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              {new Date(confirmedAt).toLocaleString('en-CA', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', textAlign: 'center', marginBottom: 12 }}>
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
                  color: '#374151',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
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
                  color: '#FFFFFF',
                  background: confirming ? '#9CA3AF' : '#0F766E',
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
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
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
                color: '#374151',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
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
        background: '#F0FDFA',
        color: '#0F766E',
      }}
    >
      {children}
    </span>
  );
}
