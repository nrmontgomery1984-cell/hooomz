'use client';

/**
 * Quote Detail — /sales/quotes/[id]
 *
 * Full quote view with:
 * - Header: customer, project, status, total
 * - Estimate breakdown grouped by trade (workCategoryCode / category)
 * - Delivery section: video link, expiry, cover notes
 * - Status timeline: Created → Sent → Viewed → Accepted/Declined
 * - Action buttons per status
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  ExternalLink,
  Hammer,
  AlertTriangle,
  Download,
  Percent,
  Link2,
  Mail,
  Rocket,
} from 'lucide-react';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { SalesChecklist } from '@/components/sales/SalesChecklist';
import { useToast } from '@/components/ui/Toast';
import { SECTION_COLORS } from '@/lib/viewmode';
import {
  useQuote,
  useSendQuote,
  useMarkQuoteViewed,
  useAcceptQuote,
  useDeclineQuote,
  useUpdateQuote,
} from '@/lib/hooks/useQuotes';
import { useCustomers } from '@/lib/hooks/useCustomersV2';
import { useLocalProject } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { ProjectStatus } from '@hooomz/shared-contracts';
import type { QuoteStatus, LineItem as ContractLineItem } from '@hooomz/shared-contracts';
import { useCreateInvoice } from '@/lib/hooks/useInvoices';
import dynamic from 'next/dynamic';
const DownloadContractPDF = dynamic(
  () => import('@/components/quotes/ContractPDF').then(mod => mod.DownloadContractPDF),
  { ssr: false }
);
const DownloadQuotePDF = dynamic(
  () => import('@/components/quotes/QuotePDF').then(mod => mod.DownloadQuotePDF),
  { ssr: false }
);
import { useCreateNotification } from '@/lib/hooks/useNotifications';
import { useApproveEstimateWithPipeline } from '@/lib/hooks/useApproveWithPipeline';

const COLOR = SECTION_COLORS.sales;

const STATUS_CONFIG: Record<QuoteStatus, { bg: string; text: string; label: string; icon: typeof FileText }> = {
  draft:    { bg: '#F3F4F6', text: '#6B7280', label: 'Draft',    icon: FileText },
  sent:     { bg: '#EFF6FF', text: '#3B82F6', label: 'Sent',     icon: Send },
  viewed:   { bg: '#FFF7ED', text: '#F59E0B', label: 'Viewed',   icon: Eye },
  accepted: { bg: '#ECFDF5', text: '#10B981', label: 'Accepted', icon: CheckCircle2 },
  declined: { bg: '#FEF2F2', text: '#EF4444', label: 'Declined', icon: XCircle },
  expired:  { bg: '#F3F4F6', text: '#9CA3AF', label: 'Expired',  icon: Clock },
};

// Trade/category labels for grouping
const CATEGORY_LABELS: Record<string, string> = {
  'site-work': 'Site Work', foundation: 'Foundation', framing: 'Framing',
  exterior: 'Exterior', roofing: 'Roofing', 'windows-doors': 'Windows & Doors',
  plumbing: 'Plumbing', electrical: 'Electrical', insulation: 'Insulation',
  drywall: 'Drywall', flooring: 'Flooring', painting: 'Painting',
  trim: 'Trim & Millwork', cabinets: 'Cabinets', countertops: 'Countertops',
  fixtures: 'Fixtures', appliances: 'Appliances', cleanup: 'Cleanup',
  general: 'General', overhead: 'Overhead', other: 'Other',
  FLOR: 'Flooring', TRIM: 'Trim', PAINT: 'Painting', DEMO: 'Demo',
  PLMB: 'Plumbing', ELEC: 'Electrical', TILE: 'Tile', CARP: 'Carpentry',
};

interface TradeGroup {
  key: string;
  label: string;
  items: LineItemLike[];
  laborTotal: number;
  materialTotal: number;
  total: number;
}

interface LineItemLike {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  isLabor: boolean;
  workCategoryCode?: string;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const { data: quote, isLoading: quoteLoading } = useQuote(quoteId);
  const { data: allCustomers = [] } = useCustomers();
  const { data: project } = useLocalProject(quote?.projectId);
  const { services } = useServicesContext();

  const sendQuote = useSendQuote();
  const markViewed = useMarkQuoteViewed();
  const acceptQuote = useAcceptQuote();
  const declineQuote = useDeclineQuote();
  const updateQuote = useUpdateQuote();
  const createInvoice = useCreateInvoice();
  const createNotification = useCreateNotification();
  const { showToast } = useToast();

  // Line items for the estimate breakdown
  const [lineItems, setLineItems] = useState<LineItemLike[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Decline modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Video link editor
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoLinkDraft, setVideoLinkDraft] = useState('');

  // Deposit percentage editor
  const [editingDeposit, setEditingDeposit] = useState(false);
  const [depositDraft, setDepositDraft] = useState(25);

  // Approve & Start Project
  const { approveAndGenerate } = useApproveEstimateWithPipeline();
  const [approving, setApproving] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{
    blueprintsCreated: number;
    tasksDeployed: number;
    missingSopCodes: string[];
    totalLineItems: number;
    pipelineEligible: number;
  } | null>(null);

  const customer = useMemo(() => {
    if (!quote) return null;
    return allCustomers.find((c) => c.id === quote.customerId) ?? null;
  }, [quote, allCustomers]);

  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`.trim()
    : 'Unknown Customer';

  // Load line items
  useEffect(() => {
    if (!quote?.projectId || !services) {
      setLoadingItems(false);
      return;
    }
    let cancelled = false;
    setLoadingItems(true);
    services.estimating.lineItems.findByProjectId(quote.projectId).then((items) => {
      if (!cancelled) {
        setLineItems(items as LineItemLike[]);
        setLoadingItems(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setLineItems([]);
        setLoadingItems(false);
      }
    });
    return () => { cancelled = true; };
  }, [quote?.projectId, services]);

  // Group by trade (workCategoryCode or category)
  const tradeGroups = useMemo((): TradeGroup[] => {
    const groupMap = new Map<string, LineItemLike[]>();
    for (const item of lineItems) {
      const key = item.workCategoryCode || item.category || 'other';
      const existing = groupMap.get(key) || [];
      existing.push(item);
      groupMap.set(key, existing);
    }

    const groups: TradeGroup[] = [];
    for (const [key, items] of groupMap) {
      const laborTotal = items.filter((i) => i.isLabor).reduce((s, i) => s + i.totalCost, 0);
      const materialTotal = items.filter((i) => !i.isLabor).reduce((s, i) => s + i.totalCost, 0);
      groups.push({
        key,
        label: CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
        items,
        laborTotal,
        materialTotal,
        total: laborTotal + materialTotal,
      });
    }

    groups.sort((a, b) => b.total - a.total);
    return groups;
  }, [lineItems]);

  const grandTotal = tradeGroups.reduce((s, g) => s + g.total, 0);
  const grandLabor = tradeGroups.reduce((s, g) => s + g.laborTotal, 0);
  const grandMaterial = tradeGroups.reduce((s, g) => s + g.materialTotal, 0);

  // Actions
  const handleSend = async () => {
    if (!quote) return;
    // Lock deposit % and set contractGeneratedAt on first send
    if (!quote.contractGeneratedAt) {
      await updateQuote.mutateAsync({
        id: quote.id,
        data: {
          contractGeneratedAt: new Date().toISOString(),
          depositPercentage: quote.depositPercentage ?? 25,
        },
      });
    }
    await sendQuote.mutateAsync(quote.id);
  };

  const handleMarkViewed = async () => {
    if (!quote) return;
    await markViewed.mutateAsync(quote.id);
  };

  const handleAccept = async () => {
    if (!quote) return;
    await acceptQuote.mutateAsync(quote.id);
    // Auto-create deposit invoice
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
      notes: `Deposit (${depPct}%) for quote`,
      subtotalOverride: depositAmount,
    });
    // Notify
    await createNotification.mutateAsync({
      type: 'quote_accepted',
      title: 'Quote Accepted',
      body: `${customerName} accepted the quote for $${quote.totalAmount.toLocaleString()}`,
      actionUrl: `/sales/quotes/${quote.id}`,
    });
  };

  const handleDecline = async () => {
    if (!quote) return;
    await declineQuote.mutateAsync({ id: quote.id, reason: declineReason.trim() });
    // Notify
    await createNotification.mutateAsync({
      type: 'quote_declined',
      title: 'Quote Declined',
      body: `${customerName} declined the quote${declineReason.trim() ? `: ${declineReason.trim()}` : ''}`,
      actionUrl: `/sales/quotes/${quote.id}`,
    });
    setShowDeclineModal(false);
    setDeclineReason('');
  };

  const handleSaveVideoLink = async () => {
    if (!quote) return;
    await updateQuote.mutateAsync({ id: quote.id, data: { videoLink: videoLinkDraft.trim() } });
    setEditingVideo(false);
  };

  const handleSaveDeposit = async () => {
    if (!quote) return;
    const clamped = Math.max(0, Math.min(100, depositDraft));
    await updateQuote.mutateAsync({ id: quote.id, data: { depositPercentage: clamped } });
    setEditingDeposit(false);
  };

  const portalUrl = typeof window !== 'undefined' && quote
    ? `${window.location.origin}/portal/${quote.projectId}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      showToast({ message: 'Portal link copied to clipboard', variant: 'success' });
    } catch {
      showToast({ message: 'Failed to copy link', variant: 'error' });
    }
  };

  const handleEmailLink = () => {
    if (!quote) return;
    const subject = encodeURIComponent('Your Quote from Hooomz Interiors');
    const body = encodeURIComponent(
      `Hi ${customerName},\n\nYour quote is ready to review. You can view and accept it here:\n\n${portalUrl}\n\nTotal: $${quote.totalAmount.toLocaleString()}\n\nLet us know if you have any questions.\n\n— Hooomz Interiors`
    );
    window.open(`mailto:${customer?.email || ''}?subject=${subject}&body=${body}`, '_self');
  };

  const handleApproveProject = async () => {
    if (!quote || !services || !project) return;
    setApproving(true);
    try {
      // If the project hasn't reached QUOTED yet, advance it first
      if (project.status !== ProjectStatus.QUOTED && project.status !== ProjectStatus.APPROVED) {
        await services.projects.update(quote.projectId, { status: ProjectStatus.QUOTED });
      }
      const result = await approveAndGenerate(quote.projectId, quote.projectId, {
        total_amount: quote.totalAmount,
      });
      setApprovalResult(result);
      showToast({
        message: result.tasksDeployed > 0
          ? `Project approved — ${result.tasksDeployed} tasks generated`
          : 'Project approved — no tasks generated (line items need SOP codes)',
        variant: result.tasksDeployed > 0 ? 'success' : 'info',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve project';
      showToast({ message: msg, variant: 'error' });
    } finally {
      setApproving(false);
    }
  };

  const isProjectApproved = project?.status === ProjectStatus.APPROVED
    || project?.status === ProjectStatus.IN_PROGRESS
    || project?.status === ProjectStatus.COMPLETE;

  if (quoteLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!quote) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>Quote not found</p>
        <Link href="/sales/quotes" style={{ fontSize: 12, color: COLOR }}>Back to Quotes</Link>
      </div>
    );
  }

  const badge = STATUS_CONFIG[quote.status];
  const BadgeIcon = badge.icon;

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            {/* Back nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => router.push('/sales/quotes')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
              >
                <ArrowLeft size={14} /> Quotes
              </button>
            </div>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                  Quote for {customerName}
                </h1>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {project?.name || quote.projectId}
                </p>
              </div>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 6,
                background: badge.bg, color: badge.text, flexShrink: 0,
              }}>
                <BadgeIcon size={12} /> {badge.label}
              </span>
            </div>

            {/* Total */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '-0.02em' }}>
                ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>CAD</span>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* ================================================================ */}
          {/* Action Buttons */}
          {/* ================================================================ */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quote.status === 'draft' && (
              <ActionButton label="Send Quote" icon={Send} color="#3B82F6" loading={sendQuote.isPending} onClick={handleSend} />
            )}
            {quote.status === 'sent' && (
              <ActionButton label="Mark Viewed" icon={Eye} color="#F59E0B" loading={markViewed.isPending} onClick={handleMarkViewed} />
            )}
            {(quote.status === 'sent' || quote.status === 'viewed') && (
              <>
                <ActionButton label="Accept" icon={CheckCircle2} color="#10B981" loading={acceptQuote.isPending} onClick={handleAccept} />
                <ActionButton label="Decline" icon={XCircle} color="#EF4444" loading={declineQuote.isPending} onClick={() => setShowDeclineModal(true)} />
              </>
            )}
          </div>

          {/* Approve & Start Project — shown after quote is accepted */}
          {quote.status === 'accepted' && !isProjectApproved && !approvalResult && (
            <div style={{
              marginTop: 12, padding: 16, borderRadius: 'var(--radius)',
              background: '#ECFDF5', border: '2px solid #10B981',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Rocket size={16} style={{ color: '#059669' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                  Quote Accepted — Ready to Start Project
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.5, marginBottom: 12 }}>
                This will advance the project to Approved and generate tasks from line items that have SOP codes assigned.
              </p>
              <button
                onClick={handleApproveProject}
                disabled={approving}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', minHeight: 44, borderRadius: 'var(--radius)',
                  fontSize: 13, fontWeight: 700,
                  background: approving ? '#9CA3AF' : '#059669',
                  color: '#FFFFFF', border: 'none',
                  cursor: approving ? 'not-allowed' : 'pointer',
                }}
              >
                <Rocket size={16} />
                {approving ? 'Approving & Generating Tasks...' : 'Approve & Start Project'}
              </button>
            </div>
          )}

          {/* Approval Result */}
          {approvalResult && (
            <div style={{
              marginTop: 12, padding: 16, borderRadius: 'var(--radius)',
              background: '#F0FDF4', border: '1px solid #BBF7D0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                  Project Approved
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#374151', marginBottom: 12 }}>
                <span><strong>{approvalResult.tasksDeployed}</strong> tasks created</span>
                <span><strong>{approvalResult.blueprintsCreated}</strong> blueprints</span>
                <span><strong>{approvalResult.pipelineEligible}</strong> of {approvalResult.totalLineItems} items eligible</span>
              </div>
              {approvalResult.missingSopCodes.length > 0 && (
                <p style={{ fontSize: 11, color: '#F59E0B', marginBottom: 8 }}>
                  {approvalResult.missingSopCodes.length} line items skipped (no SOP codes assigned)
                </p>
              )}
              <Link
                href={`/projects/${quote.projectId}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  width: '100%', minHeight: 40, borderRadius: 'var(--radius)',
                  fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  background: 'var(--surface-1)', color: COLOR,
                  border: `1px solid ${COLOR}`,
                }}
              >
                Go to Project <ExternalLink size={12} />
              </Link>
            </div>
          )}

          {/* Already approved — show link */}
          {quote.status === 'accepted' && isProjectApproved && !approvalResult && (
            <div style={{
              marginTop: 12, padding: 14, borderRadius: 'var(--radius)',
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>Project Started</span>
              </div>
              <Link
                href={`/projects/${quote.projectId}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600, color: COLOR, textDecoration: 'none',
                }}
              >
                View Project <ExternalLink size={12} />
              </Link>
            </div>
          )}

          {/* Decline Modal */}
          {showDeclineModal && (
            <div style={{
              marginTop: 8, padding: 14, borderRadius: 'var(--radius)',
              background: 'var(--surface-1)', border: '2px solid #EF444440',
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', marginBottom: 8 }}>Reason for Decline (optional)</p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Customer feedback or reason..."
                rows={2}
                style={{
                  width: '100%', minHeight: 48, padding: '8px 10px',
                  borderRadius: 'var(--radius)', fontSize: 12,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text)', outline: 'none', resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setShowDeclineModal(false)} style={{ flex: 1, minHeight: 32, borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600, background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleDecline} disabled={declineQuote.isPending} style={{ flex: 1, minHeight: 32, borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600, background: '#EF4444', color: '#FFFFFF', border: 'none', cursor: 'pointer', opacity: declineQuote.isPending ? 0.5 : 1 }}>
                  {declineQuote.isPending ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          )}

          {/* Download Quote PDF — available whenever there are line items */}
          {customer && project && lineItems.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <DownloadQuotePDF
                quote={quote}
                project={project}
                customer={customer}
                lineItems={lineItems as unknown as ContractLineItem[]}
              >
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    minHeight: 36, padding: '0 16px',
                    borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600,
                    color: '#0F766E', background: '#FFFFFF',
                    border: '2px solid #0F766E', cursor: 'pointer',
                  }}
                >
                  <Download size={14} /> Download Quote
                </button>
              </DownloadQuotePDF>
              {/* Download Contract — only after quote is sent */}
              {quote.contractGeneratedAt && (
                <DownloadContractPDF
                  quote={quote}
                  project={project}
                  customer={customer}
                  lineItems={lineItems as unknown as ContractLineItem[]}
                  depositPercentage={quote.depositPercentage ?? 25}
                >
                  <button
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      minHeight: 36, padding: '0 16px',
                      borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600,
                      color: 'var(--text-2)', background: 'var(--surface-1)',
                      border: '1px solid var(--border)', cursor: 'pointer',
                    }}
                  >
                    <Download size={14} /> Download Contract
                  </button>
                </DownloadContractPDF>
              )}
            </div>
          )}

          {/* Share — visible after quote is sent */}
          {quote.contractGeneratedAt && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopyLink}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  minHeight: 36, padding: '0 16px',
                  borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-2)', background: 'var(--surface-1)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                }}
              >
                <Link2 size={14} /> Copy Portal Link
              </button>
              <button
                onClick={handleEmailLink}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  minHeight: 36, padding: '0 16px',
                  borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-2)', background: 'var(--surface-1)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                }}
              >
                <Mail size={14} /> Email Quote
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* Pre-Quote Checklist */}
          {/* ================================================================ */}
          <div style={{
            marginTop: 20, padding: '12px 14px', borderRadius: 'var(--radius)',
            background: 'var(--surface-1)', border: '1px solid var(--border)',
          }}>
            <SalesChecklist
              entityType="quote"
              entityId={quote.id}
              completions={quote.checklistCompletions}
            />
          </div>

          {/* ================================================================ */}
          {/* Estimate Breakdown by Trade */}
          {/* ================================================================ */}
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-cond)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
              Estimate Breakdown
            </h2>

            {loadingItems && (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading line items...</p>
              </div>
            )}

            {!loadingItems && lineItems.length === 0 && (
              <div style={{
                padding: '20px 14px', borderRadius: 'var(--radius)',
                background: 'var(--surface-1)', border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <AlertTriangle size={20} style={{ color: '#F59E0B', margin: '0 auto 6px' }} />
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>No line items in this estimate</p>
                <Link href={`/estimates/${quote.projectId}`} style={{ fontSize: 11, color: COLOR, marginTop: 4, display: 'inline-block' }}>
                  Add line items in Estimate Editor
                </Link>
              </div>
            )}

            {!loadingItems && tradeGroups.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Grand totals card */}
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius)',
                  background: 'var(--surface-1)', border: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>
                    {lineItems.length} items across {tradeGroups.length} {tradeGroups.length === 1 ? 'trade' : 'trades'}
                  </span>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                    <span style={{ color: '#3B82F6' }}>Labor ${grandLabor.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <span style={{ color: '#10B981' }}>Material ${grandMaterial.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono, monospace)' }}>
                      ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Trade group cards */}
                {tradeGroups.map((group) => (
                  <TradeGroupCard key={group.key} group={group} />
                ))}
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* Delivery Section */}
          {/* ================================================================ */}
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-cond)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
              Delivery
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Video Link */}
              <div style={{
                padding: '12px 14px', borderRadius: 'var(--radius)',
                background: 'var(--surface-1)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                    <Video size={14} style={{ color: COLOR }} /> Video Walkthrough
                  </span>
                  {!editingVideo && (
                    <button
                      onClick={() => { setVideoLinkDraft(quote.videoLink); setEditingVideo(true); }}
                      style={{ fontSize: 10, color: COLOR, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {quote.videoLink ? 'Edit' : 'Add'}
                    </button>
                  )}
                </div>
                {editingVideo ? (
                  <div>
                    <input
                      type="url"
                      value={videoLinkDraft}
                      onChange={(e) => setVideoLinkDraft(e.target.value)}
                      placeholder="https://www.loom.com/share/..."
                      style={{
                        width: '100%', minHeight: 34, padding: '0 10px',
                        borderRadius: 'var(--radius)', fontSize: 12,
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        color: 'var(--text)', outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button onClick={() => setEditingVideo(false)} style={{ fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleSaveVideoLink} disabled={updateQuote.isPending} style={{ fontSize: 10, color: COLOR, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                        {updateQuote.isPending ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : quote.videoLink ? (
                  <a href={quote.videoLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLOR, textDecoration: 'none' }}>
                    {quote.videoLink.length > 50 ? quote.videoLink.slice(0, 47) + '...' : quote.videoLink} <ExternalLink size={10} />
                  </a>
                ) : (
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>No video link added yet</p>
                )}
              </div>

              {/* Deposit Percentage */}
              <div style={{
                padding: '12px 14px', borderRadius: 'var(--radius)',
                background: 'var(--surface-1)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                    <Percent size={14} style={{ color: COLOR }} /> Deposit
                  </span>
                  {quote.status === 'draft' && !editingDeposit && (
                    <button
                      onClick={() => { setDepositDraft(quote.depositPercentage ?? 25); setEditingDeposit(true); }}
                      style={{ fontSize: 10, color: COLOR, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingDeposit ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={depositDraft}
                        onChange={(e) => setDepositDraft(Number(e.target.value))}
                        style={{
                          width: 80, minHeight: 34, padding: '0 10px',
                          borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600,
                          background: 'var(--bg)', border: '1px solid var(--border)',
                          color: 'var(--text)', outline: 'none', textAlign: 'right',
                        }}
                      />
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>%</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
                        = ${(quote.totalAmount * (depositDraft / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button onClick={() => setEditingDeposit(false)} style={{ fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleSaveDeposit} disabled={updateQuote.isPending} style={{ fontSize: 10, color: COLOR, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                        {updateQuote.isPending ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {quote.depositPercentage ?? 25}%
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono, monospace)' }}>
                      ${(quote.totalAmount * ((quote.depositPercentage ?? 25) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {quote.status !== 'draft' && (
                      <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>locked</span>
                    )}
                  </div>
                )}
              </div>

              {/* Expiry */}
              <div style={{
                padding: '12px 14px', borderRadius: 'var(--radius)',
                background: 'var(--surface-1)', border: '1px solid var(--border)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                  <Clock size={14} style={{ color: COLOR }} /> Expiry
                </span>
                {quote.expiresAt ? (
                  <p style={{
                    fontSize: 13, fontWeight: 600, marginTop: 4,
                    color: new Date(quote.expiresAt) < new Date() ? '#EF4444' : 'var(--text)',
                  }}>
                    {new Date(quote.expiresAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    {new Date(quote.expiresAt) < new Date() && (
                      <span style={{ fontSize: 10, color: '#EF4444', marginLeft: 8, fontWeight: 700, textTransform: 'uppercase' }}>Expired</span>
                    )}
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>No expiry set</p>
                )}
              </div>

              {/* Cover Notes */}
              {quote.coverNotes && (
                <div style={{
                  padding: '12px 14px', borderRadius: 'var(--radius)',
                  background: 'var(--surface-1)', border: '1px solid var(--border)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                    <FileText size={14} style={{ color: COLOR }} /> Cover Notes
                  </span>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {quote.coverNotes}
                  </p>
                </div>
              )}

              {/* Decline reason */}
              {quote.status === 'declined' && quote.declineReason && (
                <div style={{
                  padding: '12px 14px', borderRadius: 'var(--radius)',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#EF4444', marginBottom: 6 }}>
                    <XCircle size={14} /> Decline Reason
                  </span>
                  <p style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.5 }}>
                    {quote.declineReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* Status Timeline */}
          {/* ================================================================ */}
          <div style={{ marginTop: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-cond)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
              Timeline
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 8 }}>
              <TimelineStep
                label="Created"
                date={quote.createdAt}
                color="#6B7280"
                isActive
                isLast={!quote.sentAt}
              />
              {quote.sentAt && (
                <TimelineStep
                  label="Sent"
                  date={quote.sentAt}
                  color="#3B82F6"
                  isActive
                  isLast={!quote.viewedAt && !quote.respondedAt}
                />
              )}
              {quote.viewedAt && (
                <TimelineStep
                  label="Viewed"
                  date={quote.viewedAt}
                  color="#F59E0B"
                  isActive
                  isLast={!quote.respondedAt}
                />
              )}
              {quote.respondedAt && (
                <TimelineStep
                  label={quote.status === 'accepted' ? 'Accepted' : 'Declined'}
                  date={quote.respondedAt}
                  color={quote.status === 'accepted' ? '#10B981' : '#EF4444'}
                  isActive
                  isLast
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ActionButton({
  label, icon: Icon, color, loading, onClick,
}: {
  label: string; icon: typeof Send; color: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        minHeight: 36, padding: '0 16px',
        borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600,
        background: color, color: '#FFFFFF', border: 'none',
        cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1,
      }}
    >
      <Icon size={14} /> {loading ? 'Processing...' : label}
    </button>
  );
}

function TradeGroupCard({ group }: { group: TradeGroup }) {
  const [expanded, setExpanded] = useState(false);
  const pct = group.total > 0 ? (group.laborTotal / group.total) * 100 : 0;

  return (
    <div style={{
      borderRadius: 'var(--radius)', background: 'var(--surface-1)',
      border: '1px solid var(--border)', overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hammer size={14} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {group.label}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
            {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono, monospace)' }}>
          ${group.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </button>

      {/* Labor/material split bar */}
      <div style={{ height: 3, display: 'flex', marginTop: -2 }}>
        <div style={{ width: `${pct}%`, background: '#3B82F6', borderRadius: '0 0 0 2px' }} />
        <div style={{ flex: 1, background: '#10B981', borderRadius: '0 0 2px 0' }} />
      </div>

      {/* Expanded: item list */}
      {expanded && (
        <div style={{ padding: '0 14px 10px', borderTop: '1px solid var(--border)' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr style={{ color: 'var(--text-3)', fontWeight: 600, textAlign: 'left' }}>
                <th style={{ padding: '4px 0' }}>Description</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Rate</th>
                <th style={{ padding: '4px 0', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 0', color: 'var(--text)' }}>
                    {item.description}
                    <span style={{
                      marginLeft: 6, fontSize: 9, fontWeight: 600,
                      color: item.isLabor ? '#3B82F6' : '#10B981',
                      textTransform: 'uppercase',
                    }}>
                      {item.isLabor ? 'L' : 'M'}
                    </span>
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                    {item.quantity} {item.unit}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-2)', fontFamily: 'var(--font-mono, monospace)' }}>
                    ${item.unitCost.toFixed(2)}
                  </td>
                  <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono, monospace)' }}>
                    ${item.totalCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-3)' }}>
            <span>Labor: ${group.laborTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>Material: ${group.materialTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineStep({
  label, date, color, isActive, isLast,
}: {
  label: string; date: string; color: string; isActive: boolean; isLast: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {/* Vertical line */}
      {!isLast && (
        <div style={{
          position: 'absolute', left: 5, top: 14, bottom: -2,
          width: 2, background: isActive ? color : 'var(--border)',
        }} />
      )}
      {/* Dot */}
      <div style={{
        width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
        background: isActive ? color : 'var(--border)',
        marginTop: 1,
      }} />
      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--text)' : 'var(--text-3)' }}>
          {label}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
          {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          {' '}
          {new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
