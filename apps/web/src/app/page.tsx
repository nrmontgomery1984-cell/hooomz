'use client';

/**
 * Command Centre — Dashboard of Dashboards
 *
 * Shows the highest-priority signal from each section so Nathan
 * gets full situational awareness in one view.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  Plus,
  ChevronRight,
  AlertTriangle,
  GraduationCap,
  FileText,
  CheckCircle2,
  Flame,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { CreateChangeOrderSheet } from '@/components/projects/CreateChangeOrderSheet';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useCurrentSops } from '@/lib/hooks/useLabsData';
import { useLabsActiveTests, useLabsTokens } from '@/lib/hooks/useLabsData';
import { useTrainingRecords } from '@/lib/hooks/useCrewData';
import { SECTION_COLORS } from '@/lib/viewmode';

// ============================================================================
// Countdown
// ============================================================================

const HOME_SHOW_DATE = new Date('2026-03-21T09:00:00-04:00');

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, mins, expired: false };
}

// ============================================================================
// Helpers
// ============================================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

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

function getEventSectionColor(event: Record<string, unknown>): string {
  const type = String(event.event_type || event.eventType || '');
  const prefix = type.split('.')[0];
  if (['task', 'project', 'estimate', 'lead', 'customer', 'schedule'].includes(prefix)) return SECTION_COLORS.work;
  if (['sop', 'training', 'knowledge', 'certification'].includes(prefix)) return SECTION_COLORS.standards;
  if (['lab', 'observation', 'experiment', 'test', 'token', 'vote'].includes(prefix)) return SECTION_COLORS.labs;
  if (['payment', 'financial', 'forecast', 'invoice', 'budget'].includes(prefix)) return SECTION_COLORS.finance;
  return '#64748b';
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

// ============================================================================
// Page
// ============================================================================

export default function CommandCentre() {
  const router = useRouter();
  const [showCreateCO, setShowCreateCO] = useState(false);
  const dashboard = useDashboardData();
  const countdown = useCountdown(HOME_SHOW_DATE);

  // Section-specific data
  const { data: sopsRaw = [] } = useCurrentSops();
  const { data: activeTests = [] } = useLabsActiveTests();
  const { data: tokens = [] } = useLabsTokens();
  const { data: trainingRecords = [] } = useTrainingRecords();

  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Compute section KPIs
  const publishedSops = sopsRaw.filter((s) => s.status === 'active').length;
  const totalSops = sopsRaw.length;
  const certifiedCount = trainingRecords.filter((t) => t.status === 'certified').length;
  const totalTraining = trainingRecords.length;
  const trainingPct = totalTraining > 0 ? Math.round((certifiedCount / totalTraining) * 100) : 0;

  // Attention items
  const attentionItems: AttentionItemProps[] = [];
  for (const hl of dashboard.hotLeadsNeedingContact) {
    attentionItems.push({ icon: <Flame size={13} />, color: 'var(--red)', title: `Hot lead — ${hl.name}`, subtitle: `Source: ${hl.source}`, href: '/leads' });
  }
  for (const task of dashboard.overBudgetTasks) {
    const pct = task.actualHours && task.budgetedHours ? Math.round((task.actualHours / task.budgetedHours) * 100) : 0;
    attentionItems.push({ icon: <AlertTriangle size={13} />, color: 'var(--red)', title: `Over budget: ${task.sopCode || 'Task'}`, subtitle: `${pct}% of budgeted hours`, href: task.projectId ? `/projects/${task.projectId}` : undefined });
  }
  for (const record of dashboard.readyForReview) {
    attentionItems.push({ icon: <GraduationCap size={13} />, color: 'var(--blue)', title: 'Ready for certification review', subtitle: record.sopId ? `SOP: ${record.sopId.slice(0, 8)}` : 'Training complete', href: '/labs/sops' });
  }
  for (const co of dashboard.pendingChangeOrders) {
    attentionItems.push({ icon: <FileText size={13} />, color: 'var(--amber)', title: 'Change Order — Pending', subtitle: co.description || 'Pending approval', href: co.projectId ? `/projects/${co.projectId}` : undefined });
  }

  // Recent events (5)
  const recentEvents = (dashboard.recentEvents || []).slice(0, 5);

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.01em' }}>
                {getGreeting()}, Nathan
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{getDateString()}</p>
            </div>
            <button
              onClick={() => router.push('/intake')}
              className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl"
              style={{ background: 'var(--blue)' }}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Countdown Strip */}
          {!countdown.expired && (
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderRadius: 'var(--radius)',
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <Clock size={14} style={{ color: 'var(--amber)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--amber)', flexShrink: 0 }}>
                NEXT MILESTONE
              </span>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
                Greater Moncton Home Show
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginLeft: 'auto', flexShrink: 0 }}>
                {countdown.days}d {countdown.hours}h {countdown.mins}m
              </span>
            </div>
          )}

          {/* 4 Section Summary Cards */}
          <div
            style={{ marginTop: 16, display: 'grid', gap: 12 }}
            className="grid-cols-2 md:grid-cols-4"
          >
            <SectionCard
              label="Work"
              color={SECTION_COLORS.work}
              href="/work"
              kpis={[
                { label: 'Active Projects', value: dashboard.activeProjectCount },
                { label: 'Pipeline', value: dashboard.pipelineCount },
              ]}
            />
            <SectionCard
              label="Standards"
              color={SECTION_COLORS.standards}
              href="/standards"
              kpis={[
                { label: 'SOPs Published', value: `${publishedSops}/${totalSops}` },
                { label: 'Training', value: `${trainingPct}%` },
              ]}
            />
            <SectionCard
              label="Labs"
              color={SECTION_COLORS.labs}
              href="/labs"
              kpis={[
                { label: 'Active Tests', value: activeTests.length },
                { label: 'Tokens', value: tokens.length },
              ]}
            />
            <SectionCard
              label="Finance"
              color={SECTION_COLORS.finance}
              href="/finance"
              kpis={[
                { label: 'Revenue MTD', value: '—' }, // TODO: wire to forecast actuals
                { label: 'Forecast', value: '—' }, // TODO: wire to forecast %
              ]}
            />
          </div>

          {/* Content Grid */}
          <div
            className="mt-5"
            style={{ display: 'grid', gap: 16 }}
          >
            <div
              style={{ display: 'grid', gap: 16 }}
              className="md:grid-cols-[1fr_1fr]"
            >
              {/* Recent Activity */}
              <div>
                <SectionHeader title="Recent Activity" />
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {recentEvents.length === 0 ? (
                    <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No activity yet</p>
                    </div>
                  ) : (
                    recentEvents.map((event, i) => (
                      <div
                        key={String(event.id || i)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          borderBottom: i < recentEvents.length - 1 ? '1px solid var(--border)' : 'none',
                          minHeight: 40,
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: getEventSectionColor(event), flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {formatEventLabel(event)}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>
                          {formatRelativeTime(event.created_at || event.createdAt || event.timestamp)}
                        </span>
                      </div>
                    ))
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
                      color: 'var(--blue)',
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

            {/* Quick Actions */}
            <div className="mb-6">
              <SectionHeader title="Quick Actions" />
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                <QuickActionButton icon={<Plus size={12} />} label="New Lead" onClick={() => router.push('/leads/new')} />
                <QuickActionButton icon={<FileText size={12} />} label="Estimate" onClick={() => router.push('/estimates/select-project')} />
                <QuickActionButton icon={<FileText size={12} />} label="Change Order" onClick={() => setShowCreateCO(true)} />
                {process.env.NODE_ENV !== 'production' && (
                  <QuickActionButton icon={<ArrowRight size={12} />} label="Seed Data" onClick={() => router.push('/labs/seed')} />
                )}
              </div>
            </div>
          </div>
        </div>

        <CreateChangeOrderSheet
          isOpen={showCreateCO}
          onClose={() => setShowCreateCO(false)}
        />
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

function SectionCard({
  label,
  color,
  href,
  kpis,
}: {
  label: string;
  color: string;
  href: string;
  kpis: Array<{ label: string; value: string | number }>;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        padding: 16,
        borderRadius: 'var(--radius)',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{
          fontFamily: 'var(--font-cond)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-2)',
        }}>
          {label}
        </span>
        <ChevronRight size={10} style={{ color: 'var(--text-3)', marginLeft: 'auto' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{kpi.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderLeft: `3px solid ${color}`, minHeight: 40 }}>
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

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 12px',
        minHeight: 36,
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
      <span style={{ color: 'var(--blue)' }}>{icon}</span>
      {label}
    </button>
  );
}
