'use client';

/**
 * Discovery Review — /discovery/[projectId]/review
 *
 * Required stop after discovery completion. Read-only summary of everything
 * captured during the discovery wizard. Three actions:
 *   1. Send Customer Summary (bottom sheet with confirmation + PDF)
 *   2. Create Estimate (navigates to /estimates/[projectId])
 *   3. Back to Leads
 */

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  FileText,
  ChevronRight,
  CheckCircle,
  Pencil,
} from 'lucide-react';
import { useLocalProject } from '@/lib/hooks/useLocalData';
import { useCustomer } from '@/lib/hooks/useCustomersV2';
import { useDiscoveryDraft, useUpdateDiscoveryDraft } from '@/lib/hooks/useDiscoveryData';
import { useConsultationByProject, useUpdateConsultation } from '@/lib/hooks/useConsultations';
import { useProjectLineItems } from '@/lib/hooks/useEstimateLocal';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useToast } from '@/components/ui/Toast';
import { CustomerSummarySheet } from '@/components/discovery/CustomerSummarySheet';
import { createEstimateFromDiscovery } from '@/lib/utils/createEstimateFromDiscovery';
import type { PropertyData, DesignPreferences } from '@/lib/types/discovery.types';

// ============================================================================
// Helpers
// ============================================================================

function capitalize(s: string | null | undefined): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// Sub-components
// ============================================================================

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--accent)',
          marginBottom: 12,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 1 }}>{label}</p>
      <p style={{ fontSize: 13, color: 'var(--charcoal)' }}>{value ?? '—'}</p>
    </div>
  );
}

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

// ============================================================================
// Main Page
// ============================================================================

export default function DiscoveryReviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { services } = useServicesContext();
  const { showToast } = useToast();

  // Data loading
  const { data: draft, isLoading: draftLoading } = useDiscoveryDraft(projectId);
  const { data: consultation, isLoading: consultationLoading } = useConsultationByProject(projectId);
  const { data: project, isLoading: projectLoading } = useLocalProject(projectId);
  const { data: customer, isLoading: customerLoading } = useCustomer(project?.customerId);
  const { data: lineItems } = useProjectLineItems(projectId);

  const updateDraft = useUpdateDiscoveryDraft();
  const updateConsultation = useUpdateConsultation();

  // State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scopeNotes, setScopeNotes] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  // Derived
  const hasExistingEstimate = (lineItems?.length ?? 0) > 0;
  const confirmedAt = (draft as unknown as Record<string, unknown>)?.confirmedAt as string | null ?? null;

  const customerName = useMemo(() => {
    if (customer) return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer';
    return draft?.customerName || project?.name || 'Customer';
  }, [customer, draft, project]);

  const customerLastName = customer?.lastName || '';

  const effectiveScopeNotes = scopeNotes ?? consultation?.scopeNotes ?? '';

  const p = draft?.property as PropertyData | undefined;
  const pref = draft?.preferences as DesignPreferences | undefined;
  const addr = p?.address;
  const completedDate = draft?.metadata?.updatedAt || draft?.updatedAt || '';

  // Scope notes save on blur
  const handleScopeNotesBlur = useCallback(async () => {
    if (!consultation || scopeNotes === null) return;
    await updateConsultation.mutateAsync({
      id: consultation.id,
      data: { scopeNotes: scopeNotes },
    });
  }, [consultation, scopeNotes, updateConsultation]);

  // Customer confirmation
  const handleConfirm = useCallback(async () => {
    if (!draft || !services) return;
    const now = new Date().toISOString();
    await updateDraft.mutateAsync({
      draftId: draft.id,
      projectId,
      currentStep: draft.currentStep,
      property: draft.property,
      preferences: draft.preferences,
    });
    // Write confirmedAt directly (the draft update above preserves other fields)
    await services.discoveryDrafts.update(draft.id, {
      updatedAt: now,
    } as Record<string, unknown>);
    // Store confirmedAt on the draft record
    const existing = await services.discoveryDrafts.findById(draft.id);
    if (existing) {
      await services.discoveryDrafts.update(draft.id, {
        ...existing,
        confirmedAt: now,
      } as Record<string, unknown>);
    }

    await services.activity.create({
      event_type: 'discovery.customer_confirmed',
      project_id: projectId,
      entity_type: 'project',
      entity_id: projectId,
      summary: `Customer confirmed discovery summary for ${customerName}`,
      event_data: { confirmedAt: now },
    }).catch((err) => console.error('Failed to log customer_confirmed:', err));

    showToast({ message: 'Customer confirmed', variant: 'success' });
  }, [draft, services, projectId, customerName, updateDraft, showToast]);

  // Need change handler
  const handleNeedChange = useCallback(() => {
    showToast({ message: 'Go back to the wizard to update anything', variant: 'info', duration: 4000 });
  }, [showToast]);

  // Create estimate
  const handleCreateEstimate = useCallback(async () => {
    if (!draft || !services || navigating) return;
    setNavigating(true);
    try {
      await createEstimateFromDiscovery(projectId, draft, services);
      router.push(`/estimates/${projectId}`);
    } catch (err) {
      console.error('Failed to create estimate from discovery:', err);
      showToast({ message: 'Failed to navigate to estimate', variant: 'error' });
      setNavigating(false);
    }
  }, [draft, services, projectId, router, navigating, showToast]);

  // Loading
  const isLoading = draftLoading || consultationLoading || projectLoading || customerLoading;
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading review...</p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>No discovery found</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Complete the discovery wizard first.
          </p>
          <button
            onClick={() => router.push(`/discovery/${projectId}`)}
            style={{
              marginTop: 12,
              minHeight: 44,
              padding: '0 20px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              background: 'var(--accent)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Start Discovery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => router.push('/leads')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}
            >
              <ArrowLeft size={16} /> Pipeline
            </button>
            <button
              onClick={() => router.push(`/discovery/${projectId}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}
            >
              <Pencil size={14} /> Edit Discovery
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>
              {customerName}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                }}
              >
                Discovery Complete
              </span>
              {completedDate && (
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {formatDate(completedDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Section 1 — Property */}
        <SectionCard title="Property Details">
          {addr && (
            <DetailRow
              label="Address"
              value={[addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ')}
            />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <DetailRow label="Home Type" value={capitalize(p?.homeType)} />
            <DetailRow label="Home Age" value={p?.homeAge ? `${p.homeAge} yr` : undefined} />
            <DetailRow label="Storeys" value={p?.storeys ?? undefined} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <DetailRow label="Square Footage" value={p?.totalSqft ? `${p.totalSqft} sqft` : undefined} />
            <DetailRow label="Parking" value={capitalize(p?.parking)} />
            <DetailRow label="Occupancy" value={capitalize(p?.occupancy)} />
          </div>
          <DetailRow label="Pets" value={p?.pets ? `Yes — ${p?.petDetails || 'details not specified'}` : 'No'} />
          {p?.accessNotes && <DetailRow label="Access Notes" value={p.accessNotes} />}
        </SectionCard>

        {/* Section 2 — Design Preferences */}
        <SectionCard title="Design Preferences">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <DetailRow label="Style" value={capitalize(pref?.style)} />
            <DetailRow label="Colour Direction" value={capitalize(pref?.colorDirection)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <DetailRow label="Floor Look" value={capitalize(pref?.floorLook)} />
            <DetailRow label="Trim Style" value={capitalize(pref?.trimStyle)} />
          </div>
          {pref?.priorities && pref.priorities.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Top Priorities</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {pref.priorities.map((pri) => (
                  <Chip key={pri}>{capitalize(pri)}</Chip>
                ))}
              </div>
            </div>
          )}
          {pref?.inspirationNotes && <DetailRow label="Inspiration" value={pref.inspirationNotes} />}
        </SectionCard>

        {/* Section 3 — Scope Notes (editable) */}
        <SectionCard title="Scope Notes">
          <textarea
            value={effectiveScopeNotes}
            onChange={(e) => setScopeNotes(e.target.value)}
            onBlur={handleScopeNotesBlur}
            placeholder="Add or refine scope notes before sending to customer..."
            rows={3}
            style={{
              width: '100%',
              minHeight: 44,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 13,
              color: 'var(--charcoal)',
              background: 'var(--bg)',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          {updateConsultation.isPending && (
            <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Saving...</p>
          )}
        </SectionCard>

        {/* Confirmation status */}
        {confirmedAt && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--green-bg)',
              border: '1px solid var(--green-bg)',
            }}
          >
            <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>
              Customer confirmed on {formatDate(confirmedAt)}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {/* Button 1 — Send Customer Summary */}
          <button
            onClick={() => setSheetOpen(true)}
            style={{
              minHeight: 52,
              width: '100%',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: 'var(--accent)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Send size={16} /> Send Customer Summary
          </button>

          {/* Button 2 — Create/View Estimate */}
          <button
            onClick={hasExistingEstimate ? () => router.push(`/estimates/${projectId}`) : handleCreateEstimate}
            disabled={navigating}
            style={{
              minHeight: 48,
              width: '100%',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--surface)',
              border: '2px solid var(--accent)',
              cursor: navigating ? 'not-allowed' : 'pointer',
              opacity: navigating ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <FileText size={16} />
            {hasExistingEstimate ? 'View Estimate' : 'Create Estimate'}
            <ChevronRight size={16} />
          </button>

          {/* Button 3 — Back to Leads */}
          <button
            onClick={() => router.push('/leads')}
            style={{
              minHeight: 44,
              width: '100%',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Back to Leads
          </button>
        </div>
      </div>

      {/* Customer Summary Sheet */}
      <CustomerSummarySheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        draft={draft}
        projectName={project?.name || 'Project'}
        customerName={customerName}
        customerLastName={customerLastName}
        customerPhone={customer?.phone}
        customerEmail={customer?.email}
        scopeNotes={effectiveScopeNotes}
        confirmedAt={confirmedAt}
        onConfirm={handleConfirm}
        onNeedChange={handleNeedChange}
      />
    </div>
  );
}
