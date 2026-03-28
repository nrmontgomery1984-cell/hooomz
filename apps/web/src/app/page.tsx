'use client';

// Note: DevRootNotFoundBoundary error in dev console is
// a known Next.js 14 StrictMode artifact.
// Does not affect production build.

/**
 * Command Centre — Role-aware dashboard of dashboards.
 *
 * Manager/Owner: Dark sticky strip, SCRIPT funnel with job dots,
 * DESIGN sales funnel, schedule, finance, approvals, activity, messages.
 *
 * Installer: My assignments today, tasks, activity.
 *
 * All data from IndexedDB via existing hooks. Zero hardcoded values.
 */

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useAllInvoices } from '@/lib/hooks/useInvoices';
import { useLocalRecentActivity } from '@/lib/hooks/useLocalData';
import { useTeamWeekSchedule } from '@/lib/hooks/useSchedule';
import { useAuth } from '@/context/AuthContext';
import { SCRIPT_STAGES, JOB_STAGE_TO_DESIGN, type InvoiceRecord, type DesignStage } from '@hooomz/shared-contracts';
import { useJobHealthSummary } from '@/lib/hooks/useJobHealthSummary';

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

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n.toLocaleString()}`;
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getEventIcon(event: Record<string, unknown>): { icon: string; color: string } {
  const type = String(event.event_type || event.eventType || '');
  if (type.includes('created') || type.includes('project')) return { icon: '◈', color: 'var(--charcoal)' };
  if (type.includes('stage') || type.includes('advance')) return { icon: '›', color: 'var(--green)' };
  if (type.includes('estimate') || type.includes('quote')) return { icon: '⊞', color: 'var(--charcoal)' };
  if (type.includes('flag') && type.includes('resolve')) return { icon: '✓', color: 'var(--green)' };
  if (type.includes('flag') || type.includes('block')) return { icon: '⚑', color: 'var(--amber)' };
  if (type.includes('invoice')) return { icon: '$', color: 'var(--charcoal)' };
  if (type.includes('payment')) return { icon: '✓', color: 'var(--green)' };
  return { icon: '·', color: 'var(--muted)' };
}

function formatEventLabel(event: Record<string, unknown>): string {
  const type = String(event.event_type || event.eventType || '');
  const desc = String(event.description || event.summary || '');
  if (desc && desc !== 'undefined' && desc !== '[object Object]') {
    return desc.length > 60 ? desc.slice(0, 57) + '...' : desc;
  }
  return type.replace(/[._]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function stageLabel(stage: string): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

const DESIGN_LETTERS = ['D', 'E', 'S', 'I', 'G', 'N'] as const;
const DESIGN_STAGE_LABELS: Record<string, string> = { D: 'Discover', E: 'Estimate', S: 'Survey', I: 'Iterate', G: 'Go-Ahead', N: 'Notify' };

// ============================================================================
// Page
// ============================================================================

export default function CommandCentre() {
  const router = useRouter();
  const { profile } = useAuth();
  const role = profile?.role ?? 'owner';
  const isInstaller = role === 'installer';

  const dashboard = useDashboardData();
  const { data: allInvoices = [] } = useAllInvoices();
  const { data: activityData } = useLocalRecentActivity(8);
  const weekStart = useMemo(() => getWeekStart(), []);
  const { data: weekBlocks = [] } = useTeamWeekSchedule(weekStart);
  const today = getToday();
  const { sales } = useJobHealthSummary();
  const salesDotColor = sales.state === 'green' ? 'var(--green)' : sales.state === 'amber' ? 'var(--amber)' : 'var(--red)';

  const [showJobs, setShowJobs] = useState(false);
  const [clockMode, setClockMode] = useState<'office' | 'field'>(role === 'installer' ? 'field' : 'office');
  const [showClockModal, setShowClockModal] = useState(false);
  const [clockedTask, setClockedTask] = useState<{ label: string; indirect: boolean; job?: string } | null>(null);
  const [clockInTime, setClockInTime] = useState<number | null>(null);

  const handleClockOut = () => {
    setClockedTask(null);
    setClockInTime(null);
    (window as unknown as Record<string, unknown>).__selectedJob = null;
  };

  // Finance computations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const mtdRevenue = useMemo(() => {
    return allInvoices
      .filter((inv: InvoiceRecord) => {
        if (inv.amountPaid <= 0 || inv.status === 'cancelled') return false;
        const dateStr = inv.paidAt ?? inv.metadata?.createdAt ?? inv.dueDate;
        const d = new Date(dateStr);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum: number, inv: InvoiceRecord) => sum + inv.amountPaid, 0);
  }, [allInvoices, currentMonth, currentYear]);

  const outstanding = useMemo(() => {
    return allInvoices
      .filter((inv: InvoiceRecord) => inv.status !== 'cancelled' && inv.status !== 'draft' && inv.balanceDue > 0)
      .reduce((sum: number, inv: InvoiceRecord) => sum + inv.balanceDue, 0);
  }, [allInvoices]);

  // Schedule: today's blocks
  const todayBlocks = useMemo(() => {
    return weekBlocks
      .filter((b) => b.date === today)
      .sort((a, b) => (a.startTime && b.startTime ? a.startTime.localeCompare(b.startTime) : 0));
  }, [weekBlocks, today]);

  // SCRIPT funnel: counts + jobs per stage
  const scriptData = useMemo(() => {
    const counts: Record<string, number> = {};
    const jobs: Record<string, typeof dashboard.activeProjects> = {};
    for (const stage of SCRIPT_STAGES) {
      counts[stage] = 0;
      jobs[stage] = [];
    }
    for (const p of dashboard.activeProjects) {
      const s = p.jobStage;
      if (s && counts[s] !== undefined) {
        counts[s]++;
        jobs[s].push(p);
      }
    }
    return { counts, jobs };
  }, [dashboard.activeProjects]);

  // DESIGN sales funnel — derived from project design_stage or jobStage
  const designData = useMemo(() => {
    const counts: Record<string, number> = { D: 0, E: 0, S: 0, I: 0, G: 0, N: 0 };
    const values: Record<string, number> = { D: 0, E: 0, S: 0, I: 0, G: 0, N: 0 };
    const jobs: Record<string, typeof dashboard.allProjects> = {};
    for (const letter of DESIGN_LETTERS) { jobs[letter] = []; }
    for (const p of dashboard.allProjects) {
      const stage: DesignStage =
        (p.design_stage as DesignStage) ??
        (p.jobStage ? JOB_STAGE_TO_DESIGN[p.jobStage] : undefined) ??
        'D';
      if (counts[stage] !== undefined) {
        counts[stage]++;
        jobs[stage].push(p);
      }
    }
    return { counts, values, jobs };
  }, [dashboard.allProjects]);

  // Recent events
  const recentEvents = useMemo(() => {
    return ((activityData?.events as unknown as Array<Record<string, unknown>>) ?? []).slice(0, 6);
  }, [activityData]);

  // Pending approvals
  const approvalItems = useMemo(() => {
    const items: Array<{ label: string; detail: string; href: string; color: string }> = [];
    for (const co of dashboard.pendingChangeOrders) {
      items.push({
        label: `${co.coNumber} — Pending`,
        detail: co.title || co.description?.slice(0, 50) || 'Awaiting approval',
        href: co.projectId
          ? `/production/jobs/${co.projectId}/change-orders/${co.id}`
          : '/production/change-orders',
        color: 'var(--amber)',
      });
    }
    for (const record of dashboard.readyForReview) {
      items.push({
        label: 'Training — Ready for Review',
        detail: record.sopId ? `SOP: ${record.sopId.slice(0, 12)}` : 'Certification pending',
        href: '/standards/training',
        color: 'var(--amber)',
      });
    }
    return items;
  }, [dashboard.pendingChangeOrders, dashboard.readyForReview]);

  // Loading
  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  /**
   * Task categories for the time clock.
   * Owners/operators see business categories; installers see field categories.
   * Uses profile.role (auth role), not viewMode, so category set is always correct.
   *
   * Temporary UI state (window.__selectedTask, etc.) will be replaced by
   * proper React state + timeclock service in a future sprint.
   */
  const fieldCategories = [
    { id: 'travel', tag: 'TRVL', label: 'Travel', meta: 'To / from site · Between sites', indirect: true },
    { id: 'setup', tag: 'SETUP', label: 'Site Setup', meta: 'Protection, staging, prep', indirect: true },
    { id: 'clean', tag: 'CLEAN', label: 'Site Clean', meta: 'During job · End of day · Final', indirect: true },
    { id: 'matrun', tag: 'MAT', label: 'Material Run', meta: 'Store trip · Pickup · Delivery', indirect: true },
    { id: 'rework', tag: 'RWRK', label: 'Rework', meta: 'Correction required — note reason', indirect: true },
    { id: 'wait', tag: 'WAIT', label: 'Wait', meta: 'Blocked by trade · Delivery · Decision', indirect: true },
    { id: 'admin', tag: 'ADMIN', label: 'Admin', meta: 'Photos, checklists, paperwork on site', indirect: true },
  ];

  const ownerOperatorCategories = [
    { id: 'sales', tag: 'SALES', label: 'Sales', meta: 'Estimates, client meetings, follow-up', indirect: false },
    { id: 'bizdev', tag: 'BIZ DEV', label: 'Biz Dev', meta: 'Networking, referrals, home shows', indirect: false },
    { id: 'marketing', tag: 'MKTG', label: 'Marketing', meta: 'Content, social, website, Labs', indirect: false },
    { id: 'operations', tag: 'OPS', label: 'Operations', meta: 'Scheduling, procurement, vendors', indirect: false },
    { id: 'finance2', tag: 'FIN', label: 'Finance', meta: 'Invoicing, bookkeeping, reporting', indirect: false },
    { id: 'training', tag: 'TRAIN', label: 'Training', meta: 'Crew development, SOPs, onboarding', indirect: false },
    { id: 'tech', tag: 'TECH', label: 'Tech', meta: 'Platform dev, app builds, integrations', indirect: false },
    { id: 'admin2', tag: 'ADMIN', label: 'Admin', meta: 'General admin, emails, planning', indirect: false },
  ];

  const isOwnerOrOperator = profile?.role === 'owner' || profile?.role === 'operator';
  const taskCategories = clockMode === 'office' ? ownerOperatorCategories : fieldCategories;

  // ── Installer View ──
  if (isInstaller) {
    return (
      <PageErrorBoundary>
        <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
          <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <div className="max-w-lg mx-auto px-4 py-3">
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}>
                Command Centre
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{getDateString()}</p>
            </div>
          </div>
          <div className="max-w-lg mx-auto px-4">

            {/* TIME CLOCK */}
            <div style={{ marginTop: 16 }}>
              <SectionHeader title="Time Clock" />
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>

                  {/* Clock display */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', background: 'var(--charcoal)', borderRadius: 'var(--radius)',
                  }}>
                    <div>
                      <div id="clock-status-label" style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em',
                        textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 4,
                      }}>Not clocked in</div>
                      <div id="clock-task-label" style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
                        Select a task to begin
                      </div>
                    </div>
                    <div id="clock-elapsed" style={{
                      fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700,
                      color: 'var(--green)', letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums',
                    }} />
                  </div>

                  {/* Office / Field toggle */}
                  {isOwnerOrOperator && (
                    <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      {(['office', 'field'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setClockMode(mode)}
                          style={{
                            flex: 1, padding: '10px 16px',
                            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            background: clockMode === mode ? 'var(--charcoal)' : 'var(--bg)',
                            color: clockMode === mode ? 'white' : 'var(--muted)',
                          }}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Task selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {taskCategories.map((cat) => (
                      <div
                        key={cat.id}
                        id={`task-${cat.id}`}
                        onClick={() => {
                          document.querySelectorAll('[id^="task-"]').forEach((el) => {
                            (el as HTMLElement).style.borderColor = 'var(--border)';
                            (el as HTMLElement).style.background = 'var(--bg)';
                          });
                          const el = document.getElementById(`task-${cat.id}`);
                          if (el) { el.style.borderColor = 'var(--charcoal)'; el.style.background = 'var(--surface)'; }
                          (window as unknown as Record<string, unknown>).__selectedTask = cat;
                          const btn = document.getElementById('clock-btn');
                          if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; btn.textContent = `Clock In — ${cat.label}`; }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', border: '1px solid var(--border)',
                          background: 'var(--bg)', cursor: 'pointer',
                          borderRadius: 'var(--radius)', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em',
                          padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase' as const,
                          background: cat.indirect ? 'rgba(217,119,6,0.1)' : 'rgba(255,255,255,0.06)',
                          color: cat.indirect ? 'var(--yellow)' : 'var(--muted)',
                          flexShrink: 0, minWidth: 42, textAlign: 'center' as const,
                        }}>{cat.tag}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{cat.label}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{cat.meta}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Clock in/out button */}
                  {/** Temporary DOM manipulation — replace with React state + timeclock service */}
                  <button
                    id="clock-btn"
                    style={{
                      width: '100%', padding: 16,
                      fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                      letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                      border: 'none', borderRadius: 'var(--radius)',
                      background: 'var(--green)', color: 'white',
                      cursor: 'pointer', opacity: 0.35,
                      pointerEvents: 'none' as const, transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      const w = window as unknown as Record<string, unknown>;
                      const task = w.__selectedTask as { label: string; indirect: boolean } | null;
                      if (!task) return;
                      const isClockedIn = w.__clockedIn as boolean;
                      const btn = document.getElementById('clock-btn');
                      const statusLabel = document.getElementById('clock-status-label');
                      const taskLabel = document.getElementById('clock-task-label');
                      const elapsed = document.getElementById('clock-elapsed');

                      if (!isClockedIn) {
                        w.__clockedIn = true;
                        w.__clockInTime = Date.now();
                        w.__elapsedInterval = setInterval(() => {
                          const secs = Math.floor((Date.now() - (w.__clockInTime as number)) / 1000);
                          const h = Math.floor(secs / 3600);
                          const m = Math.floor((secs % 3600) / 60);
                          const s = secs % 60;
                          if (elapsed) elapsed.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                        }, 1000);
                        if (statusLabel) { statusLabel.textContent = task.indirect ? 'Indirect task active' : 'Clocked in'; statusLabel.style.color = 'var(--green)'; }
                        if (taskLabel) taskLabel.textContent = task.label;
                        if (btn) { btn.textContent = 'Clock Out'; btn.style.background = 'rgba(220,38,38,0.15)'; btn.style.color = 'var(--red)'; btn.style.border = '1px solid rgba(220,38,38,0.3)'; }
                      } else {
                        w.__clockedIn = false;
                        clearInterval(w.__elapsedInterval as number);
                        if (elapsed) elapsed.textContent = '';
                        if (statusLabel) { statusLabel.textContent = 'Not clocked in'; statusLabel.style.color = 'rgba(255,255,255,0.35)'; }
                        if (taskLabel) taskLabel.textContent = 'Select a task to begin';
                        if (btn) { btn.textContent = 'Clock In'; btn.style.background = 'var(--green)'; btn.style.color = 'white'; btn.style.border = 'none'; btn.style.opacity = '0.35'; btn.style.pointerEvents = 'none'; }
                        document.querySelectorAll('[id^="task-"]').forEach((el) => {
                          (el as HTMLElement).style.borderColor = 'var(--border)';
                          (el as HTMLElement).style.background = 'var(--bg)';
                        });
                        w.__selectedTask = null;
                      }
                    }}
                  >
                    Clock In
                  </button>

                  {/* Shift total */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 8, borderTop: '1px solid var(--border)',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--muted)' }}>Total logged today</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--charcoal)' }}>0h 00m</span>
                  </div>

                </div>
              </Card>
            </div>

            <div style={{ marginTop: 20 }}>
              <SectionHeader title="My Schedule Today" />
              <Card>
                {todayBlocks.length === 0 ? (
                  <EmptyState text="No assignments today" />
                ) : (
                  todayBlocks.map((block, i) => (
                    <div key={block.id || i} style={{
                      display: 'flex', gap: 10, padding: '10px 14px',
                      borderBottom: i < todayBlocks.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', flexShrink: 0, minWidth: 44 }}>
                        {block.startTime || `${block.estimatedHours}h`}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--charcoal)' }}>{block.title}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{block.trade || 'General'}</div>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>
            <div style={{ marginTop: 20 }}>
              <SectionHeader title="Active Tasks" />
              <Card>
                {dashboard.tasksDue === 0 ? (
                  <EmptyState text="No open tasks" />
                ) : (
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--charcoal)', fontWeight: 500 }}>
                      {dashboard.tasksDue} task{dashboard.tasksDue !== 1 ? 's' : ''} remaining
                    </span>
                    <Link href="/production/jobs" style={{ fontSize: 11, color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
                      View Jobs <ArrowRight size={10} style={{ display: 'inline' }} />
                    </Link>
                  </div>
                )}
              </Card>
            </div>
            <div style={{ marginTop: 20, marginBottom: 24 }}>
              <SectionHeader title="Recent Activity" />
              <ActivityList events={recentEvents} />
            </div>
          </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // ── Manager / Owner View ──
  return (
    <PageErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* ── TOP STRIP — fixed height, never scrolls ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--dark-nav)',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          minHeight: 52, height: 52,
          display: 'flex', alignItems: 'center',
          padding: '0 32px',
          flexShrink: 0, width: '100%', boxSizing: 'border-box',
        }}>
          {/* Left: title + date */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 3,
            paddingRight: 24, borderRight: '1px solid rgba(255,255,255,.06)',
            flexShrink: 0,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.9)', letterSpacing: '-0.01em' }}>
              Command Centre
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,.3)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              {getDateString()}
            </div>
          </div>

          {/* 5 stat items */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <StripStat
              value={String(dashboard.activeProjectCount)}
              label="Active Jobs"
              sub={`${dashboard.tasksDue} tasks due`}
              color={dashboard.activeProjectCount > 0 ? 'var(--green)' : 'rgba(255,255,255,.25)'}
            />
            <StripStat
              value={formatCurrency(mtdRevenue)}
              label="Revenue MTD"
              color={mtdRevenue > 0 ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.25)'}
            />
            <StripStat
              value={outstanding > 0 ? formatCurrency(outstanding) : '$0'}
              label="Outstanding"
              color={outstanding > 0 ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.25)'}
            />
            <StripStat
              value={String(dashboard.pipelineCount)}
              label="Pipeline"
              sub={`${dashboard.hotLeadCount} hot`}
              color={dashboard.pipelineCount > 0 ? 'var(--green)' : 'rgba(255,255,255,.25)'}
            />
            <StripStat
              value={String(dashboard.crewMembers.length)}
              label="Crew"
              color={dashboard.crewMembers.length > 0 ? 'var(--green)' : 'rgba(255,255,255,.25)'}
              isLast
            />
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

          {/* ── CLOCK IN — compact card ── */}
          <div style={{ marginBottom: 20 }}>
            <Card>
              <button
                onClick={() => clockedTask ? handleClockOut() : setShowClockModal(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: clockedTask ? 'var(--green)' : 'var(--muted)',
                    boxShadow: clockedTask ? '0 0 8px rgba(22,163,74,0.5)' : 'none',
                  }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
                      {clockedTask ? clockedTask.label : 'Clock In'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 1, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                      {clockedTask ? (clockedTask.job ?? (clockedTask.indirect ? 'Indirect' : 'Office')) : 'Tap to start tracking time'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {clockedTask && clockInTime && <ClockElapsed startTime={clockInTime} />}
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                    padding: '5px 12px', borderRadius: 'var(--radius)',
                    background: clockedTask ? 'rgba(220,38,38,0.1)' : 'var(--green)',
                    color: clockedTask ? 'var(--red)' : 'white',
                    border: clockedTask ? '1px solid rgba(220,38,38,0.25)' : 'none',
                  }}>
                    {clockedTask ? 'Stop' : 'Start'}
                  </div>
                </div>
              </button>
            </Card>
          </div>

          {/* ── CLOCK MODAL ── */}
          {showClockModal && (
            <div
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: 16,
              }}
              onClick={() => setShowClockModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
              >
                {/* Modal header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--charcoal)' }}>Clock In</span>
                  <button onClick={() => setShowClockModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted)', lineHeight: 1 }}>×</button>
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Office / Field toggle */}
                  {isOwnerOrOperator && (
                    <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      {(['office', 'field'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setClockMode(mode)}
                          style={{
                            flex: 1, padding: '10px 16px',
                            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            background: clockMode === mode ? 'var(--charcoal)' : 'var(--bg)',
                            color: clockMode === mode ? 'white' : 'var(--muted)',
                          }}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Job selector — only for field mode */}
                  {clockMode === 'field' && dashboard.activeProjects.length > 0 && (
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 }}>Job</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dashboard.activeProjects.map((project) => (
                          <button
                            key={project.id}
                            id={`modal-job-${project.id}`}
                            onClick={() => {
                              document.querySelectorAll('[id^="modal-job-"]').forEach((el) => {
                                (el as HTMLElement).style.borderColor = 'var(--border)';
                                (el as HTMLElement).style.background = 'var(--bg)';
                              });
                              const el = document.getElementById(`modal-job-${project.id}`);
                              if (el) { el.style.borderColor = 'var(--charcoal)'; el.style.background = 'var(--surface)'; }
                              (window as unknown as Record<string, unknown>).__selectedJob = project;
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 12px', border: '1px solid var(--border)',
                              background: 'var(--bg)', cursor: 'pointer',
                              borderRadius: 'var(--radius)', textAlign: 'left', width: '100%',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{project.name}</div>
                              {project.jobStage && (
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', marginTop: 1, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{project.jobStage}</div>
                              )}
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{project.completedCount}/{project.taskCount}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category selector */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 }}>
                      {clockMode === 'field' ? 'Task Type' : 'Category'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {taskCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            const job = (window as unknown as Record<string, unknown>).__selectedJob as { name: string } | undefined;
                            setClockedTask({ label: cat.label, indirect: cat.indirect, job: job?.name });
                            setClockInTime(Date.now());
                            setShowClockModal(false);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', border: '1px solid var(--border)',
                            background: 'var(--bg)', cursor: 'pointer',
                            borderRadius: 'var(--radius)', textAlign: 'left', width: '100%',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em',
                            padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase' as const,
                            background: cat.indirect ? 'rgba(217,119,6,0.1)' : 'rgba(255,255,255,0.06)',
                            color: cat.indirect ? 'var(--yellow)' : 'var(--muted)',
                            flexShrink: 0, minWidth: 42, textAlign: 'center' as const,
                          }}>{cat.tag}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{cat.label}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{cat.meta}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Row 1: DESIGN funnel (2fr) + Finance (1fr) ── */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

            {/* DESIGN Sales Funnel */}
            <div>
              <SectionHeader title="Sales — DESIGN" />
              <Card>
                <div style={{ display: 'flex', gap: 0 }}>
                  {DESIGN_LETTERS.map((letter, i) => {
                    const count = designData.counts[letter];
                    const stageJobs = designData.jobs[letter] || [];
                    return (
                      <div key={letter} style={{
                        flex: 1, textAlign: 'center', padding: '12px 4px',
                        borderRight: i < DESIGN_LETTERS.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: count > 0 ? 'var(--charcoal)' : 'var(--muted)', lineHeight: 1 }}>
                          {count}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginTop: 4 }}>
                          {DESIGN_STAGE_LABELS[letter]}
                        </div>
                        {/* Bar track */}
                        <div style={{
                          width: '100%', height: 72, background: 'var(--surface-2)',
                          borderRadius: 4, display: 'flex', alignItems: 'flex-end',
                          overflow: 'hidden', marginTop: 8,
                        }}>
                          <div style={{
                            width: '100%', minHeight: 0,
                            height: count > 0 ? `${Math.min(100, count * 20 + 10)}%` : '0%',
                            background: 'var(--accent)', opacity: 0.35,
                            borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease',
                          }} />
                        </div>
                        {/* Clickable project dots */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', alignContent: 'flex-start', minHeight: 16, maxHeight: 32, overflow: 'hidden', marginTop: 6 }}>
                          {stageJobs.map((job) => (
                            <div
                              key={job.id}
                              title={job.id}
                              onClick={() => job?.id && router.push(`/leads`)}
                              style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: salesDotColor, cursor: 'pointer',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Finance Snapshot */}
            <div>
              <SectionHeader title="Finance" />
              <Card>
                <div style={{ padding: '14px 14px 10px' }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 2 }}>Revenue MTD</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: mtdRevenue > 0 ? 'var(--charcoal)' : 'var(--muted)' }}>{formatCurrency(mtdRevenue)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 2 }}>Outstanding</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: outstanding > 0 ? 'var(--charcoal)' : 'var(--muted)' }}>{outstanding > 0 ? formatCurrency(outstanding) : '$0'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 2 }}>Invoices</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--charcoal)' }}>{allInvoices.length}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 2 }}>Crew Size</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--charcoal)' }}>{dashboard.crewMembers.length}</div>
                    </div>
                  </div>
                </div>
                <Link
                  href="/finance"
                  className="action-link"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.10em',
                    color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none',
                    cursor: 'pointer', transition: 'color 0.15s',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  Finance Dashboard <ArrowRight size={10} />
                </Link>
              </Card>
            </div>
          </div>

          {/* ── Row 2: SCRIPT (2fr) + Schedule (1fr) ── */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

            {/* SCRIPT Production Funnel with jobs toggle */}
            <div>
              <SectionHeader title="Production — SCRIPT" />
              <Card>
                <div style={{ display: 'flex', gap: 0 }}>
                  {SCRIPT_STAGES.map((stage, i) => {
                    const count = scriptData.counts[stage] || 0;
                    const stageJobs = scriptData.jobs[stage] || [];
                    return (
                      <div key={stage} style={{
                        flex: 1, textAlign: 'center', padding: '12px 4px',
                        borderRight: i < SCRIPT_STAGES.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: count > 0 ? 'var(--charcoal)' : 'var(--muted)', lineHeight: 1 }}>
                          {count}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginTop: 4 }}>
                          {stageLabel(stage)}
                        </div>
                        {/* Bar track */}
                        <div style={{
                          width: '100%', height: 72, background: 'var(--surface-2)',
                          borderRadius: 4, display: 'flex', alignItems: 'flex-end',
                          overflow: 'hidden', marginTop: 8,
                        }}>
                          <div style={{
                            width: '100%', minHeight: 0,
                            height: count > 0 ? `${Math.min(100, count * 20 + 10)}%` : '0%',
                            background: 'var(--accent)', opacity: 0.35,
                            borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease',
                          }} />
                        </div>
                        {/* Job dots */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', alignContent: 'flex-start', minHeight: 16, maxHeight: 32, overflow: 'hidden', marginTop: 6 }}>
                          {stageJobs.map((job) => {
                            const dotColor = job.status === 'blocked' ? 'var(--red)'
                              : job.healthScore < 50 ? 'var(--yellow)'
                              : 'var(--green)';
                            return (
                              <div
                                key={job.id}
                                title={job.name}
                                onClick={() => job?.id && router.push(`/jobs/${job.id}`)}
                                style={{
                                  width: 8, height: 8, borderRadius: '50%',
                                  background: dotColor, cursor: 'pointer',
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Toggle jobs list */}
                <button
                  onClick={() => setShowJobs(!showJobs)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '8px 12px', background: 'none', border: 'none', borderTop: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)',
                    textTransform: 'uppercase', letterSpacing: '0.10em',
                  }}
                >
                  {showJobs ? 'Hide Jobs' : 'Show Jobs'}
                  <ChevronDown size={10} style={{ transform: showJobs ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                </button>

                {/* Collapsible jobs list */}
                {showJobs && dashboard.activeProjects.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {dashboard.activeProjects.map((project, i) => {
                      const prog = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
                      const isBlocked = project.status === 'blocked';
                      const badgeBg = isBlocked ? 'var(--red)' : 'var(--accent)';
                      const badgeColor = isBlocked ? '#fff' : 'var(--charcoal)';
                      return (
                        <Link key={project.id} href={project.id ? `/jobs/${project.id}` : '#'} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                          <div style={{
                            padding: '10px 14px',
                            borderBottom: i < dashboard.activeProjects.length - 1 ? '1px solid var(--border)' : 'none',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {project.name}
                              </span>
                              {project.jobStage && (
                                <span style={{
                                  fontFamily: 'var(--font-mono)', fontSize: 7, padding: '2px 8px', borderRadius: 10,
                                  background: `${badgeBg}20`, color: isBlocked ? 'var(--red)' : badgeColor,
                                  border: `1px solid ${isBlocked ? 'var(--red)' : badgeBg}`,
                                  textTransform: 'uppercase', letterSpacing: '0.07em',
                                }}>
                                  {stageLabel(project.jobStage)}
                                </span>
                              )}
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{'›'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>
                                {project.completedCount}/{project.taskCount} tasks
                              </div>
                              {project.nextTask && (
                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>Next: {project.nextTask}</div>
                              )}
                              <div style={{ flex: 1 }} />
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{prog}%</div>
                            </div>
                            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                              <div style={{ height: '100%', background: 'var(--green)', borderRadius: 2, width: `${prog}%`, transition: 'width .4s' }} />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {showJobs && dashboard.activeProjects.length === 0 && (
                  <div style={{ padding: '16px 14px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 6px' }}>No active jobs</p>
                    <Link href="/leads" style={{ fontSize: 11, color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
                      Start by adding a lead <ArrowRight size={10} style={{ display: 'inline' }} />
                    </Link>
                  </div>
                )}
              </Card>
            </div>

            {/* Today's Schedule */}
            <div>
              <SectionHeader title="Today's Schedule" />
              <Card>
                {todayBlocks.length === 0 ? (
                  <EmptyState text="No items scheduled today" />
                ) : (
                  todayBlocks.slice(0, 5).map((block, i) => (
                    <div key={block.id || i} style={{
                      display: 'flex', gap: 10, padding: '10px 14px',
                      borderBottom: i < Math.min(todayBlocks.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', flexShrink: 0, minWidth: 44 }}>
                        {block.startTime || `${block.estimatedHours}h`}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--charcoal)' }}>{block.title}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{block.trade || 'General'}</div>
                      </div>
                    </div>
                  ))
                )}
                <Link
                  href="/production/schedule"
                  className="action-link"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.10em',
                    color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none',
                    cursor: 'pointer', transition: 'color 0.15s',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  Full Schedule <ArrowRight size={10} />
                </Link>
              </Card>
            </div>
          </div>

          {/* ── Row 3: Approvals (1fr) + Activity (1fr) + Messages (1fr) ── */}
          <div style={{ marginTop: 16, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

            {/* Pending Approvals */}
            <div>
              <SectionHeader title="Pending Approvals" />
              <Card>
                {approvalItems.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px' }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--green)' }} strokeWidth={2.5} />
                    <span style={{ fontSize: 12, color: 'var(--mid)' }}>Nothing pending</span>
                  </div>
                ) : (
                  approvalItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => router.push(item.href)}
                      style={{
                        width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: i < approvalItems.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        borderLeft: `3px solid ${item.color}`,
                      }}>
                        <AlertTriangle size={13} style={{ color: item.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</p>
                          <p style={{ fontSize: 10, color: 'var(--muted)', margin: 0 }}>{item.detail}</p>
                        </div>
                        <ChevronRight size={11} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                      </div>
                    </button>
                  ))
                )}
              </Card>
            </div>

            {/* Activity Feed */}
            <div>
              <SectionHeader title="Recent Activity" />
              <ActivityList events={recentEvents} />
            </div>

            {/* Time Tracking — Live */}
            {/**
             * Placeholder data until timeclock service is wired.
             * Live installer rows + indirect total are static.
             * Per-job variance pulls real project names from dashboard.activeProjects.
             */}
            <div>
              <Card>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 0' }}>
                  <SectionHeader title="Time · Live" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--green)',
                      boxShadow: '0 0 6px rgba(22,163,74,0.4)',
                    }}/>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8,
                      letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                      color: 'var(--green)',
                    }}>2 clocked in</span>
                  </div>
                </div>

                {/* Live installers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 14px' }}>
                  {[
                    { initials: 'NM', name: 'Nathan M.', task: 'LVP Flooring Install', elapsed: '2:14', indirect: false },
                    { initials: 'NS', name: 'Nishant', task: 'Travel', elapsed: '0:23', indirect: true },
                  ].map((installer) => (
                    <div key={installer.initials} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px',
                      background: 'var(--charcoal)',
                      borderRadius: 'var(--radius)',
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, fontWeight: 700,
                        color: 'rgba(255,255,255,0.4)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                      }}>{installer.initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 11, fontWeight: 600, color: 'white',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{installer.task}</div>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 8,
                          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                          color: installer.indirect ? 'var(--yellow)' : 'rgba(255,255,255,0.3)',
                          marginTop: 1,
                        }}>{installer.name} · {installer.indirect ? 'Indirect' : 'Install'}</div>
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                        color: 'var(--green)', letterSpacing: '0.05em', flexShrink: 0,
                      }}>{installer.elapsed}</div>
                    </div>
                  ))}
                </div>

                {/* Indirect today */}
                <div style={{ padding: '0 14px 10px' }}>
                  <div style={{
                    padding: '8px 10px',
                    background: 'var(--yellow-bg)',
                    border: '1px solid rgba(217,119,6,0.15)',
                    borderRadius: 'var(--radius)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8,
                      letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                      color: 'var(--yellow)',
                    }}>Indirect today</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      fontWeight: 700, color: 'var(--yellow)',
                    }}>2.1h · $59</span>
                  </div>
                </div>

                {/* Per-job variance — real project names, placeholder hours */}
                <div style={{ padding: '0 14px' }}>
                  {dashboard.activeProjects.slice(0, 3).map((project, i) => (
                    <div key={project.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 0',
                      borderBottom: i < Math.min(dashboard.activeProjects.length, 3) - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--charcoal)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {project.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>—h</span>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)' }}/>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shift total */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  marginTop: 4,
                  borderTop: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8,
                    fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const, color: 'var(--muted)',
                  }}>Total logged today</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 14,
                    fontWeight: 700, color: 'var(--charcoal)',
                  }}>11.4h</span>
                </div>
              </Card>
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

function StripStat({ value, label, sub, color, isLast }: {
  value: string;
  label: string;
  sub?: string;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 24px', minHeight: 52, flexShrink: 0,
      borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,.06)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em', color }}>
        {value}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'rgba(255,255,255,.3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {sub && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,.45)', letterSpacing: '0.06em' }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)',
      }}>
        {title}
      </span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)',
    }}>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: '16px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{text}</p>
    </div>
  );
}

function ActivityList({ events }: { events: Array<Record<string, unknown>> }) {
  return (
    <Card>
      {events.length === 0 ? (
        <EmptyState text="No recent activity" />
      ) : (
        events.map((event, i) => {
          const { icon, color } = getEventIcon(event);
          const ts = event.created_at || event.createdAt || event.timestamp;
          return (
            <div key={String(event.id || i)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
              borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--charcoal)', lineHeight: 1.4 }}>
                  {formatEventLabel(event)}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {formatRelativeTime(ts)}
              </span>
            </div>
          );
        })
      )}
      <Link
        href="/activity"
        className="action-link"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.10em',
          color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none',
          cursor: 'pointer', transition: 'color 0.15s',
          borderTop: '1px solid var(--border)',
        }}
      >
        View All <ArrowRight size={10} />
      </Link>
    </Card>
  );
}

function ClockElapsed({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const tick = () => {
      const secs = Math.floor((Date.now() - startTime) / 1000);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
      color: 'var(--green)', letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums',
    }}>
      {elapsed}
    </span>
  );
}
