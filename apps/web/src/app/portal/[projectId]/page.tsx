'use client';

/**
 * Client Portal — Homeowner-facing project view
 *
 * Read-only, calm, professional. No budget data. No internal events.
 * Accessed at /portal/[projectId]. No auth required (MVP).
 */

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  Lock,
  CheckCircle2,
  ArrowRight,
  Calendar,
  FileCheck,
  Camera,
  User,
  MessageCircle,
  X,
  Check,
  ArrowLeft,
  Video,
  ExternalLink,
  XCircle,
  Clock,
} from 'lucide-react';
import { groupEventsByDayArray } from '@hooomz/shared';
import { useQuery } from '@tanstack/react-query';
import { usePortalData } from '@/lib/hooks/usePortalData';
import { useQuotesByProject, useAcceptQuote, useDeclineQuote } from '@/lib/hooks/useQuotes';
import { useCreateInvoice } from '@/lib/hooks/useInvoices';
import { useCustomers } from '@/lib/hooks/useCustomersV2';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useViewMode } from '@/lib/viewmode';
import { DownloadQuotePDF } from '@/components/quotes/QuotePDF';
import { useCreateNotification } from '@/lib/hooks/useNotifications';
import type { PortalUpdate, TradeProgressItem, PortalTeamMember } from '@/lib/hooks/usePortalData';
import type { Photo, QuoteRecord, CustomerRecord, LineItem } from '@hooomz/shared-contracts';
import { ProductionScoreWidget } from '@/components/portal/ProductionScoreWidget';

// ============================================================================
// Page
// ============================================================================

export default function PortalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const portal = usePortalData(projectId);
  const { data: projectQuotes = [] } = useQuotesByProject(projectId);
  const { services, isLoading: servicesLoading } = useServicesContext();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const { viewMode, setViewMode } = useViewMode();

  // Find the active quote (most recent sent or viewed; also show accepted/declined)
  const activeQuote = useMemo(() => {
    const actionable = projectQuotes.filter(
      (q: QuoteRecord) => q.status === 'sent' || q.status === 'viewed',
    );
    if (actionable.length > 0) return actionable[actionable.length - 1];
    // If no actionable, show the most recent accepted/declined
    const resolved = projectQuotes.filter(
      (q: QuoteRecord) => q.status === 'accepted' || q.status === 'declined',
    );
    if (resolved.length > 0) return resolved[resolved.length - 1];
    return null;
  }, [projectQuotes]);

  // Customer + line items for quote PDF download
  const { data: allCustomers = [] } = useCustomers();
  const quoteCustomer = useMemo(() => {
    if (!activeQuote) return null;
    return allCustomers.find((c) => c.id === activeQuote.customerId) ?? null;
  }, [activeQuote, allCustomers]);
  const { data: quoteLineItems = [] } = useQuery({
    queryKey: ['portal', 'lineItems', projectId],
    queryFn: async () => {
      if (!services) return [];
      return services.estimating.lineItems.findByProjectId(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId && !!activeQuote,
    staleTime: 30_000,
  });

  const exitHomeownerView = () => {
    setViewMode('manager');
    router.push('/');
  };

  if (portal.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div className="text-center">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
          />
          <p className="text-base" style={{ color: '#6B7280' }}>Loading your project...</p>
        </div>
      </div>
    );
  }

  if (!portal.project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div className="text-center px-6">
          <p className="text-lg font-medium mb-2" style={{ color: '#1F2937' }}>Project not found</p>
          <p className="text-base" style={{ color: '#6B7280' }}>
            This link may have expired or the project may have been removed.
          </p>
          {viewMode === 'homeowner' && (
            <button
              onClick={exitHomeownerView}
              className="mt-4 inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg text-sm font-medium text-white"
              style={{ background: '#0F766E' }}
            >
              <ArrowLeft size={16} />
              Back to Manager View
            </button>
          )}
        </div>
      </div>
    );
  }

  const statusColor = portal.projectStatus === 'complete'
    ? '#10B981'
    : portal.projectStatus === 'needs-attention'
    ? '#F59E0B'
    : '#10B981';

  return (
    <PageErrorBoundary>
    <div className="min-h-screen pb-8" style={{ background: '#FAFAFA' }}>
      {/* ================================================================
          Header
          ================================================================ */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-md mx-auto px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold" style={{ color: '#1F2937' }}>Hooomz</span>
            <div className="flex items-center gap-1.5">
              <Lock size={14} style={{ color: '#9CA3AF' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>Secure</span>
            </div>
          </div>
          <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
            {portal.project.address.street}
            {portal.project.address.unit ? `, ${portal.project.address.unit}` : ''}
          </p>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#1F2937' }}>
            {portal.project.name}
          </h1>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: statusColor }}
            />
            <span className="text-sm font-medium" style={{ color: statusColor }}>
              {portal.statusLabel}
            </span>
            <span className="text-sm" style={{ color: '#9CA3AF' }}>
              &middot; Est. completion {portal.estimatedCompletion}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5">
        {/* ================================================================
            Production Score Widget — above the fold
            ================================================================ */}
        <div className="mt-5">
          <ProductionScoreWidget projectId={projectId} />
        </div>

        {/* ================================================================
            Section 1: Overall Progress
            ================================================================ */}
        <div className="mt-5">
          <PortalCard>
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
              Project Progress
            </h2>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-3 rounded-full" style={{ background: '#E5E7EB' }}>
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${portal.progressPercent}%`,
                    background: '#10B981',
                    minWidth: portal.progressPercent > 0 ? '12px' : '0',
                  }}
                />
              </div>
              <span className="text-lg font-bold" style={{ color: '#1F2937' }}>
                {portal.progressPercent}%
              </span>
            </div>
            <p className="text-base" style={{ color: '#6B7280' }}>
              {portal.completedTasks} of {portal.totalTasks} tasks complete
            </p>
          </PortalCard>
        </div>

        {/* ================================================================
            Section 2: Progress by Trade
            ================================================================ */}
        {portal.tradeProgress.length > 0 && (
          <div className="mt-5">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
              Work Progress
            </h2>
            <PortalCard>
              <div className="space-y-4">
                {portal.tradeProgress.map((trade) => (
                  <TradeProgressRow key={trade.tradeCode} trade={trade} />
                ))}
              </div>
            </PortalCard>
          </div>
        )}

        {/* ================================================================
            Section 2.5: Your Quote
            ================================================================ */}
        {activeQuote && (
          <QuoteSection
            quote={activeQuote}
            project={portal.project}
            customer={quoteCustomer ?? null}
            lineItems={quoteLineItems as LineItem[]}
            onAccept={() => setShowAcceptModal(true)}
            onDecline={() => setShowDeclineModal(true)}
            onAskQuestion={() => setShowMessageModal(true)}
          />
        )}

        {/* ================================================================
            Section 3: Recent Updates
            ================================================================ */}
        <div className="mt-5">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
            Recent Updates
          </h2>
          <PortalCard>
            {portal.recentUpdates.length === 0 ? (
              <p className="text-base py-2" style={{ color: '#9CA3AF' }}>
                Updates will appear here as work begins on your project.
              </p>
            ) : (
              <UpdateFeed updates={portal.recentUpdates} />
            )}
          </PortalCard>
        </div>

        {/* ================================================================
            Section 4: Photos
            ================================================================ */}
        <div className="mt-5">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
            Project Photos
          </h2>
          <PortalCard>
            {portal.photos.length === 0 ? (
              <div className="text-center py-4">
                <Camera size={32} style={{ color: '#D1D5DB' }} className="mx-auto mb-2" />
                <p className="text-base" style={{ color: '#9CA3AF' }}>
                  Photos will appear here as work progresses.
                </p>
              </div>
            ) : (
              <PhotoGallery photos={portal.photos} onSelect={setSelectedPhoto} />
            )}
          </PortalCard>
        </div>

        {/* ================================================================
            Section 5: Your Team
            ================================================================ */}
        <div className="mt-5">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
            Your Team
          </h2>
          <PortalCard>
            {portal.team.length === 0 ? (
              <p className="text-base py-2" style={{ color: '#9CA3AF' }}>
                Your project team will be shown here.
              </p>
            ) : (
              <div className="space-y-3">
                {portal.team.map((member) => (
                  <TeamMemberRow key={member.id} member={member} />
                ))}
              </div>
            )}
            <button
              onClick={() => setShowMessageModal(true)}
              className="w-full mt-4 min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-base font-medium transition-colors"
              style={{ background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1' }}
            >
              <MessageCircle size={18} />
              Message Your Team
            </button>
          </PortalCard>
        </div>

        {/* Exit Homeowner View (dev toggle) */}
        {viewMode === 'homeowner' && (
          <div className="mt-6">
            <button
              onClick={exitHomeownerView}
              className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors border"
              style={{ color: '#6B7280', borderColor: '#E5E7EB', background: '#FFFFFF' }}
            >
              <ArrowLeft size={16} />
              Exit Homeowner View
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: '#D1D5DB' }}>
            Powered by Hooomz
          </p>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}

      {/* Ask a Question Modal */}
      {showMessageModal && (
        <AskQuestionModal
          projectId={projectId}
          customerName={quoteCustomer ? `${quoteCustomer.firstName} ${quoteCustomer.lastName}` : 'Customer'}
          onClose={() => setShowMessageModal(false)}
        />
      )}

      {/* Accept Quote Modal */}
      {showAcceptModal && activeQuote && (
        <AcceptQuoteModal
          quote={activeQuote}
          customerName={quoteCustomer ? `${quoteCustomer.firstName} ${quoteCustomer.lastName}` : 'Customer'}
          onClose={() => setShowAcceptModal(false)}
        />
      )}

      {/* Decline Quote Modal */}
      {showDeclineModal && activeQuote && (
        <DeclineQuoteModal
          quote={activeQuote}
          customerName={quoteCustomer ? `${quoteCustomer.firstName} ${quoteCustomer.lastName}` : 'Customer'}
          onClose={() => setShowDeclineModal(false)}
        />
      )}
    </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/** Shared card wrapper for portal sections */
function PortalCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        border: '1px solid #F3F4F6',
      }}
    >
      {children}
    </div>
  );
}

/** Trade progress row with bar and label */
function TradeProgressRow({ trade }: { trade: TradeProgressItem }) {
  const percent = trade.totalTasks > 0
    ? Math.round((trade.completedTasks / trade.totalTasks) * 100)
    : 0;
  const isComplete = percent === 100;
  const isNotStarted = percent === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-base font-medium" style={{ color: '#1F2937' }}>
          {trade.tradeName}
        </span>
        <span className="text-sm" style={{ color: isComplete ? '#10B981' : '#6B7280' }}>
          {isComplete ? (
            <span className="flex items-center gap-1">
              Complete <Check size={14} style={{ color: '#10B981' }} />
            </span>
          ) : isNotStarted ? (
            'Not started'
          ) : trade.iterationLabel ? (
            trade.iterationLabel
          ) : (
            `${trade.completedTasks}/${trade.totalTasks}`
          )}
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ background: '#E5E7EB' }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: '#10B981',
            minWidth: percent > 0 ? '8px' : '0',
          }}
        />
      </div>
    </div>
  );
}

/** Update feed grouped by day */
function UpdateFeed({ updates }: { updates: PortalUpdate[] }) {
  // Group by day using timestamps
  const eventsForGrouping = updates.map((u) => ({
    ...u,
    id: u.id,
    timestamp: u.timestamp,
  }));
  const grouped = groupEventsByDayArray(eventsForGrouping as any);

  return (
    <div className="space-y-4">
      {grouped.map(([dayLabel, dayUpdates]) => (
        <div key={dayLabel}>
          <p className="text-sm font-medium mb-2" style={{ color: '#9CA3AF' }}>
            {dayLabel}
          </p>
          <div className="space-y-2">
            {(dayUpdates as unknown as PortalUpdate[]).map((update) => (
              <UpdateRow key={update.id} update={update} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Single update row */
function UpdateRow({ update }: { update: PortalUpdate }) {
  const iconMap: Record<PortalUpdate['type'], React.ReactNode> = {
    completed: <CheckCircle2 size={16} style={{ color: '#10B981' }} />,
    started: <ArrowRight size={16} style={{ color: '#3B82F6' }} />,
    deployed: <Calendar size={16} style={{ color: '#6B7280' }} />,
    approved: <FileCheck size={16} style={{ color: '#10B981' }} />,
    photo: <Camera size={16} style={{ color: '#6B7280' }} />,
    other: <ArrowRight size={16} style={{ color: '#6B7280' }} />,
  };

  return (
    <div className="flex items-start gap-3 py-1">
      <div className="mt-0.5 flex-shrink-0">{iconMap[update.type]}</div>
      <p className="text-base" style={{ color: '#1F2937' }}>{update.summary}</p>
    </div>
  );
}

/** Photo gallery with horizontal scroll */
function PhotoGallery({ photos, onSelect }: {
  photos: Photo[];
  onSelect: (photo: Photo) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <div className="flex gap-2 px-1">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => onSelect(photo)}
            className="flex-shrink-0 rounded-xl overflow-hidden min-h-[48px]"
            style={{ width: 120, height: 90, background: '#F3F4F6', border: '1px solid #E5E7EB' }}
          >
            {photo.thumbnailPath || photo.filePath ? (
              <img
                src={photo.thumbnailPath || photo.filePath}
                alt={photo.caption || 'Project photo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={24} style={{ color: '#D1D5DB' }} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Team member row */
function TeamMemberRow({ member }: { member: PortalTeamMember }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: '#F3F4F6' }}
      >
        <User size={20} style={{ color: '#9CA3AF' }} />
      </div>
      <div>
        <p className="text-base font-medium" style={{ color: '#1F2937' }}>
          {member.displayName}
        </p>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          {member.displayRole}
        </p>
      </div>
    </div>
  );
}

/** Full-screen photo lightbox */
function PhotoLightbox({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X size={24} color="#FFFFFF" />
      </button>
      <div className="max-w-full max-h-full p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.filePath}
          alt={photo.caption || 'Project photo'}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        {photo.caption && (
          <p className="text-center mt-3 text-base text-white">{photo.caption}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Quote Sub-components
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatQuoteDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Quote section shown to homeowner */
function QuoteSection({ quote, project, customer, lineItems, onAccept, onDecline, onAskQuestion }: {
  quote: QuoteRecord;
  project: { name: string; address?: { street?: string; city?: string; province?: string; postalCode?: string }; dates?: { startDate?: string; estimatedEndDate?: string } } | null;
  customer: CustomerRecord | null;
  lineItems: LineItem[];
  onAccept: () => void;
  onDecline: () => void;
  onAskQuestion: () => void;
}) {
  const isActionable = quote.status === 'sent' || quote.status === 'viewed';
  const isAccepted = quote.status === 'accepted';
  const isDeclined = quote.status === 'declined';
  const depositPct = quote.depositPercentage ?? 25;
  const depositAmount = Math.round(quote.totalAmount * (depositPct / 100));
  const isExpired = quote.expiresAt ? new Date(quote.expiresAt) < new Date() : false;

  return (
    <div className="mt-5">
      <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
        Your Quote
      </h2>
      <PortalCard>
        {/* Accepted State */}
        {isAccepted && (
          <div className="text-center py-3">
            <CheckCircle2 size={32} style={{ color: '#10B981' }} className="mx-auto mb-2" />
            <p className="text-lg font-bold" style={{ color: '#10B981' }}>Quote Accepted</p>
            <p className="text-base mt-1" style={{ color: '#6B7280' }}>
              Thank you! Your project is confirmed at {formatCurrency(quote.totalAmount)}.
            </p>
            {quote.respondedAt && (
              <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                Accepted on {formatQuoteDate(quote.respondedAt)}
              </p>
            )}
            {customer && project && (
              <div className="mt-4">
                <DownloadQuotePDF
                  quote={quote}
                  project={project}
                  customer={customer}
                  lineItems={lineItems}
                >
                  <button
                    className="min-h-[40px] px-5 inline-flex items-center gap-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ color: '#0F766E', background: '#F0FDFA', border: '1px solid #CCFBF1' }}
                  >
                    Download Quote PDF
                  </button>
                </DownloadQuotePDF>
              </div>
            )}
          </div>
        )}

        {/* Declined State */}
        {isDeclined && (
          <div className="text-center py-3">
            <XCircle size={32} style={{ color: '#9CA3AF' }} className="mx-auto mb-2" />
            <p className="text-lg font-bold" style={{ color: '#6B7280' }}>Quote Declined</p>
            <p className="text-base mt-1" style={{ color: '#9CA3AF' }}>
              This quote has been declined. Contact us if you&apos;d like to discuss further.
            </p>
          </div>
        )}

        {/* Active (sent/viewed) State */}
        {isActionable && (
          <>
            {/* Total */}
            <div className="text-center mb-4">
              <p className="text-sm mb-1" style={{ color: '#6B7280' }}>Project Total</p>
              <p className="text-3xl font-bold" style={{ color: '#1F2937' }}>
                {formatCurrency(quote.totalAmount)}
              </p>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>CAD + applicable taxes</p>
            </div>

            {/* Payment Schedule */}
            <div className="rounded-xl p-4 mb-4" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
              <p className="text-sm font-medium mb-3" style={{ color: '#6B7280' }}>Payment Schedule</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-base" style={{ color: '#1F2937' }}>Deposit ({depositPct}%)</span>
                  <span className="text-base font-medium" style={{ color: '#1F2937' }}>{formatCurrency(depositAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base" style={{ color: '#1F2937' }}>Progress (40%)</span>
                  <span className="text-base font-medium" style={{ color: '#1F2937' }}>{formatCurrency(Math.round(quote.totalAmount * 0.4))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base" style={{ color: '#1F2937' }}>Final</span>
                  <span className="text-base font-medium" style={{ color: '#1F2937' }}>
                    {formatCurrency(quote.totalAmount - depositAmount - Math.round(quote.totalAmount * 0.4))}
                  </span>
                </div>
              </div>
            </div>

            {/* Video Walkthrough */}
            {quote.videoLink && (
              <a
                href={quote.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl p-4 mb-4 transition-colors"
                style={{ background: '#F0FDFA', border: '1px solid #CCFBF1', textDecoration: 'none' }}
              >
                <Video size={20} style={{ color: '#0F766E' }} />
                <span className="text-base font-medium" style={{ color: '#0F766E' }}>Watch Video Walkthrough</span>
                <ExternalLink size={14} style={{ color: '#0F766E', marginLeft: 'auto' }} />
              </a>
            )}

            {/* Cover Notes */}
            {quote.coverNotes && (
              <div className="rounded-xl p-4 mb-4" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#6B7280' }}>Note from your project team</p>
                <p className="text-base" style={{ color: '#1F2937', whiteSpace: 'pre-wrap' }}>{quote.coverNotes}</p>
              </div>
            )}

            {/* Expiry */}
            {quote.expiresAt && (
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} style={{ color: isExpired ? '#EF4444' : '#9CA3AF' }} />
                <span className="text-sm" style={{ color: isExpired ? '#EF4444' : '#9CA3AF' }}>
                  {isExpired ? 'This quote has expired' : `Valid until ${formatQuoteDate(quote.expiresAt)}`}
                </span>
              </div>
            )}

            {/* Download Quote PDF */}
            {customer && project && (
              <div className="mb-4">
                <DownloadQuotePDF
                  quote={quote}
                  project={project}
                  customer={customer}
                  lineItems={lineItems}
                >
                  <button
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-base font-medium transition-colors"
                    style={{ color: '#0F766E', background: '#F0FDFA', border: '1px solid #CCFBF1' }}
                  >
                    Download Quote PDF
                  </button>
                </DownloadQuotePDF>
              </div>
            )}

            {/* Action Buttons */}
            {!isExpired && (
              <div className="space-y-3 mt-4">
                <button
                  onClick={onAccept}
                  className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-xl text-lg font-semibold text-white transition-colors"
                  style={{ background: '#0F766E' }}
                >
                  <CheckCircle2 size={20} />
                  Accept Quote
                </button>
                <button
                  onClick={onDecline}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-base font-medium transition-colors"
                  style={{ color: '#6B7280', background: '#FFFFFF', border: '1px solid #E5E7EB' }}
                >
                  Decline
                </button>
                <button
                  onClick={onAskQuestion}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: '#0F766E', background: 'transparent', border: 'none' }}
                >
                  <MessageCircle size={16} />
                  Have a question? Ask your team
                </button>
              </div>
            )}
          </>
        )}
      </PortalCard>
    </div>
  );
}

/** Accept quote modal with typed-name e-signature */
function AcceptQuoteModal({ quote, customerName, onClose }: { quote: QuoteRecord; customerName: string; onClose: () => void }) {
  const [typedName, setTypedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const acceptQuote = useAcceptQuote();
  const createInvoice = useCreateInvoice();
  const createNotification = useCreateNotification();
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = typedName.trim().length >= 2 && agreed && !submitting;

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await acceptQuote.mutateAsync(quote.id);
      // Auto-create deposit invoice (mirrors manager page logic)
      const depPct = quote.depositPercentage ?? 25;
      const depositAmount = Math.round(quote.totalAmount * (depPct / 100) * 100) / 100;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      await createInvoice.mutateAsync({
        projectId: quote.projectId,
        customerId: quote.customerId,
        invoiceType: 'deposit',
        dueDate: dueDate.toISOString().slice(0, 10),
        quoteId: quote.id,
        notes: `Deposit (${depPct}%) for quote — signed by ${typedName.trim()}`,
        subtotalOverride: depositAmount,
      });
      // Notify manager
      await createNotification.mutateAsync({
        type: 'quote_accepted',
        title: 'Quote Accepted',
        body: `${customerName} accepted the quote for $${quote.totalAmount.toLocaleString()}`,
        actionUrl: `/sales/quotes/${quote.id}`,
      });
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-6"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md"
        style={{ background: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#1F2937' }}>
            Accept Quote
          </h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        <p className="text-base mb-1" style={{ color: '#1F2937' }}>
          Total: <strong>{formatCurrency(quote.totalAmount)}</strong>
        </p>
        <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
          By typing your name below, you agree to the scope of work and payment terms outlined in this quote.
        </p>

        {/* Typed Name */}
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          Your Full Name
        </label>
        <input
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder="Type your full name"
          className="w-full min-h-[48px] px-4 rounded-xl text-base mb-4"
          style={{
            background: '#F9FAFB', border: '1px solid #E5E7EB',
            color: '#1F2937', outline: 'none',
          }}
        />

        {/* Agreement Checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 min-w-[20px] min-h-[20px]"
            style={{ accentColor: '#0F766E' }}
          />
          <span className="text-sm" style={{ color: '#374151' }}>
            I agree to the terms of this contract and authorize Hooomz Interiors to proceed with the work described.
          </span>
        </label>

        {/* Submit */}
        <button
          onClick={handleAccept}
          disabled={!canSubmit}
          className="w-full min-h-[52px] rounded-xl text-lg font-semibold text-white transition-colors"
          style={{
            background: canSubmit ? '#0F766E' : '#D1D5DB',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Processing...' : 'Confirm & Accept'}
        </button>
      </div>
    </div>
  );
}

/** Decline quote modal with optional reason */
function DeclineQuoteModal({ quote, customerName, onClose }: { quote: QuoteRecord; customerName: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const declineQuote = useDeclineQuote();
  const createNotification = useCreateNotification();
  const [submitting, setSubmitting] = useState(false);

  const handleDecline = async () => {
    setSubmitting(true);
    try {
      await declineQuote.mutateAsync({ id: quote.id, reason: reason.trim() });
      // Notify manager
      await createNotification.mutateAsync({
        type: 'quote_declined',
        title: 'Quote Declined',
        body: `${customerName} declined the quote${reason.trim() ? `: ${reason.trim()}` : ''}`,
        actionUrl: `/sales/quotes/${quote.id}`,
      });
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-6"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md"
        style={{ background: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#1F2937' }}>
            Decline Quote
          </h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        <p className="text-base mb-4" style={{ color: '#6B7280' }}>
          We&apos;re sorry to hear that. If you have any feedback, please share it below — it helps us improve.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-base mb-5"
          style={{
            background: '#F9FAFB', border: '1px solid #E5E7EB',
            color: '#1F2937', outline: 'none', resize: 'vertical', minHeight: 80,
          }}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl text-base font-medium"
            style={{ color: '#6B7280', background: '#FFFFFF', border: '1px solid #E5E7EB' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDecline}
            disabled={submitting}
            className="flex-1 min-h-[48px] rounded-xl text-base font-medium text-white"
            style={{ background: submitting ? '#D1D5DB' : '#EF4444', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Declining...' : 'Decline Quote'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ask a Question modal — functional replacement for MessageModal placeholder */
function AskQuestionModal({ projectId, customerName, onClose }: { projectId: string; customerName: string; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { services } = useServicesContext();
  const createNotification = useCreateNotification();

  const canSubmit = question.trim().length >= 5 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !services) return;
    setSubmitting(true);
    try {
      // Log as activity event (client.request is already homeowner_visible)
      await services.activity.create({
        event_type: 'client.request',
        project_id: projectId,
        entity_type: 'project',
        entity_id: projectId,
        summary: `Customer question: ${question.trim()}`,
        actor_type: 'customer',
        actor_name: customerName,
        homeowner_visible: true,
        event_data: { question: question.trim() },
      });
      // Notify manager
      await createNotification.mutateAsync({
        type: 'portal_question',
        title: 'Customer Question',
        body: `${customerName}: ${question.trim().slice(0, 100)}`,
        actionUrl: `/projects/${projectId}`,
      });
      setSent(true);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-6"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md"
        style={{ background: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          /* Success state */
          <div className="text-center py-4">
            <CheckCircle2 size={32} style={{ color: '#10B981' }} className="mx-auto mb-3" />
            <p className="text-lg font-semibold mb-1" style={{ color: '#1F2937' }}>Question Sent</p>
            <p className="text-base mb-5" style={{ color: '#6B7280' }}>
              Your project team will get back to you shortly.
            </p>
            <button
              onClick={onClose}
              className="w-full min-h-[48px] rounded-xl text-base font-medium text-white"
              style={{ background: '#0F766E' }}
            >
              Done
            </button>
          </div>
        ) : (
          /* Question form */
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#1F2937' }}>
                Ask a Question
              </h3>
              <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={20} style={{ color: '#9CA3AF' }} />
              </button>
            </div>

            <p className="text-base mb-4" style={{ color: '#6B7280' }}>
              Have a question about your project or quote? Send it here and your team will respond.
            </p>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-base mb-5"
              style={{
                background: '#F9FAFB', border: '1px solid #E5E7EB',
                color: '#1F2937', outline: 'none', resize: 'vertical', minHeight: 100,
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full min-h-[52px] rounded-xl text-lg font-semibold text-white transition-colors"
              style={{
                background: canSubmit ? '#0F766E' : '#D1D5DB',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? 'Sending...' : 'Send Question'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
