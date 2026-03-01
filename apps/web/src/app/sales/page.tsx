'use client';

/**
 * Sales Dashboard
 *
 * Pipeline overview: Lead → Estimate → Consultation → Quote → Contract
 * Conversion funnel, this week panel, performance metrics, quick actions.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  Plus,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Calendar,
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
} from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useLeadPipeline } from '@/lib/hooks/useLeadData';
import { useLocalRecentActivity, useLocalProjects } from '@/lib/hooks/useLocalData';
import { useConsultations } from '@/lib/hooks/useConsultations';
import { useQuotes } from '@/lib/hooks/useQuotes';
import { useCustomers } from '@/lib/hooks/useCustomersV2';
import { SALES_STAGES, JOB_STAGE_META, JobStage } from '@hooomz/shared-contracts';
import { resolveEntityLink } from '@/lib/utils/entityLinks';

const COLOR = SECTION_COLORS.sales;

// ============================================================================
// Helpers
// ============================================================================

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(ts: unknown): string {
  if (!ts) return '';
  const d = new Date(String(ts));
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function daysFromNow(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ============================================================================
// Page
// ============================================================================

export default function SalesDashboardPage() {
  const router = useRouter();
  const dashboard = useDashboardData();
  const leadPipeline = useLeadPipeline();
  const { data: activityData } = useLocalRecentActivity(5);
  const { data: consultations = [] } = useConsultations();
  const { data: quotes = [] } = useQuotes();
  const { data: customers = [] } = useCustomers();
  const { data: projectsData } = useLocalProjects();
  const projects = projectsData?.projects ?? [];

  // Deep-link handler for activity items
  const handleActivityClick = useCallback(
    (event: Record<string, unknown>) => {
      const entityType = String(event.entity_type || '');
      const entityId = String(event.entity_id || '');
      const projectId = event.project_id ? String(event.project_id) : undefined;
      const link = resolveEntityLink(entityType, entityId, projectId);
      if (link) router.push(link);
    },
    [router]
  );

  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Stage counts from real data
  const leadCount = leadPipeline.leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost').length;
  const recentEvents = (activityData?.events as unknown as Array<Record<string, unknown>>) ?? [];

  // Estimate count: projects in the sales pipeline (lead + quoted status).
  // Excludes in-progress/approved/complete projects — those are past the sales funnel.
  const estimateCount = dashboard.pipelineCount;

  // Consultation count: scheduled + completed (not cancelled)
  const consultationCount = consultations.filter((c) => c.status === 'scheduled' || c.status === 'completed').length;

  // Quote count: draft + sent + viewed (active pipeline quotes)
  const quoteCount = quotes.filter((q) => q.status === 'draft' || q.status === 'sent' || q.status === 'viewed').length;

  // Contract count: accepted quotes
  const contractCount = quotes.filter((q) => q.status === 'accepted').length;

  // Stage counter data
  const stageCounters = SALES_STAGES.map((stage) => {
    const meta = JOB_STAGE_META[stage];
    let count: number | null = null;
    if (stage === JobStage.LEAD) count = leadCount;
    else if (stage === JobStage.ESTIMATE) count = estimateCount;
    else if (stage === JobStage.CONSULTATION) count = consultationCount;
    else if (stage === JobStage.QUOTE) count = quoteCount;
    else if (stage === JobStage.CONTRACT) count = contractCount;
    return { stage, label: meta.label, count };
  });

  // Attention items — deep link hot leads to /customers/[id]
  const attentionItems: Array<{ icon: React.ReactNode; color: string; title: string; subtitle: string; href?: string }> = [];
  for (const hl of dashboard.hotLeadsNeedingContact) {
    attentionItems.push({
      icon: <Flame size={13} />,
      color: 'var(--red)',
      title: `Hot lead — ${hl.name}`,
      subtitle: `Source: ${hl.source}`,
      href: `/leads?highlight=${hl.customerId}`,
    });
  }
  for (const co of dashboard.pendingChangeOrders) {
    attentionItems.push({ icon: <AlertTriangle size={13} />, color: 'var(--amber)', title: 'Change Order — Pending', subtitle: co.description || 'Pending approval', href: co.projectId ? `/projects/${co.projectId}` : undefined });
  }

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                  Sales
                </h1>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{getDateString()}</p>
            </div>
            <button
              onClick={() => router.push('/leads/new')}
              className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl"
              style={{ background: COLOR }}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Stage Counter Cards */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, overflowX: 'auto' }}>
            {stageCounters.map(({ stage, label, count }) => (
              <div
                key={stage}
                style={{
                  flex: '1 0 0',
                  minWidth: 80,
                  padding: '12px 8px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                  textAlign: 'center',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: count !== null ? 'var(--text)' : 'var(--text-3)',
                  lineHeight: 1,
                }}>
                  {count !== null ? count : '—'}
                </p>
                <p style={{
                  fontFamily: 'var(--font-cond)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  marginTop: 6,
                }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Conversion Funnel */}
          <ConversionFunnel stageCounters={stageCounters} />

          {/* Content Grid */}
          <div className="mt-5" style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gap: 16 }} className="md:grid-cols-[1fr_1fr]">

              {/* Left Column: Recent Activity + Needs Attention */}
              <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                {/* Recent Activity */}
                <div>
                  <SectionHeader title="Recent Activity" />
                  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    {recentEvents.length === 0 ? (
                      <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No activity yet</p>
                      </div>
                    ) : (
                      recentEvents.slice(0, 5).map((event, i) => {
                        const entityType = String(event.entity_type || '');
                        const entityId = String(event.entity_id || '');
                        const projectId = event.project_id ? String(event.project_id) : undefined;
                        const hasLink = !!resolveEntityLink(entityType, entityId, projectId);

                        return (
                          <button
                            key={String(event.id || i)}
                            onClick={() => handleActivityClick(event)}
                            disabled={!hasLink}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              borderBottom: i < Math.min(recentEvents.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                              minHeight: 44,
                              width: '100%',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              borderBlockEnd: i < Math.min(recentEvents.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                              cursor: hasLink ? 'pointer' : 'default',
                            }}
                          >
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {String(event.summary || formatEventLabel(event))}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>
                              {formatRelativeTime(event.created_at || event.createdAt || event.timestamp)}
                            </span>
                            {hasLink && <ChevronRight size={11} style={{ color: 'var(--border-strong, #d1d5db)', flexShrink: 0 }} />}
                          </button>
                        );
                      })
                    )}
                    <Link
                      href="/activity"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        padding: '8px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: COLOR,
                        textDecoration: 'none',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      View All <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>

                {/* Needs Attention */}
                <div>
                  <SectionHeader title="Needs Attention" />
                  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    {attentionItems.length === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 12px' }}>
                        <CheckCircle2 size={14} style={{ color: 'var(--green)' }} strokeWidth={2.5} />
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Everything&apos;s on track</span>
                      </div>
                    ) : (
                      attentionItems.map((item, i) => (
                        <AttentionItem key={i} {...item} />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: This Week */}
              <ThisWeekPanel consultations={consultations} quotes={quotes} customers={customers} projects={projects} />
            </div>

            {/* Sales Performance Strip */}
            <PerformanceStrip quotes={quotes} customers={customers} />

            {/* Quick Actions */}
            <div className="mb-6">
              <SectionHeader title="Quick Actions" />
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                <QuickActionButton icon={<Plus size={12} />} label="New Lead" onClick={() => router.push('/leads/new')} color={COLOR} />
                <QuickActionButton icon={<Calendar size={12} />} label="Schedule Consultation" onClick={() => router.push('/sales/consultations?new=true')} color={COLOR} />
                <QuickActionButton icon={<FileText size={12} />} label="New Quote" onClick={() => router.push('/sales/quotes?new=true')} color={COLOR} />
              </div>
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

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {title}
      </span>
    </div>
  );
}

function formatEventLabel(event: Record<string, unknown>): string {
  const type = String(event.event_type || event.eventType || '');
  const desc = String(event.description || event.metadata || '');
  const readable = type.replace(/[._]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  if (desc && desc !== 'undefined' && desc !== '[object Object]') {
    return desc.length > 60 ? desc.slice(0, 57) + '...' : desc;
  }
  return readable;
}

// ---- Conversion Funnel ----

function ConversionFunnel({ stageCounters }: { stageCounters: Array<{ stage: string; label: string; count: number | null }> }) {
  const pairs: Array<{ from: string; to: string; pct: string }> = [];
  for (let i = 0; i < stageCounters.length - 1; i++) {
    const current = stageCounters[i].count;
    const next = stageCounters[i + 1].count;
    let pct = '—';
    if (current !== null && current > 0 && next !== null) {
      pct = Math.min(Math.round((next / current) * 100), 100) + '%';
    }
    pairs.push({
      from: stageCounters[i].label,
      to: stageCounters[i + 1].label,
      pct,
    });
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: '14px 16px',
        borderRadius: 'var(--radius)',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <SectionHeader title="Conversion Funnel" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginTop: 4 }}>
        {pairs.map((p, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cond)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.04em' }}>
              {p.from} → {p.to}
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              color: p.pct === '—' ? 'var(--text-3)' : COLOR,
              marginTop: 2,
            }}>
              {p.pct}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- This Week Panel ----

interface ThisWeekItem {
  type: 'consultation' | 'quote_expiring';
  label: string;
  subtitle: string;
  date: string;
  daysOut: number;
  href: string;
}

function ThisWeekPanel({
  consultations,
  quotes,
  customers,
  projects,
}: {
  consultations: Array<{ id: string; status: string; scheduledDate: string | null; customerId: string; projectId: string }>;
  quotes: Array<{ id: string; status: string; expiresAt: string | null; totalAmount: number; customerId: string; projectId: string }>;
  customers: Array<{ id: string; firstName: string; lastName: string }>;
  projects: Array<{ id: string; name: string; projectType: string; budget: { estimatedCost: number } }>;
}) {
  const router = useRouter();

  const items = useMemo(() => {
    const custMap = new Map(customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()]));
    const projMap = new Map(projects.map((p) => [p.id, p]));
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const result: ThisWeekItem[] = [];

    function buildSubtitle(customerId: string, projectId: string): string {
      const parts: string[] = [];
      const custName = custMap.get(customerId);
      if (custName) parts.push(custName);
      const proj = projMap.get(projectId);
      if (proj) {
        parts.push(proj.name);
        if (proj.budget.estimatedCost > 0) parts.push(formatCurrency(proj.budget.estimatedCost));
      }
      return parts.join(' · ');
    }

    // Upcoming consultations
    for (const c of consultations) {
      if (c.status !== 'scheduled' || !c.scheduledDate) continue;
      const d = new Date(c.scheduledDate);
      if (d >= now && d <= weekFromNow) {
        result.push({
          type: 'consultation',
          label: `Consultation — ${formatShortDate(c.scheduledDate)}`,
          subtitle: buildSubtitle(c.customerId, c.projectId),
          date: c.scheduledDate,
          daysOut: daysFromNow(c.scheduledDate),
          href: c.projectId ? `/discovery/${c.projectId}` : `/sales/consultations`,
        });
      }
    }

    // Quotes expiring soon
    for (const q of quotes) {
      if (q.status !== 'sent' && q.status !== 'viewed') continue;
      if (!q.expiresAt) continue;
      const d = new Date(q.expiresAt);
      if (d >= now && d <= weekFromNow) {
        result.push({
          type: 'quote_expiring',
          label: `Quote expires — ${formatCurrency(q.totalAmount)}`,
          subtitle: buildSubtitle(q.customerId, q.projectId),
          date: q.expiresAt,
          daysOut: daysFromNow(q.expiresAt),
          href: `/sales/quotes/${q.id}`,
        });
      }
    }

    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return result;
  }, [consultations, quotes, customers, projects]);

  return (
    <div>
      <SectionHeader title="This Week" />
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 12px', justifyContent: 'center' }}>
            <Calendar size={14} style={{ color: 'var(--text-3)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Nothing scheduled this week</span>
          </div>
        ) : (
          items.map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                minHeight: 44,
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: item.type === 'consultation' ? 'var(--blue, #3B82F6)' : 'var(--amber, #F59E0B)',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </p>
                {item.subtitle && (
                  <p style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                    {item.subtitle}
                  </p>
                )}
                <p style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {item.daysOut === 0 ? 'Today' : item.daysOut === 1 ? 'Tomorrow' : `In ${item.daysOut} days`}
                </p>
              </div>
              <ChevronRight size={11} style={{ color: 'var(--border-strong, #d1d5db)', flexShrink: 0 }} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ---- Performance Strip ----

function PerformanceStrip({
  quotes,
  customers,
}: {
  quotes: Array<{ id: string; status: string; totalAmount: number; respondedAt: string | null; createdAt: string; customerId: string }>;
  customers: Array<{ id: string; createdAt: string }>;
}) {
  const metrics = useMemo(() => {
    // Pipeline Value: sum totalAmount for active quotes
    const pipelineValue = quotes
      .filter((q) => ['draft', 'sent', 'viewed', 'accepted'].includes(q.status))
      .reduce((sum, q) => sum + q.totalAmount, 0);

    // Closed MTD: sum totalAmount for accepted quotes this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const closedMTD = quotes
      .filter((q) => q.status === 'accepted' && q.respondedAt && new Date(q.respondedAt) >= monthStart)
      .reduce((sum, q) => sum + q.totalAmount, 0);

    // Avg Lead → Quote: avg days from customer createdAt to first quote createdAt
    const customerFirstQuote = new Map<string, number>();
    for (const q of quotes) {
      const existing = customerFirstQuote.get(q.customerId);
      const qTime = new Date(q.createdAt).getTime();
      if (existing === undefined || qTime < existing) {
        customerFirstQuote.set(q.customerId, qTime);
      }
    }
    const daysArr: number[] = [];
    for (const [custId, quoteTime] of customerFirstQuote.entries()) {
      const cust = customers.find((c) => c.id === custId);
      if (!cust) continue;
      const custTime = new Date(cust.createdAt).getTime();
      const diffDays = Math.round((quoteTime - custTime) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) daysArr.push(diffDays);
    }
    const avgLeadToQuote = daysArr.length >= 3
      ? Math.round(daysArr.reduce((a, b) => a + b, 0) / daysArr.length)
      : null;

    return { pipelineValue, closedMTD, avgLeadToQuote };
  }, [quotes, customers]);

  return (
    <div>
      <SectionHeader title="Sales Performance" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <MetricCard
          icon={<DollarSign size={12} />}
          label="Pipeline Value"
          value={formatCurrency(metrics.pipelineValue)}
        />
        <MetricCard
          icon={<TrendingUp size={12} />}
          label="Closed MTD"
          value={formatCurrency(metrics.closedMTD)}
        />
        <MetricCard
          icon={<Clock size={12} />}
          label="Avg Lead → Quote"
          value={metrics.avgLeadToQuote !== null ? `${metrics.avgLeadToQuote}d` : '—'}
        />
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: '12px',
      borderRadius: 'var(--radius)',
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6, color: 'var(--text-3)' }}>
        {icon}
        <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 18,
        fontWeight: 700,
        color: value === '—' ? 'var(--text-3)' : 'var(--text)',
        lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  );
}

// ---- Attention Item ----

interface AttentionItemProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle: string;
  href?: string;
}

function AttentionItem({ icon, color, title, subtitle, href }: AttentionItemProps) {
  const router = useRouter();
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderLeft: `3px solid ${color}`, minHeight: 44 }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        <p style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
      </div>
      {href && <ChevronRight size={11} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />}
    </div>
  );
  if (href) {
    return (
      <button
        onClick={() => router.push(href)}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
      >
        {content}
      </button>
    );
  }
  return <div style={{ borderBottom: '1px solid var(--border)' }}>{content}</div>;
}

function QuickActionButton({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 12px',
        minHeight: 44,
        borderRadius: 'var(--radius)',
        fontSize: 12,
        fontWeight: 600,
        background: 'var(--surface-1)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-cond)',
        letterSpacing: '0.04em',
      }}
    >
      <span style={{ color }}>{icon}</span>
      {label}
    </button>
  );
}
