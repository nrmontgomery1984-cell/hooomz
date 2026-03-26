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
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
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
import {
  BrandHeader,
  StatusProgressBar,
  TradeSection,
  SummaryPanel,
} from '@/components/estimates/detail';
import type { TradeSectionLineItem } from '@/components/estimates/detail';
import {
  PartiesCards,
  SourceLink,
  PaymentTerms,
  GeneralTerms,
  AcceptanceBlock,
} from '@/components/quotes/detail';

const COLOR = SECTION_COLORS.sales;

const STATUS_CONFIG: Record<QuoteStatus, { bg: string; text: string; label: string; icon: typeof FileText }> = {
  draft:    { bg: 'var(--surface-2)', text: 'var(--muted)', label: 'Draft',    icon: FileText },
  sent:     { bg: 'var(--blue-bg)', text: 'var(--blue)', label: 'Sent',     icon: Send },
  viewed:   { bg: 'var(--yellow-bg)', text: 'var(--yellow)', label: 'Viewed',   icon: Eye },
  accepted: { bg: 'var(--green-bg)', text: 'var(--green)', label: 'Accepted', icon: CheckCircle2 },
  declined: { bg: 'var(--red-bg)', text: 'var(--red)', label: 'Declined', icon: XCircle },
  expired:  { bg: 'var(--surface-2)', text: 'var(--muted)', label: 'Expired',  icon: Clock },
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
  source?: string;
  source_id?: string | null;
}

type SourceGroupKey = 'material_selection' | 'labour_estimation' | 'manual';

interface SourceGroup {
  key: SourceGroupKey;
  label: string;
  items: LineItemLike[];
  tradeGroups: TradeGroup[];
  total: number;
}

const SOURCE_LABELS: Record<SourceGroupKey, string> = {
  material_selection: 'Materials',
  labour_estimation: 'Labour',
  manual: 'Other',
};

const SOURCE_ORDER: SourceGroupKey[] = ['material_selection', 'labour_estimation', 'manual'];

export default function QuoteDetailPage() {
  const params = useParams();
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

  // Group by source first, then by trade within each source
  const sourceGroups = useMemo((): SourceGroup[] => {
    const bySource = new Map<SourceGroupKey, LineItemLike[]>();
    for (const item of lineItems) {
      const src = (item.source as SourceGroupKey) || 'manual';
      const existing = bySource.get(src) || [];
      existing.push(item);
      bySource.set(src, existing);
    }

    const groups: SourceGroup[] = [];
    for (const srcKey of SOURCE_ORDER) {
      const items = bySource.get(srcKey);
      if (!items || items.length === 0) continue;

      // Sub-group by trade within this source
      const tradeMap = new Map<string, LineItemLike[]>();
      for (const item of items) {
        const tKey = item.workCategoryCode || item.category || 'other';
        const existing = tradeMap.get(tKey) || [];
        existing.push(item);
        tradeMap.set(tKey, existing);
      }

      const tradeGroups: TradeGroup[] = [];
      for (const [tKey, tItems] of tradeMap) {
        const laborTotal = tItems.filter((i) => i.isLabor).reduce((s, i) => s + i.totalCost, 0);
        const materialTotal = tItems.filter((i) => !i.isLabor).reduce((s, i) => s + i.totalCost, 0);
        tradeGroups.push({
          key: tKey,
          label: CATEGORY_LABELS[tKey] || tKey.charAt(0).toUpperCase() + tKey.slice(1),
          items: tItems,
          laborTotal,
          materialTotal,
          total: laborTotal + materialTotal,
        });
      }
      tradeGroups.sort((a, b) => b.total - a.total);

      groups.push({
        key: srcKey,
        label: SOURCE_LABELS[srcKey],
        items,
        tradeGroups,
        total: items.reduce((s, i) => s + i.totalCost, 0),
      });
    }

    return groups;
  }, [lineItems]);

  // Flat trade groups for backward compat (PDF, totals)
  const tradeGroups = useMemo((): TradeGroup[] => {
    return sourceGroups.flatMap((sg) => sg.tradeGroups);
  }, [sourceGroups]);

  const grandTotal = sourceGroups.reduce((s, g) => s + g.total, 0);

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

  // ── Document layout: derived values ──
  const QUOTE_STATUS_STEPS = [
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'reviewed', label: 'Reviewed' },
    { key: 'accepted', label: 'Accepted' },
  ];

  const quoteStatusKey = useMemo(() => {
    if (!quote) return 'draft';
    if (quote.status === 'viewed') return 'reviewed';
    if (quote.status === 'accepted' || quote.status === 'declined' || quote.status === 'expired') return 'accepted';
    return quote.status; // draft, sent
  }, [quote]);

  const quoteNumber = useMemo(() => {
    if (!quote) return 'Q-0000-000';
    const year = new Date(quote.createdAt).getFullYear();
    const seq = quoteId.slice(-3).replace(/\D/g, '0').padStart(3, '0');
    return `Q-${year}-${seq}`;
  }, [quote, quoteId]);

  // Map trade groups into TradeSection format
  const tradeSectionGroups = useMemo(() => {
    return tradeGroups.map((g) => ({
      code: g.key,
      name: g.label,
      items: g.items.map((i): TradeSectionLineItem => ({
        id: i.id,
        description: i.description,
        spec: i.isLabor ? 'Labor' : (CATEGORY_LABELS[i.category] || ''),
        quantity: i.quantity,
        unit: i.unit,
        unitCost: i.unitCost,
        totalCost: i.totalCost,
      })),
      subtotal: g.total,
    }));
  }, [tradeGroups]);

  // Payment terms handlers
  const currentDepositPct = quote?.depositPercentage ?? 25;
  const currentValidityDays = quote?.validityDays ?? 30;
  const currentScheduleType = quote?.scheduleType ?? 'simple';
  const currentCustomMilestones = quote?.customMilestones ?? [];
  const isDraft = quote?.status === 'draft';

  const handleDepositChange = async (pct: number) => {
    if (!quote || !isDraft) return;
    await updateQuote.mutateAsync({ id: quote.id, data: { depositPercentage: Math.max(0, Math.min(100, pct)) } });
  };
  const handleValidityChange = async (days: number) => {
    if (!quote || !isDraft) return;
    await updateQuote.mutateAsync({ id: quote.id, data: { validityDays: days } });
  };
  const handleScheduleTypeChange = async (type: 'simple' | 'progress' | 'custom') => {
    if (!quote || !isDraft) return;
    await updateQuote.mutateAsync({ id: quote.id, data: { scheduleType: type } });
  };
  const handleCustomMilestonesChange = async (milestones: Array<{ label: string; pct: number }>) => {
    if (!quote || !isDraft) return;
    await updateQuote.mutateAsync({ id: quote.id, data: { customMilestones: milestones } });
  };
  const handleGeneralTermsUpdate = async (terms: string[]) => {
    if (!quote) return;
    await updateQuote.mutateAsync({ id: quote.id, data: { generalTerms: terms } });
  };

  const validUntilDate = useMemo(() => {
    if (!quote) return '';
    const d = new Date(quote.createdAt);
    d.setDate(d.getDate() + currentValidityDays);
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [quote, currentValidityDays]);

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
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--mid)' }}>Quote not found</p>
        <Link href="/sales/quotes" style={{ fontSize: 12, color: COLOR }}>Back to Quotes</Link>
      </div>
    );
  }

  const badge = STATUS_CONFIG[quote.status];
  const depositAmount = quote.totalAmount * (currentDepositPct / 100);

  return (
    <PageErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

        {/* ── Brand Header ── */}
        <BrandHeader docType="Quote" />

        {/* ── Status Progress Bar ── */}
        <StatusProgressBar steps={QUOTE_STATUS_STEPS} currentStepKey={quoteStatusKey} />

        {/* ── Header ── */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="px-6 py-5" style={{ maxWidth: 1200 }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-[11px] font-medium tracking-[0.06em]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
                >
                  {quoteNumber}
                </div>
                <h1 className="text-xl font-bold mt-0.5 leading-tight" style={{ color: 'var(--charcoal)' }}>
                  {project?.name || quote.projectId}
                </h1>
                <div className="flex gap-5 mt-2 flex-wrap items-center">
                  <div className="text-xs" style={{ color: 'var(--mid)' }}>
                    Homeowner{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--charcoal)', fontWeight: 500 }}>
                      {customerName}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--mid)' }}>
                    Issued{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--charcoal)', fontWeight: 500 }}>
                      {new Date(quote.createdAt).toLocaleDateString('en-CA')}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--mid)' }}>
                    Valid Until{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--charcoal)', fontWeight: 500 }}>
                      {validUntilDate}
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center gap-[5px] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.06em]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: badge.bg,
                      border: `1px solid ${badge.text}20`,
                      color: badge.text,
                    }}
                  >
                    <span className="w-[5px] h-[5px] rounded-full" style={{ background: badge.text }} />
                    {badge.label}
                  </span>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {quote.status === 'draft' && (
                  <ActionButton label="Send Quote" icon={Send} color="var(--blue)" loading={sendQuote.isPending} onClick={handleSend} />
                )}
                {quote.status === 'sent' && (
                  <ActionButton label="Mark Viewed" icon={Eye} color="var(--amber, var(--yellow))" loading={markViewed.isPending} onClick={handleMarkViewed} />
                )}
                {(quote.status === 'sent' || quote.status === 'viewed') && (
                  <>
                    <ActionButton label="Accept" icon={CheckCircle2} color="var(--green)" loading={acceptQuote.isPending} onClick={handleAccept} />
                    <ActionButton label="Decline" icon={XCircle} color="var(--red)" loading={declineQuote.isPending} onClick={() => setShowDeclineModal(true)} />
                  </>
                )}
                {customer && project && lineItems.length > 0 && (
                  <DownloadQuotePDF quote={quote} project={project} customer={customer} lineItems={lineItems as unknown as ContractLineItem[]}>
                    <button
                      className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 flex items-center gap-1.5"
                      style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--charcoal)' }}
                    >
                      <Download size={12} /> PDF
                    </button>
                  </DownloadQuotePDF>
                )}
                {quote.contractGeneratedAt && customer && project && lineItems.length > 0 && (
                  <DownloadContractPDF quote={quote} project={project} customer={customer} lineItems={lineItems as unknown as ContractLineItem[]} depositPercentage={currentDepositPct}>
                    <button
                      className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 flex items-center gap-1.5"
                      style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--charcoal)' }}
                    >
                      <Download size={12} /> Contract
                    </button>
                  </DownloadContractPDF>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Approve Project Banner ── */}
        {quote.status === 'accepted' && !isProjectApproved && !approvalResult && (
          <div className="px-6 py-3" style={{ maxWidth: 1200 }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--green-bg, rgba(22,163,74,0.08))', border: '2px solid var(--green)' }}>
              <div className="flex items-center gap-2">
                <Rocket size={16} style={{ color: 'var(--green)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--green)' }}>Quote Accepted — Ready to Start Project</span>
              </div>
              <button
                onClick={handleApproveProject}
                disabled={approving}
                className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 text-white"
                style={{ fontFamily: 'var(--font-mono)', background: approving ? 'var(--muted)' : 'var(--green)', border: 'none' }}
              >
                {approving ? 'Approving...' : 'Approve & Start Project'}
              </button>
            </div>
          </div>
        )}

        {/* ── Approval Result ── */}
        {approvalResult && (
          <div className="px-6 py-3" style={{ maxWidth: 1200 }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--green-bg, rgba(22,163,74,0.08))', border: '1px solid var(--green-bg, rgba(22,163,74,0.08))' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>
                  Project Approved — {approvalResult.tasksDeployed} tasks created
                </span>
              </div>
              <Link
                href={`/projects/${quote.projectId}`}
                className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 no-underline"
                style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--green)', color: 'var(--green)' }}
              >
                View Project →
              </Link>
            </div>
          </div>
        )}

        {/* Already approved */}
        {quote.status === 'accepted' && isProjectApproved && !approvalResult && (
          <div className="px-6 py-3" style={{ maxWidth: 1200 }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--green-bg, rgba(22,163,74,0.08))' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>Project Started</span>
              </div>
              <Link href={`/projects/${quote.projectId}`} className="text-[11px] font-medium no-underline" style={{ color: COLOR }}>
                View Project →
              </Link>
            </div>
          </div>
        )}

        {/* ── Content Grid ── */}
        <div
          className="grid gap-4 px-6 py-4"
          style={{ gridTemplateColumns: '1fr 300px', maxWidth: 1200 }}
        >
          {/* ── Left Column ── */}
          <div>
            {/* Parties */}
            <PartiesCards
              preparedFor={customer ? {
                name: customerName,
                address: customer.propertyAddress ? [customer.propertyAddress, customer.propertyCity, customer.propertyProvince, customer.propertyPostalCode].filter(Boolean).join(', ') : undefined,
                phone: customer.phone,
                email: customer.email,
              } : undefined}
              preparedBy={{
                name: 'Nathan Montgomery',
                company: 'Hooomz Interiors',
                address: 'Moncton, NB',
                email: 'nathan@hooomz.ca',
              }}
            />

            {/* Source Link */}
            <SourceLink projectId={quote.projectId} />

            {/* Trade Sections */}
            {loadingItems && (
              <div className="px-4 py-8 text-center mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Loading line items...</p>
              </div>
            )}
            {!loadingItems && tradeSectionGroups.length > 0 && tradeSectionGroups.map((group) => (
              <TradeSection
                key={group.code}
                title={group.name}
                items={group.items}
                subtotal={group.subtotal}
              />
            ))}
            {!loadingItems && lineItems.length === 0 && (
              <div className="px-4 py-8 text-center mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>No line items in this estimate</p>
                <Link href={`/estimates/${quote.projectId}`} className="text-[11px] mt-1 inline-block" style={{ color: COLOR }}>
                  Add line items →
                </Link>
              </div>
            )}

            {/* Payment Terms */}
            <PaymentTerms
              total={quote.totalAmount * 1.15}
              depositPct={currentDepositPct}
              validityDays={currentValidityDays}
              scheduleType={currentScheduleType}
              customMilestones={currentCustomMilestones}
              tradeGroups={tradeGroups.map((g) => ({ name: g.label, total: g.total }))}
              isEditable={isDraft}
              quoteNumber={quoteNumber}
              onDepositChange={handleDepositChange}
              onValidityChange={handleValidityChange}
              onScheduleTypeChange={handleScheduleTypeChange}
              onCustomMilestonesChange={handleCustomMilestonesChange}
            />

            {/* General Terms */}
            <GeneralTerms
              terms={quote.generalTerms}
              onUpdate={handleGeneralTermsUpdate}
              isEditable={isDraft}
            />

            {/* Acceptance Block */}
            <AcceptanceBlock
              depositAmount={depositAmount}
              homeownerName={customerName}
            />

            {/* Decline Reason */}
            {quote.status === 'declined' && quote.declineReason && (
              <div className="px-4 py-3 mb-3" style={{ background: 'var(--red-bg, rgba(220,38,38,0.08))', border: '1px solid var(--red-bg, rgba(220,38,38,0.08))' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle size={12} style={{ color: 'var(--red)' }} />
                  <span className="text-[9px] font-medium uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>
                    Decline Reason
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--red)' }}>{quote.declineReason}</p>
              </div>
            )}
          </div>

          {/* ── Right Column ── */}
          <div>
            <SummaryPanel
              homeowner={customer ? [
                { label: 'Name', value: customerName },
                ...(customer.phone ? [{ label: 'Phone', value: customer.phone }] : []),
                ...(customer.email ? [{ label: 'Email', value: customer.email }] : []),
              ] : undefined}
              job={project ? [
                { label: 'Address', value: project.name || '—' },
                { label: 'Status', value: quote.status },
              ] : undefined}
              trades={tradeGroups.map((g) => ({ name: g.label, total: g.total }))}
              subtotal={grandTotal}
              total={grandTotal * 1.15}
              history={[
                ...(quote.respondedAt ? [{ label: quote.status === 'accepted' ? 'Accepted' : 'Declined', date: new Date(quote.respondedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) }] : []),
                ...(quote.viewedAt ? [{ label: 'Viewed', date: new Date(quote.viewedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) }] : []),
                ...(quote.sentAt ? [{ label: 'Sent', date: new Date(quote.sentAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) }] : []),
                { label: 'Created', date: new Date(quote.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) },
              ]}
            />

            {/* Share buttons */}
            {quote.contractGeneratedAt && (
              <div className="mb-3 flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 text-[10px] font-medium tracking-[0.04em] px-3 py-2 flex items-center justify-center gap-1.5"
                  style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--mid)' }}
                >
                  <Link2 size={11} /> Copy Link
                </button>
                <button
                  onClick={handleEmailLink}
                  className="flex-1 text-[10px] font-medium tracking-[0.04em] px-3 py-2 flex items-center justify-center gap-1.5"
                  style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--mid)' }}
                >
                  <Mail size={11} /> Email
                </button>
              </div>
            )}

            {/* Sales Checklist */}
            <div className="mb-3 px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <SalesChecklist
                entityType="quote"
                entityId={quote.id}
                completions={quote.checklistCompletions}
              />
            </div>
          </div>
        </div>

        {/* ── Decline Modal ── */}
        {showDeclineModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowDeclineModal(false); }}
          >
            <div className="w-full max-w-sm p-5" style={{ background: 'var(--surface)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--red)' }}>Reason for Decline (optional)</p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Customer feedback or reason..."
                rows={3}
                className="w-full p-2.5 text-xs resize-y"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none', minHeight: 48 }}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="flex-1 py-2 text-[11px] font-medium"
                  style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg)', color: 'var(--mid)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={declineQuote.isPending}
                  className="flex-1 py-2 text-[11px] font-medium text-white"
                  style={{ fontFamily: 'var(--font-mono)', background: 'var(--red)', border: 'none', opacity: declineQuote.isPending ? 0.5 : 1 }}
                >
                  {declineQuote.isPending ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          </div>
        )}
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
        fontFamily: 'var(--font-mono)',
        background: color, color: '#FFFFFF', border: 'none',
        cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1,
      }}
    >
      <Icon size={14} /> {loading ? 'Processing...' : label}
    </button>
  );
}

