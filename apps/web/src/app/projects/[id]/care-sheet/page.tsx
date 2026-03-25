'use client';

/**
 * Home Care Sheet Page — /projects/[id]/care-sheet
 *
 * Full-page view of the care sheet deliverable. Shows project info,
 * per-trade care sections with materials and instructions, warranty info,
 * and a PDF download button.
 *
 * Logs a home_care_sheet.viewed activity event on first render.
 */

import { useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ArrowLeft, Download, Shield } from 'lucide-react';
import { useLocalProject } from '@/lib/hooks/useLocalData';
import { useHomeCareSheet } from '@/lib/hooks/useHomeCareSheet';
import { useServicesContext } from '@/lib/services/ServicesContext';
import dynamic from 'next/dynamic';
const DownloadCareSheetPDF = dynamic(
  () => import('@/components/care-sheet/HomeCareSheetPDF').then(mod => mod.DownloadCareSheetPDF),
  { ssr: false }
);
import type { CareTradeSection } from '@/lib/types/homeCareSheet.types';

// ============================================================================
// Helpers
// ============================================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ============================================================================
// Page
// ============================================================================

export default function CareSheetPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } = useLocalProject(projectId);
  const { services } = useServicesContext();
  const careSheet = useHomeCareSheet(projectId, project?.customerId);

  // Log activity event once on first meaningful render
  const hasLogged = useRef(false);
  useEffect(() => {
    if (careSheet && services && !hasLogged.current) {
      hasLogged.current = true;
      services.activity.create({
        event_type: 'home_care_sheet.viewed',
        project_id: projectId,
        entity_type: 'project',
        entity_id: projectId,
        summary: `Home Care Sheet viewed for ${careSheet.projectName}`,
      });
    }
  }, [careSheet, services, projectId]);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  if (projectLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading care sheet...</p>
        </div>
      </div>
    );
  }

  if (!careSheet || careSheet.tradeSections.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--mid)' }}>No care sheet data available</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>This project has no recognized trades or materials.</p>
          <button
            onClick={() => router.back()}
            style={{ marginTop: 16, fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Sticky Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => router.back()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                  Home Care Sheet
                </h1>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                  {careSheet.projectName}
                </p>
              </div>
              <DownloadCareSheetPDF data={careSheet}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.04em',
                    color: 'var(--mid)',
                    background: 'var(--surface-2)',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    padding: '5px 10px',
                  }}
                >
                  <Download size={12} /> PDF
                </button>
              </DownloadCareSheetPDF>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Project Summary Card */}
          <div style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoRow label="Homeowner" value={careSheet.customerName} />
              <InfoRow label="Address" value={careSheet.propertyAddress} />
              {careSheet.customerPhone && <InfoRow label="Phone" value={careSheet.customerPhone} />}
              {careSheet.customerEmail && <InfoRow label="Email" value={careSheet.customerEmail} />}
              <InfoRow label="Completed" value={formatDate(careSheet.completionDate)} />
              <InfoRow label="Warranty Until" value={formatDate(careSheet.warrantyExpiryDate)} highlight />
            </div>
          </div>

          {/* Trade Sections */}
          {careSheet.tradeSections.map((section) => (
            <TradeSectionCard key={section.tradeCode} section={section} />
          ))}

          {/* General Warranty Section */}
          <div style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 'var(--radius)',
            background: 'var(--green-bg)',
            border: '1px solid var(--green-bg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Shield size={14} style={{ color: 'var(--green)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--green)' }}>
                Labour Warranty
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li style={{ fontSize: 11, color: 'var(--mid)' }}>
                All labour is warranted for <strong>1 year</strong> from project completion ({formatDate(careSheet.completionDate)} — {formatDate(careSheet.warrantyExpiryDate)}).
              </li>
              <li style={{ fontSize: 11, color: 'var(--mid)' }}>
                Warranty covers defects in workmanship only — not normal wear, misuse, or acts of nature.
              </li>
              <li style={{ fontSize: 11, color: 'var(--mid)' }}>
                To file a claim, contact {careSheet.businessName} at {careSheet.businessPhone} or {careSheet.businessEmail}.
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 24, textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--mid)' }}>
              {careSheet.businessName}
            </p>
            <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
              Thank you for choosing us for your home
            </p>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        display: 'block',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 11,
        color: highlight ? 'var(--green)' : 'var(--charcoal)',
        fontWeight: highlight ? 700 : 400,
        display: 'block',
        marginTop: 1,
      }}>
        {value || '—'}
      </span>
    </div>
  );
}

function TradeSectionCard({ section }: { section: CareTradeSection }) {
  return (
    <div style={{
      marginTop: 12,
      borderRadius: 'var(--radius)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {/* Trade Header */}
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.02em',
          color: 'var(--charcoal)',
        }}>
          {section.tradeName}
        </span>
        {section.locationsWorked.length > 0 && (
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>
            — {section.locationsWorked.join(', ')}
          </span>
        )}
      </div>

      <div style={{ padding: 14 }}>
        {/* Materials */}
        {section.materialsInstalled.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              display: 'block',
              marginBottom: 4,
            }}>
              Materials Installed
            </span>
            {section.materialsInstalled.map((mat, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                padding: '2px 0',
                borderBottom: i < section.materialsInstalled.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 11, color: 'var(--charcoal)', flex: 1 }}>{mat.description}</span>
                {mat.location && (
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>{mat.location}</span>
                )}
                {mat.quantity != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mid)' }}>
                    {mat.quantity} {mat.unit || ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Care Instructions */}
        <div style={{ marginBottom: 10 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            display: 'block',
            marginBottom: 4,
          }}>
            Care Instructions
          </span>
          <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {section.careInstructions.map((item, i) => (
              <li key={i} style={{ fontSize: 11, color: 'var(--mid)' }}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Things to Avoid */}
        {section.thingsToAvoid.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--red)',
              display: 'block',
              marginBottom: 4,
            }}>
              Things to Avoid
            </span>
            <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.thingsToAvoid.map((item, i) => (
                <li key={i} style={{ fontSize: 11, color: 'var(--mid)' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warranty Note */}
        <p style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--muted)', margin: 0 }}>
          {section.warrantyNotes}
        </p>
      </div>
    </div>
  );
}
